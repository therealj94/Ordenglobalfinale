const express = require('express');
const { body } = require('express-validator');
const appAuthMiddleware = require('../middleware/appAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const AppController = require('../controllers/AppController');

const router = express.Router();

// User-authenticated routes — these act on the caller's own identity, so they
// use the user's session rather than an app API key (a mobile app can't ship
// a secret key). Declared before the API-key gate below.
router.post('/my-address', authMiddleware, [
  body('appName').trim().notEmpty(),
  body('address').trim().notEmpty()
], handleValidationErrors, AppController.linkMyAddress);

router.get('/my-apps', authMiddleware, AppController.myApps);

// Everything below is ecosystem-app-to-GENESIS-ID and requires a valid X-API-Key
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
