const { User, Verification, AppRegistration, AdminLog, sequelize } = require('../models');
const { Op } = require('sequelize');

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
        FROM verifications
        WHERE created_at >= NOW() - INTERVAL 30 DAY
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
          verificationRate: ((verifiedUsers / totalUsers) * 100).toFixed(2) + '%'
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
