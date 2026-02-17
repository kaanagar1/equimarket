/**
 * EquiMarket User Service
 * Profil, favoriler ve dashboard yönetimi
 */

const UserService = {
    /**
     * Profil bilgilerini getir
     */
    async getProfile() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
            return response;
        } catch (error) {
            console.error('GetProfile Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Profil güncelle
     */
    async updateProfile(data) {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.USERS.PROFILE, data);
            if (response.success) {
                api.setUser(response.data);
            }
            return response;
        } catch (error) {
            console.error('UpdateProfile Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Satıcı profilini getir (public)
     */
    async getSellerProfile(sellerId) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.USERS.SELLER(sellerId), false);
            return response;
        } catch (error) {
            console.error('GetSellerProfile Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Favorileri getir
     */
    async getFavorites() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.USERS.FAVORITES);
            return response;
        } catch (error) {
            console.error('GetFavorites Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Dashboard istatistiklerini getir
     */
    async getDashboardStats() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.USERS.DASHBOARD_STATS);
            return response;
        } catch (error) {
            console.error('GetDashboardStats Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Hesabı dondur
     */
    async deactivateAccount() {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.USERS.DEACTIVATE, {});
            if (response.success) {
                api.removeToken();
            }
            return response;
        } catch (error) {
            console.error('DeactivateAccount Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Bildirim ayarlarını güncelle
     */
    async updateNotifications(settings) {
        return this.updateProfile({ notifications: settings });
    },

    /**
     * Kullanıcı bilgilerini getir (public)
     */
    async getUser(userId) {
        try {
            const response = await api.get('/users/' + userId, false);
            return response;
        } catch (error) {
            console.error('GetUser Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Bildirimleri getir
     */
    async getNotifications() {
        try {
            const response = await api.get('/notifications');
            return response;
        } catch (error) {
            console.error('GetNotifications Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Bildirimi okundu olarak işaretle
     */
    async markNotificationRead(notificationId) {
        try {
            const response = await api.put('/notifications/' + notificationId + '/read');
            return response;
        } catch (error) {
            console.error('MarkNotificationRead Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    async markAllNotificationsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            return response;
        } catch (error) {
            console.error('MarkAllNotificationsRead Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Favorilere ekle/çıkar
     */
    async toggleFavorite(horseId) {
        try {
            const response = await api.post('/users/favorites/' + horseId);
            return response;
        } catch (error) {
            console.error('ToggleFavorite Error:', error);
            return { success: false, message: error.message };
        }
    }
};

/**
 * Dashboard için istatistik kartı oluştur
 */
function createStatCard(title, value, icon, change = null) {
    return `
        <div class="stat-card">
            <div class="stat-icon">${icon}</div>
            <div class="stat-info">
                <h3>${value}</h3>
                <p>${title}</p>
                ${change ? `
                    <span class="stat-change ${change > 0 ? 'positive' : 'negative'}">
                        ${change > 0 ? '+' : ''}${change}%
                    </span>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Grafik oluştur (basit bar chart)
 */
function createSimpleChart(data, container) {
    const maxValue = Math.max(...data.map(d => d.views));
    
    const html = data.map(d => `
        <div class="chart-bar-container">
            <div class="chart-bar" style="height: ${(d.views / maxValue) * 100}%">
                <span class="chart-value">${d.views}</span>
            </div>
            <span class="chart-label">${d.day}</span>
        </div>
    `).join('');

    if (container) {
        container.innerHTML = `<div class="simple-chart">${html}</div>`;
    }
    
    return html;
}

/**
 * Korumalı sayfa kontrolü
 * Auth gerektiren sayfalarda kullan
 */
function requireAuth(redirectUrl = 'login_register.html') {
    if (!api.isLoggedIn()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Satıcı sayfası kontrolü
 */
function requireSeller(redirectUrl = 'dashboard.html') {
    if (!requireAuth()) return false;
    
    const user = api.getUser();
    if (user?.role !== 'seller' && user?.role !== 'admin') {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}
