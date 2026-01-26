const Notification = require('../models/Notification');
const { sendTemplateEmail } = require('./emailService');
const User = require('../models/User');

// Bildirim türleri
const NOTIFICATION_TYPES = {
    MESSAGE: 'message',
    OFFER: 'offer',
    REVIEW: 'review',
    LISTING: 'listing',
    SYSTEM: 'system',
    FAVORITE: 'favorite'
};

// Bildirim oluştur
const createNotification = async (userId, type, title, message, link = null, relatedId = null) => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            message,
            link,
            relatedId
        });
        return notification;
    } catch (error) {
        console.error('CreateNotification Error:', error);
        return null;
    }
};

// Yeni mesaj bildirimi
const notifyNewMessage = async (recipientId, senderId, senderName, messagePreview, conversationId) => {
    const link = `/messaging.html?conversation=${conversationId}`;

    await createNotification(
        recipientId,
        NOTIFICATION_TYPES.MESSAGE,
        'Yeni Mesaj',
        `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
        link,
        conversationId
    );

    // Email gönder (kullanıcı ayarlarına göre)
    try {
        const recipient = await User.findById(recipientId);
        if (recipient?.notifications?.email) {
            const messageUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}${link}`;
            await sendTemplateEmail(recipient.email, 'newMessage', {
                senderName,
                previewText: messagePreview.substring(0, 100),
                messageUrl
            });
        }
    } catch (error) {
        console.error('Email notification error:', error);
    }
};

// Yeni teklif bildirimi
const notifyNewOffer = async (sellerId, buyerName, horseName, offerAmount, conversationId) => {
    const link = `/messaging.html?conversation=${conversationId}`;

    await createNotification(
        sellerId,
        NOTIFICATION_TYPES.OFFER,
        'Yeni Teklif',
        `${buyerName}, "${horseName}" için ₺${offerAmount.toLocaleString('tr-TR')} teklif verdi`,
        link,
        conversationId
    );

    // Email gönder
    try {
        const seller = await User.findById(sellerId);
        if (seller?.notifications?.email) {
            const messageUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}${link}`;
            await sendTemplateEmail(seller.email, 'newOffer', {
                senderName: buyerName,
                horseName,
                offerAmount,
                messageUrl
            });
        }
    } catch (error) {
        console.error('Email notification error:', error);
    }
};

// Teklif yanıtı bildirimi
const notifyOfferResponse = async (buyerId, sellerName, horseName, status, conversationId) => {
    const statusText = status === 'accepted' ? 'kabul etti' : 'reddetti';
    const link = `/messaging.html?conversation=${conversationId}`;

    await createNotification(
        buyerId,
        NOTIFICATION_TYPES.OFFER,
        `Teklif ${status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}`,
        `${sellerName}, "${horseName}" için teklifinizi ${statusText}`,
        link,
        conversationId
    );
};

// Yeni yorum bildirimi
const notifyNewReview = async (sellerId, reviewerName, rating) => {
    const link = `/seller_profile.html?id=${sellerId}`;

    await createNotification(
        sellerId,
        NOTIFICATION_TYPES.REVIEW,
        'Yeni Değerlendirme',
        `${reviewerName} size ${rating} yıldız verdi`,
        link
    );
};

// İlan onaylandı bildirimi
const notifyListingApproved = async (sellerId, horseName, horseId) => {
    const link = `/horse_detail.html?id=${horseId}`;

    await createNotification(
        sellerId,
        NOTIFICATION_TYPES.LISTING,
        'İlan Onaylandı',
        `"${horseName}" ilanınız onaylandı ve yayında!`,
        link,
        horseId
    );

    // Email gönder
    try {
        const seller = await User.findById(sellerId);
        if (seller) {
            const listingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}${link}`;
            await sendTemplateEmail(seller.email, 'listingApproved', {
                userName: seller.name,
                horseName,
                listingUrl
            });
        }
    } catch (error) {
        console.error('Email notification error:', error);
    }
};

// İlan reddedildi bildirimi
const notifyListingRejected = async (sellerId, horseName, reason) => {
    const link = `/dashboard.html`;

    await createNotification(
        sellerId,
        NOTIFICATION_TYPES.LISTING,
        'İlan Reddedildi',
        `"${horseName}" ilanınız reddedildi. Neden: ${reason}`,
        link
    );

    // Email gönder
    try {
        const seller = await User.findById(sellerId);
        if (seller) {
            await sendTemplateEmail(seller.email, 'listingRejected', {
                userName: seller.name,
                horseName,
                reason
            });
        }
    } catch (error) {
        console.error('Email notification error:', error);
    }
};

// Favoriye eklendi bildirimi
const notifyFavorited = async (sellerId, userName, horseName, horseId) => {
    const link = `/horse_detail.html?id=${horseId}`;

    await createNotification(
        sellerId,
        NOTIFICATION_TYPES.FAVORITE,
        'İlanınız Beğenildi',
        `${userName}, "${horseName}" ilanınızı favorilerine ekledi`,
        link,
        horseId
    );
};

module.exports = {
    NOTIFICATION_TYPES,
    createNotification,
    notifyNewMessage,
    notifyNewOffer,
    notifyOfferResponse,
    notifyNewReview,
    notifyListingApproved,
    notifyListingRejected,
    notifyFavorited
};
