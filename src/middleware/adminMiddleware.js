const { User } = require('../models');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user?.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

module.exports = adminMiddleware;
