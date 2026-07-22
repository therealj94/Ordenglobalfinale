const jwt = require('jsonwebtoken');

// Veta Wallet's own session token — separate from GENESIS ID's. It's what
// authenticates calls to Veta Wallet's own API after GENESIS ID has
// confirmed who the user is.
class JWTService {
  generateSessionToken(walletUserId, gid) {
    return jwt.sign(
      { walletUserId, gid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  verifySessionToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired session token');
    }
  }
}

module.exports = new JWTService();
