/**
 * EquiMarket Feedback Popup v2
 * Non-intrusive bottom-corner banner design
 * Controlled triggering with user interaction requirement
 */

(function() {
    'use strict';

    // Konfigürasyon
    const CONFIG = {
        // Popup gösterilmeden önce geçmesi gereken minimum süre (milisaniye)
        MIN_TIME_ON_PAGE: 20 * 1000, // 20 saniye

        // Erteleme sonrası cooldown süresi (milisaniye)
        DISMISS_COOLDOWN: 7 * 24 * 60 * 60 * 1000, // 7 gün

        // Minimum scroll yüzdesi (viewport)
        MIN_SCROLL_PERCENT: 30,

        // LocalStorage anahtarları
        STORAGE_KEYS: {
            FEEDBACK_SUBMITTED: 'equimarket_feedback_submitted',
            DISMISS_UNTIL: 'equimarket_feedback_dismiss_until'
        }
    };

    // Puanlama metinleri
    const RATING_TEXTS = {
        1: 'Çok kötü',
        2: 'Kötü',
        3: 'Orta',
        4: 'İyi',
        5: 'Mükemmel!'
    };

    // State
    let currentRating = 0;
    let isInitialized = false;
    let isVisible = false;
    let pageLoadTime = 0;
    let hasUserInteracted = false;
    let hasScrolled = false;
    let popupShownThisPage = false;

    // Banner HTML oluştur
    function createBannerHTML() {
        return `
            <div class="feedback-banner" id="feedbackBanner">
                <button class="feedback-banner-close" id="feedbackBannerClose" title="Kapat" aria-label="Kapat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>

                <div class="feedback-banner-content" id="feedbackBannerContent">
                    <div class="feedback-banner-header">
                        <h4>Deneyiminizi Değerlendirin</h4>
                        <p>1 ücretsiz ilan hakkı kazanın</p>
                    </div>

                    <div class="feedback-banner-stars" id="feedbackBannerStars">
                        ${[1,2,3,4,5].map(n => `
                            <button class="feedback-star" data-rating="${n}" type="button" aria-label="${n} yıldız">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </button>
                        `).join('')}
                    </div>
                    <div class="feedback-rating-label" id="feedbackRatingLabel"></div>

                    <div class="feedback-banner-form" id="feedbackBannerForm" style="display: none;">
                        <textarea
                            class="feedback-banner-textarea"
                            id="feedbackBannerText"
                            placeholder="Görüşlerinizi paylaşın..."
                            rows="2"
                        ></textarea>
                        <button class="feedback-banner-submit" id="feedbackBannerSubmit" type="button">
                            Gönder
                        </button>
                    </div>

                    <button class="feedback-banner-later" id="feedbackBannerLater" type="button">
                        Daha sonra
                    </button>
                </div>

                <div class="feedback-banner-success" id="feedbackBannerSuccess">
                    <div class="feedback-success-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div class="feedback-success-text">
                        <h4>Teşekkürler!</h4>
                        <p>1 ücretsiz ilan hakkı kazandınız.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Banner'ı DOM'a ekle
    function injectBanner() {
        if (document.getElementById('feedbackBanner')) return;

        const container = document.createElement('div');
        container.innerHTML = createBannerHTML();
        document.body.appendChild(container.firstElementChild);
    }

    // Event listener'ları bağla
    function bindEvents() {
        const banner = document.getElementById('feedbackBanner');
        if (!banner) return;

        // Yıldız rating
        const stars = banner.querySelectorAll('.feedback-star');
        stars.forEach(star => {
            star.addEventListener('click', handleStarClick);
            star.addEventListener('mouseenter', handleStarHover);
            star.addEventListener('mouseleave', handleStarLeave);
        });

        // Kapat butonu
        document.getElementById('feedbackBannerClose')?.addEventListener('click', dismissBanner);

        // Daha sonra butonu
        document.getElementById('feedbackBannerLater')?.addEventListener('click', dismissBanner);

        // Gönder butonu
        document.getElementById('feedbackBannerSubmit')?.addEventListener('click', handleSubmit);

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isVisible) {
                dismissBanner();
            }
        });

        // Kullanıcı etkileşimi takibi
        document.addEventListener('click', onUserInteraction, { once: true, passive: true });
        document.addEventListener('scroll', onUserScroll, { passive: true });
    }

    // Kullanıcı tıkladığında
    function onUserInteraction() {
        hasUserInteracted = true;
        checkAndShowBanner();
    }

    // Kullanıcı scroll yaptığında
    function onUserScroll() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

        if (scrollPercent >= CONFIG.MIN_SCROLL_PERCENT) {
            hasScrolled = true;
            checkAndShowBanner();
        }
    }

    // Banner gösterilmeli mi kontrol et ve göster
    function checkAndShowBanner() {
        if (popupShownThisPage) return;
        if (!shouldShowBanner()) return;

        const timeOnPage = Date.now() - pageLoadTime;
        const hasEnoughTime = timeOnPage >= CONFIG.MIN_TIME_ON_PAGE;
        const hasInteraction = hasUserInteracted || hasScrolled;

        if (hasEnoughTime && hasInteraction) {
            showBanner();
        }
    }

    // Yıldız tıklama
    function handleStarClick(e) {
        const btn = e.currentTarget;
        currentRating = parseInt(btn.dataset.rating);
        updateStars();

        // Form alanını göster
        const form = document.getElementById('feedbackBannerForm');
        const laterBtn = document.getElementById('feedbackBannerLater');
        if (form) form.style.display = 'flex';
        if (laterBtn) laterBtn.style.display = 'none';

        // Textarea'ya focus
        setTimeout(() => {
            document.getElementById('feedbackBannerText')?.focus();
        }, 100);
    }

    // Yıldız hover
    function handleStarHover(e) {
        const rating = parseInt(e.currentTarget.dataset.rating);
        const stars = document.querySelectorAll('.feedback-star');

        stars.forEach((star, index) => {
            star.classList.toggle('hover', index < rating);
        });

        const label = document.getElementById('feedbackRatingLabel');
        if (label) label.textContent = RATING_TEXTS[rating];
    }

    // Yıldız hover çıkış
    function handleStarLeave() {
        const stars = document.querySelectorAll('.feedback-star');
        stars.forEach(star => star.classList.remove('hover'));

        const label = document.getElementById('feedbackRatingLabel');
        if (label) label.textContent = currentRating ? RATING_TEXTS[currentRating] : '';
    }

    // Yıldızları güncelle
    function updateStars() {
        const stars = document.querySelectorAll('.feedback-star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < currentRating);
        });

        const label = document.getElementById('feedbackRatingLabel');
        if (label) label.textContent = RATING_TEXTS[currentRating];
    }

    // Form gönder
    async function handleSubmit() {
        const textarea = document.getElementById('feedbackBannerText');
        const text = textarea?.value.trim() || '';
        const submitBtn = document.getElementById('feedbackBannerSubmit');

        if (!currentRating) {
            if (typeof toast !== 'undefined') toast.warning('Lütfen bir puan verin.');
            return;
        }

        // Butonu devre dışı bırak
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Gönderiliyor...';
        }

        try {
            // API'ye gönder
            if (typeof api !== 'undefined') {
                const response = await api.post('/feedback', {
                    rating: currentRating,
                    text: text,
                    page: window.location.pathname
                });

                // Kullanıcı bilgisini güncelle
                if (response?.success && response?.data?.user) {
                    const userData = localStorage.getItem('equimarket_user');
                    if (userData) {
                        localStorage.setItem('equimarket_user', JSON.stringify(response.data.user));
                    }
                }
            }

            // Feedback verildi olarak işaretle (kalıcı)
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_SUBMITTED, 'true');

            // Başarı ekranını göster
            showSuccess();

            // Toast göster
            if (typeof toast !== 'undefined') {
                toast.success('Geribildiriminiz için teşekkürler!');
            }

        } catch (error) {
            console.error('Feedback gönderme hatası:', error);

            // Hata olsa bile başarılı say (UX için)
            localStorage.setItem(CONFIG.STORAGE_KEYS.FEEDBACK_SUBMITTED, 'true');
            showSuccess();
        }
    }

    // Başarı ekranını göster
    function showSuccess() {
        const content = document.getElementById('feedbackBannerContent');
        const success = document.getElementById('feedbackBannerSuccess');

        if (content) content.style.display = 'none';
        if (success) success.style.display = 'flex';

        // 3 saniye sonra kapat
        setTimeout(() => {
            hideBanner();
        }, 3000);
    }

    // Banner'ı göster
    function showBanner() {
        const banner = document.getElementById('feedbackBanner');
        if (!banner || isVisible || popupShownThisPage) return;

        popupShownThisPage = true;
        isVisible = true;

        // Önce görünür yap (ama opacity 0)
        banner.style.display = 'block';

        // Animasyonu başlatmak için frame bekle
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                banner.classList.add('show');
            });
        });
    }

    // Banner'ı gizle
    function hideBanner() {
        const banner = document.getElementById('feedbackBanner');
        if (!banner) return;

        banner.classList.remove('show');
        isVisible = false;

        // Animasyon bittikten sonra gizle
        setTimeout(() => {
            banner.style.display = 'none';
            resetForm();
        }, 300);
    }

    // Banner'ı ertele (dismiss)
    function dismissBanner() {
        // 7 gün boyunca gösterme
        const dismissUntil = Date.now() + CONFIG.DISMISS_COOLDOWN;
        localStorage.setItem(CONFIG.STORAGE_KEYS.DISMISS_UNTIL, dismissUntil.toString());

        hideBanner();
    }

    // Form state'i sıfırla
    function resetForm() {
        currentRating = 0;

        const textarea = document.getElementById('feedbackBannerText');
        const submitBtn = document.getElementById('feedbackBannerSubmit');
        const form = document.getElementById('feedbackBannerForm');
        const laterBtn = document.getElementById('feedbackBannerLater');
        const content = document.getElementById('feedbackBannerContent');
        const success = document.getElementById('feedbackBannerSuccess');
        const label = document.getElementById('feedbackRatingLabel');

        if (textarea) textarea.value = '';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gönder';
        }
        if (form) form.style.display = 'none';
        if (laterBtn) laterBtn.style.display = 'inline-flex';
        if (content) content.style.display = 'block';
        if (success) success.style.display = 'none';
        if (label) label.textContent = '';

        const stars = document.querySelectorAll('.feedback-star');
        stars.forEach(star => {
            star.classList.remove('active', 'hover');
        });
    }

    // Kullanıcı giriş yapmış mı
    function isUserLoggedIn() {
        return !!localStorage.getItem('equimarket_token');
    }

    // Feedback daha önce gönderilmiş mi
    function hasFeedbackSubmitted() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.FEEDBACK_SUBMITTED) === 'true';
    }

    // Dismiss cooldown aktif mi
    function isDismissCooldownActive() {
        const dismissUntil = localStorage.getItem(CONFIG.STORAGE_KEYS.DISMISS_UNTIL);
        if (!dismissUntil) return false;

        return Date.now() < parseInt(dismissUntil);
    }

    // Banner gösterilmeli mi
    function shouldShowBanner() {
        // Giriş yapmamışsa gösterme
        if (!isUserLoggedIn()) return false;

        // Daha önce feedback gönderilmişse ASLA gösterme
        if (hasFeedbackSubmitted()) return false;

        // Dismiss cooldown aktifse gösterme
        if (isDismissCooldownActive()) return false;

        return true;
    }

    // Zamanlayıcıyı başlat
    function startTimer() {
        if (!shouldShowBanner()) return;

        // Minimum süre geçtikten sonra kontrol et
        setTimeout(() => {
            checkAndShowBanner();
        }, CONFIG.MIN_TIME_ON_PAGE);
    }

    // Başlat
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        // Sayfa yüklenme zamanını kaydet
        pageLoadTime = Date.now();

        // Banner'ı DOM'a ekle
        injectBanner();

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

    // Global erişim için (test amaçlı)
    window.EquiMarketFeedback = {
        show: showBanner,
        hide: hideBanner,
        reset: resetForm
    };

})();
