const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Şikayet türü gereklidir'],
        enum: ['listing', 'user', 'message', 'review', 'other']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    targetType: {
        type: String,
        enum: ['Horse', 'User', 'Message', 'Review', null],
        default: null
    },
    reason: {
        type: String,
        required: [true, 'Şikayet nedeni gereklidir'],
        enum: [
            'spam',
            'inappropriate',
            'fraud',
            'fake_listing',
            'harassment',
            'copyright',
            'wrong_category',
            'duplicate',
            'other'
        ]
    },
    description: {
        type: String,
        required: [true, 'Açıklama gereklidir'],
        maxlength: [2000, 'Açıklama 2000 karakterden uzun olamaz']
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    contactEmail: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ targetId: 1, targetType: 1 });
ReportSchema.index({ reportedBy: 1 });

module.exports = mongoose.model('Report', ReportSchema);
