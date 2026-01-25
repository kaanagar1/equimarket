// Support Controller - Contact Form & Reports

// In-memory storage (production'da MongoDB'ye taşınmalı)
// Şimdilik basit bir çözüm - e-posta servisi olmadan çalışır
let contactMessages = [];
let reports = [];

// @desc    Contact form mesajı gönder
// @route   POST /api/support/contact
// @access  Public
exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validasyon
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Ad, e-posta, konu ve mesaj alanları zorunludur'
            });
        }

        // E-posta formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi girin'
            });
        }

        // Mesajı kaydet
        const contactMessage = {
            _id: Date.now().toString(),
            name,
            email,
            phone: phone || null,
            subject,
            message,
            status: 'new', // new, read, replied, closed
            createdAt: new Date(),
            ipAddress: req.ip
        };

        contactMessages.push(contactMessage);

        // TODO: E-posta servisi eklendiğinde admin'e bildirim gönder
        // await sendEmail({
        //     to: 'destek@equimarket.com',
        //     subject: `Yeni İletişim Formu: ${subject}`,
        //     text: `${name} (${email}) mesaj gönderdi:\n\n${message}`
        // });

        console.log('Yeni contact mesajı:', contactMessage);

        res.status(201).json({
            success: true,
            message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
            data: { id: contactMessage._id }
        });

    } catch (error) {
        console.error('Contact form error:', error);
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
            type,           // listing, user, message, other
            targetId,       // İlan veya kullanıcı ID'si
            reason,         // Şikayet nedeni
            description,    // Detaylı açıklama
            contactEmail    // İletişim için e-posta (giriş yapmamışsa)
        } = req.body;

        // Validasyon
        if (!type || !reason || !description) {
            return res.status(400).json({
                success: false,
                message: 'Şikayet türü, nedeni ve açıklama zorunludur'
            });
        }

        // Report kaydı
        const report = {
            _id: Date.now().toString(),
            type,
            targetId: targetId || null,
            reason,
            description,
            reportedBy: req.user?._id || null,
            contactEmail: contactEmail || req.user?.email || null,
            status: 'pending', // pending, investigating, resolved, dismissed
            createdAt: new Date(),
            ipAddress: req.ip
        };

        reports.push(report);

        console.log('Yeni şikayet:', report);

        res.status(201).json({
            success: true,
            message: 'Şikayetiniz alındı. İnceleme sonucunda size bilgi verilecektir.',
            data: { id: report._id }
        });

    } catch (error) {
        console.error('Report error:', error);
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
        
        let filtered = [...contactMessages];
        
        if (status) {
            filtered = filtered.filter(m => m.status === status);
        }
        
        // Yeniden eskiye sırala
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = filtered.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = filtered.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            data: paginated,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats: {
                total: contactMessages.length,
                new: contactMessages.filter(m => m.status === 'new').length,
                read: contactMessages.filter(m => m.status === 'read').length
            }
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
        const { status } = req.body;

        const index = contactMessages.findIndex(m => m._id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Mesaj bulunamadı' });
        }

        contactMessages[index].status = status;
        contactMessages[index].updatedAt = new Date();

        res.status(200).json({
            success: true,
            data: contactMessages[index],
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
        
        let filtered = [...reports];
        
        if (status) {
            filtered = filtered.filter(r => r.status === status);
        }
        if (type) {
            filtered = filtered.filter(r => r.type === type);
        }
        
        // Yeniden eskiye sırala
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = filtered.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = filtered.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            data: paginated,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats: {
                total: reports.length,
                pending: reports.filter(r => r.status === 'pending').length,
                investigating: reports.filter(r => r.status === 'investigating').length
            }
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

        const index = reports.findIndex(r => r._id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Şikayet bulunamadı' });
        }

        reports[index].status = status;
        if (adminNote) reports[index].adminNote = adminNote;
        reports[index].updatedAt = new Date();
        reports[index].resolvedBy = req.user._id;

        res.status(200).json({
            success: true,
            data: reports[index],
            message: 'Şikayet durumu güncellendi'
        });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ success: false, message: 'Şikayet güncellenemedi' });
    }
};
