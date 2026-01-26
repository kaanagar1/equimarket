const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Bağlandı: ${conn.connection.host}`);

        // Mevcut kullanıcılara sellerInfo ekle (eğer yoksa)
        const User = require('../models/User');
        const result = await User.updateMany(
            { sellerInfo: { $exists: false } },
            { $set: { sellerInfo: { memberSince: new Date() } } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ ${result.modifiedCount} kullanıcıya sellerInfo eklendi`);
        }
    } catch (error) {
        console.error(`❌ MongoDB Bağlantı Hatası: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
