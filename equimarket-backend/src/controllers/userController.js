const User = require('../models/User');
const Horse = require('../models/Horse');

// @desc    Profil bilgilerini getir
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('favorites', 'name slug images price location status');

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('GetProfile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Profil güncelle
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        // Güncellenebilir alanlar
        const allowedFields = [
            'name', 'phone', 'bio', 'location', 'website', 'avatar', 'coverPhoto',
            'socialLinks', 'notifications'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Satıcı bilgileri - Tüm kullanıcılar güncelleyebilir (herkes satıcı olabilir)
        if (req.body.sellerInfo) {
            const sellerFields = ['companyName', 'tjkLicenseNo', 'specialties'];
            sellerFields.forEach(field => {
                if (req.body.sellerInfo[field] !== undefined) {
                    updateData[`sellerInfo.${field}`] = req.body.sellerInfo[field];
                }
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profil güncellendi',
            data: user
        });

    } catch (error) {
        console.error('UpdateProfile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Kullanıcı profilini getir (public) - Tüm kullanıcılar satıcı olabilir
// @route   GET /api/users/seller/:id
// @access  Public
exports.getSellerProfile = async (req, res) => {
    try {
        // Rol ve isActive kontrolü kaldırıldı - her kullanıcı profili görüntülenebilir
        const seller = await User.findById(req.params.id)
            .select('name avatar coverPhoto bio location website socialLinks sellerInfo createdAt');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            data: seller
        });

    } catch (error) {
        console.error('GetSellerProfile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Favorileri getir
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'favorites',
                match: { status: 'active' },
                select: 'name slug images price location breed age gender seller',
                populate: {
                    path: 'seller',
                    select: 'name avatar sellerInfo.isVerifiedSeller'
                }
            });

        res.status(200).json({
            success: true,
            count: user.favorites.length,
            data: user.favorites
        });

    } catch (error) {
        console.error('GetFavorites Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Hesabı dondur
// @route   PUT /api/users/deactivate
// @access  Private
exports.deactivateAccount = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { isActive: false });

        // Kullanıcının ilanlarını da pasife al
        await Horse.updateMany(
            { seller: req.user.id },
            { status: 'expired' }
        );

        res.status(200).json({
            success: true,
            message: 'Hesabınız donduruldu'
        });

    } catch (error) {
        console.error('DeactivateAccount Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Dashboard istatistikleri (Satıcı)
// @route   GET /api/users/dashboard/stats
// @access  Private (Seller)
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // İlan istatistikleri
        const totalListings = await Horse.countDocuments({ seller: userId });
        const activeListings = await Horse.countDocuments({ seller: userId, status: 'active' });
        const pendingListings = await Horse.countDocuments({ seller: userId, status: 'pending' });
        const soldListings = await Horse.countDocuments({ seller: userId, status: 'sold' });

        // Görüntülenme ve favori toplamı
        const statsAggregation = await Horse.aggregate([
            { $match: { seller: userId } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$stats.views' },
                    totalFavorites: { $sum: '$stats.favorites' },
                    totalInquiries: { $sum: '$stats.inquiries' }
                }
            }
        ]);

        const stats = statsAggregation[0] || { totalViews: 0, totalFavorites: 0, totalInquiries: 0 };

        // Son 7 günlük görüntülenme (örnek veri - gerçek implementasyon için analytics gerekir)
        const weeklyViews = [
            { day: 'Pzt', views: Math.floor(Math.random() * 50) },
            { day: 'Sal', views: Math.floor(Math.random() * 50) },
            { day: 'Çar', views: Math.floor(Math.random() * 50) },
            { day: 'Per', views: Math.floor(Math.random() * 50) },
            { day: 'Cum', views: Math.floor(Math.random() * 50) },
            { day: 'Cmt', views: Math.floor(Math.random() * 50) },
            { day: 'Paz', views: Math.floor(Math.random() * 50) }
        ];

        res.status(200).json({
            success: true,
            data: {
                listings: {
                    total: totalListings,
                    active: activeListings,
                    pending: pendingListings,
                    sold: soldListings
                },
                stats: {
                    totalViews: stats.totalViews,
                    totalFavorites: stats.totalFavorites,
                    totalInquiries: stats.totalInquiries
                },
                weeklyViews
            }
        });

    } catch (error) {
        console.error('GetDashboardStats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};
