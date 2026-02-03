/**
 * EquiMarket Horse API Service
 * At ilanları için API çağrıları
 *
 * Bu dosya sadece API çağrılarını içerir.
 * UI yardımcı fonksiyonları horses.js dosyasında kalır.
 */

const HorseApi = {
    /**
     * İlanları listele (filtreli)
     * @param {Object} filters - Filtre parametreleri
     * @returns {Promise<Object>} API yanıtı
     */
    async getHorses(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryParams.append(key, value);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = API_CONFIG.ENDPOINTS.HORSES.LIST + (queryString ? `?${queryString}` : '');

            const response = await api.get(endpoint, false);
            return response;
        } catch (error) {
            console.error('HorseApi.getHorses Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Tek ilan detayı
     * @param {string} id - İlan ID
     * @returns {Promise<Object>} API yanıtı
     */
    async getHorse(id) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.HORSES.DETAIL(id), false);
            return response;
        } catch (error) {
            console.error('HorseApi.getHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Yeni ilan oluştur
     * @param {Object} horseData - İlan verileri
     * @returns {Promise<Object>} API yanıtı
     */
    async createHorse(horseData) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.HORSES.CREATE, horseData);
            return response;
        } catch (error) {
            console.error('HorseApi.createHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * İlan güncelle
     * @param {string} id - İlan ID
     * @param {Object} horseData - Güncellenecek veriler
     * @returns {Promise<Object>} API yanıtı
     */
    async updateHorse(id, horseData) {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.HORSES.UPDATE(id), horseData);
            return response;
        } catch (error) {
            console.error('HorseApi.updateHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * İlan sil
     * @param {string} id - İlan ID
     * @returns {Promise<Object>} API yanıtı
     */
    async deleteHorse(id) {
        try {
            const response = await api.delete(API_CONFIG.ENDPOINTS.HORSES.DELETE(id));
            return response;
        } catch (error) {
            console.error('HorseApi.deleteHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Kullanıcının ilanları
     * @param {Object} filters - Filtre parametreleri
     * @returns {Promise<Object>} API yanıtı
     */
    async getMyListings(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const endpoint = API_CONFIG.ENDPOINTS.HORSES.MY_LISTINGS + '?' + queryParams.toString();
            const response = await api.get(endpoint);
            return response;
        } catch (error) {
            console.error('HorseApi.getMyListings Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Favorilere ekle/çıkar
     * @param {string} id - İlan ID
     * @returns {Promise<Object>} API yanıtı
     */
    async toggleFavorite(id) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.HORSES.FAVORITE(id), {});
            return response;
        } catch (error) {
            console.error('HorseApi.toggleFavorite Error:', error);
            return { success: false, message: error.message };
        }
    }
};

// Global erişim için
window.HorseApi = HorseApi;
