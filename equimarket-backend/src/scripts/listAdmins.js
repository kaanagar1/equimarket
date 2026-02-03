/**
 * Admin Listeleme Scripti
 * Kullanım: node src/scripts/listAdmins.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function listAdmins() {
    try {
        // Veritabanına bağlan
        console.log('🔄 Veritabanına bağlanılıyor...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Veritabanına bağlandı\n');

        // Tüm adminleri bul
        const admins = await User.find({ role: 'admin' }).select('name email createdAt lastLogin');

        if (admins.length === 0) {
            console.log('⚠️ Sistemde henüz admin bulunmuyor.');
            console.log('\nAdmin eklemek için:');
            console.log('  node src/scripts/makeAdmin.js <email>');
        } else {
            console.log(`📋 Sistemdeki Adminler (${admins.length} kişi):\n`);
            admins.forEach((admin, index) => {
                console.log(`${index + 1}. ${admin.name}`);
                console.log(`   E-posta: ${admin.email}`);
                console.log(`   Kayıt: ${admin.createdAt.toLocaleDateString('tr-TR')}`);
                if (admin.lastLogin) {
                    console.log(`   Son Giriş: ${admin.lastLogin.toLocaleDateString('tr-TR')}`);
                }
                console.log('');
            });
        }

        // Toplam kullanıcı sayısı
        const totalUsers = await User.countDocuments();
        const regularUsers = await User.countDocuments({ role: 'user' });

        console.log('📊 Kullanıcı İstatistikleri:');
        console.log(`   Toplam: ${totalUsers}`);
        console.log(`   Admin: ${admins.length}`);
        console.log(`   Kullanıcı: ${regularUsers}`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    }
}

listAdmins();
