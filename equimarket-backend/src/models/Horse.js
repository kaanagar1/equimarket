const mongoose = require('mongoose');
const slugify = require('slugify');

const HorseSchema = new mongoose.Schema({
    // Temel Bilgiler
    name: {
        type: String,
        required: [true, 'At adı gereklidir'],
        trim: true,
        maxlength: [100, 'At adı 100 karakterden uzun olamaz']
    },
    slug: String,
    
    // TJK Bilgileri
    tjkRegistrationNo: {
        type: String,
        unique: true,
        sparse: true // null değerlere izin ver
    },
    isTjkVerified: {
        type: Boolean,
        default: false
    },

    // Irk ve Fiziksel Özellikler
    breed: {
        type: String,
        required: [true, 'Irk bilgisi gereklidir'],
        enum: ['ingiliz', 'arap', 'turk', 'diger']
    },
    breedDisplay: {
        type: String // "İngiliz (Thoroughbred)" gibi görüntüleme için
    },
    gender: {
        type: String,
        required: [true, 'Cinsiyet bilgisi gereklidir'],
        enum: ['erkek', 'disi', 'igdis']
    },
    color: {
        type: String,
        required: [true, 'Renk bilgisi gereklidir'],
        enum: ['doru', 'kir', 'yagiz', 'al', 'diger']
    },
    birthDate: {
        type: Date,
        required: [true, 'Doğum tarihi gereklidir']
    },
    age: {
        type: Number // Otomatik hesaplanacak
    },
    height: {
        type: Number, // cm cinsinden
        min: [100, 'Yükseklik 100 cm\'den az olamaz'],
        max: [200, 'Yükseklik 200 cm\'den fazla olamaz']
    },
    weight: {
        type: Number, // kg cinsinden
        min: [200, 'Ağırlık 200 kg\'dan az olamaz'],
        max: [800, 'Ağırlık 800 kg\'dan fazla olamaz']
    },

    // Soy Ağacı (Pedigree)
    pedigree: {
        sire: { type: String }, // Baba
        dam: { type: String },  // Anne
        sireOfSire: { type: String }, // Baba'nın babası
        damOfSire: { type: String },  // Baba'nın annesi
        sireOfDam: { type: String },  // Anne'nin babası
        damOfDam: { type: String }    // Anne'nin annesi
    },

    // Fiyat ve Konum
    price: {
        type: Number,
        required: [true, 'Fiyat bilgisi gereklidir'],
        min: [0, 'Fiyat negatif olamaz']
    },
    priceNegotiable: {
        type: Boolean,
        default: false
    },
    location: {
        city: { 
            type: String, 
            required: [true, 'Şehir bilgisi gereklidir'] 
        },
        district: { type: String }
    },

    // Açıklama ve Medya
    description: {
        type: String,
        required: [true, 'Açıklama gereklidir'],
        minlength: [50, 'Açıklama en az 50 karakter olmalıdır'],
        maxlength: [5000, 'Açıklama 5000 karakterden uzun olamaz']
    },
    images: [{
        url: { type: String, required: true },
        isMain: { type: Boolean, default: false },
        order: { type: Number, default: 0 }
    }],
    videos: [{
        url: { type: String },
        title: { type: String }
    }],

    // Yarış Geçmişi
    racingHistory: {
        totalRaces: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        places: { type: Number, default: 0 }, // 2. ve 3.lükler
        earnings: { type: Number, default: 0 },
        lastRaceDate: { type: Date },
        bestTime: { type: String } // "1:35.2" formatında
    },

    // Sağlık Bilgileri
    health: {
        vaccinated: { type: Boolean, default: false },
        lastVetCheck: { type: Date },
        healthNotes: { type: String }
    },

    // İlan Durumu
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'sold', 'expired', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    
    // İlan Paketi
    listingPackage: {
        type: String,
        enum: ['standard', 'featured', 'premium'],
        default: 'standard'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    featuredUntil: {
        type: Date
    },
    expiresAt: {
        type: Date
    },

    // İstatistikler
    stats: {
        views: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 }
    },

    // Satıcı
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Etiketler
    tags: [{ type: String }]

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Slug oluştur
HorseSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    
    // Yaş hesapla
    if (this.birthDate) {
        const today = new Date();
        const birthDate = new Date(this.birthDate);
        this.age = today.getFullYear() - birthDate.getFullYear();
    }

    // Irk görüntüleme adı
    const breedNames = {
        'ingiliz': 'İngiliz (Thoroughbred)',
        'arap': 'Arap',
        'turk': 'Türk Atı',
        'diger': 'Diğer'
    };
    this.breedDisplay = breedNames[this.breed] || this.breed;

    next();
});

// İndeksler
HorseSchema.index({ name: 'text', description: 'text' });
HorseSchema.index({ breed: 1, gender: 1, 'location.city': 1 });
HorseSchema.index({ price: 1 });
HorseSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
HorseSchema.index({ seller: 1 });

module.exports = mongoose.model('Horse', HorseSchema);
