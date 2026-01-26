// Cookie Consent Banner for KVKK/GDPR Compliance
(function() {
    'use strict';

    const COOKIE_CONSENT_KEY = 'equimarket_cookie_consent';
    const CONSENT_VERSION = '1.0';

    // Check if consent already given
    const existingConsent = getConsent();
    if (existingConsent && existingConsent.version === CONSENT_VERSION) {
        applyConsent(existingConsent);
        return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
    } else {
        showBanner();
    }

    function showBanner() {
        const banner = createBanner();
        document.body.appendChild(banner);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                banner.classList.add('show');
            });
        });
    }

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-icon">🍪</div>
                <div class="cookie-text">
                    <h4>Çerez Politikası</h4>
                    <p>
                        Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Sitemizi kullanarak
                        <a href="/kvkk.html" target="_blank">KVKK Aydınlatma Metni</a> ve
                        <a href="/cookies.html" target="_blank">Çerez Politikamızı</a> kabul etmiş olursunuz.
                    </p>
                </div>
                <div class="cookie-actions">
                    <button class="cookie-btn cookie-btn-settings" id="cookie-settings-btn">Ayarlar</button>
                    <button class="cookie-btn cookie-btn-reject" id="cookie-reject-btn">Reddet</button>
                    <button class="cookie-btn cookie-btn-accept" id="cookie-accept-btn">Kabul Et</button>
                </div>
            </div>

            <!-- Settings Modal -->
            <div class="cookie-settings-modal" id="cookie-settings-modal">
                <div class="cookie-settings-content">
                    <div class="cookie-settings-header">
                        <h3>Çerez Tercihleri</h3>
                        <button class="cookie-settings-close" id="cookie-settings-close">&times;</button>
                    </div>
                    <div class="cookie-settings-body">
                        <div class="cookie-category">
                            <div class="cookie-category-header">
                                <div>
                                    <strong>Zorunlu Çerezler</strong>
                                    <p>Sitenin çalışması için gerekli çerezler. Devre dışı bırakılamaz.</p>
                                </div>
                                <label class="cookie-toggle disabled">
                                    <input type="checkbox" checked disabled>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="cookie-category">
                            <div class="cookie-category-header">
                                <div>
                                    <strong>Analitik Çerezler</strong>
                                    <p>Site kullanımını anlamamıza yardımcı olan çerezler.</p>
                                </div>
                                <label class="cookie-toggle">
                                    <input type="checkbox" id="cookie-analytics" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="cookie-category">
                            <div class="cookie-category-header">
                                <div>
                                    <strong>Pazarlama Çerezleri</strong>
                                    <p>Kişiselleştirilmiş reklamlar için kullanılan çerezler.</p>
                                </div>
                                <label class="cookie-toggle">
                                    <input type="checkbox" id="cookie-marketing">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="cookie-settings-footer">
                        <button class="cookie-btn cookie-btn-accept" id="cookie-save-settings">Tercihleri Kaydet</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: -300px;
                left: 0;
                right: 0;
                background: #fff;
                box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
                z-index: 100000;
                transition: bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border-top: 3px solid #1a3d2e;
            }

            #cookie-consent-banner.show {
                bottom: 0;
            }

            .cookie-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px 24px;
                display: flex;
                align-items: center;
                gap: 20px;
                flex-wrap: wrap;
            }

            .cookie-icon {
                font-size: 40px;
                flex-shrink: 0;
            }

            .cookie-text {
                flex: 1;
                min-width: 250px;
            }

            .cookie-text h4 {
                font-size: 16px;
                font-weight: 600;
                color: #1a3d2e;
                margin-bottom: 6px;
            }

            .cookie-text p {
                font-size: 14px;
                color: #6b6b6b;
                line-height: 1.5;
                margin: 0;
            }

            .cookie-text a {
                color: #1a3d2e;
                text-decoration: underline;
            }

            .cookie-text a:hover {
                color: #c9a55c;
            }

            .cookie-actions {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }

            .cookie-btn {
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }

            .cookie-btn-accept {
                background: #1a3d2e;
                color: #fff;
            }

            .cookie-btn-accept:hover {
                background: #2d5a47;
                transform: translateY(-1px);
            }

            .cookie-btn-reject {
                background: #f5f4f0;
                color: #6b6b6b;
            }

            .cookie-btn-reject:hover {
                background: #e8e7e3;
            }

            .cookie-btn-settings {
                background: transparent;
                color: #1a3d2e;
                border: 1px solid #1a3d2e;
            }

            .cookie-btn-settings:hover {
                background: #1a3d2e;
                color: #fff;
            }

            /* Settings Modal */
            .cookie-settings-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 100001;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .cookie-settings-modal.show {
                display: flex;
            }

            .cookie-settings-content {
                background: #fff;
                border-radius: 16px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: modalSlideIn 0.3s ease;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .cookie-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #f0f0f0;
            }

            .cookie-settings-header h3 {
                font-size: 18px;
                font-weight: 600;
                color: #1a3d2e;
                margin: 0;
            }

            .cookie-settings-close {
                background: none;
                border: none;
                font-size: 28px;
                color: #6b6b6b;
                cursor: pointer;
                line-height: 1;
                padding: 0;
            }

            .cookie-settings-close:hover {
                color: #1a3d2e;
            }

            .cookie-settings-body {
                padding: 20px 24px;
                overflow-y: auto;
            }

            .cookie-category {
                padding: 16px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .cookie-category:last-child {
                border-bottom: none;
            }

            .cookie-category-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
            }

            .cookie-category strong {
                display: block;
                font-size: 14px;
                color: #2a2a2a;
                margin-bottom: 4px;
            }

            .cookie-category p {
                font-size: 13px;
                color: #6b6b6b;
                line-height: 1.4;
                margin: 0;
            }

            /* Toggle Switch */
            .cookie-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 28px;
                flex-shrink: 0;
            }

            .cookie-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: 0.3s;
                border-radius: 28px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
            }

            .cookie-toggle input:checked + .toggle-slider {
                background-color: #1a3d2e;
            }

            .cookie-toggle input:checked + .toggle-slider:before {
                transform: translateX(22px);
            }

            .cookie-toggle.disabled .toggle-slider {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .cookie-settings-footer {
                padding: 16px 24px;
                border-top: 1px solid #f0f0f0;
                text-align: right;
            }

            @media (max-width: 768px) {
                .cookie-content {
                    flex-direction: column;
                    text-align: center;
                }

                .cookie-actions {
                    width: 100%;
                    flex-direction: column;
                }

                .cookie-btn {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);

        // Add event listeners
        setTimeout(() => {
            document.getElementById('cookie-accept-btn').addEventListener('click', () => acceptAll());
            document.getElementById('cookie-reject-btn').addEventListener('click', () => rejectAll());
            document.getElementById('cookie-settings-btn').addEventListener('click', () => showSettings());
            document.getElementById('cookie-settings-close').addEventListener('click', () => hideSettings());
            document.getElementById('cookie-save-settings').addEventListener('click', () => saveSettings());

            // Close modal on backdrop click
            document.getElementById('cookie-settings-modal').addEventListener('click', (e) => {
                if (e.target.id === 'cookie-settings-modal') {
                    hideSettings();
                }
            });
        }, 100);

        return banner;
    }

    function acceptAll() {
        const consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            necessary: true,
            analytics: true,
            marketing: true
        };
        saveConsent(consent);
        applyConsent(consent);
        hideBanner();
    }

    function rejectAll() {
        const consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            necessary: true,
            analytics: false,
            marketing: false
        };
        saveConsent(consent);
        applyConsent(consent);
        hideBanner();
    }

    function showSettings() {
        document.getElementById('cookie-settings-modal').classList.add('show');
    }

    function hideSettings() {
        document.getElementById('cookie-settings-modal').classList.remove('show');
    }

    function saveSettings() {
        const consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            necessary: true,
            analytics: document.getElementById('cookie-analytics').checked,
            marketing: document.getElementById('cookie-marketing').checked
        };
        saveConsent(consent);
        applyConsent(consent);
        hideSettings();
        hideBanner();
    }

    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 400);
        }
    }

    function saveConsent(consent) {
        try {
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
        } catch (e) {
            console.error('Failed to save cookie consent:', e);
        }
    }

    function getConsent() {
        try {
            const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    function applyConsent(consent) {
        // Enable/disable analytics
        if (consent.analytics) {
            enableAnalytics();
        } else {
            disableAnalytics();
        }

        // Enable/disable marketing
        if (consent.marketing) {
            enableMarketing();
        } else {
            disableMarketing();
        }

        // Dispatch event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    }

    function enableAnalytics() {
        // Google Analytics initialization would go here
        // Example:
        // if (typeof gtag !== 'undefined') {
        //     gtag('consent', 'update', { analytics_storage: 'granted' });
        // }
        console.log('Analytics cookies enabled');
    }

    function disableAnalytics() {
        // Disable analytics tracking
        // Example:
        // if (typeof gtag !== 'undefined') {
        //     gtag('consent', 'update', { analytics_storage: 'denied' });
        // }
        console.log('Analytics cookies disabled');
    }

    function enableMarketing() {
        // Enable marketing/advertising cookies
        console.log('Marketing cookies enabled');
    }

    function disableMarketing() {
        // Disable marketing/advertising cookies
        console.log('Marketing cookies disabled');
    }

    // Expose functions globally for manual control
    window.EquiMarketCookies = {
        showBanner,
        getConsent,
        acceptAll,
        rejectAll,
        showSettings
    };
})();
