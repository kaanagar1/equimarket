const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth');

const {
    register,
    login,
    getMe,
    logout,
    updatePassword
} = require('../controllers/authController');

// Validation kuralları
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('İsim gereklidir')
        .isLength({ max: 100 }).withMessage('İsim 100 karakterden uzun olamaz'),
    body('email')
        .trim()
        .notEmpty().withMessage('E-posta gereklidir')
        .isEmail().withMessage('Geçerli bir e-posta girin')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Şifre gereklidir')
        .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Telefon numarası 20 karakterden uzun olamaz'),
    body('role')
        .optional()
        .isIn(['buyer', 'seller']).withMessage('Geçersiz rol')
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('E-posta gereklidir')
        .isEmail().withMessage('Geçerli bir e-posta girin'),
    body('password')
        .notEmpty().withMessage('Şifre gereklidir')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/password', protect, updatePassword);

module.exports = router;
