const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for horse images
const horseImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'equimarket/horses',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }
        ]
    }
});

// Storage for user avatars
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'equimarket/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }
        ]
    }
});

// Storage for blog images
const blogImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'equimarket/blog',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 630, crop: 'fill', quality: 'auto:good' }
        ]
    }
});

// Storage for documents (seller verification, etc.)
const documentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'equimarket/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto'
    }
});

// Multer upload middlewares
const uploadHorseImages = multer({
    storage: horseImageStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10 // Max 10 images per upload
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
        }
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
        }
    }
});

const uploadBlogImage = multer({
    storage: blogImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
        }
    }
});

const uploadDocument = multer({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    }
});

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const matches = url.match(/\/equimarket\/([^.]+)/);
    return matches ? `equimarket/${matches[1]}` : null;
};

module.exports = {
    cloudinary,
    uploadHorseImages,
    uploadAvatar,
    uploadBlogImage,
    uploadDocument,
    deleteImage,
    getPublicIdFromUrl
};
