const express = require('express');
const { publicLookupLimiter } = require('../middleware/rateLimitMiddleware');
const PublicController = require('../controllers/PublicController');

const router = express.Router();

router.get('/gid/:gid', publicLookupLimiter, PublicController.getGidCard);

module.exports = router;
