/**
 * EquiMarket Auth Service
 * Kullanıcı giriş, kayıt ve oturum yönetimi
 */

const AuthService = {
    /**
     * Kullanıcı kaydı
     */
    async register(userData) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData, false);
            
            if (response.success) {
                api.setToken(response.token);
                api.setUser(response.data);
                return { success: true, user: response.data };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Kullanıcı girişi
     */
    async login(email, password) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password }, false);
            
            if (response.success) {
                api.setToken(response.token);
                api.setUser(response.data);
                return { success: true, user: response.data };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Çıkış yap
     */
    logout() {
        api.removeToken();
        window.location.href = 'homepage_v2.html';
    },

    /**
     * Mevcut kullanıcıyı getir
     */
    async getCurrentUser() {
        if (!api.isLoggedIn()) return null;
        
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.AUTH.ME);
            if (response.success) {
                api.setUser(response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Şifre güncelle
     */
    async updatePassword(currentPassword, newPassword) {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.AUTH.PASSWORD, {
                currentPassword,
                newPassword
            });
            return { success: response.success, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Giriş durumunu kontrol et
     */
    isLoggedIn() {
        return api.isLoggedIn();
    },

    /**
     * Kullanıcı rolünü kontrol et
     */
    getRole() {
        const user = api.getUser();
        return user?.role || null;
    },

    /**
     * Satıcı mı kontrol et
     */
    isSeller() {
        const role = this.getRole();
        return role === 'seller' || role === 'admin';
    }
};

/**
 * Sayfa yüklendiğinde auth durumunu kontrol et
 * Header'daki butonları güncelle
 */
function updateAuthUI() {
    const user = api.getUser();
    const authButtons = document.querySelector('.header-actions, .auth-buttons');
    
    if (!authButtons) return;

    if (user) {
        // Giriş yapılmış - kullanıcı menüsü göster
        const dashboardUrl = 'dashboard.html';
        
        authButtons.innerHTML = `
            <a href="${dashboardUrl}" class="btn btn-ghost">
                <span style="display:flex;align-items:center;gap:8px;">
                    <span style="width:32px;height:32px;background:var(--gold);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--charcoal);">
                        ${escapeHtml(user.name.substring(0, 2).toUpperCase())}
                    </span>
                    ${escapeHtml(user.name.split(' ')[0])}
                </span>
            </a>
            <a href="#" onclick="AuthService.logout(); return false;" class="btn btn-outline" style="padding:12px 16px;">
                Çıkış
            </a>
        `;
    } else {
        // Giriş yapılmamış
        authButtons.innerHTML = `
            <a href="login_register.html" class="btn btn-ghost">Giriş Yap</a>
            <a href="login_register.html" class="btn btn-primary">Kayıt Ol</a>
        `;
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', updateAuthUI);
