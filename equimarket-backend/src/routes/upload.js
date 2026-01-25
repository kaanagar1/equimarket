const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const { 
    uploadHorseImages, 
    uploadSingleImage, 
    uploadAvatar, 
    uploadCover 
} = require('../config/upload');
const {
    uploadHorseImages: handleHorseImages,
    uploadImage,
    uploadAvatar: handleAvatar,
    uploadCover: handleCover,
    uploadBlogImage,
    deleteImage
} = require('../controllers/uploadController');

// Tüm upload route'ları için auth gerekli
router.use(protect);

// İlan resimleri (çoklu)
router.post('/horse-images', uploadHorseImages, handleHorseImages);

// Tek resim
router.post('/image', uploadSingleImage, uploadImage);

// Avatar
router.post('/avatar', uploadAvatar, handleAvatar);

// Kapak fotoğrafı
router.post('/cover', uploadCover, handleCover);

// Blog resmi (admin only)
router.post('/blog-image', isAdmin, uploadSingleImage, uploadBlogImage);

// Resim silme
router.delete('/image/:filename', deleteImage);

module.exports = router;
