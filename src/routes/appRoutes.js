const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const AppController = require('../controllers/AppController');

const router = express.Router();

router.post('/user-status', [
  body('userId').isUUID(),
  body('appName').notEmpty()
], handleValidationErrors, AppController.userStatus);

router.post('/register-app', [
  body('userId').isUUID(),
  body('appName').notEmpty()
], handleValidationErrors, AppController.registerApp);

router.post('/token-validate', AppController.tokenValidate);

router.get('/users/:appName', authMiddleware, AppController.getAppUsers);

module.exports = router;
