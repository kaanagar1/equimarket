const Banner = require('../models/Banner');

// Public: Aktif bannerları getir (auth gerektirmez)
exports.getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .populate('featuredHorses', 'name breed gender age price images location seller status')
            .populate({
                path: 'featuredHorses',
                populate: { path: 'seller', select: 'name sellerInfo' }
            })
            .sort({ type: 1, order: 1 });

        // Sadece aktif ilanları olan atları filtrele
        banners.forEach(b => {
            if (b.featuredHorses) {
                b.featuredHorses = b.featuredHorses.filter(h => h && h.status === 'active');
            }
        });

        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('GetActiveBanners error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Admin: Tüm bannerları getir
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find()
            .populate('featuredHorses', 'name breed price images status')
            .sort({ type: 1, order: 1 });

        res.json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Admin: Banner oluştur
exports.createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Banner güncelle
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!banner) return res.status(404).json({ success: false, message: 'Banner bulunamadı' });
        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Banner sil
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Banner bulunamadı' });
        res.json({ success: true, message: 'Banner silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};
