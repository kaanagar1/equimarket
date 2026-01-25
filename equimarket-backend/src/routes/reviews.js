const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
    getSellerReviews,
    createReview,
    updateReview,
    deleteReview,
    addSellerResponse,
    markHelpful,
    getMyReviews,
    getReceivedReviews
} = require('../controllers/reviewController');

// Public routes
router.get('/seller/:sellerId', getSellerReviews);

// Protected routes
router.use(protect);

router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/response', addSellerResponse);
router.post('/:id/helpful', markHelpful);
router.get('/my-reviews', getMyReviews);
router.get('/received', getReceivedReviews);

module.exports = router;
