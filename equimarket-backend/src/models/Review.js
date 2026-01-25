const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Değerlendiren kullanıcı
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Değerlendirilen satıcı
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // İlgili ilan (opsiyonel - hangi alışverişle ilgili)
    horse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horse',
        default: null
    },
    // Puan (1-5 yıldız)
    rating: {
        type: Number,
        required: [true, 'Puan zorunludur'],
        min: [1, 'Puan en az 1 olmalıdır'],
        max: [5, 'Puan en fazla 5 olabilir']
    },
    // Yorum metni
    comment: {
        type: String,
        required: [true, 'Yorum zorunludur'],
        minlength: [10, 'Yorum en az 10 karakter olmalıdır'],
        maxlength: [500, 'Yorum en fazla 500 karakter olabilir']
    },
    // Alt kategoriler (opsiyonel detaylı puanlama)
    ratings: {
        communication: { type: Number, min: 1, max: 5 }, // İletişim
        accuracy: { type: Number, min: 1, max: 5 },      // Doğruluk
        shipping: { type: Number, min: 1, max: 5 }       // Teslimat
    },
    // Satıcı yanıtı
    sellerResponse: {
        comment: { type: String, maxlength: 300 },
        createdAt: { type: Date }
    },
    // Durum
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'approved' // Otomatik onay, moderasyon istenirse 'pending' yapılır
    },
    // Yararlı bulma sayısı
    helpfulCount: {
        type: Number,
        default: 0
    },
    // Yararlı bulanlar
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Admin notu (red/gizleme durumunda)
    adminNote: String
}, {
    timestamps: true
});

// Bir kullanıcı aynı satıcıyı sadece bir kez değerlendirebilir
reviewSchema.index({ reviewer: 1, seller: 1 }, { unique: true });

// Satıcıya göre sorgular için index
reviewSchema.index({ seller: 1, status: 1, createdAt: -1 });

// Yeni değerlendirme sonrası satıcının ortalama puanını güncelle
reviewSchema.statics.calculateAverageRating = async function(sellerId) {
    const stats = await this.aggregate([
        { $match: { seller: sellerId, status: 'approved' } },
        {
            $group: {
                _id: '$seller',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('User').findByIdAndUpdate(sellerId, {
            rating: Math.round(stats[0].averageRating * 10) / 10, // 1 ondalık
            totalReviews: stats[0].totalReviews
        });
    } else {
        await mongoose.model('User').findByIdAndUpdate(sellerId, {
            rating: 0,
            totalReviews: 0
        });
    }
};

// Save sonrası ortalama güncelle
reviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.seller);
});

// Remove sonrası ortalama güncelle
reviewSchema.post('remove', function() {
    this.constructor.calculateAverageRating(this.seller);
});

module.exports = mongoose.model('Review', reviewSchema);
