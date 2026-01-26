const rateLimit = require('express-rate-limit');

// Genel API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 15 dakikada max 100 istek
    message: {
        success: false,
        message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth işlemleri için sıkı limiter (brute force koruması)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 10, // 1 saatte max 10 deneme
    message: {
        success: false,
        message: 'Çok fazla giriş denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Başarılı istekleri sayma
});

// Şifre sıfırlama için limiter
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 5, // 1 saatte max 5 istek
    message: {
        success: false,
        message: 'Çok fazla şifre sıfırlama isteği. Lütfen 1 saat sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Contact form için limiter (spam koruması)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 5, // 1 saatte max 5 mesaj
    message: {
        success: false,
        message: 'Çok fazla mesaj gönderdiniz. Lütfen 1 saat sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// İlan oluşturma için limiter
const createListingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 10, // 1 saatte max 10 ilan
    message: {
        success: false,
        message: 'Çok fazla ilan oluşturdunuz. Lütfen 1 saat sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Mesaj gönderme için limiter
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 30, // 15 dakikada max 30 mesaj
    message: {
        success: false,
        message: 'Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rapor/şikayet için limiter
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 10, // 1 saatte max 10 şikayet
    message: {
        success: false,
        message: 'Çok fazla şikayet gönderdiniz. Lütfen 1 saat sonra tekrar deneyin.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    contactLimiter,
    createListingLimiter,
    messageLimiter,
    reportLimiter
};
