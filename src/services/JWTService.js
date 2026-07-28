const jwt = require('jsonwebtoken');

class JWTService {
  generateAccessToken(userId, email) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Short-lived token issued right after registration, before the user has
   * a full session. Only authorizes completing the KYC flow for that one
   * userId — nothing else.
   */
  generateOnboardingToken(userId) {
    return jwt.sign(
      { userId, scope: 'onboarding' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
  }

  verifyAccessToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
    // Onboarding tokens are signed with the same secret, so they'd otherwise
    // sail through here and authorize any protected route — they must only
    // ever authorize the KYC endpoints (see kycAuthMiddleware) and the
    // exchange that turns them into a real session once verified.
    if (decoded.scope === 'onboarding') {
      throw new Error('Onboarding token cannot be used as an access token');
    }
    return decoded;
  }

  verifyOnboardingToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired onboarding token');
    }
    if (decoded.scope !== 'onboarding') {
      throw new Error('Not an onboarding token');
    }
    return decoded;
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JWTService();
