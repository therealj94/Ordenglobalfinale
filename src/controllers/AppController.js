const { User, AppRegistration, LoginToken } = require('../models');
const JWTService = require('../services/JWTService');

class AppController {
  async userStatus(req, res, next) {
    try {
      const { userId, gid, appName } = req.body;

      if (!userId && !gid) {
        return res.status(400).json({ error: 'userId or gid is required' });
      }

      const user = userId ? await User.findByPk(userId) : await User.findOne({ where: { gid } });
      if (!user) {
        return res.status(404).json({
          exists: false,
          verified: false
        });
      }

      const appReg = await AppRegistration.findOne({
        where: { userId: user.id, appName }
      });

      res.json({
        exists: true,
        verified: user.status === 'verified',
        userStatus: user.status,
        isLinked: !!appReg,
        userId: user.id,
        gid: user.gid,
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

  /**
   * Lets a signed-in user link the account identifier the app knows them by
   * (Veta Wallet's wallet address, My Token Pay's merchant id, …) to their
   * GENESIS ID, and links the app itself in the same step.
   *
   * Authenticated as the user rather than with an app API key on purpose: a
   * mobile app can't ship a secret key, and the address belongs to the user's
   * own account anyway. userId comes from the token — never the body — so one
   * user can't write an address onto someone else's identity.
   */
  async linkMyAddress(req, res, next) {
    try {
      const { userId } = req.user;
      const { appName, address } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status !== 'verified') {
        return res.status(403).json({ error: 'User not verified' });
      }

      const [appReg] = await AppRegistration.findOrCreate({
        where: { userId, appName },
        defaults: { userId, appName, linkedAt: new Date() }
      });

      await appReg.update({ address, lastActivityAt: new Date() });

      res.json({
        message: 'Address linked to your GENESIS ID',
        appName: appReg.appName,
        address: appReg.address,
        gid: user.gid
      });
    } catch (error) {
      console.error('Link address error:', error);
      res.status(500).json({ error: 'Failed to link address' });
    }
  }

  /** The apps this user is linked to, with the address each one knows them by. */
  async myApps(req, res, next) {
    try {
      const registrations = await AppRegistration.findAll({
        where: { userId: req.user.userId },
        attributes: ['appName', 'address', 'linkedAt', 'lastActivityAt'],
        order: [['linkedAt', 'ASC']]
      });
      res.json({ apps: registrations });
    } catch (error) {
      console.error('My apps error:', error);
      res.status(500).json({ error: 'Failed to load linked apps' });
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

}

module.exports = new AppController();
