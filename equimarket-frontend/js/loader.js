/**
 * EquiMarket Loader & Error Handling Utility
 * Tüm async işlemler için standart loader ve error handling
 *
 * KULLANIM:
 * async function loadData() {
 *     Loader.show();
 *     try {
 *         const result = await api.get('/endpoint');
 *         if (!result.success) {
 *             throw new Error(result.message || 'Veri yüklenemedi');
 *         }
 *         // Success handling...
 *     } catch (error) {
 *         Loader.error(error.message || 'Bir hata oluştu');
 *     } finally {
 *         Loader.hide(); // MUTLAKA finally'de çağrılmalı!
 *     }
 * }
 */

const Loader = {
    _overlay: null,
    _toast: null,
    _counter: 0, // Nested loader çağrıları için sayaç

    /**
     * Loading overlay'i göster
     * @param {string} message - Gösterilecek mesaj (opsiyonel)
     */
    show(message = 'Yükleniyor...') {
        this._counter++;

        // Zaten varsa sadece mesajı güncelle
        if (this._overlay) {
            const msgEl = this._overlay.querySelector('.loader-message');
            if (msgEl) msgEl.textContent = message;
            return;
        }

        // Overlay oluştur
        this._overlay = document.createElement('div');
        this._overlay.id = 'equimarketLoader';
        this._overlay.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p class="loader-message">${message}</p>
            </div>
        `;
        this._overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(250, 248, 243, 0.95);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;

        // Spinner stilleri
        const style = document.createElement('style');
        style.id = 'loaderStyles';
        style.textContent = `
            #equimarketLoader .loader-content {
                text-align: center;
            }
            #equimarketLoader .loader-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid #f5f4f0;
                border-top-color: #1a3d2e;
                border-radius: 50%;
                animation: loaderSpin 0.8s linear infinite;
                margin: 0 auto 16px;
            }
            #equimarketLoader .loader-message {
                color: #6b6b6b;
                font-size: 15px;
                font-family: 'DM Sans', sans-serif;
            }
            @keyframes loaderSpin {
                to { transform: rotate(360deg); }
            }
        `;

        if (!document.getElementById('loaderStyles')) {
            document.head.appendChild(style);
        }

        document.body.appendChild(this._overlay);
    },

    /**
     * Loading overlay'i gizle
     * MUTLAKA finally bloğunda çağrılmalı!
     */
    hide() {
        this._counter = Math.max(0, this._counter - 1);

        // Hala bekleyen loader varsa gizleme
        if (this._counter > 0) return;

        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }

        // Eski pageLoading varsa onu da gizle (backward compatibility)
        const oldLoader = document.getElementById('pageLoading');
        if (oldLoader) {
            oldLoader.style.display = 'none';
        }
    },

    /**
     * Zorla tüm loader'ları kapat (emergency)
     */
    forceHide() {
        this._counter = 0;
        this.hide();
    },

    /**
     * Hata mesajı göster
     * @param {string} message - Hata mesajı
     * @param {number} duration - Gösterim süresi (ms)
     */
    error(message, duration = 5000) {
        this._showToast(message, 'error', duration);
    },

    /**
     * Başarı mesajı göster
     * @param {string} message - Başarı mesajı
     * @param {number} duration - Gösterim süresi (ms)
     */
    success(message, duration = 3000) {
        this._showToast(message, 'success', duration);
    },

    /**
     * Bilgi mesajı göster
     * @param {string} message - Bilgi mesajı
     * @param {number} duration - Gösterim süresi (ms)
     */
    info(message, duration = 3000) {
        this._showToast(message, 'info', duration);
    },

    /**
     * Uyarı mesajı göster
     * @param {string} message - Uyarı mesajı
     * @param {number} duration - Gösterim süresi (ms)
     */
    warning(message, duration = 4000) {
        this._showToast(message, 'warning', duration);
    },

    /**
     * Toast mesajı göster (internal)
     */
    _showToast(message, type, duration) {
        // Mevcut toast varsa kaldır
        if (this._toast) {
            this._toast.remove();
            this._toast = null;
        }

        const colors = {
            success: { bg: '#1a3d2e', icon: '✓' },
            error: { bg: '#dc2626', icon: '✕' },
            warning: { bg: '#f59e0b', icon: '!' },
            info: { bg: '#3b82f6', icon: 'i' }
        };

        const config = colors[type] || colors.info;

        this._toast = document.createElement('div');
        this._toast.className = 'equimarket-toast';
        this._toast.innerHTML = `
            <span class="toast-icon">${config.icon}</span>
            <span class="toast-message">${message}</span>
        `;
        this._toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${config.bg};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            animation: toastSlideIn 0.3s ease;
            max-width: 400px;
        `;

        // Toast animasyonu
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .equimarket-toast .toast-icon {
                    width: 24px;
                    height: 24px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(this._toast);

        // Otomatik kapat
        setTimeout(() => {
            if (this._toast) {
                this._toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => {
                    if (this._toast) {
                        this._toast.remove();
                        this._toast = null;
                    }
                }, 300);
            }
        }, duration);
    },

    /**
     * Buton loading durumu - butonun içeriğini değiştir
     * @param {HTMLElement} btn - Buton elementi
     * @param {boolean} loading - Loading durumu
     * @param {string} loadingText - Loading mesajı
     */
    button(btn, loading, loadingText = 'İşleniyor...') {
        if (!btn) return;

        if (loading) {
            btn._originalHTML = btn.innerHTML;
            btn._originalDisabled = btn.disabled;
            btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            // Spinner stili
            if (!document.getElementById('btnSpinnerStyle')) {
                const style = document.createElement('style');
                style.id = 'btnSpinnerStyle';
                style.textContent = `
                    .btn-spinner {
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: loaderSpin 0.8s linear infinite;
                        vertical-align: middle;
                        margin-right: 6px;
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            btn.innerHTML = btn._originalHTML || btn.innerHTML;
            btn.disabled = btn._originalDisabled || false;
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
        }
    }
};

// Global erişim için
window.Loader = Loader;
