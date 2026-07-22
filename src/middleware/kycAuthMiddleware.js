const jwt = require('jsonwebtoken');
const JWTService = require('../services/JWTService');

/**
 * Authorizes KYC submission/status endpoints. Accepts either:
 *  - a normal access token (an already-logged-in user re-verifying), or
 *  - a short-lived onboarding token (issued at registration, before the
 *    user has completed verification and therefore has no full session yet)
 *
 * Either way, the token's userId must match the userId being acted on.
 */
const kycAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = JWTService.verifyAccessToken(token);
  } catch (accessErr) {
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.scope !== 'onboarding') {
        throw new Error('Not an onboarding token');
      }
    } catch (onboardingErr) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  const targetUserId = req.body.userId || req.params.userId;
  if (targetUserId && decoded.userId !== targetUserId) {
    return res.status(403).json({ error: 'Token does not authorize this userId' });
  }

  req.kycUser = decoded;
  next();
};

module.exports = kycAuthMiddleware;
