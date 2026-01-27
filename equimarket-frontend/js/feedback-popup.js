/**
 * EquiMarket Feedback Popup
 * Kullanıcıdan geribildirim toplar ve ücretsiz ilan hakkı verir
 */

(function() {
    'use strict';

    // Konfigürasyon
    const CONFIG = {
        // Popup gösterilmeden önce geçmesi gereken süre (milisaniye)
        DELAY_TIME: 60 * 1000, // 60 saniye (1 dakika)
        // Production için: 15 * 60 * 1000 (15 dakika)

        // LocalStorage anahtarları
        STORAGE_KEYS: {
            FEEDBACK_GIVEN: 'equimarket_feedback_given',
            SESSION_START: 'equimarket_session_start',
            POPUP_SHOWN: 'equimarket_popup_shown_session'
        }
    };

    // Puanlama metinleri
    const RATING_TEXTS = {
        1: 'Çok kötü 😞',
        2: 'Kötü 😕',
        3: 'Orta 😐',
        4: 'İyi 😊',
        5: 'Mükemmel! 🤩'
    };

    let currentRating = 0;
    let isInitialized = false;
    let cssLoaded = false;

    // Popup HTML oluştur - başlangıçta gizli
    function createPopupHTML() {
        return `
            <div class="feedback-overlay" id="feedbackOverlay" style="display: none;">
                <div class="feedback-popup">
                    <button class="feedback-close" id="feedbackClose" title="Kapat">
                        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>

                    <div class="feedback-form-container" id="feedbackFormContainer">
                        <div class="feedback-header">
                            <div class="feedback-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <h2>Görüşleriniz Bizim İçin Değerli!</h2>
                            <p>EquiMarket deneyiminizi değerlendirin ve <strong>1 ücretsiz ilan hakkı</strong> kazanın.</p>
                        </div>

                        <div class="feedback-reward">
                            <span>
                                <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                Geribildirim verin, 1 ücretsiz ilan hakkı kazanın!
                            </span>
                        </div>

                        <div class="star-rating" id="starRating">
                            <button class="star-btn" data-rating="1" type="button">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="2" type="button">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="3" type="button">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="4" type="button">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="5" type="button">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                        </div>
                        <div class="rating-text" id="ratingText"></div>

                        <form class="feedback-form" id="feedbackForm">
                            <textarea
                                class="feedback-textarea"
                                id="feedbackText"
                                placeholder="Deneyiminizi bizimle paylaşın... Neyi beğendiniz? Neleri geliştirebiliriz?"
                                required
                            ></textarea>

                            <button type="submit" class="feedback-submit" id="feedbackSubmit" disabled>
                                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                Gönder ve Ödülü Kazan
                            </button>
                        </form>

                        <div class="feedback-skip">
                            <button type="button" id="feedbackSkip">Daha sonra hatırlat</button>
                        </div>
                    </div>

                    <div class="feedback-success" id="feedbackSuccess">
                        <div class="feedback-success-icon">
                            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h3>Teşekkürler!</h3>
                        <p>Değerli görüşleriniz için teşekkür ederiz. Geribildiriminiz EquiMarket'i daha iyi hale getirmemize yardımcı olacak.</p>
                        <div class="reward-badge">
                            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            1 Ücretsiz İlan Hakkı Kazandınız!
                        </div>
                        <button class="feedback-success-btn" id="feedbackSuccessClose">Tamam</button>
                    </div>
                </div>
            </div>
        `;
    }

    // CSS dosyasını yükle ve callback çağır
    function loadCSS(callback) {
        if (document.getElementById('feedback-popup-css')) {
            cssLoaded = true;
            if (callback) callback();
            return;
        }

        const link = document.createElement('link');
        link.id = 'feedback-popup-css';
        link.rel = 'stylesheet';
        link.href = '/css/feedback-popup.css'; // Mutlak path kullan

        link.onload = function() {
            cssLoaded = true;
            if (callback) callback();
        };

        link.onerror = function() {
            console.error('Feedback popup CSS yüklenemedi');
            cssLoaded = true; // Hata olsa bile devam et
            if (callback) callback();
        };

        document.head.appendChild(link);
    }

    // Popup'ı DOM'a ekle
    function injectPopup() {
        if (document.getElementById('feedbackOverlay')) return;

        const container = document.createElement('div');
        container.innerHTML = createPopupHTML();
        document.body.appendChild(container.firstElementChild);
    }

    // Event listener'ları bağla
    function bindEvents() {
        const overlay = document.getElementById('feedbackOverlay');
        if (!overlay) return;

        // Yıldız rating
        const starBtns = document.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStarClick(btn);
            });
            btn.addEventListener('mouseenter', () => handleStarHover(btn));
            btn.addEventListener('mouseleave', () => handleStarLeave());
        });

        // Form submit
        const form = document.getElementById('feedbackForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        // Kapat butonu
        const closeBtn = document.getElementById('feedbackClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                hidePopup();
            });
        }

        // Daha sonra hatırlat
        const skipBtn = document.getElementById('feedbackSkip');
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                skipPopup();
            });
        }

        // Başarı ekranı kapat
        const successCloseBtn = document.getElementById('feedbackSuccessClose');
        if (successCloseBtn) {
            successCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                hidePopup();
            });
        }

        // Overlay'e tıklayınca kapatma
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hidePopup();
            }
        });

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('show')) {
                hidePopup();
            }
        });
    }

    // Yıldız tıklama
    function handleStarClick(btn) {
        currentRating = parseInt(btn.dataset.rating);
        updateStars();
        const submitBtn = document.getElementById('feedbackSubmit');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    // Yıldız hover
    function handleStarHover(btn) {
        const rating = parseInt(btn.dataset.rating);
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach((star, index) => {
            star.classList.toggle('hover', index < rating);
        });
        const ratingText = document.getElementById('ratingText');
        if (ratingText) {
            ratingText.textContent = RATING_TEXTS[rating];
        }
    }

    // Yıldız hover çıkış
    function handleStarLeave() {
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach(star => star.classList.remove('hover'));
        const ratingText = document.getElementById('ratingText');
        if (ratingText) {
            ratingText.textContent = currentRating ? RATING_TEXTS[currentRating] : '';
        }
    }

    // Yıldızları güncelle
    function updateStars() {
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < currentRating);
        });
        const ratingText = document.getElementById('ratingText');
        if (ratingText) {
            ratingText.textContent = RATING_TEXTS[currentRating];
        }
    }

    // Form gönder
    async function handleSubmit(e) {
        e.preventDefault();

        const textArea = document.getElementById('feedbackText');
        const text = textArea ? textArea.value.trim() : '';
        const submitBtn = document.getElementById('feedbackSubmit');

        if (!currentRating) {
            if (typeof toast !== 'undefined') toast.warning('Lütfen bir puan verin.');
            else alert('Lütfen bir puan verin.');
            return;
        }

        if (!text) {
            if (typeof toast !== 'undefined') toast.warning('Lütfen görüşlerinizi yazın.');
            else alert('Lütfen görüşlerinizi yazın.');
            return;
        }

        // Butonu devre dışı bırak
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" class="spin-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Gönderiliyor...
            `;
        }

        try {
            // Kullanıcı bilgisini al
            const userData = localStorage.getItem('equimarket_user');
            const user = userData ? JSON.parse(userData) : null;

            // API'ye gönder
            if (typeof api !== 'undefined') {
                const response = await api.post('/feedback', {
                    rating: currentRating,
                    text: text,
                    page: window.location.pathname
                });

                if (response.success) {
                    // Kullanıcı bilgisini güncelle
                    if (user && response.data && response.data.user) {
                        localStorage.setItem('equimarket_user', JSON.stringify(response.data.user));
                    }
                }
            }

            // Feedback verildi olarak işaretle
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_GIVEN, 'true');

            // Başarı ekranını göster
            showSuccess();

            // Toast göster
            if (typeof toast !== 'undefined') {
                toast.success('Geribildiriminiz için teşekkürler!');
            }

        } catch (error) {
            console.error('Feedback gönderme hatası:', error);

            // Hata olsa bile başarılı say (UX için)
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_GIVEN, 'true');
            showSuccess();
        }
    }

    // Başarı ekranını göster
    function showSuccess() {
        const formContainer = document.getElementById('feedbackFormContainer');
        const successContainer = document.getElementById('feedbackSuccess');

        if (formContainer) formContainer.classList.add('hidden');
        if (successContainer) successContainer.classList.add('show');
    }

    // Popup'ı göster
    function showPopup() {
        if (!cssLoaded) {
            // CSS yüklenene kadar bekle
            setTimeout(showPopup, 100);
            return;
        }

        const overlay = document.getElementById('feedbackOverlay');
        if (!overlay) return;

        // Önce display'i ayarla
        overlay.style.display = 'flex';

        // Kısa bir gecikme ile animasyonu başlat
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });
        });

        document.body.style.overflow = 'hidden';

        // Bu oturumda gösterildi olarak işaretle
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.POPUP_SHOWN, 'true');
    }

    // Popup'ı gizle
    function hidePopup() {
        const overlay = document.getElementById('feedbackOverlay');
        if (!overlay) return;

        overlay.classList.remove('show');
        document.body.style.overflow = '';

        // Animasyon bittikten sonra display'i gizle
        setTimeout(() => {
            overlay.style.display = 'none';
            // Form state'i sıfırla
            resetForm();
        }, 300);
    }

    // Form state'i sıfırla
    function resetForm() {
        currentRating = 0;
        const textArea = document.getElementById('feedbackText');
        const submitBtn = document.getElementById('feedbackSubmit');
        const formContainer = document.getElementById('feedbackFormContainer');
        const successContainer = document.getElementById('feedbackSuccess');
        const ratingText = document.getElementById('ratingText');

        if (textArea) textArea.value = '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                Gönder ve Ödülü Kazan
            `;
        }
        if (formContainer) formContainer.classList.remove('hidden');
        if (successContainer) successContainer.classList.remove('show');
        if (ratingText) ratingText.textContent = '';

        const stars = document.querySelectorAll('.star-btn');
        stars.forEach(star => {
            star.classList.remove('active');
            star.classList.remove('hover');
        });
    }

    // Daha sonra hatırlat
    function skipPopup() {
        hidePopup();
        // Oturum süresince tekrar gösterme
    }

    // Kullanıcı giriş yapmış mı kontrol et
    function isUserLoggedIn() {
        return !!localStorage.getItem('equimarket_token');
    }

    // Feedback daha önce verilmiş mi kontrol et
    function hasFeedbackGiven() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.FEEDBACK_GIVEN) === 'true';
    }

    // Bu oturumda popup gösterilmiş mi
    function hasPopupShownThisSession() {
        return sessionStorage.getItem(CONFIG.STORAGE_KEYS.POPUP_SHOWN) === 'true';
    }

    // Session başlangıç zamanını al/ayarla
    function getSessionStart() {
        let sessionStart = sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION_START);

        if (!sessionStart) {
            sessionStart = Date.now().toString();
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_START, sessionStart);
        }

        return parseInt(sessionStart);
    }

    // Popup gösterilmeli mi kontrol et
    function shouldShowPopup() {
        // Giriş yapmamışsa gösterme
        if (!isUserLoggedIn()) return false;

        // Daha önce feedback verdiyse gösterme
        if (hasFeedbackGiven()) return false;

        // Bu oturumda zaten gösterildiyse gösterme
        if (hasPopupShownThisSession()) return false;

        // Yeterli süre geçmiş mi
        const sessionStart = getSessionStart();
        const elapsed = Date.now() - sessionStart;

        return elapsed >= CONFIG.DELAY_TIME;
    }

    // Zamanlayıcıyı başlat
    function startTimer() {
        // Önce kontrol et
        if (shouldShowPopup()) {
            showPopup();
            return;
        }

        // Giriş yapmamışsa veya feedback verdiyse zamanlayıcı kurma
        if (!isUserLoggedIn() || hasFeedbackGiven()) return;

        // Kalan süreyi hesapla
        const sessionStart = getSessionStart();
        const elapsed = Date.now() - sessionStart;
        const remaining = CONFIG.DELAY_TIME - elapsed;

        if (remaining > 0) {
            setTimeout(() => {
                if (shouldShowPopup()) {
                    showPopup();
                }
            }, remaining);
        }
    }

    // Başlat
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        // Önce CSS'i yükle
        loadCSS(() => {
            // CSS yüklendikten sonra popup'ı DOM'a ekle
            injectPopup();

            // Event listener'ları bağla
            bindEvents();

            // Zamanlayıcıyı başlat
            startTimer();
        });
    }

    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Spin animasyonu için CSS ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin-icon {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // Global erişim için (test amaçlı)
    window.EquiMarketFeedback = {
        show: showPopup,
        hide: hidePopup,
        reset: resetForm
    };

})();
