const Horse = require('../models/Horse');
const { validationResult } = require('express-validator');
const HorseService = require('../services/horseService');

/**
 * Hata yanıtı helper
 */
const handleError = (res, error, defaultMessage = 'Sunucu hatası') => {
    console.error(error);
    const status = error.statusCode || 500;
    const message = error.message || defaultMessage;
    res.status(status).json({ success: false, message });
};

// @desc    Tüm ilanları getir (filtreleme ile)
// @route   GET /api/horses
// @access  Public
exports.getHorses = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort } = req.query;

        // Service'den filter ve sort oluştur
        const filter = HorseService.buildFilters(req.query);
        const sortOption = HorseService.buildSortOption(sort);

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
            .select('-description')
            .lean();

        const total = await Horse.countDocuments(filter);

        // _id'yi string olarak garanti et
        const horsesData = horses.map(h => ({
            ...h,
            _id: h._id.toString()
        }));

        res.status(200).json({
            success: true,
            count: horsesData.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: horsesData
        });

    } catch (error) {
        handleError(res, error);
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
            return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
        }

        // Görüntülenme sayısını artır
        await HorseService.incrementViewCount(horse);

        // _id'yi string olarak garanti et
        const horseData = horse.toObject();
        horseData._id = horseData._id.toString();

        res.status(200).json({ success: true, data: horseData });

    } catch (error) {
        handleError(res, error);
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

        // Service'den varsayılan değerleri al
        const horseData = HorseService.setCreateDefaults(req.body, req.user.id);
        const horse = await Horse.create(horseData);

        res.status(201).json({
            success: true,
            message: 'İlan başarıyla oluşturuldu. Admin onayından sonra yayınlanacaktır.',
            data: horse,
            pendingApproval: true
        });

    } catch (error) {
        // Mongoose validation hatası
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        handleError(res, error);
    }
};

// @desc    İlan güncelle
// @route   PUT /api/horses/:id
// @access  Private (Owner)
exports.updateHorse = async (req, res) => {
    try {
        // Sahiplik kontrolü ile ilanı getir
        let horse = await HorseService.getHorseWithOwnershipCheck(req.params.id, req.user);

        // Güvenli alanlar - sadece bunlar güncellenebilir
        const allowedFields = [
            'name', 'breed', 'gender', 'color', 'birthDate', 'height', 'weight',
            'pedigree', 'price', 'priceNegotiable', 'location', 'description',
            'images', 'videos', 'racingHistory', 'health', 'tags', 'tjkRegistrationNo'
        ];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Hassas alan değişikliği kontrolü
        const needsReview = HorseService.hasSensitiveChanges(updateData);
        if (needsReview && horse.status === 'active') {
            updateData.status = 'pending';
        }

        horse = await Horse.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: needsReview ? 'İlan güncellendi ve tekrar onaya alındı' : 'İlan güncellendi',
            data: horse
        });

    } catch (error) {
        handleError(res, error);
    }
};

// @desc    İlan sil
// @route   DELETE /api/horses/:id
// @access  Private (Owner)
exports.deleteHorse = async (req, res) => {
    try {
        // Sahiplik kontrolü ile ilanı getir
        const horse = await HorseService.getHorseWithOwnershipCheck(req.params.id, req.user);
        await horse.deleteOne();

        res.status(200).json({ success: true, message: 'İlan silindi', data: {} });

    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Kullanıcının ilanları
// @route   GET /api/horses/my-listings
// @access  Private
exports.getMyListings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { seller: req.user.id };
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
        handleError(res, error);
    }
};

// @desc    Favorilere ekle/çıkar
// @route   POST /api/horses/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
    try {
        const result = await HorseService.toggleFavorite(req.params.id, req.user.id);

        res.status(200).json({
            success: true,
            message: result.message,
            isFavorited: result.isFavorited
        });

    } catch (error) {
        handleError(res, error);
    }
};

// @desc    İlan süresini yenile
// @route   PUT /api/horses/:id/renew
// @access  Private (Owner)
exports.renewListing = async (req, res) => {
    try {
        const result = await HorseService.renewListing(req.params.id, req.user);

        res.status(200).json({
            success: true,
            message: 'İlan süresi 30 gün uzatıldı',
            data: result
        });

    } catch (error) {
        handleError(res, error);
    }
};

// @desc    İlanı satıldı olarak işaretle
// @route   PUT /api/horses/:id/mark-sold
// @access  Private (Owner)
exports.markAsSold = async (req, res) => {
    try {
        const horse = await HorseService.markAsSold(req.params.id, req.user);

        res.status(200).json({
            success: true,
            message: 'İlan satıldı olarak işaretlendi',
            data: horse
        });

    } catch (error) {
        handleError(res, error);
    }
};
