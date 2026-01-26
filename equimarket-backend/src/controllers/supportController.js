// Support Controller - Contact Form & Reports (MongoDB version)
const ContactMessage = require('../models/ContactMessage');
const Report = require('../models/Report');

// @desc    Contact form mesajı gönder
// @route   POST /api/support/contact
// @access  Public
exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Mesajı kaydet
        const contactMessage = await ContactMessage.create({
            name,
            email,
            phone: phone || null,
            subject,
            message,
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        // TODO: E-posta servisi eklendiğinde admin'e bildirim gönder

        res.status(201).json({
            success: true,
            message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
            data: { id: contactMessage._id }
        });

    } catch (error) {
        console.error('Contact form error:', error);

        // Mongoose validation error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Mesaj gönderilirken bir hata oluştu'
        });
    }
};

// @desc    Şikayet/Report gönder
// @route   POST /api/support/report
// @access  Public (opsiyonel auth)
exports.sendReport = async (req, res) => {
    try {
        const {
            type,
            targetId,
            reason,
            description,
            contactEmail
        } = req.body;

        // Report kaydı
        const report = await Report.create({
            type,
            targetId: targetId || null,
            reason,
            description,
            reportedBy: req.user?._id || null,
            contactEmail: contactEmail || req.user?.email || null,
            ipAddress: req.ip || req.connection?.remoteAddress
        });

        res.status(201).json({
            success: true,
            message: 'Şikayetiniz alındı. İnceleme sonucunda size bilgi verilecektir.',
            data: { id: report._id }
        });

    } catch (error) {
        console.error('Report error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Şikayet gönderilirken bir hata oluştu'
        });
    }
};

// ============ ADMIN ENDPOINTS ============

// @desc    Admin - Tüm contact mesajlarını getir
// @route   GET /api/admin/support/contacts
// @access  Admin
exports.getContactMessages = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const total = await ContactMessage.countDocuments(filter);
        const messages = await ContactMessage.find(filter)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Stats
        const stats = await ContactMessage.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsObj = {
            total: await ContactMessage.countDocuments(),
            new: 0,
            read: 0,
            replied: 0,
            closed: 0
        };
        stats.forEach(s => { statsObj[s._id] = s.count; });

        res.status(200).json({
            success: true,
            data: messages,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats: statsObj
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Mesajlar yüklenemedi' });
    }
};

// @desc    Admin - Contact mesajı durumunu güncelle
// @route   PUT /api/admin/support/contacts/:id
// @access  Admin
exports.updateContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminReply } = req.body;

        const updateData = { status };
        if (adminReply) {
            updateData.adminReply = adminReply;
            updateData.repliedAt = new Date();
            updateData.repliedBy = req.user._id;
        }

        const message = await ContactMessage.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, message: 'Mesaj bulunamadı' });
        }

        res.status(200).json({
            success: true,
            data: message,
            message: 'Mesaj durumu güncellendi'
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ success: false, message: 'Mesaj güncellenemedi' });
    }
};

// @desc    Admin - Tüm şikayetleri getir
// @route   GET /api/admin/support/reports
// @access  Admin
exports.getReports = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const total = await Report.countDocuments(filter);
        const reports = await Report.find(filter)
            .populate('reportedBy', 'name email')
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Stats
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsObj = {
            total: await Report.countDocuments(),
            pending: 0,
            investigating: 0,
            resolved: 0,
            dismissed: 0
        };
        stats.forEach(s => { statsObj[s._id] = s.count; });

        res.status(200).json({
            success: true,
            data: reports,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats: statsObj
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ success: false, message: 'Şikayetler yüklenemedi' });
    }
};

// @desc    Admin - Şikayet durumunu güncelle
// @route   PUT /api/admin/support/reports/:id
// @access  Admin
exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        const updateData = { status };
        if (adminNote) updateData.adminNote = adminNote;

        if (status === 'resolved' || status === 'dismissed') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = req.user._id;
        }

        const report = await Report.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('reportedBy', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Şikayet bulunamadı' });
        }

        res.status(200).json({
            success: true,
            data: report,
            message: 'Şikayet durumu güncellendi'
        });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ success: false, message: 'Şikayet güncellenemedi' });
    }
};

// @desc    Admin - Contact mesajını sil
// @route   DELETE /api/admin/support/contacts/:id
// @access  Admin
exports.deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Mesaj bulunamadı' });
        }

        res.status(200).json({
            success: true,
            message: 'Mesaj silindi'
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ success: false, message: 'Mesaj silinemedi' });
    }
};

// @desc    Admin - Şikayeti sil
// @route   DELETE /api/admin/support/reports/:id
// @access  Admin
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Şikayet bulunamadı' });
        }

        res.status(200).json({
            success: true,
            message: 'Şikayet silindi'
        });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ success: false, message: 'Şikayet silinemedi' });
    }
};
