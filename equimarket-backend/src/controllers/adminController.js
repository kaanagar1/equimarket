const User = require('../models/User');
const Horse = require('../models/Horse');
const { Conversation, Message } = require('../models/Message');

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const buyerCount = await User.countDocuments({ role: 'buyer' });
        const sellerCount = await User.countDocuments({ role: 'seller' });
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

        res.json({ success: true, data: { users: { total: totalUsers, buyers: buyerCount, sellers: sellerCount, newThisMonth: newUsersThisMonth }, listings: { total: totalListings, active: activeListings, pending: pendingListings }, messages: { messages: totalMessages, pendingOffers }, chart: last7Days } });
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

// Bulk approve
exports.bulkApproveListing = async (req, res) => {
    try {
        const { listingIds } = req.body;
        if (!listingIds || !listingIds.length) return res.status(400).json({ success: false, message: 'İlan ID gerekli' });
        const result = await Horse.updateMany({ _id: { $in: listingIds }, status: 'pending' }, { status: 'active' });
        res.json({ success: true, message: `${result.modifiedCount} ilan onaylandı` });
    } catch (error) { res.status(500).json({ success: false, message: 'Sunucu hatası' }); }
};
