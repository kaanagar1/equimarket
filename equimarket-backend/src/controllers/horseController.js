const Horse = require('../models/Horse');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { notifyFavorited } = require('../utils/notificationHelper');

// @desc    Tüm ilanları getir (filtreleme ile)
// @route   GET /api/horses
// @access  Public
exports.getHorses = async (req, res) => {
    try {
        // Query parametreleri
        const {
            breed,
            gender,
            color,
            city,
            minPrice,
            maxPrice,
            minAge,
            maxAge,
            search,
            sort,
            page = 1,
            limit = 12,
            featured
        } = req.query;

        // Filter objesi oluştur
        let filter = { status: 'active' };

        if (breed) filter.breed = breed;
        if (gender) filter.gender = gender;
        if (color) filter.color = color;
        if (city) filter['location.city'] = city;
        
        // Fiyat aralığı
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Yaş aralığı
        if (minAge || maxAge) {
            filter.age = {};
            if (minAge) filter.age.$gte = Number(minAge);
            if (maxAge) filter.age.$lte = Number(maxAge);
        }

        // Metin araması
        if (search) {
            filter.$text = { $search: search };
        }

        // Öne çıkan
        if (featured === 'true') {
            filter.isFeatured = true;
        }

        // Sıralama
        let sortOption = { isFeatured: -1, createdAt: -1 }; // Varsayılan
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Query
        const horses = await Horse.find(filter)
            .populate('seller', 'name avatar sellerInfo.isVerifiedSeller sellerInfo.rating')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .select('-description'); // Liste için açıklama gereksiz

        // Toplam sayı
        const total = await Horse.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: horses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: horses
        });

    } catch (error) {
        console.error('GetHorses Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Tek ilan detayı
// @route   GET /api/horses/:id
// @access  Public
exports.getHorse = async (req, res) => {
    try {
        const horse = await Horse.findById(req.params.id)
            .populate('seller', 'name email phone avatar bio location website sellerInfo createdAt');

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        // Görüntülenme sayısını artır
        horse.stats.views += 1;
        await horse.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            data: horse
        });

    } catch (error) {
        console.error('GetHorse Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Yeni ilan oluştur
// @route   POST /api/horses
// @access  Private (Seller)
exports.createHorse = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }

        // Satıcı bilgisini ekle
        req.body.seller = req.user.id;

        // İlanı pending olarak oluştur (admin onayı bekler)
        req.body.status = 'pending';

        // Varsayılan son kullanma tarihi (30 gün)
        if (!req.body.expiresAt) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            req.body.expiresAt = expiryDate;
        }

        const horse = await Horse.create(req.body);

        res.status(201).json({
            success: true,
            message: 'İlan başarıyla oluşturuldu',
            data: horse
        });

    } catch (error) {
        console.error('CreateHorse Error:', error);
        
        // Mongoose validation hatası
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası: ' + error.message
        });
    }
};

// @desc    İlan güncelle
// @route   PUT /api/horses/:id
// @access  Private (Owner)
exports.updateHorse = async (req, res) => {
    try {
        let horse = await Horse.findById(req.params.id);

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        // Sahiplik kontrolü
        if (horse.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        // Güncelleme sonrası tekrar onaya al (bazı alanlar için)
        const sensitiveFields = ['name', 'price', 'description', 'images'];
        const needsReview = sensitiveFields.some(field => req.body[field] !== undefined);
        
        if (needsReview && horse.status === 'active') {
            req.body.status = 'pending';
        }

        horse = await Horse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: needsReview ? 'İlan güncellendi ve tekrar onaya alındı' : 'İlan güncellendi',
            data: horse
        });

    } catch (error) {
        console.error('UpdateHorse Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    İlan sil
// @route   DELETE /api/horses/:id
// @access  Private (Owner)
exports.deleteHorse = async (req, res) => {
    try {
        const horse = await Horse.findById(req.params.id);

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        // Sahiplik kontrolü
        if (horse.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        await horse.deleteOne();

        res.status(200).json({
            success: true,
            message: 'İlan silindi',
            data: {}
        });

    } catch (error) {
        console.error('DeleteHorse Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Kullanıcının ilanları
// @route   GET /api/horses/my-listings
// @access  Private
exports.getMyListings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let filter = { seller: req.user.id };
        if (status) filter.status = status;

        const horses = await Horse.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Horse.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: horses.length,
            total,
            data: horses
        });

    } catch (error) {
        console.error('GetMyListings Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Favorilere ekle/çıkar
// @route   POST /api/horses/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
    try {
        const horse = await Horse.findById(req.params.id);

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        const user = await User.findById(req.user.id);
        const favoriteIndex = user.favorites.indexOf(req.params.id);

        let message;
        let isFavoriting = false;
        if (favoriteIndex > -1) {
            // Favorilerden çıkar
            user.favorites.splice(favoriteIndex, 1);
            horse.stats.favorites -= 1;
            message = 'Favorilerden çıkarıldı';
        } else {
            // Favorilere ekle
            user.favorites.push(req.params.id);
            horse.stats.favorites += 1;
            message = 'Favorilere eklendi';
            isFavoriting = true;
        }

        await user.save({ validateBeforeSave: false });
        await horse.save({ validateBeforeSave: false });

        // Favoriye eklendiğinde ilan sahibine bildirim gönder
        if (isFavoriting && horse.seller.toString() !== req.user.id) {
            await notifyFavorited(
                horse.seller.toString(),
                user.name,
                horse.name,
                horse._id.toString()
            );
        }

        res.status(200).json({
            success: true,
            message,
            isFavorited: favoriteIndex === -1
        });

    } catch (error) {
        console.error('ToggleFavorite Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    İlan süresini yenile
// @route   PUT /api/horses/:id/renew
// @access  Private (Owner)
exports.renewListing = async (req, res) => {
    try {
        const horse = await Horse.findById(req.params.id);

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        // Sahiplik kontrolü
        if (horse.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        // Sadece active veya expired ilanlar yenilenebilir
        if (!['active', 'expired'].includes(horse.status)) {
            return res.status(400).json({
                success: false,
                message: 'Sadece aktif veya süresi dolmuş ilanlar yenilenebilir'
            });
        }

        // 30 gün daha ekle
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);

        horse.expiresAt = newExpiryDate;
        horse.status = 'active';
        await horse.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'İlan süresi 30 gün uzatıldı',
            data: {
                expiresAt: horse.expiresAt,
                status: horse.status
            }
        });

    } catch (error) {
        console.error('RenewListing Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    İlanı satıldı olarak işaretle
// @route   PUT /api/horses/:id/mark-sold
// @access  Private (Owner)
exports.markAsSold = async (req, res) => {
    try {
        const horse = await Horse.findById(req.params.id);

        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        // Sahiplik kontrolü
        if (horse.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        horse.status = 'sold';
        await horse.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'İlan satıldı olarak işaretlendi',
            data: horse
        });

    } catch (error) {
        console.error('MarkAsSold Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};
