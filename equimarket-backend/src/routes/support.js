const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { contactLimiter, reportLimiter } = require('../middlewares/rateLimit');
const { botProtection } = require('../middlewares/botProtection');
const {
    sendContactMessage,
    sendReport
} = require('../controllers/supportController');

// Public routes (rate limiting ve bot protection ile)
router.post('/contact', contactLimiter, botProtection({ checkTiming: true }), sendContactMessage);
router.post('/report', reportLimiter, botProtection(), sendReport);

// Opsiyonel auth ile report (giriş yapmış kullanıcı bilgisi alınır)
router.post('/report-auth', reportLimiter, protect, sendReport);

module.exports = router;
