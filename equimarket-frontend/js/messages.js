/**
 * EquiMarket Message Service
 * Mesajlaşma ve teklif yönetimi
 */

const MessageService = {
    /**
     * Konuşmaları getir
     */
    async getConversations() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.MESSAGES.CONVERSATIONS);
            return response;
        } catch (error) {
            console.error('GetConversations Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Konuşma mesajlarını getir
     */
    async getMessages(conversationId, page = 1) {
        try {
            const response = await api.get(
                API_CONFIG.ENDPOINTS.MESSAGES.MESSAGES(conversationId) + `?page=${page}`
            );
            return response;
        } catch (error) {
            console.error('GetMessages Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Mesaj gönder
     */
    async sendMessage(recipientId, horseId, content, type = 'text', offerAmount = null) {
        try {
            const data = { recipientId, horseId, content, type };
            if (type === 'offer' && offerAmount) {
                data.offerAmount = offerAmount;
            }
            
            const response = await api.post(API_CONFIG.ENDPOINTS.MESSAGES.SEND, data);
            return response;
        } catch (error) {
            console.error('SendMessage Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Teklife yanıt ver
     */
    async respondToOffer(messageId, response, counterAmount = null) {
        try {
            const data = { response };
            if (response === 'counter' && counterAmount) {
                data.counterAmount = counterAmount;
            }
            
            const result = await api.put(
                API_CONFIG.ENDPOINTS.MESSAGES.OFFER_RESPONSE(messageId),
                data
            );
            return result;
        } catch (error) {
            console.error('RespondToOffer Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Okunmamış mesaj sayısı
     */
    async getUnreadCount() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.MESSAGES.UNREAD_COUNT);
            return response.data?.unreadCount || 0;
        } catch (error) {
            console.error('GetUnreadCount Error:', error);
            return 0;
        }
    },

    /**
     * Tarih formatla
     */
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        // Bugün
        if (diff < 86400000 && d.getDate() === now.getDate()) {
            return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Dün
        if (diff < 172800000) {
            return 'Dün';
        }
        
        // Bu hafta
        if (diff < 604800000) {
            const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
            return days[d.getDay()];
        }
        
        // Daha eski
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    },

    /**
     * Mesaj balloon HTML oluştur
     */
    createMessageBubble(message, isOwn) {
        const time = new Date(message.createdAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (message.type === 'offer') {
            return this.createOfferBubble(message, isOwn);
        }

        if (message.type === 'system') {
            return `
                <div class="message-system">
                    <span>${message.content}</span>
                </div>
            `;
        }

        return `
            <div class="message ${isOwn ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${message.content}</p>
                    <span class="message-time">
                        ${time}
                        ${isOwn && message.isRead ? '<svg class="read-icon" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5M20 12L9 23l-5-5"/></svg>' : ''}
                    </span>
                </div>
            </div>
        `;
    },

    /**
     * Teklif mesajı HTML oluştur
     */
    createOfferBubble(message, isOwn) {
        const offer = message.offer;
        const statusClasses = {
            pending: 'offer-pending',
            accepted: 'offer-accepted',
            rejected: 'offer-rejected',
            countered: 'offer-countered'
        };
        const statusTexts = {
            pending: 'Bekliyor',
            accepted: 'Kabul Edildi',
            rejected: 'Reddedildi',
            countered: 'Karşı Teklif'
        };

        return `
            <div class="message ${isOwn ? 'sent' : 'received'}">
                <div class="offer-card ${statusClasses[offer.status]}">
                    <div class="offer-header">
                        <span class="offer-label">Teklif</span>
                        <span class="offer-status">${statusTexts[offer.status]}</span>
                    </div>
                    <div class="offer-amount">${HorseService.formatPrice(offer.amount)}</div>
                    ${offer.counterAmount ? `
                        <div class="offer-counter">
                            Karşı teklif: ${HorseService.formatPrice(offer.counterAmount)}
                        </div>
                    ` : ''}
                    ${!isOwn && offer.status === 'pending' ? `
                        <div class="offer-actions">
                            <button class="btn-accept" onclick="respondOffer('${message._id}', 'accept')">Kabul Et</button>
                            <button class="btn-counter" onclick="showCounterModal('${message._id}')">Karşı Teklif</button>
                            <button class="btn-reject" onclick="respondOffer('${message._id}', 'reject')">Reddet</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Konuşma listesi item HTML
     */
    createConversationItem(conversation, currentUserId) {
        const otherUser = conversation.participants.find(p => p._id !== currentUserId);
        const unread = conversation.unreadCount || 0;
        const time = this.formatDate(conversation.lastMessage?.createdAt || conversation.updatedAt);

        return `
            <div class="conversation-item ${unread > 0 ? 'unread' : ''}" 
                 data-id="${conversation._id}"
                 onclick="selectConversation('${conversation._id}')">
                <div class="conv-avatar">
                    ${otherUser?.avatar ? 
                        `<img src="${otherUser.avatar}" alt="${otherUser.name}">` :
                        `<span>${otherUser?.name?.substring(0, 2).toUpperCase() || '??'}</span>`
                    }
                    <span class="online-indicator"></span>
                </div>
                <div class="conv-info">
                    <div class="conv-header">
                        <span class="conv-name">${otherUser?.name || 'Bilinmeyen'}</span>
                        <span class="conv-time">${time}</span>
                    </div>
                    <p class="conv-preview">${conversation.lastMessage?.content || 'Henüz mesaj yok'}</p>
                    ${conversation.horse ? `
                        <span class="conv-horse">${conversation.horse.name}</span>
                    ` : ''}
                </div>
                ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
            </div>
        `;
    }
};

/**
 * Teklife yanıt ver (global)
 */
async function respondOffer(messageId, response) {
    const result = await MessageService.respondToOffer(messageId, response);
    if (result.success) {
        showToast(result.message);
        // Mesajları yenile
        if (typeof loadMessages === 'function') {
            loadMessages(currentConversationId);
        }
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Karşı teklif modal göster
 */
function showCounterModal(messageId) {
    const amount = prompt('Karşı teklif tutarını girin (₺):');
    if (amount && !isNaN(amount)) {
        respondOffer(messageId, 'counter', Number(amount));
    }
}
