const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth');

const {
    getSavedSearches,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    runSavedSearch
} = require('../controllers/savedSearchController');

// Validation
const savedSearchValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Arama adı gereklidir')
        .isLength({ max: 100 }).withMessage('Arama adı 100 karakterden uzun olamaz')
];

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getSavedSearches)
    .post(savedSearchValidation, createSavedSearch);

router.route('/:id')
    .put(updateSavedSearch)
    .delete(deleteSavedSearch);

router.get('/:id/results', runSavedSearch);

module.exports = router;
