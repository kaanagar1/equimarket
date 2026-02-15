/**
 * Horse Service
 * Business logic for horse listings
 */

const Horse = require('../models/Horse');
const User = require('../models/User');
const { notifyFavorited } = require('../utils/notificationHelper');

class HorseService {
    /**
     * Filter objesi oluştur (query params'dan)
     */
    static buildFilters(query) {
        const { breed, gender, color, city, minPrice, maxPrice, minAge, maxAge, search, featured, seller, status } = query;

        let filter = {};

        // Varsayılan olarak sadece aktif ilanlar (override edilebilir)
        if (status) {
            filter.status = status;
        } else if (!seller) {
            filter.status = 'active';
        }

        if (breed) filter.breed = breed;
        if (gender) filter.gender = gender;
        if (color) filter.color = color;
        if (city) filter['location.city'] = city;
        if (seller) filter.seller = seller;

        // Fiyat aralığı
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Yaş aralığı
        if (minAge || maxAge) {
            filter.age = {};
            if (minAge) filter.age.$gte = Number(minAge);
            if (maxAge) filter.age.$lte = Number(maxAge);
        }

        // Metin araması
        if (search) {
            filter.$text = { $search: search };
        }

        // Öne çıkan
        if (featured === 'true') {
            filter.isFeatured = true;
        }

        return filter;
    }

    /**
     * Sıralama seçeneği oluştur
     */
    static buildSortOption(sort) {
        const sortOptions = {
            'price_asc': { price: 1 },
            'price_desc': { price: -1 },
            'newest': { createdAt: -1 },
            'oldest': { createdAt: 1 }
        };
        return sortOptions[sort] || { isFeatured: -1, createdAt: -1 };
    }

    /**
     * Sahiplik kontrolü
     * @returns {Object} { isOwner: boolean, isAdmin: boolean, canManage: boolean }
     */
    static checkOwnership(horse, user) {
        if (!horse || !user) {
            return { isOwner: false, isAdmin: false, canManage: false };
        }

        const isOwner = horse.seller.toString() === user.id;
        const isAdmin = user.role === 'admin';
        const canManage = isOwner || isAdmin;

        return { isOwner, isAdmin, canManage };
    }

    /**
     * İlanı getir ve sahiplik kontrolü yap
     * @throws {Error} İlan bulunamazsa veya yetki yoksa
     */
    static async getHorseWithOwnershipCheck(horseId, user) {
        const horse = await Horse.findById(horseId);

        if (!horse) {
            const error = new Error('İlan bulunamadı');
            error.statusCode = 404;
            throw error;
        }

        const { canManage } = this.checkOwnership(horse, user);

        if (!canManage) {
            const error = new Error('Bu işlem için yetkiniz yok');
            error.statusCode = 403;
            throw error;
        }

        return horse;
    }

    /**
     * Görüntülenme sayısını artır
     */
    static async incrementViewCount(horse) {
        horse.stats.views += 1;
        await horse.save({ validateBeforeSave: false });
    }

    /**
     * Yeni ilan için varsayılan değerleri ayarla
     */
    static setCreateDefaults(data, userId) {
        const duration = data.listingDuration || 30;
        return {
            ...data,
            seller: userId,
            status: 'pending',
            listingDuration: duration,
            expiresAt: duration === 0 ? null : (data.expiresAt || this.calculateExpiryDate(duration))
        };
    }

    /**
     * Son kullanma tarihi hesapla
     */
    static calculateExpiryDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }

    /**
     * Hassas alanlar değişti mi kontrol et
     */
    static hasSensitiveChanges(updateData) {
        const sensitiveFields = ['name', 'price', 'description', 'images'];
        return sensitiveFields.some(field => updateData[field] !== undefined);
    }

    /**
     * Favori ekle/çıkar
     * @returns {Object} { isFavorited: boolean, message: string }
     */
    static async toggleFavorite(horseId, userId) {
        const horse = await Horse.findById(horseId);
        if (!horse) {
            const error = new Error('İlan bulunamadı');
            error.statusCode = 404;
            throw error;
        }

        const user = await User.findById(userId);
        const favoriteIndex = user.favorites.indexOf(horseId);

        let message;
        let isFavoriting = false;

        if (favoriteIndex > -1) {
            // Favorilerden çıkar
            user.favorites.splice(favoriteIndex, 1);
            horse.stats.favorites = Math.max(0, horse.stats.favorites - 1);
            message = 'Favorilerden çıkarıldı';
        } else {
            // Favorilere ekle
            user.favorites.push(horseId);
            horse.stats.favorites += 1;
            message = 'Favorilere eklendi';
            isFavoriting = true;
        }

        await Promise.all([
            user.save({ validateBeforeSave: false }),
            horse.save({ validateBeforeSave: false })
        ]);

        // Bildirim gönder (kendi ilanına favori eklemiyorsa)
        if (isFavoriting && horse.seller.toString() !== userId) {
            await notifyFavorited(
                horse.seller.toString(),
                user.name,
                horse.name,
                horse._id.toString()
            );
        }

        return {
            isFavorited: isFavoriting,
            message
        };
    }

    /**
     * İlan süresini yenile
     */
    static async renewListing(horseId, user) {
        const horse = await this.getHorseWithOwnershipCheck(horseId, user);

        // Sadece active veya expired ilanlar yenilenebilir
        if (!['active', 'expired'].includes(horse.status)) {
            const error = new Error('Sadece aktif veya süresi dolmuş ilanlar yenilenebilir');
            error.statusCode = 400;
            throw error;
        }

        const duration = horse.listingDuration || 30;
        horse.expiresAt = duration === 0 ? null : this.calculateExpiryDate(duration);
        horse.status = 'active';
        await horse.save({ validateBeforeSave: false });

        return {
            expiresAt: horse.expiresAt,
            status: horse.status
        };
    }

    /**
     * İlanı satıldı olarak işaretle
     */
    static async markAsSold(horseId, user) {
        const horse = await this.getHorseWithOwnershipCheck(horseId, user);

        horse.status = 'sold';
        await horse.save({ validateBeforeSave: false });

        return horse;
    }
}

module.exports = HorseService;
