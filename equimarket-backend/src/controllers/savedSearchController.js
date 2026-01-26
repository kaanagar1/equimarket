const SavedSearch = require('../models/SavedSearch');
const Horse = require('../models/Horse');
const { validationResult } = require('express-validator');

// @desc    Get user's saved searches
// @route   GET /api/saved-searches
// @access  Private
exports.getSavedSearches = async (req, res) => {
    try {
        const searches = await SavedSearch.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: searches.length,
            data: searches
        });

    } catch (error) {
        console.error('GetSavedSearches Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Create saved search
// @route   POST /api/saved-searches
// @access  Private
exports.createSavedSearch = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array().map(e => e.msg).join(', ')
            });
        }

        // Check user's saved search limit (max 10)
        const existingCount = await SavedSearch.countDocuments({ user: req.user.id });
        if (existingCount >= 10) {
            return res.status(400).json({
                success: false,
                message: 'En fazla 10 arama kaydedebilirsiniz'
            });
        }

        const { name, filters, notifications } = req.body;

        // Get current match count
        const matchCount = await countMatches(filters);

        const savedSearch = await SavedSearch.create({
            user: req.user.id,
            name,
            filters,
            notifications: {
                enabled: notifications?.enabled ?? true,
                frequency: notifications?.frequency || 'daily'
            },
            matchCount
        });

        res.status(201).json({
            success: true,
            message: 'Arama kaydedildi',
            data: savedSearch
        });

    } catch (error) {
        console.error('CreateSavedSearch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Update saved search
// @route   PUT /api/saved-searches/:id
// @access  Private
exports.updateSavedSearch = async (req, res) => {
    try {
        let savedSearch = await SavedSearch.findById(req.params.id);

        if (!savedSearch) {
            return res.status(404).json({
                success: false,
                message: 'Kayıtlı arama bulunamadı'
            });
        }

        // Ownership check
        if (savedSearch.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        const { name, filters, notifications } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (filters) {
            updateData.filters = filters;
            updateData.matchCount = await countMatches(filters);
        }
        if (notifications) {
            updateData.notifications = {
                enabled: notifications.enabled ?? savedSearch.notifications.enabled,
                frequency: notifications.frequency || savedSearch.notifications.frequency,
                lastNotifiedAt: savedSearch.notifications.lastNotifiedAt
            };
        }

        savedSearch = await SavedSearch.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Arama güncellendi',
            data: savedSearch
        });

    } catch (error) {
        console.error('UpdateSavedSearch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Delete saved search
// @route   DELETE /api/saved-searches/:id
// @access  Private
exports.deleteSavedSearch = async (req, res) => {
    try {
        const savedSearch = await SavedSearch.findById(req.params.id);

        if (!savedSearch) {
            return res.status(404).json({
                success: false,
                message: 'Kayıtlı arama bulunamadı'
            });
        }

        // Ownership check
        if (savedSearch.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        await savedSearch.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Kayıtlı arama silindi'
        });

    } catch (error) {
        console.error('DeleteSavedSearch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Run saved search and get results
// @route   GET /api/saved-searches/:id/results
// @access  Private
exports.runSavedSearch = async (req, res) => {
    try {
        const savedSearch = await SavedSearch.findById(req.params.id);

        if (!savedSearch) {
            return res.status(404).json({
                success: false,
                message: 'Kayıtlı arama bulunamadı'
            });
        }

        // Ownership check
        if (savedSearch.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }

        const { page = 1, limit = 12 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = buildFilter(savedSearch.filters);

        const horses = await Horse.find(filter)
            .populate('seller', 'name avatar sellerInfo.isVerifiedSeller sellerInfo.rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('-description');

        const total = await Horse.countDocuments(filter);

        // Update last checked
        savedSearch.lastCheckedAt = new Date();
        savedSearch.matchCount = total;
        await savedSearch.save();

        res.status(200).json({
            success: true,
            count: horses.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: horses
        });

    } catch (error) {
        console.error('RunSavedSearch Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// Helper: Build filter from saved search
const buildFilter = (filters) => {
    let filter = { status: 'active' };

    if (filters.breed) filter.breed = filters.breed;
    if (filters.gender) filter.gender = filters.gender;
    if (filters.color) filter.color = filters.color;
    if (filters.city) filter['location.city'] = filters.city;

    if (filters.minPrice || filters.maxPrice) {
        filter.price = {};
        if (filters.minPrice) filter.price.$gte = Number(filters.minPrice);
        if (filters.maxPrice) filter.price.$lte = Number(filters.maxPrice);
    }

    if (filters.minAge || filters.maxAge) {
        filter.age = {};
        if (filters.minAge) filter.age.$gte = Number(filters.minAge);
        if (filters.maxAge) filter.age.$lte = Number(filters.maxAge);
    }

    if (filters.search) {
        filter.$text = { $search: filters.search };
    }

    return filter;
};

// Helper: Count matching horses
const countMatches = async (filters) => {
    const filter = buildFilter(filters);
    return await Horse.countDocuments(filter);
};

module.exports = {
    getSavedSearches: exports.getSavedSearches,
    createSavedSearch: exports.createSavedSearch,
    updateSavedSearch: exports.updateSavedSearch,
    deleteSavedSearch: exports.deleteSavedSearch,
    runSavedSearch: exports.runSavedSearch,
    buildFilter,
    countMatches
};
