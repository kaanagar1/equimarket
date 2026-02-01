const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    page: {
        type: String,
        default: '/'
    },
    userAgent: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    adminNotes: {
        type: String
    },
    status: {
        type: String,
        enum: ['new', 'reviewed', 'resolved'],
        default: 'new'
    }
}, {
    timestamps: true
});

// Index'ler
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
