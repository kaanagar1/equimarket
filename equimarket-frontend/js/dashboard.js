/**
 * EquiMarket Dashboard Handler
 * Satıcı ve Alıcı dashboard'ları için
 */

document.addEventListener('DOMContentLoaded', async function() {
    const { Auth, Horses, Users, Messages, Helpers } = window.EquiMarket;
    
    // Giriş kontrolü
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login_register.html';
        return;
    }
    
    const user = Auth.getCurrentUser();
    
    // Kullanıcı bilgilerini güncelle
    updateUserInfo(user);
    
    // Dashboard türüne göre veri yükle
    const isSeller = window.location.pathname.includes('seller');
    
    if (isSeller) {
        await loadSellerDashboard();
    } else {
        await loadBuyerDashboard();
    }
    
    // Okunmamış mesaj sayısı
    await loadUnreadCount();
    
    // Çıkış butonu
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
    
    // ============================================
    // KULLANICI BİLGİLERİ
    // ============================================
    function updateUserInfo(user) {
        // Avatar
        const avatars = document.querySelectorAll('.user-avatar, .sidebar-user-avatar');
        avatars.forEach(avatar => {
            if (user.avatar) {
                avatar.innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
            } else {
                avatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            }
        });
        
        // İsim
        const names = document.querySelectorAll('.user-name, .sidebar-user-name');
        names.forEach(el => el.textContent = user.name);
        
        // Rol
        const roles = document.querySelectorAll('.user-role, .sidebar-user-role');
        const roleText = user.role === 'seller' ? 
            (user.sellerInfo?.isVerifiedSeller ? 'Doğrulanmış Satıcı' : 'Satıcı') : 
            'Alıcı';
        roles.forEach(el => el.textContent = roleText);
    }
    
    // ============================================
    // SATICI DASHBOARD
    // ============================================
    async function loadSellerDashboard() {
        // İstatistikler
        try {
            const statsResult = await Users.getDashboardStats();
            if (statsResult.success) {
                const { listings, stats } = statsResult.data;
                
                // Kart istatistikleri
                updateStat('.stat-total-listings', listings.total);
                updateStat('.stat-active-listings', listings.active);
                updateStat('.stat-pending-listings', listings.pending);
                updateStat('.stat-sold-listings', listings.sold);
                updateStat('.stat-total-views', stats.totalViews);
                updateStat('.stat-total-favorites', stats.totalFavorites);
                updateStat('.stat-total-inquiries', stats.totalInquiries);
            }
        } catch (error) {
            console.error('Stats error:', error);
        }
        
        // Son ilanlar
        try {
            const listingsResult = await Horses.getMyListings({ limit: 5 });
            if (listingsResult.success) {
                renderMyListings(listingsResult.data);
            }
        } catch (error) {
            console.error('Listings error:', error);
        }
        
        // Son mesajlar
        await loadRecentMessages();
    }
    
    function updateStat(selector, value) {
        const el = document.querySelector(selector);
        if (el) {
            el.textContent = typeof value === 'number' ? value.toLocaleString('tr-TR') : value;
        }
    }
    
    function renderMyListings(listings) {
        const container = document.querySelector('.my-listings-list');
        if (!container) return;
        
        if (listings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Henüz ilanınız yok</p>
                    <a href="create_listing.html" class="btn btn-primary">İlk İlanınızı Oluşturun</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = listings.map(horse => `
            <div class="listing-row">
                <div class="listing-image">
                    ${horse.images?.[0]?.url ? 
                        `<img src="${horse.images[0].url}" alt="${horse.name}">` : 
                        '<div class="placeholder"></div>'
                    }
                </div>
                <div class="listing-info">
                    <h4>${horse.name}</h4>
                    <p>${Helpers.formatPrice(horse.price)}</p>
                </div>
                <div class="listing-status">
                    <span class="status-badge ${horse.status}">${getStatusText(horse.status)}</span>
                </div>
                <div class="listing-stats">
                    <span>${horse.stats?.views || 0} Gr.</span>
                    <span>${horse.stats?.favorites || 0} Fav.</span>
                </div>
                <div class="listing-actions">
                    <a href="horse_detail.html#id=${horse._id}" class="btn-icon" title="Görüntüle">Gör</a>
                    <a href="create_listing.html?edit=${horse._id}" class="btn-icon" title="Düzenle">Düz.</a>
                    <button class="btn-icon delete" onclick="deleteListing('${horse._id}')" title="Sil">Sil</button>
                </div>
            </div>
        `).join('');
    }
    
    function getStatusText(status) {
        const statusMap = {
            'active': 'Aktif',
            'pending': 'Onay Bekliyor',
            'draft': 'Taslak',
            'sold': 'Satıldı',
            'expired': 'Süresi Doldu',
            'rejected': 'Reddedildi'
        };
        return statusMap[status] || status;
    }
    
    window.deleteListing = async function(id) {
        if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
        
        try {
            const result = await Horses.deleteHorse(id);
            if (result.success) {
                Helpers.showToast('İlan silindi', 'success');
                location.reload();
            }
        } catch (error) {
            Helpers.showToast('İlan silinemedi', 'error');
        }
    };
    
    // ============================================
    // ALICI DASHBOARD
    // ============================================
    async function loadBuyerDashboard() {
        // Favoriler
        try {
            const favResult = await Users.getFavorites();
            if (favResult.success) {
                renderFavorites(favResult.data);
                updateStat('.stat-favorites-count', favResult.data.length);
            }
        } catch (error) {
            console.error('Favorites error:', error);
        }
        
        // Son görüntülenen (localStorage'dan)
        renderRecentlyViewed();
        
        // Son mesajlar
        await loadRecentMessages();
    }
    
    function renderFavorites(favorites) {
        const container = document.querySelector('.favorites-list');
        if (!container) return;
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Henüz favori ilanınız yok</p>
                    <a href="search_results.html" class="btn btn-primary">İlanları Keşfet</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = favorites.slice(0, 6).map(horse => `
            <a href="horse_detail.html#id=${horse._id}" class="favorite-card">
                <div class="favorite-image">
                    ${horse.images?.[0]?.url ? 
                        `<img src="${horse.images[0].url}" alt="${horse.name}">` : 
                        '<div class="placeholder"></div>'
                    }
                </div>
                <div class="favorite-info">
                    <h4>${horse.name}</h4>
                    <p class="price">${Helpers.formatPrice(horse.price)}</p>
                    <p class="location">${horse.location?.city || ''}</p>
                </div>
            </a>
        `).join('');
    }
    
    function renderRecentlyViewed() {
        const container = document.querySelector('.recently-viewed-list');
        if (!container) return;
        
        const recentlyViewed = JSON.parse(localStorage.getItem('equimarket_recently_viewed') || '[]');
        
        if (recentlyViewed.length === 0) {
            container.innerHTML = '<p class="empty-text">Henüz görüntülenen ilan yok</p>';
            return;
        }
        
        // Sadece son 5 tanesini göster
        container.innerHTML = recentlyViewed.slice(0, 5).map(item => `
            <a href="horse_detail.html#id=${item.id}" class="recent-item">
                <span class="recent-name">${item.name}</span>
                <span class="recent-time">${Helpers.timeAgo(item.viewedAt)}</span>
            </a>
        `).join('');
    }
    
    // ============================================
    // ORTAK FONKSİYONLAR
    // ============================================
    async function loadUnreadCount() {
        try {
            const result = await Messages.getUnreadCount();
            if (result.success && result.data.unreadCount > 0) {
                const badges = document.querySelectorAll('.messages-badge');
                badges.forEach(badge => {
                    badge.textContent = result.data.unreadCount;
                    badge.style.display = 'flex';
                });
            }
        } catch (error) {
            console.log('Unread count error');
        }
    }
    
    async function loadRecentMessages() {
        const container = document.querySelector('.recent-messages-list');
        if (!container) return;
        
        try {
            const result = await Messages.getConversations();
            if (result.success && result.data.length > 0) {
                container.innerHTML = result.data.slice(0, 5).map(conv => {
                    const otherUser = conv.participants.find(p => p._id !== user._id);
                    return `
                        <a href="messaging.html?conv=${conv._id}" class="message-item ${conv.unreadCount > 0 ? 'unread' : ''}">
                            <div class="message-avatar">
                                ${otherUser?.avatar ? 
                                    `<img src="${otherUser.avatar}" alt="">` : 
                                    otherUser?.name?.charAt(0) || '?'
                                }
                            </div>
                            <div class="message-content">
                                <div class="message-header">
                                    <span class="message-sender">${otherUser?.name || 'Kullanıcı'}</span>
                                    <span class="message-time">${Helpers.timeAgo(conv.lastMessage?.createdAt)}</span>
                                </div>
                                <p class="message-preview">${conv.lastMessage?.content || ''}</p>
                                <span class="message-horse">${conv.horse?.name || ''}</span>
                            </div>
                            ${conv.unreadCount > 0 ? `<span class="unread-dot"></span>` : ''}
                        </a>
                    `;
                }).join('');
            } else {
                container.innerHTML = '<p class="empty-text">Henüz mesajınız yok</p>';
            }
        } catch (error) {
            console.error('Messages error:', error);
        }
    }
});

// Dashboard CSS
const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
    .listing-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #f5f4f0;
        border-radius: 12px;
        margin-bottom: 12px;
    }
    .listing-row .listing-image {
        width: 60px;
        height: 60px;
        border-radius: 10px;
        overflow: hidden;
        flex-shrink: 0;
    }
    .listing-row .listing-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .listing-row .listing-info {
        flex: 1;
    }
    .listing-row .listing-info h4 {
        font-size: 15px;
        margin-bottom: 4px;
    }
    .status-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.sold { background: #dbeafe; color: #1e40af; }
    .status-badge.rejected { background: #fee2e2; color: #dc2626; }
    
    .message-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 10px;
        text-decoration: none;
        color: inherit;
        transition: background 0.2s;
    }
    .message-item:hover { background: #f5f4f0; }
    .message-item.unread { background: rgba(201, 165, 92, 0.1); }
    .message-avatar {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: #c9a55c;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2a2a2a;
        font-weight: 600;
        overflow: hidden;
    }
    .message-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .message-content { flex: 1; }
    .message-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .message-sender { font-weight: 600; font-size: 14px; }
    .message-time { font-size: 12px; color: #6b6b6b; }
    .message-preview { font-size: 13px; color: #6b6b6b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .message-horse { font-size: 12px; color: #1a3d2e; }
    .unread-dot {
        width: 8px;
        height: 8px;
        background: #1a3d2e;
        border-radius: 50%;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #6b6b6b;
    }
    .empty-text {
        color: #6b6b6b;
        font-size: 14px;
        text-align: center;
        padding: 20px;
    }
    
    .btn-icon {
        width: 32px;
        height: 32px;
        border: none;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
    }
    .btn-icon:hover { background: #f5f4f0; }
    .btn-icon.delete:hover { background: #fee2e2; }
`;
document.head.appendChild(dashboardStyle);
