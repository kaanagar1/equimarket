const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    // Temel Bilgiler
    name: {
        type: String,
        required: [true, 'İsim gereklidir'],
        trim: true,
        maxlength: [100, 'İsim 100 karakterden uzun olamaz']
    },
    email: {
        type: String,
        required: [true, 'E-posta gereklidir'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta girin']
    },
    password: {
        type: String,
        required: [true, 'Şifre gereklidir'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
        select: false // Sorgularda şifre dönmez
    },
    phone: {
        type: String,
        maxlength: [20, 'Telefon numarası 20 karakterden uzun olamaz']
    },

    // Rol ve Durum
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Profil Bilgileri
    avatar: {
        type: String,
        default: null
    },
    coverPhoto: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [500, 'Biyografi 500 karakterden uzun olamaz']
    },
    location: {
        city: { type: String },
        district: { type: String }
    },
    website: {
        type: String
    },
    socialLinks: {
        instagram: { type: String },
        facebook: { type: String },
        twitter: { type: String },
        youtube: { type: String }
    },

    // Satıcı Bilgileri
    sellerInfo: {
        companyName: { type: String },
        tjkLicenseNo: { type: String },
        isVerifiedSeller: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalSales: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        memberSince: { type: Date },
        specialties: [{ type: String }] // Uzmanlık alanları: yarış atı, engel atı, vb.
    },

    // Abonelik
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'featured', 'premium'],
            default: 'free'
        },
        expiresAt: { type: Date }
    },

    // Ücretsiz İlan Hakları ve Feedback
    freeListingCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    feedbackGiven: {
        type: Boolean,
        default: false
    },

    // Favoriler
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horse'
    }],

    // Bildirim Tercihleri
    notifications: {
        newMessages: { type: Boolean, default: true },
        newOffers: { type: Boolean, default: true },
        listingViews: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        sms: { type: Boolean, default: true }
    },

    // Şifre Sıfırlama
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Zaman Damgaları
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true // createdAt ve updatedAt otomatik eklenir
});

// Şifreyi kaydetmeden önce hashle
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// JWT Token oluştur
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Şifre kontrolü
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
