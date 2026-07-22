const express = require('express');
const { body, validationResult } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, AuthController.login);

module.exports = router;
