const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    // Banner türü: hero (ana slider), side-left (sol reklam), side-right (sağ reklam)
    type: {
        type: String,
        enum: ['hero', 'side-left', 'side-right'],
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    subtitle: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    linkUrl: {
        type: String,
        default: ''
    },
    // Hero banner'da öne çıkan atlar (horse ID'leri)
    featuredHorses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horse'
    }],
    // Sıralama (slider'da kaçıncı)
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // İstatistikler
    stats: {
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
