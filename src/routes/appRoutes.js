const express = require('express');
const { body } = require('express-validator');
const appAuthMiddleware = require('../middleware/appAuthMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const AppController = require('../controllers/AppController');

const router = express.Router();

// All ecosystem-app-to-GENESIS-ID calls require a valid X-API-Key
router.use(appAuthMiddleware);

router.post('/user-status', [
  body('userId').optional().isUUID(),
  body('gid').optional().isString(),
  body('appName').notEmpty()
], handleValidationErrors, AppController.userStatus);

router.post('/register-app', [
  body('userId').isUUID(),
  body('appName').notEmpty()
], handleValidationErrors, AppController.registerApp);

router.post('/token-validate', AppController.tokenValidate);

module.exports = router;
