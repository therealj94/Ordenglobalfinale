const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const AdminController = require('../controllers/AdminController');

const router = express.Router();

router.use(authMiddleware);

router.get('/users', AdminController.getUsers);

router.get('/users/:userId', AdminController.getUserDetail);

router.delete('/users/:userId', AdminController.deleteUser);

router.get('/verifications', AdminController.getVerifications);

router.get('/reports', AdminController.getReports);

router.get('/logs', AdminController.getLogs);

module.exports = router;
