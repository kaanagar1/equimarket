const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendTemplateEmail } = require('../utils/emailService');

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

        // Kullanıcı oluştur - Tüm kullanıcılar hem alıcı hem satıcı olabilir
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'buyer', // Rol artık önemli değil, herkes her şeyi yapabilir
            sellerInfo: { memberSince: new Date() } // Tüm kullanıcılar için sellerInfo başlat
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

// @desc    Şifre sıfırlama isteği
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta adresi gereklidir'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Güvenlik: Kullanıcı var/yok bilgisi verme
            return res.status(200).json({
                success: true,
                message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi'
            });
        }

        // Reset token oluştur
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Token'ı hash'le ve veritabanına kaydet
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // 1 saat geçerlilik
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        // Reset URL oluştur
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset_password.html?token=${resetToken}`;

        // Email gönder
        await sendTemplateEmail(user.email, 'passwordReset', {
            resetUrl,
            userName: user.name
        });

        res.status(200).json({
            success: true,
            message: 'Şifre sıfırlama linki e-posta adresinize gönderildi'
        });

    } catch (error) {
        console.error('ForgotPassword Error:', error);

        // Hata durumunda token'ları temizle
        if (error.user) {
            error.user.resetPasswordToken = undefined;
            error.user.resetPasswordExpire = undefined;
            await error.user.save({ validateBeforeSave: false });
        }

        res.status(500).json({
            success: false,
            message: 'E-posta gönderilemedi'
        });
    }
};

// @desc    Şifre sıfırla
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Yeni şifre gereklidir'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Şifre en az 6 karakter olmalıdır'
            });
        }

        // Token'ı hash'le
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Token ile kullanıcıyı bul (süre dolmamış)
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz veya süresi dolmuş token'
            });
        }

        // Yeni şifreyi kaydet
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res, 'Şifreniz başarıyla güncellendi');

    } catch (error) {
        console.error('ResetPassword Error:', error);
        res.status(500).json({
            success: false,
            message: 'Şifre güncellenemedi'
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
