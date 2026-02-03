/**
 * Rol Migration Scripti
 * Mevcut buyer/seller rollerini user'a dönüştürür
 *
 * Kullanım: node src/scripts/migrateRoles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrateRoles() {
    try {
        // Veritabanına bağlan
        console.log('🔄 Veritabanına bağlanılıyor...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Veritabanına bağlandı\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Mevcut durumu göster
        const buyerCount = await usersCollection.countDocuments({ role: 'buyer' });
        const sellerCount = await usersCollection.countDocuments({ role: 'seller' });
        const userCount = await usersCollection.countDocuments({ role: 'user' });
        const adminCount = await usersCollection.countDocuments({ role: 'admin' });

        console.log('📊 Mevcut Durum:');
        console.log(`   buyer: ${buyerCount}`);
        console.log(`   seller: ${sellerCount}`);
        console.log(`   user: ${userCount}`);
        console.log(`   admin: ${adminCount}\n`);

        if (buyerCount === 0 && sellerCount === 0) {
            console.log('✅ Migration gerekli değil - tüm roller zaten güncel.');
            return;
        }

        // buyer -> user
        if (buyerCount > 0) {
            const buyerResult = await usersCollection.updateMany(
                { role: 'buyer' },
                { $set: { role: 'user' } }
            );
            console.log(`✅ ${buyerResult.modifiedCount} buyer -> user olarak güncellendi`);
        }

        // seller -> user
        if (sellerCount > 0) {
            const sellerResult = await usersCollection.updateMany(
                { role: 'seller' },
                { $set: { role: 'user' } }
            );
            console.log(`✅ ${sellerResult.modifiedCount} seller -> user olarak güncellendi`);
        }

        // Sonucu göster
        const newUserCount = await usersCollection.countDocuments({ role: 'user' });
        const newAdminCount = await usersCollection.countDocuments({ role: 'admin' });

        console.log('\n📊 Yeni Durum:');
        console.log(`   user: ${newUserCount}`);
        console.log(`   admin: ${newAdminCount}`);
        console.log('\n✅ Migration tamamlandı!');

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    }
}

migrateRoles();
