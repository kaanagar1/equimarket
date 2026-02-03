/**
 * Admin Atama Scripti
 * Kullanım: node src/scripts/makeAdmin.js <email>
 *
 * Örnek: node src/scripts/makeAdmin.js admin@equimarket.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeAdmin(email) {
    if (!email) {
        console.error('❌ Hata: E-posta adresi gerekli');
        console.log('Kullanım: node src/scripts/makeAdmin.js <email>');
        process.exit(1);
    }

    try {
        // Veritabanına bağlan
        console.log('🔄 Veritabanına bağlanılıyor...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Veritabanına bağlandı');

        // Kullanıcıyı bul
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ Kullanıcı bulunamadı: ${email}`);
            console.log('Önce bu e-posta ile kayıt olmanız gerekiyor.');
            process.exit(1);
        }

        // Zaten admin mi kontrol et
        if (user.role === 'admin') {
            console.log(`ℹ️ ${user.name} (${email}) zaten admin.`);
            process.exit(0);
        }

        // Admin yap
        user.role = 'admin';
        await user.save({ validateBeforeSave: false });

        console.log(`\n✅ ${user.name} (${email}) artık admin!`);
        console.log('\n📋 Kullanıcı Bilgileri:');
        console.log(`   İsim: ${user.name}`);
        console.log(`   E-posta: ${user.email}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Kayıt Tarihi: ${user.createdAt.toLocaleDateString('tr-TR')}`);

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    }
}

// Script'i çalıştır
const email = process.argv[2];
makeAdmin(email);
