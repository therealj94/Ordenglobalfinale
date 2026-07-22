const express = require('express');
const { body } = require('express-validator');
const kycAuthMiddleware = require('../middleware/kycAuthMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const KYCController = require('../controllers/KYCController');

const router = express.Router();

router.post('/submit', [
  body('userId').isUUID(),
  body('documentType').isIn(['PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE'])
], handleValidationErrors, kycAuthMiddleware, KYCController.submitKYC);

router.get('/status/:userId', kycAuthMiddleware, KYCController.getKYCStatus);

router.post('/id-card-photo', [
  body('userId').isUUID(),
  body('photo').isString().notEmpty()
], handleValidationErrors, kycAuthMiddleware, KYCController.uploadIdCardPhoto);

module.exports = router;
