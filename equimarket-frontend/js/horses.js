/**
 * EquiMarket Horse Service
 * İlan listeleme, detay, oluşturma ve yönetim
 */

const HorseService = {
    /**
     * İlanları listele (filtreli)
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
            console.error('GetHorses Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Tek ilan detayı
     */
    async getHorse(id) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.HORSES.DETAIL(id), false);
            return response;
        } catch (error) {
            console.error('GetHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Yeni ilan oluştur
     */
    async createHorse(horseData) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.HORSES.CREATE, horseData);
            return response;
        } catch (error) {
            console.error('CreateHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * İlan güncelle
     */
    async updateHorse(id, horseData) {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.HORSES.UPDATE(id), horseData);
            return response;
        } catch (error) {
            console.error('UpdateHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * İlan sil
     */
    async deleteHorse(id) {
        try {
            const response = await api.delete(API_CONFIG.ENDPOINTS.HORSES.DELETE(id));
            return response;
        } catch (error) {
            console.error('DeleteHorse Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Kullanıcının ilanları
     */
    async getMyListings(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const endpoint = API_CONFIG.ENDPOINTS.HORSES.MY_LISTINGS + '?' + queryParams.toString();
            const response = await api.get(endpoint);
            return response;
        } catch (error) {
            console.error('GetMyListings Error:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    /**
     * Favorilere ekle/çıkar
     */
    async toggleFavorite(id) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.HORSES.FAVORITE(id), {});
            return response;
        } catch (error) {
            console.error('ToggleFavorite Error:', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Fiyatı formatla
     */
    formatPrice(price) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    },

    /**
     * Yaşı hesapla
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        return today.getFullYear() - birth.getFullYear();
    },

    /**
     * Irk adını Türkçe getir
     */
    getBreedName(breed) {
        const breeds = {
            'ingiliz': 'İngiliz',
            'arap': 'Arap',
            'turk': 'Türk Atı',
            'diger': 'Diğer'
        };
        return breeds[breed] || breed;
    },

    /**
     * Cinsiyet adını Türkçe getir
     */
    getGenderName(gender) {
        const genders = {
            'erkek': 'Erkek',
            'disi': 'Dişi',
            'igdis': 'İğdiş'
        };
        return genders[gender] || gender;
    },

    /**
     * Renk adını Türkçe getir
     */
    getColorName(color) {
        const colors = {
            'doru': 'Doru',
            'kir': 'Kır',
            'yagiz': 'Yağız',
            'al': 'Al',
            'diger': 'Diğer'
        };
        return colors[color] || color;
    },

    /**
     * İlan kartı HTML oluştur
     */
    createHorseCard(horse, showFavorite = true) {
        const horseId = horse._id || horse.id;
        const mainImage = horse.images?.find(img => img.isMain)?.url || horse.images?.[0]?.url || '';
        const isFavorited = api.getUser()?.favorites?.includes(horseId);

        return `
            <a href="${horseId ? `horse_detail.html#id=${horseId}` : '#'}" class="horse-card">
                <div class="horse-image">
                    ${mainImage ? `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(horse.name)}">` : `
                        <div style="width:100%;height:100%;background:#e8e6e1;display:flex;align-items:center;justify-content:center;">
                            <svg width="48" height="48" fill="rgba(0,0,0,0.1)" viewBox="0 0 24 24">
                                <path d="M20.5 6c-.2-1.5-1-2.5-2-3-.5-1.3-1.5-2-3-2-1 0-2 .5-2.5 1.3L11.5 4 9 3 5 5 3 8v5l2.5 2.5H9l4-2.5 3 1c2.2 0 3.5-1.5 3.5-4V6z"/>
                            </svg>
                        </div>
                    `}
                    ${horse.isFeatured ? '<span class="badge featured">Öne Çıkan</span>' : ''}
                    ${horse.seller?.sellerInfo?.isVerifiedSeller ? '<span class="badge verified">Doğrulanmış</span>' : ''}
                    ${showFavorite && api.isLoggedIn() && horseId ? `
                        <button class="favorite-btn ${isFavorited ? 'active' : ''}" onclick="event.preventDefault(); toggleFavorite('${horseId}', this);">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="horse-info">
                    <h3>${escapeHtml(horse.name)}</h3>
                    <p class="horse-breed">${escapeHtml(this.getBreedName(horse.breed))}</p>
                    <p class="horse-price">${this.formatPrice(horse.price)}</p>
                    <div class="horse-meta">
                        <span>${horse.age || this.calculateAge(horse.birthDate)} Yaş</span>
                        <span>${this.getGenderName(horse.gender)}</span>
                        <span>${this.getColorName(horse.color)}</span>
                    </div>
                    <div class="horse-footer">
                        <span class="location">${escapeHtml(horse.location?.city || '')}</span>
                        ${horse.seller ? `
                            <span class="seller">
                                <span class="seller-avatar">${escapeHtml(horse.seller.name?.substring(0, 2).toUpperCase())}</span>
                                ${escapeHtml(horse.seller.name?.split(' ')[0])}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </a>
        `;
    }
};

/**
 * Favori toggle (global fonksiyon)
 */
async function toggleFavorite(horseId, button) {
    if (!api.isLoggedIn()) {
        window.location.href = 'login_register.html';
        return;
    }

    const result = await HorseService.toggleFavorite(horseId);

    if (result.success) {
        button.classList.toggle('active', result.isFavorited);
        // localStorage'ı güncelle - dashboard'da favoriler doğru gözüksün
        if (typeof AppState !== 'undefined') {
            AppState.toggleFavorite(horseId);
        }
        showToast(result.message);
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Toast mesajı göster
 */
function showToast(message, type = 'success') {
    // Mevcut toast'ı kaldır
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${escapeHtml(message)}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${type === 'success' ? '#1a3d2e' : '#dc2626'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toast animasyonları için CSS ekle
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);
