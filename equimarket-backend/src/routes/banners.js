const express = require('express');
const router = express.Router();
const { getActiveBanners } = require('../controllers/bannerController');

// Public endpoint - auth gerektirmez
router.get('/', getActiveBanners);

module.exports = router;
