const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { contactLimiter, reportLimiter } = require('../middlewares/rateLimit');
const {
    sendContactMessage,
    sendReport
} = require('../controllers/supportController');

// Public routes (rate limiting ile)
router.post('/contact', contactLimiter, sendContactMessage);
router.post('/report', reportLimiter, sendReport);

// Opsiyonel auth ile report (giriş yapmış kullanıcı bilgisi alınır)
router.post('/report-auth', reportLimiter, protect, sendReport);

module.exports = router;
