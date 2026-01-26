const Review = require('../models/Review');
const User = require('../models/User');
const Horse = require('../models/Horse');
const { notifyNewReview } = require('../utils/notificationHelper');

// @desc    Satıcının değerlendirmelerini getir
// @route   GET /api/reviews/seller/:sellerId
// @access  Public
exports.getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        // Satıcı var mı kontrol
        const seller = await User.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Satıcı bulunamadı'
            });
        }

        // Sıralama
        let sortOption = { createdAt: -1 }; // newest
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'highest') sortOption = { rating: -1 };
        if (sort === 'lowest') sortOption = { rating: 1 };
        if (sort === 'helpful') sortOption = { helpfulCount: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({ 
            seller: sellerId, 
            status: 'approved' 
        })
            .populate('reviewer', 'name avatar')
            .populate('horse', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ 
            seller: sellerId, 
            status: 'approved' 
        });

        // İstatistikler
        const stats = await Review.aggregate([
            { $match: { seller: seller._id, status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            stats: stats[0] || {
                averageRating: 0,
                totalReviews: 0,
                rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total
            }
        });
    } catch (error) {
        console.error('Get seller reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Değerlendirmeler yüklenirken hata oluştu'
        });
    }
};

// @desc    Değerlendirme yap
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { sellerId, horseId, rating, comment, ratings } = req.body;
        const reviewerId = req.user._id;

        // Kendi kendini değerlendirme engeli
        if (sellerId === reviewerId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Kendinizi değerlendiremezsiniz'
            });
        }

        // Kullanıcı var mı - Herkes satıcı olabilir, rol kontrolü yok
        const seller = await User.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Daha önce değerlendirme yapılmış mı
        const existingReview = await Review.findOne({
            reviewer: reviewerId,
            seller: sellerId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bu satıcıyı zaten değerlendirdiniz'
            });
        }

        // İlan kontrolü (opsiyonel)
        if (horseId) {
            const horse = await Horse.findById(horseId);
            if (!horse || horse.seller.toString() !== sellerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz ilan'
                });
            }
        }

        // Değerlendirme oluştur
        const review = await Review.create({
            reviewer: reviewerId,
            seller: sellerId,
            horse: horseId || null,
            rating,
            comment,
            ratings: ratings || {}
        });

        await review.populate('reviewer', 'name avatar');

        // Satıcıya bildirim gönder
        const reviewer = await User.findById(reviewerId);
        await notifyNewReview(sellerId, reviewer.name, rating);

        res.status(201).json({
            success: true,
            message: 'Değerlendirmeniz kaydedildi',
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bu satıcıyı zaten değerlendirdiniz'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Değerlendirme kaydedilirken hata oluştu'
        });
    }
};

// @desc    Değerlendirmeyi güncelle
// @route   PUT /api/reviews/:id
// @access  Private (owner)
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, ratings } = req.body;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Değerlendirme bulunamadı'
            });
        }

        // Sahiplik kontrolü
        if (review.reviewer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bu değerlendirmeyi düzenleme yetkiniz yok'
            });
        }

        // Güncelle
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        if (ratings) review.ratings = ratings;

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Değerlendirme güncellendi',
            data: review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Değerlendirme güncellenirken hata oluştu'
        });
    }
};

// @desc    Değerlendirmeyi sil
// @route   DELETE /api/reviews/:id
// @access  Private (owner or admin)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Değerlendirme bulunamadı'
            });
        }

        // Sahiplik veya admin kontrolü
        if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu değerlendirmeyi silme yetkiniz yok'
            });
        }

        const sellerId = review.seller;
        await review.deleteOne();

        // Ortalamayı güncelle
        await Review.calculateAverageRating(sellerId);

        res.status(200).json({
            success: true,
            message: 'Değerlendirme silindi'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Değerlendirme silinirken hata oluştu'
        });
    }
};

// @desc    Satıcı yanıtı ekle
// @route   POST /api/reviews/:id/response
// @access  Private (seller)
exports.addSellerResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Değerlendirme bulunamadı'
            });
        }

        // Satıcı mı kontrol
        if (review.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Sadece değerlendirilen satıcı yanıt verebilir'
            });
        }

        review.sellerResponse = {
            comment,
            createdAt: new Date()
        };

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Yanıtınız eklendi',
            data: review
        });
    } catch (error) {
        console.error('Add seller response error:', error);
        res.status(500).json({
            success: false,
            message: 'Yanıt eklenirken hata oluştu'
        });
    }
};

// @desc    Değerlendirmeyi yararlı bul
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Değerlendirme bulunamadı'
            });
        }

        // Zaten işaretlemiş mi
        const alreadyMarked = review.helpfulBy.includes(userId);

        if (alreadyMarked) {
            // Kaldır
            review.helpfulBy = review.helpfulBy.filter(
                id => id.toString() !== userId.toString()
            );
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Ekle
            review.helpfulBy.push(userId);
            review.helpfulCount += 1;
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: alreadyMarked ? 'İşaret kaldırıldı' : 'Yararlı olarak işaretlendi',
            data: {
                helpfulCount: review.helpfulCount,
                isHelpful: !alreadyMarked
            }
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'İşlem sırasında hata oluştu'
        });
    }
};

// @desc    Kullanıcının değerlendirmelerini getir
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewer: req.user._id })
            .populate('seller', 'name avatar')
            .populate('horse', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Değerlendirmeler yüklenirken hata oluştu'
        });
    }
};

// @desc    Kullanıcının aldığı değerlendirmeleri getir (satıcı için)
// @route   GET /api/reviews/received
// @access  Private (seller)
exports.getReceivedReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ seller: req.user._id })
            .populate('reviewer', 'name avatar')
            .populate('horse', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Get received reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Değerlendirmeler yüklenirken hata oluştu'
        });
    }
};
