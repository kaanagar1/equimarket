const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { generalLimiter } = require('./middlewares/rateLimit');
const { initScheduledJobs } = require('./jobs/scheduledJobs');
const { initSocket } = require('./config/socket');

// Express app
const app = express();

// Veritabanı bağlantısı
connectDB();

// Zamanlanmış görevleri başlat
initScheduledJobs();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Genel rate limiting (tüm API'ler için)
app.use('/api', generalLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/horses', require('./routes/horses'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/support', require('./routes/support'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));

// Ana sayfa
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'EquiMarket API v1.0',
        documentation: '/api-docs',
        endpoints: {
            auth: '/api/auth',
            horses: '/api/horses',
            messages: '/api/messages',
            users: '/api/users'
        }
    });
});

// API Docs (basit)
app.get('/api-docs', (req, res) => {
    res.json({
        title: 'EquiMarket API Documentation',
        version: '1.0.0',
        description: 'Türkiye\'nin Yarış Atı Pazaryeri API\'si',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Yeni kullanıcı kaydı',
                'POST /api/auth/login': 'Kullanıcı girişi',
                'GET /api/auth/me': 'Mevcut kullanıcı bilgisi (Auth)',
                'PUT /api/auth/password': 'Şifre güncelleme (Auth)'
            },
            horses: {
                'GET /api/horses': 'Tüm ilanları listele (filtre destekli)',
                'GET /api/horses/:id': 'İlan detayı',
                'POST /api/horses': 'Yeni ilan oluştur (Seller)',
                'PUT /api/horses/:id': 'İlan güncelle (Owner)',
                'DELETE /api/horses/:id': 'İlan sil (Owner)',
                'GET /api/horses/user/my-listings': 'Kullanıcının ilanları (Auth)',
                'POST /api/horses/:id/favorite': 'Favorilere ekle/çıkar (Auth)'
            },
            messages: {
                'GET /api/messages/conversations': 'Konuşmaları listele (Auth)',
                'GET /api/messages/conversations/:id': 'Konuşma mesajları (Auth)',
                'POST /api/messages/send': 'Mesaj gönder (Auth)',
                'PUT /api/messages/:id/offer-response': 'Teklife yanıt (Auth)',
                'GET /api/messages/unread-count': 'Okunmamış mesaj sayısı (Auth)'
            },
            users: {
                'GET /api/users/profile': 'Profil bilgileri (Auth)',
                'PUT /api/users/profile': 'Profil güncelle (Auth)',
                'GET /api/users/seller/:id': 'Satıcı profili (Public)',
                'GET /api/users/favorites': 'Favoriler (Auth)',
                'GET /api/users/dashboard/stats': 'Dashboard istatistikleri (Seller)'
            }
        },
        filters: {
            horses: {
                breed: 'ingiliz, arap, turk, diger',
                gender: 'erkek, disi, igdis',
                color: 'doru, kir, yagiz, al, diger',
                city: 'Şehir adı',
                minPrice: 'Minimum fiyat',
                maxPrice: 'Maximum fiyat',
                minAge: 'Minimum yaş',
                maxAge: 'Maximum yaş',
                search: 'Arama metni',
                sort: 'price_asc, price_desc, newest, oldest',
                page: 'Sayfa numarası',
                limit: 'Sayfa başına sonuç'
            }
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// HTTP Server ve Socket.io başlat
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.io'yu başlat
initSocket(server);

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🐎 EquiMarket API Server                 ║
║                                            ║
║   Port: ${PORT}                              ║
║   Mode: ${process.env.NODE_ENV || 'development'}                     ║
║   URL:  http://localhost:${PORT}              ║
║   Socket.io: Enabled                       ║
║                                            ║
╚════════════════════════════════════════════╝
    `);
});

module.exports = { app, server };
