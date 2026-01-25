const express = require('express');
const router = express.Router();
const { protect, isSeller } = require('../middlewares/auth');

const {
    getProfile,
    updateProfile,
    getSellerProfile,
    getFavorites,
    deactivateAccount,
    getDashboardStats
} = require('../controllers/userController');

// Public routes
router.get('/seller/:id', getSellerProfile);

// Protected routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/favorites', getFavorites);
router.put('/deactivate', deactivateAccount);

// Seller only routes
router.get('/dashboard/stats', isSeller, getDashboardStats);

module.exports = router;
