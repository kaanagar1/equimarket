const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    sendContactMessage,
    sendReport
} = require('../controllers/supportController');

// Public routes
router.post('/contact', sendContactMessage);
router.post('/report', sendReport);

// Opsiyonel auth ile report (giriş yapmış kullanıcı bilgisi alınır)
router.post('/report-auth', protect, sendReport);

module.exports = router;
