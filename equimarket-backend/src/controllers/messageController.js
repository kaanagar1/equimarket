const { Conversation, Message } = require('../models/Message');
const Horse = require('../models/Horse');
const User = require('../models/User');

// @desc    Konuşmaları listele
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
            isActive: true
        })
        .populate('participants', 'name avatar sellerInfo.isVerifiedSeller')
        .populate('horse', 'name slug images price')
        .sort({ updatedAt: -1 });

        // Okunmamış sayılarını ekle
        const conversationsWithUnread = conversations.map(conv => {
            const convObj = conv.toObject();
            convObj.unreadCount = conv.unreadCount.get(req.user.id.toString()) || 0;
            return convObj;
        });

        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversationsWithUnread
        });

    } catch (error) {
        console.error('GetConversations Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Konuşma mesajlarını getir
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Konuşma bulunamadı'
            });
        }

        // Katılımcı kontrolü
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Bu konuşmaya erişim yetkiniz yok'
            });
        }

        // Mesajları getir
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Okunmamış mesajları okundu olarak işaretle
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user.id },
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        // Okunmamış sayısını sıfırla
        conversation.unreadCount.set(req.user.id.toString(), 0);
        await conversation.save();

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages.reverse() // Kronolojik sıra
        });

    } catch (error) {
        console.error('GetMessages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Yeni konuşma başlat veya mesaj gönder
// @route   POST /api/messages/send
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, horseId, content, type = 'text', offerAmount } = req.body;

        if (!content && type !== 'offer') {
            return res.status(400).json({
                success: false,
                message: 'Mesaj içeriği gerekli'
            });
        }

        // At ve alıcı kontrolü
        const horse = await Horse.findById(horseId);
        if (!horse) {
            return res.status(404).json({
                success: false,
                message: 'İlan bulunamadı'
            });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Alıcı bulunamadı'
            });
        }

        // Kendi kendine mesaj kontrolü
        if (recipientId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Kendinize mesaj gönderemezsiniz'
            });
        }

        // Mevcut konuşmayı bul veya yeni oluştur
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, recipientId] },
            horse: horseId
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user.id, recipientId],
                horse: horseId,
                unreadCount: new Map([[recipientId, 1]])
            });
        } else {
            // Okunmamış sayısını artır
            const currentUnread = conversation.unreadCount.get(recipientId) || 0;
            conversation.unreadCount.set(recipientId, currentUnread + 1);
            await conversation.save();
        }

        // Mesaj oluştur
        const messageData = {
            conversation: conversation._id,
            sender: req.user.id,
            content: type === 'offer' ? `₺${offerAmount.toLocaleString('tr-TR')} teklif gönderildi` : content,
            type
        };

        // Teklif bilgisi ekle
        if (type === 'offer' && offerAmount) {
            messageData.offer = {
                amount: offerAmount,
                status: 'pending'
            };
            // İlan istatistiklerini güncelle
            horse.stats.inquiries += 1;
            await horse.save({ validateBeforeSave: false });
        }

        const message = await Message.create(messageData);

        // Populate ile döndür
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name avatar');

        res.status(201).json({
            success: true,
            data: {
                conversation: conversation._id,
                message: populatedMessage
            }
        });

    } catch (error) {
        console.error('SendMessage Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Teklife yanıt ver
// @route   PUT /api/messages/:messageId/offer-response
// @access  Private
exports.respondToOffer = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { response, counterAmount } = req.body; // 'accept', 'reject', 'counter'

        const message = await Message.findById(messageId);

        if (!message || message.type !== 'offer') {
            return res.status(404).json({
                success: false,
                message: 'Teklif bulunamadı'
            });
        }

        // Teklif sahibi yanıt veremez
        if (message.sender.toString() === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Kendi teklifinize yanıt veremezsiniz'
            });
        }

        // Zaten yanıtlanmış mı kontrol et
        if (message.offer.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Bu teklif zaten yanıtlanmış'
            });
        }

        // Yanıtı güncelle
        message.offer.status = response === 'counter' ? 'countered' : response === 'accept' ? 'accepted' : 'rejected';
        message.offer.respondedAt = new Date();
        
        if (response === 'counter' && counterAmount) {
            message.offer.counterAmount = counterAmount;
        }

        await message.save();

        // Sistem mesajı oluştur
        const statusMessages = {
            accepted: 'Teklif kabul edildi',
            rejected: 'Teklif reddedildi',
            countered: `Karşı teklif: ₺${counterAmount?.toLocaleString('tr-TR')}`
        };

        await Message.create({
            conversation: message.conversation,
            sender: req.user.id,
            content: statusMessages[message.offer.status],
            type: 'system'
        });

        res.status(200).json({
            success: true,
            message: 'Teklif yanıtlandı',
            data: message
        });

    } catch (error) {
        console.error('RespondToOffer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// @desc    Okunmamış mesaj sayısı
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id,
            isActive: true
        });

        let totalUnread = 0;
        conversations.forEach(conv => {
            totalUnread += conv.unreadCount.get(req.user.id.toString()) || 0;
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: totalUnread }
        });

    } catch (error) {
        console.error('GetUnreadCount Error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};
