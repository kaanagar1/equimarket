const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ad gereklidir'],
        trim: true,
        maxlength: [100, 'Ad 100 karakterden uzun olamaz']
    },
    email: {
        type: String,
        required: [true, 'E-posta gereklidir'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Geçerli bir e-posta girin']
    },
    phone: {
        type: String,
        default: null
    },
    subject: {
        type: String,
        required: [true, 'Konu gereklidir'],
        trim: true,
        maxlength: [200, 'Konu 200 karakterden uzun olamaz']
    },
    message: {
        type: String,
        required: [true, 'Mesaj gereklidir'],
        maxlength: [5000, 'Mesaj 5000 karakterden uzun olamaz']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'closed'],
        default: 'new'
    },
    adminReply: {
        type: String,
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
