const { WalletUser, Transaction, sequelize } = require('../models');
const genesisIdClient = require('../services/genesisIdClient');
const JWTService = require('../services/JWTService');

const WELCOME_BONUS_AMOUNT = 1000.0;

function forwardGenesisError(error, res) {
  const status = error.response?.status || 500;
  const message = error.response?.data?.error || 'Could not reach GENESIS ID';
  return res.status(status).json({ error: message });
}

class AuthController {
  // Veta Wallet has no password of its own — this logs the user in against
  // GENESIS ID (server-to-server, so no CORS/browser exposure of that
  // call), confirms verification independently, then issues a Veta Wallet
  // session for our own API.
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      let genesisLogin;
      try {
        genesisLogin = await genesisIdClient.loginWithGenesisId(email, password);
      } catch (err) {
        return forwardGenesisError(err, res);
      }

      const genesisUser = genesisLogin.user;

      // Never trust the login response alone for granting access — confirm
      // independently via the app-to-app status endpoint.
      let status;
      try {
        status = await genesisIdClient.getUserStatus(genesisUser.id);
      } catch (err) {
        return forwardGenesisError(err, res);
      }

      if (!status.exists || !status.verified || !status.gid) {
        return res.status(403).json({ error: 'Your GENESIS ID account is not fully verified yet' });
      }

      await genesisIdClient.registerApp(genesisUser.id).catch(() => {});

      let walletUser = await WalletUser.findOne({ where: { genesisUserId: genesisUser.id } });

      if (!walletUser) {
        walletUser = await sequelize.transaction(async (t) => {
          const created = await WalletUser.create({
            genesisUserId: genesisUser.id,
            gid: status.gid,
            email: status.email,
            fullName: status.fullName,
            balance: WELCOME_BONUS_AMOUNT,
            lastLoginAt: new Date()
          }, { transaction: t });

          await Transaction.create({
            fromWalletUserId: null,
            fromGid: null,
            toWalletUserId: created.id,
            toGid: created.gid,
            amount: WELCOME_BONUS_AMOUNT,
            type: 'welcome_bonus',
            description: 'Welcome bonus',
            status: 'completed'
          }, { transaction: t });

          return created;
        });
      } else {
        await walletUser.update({
          email: status.email,
          fullName: status.fullName,
          lastLoginAt: new Date()
        });
      }

      const token = JWTService.generateSessionToken(walletUser.id, walletUser.gid);

      res.json({
        token,
        walletUser: {
          id: walletUser.id,
          gid: walletUser.gid,
          email: walletUser.email,
          fullName: walletUser.fullName,
          balance: walletUser.balance
        }
      });
    } catch (error) {
      console.error('Veta Wallet login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = new AuthController();
