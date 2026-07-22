const { User, Verification, AppRegistration, AdminLog, ManualReviewCase, ConnectedApp, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const EmailService = require('../services/EmailService');

function generateApiKey() {
  return `gid_live_${crypto.randomBytes(24).toString('hex')}`;
}

class AdminController {
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = { isActive: true };
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { fullName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        include: [{
          model: Verification,
          attributes: ['status', 'verifiedAt'],
          limit: 1,
          separate: true,
          order: [['createdAt', 'DESC']]
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        total: count,
        page,
        limit,
        users: rows
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  async getUserDetail(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Verification,
            order: [['createdAt', 'DESC']]
          },
          {
            model: AppRegistration,
            attributes: ['appName', 'linkedAt']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user detail error:', error);
      res.status(500).json({ error: 'Failed to get user details' });
    }
  }

  async getVerifications(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;

      const { count, rows } = await Verification.findAndCountAll({
        where,
        include: [{
          model: User,
          attributes: ['email', 'fullName', 'createdAt']
        }],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        total: count,
        page,
        limit,
        verifications: rows
      });
    } catch (error) {
      console.error('Get verifications error:', error);
      res.status(500).json({ error: 'Failed to get verifications' });
    }
  }

  async getVerificationDetail(req, res, next) {
    try {
      const { verificationId } = req.params;

      const verification = await Verification.findByPk(verificationId, {
        include: [{
          model: User,
          attributes: ['id', 'email', 'fullName', 'phone', 'status', 'createdAt']
        }]
      });

      if (!verification) {
        return res.status(404).json({ error: 'Verification not found' });
      }

      res.json(verification);
    } catch (error) {
      console.error('Get verification detail error:', error);
      res.status(500).json({ error: 'Failed to get verification details' });
    }
  }

  async getManualReviews(req, res, next) {
    try {
      const { status = 'pending', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await ManualReviewCase.findAndCountAll({
        where: { status },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'fullName', 'phone', 'status', 'createdAt']
          },
          {
            model: Verification,
            as: 'verification'
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'ASC']]
      });

      res.json({
        total: count,
        page,
        limit,
        cases: rows
      });
    } catch (error) {
      console.error('Get manual reviews error:', error);
      res.status(500).json({ error: 'Failed to get manual review cases' });
    }
  }

  async approveReviewCase(req, res, next) {
    try {
      const { caseId } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.userId;

      const reviewCase = await ManualReviewCase.findByPk(caseId, {
        include: [
          { model: Verification, as: 'verification' },
          { model: User, as: 'user' }
        ]
      });

      if (!reviewCase) {
        return res.status(404).json({ error: 'Review case not found' });
      }

      await reviewCase.update({
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes || null
      });

      await Verification.update(
        { status: 'approved', verifiedAt: new Date() },
        { where: { id: reviewCase.verificationId } }
      );

      await User.update(
        { status: 'verified' },
        { where: { id: reviewCase.userId } }
      );

      await AdminLog.create({
        adminId,
        action: 'APPROVE_VERIFICATION',
        userId: reviewCase.userId,
        description: `Manual review case ${caseId} approved`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { caseId, notes }
      });

      if (reviewCase.user) {
        EmailService.sendVerificationApproved(reviewCase.user).catch(() => {});
      }

      res.json({ message: 'Verification approved', caseId });
    } catch (error) {
      console.error('Approve review error:', error);
      res.status(500).json({ error: 'Failed to approve verification' });
    }
  }

  async rejectReviewCase(req, res, next) {
    try {
      const { caseId } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.userId;

      const reviewCase = await ManualReviewCase.findByPk(caseId, {
        include: [
          { model: Verification, as: 'verification' },
          { model: User, as: 'user' }
        ]
      });

      if (!reviewCase) {
        return res.status(404).json({ error: 'Review case not found' });
      }

      await reviewCase.update({
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes || null
      });

      await Verification.update(
        { status: 'rejected', rejectionReason: notes || 'Rejected on manual review' },
        { where: { id: reviewCase.verificationId } }
      );

      await User.update(
        { status: 'rejected' },
        { where: { id: reviewCase.userId } }
      );

      await AdminLog.create({
        adminId,
        action: 'REJECT_VERIFICATION',
        userId: reviewCase.userId,
        description: `Manual review case ${caseId} rejected`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { caseId, notes }
      });

      if (reviewCase.user) {
        EmailService.sendVerificationRejected(reviewCase.user, notes).catch(() => {});
      }

      res.json({ message: 'Verification rejected', caseId });
    } catch (error) {
      console.error('Reject review error:', error);
      res.status(500).json({ error: 'Failed to reject verification' });
    }
  }

  async getReports(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [userStats, verificationStats, appStats] = await Promise.all([
        User.count({ where: { createdAt: { [Op.gte]: today } } }),
        Verification.count({
          where: {
            status: 'approved',
            verifiedAt: { [Op.gte]: today }
          }
        }),
        AppRegistration.count({
          where: { linkedAt: { [Op.gte]: today } }
        })
      ]);

      const totalUsers = await User.count();
      const verifiedUsers = await User.count({ where: { status: 'verified' } });
      const pendingUsers = await User.count({ where: { status: 'pending' } });

      const verificationTrend = await sequelize.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count, status
        FROM "Verifications"
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), status
        ORDER BY date DESC
      `, { type: sequelize.QueryTypes.SELECT });

      res.json({
        today: {
          newUsers: userStats,
          verifications: verificationStats,
          appLinked: appStats
        },
        overall: {
          totalUsers,
          verifiedUsers,
          pendingUsers,
          verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%' : '0%'
        },
        trend: verificationTrend
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const adminId = req.user?.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.update({ isActive: false });

      await AdminLog.create({
        adminId,
        action: 'DELETE_USER',
        userId,
        description: `User ${user.email} soft deleted`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        message: 'User deleted successfully',
        userId
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async getConnectedApps(req, res, next) {
    try {
      const apps = await ConnectedApp.findAll({
        order: [['createdAt', 'DESC']]
      });

      // Attach linked-user counts per app
      const counts = await AppRegistration.findAll({
        attributes: ['appName', [sequelize.fn('COUNT', sequelize.col('id')), 'userCount']],
        group: ['appName']
      });
      const countMap = Object.fromEntries(counts.map((c) => [c.appName, Number(c.get('userCount'))]));

      res.json({
        apps: apps.map((app) => ({
          ...app.toJSON(),
          linkedUsers: countMap[app.appName] || 0
        }))
      });
    } catch (error) {
      console.error('Get connected apps error:', error);
      res.status(500).json({ error: 'Failed to get connected apps' });
    }
  }

  async createConnectedApp(req, res, next) {
    try {
      const { appName, redirectUrls } = req.body;
      const adminId = req.user?.userId;

      if (!appName) {
        return res.status(400).json({ error: 'appName is required' });
      }

      const existing = await ConnectedApp.findOne({ where: { appName } });
      if (existing) {
        return res.status(409).json({ error: 'An app with this name is already registered' });
      }

      const apiKey = generateApiKey();

      const app = await ConnectedApp.create({
        appName,
        apiKey,
        redirectUrls: redirectUrls || [],
        createdBy: adminId
      });

      await AdminLog.create({
        adminId,
        action: 'CREATE_CONNECTED_APP',
        description: `Created connected app "${appName}"`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.status(201).json({
        message: 'App connected successfully. Store this API key securely — it will not be shown again in full.',
        app
      });
    } catch (error) {
      console.error('Create connected app error:', error);
      res.status(500).json({ error: 'Failed to create connected app' });
    }
  }

  async revokeConnectedApp(req, res, next) {
    try {
      const { appId } = req.params;
      const adminId = req.user?.userId;

      const app = await ConnectedApp.findByPk(appId);
      if (!app) {
        return res.status(404).json({ error: 'Connected app not found' });
      }

      await app.update({ isActive: false });

      await AdminLog.create({
        adminId,
        action: 'REVOKE_CONNECTED_APP',
        description: `Revoked API key for app "${app.appName}"`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({ message: 'App API key revoked' });
    } catch (error) {
      console.error('Revoke connected app error:', error);
      res.status(500).json({ error: 'Failed to revoke connected app' });
    }
  }

  async getAppUsers(req, res, next) {
    try {
      const { appName } = req.params;
      const { page = 1, limit = 100 } = req.query;

      const appRegistrations = await AppRegistration.findAll({
        where: { appName },
        include: [{
          model: User,
          attributes: ['id', 'email', 'fullName', 'status', 'createdAt']
        }],
        limit,
        offset: (page - 1) * limit
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

  async getLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const { count, rows } = await AdminLog.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        total: count,
        page,
        limit,
        logs: rows
      });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: 'Failed to get logs' });
    }
  }
}

module.exports = new AdminController();
