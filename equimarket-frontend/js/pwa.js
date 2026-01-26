// PWA Registration and Install Prompt
(function() {
    'use strict';

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        reg.update();
                    }, 60 * 60 * 1000); // Check every hour
                })
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }

    // Install Prompt
    let deferredPrompt;
    const installBanner = createInstallBanner();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install banner if not already installed and not dismissed recently
        const dismissedTime = localStorage.getItem('pwa-install-dismissed');
        if (!dismissedTime || Date.now() - parseInt(dismissedTime) > 7 * 24 * 60 * 60 * 1000) {
            setTimeout(() => showInstallBanner(), 3000);
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        hideInstallBanner();
        deferredPrompt = null;
    });

    function createInstallBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">🐎</div>
                <div class="pwa-banner-text">
                    <strong>EquiMarket'i Yükle</strong>
                    <span>Ana ekranınıza ekleyerek daha hızlı erişin</span>
                </div>
                <div class="pwa-banner-actions">
                    <button class="pwa-install-btn">Yükle</button>
                    <button class="pwa-dismiss-btn">Sonra</button>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-banner {
                position: fixed;
                bottom: -100px;
                left: 50%;
                transform: translateX(-50%);
                width: calc(100% - 32px);
                max-width: 500px;
                background: linear-gradient(135deg, #1a3d2e 0%, #2d5a45 100%);
                border-radius: 16px;
                padding: 16px 20px;
                box-shadow: 0 10px 40px rgba(26, 61, 46, 0.3);
                z-index: 10000;
                transition: bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            #pwa-install-banner.show {
                bottom: 24px;
            }

            .pwa-banner-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #fff;
            }

            .pwa-banner-icon {
                font-size: 32px;
                flex-shrink: 0;
            }

            .pwa-banner-text {
                flex: 1;
                min-width: 0;
            }

            .pwa-banner-text strong {
                display: block;
                font-size: 14px;
                font-weight: 600;
            }

            .pwa-banner-text span {
                display: block;
                font-size: 12px;
                opacity: 0.85;
            }

            .pwa-banner-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .pwa-install-btn {
                background: #c9a55c;
                color: #1a3d2e;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            }

            .pwa-install-btn:hover {
                background: #e8d5a8;
                transform: scale(1.05);
            }

            .pwa-dismiss-btn {
                background: transparent;
                color: rgba(255,255,255,0.7);
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .pwa-dismiss-btn:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            @media (max-width: 480px) {
                .pwa-banner-content {
                    flex-wrap: wrap;
                }

                .pwa-banner-actions {
                    width: 100%;
                    margin-top: 8px;
                }

                .pwa-install-btn, .pwa-dismiss-btn {
                    flex: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        banner.querySelector('.pwa-install-btn').addEventListener('click', installApp);
        banner.querySelector('.pwa-dismiss-btn').addEventListener('click', dismissBanner);

        return banner;
    }

    function showInstallBanner() {
        if (installBanner) {
            installBanner.classList.add('show');
        }
    }

    function hideInstallBanner() {
        if (installBanner) {
            installBanner.classList.remove('show');
        }
    }

    function dismissBanner() {
        hideInstallBanner();
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    async function installApp() {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        deferredPrompt = null;
        hideInstallBanner();
    }

    // Expose functions globally
    window.EquiMarketPWA = {
        showInstallBanner,
        hideInstallBanner,
        installApp
    };
})();
