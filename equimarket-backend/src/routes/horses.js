const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, isSeller } = require('../middlewares/auth');

const {
    getHorses,
    getHorse,
    createHorse,
    updateHorse,
    deleteHorse,
    getMyListings,
    toggleFavorite,
    renewListing,
    markAsSold
} = require('../controllers/horseController');

// Validation kuralları
const horseValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('At adı gereklidir')
        .isLength({ max: 100 }).withMessage('At adı 100 karakterden uzun olamaz'),
    body('breed')
        .notEmpty().withMessage('Irk bilgisi gereklidir')
        .isIn(['ingiliz', 'arap', 'turk', 'diger']).withMessage('Geçersiz ırk'),
    body('gender')
        .notEmpty().withMessage('Cinsiyet bilgisi gereklidir')
        .isIn(['erkek', 'disi', 'igdis']).withMessage('Geçersiz cinsiyet'),
    body('color')
        .notEmpty().withMessage('Renk bilgisi gereklidir')
        .isIn(['doru', 'kir', 'yagiz', 'al', 'diger']).withMessage('Geçersiz renk'),
    body('birthDate')
        .notEmpty().withMessage('Doğum tarihi gereklidir')
        .isISO8601().withMessage('Geçerli bir tarih girin'),
    body('price')
        .notEmpty().withMessage('Fiyat bilgisi gereklidir')
        .isNumeric().withMessage('Fiyat sayısal olmalıdır')
        .custom(value => value >= 0).withMessage('Fiyat negatif olamaz'),
    body('location.city')
        .notEmpty().withMessage('Şehir bilgisi gereklidir'),
    body('description')
        .trim()
        .notEmpty().withMessage('Açıklama gereklidir')
        .isLength({ min: 50 }).withMessage('Açıklama en az 50 karakter olmalıdır')
        .isLength({ max: 5000 }).withMessage('Açıklama 5000 karakterden uzun olamaz')
];

// Public routes
router.get('/', getHorses);
router.get('/:id', getHorse);

// Protected routes
router.use(protect); // Bundan sonraki tüm route'lar için auth gerekli

router.get('/user/my-listings', getMyListings);
router.post('/:id/favorite', toggleFavorite);

// User routes (herkes ilan verebilir)
router.post('/', horseValidation, createHorse);
router.put('/:id', updateHorse);
router.delete('/:id', deleteHorse);
router.put('/:id/renew', renewListing);
router.put('/:id/mark-sold', markAsSold);

module.exports = router;
