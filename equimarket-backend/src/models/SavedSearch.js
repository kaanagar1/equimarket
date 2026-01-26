const mongoose = require('mongoose');

const SavedSearchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Arama adı gereklidir'],
        trim: true,
        maxlength: [100, 'Arama adı 100 karakterden uzun olamaz']
    },
    // Search filters
    filters: {
        breed: { type: String },
        gender: { type: String },
        color: { type: String },
        city: { type: String },
        minPrice: { type: Number },
        maxPrice: { type: Number },
        minAge: { type: Number },
        maxAge: { type: Number },
        search: { type: String } // Text search query
    },
    // Notification preferences
    notifications: {
        enabled: {
            type: Boolean,
            default: true
        },
        frequency: {
            type: String,
            enum: ['instant', 'daily', 'weekly'],
            default: 'daily'
        },
        lastNotifiedAt: {
            type: Date,
            default: null
        }
    },
    // Stats
    matchCount: {
        type: Number,
        default: 0
    },
    lastCheckedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
SavedSearchSchema.index({ user: 1, createdAt: -1 });
SavedSearchSchema.index({ 'notifications.enabled': 1, 'notifications.frequency': 1 });

module.exports = mongoose.model('SavedSearch', SavedSearchSchema);
