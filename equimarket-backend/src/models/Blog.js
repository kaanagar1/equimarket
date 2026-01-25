const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    // Temel Bilgiler
    title: {
        type: String,
        required: [true, 'Başlık gereklidir'],
        trim: true,
        maxlength: [200, 'Başlık 200 karakterden uzun olamaz']
    },
    slug: {
        type: String,
        unique: true
    },
    excerpt: {
        type: String,
        maxlength: [500, 'Özet 500 karakterden uzun olamaz']
    },
    content: {
        type: String,
        required: [true, 'İçerik gereklidir']
    },
    
    // Medya
    coverImage: {
        type: String,
        default: null
    },
    
    // Kategori ve Etiketler
    category: {
        type: String,
        enum: ['haberler', 'rehber', 'bakım', 'eğitim', 'yarış', 'sağlık', 'beslenme', 'ekipman', 'etkinlik', 'diğer'],
        default: 'diğer'
    },
    tags: [{
        type: String,
        trim: true
    }],
    
    // Yazar
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Durum
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
    },
    
    // İstatistikler
    views: {
        type: Number,
        default: 0
    },
    
    // SEO
    metaTitle: {
        type: String,
        maxlength: [70, 'Meta başlık 70 karakterden uzun olamaz']
    },
    metaDescription: {
        type: String,
        maxlength: [160, 'Meta açıklama 160 karakterden uzun olamaz']
    },
    
    // Öne Çıkarma
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Slug oluşturma
BlogSchema.pre('save', function(next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        // Unique slug için timestamp ekle
        this.slug += '-' + Date.now().toString(36);
    }
    
    // Yayınlanma tarihi
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

// Özet otomatik oluşturma
BlogSchema.pre('save', function(next) {
    if (!this.excerpt && this.content) {
        // HTML taglarını temizle ve ilk 200 karakteri al
        const plainText = this.content.replace(/<[^>]*>/g, '');
        this.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    next();
});

module.exports = mongoose.model('Blog', BlogSchema);
