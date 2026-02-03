const User = require('../models/User');
const Horse = require('../models/Horse');
const { Conversation, Message } = require('../models/Message');
const { notifyListingApproved, notifyListingRejected } = require('../utils/notificationHelper');

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const userCount = await User.countDocuments({ role: 'user' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } });
        const totalListings = await Horse.countDocuments();
        const activeListings = await Horse.countDocuments({ status: 'active' });
        const pendingListings = await Horse.countDocuments({ status: 'pending' });
        const totalMessages = await Message.countDocuments();
        const pendingOffers = await Message.countDocuments({ type: 'offer', 'offer.status': 'pending' });

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0,0,0,0);
            const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
            const users = await User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } });
            const listings = await Horse.countDocuments({ createdAt: { $gte: date, $lt: nextDate } });
            last7Days.push({ date: date.toISOString().split('T')[0], users, listings });
        }

        res.json({ success: true, data: { users: { total: totalUsers, users: userCount, admins: adminCount, newThisMonth: newUsersThisMonth }, listings: { total: totalListings, active: activeListings, pending: pendingListings }, messages: { messages: totalMessages, pendingOffers }, chart: last7Days } });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Get users
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, status, search, sort = '-createdAt' } = req.query;
        let filter = {};
        if (role) filter.role = role;
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;
        if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        const users = await User.find(filter).select('-password').sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await User.countDocuments(filter);
        res.json({ success: true, count: users.length, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), data: users });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Get user
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        const listings = await Horse.find({ seller: user._id }).select('name status price createdAt').sort('-createdAt').limit(10);
        res.json({ success: true, data: { user, listings } });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { role, isActive, isVerified, sellerInfo } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (isVerified !== undefined) user.isVerified = isVerified;
        if (sellerInfo) { user.sellerInfo = { ...user.sellerInfo, ...sellerInfo }; if (sellerInfo.isVerifiedSeller) user.sellerInfo.verifiedAt = new Date(); }
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, message: 'Kullanıcı güncellendi', data: user });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        if (user._id.toString() === req.user.id) return res.status(400).json({ success: false, message: 'Kendinizi silemezsiniz' });
        await Horse.deleteMany({ seller: user._id });
        await user.deleteOne();
        res.json({ success: true, message: 'Kullanıcı silindi' });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Get listings
exports.getListings = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, sort = '-createdAt' } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }];
        const listings = await Horse.find(filter).populate('seller', 'name email').sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Horse.countDocuments(filter);
        res.json({ success: true, count: listings.length, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), data: listings });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Update listing
exports.updateListing = async (req, res) => {
    try {
        const { status, rejectionReason, isFeatured } = req.body;
        const listing = await Horse.findById(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
        if (status !== undefined) listing.status = status;
        if (rejectionReason !== undefined) listing.rejectionReason = rejectionReason;
        if (isFeatured !== undefined) listing.isFeatured = isFeatured;
        await listing.save({ validateBeforeSave: false });
        res.json({ success: true, message: 'İlan güncellendi', data: listing });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Delete listing
exports.deleteListing = async (req, res) => {
    try {
        const listing = await Horse.findById(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
        await listing.deleteOne();
        res.json({ success: true, message: 'İlan silindi' });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};

// Approve listing
exports.approveListing = async (req, res) => {
    try {
        const listing = await Horse.findById(req.params.id).populate('seller', 'name email');
        if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });

        if (listing.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Bu ilan onay bekliyor durumunda değil' });
        }

        listing.status = 'active';
        listing.approvedAt = new Date();
        listing.approvedBy = req.user._id;
        await listing.save({ validateBeforeSave: false });

        // Satıcıya bildirim gönder
        await notifyListingApproved(
            listing.seller._id.toString(),
            listing.name,
            listing._id.toString()
        );

        res.json({ success: true, message: 'İlan onaylandı', data: listing });
    } catch (error) {
        console.error('ApproveListing Error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Reject listing
exports.rejectListing = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: 'Red nedeni gereklidir' });

        const listing = await Horse.findById(req.params.id).populate('seller', 'name email');
        if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });

        if (listing.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Bu ilan onay bekliyor durumunda değil' });
        }

        listing.status = 'rejected';
        listing.rejectionReason = reason;
        listing.rejectedAt = new Date();
        listing.rejectedBy = req.user._id;
        await listing.save({ validateBeforeSave: false });

        // Satıcıya bildirim gönder
        await notifyListingRejected(
            listing.seller._id.toString(),
            listing.name,
            reason
        );

        res.json({ success: true, message: 'İlan reddedildi', data: listing });
    } catch (error) {
        console.error('RejectListing Error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Bulk approve
exports.bulkApproveListing = async (req, res) => {
    try {
        const { listingIds } = req.body;
        if (!listingIds || !listingIds.length) return res.status(400).json({ success: false, message: 'İlan ID gerekli' });

        // İlanları bul ve onayla
        const listings = await Horse.find({ _id: { $in: listingIds }, status: 'pending' });

        for (const listing of listings) {
            listing.status = 'active';
            listing.approvedAt = new Date();
            listing.approvedBy = req.user._id;
            await listing.save({ validateBeforeSave: false });

            // Her ilan için bildirim gönder
            await notifyListingApproved(
                listing.seller.toString(),
                listing.name,
                listing._id.toString()
            );
        }

        res.json({ success: true, message: `${listings.length} ilan onaylandı` });
    } catch (error) {
        console.error('BulkApproveListing Error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Get chart data
exports.getChartData = async (req, res) => {
    try {
        // Listings by breed
        const listingsByBreed = await Horse.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$breed', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Listings by city (top 10)
        const listingsByCity = await Horse.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Price distribution
        const priceRanges = [
            { min: 0, max: 50000, label: '0-50K' },
            { min: 50000, max: 100000, label: '50K-100K' },
            { min: 100000, max: 250000, label: '100K-250K' },
            { min: 250000, max: 500000, label: '250K-500K' },
            { min: 500000, max: 1000000, label: '500K-1M' },
            { min: 1000000, max: Infinity, label: '1M+' }
        ];

        const priceDistribution = await Promise.all(
            priceRanges.map(async range => ({
                label: range.label,
                count: await Horse.countDocuments({
                    status: 'active',
                    price: { $gte: range.min, $lt: range.max === Infinity ? 999999999 : range.max }
                })
            }))
        );

        // Monthly registrations (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const users = await User.countDocuments({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const listings = await Horse.countDocuments({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            monthlyData.push({
                month: startOfMonth.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
                users,
                listings
            });
        }

        // Listing status breakdown
        const statusBreakdown = await Horse.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                listingsByBreed,
                listingsByCity,
                priceDistribution,
                monthlyData,
                statusBreakdown
            }
        });
    } catch (error) {
        console.error('GetChartData Error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};
