const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        // Validasyon hatalarını kontrol et
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password, phone, role } = req.body;

        // E-posta kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu e-posta adresi zaten kayıtlı'
            });
        }

        // Kullanıcı oluştur
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: role || 'buyer',
            sellerInfo: role === 'seller' ? { memberSince: new Date() } : undefined
        });

        // Token oluştur ve gönder
        sendTokenResponse(user, 201, res, 'Kayıt başarılı');

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // E-posta ve şifre kontrolü
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen e-posta ve şifre girin'
            });
        }

        // Kullanıcıyı bul (şifre dahil)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz e-posta veya şifre'
            });
        }

        // Hesap aktif mi kontrol et
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
        }

        // Şifre kontrolü
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz e-posta veya şifre'
            });
        }

        // Son giriş tarihini güncelle
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Token oluştur ve gönder
        sendTokenResponse(user, 200, res, 'Giriş başarılı');

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Mevcut kullanıcı bilgisi
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('favorites', 'name slug images price location');

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Çıkış yap
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Çıkış başarılı',
        data: {}
    });
};

// @desc    Şifre güncelle
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Mevcut şifre kontrolü
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mevcut şifre yanlış'
            });
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res, 'Şifre güncellendi');

    } catch (error) {
        console.error('UpdatePassword Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// Token oluştur ve cookie ile gönder
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = user.getSignedJwtToken();

    // Şifreyi response'dan çıkar
    const userData = user.toObject();
    delete userData.password;

    res.status(statusCode).json({
        success: true,
        message,
        token,
        data: userData
    });
};
