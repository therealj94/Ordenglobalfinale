const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimitMiddleware');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').optional().trim(),
  body('phone').optional()
], handleValidationErrors, AuthController.register);

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, AuthController.login);

router.post('/refresh', [
  body('refreshToken').notEmpty()
], handleValidationErrors, AuthController.refresh);

router.post('/exchange-onboarding', authLimiter, [
  body('onboardingToken').notEmpty()
], handleValidationErrors, AuthController.exchangeOnboarding);

router.post('/verification-session', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, AuthController.verificationSession);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail()
], handleValidationErrors, AuthController.forgotPassword);

router.post('/reset-password', authLimiter, [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], handleValidationErrors, AuthController.resetPassword);

router.post('/logout', authMiddleware, AuthController.logout);

router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
