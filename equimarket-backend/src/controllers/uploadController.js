const path = require('path');
const fs = require('fs');

// Base URL for images
const getImageUrl = (filename, folder = '') => {
    if (!filename) return null;
    // Eğer zaten tam URL ise dokunma
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }
    return `/uploads/${folder}${folder ? '/' : ''}${filename}`;
};

// @desc    İlan resimleri yükle
// @route   POST /api/upload/horse-images
// @access  Private (Seller)
exports.uploadHorseImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen en az bir resim yükleyin'
            });
        }

        const images = req.files.map(file => ({
            filename: file.filename,
            url: getImageUrl(file.filename, 'horses'),
            size: file.size,
            mimetype: file.mimetype
        }));

        res.status(200).json({
            success: true,
            message: `${images.length} resim başarıyla yüklendi`,
            data: images
        });
    } catch (error) {
        console.error('Upload horse images error:', error);
        res.status(500).json({
            success: false,
            message: 'Resim yüklenirken bir hata oluştu'
        });
    }
};

// @desc    Tek resim yükle (genel amaçlı)
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir resim yükleyin'
            });
        }

        const image = {
            filename: req.file.filename,
            url: getImageUrl(req.file.filename),
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        res.status(200).json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            data: image
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            message: 'Resim yüklenirken bir hata oluştu'
        });
    }
};

// @desc    Profil fotoğrafı yükle
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir profil fotoğrafı yükleyin'
            });
        }

        const User = require('../models/User');
        
        // Eski avatar'ı sil
        const user = await User.findById(req.user._id);
        if (user.avatar && !user.avatar.startsWith('http')) {
            const oldPath = path.join(__dirname, '../../public', user.avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Yeni avatar'ı kaydet
        const avatarUrl = getImageUrl(req.file.filename, 'avatars');
        user.avatar = avatarUrl;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil fotoğrafı güncellendi',
            data: {
                avatar: avatarUrl
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil fotoğrafı yüklenirken bir hata oluştu'
        });
    }
};

// @desc    Kapak fotoğrafı yükle
// @route   POST /api/upload/cover
// @access  Private
exports.uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir kapak fotoğrafı yükleyin'
            });
        }

        const User = require('../models/User');
        
        // Eski cover'ı sil
        const user = await User.findById(req.user._id);
        if (user.coverPhoto && !user.coverPhoto.startsWith('http')) {
            const oldPath = path.join(__dirname, '../../public', user.coverPhoto);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Yeni cover'ı kaydet
        const coverUrl = getImageUrl(req.file.filename, 'covers');
        user.coverPhoto = coverUrl;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Kapak fotoğrafı güncellendi',
            data: {
                coverPhoto: coverUrl
            }
        });
    } catch (error) {
        console.error('Upload cover error:', error);
        res.status(500).json({
            success: false,
            message: 'Kapak fotoğrafı yüklenirken bir hata oluştu'
        });
    }
};

// @desc    Blog kapak resmi yükle
// @route   POST /api/upload/blog-image
// @access  Admin
exports.uploadBlogImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen bir resim yükleyin'
            });
        }

        const image = {
            filename: req.file.filename,
            url: getImageUrl(req.file.filename, 'blog'),
            size: req.file.size
        };

        res.status(200).json({
            success: true,
            message: 'Blog resmi yüklendi',
            data: image
        });
    } catch (error) {
        console.error('Upload blog image error:', error);
        res.status(500).json({
            success: false,
            message: 'Resim yüklenirken bir hata oluştu'
        });
    }
};

// @desc    Resim sil
// @route   DELETE /api/upload/image/:filename
// @access  Private
exports.deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;
        const { folder } = req.query; // horses, avatars, covers, blog
        
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Dosya adı gerekli'
            });
        }

        // Güvenlik: sadece uploads klasöründen silinebilir
        const allowedFolders = ['', 'horses', 'avatars', 'covers', 'blog'];
        const safeFolder = allowedFolders.includes(folder) ? folder : '';
        
        const filePath = path.join(
            __dirname, 
            '../../public/uploads',
            safeFolder,
            path.basename(filename) // Path traversal önleme
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({
                success: true,
                message: 'Resim silindi'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Resim bulunamadı'
            });
        }
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Resim silinirken bir hata oluştu'
        });
    }
};
