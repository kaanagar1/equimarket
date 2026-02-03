/**
 * EquiMarket App State
 * Framework-free global state management
 *
 * Kullanım:
 *   if (AppState.isLoggedIn) { ... }
 *   if (AppState.isAdmin) { ... }
 *   if (AppState.isFavorited(horseId)) { ... }
 *   AppState.toggleFavorite(horseId)
 *   if (AppState.isOwner(sellerId)) { ... }
 */

const AppState = {
    // ==================== PRIVATE CACHE ====================
    _cache: {
        token: null,
        user: null,
        initialized: false
    },

    // ==================== INITIALIZATION ====================

    /**
     * State'i localStorage'dan yükle (sayfa açılışında bir kez çağrılır)
     */
    init() {
        if (this._cache.initialized) return;

        try {
            this._cache.token = localStorage.getItem('equimarket_token');
            const userData = localStorage.getItem('equimarket_user');
            this._cache.user = userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.warn('AppState init error:', e);
            this._cache.token = null;
            this._cache.user = null;
        }

        this._cache.initialized = true;
    },

    /**
     * Cache'i temizle ve localStorage'dan yeniden yükle
     */
    refresh() {
        this._cache.initialized = false;
        this.init();
    },

    // ==================== AUTH STATE ====================

    /**
     * Kullanıcı giriş yapmış mı?
     */
    get isLoggedIn() {
        this.init();
        return !!this._cache.token;
    },

    /**
     * Mevcut token
     */
    get token() {
        this.init();
        return this._cache.token;
    },

    /**
     * Mevcut kullanıcı objesi
     */
    get user() {
        this.init();
        return this._cache.user;
    },

    /**
     * Kullanıcı ID'si
     */
    get userId() {
        return this.user?._id || null;
    },

    // ==================== ROLE CHECKS ====================

    /**
     * Admin mi?
     */
    get isAdmin() {
        return this.user?.role === 'admin';
    },

    /**
     * Kullanıcı işlem yapabilir mi? (tüm giriş yapmış kullanıcılar)
     */
    get isSeller() {
        const role = this.user?.role;
        // Tüm giriş yapmış kullanıcılar ilan verebilir
        return role === 'user' || role === 'admin';
    },

    /**
     * Normal kullanıcı mı?
     */
    get isUser() {
        return this.isLoggedIn && this.user?.role === 'user';
    },

    /**
     * Belirli bir role sahip mi?
     */
    hasRole(role) {
        if (role === 'admin') return this.isAdmin;
        if (role === 'user') return this.isUser;
        // Geriye uyumluluk için seller/buyer kontrolü
        if (role === 'seller' || role === 'buyer') return this.isLoggedIn;
        return this.isLoggedIn;
    },

    // ==================== OWNERSHIP CHECKS ====================

    /**
     * Bu kullanıcı belirtilen ID'nin sahibi mi?
     */
    isOwner(ownerId) {
        if (!this.isLoggedIn || !ownerId) return false;
        return this.userId === ownerId;
    },

    /**
     * Bu ilanın sahibi mi veya admin mi?
     */
    canManage(ownerId) {
        if (!this.isLoggedIn) return false;
        return this.isOwner(ownerId) || this.isAdmin;
    },

    // ==================== FAVORITES ====================

    /**
     * Favoriler listesi
     */
    get favorites() {
        return this.user?.favorites || [];
    },

    /**
     * Bu ilan favorilerde mi?
     */
    isFavorited(horseId) {
        if (!horseId) return false;
        return this.favorites.includes(horseId);
    },

    /**
     * Favori ekle/çıkar (optimistic update)
     * @returns {boolean} Yeni favori durumu
     */
    toggleFavorite(horseId) {
        if (!this.isLoggedIn || !horseId) return false;

        const favorites = [...this.favorites];
        const index = favorites.indexOf(horseId);
        let isFav;

        if (index > -1) {
            favorites.splice(index, 1);
            isFav = false;
        } else {
            favorites.push(horseId);
            isFav = true;
        }

        // Cache ve localStorage güncelle
        if (this._cache.user) {
            this._cache.user.favorites = favorites;
            try {
                localStorage.setItem('equimarket_user', JSON.stringify(this._cache.user));
            } catch (e) {
                console.warn('Favorites save error:', e);
            }
        }

        return isFav;
    },

    // ==================== AUTH ACTIONS ====================

    /**
     * Login sonrası state güncelle
     */
    setAuth(token, user) {
        this._cache.token = token;
        this._cache.user = user;

        try {
            if (token) {
                localStorage.setItem('equimarket_token', token);
            }
            if (user) {
                localStorage.setItem('equimarket_user', JSON.stringify(user));
            }
        } catch (e) {
            console.warn('Auth save error:', e);
        }
    },

    /**
     * Logout - tüm state temizle
     */
    logout() {
        this._cache.token = null;
        this._cache.user = null;

        try {
            localStorage.removeItem('equimarket_token');
            localStorage.removeItem('equimarket_user');
        } catch (e) {
            console.warn('Logout error:', e);
        }
    },

    /**
     * Kullanıcı bilgilerini güncelle (profil güncellemesi sonrası)
     */
    updateUser(userData) {
        if (!userData) return;

        this._cache.user = { ...this._cache.user, ...userData };

        try {
            localStorage.setItem('equimarket_user', JSON.stringify(this._cache.user));
        } catch (e) {
            console.warn('User update error:', e);
        }
    },

    // ==================== PAGE GUARDS ====================

    /**
     * Auth gerektiren sayfa kontrolü
     * @returns {boolean} Erişim izni var mı
     */
    requireAuth(redirectUrl = 'login_register.html') {
        if (!this.isLoggedIn) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Admin sayfası kontrolü
     */
    requireAdmin(redirectUrl = 'homepage_v2.html') {
        if (!this.isAdmin) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Satıcı sayfası kontrolü
     */
    requireSeller(redirectUrl = 'homepage_v2.html') {
        if (!this.isSeller) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    // ==================== UI HELPERS ====================

    /**
     * Header auth butonlarını güncelle
     */
    updateHeaderUI(containerSelector = '.auth-buttons') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        if (this.isLoggedIn) {
            const user = this.user;
            const initials = user?.name?.substring(0, 2).toUpperCase() || 'KA';
            const firstName = user?.name?.split(' ')[0] || 'Kullanıcı';

            container.innerHTML = `
                <a href="dashboard.html" class="btn btn-ghost" style="display:flex;align-items:center;gap:10px;">
                    <span style="width:36px;height:36px;background:var(--gold);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--charcoal);">
                        ${initials}
                    </span>
                    ${firstName}
                </a>
                <a href="#" onclick="AppState.logout(); window.location.reload(); return false;" class="btn btn-outline">Çıkış</a>
            `;
        } else {
            container.innerHTML = `
                <a href="login_register.html" class="btn btn-outline">Giriş Yap</a>
                <a href="login_register.html#register" class="btn btn-gold">Kayıt Ol</a>
            `;
        }
    }
};

// Sayfa yüklendiğinde otomatik init
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => AppState.init());
}
