const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const AdminController = require('../controllers/AdminController');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', AdminController.getUsers);

router.get('/users/:userId', AdminController.getUserDetail);

router.delete('/users/:userId', AdminController.deleteUser);

router.get('/verifications', AdminController.getVerifications);

router.get('/verifications/:verificationId', AdminController.getVerificationDetail);

router.get('/manual-reviews', AdminController.getManualReviews);

router.post('/reviews/:caseId/approve', AdminController.approveReviewCase);

router.post('/reviews/:caseId/reject', AdminController.rejectReviewCase);

router.get('/apps', AdminController.getConnectedApps);

router.post('/apps', AdminController.createConnectedApp);

router.delete('/apps/:appId', AdminController.revokeConnectedApp);

router.get('/apps/:appName/users', AdminController.getAppUsers);

router.get('/reports', AdminController.getReports);

router.get('/logs', AdminController.getLogs);

module.exports = router;
