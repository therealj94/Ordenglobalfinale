const { v4: uuidv4 } = require('uuid');
const { User, Verification, ManualReviewCase } = require('../models');

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // ~8MB base64 payload guard per image

const VALID_SOURCE_OF_FUNDS = [
  'salary',
  'savings',
  'business_income',
  'investments',
  'inheritance',
  'other'
];

function isValidImage(image) {
  return typeof image === 'string' && image.startsWith('data:image/') && image.length < MAX_IMAGE_SIZE;
}

class KYCController {
  async submitKYC(req, res, next) {
    try {
      const {
        userId,
        documentType,
        documentCountry,
        documentFrontImage,
        documentBackImage,
        selfieImages,
        livenessResult,
        amlInfo
      } = req.body;

      if (!userId || !documentType) {
        return res.status(400).json({ error: 'userId and documentType are required' });
      }

      if (!['PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE'].includes(documentType)) {
        return res.status(400).json({ error: 'Invalid documentType' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!isValidImage(documentFrontImage)) {
        return res.status(400).json({ error: 'A valid document front image is required' });
      }

      const requiresBack = documentType === 'ID_CARD' || documentType === 'DRIVERS_LICENSE';
      if (requiresBack && !isValidImage(documentBackImage)) {
        return res.status(400).json({ error: 'Back image is required for ID cards and driver licenses' });
      }

      if (!Array.isArray(selfieImages) || selfieImages.length < 3) {
        return res.status(400).json({ error: 'At least 3 selfie angles are required for liveness verification' });
      }

      for (const img of selfieImages) {
        if (!isValidImage(img)) {
          return res.status(400).json({ error: 'One or more selfie images are invalid' });
        }
      }

      // AML / KYC compliance declaration — required for any app that moves money
      if (!amlInfo || typeof amlInfo !== 'object') {
        return res.status(400).json({ error: 'amlInfo is required' });
      }

      const { dateOfBirth, nationality, countryOfResidence, occupation, sourceOfFunds, isPEP, pepDetails } = amlInfo;

      if (!dateOfBirth || !nationality || !countryOfResidence || !occupation) {
        return res.status(400).json({
          error: 'dateOfBirth, nationality, countryOfResidence and occupation are required'
        });
      }

      if (!VALID_SOURCE_OF_FUNDS.includes(sourceOfFunds)) {
        return res.status(400).json({ error: 'Invalid sourceOfFunds' });
      }

      if (typeof isPEP !== 'boolean') {
        return res.status(400).json({ error: 'isPEP must be true or false' });
      }

      if (isPEP && !pepDetails) {
        return res.status(400).json({ error: 'pepDetails is required when isPEP is true' });
      }

      const dob = new Date(dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(dob.getTime()) || age < 18) {
        return res.status(400).json({ error: 'User must be at least 18 years old' });
      }

      await user.update({
        dateOfBirth,
        nationality,
        countryOfResidence,
        occupation
      });

      const verification = await Verification.create({
        userId: user.id,
        sessionId: uuidv4(),
        status: 'pending',
        documentType,
        documentCountry: documentCountry || null,
        documentFrontImage,
        documentBackImage: requiresBack ? documentBackImage : null,
        selfieImages,
        livenessResult: livenessResult || null,
        sourceOfFunds,
        isPEP,
        pepDetails: isPEP ? pepDetails : null,
        reviewMode: 'manual',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await ManualReviewCase.create({
        verificationId: verification.id,
        userId: user.id,
        reason: isPEP
          ? 'New KYC submission pending manual review (PEP declared — requires enhanced due diligence)'
          : 'New KYC submission pending manual review',
        status: 'pending'
      });

      res.status(201).json({
        message: 'KYC submitted successfully, pending review',
        verificationId: verification.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Submit KYC error:', error);
      res.status(500).json({ error: 'Failed to submit KYC data' });
    }
  }

  async getKYCStatus(req, res, next) {
    try {
      const { userId } = req.params;

      const verification = await Verification.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['documentFrontImage', 'documentBackImage', 'selfieImages'] }
      });

      if (!verification) {
        return res.status(404).json({ status: 'not_found' });
      }

      res.json({
        verificationId: verification.id,
        status: verification.status,
        reviewMode: verification.reviewMode,
        verifiedAt: verification.verifiedAt,
        rejectionReason: verification.rejectionReason
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      res.status(500).json({ error: 'Failed to get KYC status' });
    }
  }
}

module.exports = new KYCController();
