const { User, LoginToken } = require('../models');
const JWTService = require('../services/JWTService');
const PasswordService = require('../services/PasswordService');

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
        fullName,
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
          role: user.role
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
        attributes: { exclude: ['password'] }
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
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const newAccessToken = JWTService.generateAccessToken(user.id, user.email);

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
}

module.exports = new AuthController();
