const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getAllFeedback,
    updateFeedback,
    deleteFeedback,
    getFeedbackStats
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middlewares/auth');

// Kullanıcı route'ları
router.post('/', protect, createFeedback);

// Admin route'ları
router.get('/', protect, authorize('admin'), getAllFeedback);
router.get('/stats', protect, authorize('admin'), getFeedbackStats);
router.put('/:id', protect, authorize('admin'), updateFeedback);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;
