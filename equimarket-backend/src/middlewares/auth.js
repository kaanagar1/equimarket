const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama
exports.protect = async (req, res, next) => {
    let token;

    // Header'dan token al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Bu işlem için giriş yapmanız gerekiyor'
        });
    }

    try {
        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kullanıcıyı bul
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz veya süresi dolmuş token'
        });
    }
};

// Rol kontrolü
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz yok'
            });
        }
        next();
    };
};

// Satıcı kontrolü - Artık tüm giriş yapmış kullanıcılar satıcı olabilir
exports.isSeller = (req, res, next) => {
    // Tüm giriş yapmış kullanıcılar hem alıcı hem satıcı olabilir
    next();
};

// Doğrulanmış satıcı kontrolü
exports.isVerifiedSeller = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    
    if (req.user.role !== 'seller' || !req.user.sellerInfo?.isVerifiedSeller) {
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için doğrulanmış satıcı olmanız gerekiyor'
        });
    }
    next();
};

// Admin kontrolü
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için admin yetkisi gerekiyor'
        });
    }
    next();
};
