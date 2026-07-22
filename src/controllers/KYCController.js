const { v4: uuidv4 } = require('uuid');
const { User, Verification } = require('../models');
const { checkSubmissionQuality } = require('../services/ImageQualityService');
const {
  DECISION_DELAY_MS,
  scheduleDecision,
  applyDecision
} = require('../services/VerificationDecisionService');

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // ~8MB base64 payload guard per image
const MAX_ATTEMPTS_BEFORE_FORCED_MANUAL = 3;

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

      // Every submission attempt counts, pass or fail — this is what drives
      // the "force to manual review after 3 attempts" fallback below.
      const attemptNumber = user.kycAttemptCount + 1;
      await user.update({ kycAttemptCount: attemptNumber });

      // Automatic QUALITY gate only (resolution / brightness / blank-image
      // detection) — NOT a document authenticity or face-match check. See
      // VERIFICATION_ENGINE.md for the full disclosure on what this does
      // and doesn't verify.
      const quality = await checkSubmissionQuality({ documentFrontImage, documentBackImage, selfieImages });
      const attemptsExhausted = attemptNumber >= MAX_ATTEMPTS_BEFORE_FORCED_MANUAL;

      if (!quality.pass && !attemptsExhausted) {
        return res.status(400).json({
          error: 'Some of your photos did not pass our quality check. Please retry.',
          details: quality.failures,
          attemptNumber,
          attemptsRemaining: MAX_ATTEMPTS_BEFORE_FORCED_MANUAL - attemptNumber
        });
      }

      // PEP cases always require a human's enhanced due diligence review —
      // never auto-approved regardless of image quality.
      const autoApprove = quality.pass && !isPEP;
      const decisionAt = new Date(Date.now() + DECISION_DELAY_MS);

      // The verification doesn't resolve instantly — it sits as
      // "processing" for a bit (VerificationDecisionService applies the
      // real outcome after DECISION_DELAY_MS) so the user sees a realistic
      // "we're verifying you" wait instead of an instant answer, and so a
      // manual-review case can honestly say "this may take up to 24 hours".
      const verification = await Verification.create({
        userId: user.id,
        sessionId: uuidv4(),
        status: 'processing',
        documentType,
        documentCountry: documentCountry || null,
        documentFrontImage,
        documentBackImage: requiresBack ? documentBackImage : null,
        selfieImages,
        livenessResult: livenessResult || null,
        sourceOfFunds,
        isPEP,
        pepDetails: isPEP ? pepDetails : null,
        reviewMode: autoApprove ? 'automatic' : 'manual',
        decisionAt,
        rawData: {
          pendingDecision: {
            autoApprove,
            reason: isPEP
              ? 'PEP declared — requires enhanced due diligence'
              : `Automatic quality checks failed after ${attemptNumber} attempts — needs manual review`
          },
          qualityFailures: quality.failures,
          attemptNumber
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      scheduleDecision(verification.id);

      res.status(201).json({
        message: autoApprove
          ? 'We are verifying your identity. This usually takes a few minutes.'
          : 'We are verifying your identity. If additional review is needed, it can take up to 24 hours. We will email you either way.',
        verificationId: verification.id,
        status: 'processing'
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

      // If the 1-minute wait already elapsed but the in-process timer
      // hasn't fired yet (e.g. the server restarted), resolve it now
      // instead of making the user wait for the next sweep.
      if (
        verification.status === 'processing' &&
        verification.decisionAt &&
        verification.decisionAt <= new Date()
      ) {
        await applyDecision(verification.id);
        await verification.reload();
      }

      const user = await User.findByPk(userId, { attributes: ['gid'] });

      res.json({
        verificationId: verification.id,
        status: verification.status,
        reviewMode: verification.reviewMode,
        verifiedAt: verification.verifiedAt,
        rejectionReason: verification.rejectionReason,
        gid: user?.gid || null
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      res.status(500).json({ error: 'Failed to get KYC status' });
    }
  }
}

module.exports = new KYCController();
