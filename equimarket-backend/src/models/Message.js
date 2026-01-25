const mongoose = require('mongoose');

// Conversation (Konuşma) Schema
const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    horse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horse',
        required: true
    },
    lastMessage: {
        content: { type: String },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Message (Mesaj) Schema
const MessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Mesaj içeriği gereklidir'],
        maxlength: [2000, 'Mesaj 2000 karakterden uzun olamaz']
    },
    type: {
        type: String,
        enum: ['text', 'offer', 'image', 'system'],
        default: 'text'
    },
    // Teklif mesajları için
    offer: {
        amount: { type: Number },
        status: { 
            type: String, 
            enum: ['pending', 'accepted', 'rejected', 'countered'],
            default: 'pending'
        },
        counterAmount: { type: Number },
        respondedAt: { type: Date }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    attachments: [{
        url: { type: String },
        type: { type: String },
        name: { type: String }
    }]
}, {
    timestamps: true
});

// Mesaj gönderildiğinde konuşmayı güncelle
MessageSchema.post('save', async function() {
    await mongoose.model('Conversation').findByIdAndUpdate(
        this.conversation,
        {
            lastMessage: {
                content: this.content,
                sender: this.sender,
                createdAt: this.createdAt
            }
        }
    );
});

// İndeksler
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ horse: 1 });
ConversationSchema.index({ updatedAt: -1 });

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.model('Message', MessageSchema);

module.exports = { Conversation, Message };
