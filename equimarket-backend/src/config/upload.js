const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörlerini oluştur
const uploadDirs = ['uploads', 'uploads/horses', 'uploads/avatars', 'uploads/covers', 'uploads/blog'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../public', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Storage konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Yükleme türüne göre klasör belirle
        let uploadPath = 'public/uploads';
        
        if (req.baseUrl.includes('/horses') || req.path.includes('horse')) {
            uploadPath = 'public/uploads/horses';
        } else if (req.path.includes('avatar')) {
            uploadPath = 'public/uploads/avatars';
        } else if (req.path.includes('cover')) {
            uploadPath = 'public/uploads/covers';
        } else if (req.baseUrl.includes('/blog')) {
            uploadPath = 'public/uploads/blog';
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Benzersiz dosya adı: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_')
            .substring(0, 50);
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

// Dosya filtresi - sadece resimler
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)'), false);
    }
};

// Upload middleware'leri
const uploadHorseImages = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10 // Maksimum 10 resim
    },
    fileFilter: imageFilter
}).array('images', 10);

const uploadSingleImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: imageFilter
}).single('image');

const uploadAvatar = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: imageFilter
}).single('avatar');

const uploadCover = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: imageFilter
}).single('cover');

// Hata yakalama wrapper
const handleUpload = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Dosya boyutu çok büyük. Maksimum 5MB yüklenebilir.'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Çok fazla dosya. Maksimum 10 resim yüklenebilir.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'Dosya yükleme hatası: ' + err.message
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
};

module.exports = {
    uploadHorseImages: handleUpload(uploadHorseImages),
    uploadSingleImage: handleUpload(uploadSingleImage),
    uploadAvatar: handleUpload(uploadAvatar),
    uploadCover: handleUpload(uploadCover)
};
