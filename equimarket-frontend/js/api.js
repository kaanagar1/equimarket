/**
 * EquiMarket API Configuration
 * Tüm API istekleri için merkezi yapılandırma
 */

const API_CONFIG = {
    // API Base URL - Production'da değiştir
    BASE_URL: 'http://localhost:5000/api',

    // Endpoints
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/auth/register',
            LOGIN: '/auth/login',
            ME: '/auth/me',
            LOGOUT: '/auth/logout',
            PASSWORD: '/auth/password'
        },
        HORSES: {
            LIST: '/horses',
            DETAIL: (id) => `/horses/${id}`,
            CREATE: '/horses',
            UPDATE: (id) => `/horses/${id}`,
            DELETE: (id) => `/horses/${id}`,
            MY_LISTINGS: '/horses/user/my-listings',
            FAVORITE: (id) => `/horses/${id}/favorite`
        },
        MESSAGES: {
            CONVERSATIONS: '/messages/conversations',
            MESSAGES: (convId) => `/messages/conversations/${convId}`,
            SEND: '/messages/send',
            OFFER_RESPONSE: (msgId) => `/messages/${msgId}/offer-response`,
            UNREAD_COUNT: '/messages/unread-count'
        },
        USERS: {
            PROFILE: '/users/profile',
            SELLER: (id) => `/users/${id}`,
            FAVORITES: '/users/favorites',
            DEACTIVATE: '/users/deactivate',
            DASHBOARD_STATS: '/users/dashboard/stats'
        }
    }
};

/**
 * Storage Helper - Güvenli localStorage erişimi
 * Tracking Prevention ve Privacy Mode desteği
 */
const StorageHelper = {
    _memoryStorage: {},
    _storageAvailable: null,

    isAvailable() {
        if (this._storageAvailable !== null) return this._storageAvailable;

        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            this._storageAvailable = true;
        } catch (e) {
            console.warn('localStorage kullanılamıyor, memory storage kullanılacak');
            this._storageAvailable = false;
        }
        return this._storageAvailable;
    },

    getItem(key) {
        try {
            if (this.isAvailable()) {
                return localStorage.getItem(key);
            }
            return this._memoryStorage[key] || null;
        } catch (e) {
            return this._memoryStorage[key] || null;
        }
    },

    setItem(key, value) {
        try {
            if (this.isAvailable()) {
                localStorage.setItem(key, value);
            }
            this._memoryStorage[key] = value;
        } catch (e) {
            this._memoryStorage[key] = value;
        }
    },

    removeItem(key) {
        try {
            if (this.isAvailable()) {
                localStorage.removeItem(key);
            }
            delete this._memoryStorage[key];
        } catch (e) {
            delete this._memoryStorage[key];
        }
    }
};

/**
 * API Service Class
 */
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.storage = StorageHelper;
    }

    getToken() {
        return this.storage.getItem('equimarket_token');
    }

    setToken(token) {
        this.storage.setItem('equimarket_token', token);
    }

    removeToken() {
        this.storage.removeItem('equimarket_token');
        this.storage.removeItem('equimarket_user');
    }

    setUser(user) {
        this.storage.setItem('equimarket_user', JSON.stringify(user));
    }

    getUser() {
        const user = this.storage.getItem('equimarket_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    getHeaders(includeAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (includeAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            const data = await response.json();

            if (response.status === 401 && this.isLoggedIn()) {
                this.removeToken();
                // Sadece korumalı sayfalarda yönlendir
                const protectedPages = ['dashboard', 'messaging', 'settings', 'create_listing'];
                const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'login_register.html';
                }
                return { success: false, message: 'Oturum süresi doldu' };
            }

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || 'Bir hata oluştu',
                    status: response.status
                };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);

            if (error.name === 'AbortError') {
                return { success: false, message: 'İstek zaman aşımına uğradı' };
            }

            return {
                success: false,
                message: error.message || 'Sunucuya bağlanılamadı'
            };
        }
    }

    async get(endpoint, auth = true) {
        return this.request(endpoint, { method: 'GET', auth });
    }

    async post(endpoint, data, auth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            auth
        });
    }

    async put(endpoint, data, auth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            auth
        });
    }

    async delete(endpoint, auth = true) {
        return this.request(endpoint, { method: 'DELETE', auth });
    }
}

const api = new ApiService();

// Global storage helper
window.StorageHelper = StorageHelper;
