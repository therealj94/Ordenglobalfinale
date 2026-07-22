const { Op } = require('sequelize');
const { WalletUser, Transaction, sequelize } = require('../models');

class WalletController {
  async me(req, res, next) {
    try {
      const walletUser = await WalletUser.findByPk(req.walletUser.walletUserId);
      if (!walletUser) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      res.json({
        id: walletUser.id,
        gid: walletUser.gid,
        email: walletUser.email,
        fullName: walletUser.fullName,
        balance: walletUser.balance
      });
    } catch (error) {
      console.error('Get wallet profile error:', error);
      res.status(500).json({ error: 'Failed to load wallet' });
    }
  }

  async transfer(req, res, next) {
    try {
      const { toGid, amount, description } = req.body;
      const senderId = req.walletUser.walletUserId;

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number' });
      }

      const sender = await WalletUser.findByPk(senderId);
      if (!sender) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (toGid === sender.gid) {
        return res.status(400).json({ error: 'You cannot send credits to yourself' });
      }

      const recipient = await WalletUser.findOne({ where: { gid: toGid } });
      if (!recipient) {
        return res.status(404).json({
          error: 'That GENESIS ID hasn\'t set up Veta Wallet yet. Ask them to log in to Veta Wallet at least once first.'
        });
      }

      if (Number(sender.balance) < numericAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const transaction = await sequelize.transaction(async (t) => {
        await sender.decrement('balance', { by: numericAmount, transaction: t });
        await recipient.increment('balance', { by: numericAmount, transaction: t });

        return Transaction.create({
          fromWalletUserId: sender.id,
          fromGid: sender.gid,
          toWalletUserId: recipient.id,
          toGid: recipient.gid,
          amount: numericAmount,
          type: 'transfer',
          description: description || null,
          status: 'completed'
        }, { transaction: t });
      });

      await sender.reload();

      res.status(201).json({
        message: 'Transfer completed',
        transactionId: transaction.id,
        newBalance: sender.balance
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ error: 'Transfer failed' });
    }
  }

  async transactions(req, res, next) {
    try {
      const walletUserId = req.walletUser.walletUserId;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await Transaction.findAndCountAll({
        where: {
          [Op.or]: [{ fromWalletUserId: walletUserId }, { toWalletUserId: walletUserId }]
        },
        limit: Number(limit),
        offset: Number(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        total: count,
        page: Number(page),
        limit: Number(limit),
        transactions: rows.map((tx) => ({
          id: tx.id,
          direction: tx.toWalletUserId === walletUserId ? 'in' : 'out',
          fromGid: tx.fromGid,
          toGid: tx.toGid,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          status: tx.status,
          createdAt: tx.createdAt
        }))
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to load transactions' });
    }
  }
}

module.exports = new WalletController();
