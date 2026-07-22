const crypto = require('crypto');
const { User, LoginToken } = require('../models');
const JWTService = require('../services/JWTService');
const PasswordService = require('../services/PasswordService');
const EmailService = require('../services/EmailService');
const { toTitleCase } = require('../utils/textUtils');

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;

      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = await PasswordService.hashPassword(password);

      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: fullName ? toTitleCase(fullName) : fullName,
        phone,
        status: 'pending'
      });

      const onboardingToken = JWTService.generateOnboardingToken(user.id);

      res.status(201).json({
        message: 'User registered successfully',
        userId: user.id,
        email: user.email,
        onboardingToken
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatch = await PasswordService.comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated. Contact support.' });
      }

      if (user.status !== 'verified') {
        return res.status(403).json({ error: 'User not verified. Complete identity verification first.' });
      }

      const accessToken = JWTService.generateAccessToken(user.id, user.email);
      const refreshToken = JWTService.generateRefreshToken(user.id);

      await LoginToken.create({
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await user.update({ lastLogin: new Date() });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          role: user.role,
          gid: user.gid
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async me(req, res, next) {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // The refresh token must still correspond to a live (non-revoked)
      // session — otherwise a logged-out token could mint new access tokens.
      const session = await LoginToken.findOne({ where: { refreshToken } });
      if (!session || session.revokedAt) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }

      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or deactivated' });
      }

      const newAccessToken = JWTService.generateAccessToken(user.id, user.email);
      await session.update({ token: newAccessToken });

      res.json({
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(401).json({ error: 'Failed to refresh token' });
    }
  }

  async logout(req, res, next) {
    try {
      const { userId } = req.user;
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        await LoginToken.update(
          { revokedAt: new Date() },
          { where: { token } }
        );
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async forgotPassword(req, res, next) {
    // Always respond the same way whether or not the email exists — this
    // prevents attackers from using the endpoint to discover which emails
    // are registered.
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been sent.'
    };

    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email: email.toLowerCase() } });

      if (user && user.isActive) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        await user.update({
          passwordResetToken: hashResetToken(rawToken),
          passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS)
        });

        const base = process.env.FRONTEND_URL || 'http://localhost:3001';
        const resetUrl = `${base}/auth/reset-password?token=${rawToken}`;
        EmailService.sendPasswordReset(user, resetUrl).catch(() => {});
      }

      res.json(genericResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still return the generic message so failures don't leak information.
      res.json(genericResponse);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        where: { passwordResetToken: hashResetToken(token) }
      });

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
      }

      const hashedPassword = await PasswordService.hashPassword(password);
      await user.update({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      // Revoke all existing sessions so a leaked old token can't outlive the
      // password change.
      await LoginToken.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
      );

      res.json({ message: 'Your password has been reset. You can now log in.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
}

module.exports = new AuthController();
