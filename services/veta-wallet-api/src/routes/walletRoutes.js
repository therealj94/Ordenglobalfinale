const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const WalletController = require('../controllers/WalletController');

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

router.get('/me', authMiddleware, WalletController.me);

router.post('/transfer', authMiddleware, [
  body('toGid').isString().notEmpty(),
  body('amount').isFloat({ gt: 0 }),
  body('description').optional().isString()
], handleValidationErrors, WalletController.transfer);

router.get('/transactions', authMiddleware, WalletController.transactions);

module.exports = router;
