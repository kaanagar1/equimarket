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
            SELLER: (id) => `/users/seller/${id}`,
            FAVORITES: '/users/favorites',
            DEACTIVATE: '/users/deactivate',
            DASHBOARD_STATS: '/users/dashboard/stats'
        }
    }
};

/**
 * API Service Class
 */
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    getToken() {
        return localStorage.getItem('equimarket_token');
    }

    setToken(token) {
        localStorage.setItem('equimarket_token', token);
    }

    removeToken() {
        localStorage.removeItem('equimarket_token');
        localStorage.removeItem('equimarket_user');
    }

    setUser(user) {
        localStorage.setItem('equimarket_user', JSON.stringify(user));
    }

    getUser() {
        const user = localStorage.getItem('equimarket_user');
        return user ? JSON.parse(user) : null;
    }

    isLoggedIn() {
        return !!this.getToken();
    }

    getHeaders(includeAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (includeAuth && this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
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
            const response = await fetch(url, config);
            const data = await response.json();

            if (response.status === 401 && this.isLoggedIn()) {
                this.removeToken();
                window.location.href = 'login_register.html';
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Bir hata oluştu');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
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
