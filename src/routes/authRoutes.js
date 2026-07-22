const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').optional().trim(),
  body('phone').optional()
], handleValidationErrors, AuthController.register);

router.post('/verify-init', [
  body('userId').isUUID()
], handleValidationErrors, AuthController.verifyInit);

router.post('/verify-callback', AuthController.verifyCallback);

router.get('/verify-status/:sessionId', AuthController.verifyStatus);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, AuthController.login);

router.post('/refresh', [
  body('refreshToken').notEmpty()
], handleValidationErrors, AuthController.refresh);

router.post('/logout', authMiddleware, AuthController.logout);

router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
