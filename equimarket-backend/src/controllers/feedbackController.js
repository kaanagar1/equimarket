const Feedback = require('../models/Feedback');
const User = require('../models/User');

/**
 * @desc    Feedback oluştur
 * @route   POST /api/feedback
 * @access  Private
 */
exports.createFeedback = async (req, res) => {
    try {
        const { rating, text, page } = req.body;

        // Validasyon
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir puan giriniz (1-5)'
            });
        }

        if (!text || text.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen en az 10 karakter geri bildirim yazınız'
            });
        }

        // Kullanıcının daha önce feedback verip vermediğini kontrol et
        const existingFeedback = await Feedback.findOne({ user: req.user._id });
        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message: 'Zaten geri bildirim vermişsiniz'
            });
        }

        // Feedback oluştur
        const feedback = await Feedback.create({
            user: req.user._id,
            rating,
            text: text.trim(),
            page: page || '/',
            userAgent: req.headers['user-agent']
        });

        // Kullanıcıya ücretsiz ilan hakkı ver
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $inc: { freeListingCredits: 1 },
                feedbackGiven: true
            },
            { new: true }
        ).select('-password');

        res.status(201).json({
            success: true,
            message: 'Geri bildiriminiz için teşekkürler! 1 ücretsiz ilan hakkı kazandınız.',
            data: {
                feedback: {
                    _id: feedback._id,
                    rating: feedback.rating,
                    createdAt: feedback.createdAt
                },
                user: updatedUser
            }
        });

    } catch (error) {
        console.error('Feedback create error:', error);
        res.status(500).json({
            success: false,
            message: 'Geri bildirim gönderilemedi'
        });
    }
};

/**
 * @desc    Tüm feedback'leri getir (Admin)
 * @route   GET /api/feedback
 * @access  Private/Admin
 */
exports.getAllFeedback = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filtreler
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.rating) {
            filter.rating = parseInt(req.query.rating);
        }
        if (req.query.isRead === 'true') {
            filter.isRead = true;
        } else if (req.query.isRead === 'false') {
            filter.isRead = false;
        }

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .populate('user', 'name email avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Feedback.countDocuments(filter)
        ]);

        // İstatistikler
        const stats = await Feedback.aggregate([
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalCount: { $sum: 1 },
                    rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            data: feedbacks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats: stats[0] || {
                avgRating: 0,
                totalCount: 0,
                rating1: 0,
                rating2: 0,
                rating3: 0,
                rating4: 0,
                rating5: 0
            }
        });

    } catch (error) {
        console.error('Get all feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Geri bildirimler yüklenemedi'
        });
    }
};

/**
 * @desc    Feedback güncelle (Admin)
 * @route   PUT /api/feedback/:id
 * @access  Private/Admin
 */
exports.updateFeedback = async (req, res) => {
    try {
        const { status, isRead, adminNotes } = req.body;

        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Geri bildirim bulunamadı'
            });
        }

        if (status) feedback.status = status;
        if (typeof isRead === 'boolean') feedback.isRead = isRead;
        if (adminNotes !== undefined) feedback.adminNotes = adminNotes;

        await feedback.save();

        res.json({
            success: true,
            message: 'Geri bildirim güncellendi',
            data: feedback
        });

    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Geri bildirim güncellenemedi'
        });
    }
};

/**
 * @desc    Feedback sil (Admin)
 * @route   DELETE /api/feedback/:id
 * @access  Private/Admin
 */
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Geri bildirim bulunamadı'
            });
        }

        await feedback.deleteOne();

        res.json({
            success: true,
            message: 'Geri bildirim silindi'
        });

    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Geri bildirim silinemedi'
        });
    }
};

/**
 * @desc    Feedback istatistikleri (Admin)
 * @route   GET /api/feedback/stats
 * @access  Private/Admin
 */
exports.getFeedbackStats = async (req, res) => {
    try {
        const stats = await Feedback.aggregate([
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                avgRating: { $avg: '$rating' },
                                totalCount: { $sum: 1 },
                                unreadCount: {
                                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                                }
                            }
                        }
                    ],
                    byRating: [
                        {
                            $group: {
                                _id: '$rating',
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    recent: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        { $unwind: '$user' },
                        {
                            $project: {
                                rating: 1,
                                text: 1,
                                createdAt: 1,
                                'user.name': 1,
                                'user.avatar': 1
                            }
                        }
                    ],
                    monthlyTrend: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$createdAt' },
                                    month: { $month: '$createdAt' }
                                },
                                avgRating: { $avg: '$rating' },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': -1, '_id.month': -1 } },
                        { $limit: 12 }
                    ]
                }
            }
        ]);

        const result = stats[0];

        res.json({
            success: true,
            data: {
                overview: result.overview[0] || {
                    avgRating: 0,
                    totalCount: 0,
                    unreadCount: 0
                },
                byRating: result.byRating,
                byStatus: result.byStatus,
                recent: result.recent,
                monthlyTrend: result.monthlyTrend
            }
        });

    } catch (error) {
        console.error('Get feedback stats error:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler yüklenemedi'
        });
    }
};
