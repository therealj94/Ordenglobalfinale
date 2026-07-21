const { User, AppRegistration, LoginToken } = require('../models');
const JWTService = require('../services/JWTService');

class AppController {
  async userStatus(req, res, next) {
    try {
      const { userId, appName } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          exists: false,
          verified: false
        });
      }

      const appReg = await AppRegistration.findOne({
        where: { userId, appName }
      });

      res.json({
        exists: true,
        verified: user.status === 'verified',
        userStatus: user.status,
        isLinked: !!appReg,
        email: user.email,
        fullName: user.fullName
      });
    } catch (error) {
      console.error('User status error:', error);
      res.status(500).json({ error: 'Failed to check user status' });
    }
  }

  async registerApp(req, res, next) {
    try {
      const { userId, appName } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status !== 'verified') {
        return res.status(403).json({ error: 'User not verified' });
      }

      const existingReg = await AppRegistration.findOne({
        where: { userId, appName }
      });

      if (existingReg) {
        return res.status(200).json({
          message: 'App already registered',
          appRegistration: existingReg
        });
      }

      const appReg = await AppRegistration.create({
        userId,
        appName,
        linkedAt: new Date()
      });

      res.status(201).json({
        message: 'App registered successfully',
        appRegistration: appReg
      });
    } catch (error) {
      console.error('Register app error:', error);
      res.status(500).json({ error: 'Failed to register app' });
    }
  }

  async tokenValidate(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ valid: false, error: 'No token provided' });
      }

      const decoded = JWTService.verifyAccessToken(token);

      const loginToken = await LoginToken.findOne({
        where: { token, userId: decoded.userId, revokedAt: null }
      });

      if (!loginToken) {
        return res.status(401).json({ valid: false, error: 'Token revoked or not found' });
      }

      res.json({
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  }

  async getAppUsers(req, res, next) {
    try {
      const { appName } = req.params;

      const appRegistrations = await AppRegistration.findAll({
        where: { appName },
        include: [{
          model: User,
          attributes: ['id', 'email', 'fullName', 'status', 'createdAt']
        }],
        limit: 100,
        offset: (req.query.page - 1) * 100 || 0
      });

      res.json({
        appName,
        users: appRegistrations,
        count: appRegistrations.length
      });
    } catch (error) {
      console.error('Get app users error:', error);
      res.status(500).json({ error: 'Failed to get app users' });
    }
  }
}

module.exports = new AppController();
