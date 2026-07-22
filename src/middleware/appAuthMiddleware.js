const { ConnectedApp } = require('../models');

/**
 * Authenticates server-to-server requests from ecosystem apps (Veta Wallet,
 * My Token Pay, etc.) using an API key issued from the GENESIS ID admin panel.
 * Apps must send: X-API-Key: <key>
 */
const appAuthMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    const app = await ConnectedApp.findOne({ where: { apiKey, isActive: true } });

    if (!app) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    app.update({ lastUsedAt: new Date() }).catch(() => {});

    req.connectedApp = app;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate app' });
  }
};

module.exports = appAuthMiddleware;
