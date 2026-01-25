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

    // Popup HTML oluştur
    function createPopupHTML() {
        return `
            <div class="feedback-overlay" id="feedbackOverlay">
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
                            <button class="star-btn" data-rating="1">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="2">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="3">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="4">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                            <button class="star-btn" data-rating="5">
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

    // CSS dosyasını yükle
    function loadCSS() {
        if (document.getElementById('feedback-popup-css')) return;
        
        const link = document.createElement('link');
        link.id = 'feedback-popup-css';
        link.rel = 'stylesheet';
        link.href = 'css/feedback-popup.css';
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
        // Yıldız rating
        const starBtns = document.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', () => handleStarClick(btn));
            btn.addEventListener('mouseenter', () => handleStarHover(btn));
            btn.addEventListener('mouseleave', () => handleStarLeave());
        });

        // Form submit
        document.getElementById('feedbackForm').addEventListener('submit', handleSubmit);

        // Kapat butonu
        document.getElementById('feedbackClose').addEventListener('click', hidePopup);

        // Daha sonra hatırlat
        document.getElementById('feedbackSkip').addEventListener('click', skipPopup);

        // Başarı ekranı kapat
        document.getElementById('feedbackSuccessClose').addEventListener('click', hidePopup);

        // Overlay'e tıklayınca kapatma (opsiyonel)
        document.getElementById('feedbackOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'feedbackOverlay') {
                hidePopup();
            }
        });
    }

    // Yıldız tıklama
    function handleStarClick(btn) {
        currentRating = parseInt(btn.dataset.rating);
        updateStars();
        document.getElementById('feedbackSubmit').disabled = false;
    }

    // Yıldız hover
    function handleStarHover(btn) {
        const rating = parseInt(btn.dataset.rating);
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach((star, index) => {
            star.classList.toggle('hover', index < rating);
        });
        document.getElementById('ratingText').textContent = RATING_TEXTS[rating];
    }

    // Yıldız hover çıkış
    function handleStarLeave() {
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach(star => star.classList.remove('hover'));
        document.getElementById('ratingText').textContent = currentRating ? RATING_TEXTS[currentRating] : '';
    }

    // Yıldızları güncelle
    function updateStars() {
        const stars = document.querySelectorAll('.star-btn');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < currentRating);
        });
        document.getElementById('ratingText').textContent = RATING_TEXTS[currentRating];
    }

    // Form gönder
    async function handleSubmit(e) {
        e.preventDefault();

        const text = document.getElementById('feedbackText').value.trim();
        const submitBtn = document.getElementById('feedbackSubmit');

        if (!currentRating) {
            alert('Lütfen bir puan verin.');
            return;
        }

        if (!text) {
            alert('Lütfen görüşlerinizi yazın.');
            return;
        }

        // Butonu devre dışı bırak
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" style="animation: spin 1s linear infinite;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Gönderiliyor...
        `;

        try {
            // Kullanıcı bilgisini al
            const userData = localStorage.getItem('equimarket_user');
            const user = userData ? JSON.parse(userData) : null;

            // API'ye gönder (backend'de endpoint varsa)
            if (typeof api !== 'undefined') {
                await api.post('/feedback', {
                    rating: currentRating,
                    text: text,
                    userId: user?._id,
                    userEmail: user?.email,
                    page: window.location.pathname,
                    timestamp: new Date().toISOString()
                });
            }

            // Kullanıcının ilan hakkını güncelle
            if (user) {
                user.freeListingCredits = (user.freeListingCredits || 0) + 1;
                localStorage.setItem('equimarket_user', JSON.stringify(user));
            }

            // Feedback verildi olarak işaretle
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_GIVEN, 'true');

            // Başarı ekranını göster
            showSuccess();

        } catch (error) {
            console.error('Feedback gönderme hatası:', error);
            
            // Hata olsa bile başarılı say (UX için)
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_GIVEN, 'true');
            showSuccess();
        }
    }

    // Başarı ekranını göster
    function showSuccess() {
        document.getElementById('feedbackFormContainer').classList.add('hidden');
        document.getElementById('feedbackSuccess').classList.add('show');
    }

    // Popup'ı göster
    function showPopup() {
        const overlay = document.getElementById('feedbackOverlay');
        if (overlay) {
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Bu oturumda gösterildi olarak işaretle
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.POPUP_SHOWN, 'true');
        }
    }

    // Popup'ı gizle
    function hidePopup() {
        const overlay = document.getElementById('feedbackOverlay');
        if (overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Daha sonra hatırlat
    function skipPopup() {
        hidePopup();
        // Oturum süresince tekrar gösterme (sayfa yenilenince gösterebilir)
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
        // CSS yükle
        loadCSS();

        // Popup'ı DOM'a ekle
        injectPopup();

        // Event listener'ları bağla
        bindEvents();

        // Zamanlayıcıyı başlat
        startTimer();
    }

    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Spin animasyonu için CSS ekle
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

})();
