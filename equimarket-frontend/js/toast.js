/**
 * EquiMarket Toast Notification System
 * Modern, accessible toast notifications with confirm and prompt dialogs
 */

(function() {
    'use strict';

    // SVG Icons
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        close: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>',
        question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'
    };

    // Default titles for each type (Turkish)
    const defaultTitles = {
        success: 'Başarılı',
        error: 'Hata',
        warning: 'Uyarı',
        info: 'Bilgi'
    };

    // Create container if it doesn't exist
    function getContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.setAttribute('role', 'alert');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        return container;
    }

    // Create toast element
    function createToast(options) {
        const {
            type = 'info',
            title,
            message,
            duration = 4000,
            showProgress = true,
            closable = true
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const displayTitle = title || defaultTitles[type] || 'Bildirim';

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(displayTitle)}</div>
                ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
            </div>
            ${closable ? `<button class="toast-close" aria-label="Kapat">${icons.close}</button>` : ''}
            ${showProgress && duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        // Close button handler
        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => hideToast(toast));
        }

        return toast;
    }

    // Show toast
    function showToast(toast, duration) {
        const container = getContainer();
        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Progress bar animation
        const progress = toast.querySelector('.toast-progress');
        if (progress && duration > 0) {
            progress.style.width = '100%';
            requestAnimationFrame(() => {
                progress.style.transitionDuration = duration + 'ms';
                progress.style.width = '0%';
            });
        }

        // Auto hide
        if (duration > 0) {
            toast._timeout = setTimeout(() => hideToast(toast), duration);
        }

        return toast;
    }

    // Hide toast
    function hideToast(toast) {
        if (toast._timeout) {
            clearTimeout(toast._timeout);
        }

        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Main toast function
    function toast(messageOrOptions, type = 'info') {
        let options = {};

        if (typeof messageOrOptions === 'string') {
            options = { message: messageOrOptions, type };
        } else {
            options = messageOrOptions;
        }

        const toastEl = createToast(options);
        return showToast(toastEl, options.duration !== undefined ? options.duration : 4000);
    }

    // Convenience methods
    toast.success = function(message, options = {}) {
        return toast({ ...options, message, type: 'success' });
    };

    toast.error = function(message, options = {}) {
        return toast({ ...options, message, type: 'error', duration: options.duration || 5000 });
    };

    toast.warning = function(message, options = {}) {
        return toast({ ...options, message, type: 'warning' });
    };

    toast.info = function(message, options = {}) {
        return toast({ ...options, message, type: 'info' });
    };

    // Confirm dialog (replaces window.confirm)
    toast.confirm = function(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Onay',
                confirmText = 'Evet',
                cancelText = 'İptal',
                type = 'warning', // 'warning' or 'danger'
                icon = type === 'danger' ? 'trash' : 'question'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'toast-confirm-overlay';
            overlay.innerHTML = `
                <div class="toast-confirm-dialog">
                    <div class="toast-confirm-icon ${type}">${icons[icon] || icons.question}</div>
                    <div class="toast-confirm-title">${escapeHtml(title)}</div>
                    <div class="toast-confirm-message">${escapeHtml(message)}</div>
                    <div class="toast-confirm-buttons">
                        <button class="toast-confirm-btn cancel">${escapeHtml(cancelText)}</button>
                        <button class="toast-confirm-btn ${type === 'danger' ? 'danger' : 'confirm'}">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Show animation
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            const closeDialog = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve(result);
                }, 300);
            };

            // Button handlers
            const cancelBtn = overlay.querySelector('.toast-confirm-btn.cancel');
            const confirmBtn = overlay.querySelector('.toast-confirm-btn.confirm, .toast-confirm-btn.danger');

            cancelBtn.addEventListener('click', () => closeDialog(false));
            confirmBtn.addEventListener('click', () => closeDialog(true));

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeDialog(false);
                }
            });

            // Close on Escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeydown);
                    closeDialog(false);
                } else if (e.key === 'Enter') {
                    document.removeEventListener('keydown', handleKeydown);
                    closeDialog(true);
                }
            };
            document.addEventListener('keydown', handleKeydown);

            // Focus confirm button
            confirmBtn.focus();
        });
    };

    // Prompt dialog (replaces window.prompt)
    toast.prompt = function(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Giriş',
                placeholder = '',
                defaultValue = '',
                confirmText = 'Tamam',
                cancelText = 'İptal',
                required = false
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'toast-confirm-overlay';
            overlay.innerHTML = `
                <div class="toast-confirm-dialog">
                    <div class="toast-confirm-icon warning">${icons.question}</div>
                    <div class="toast-confirm-title">${escapeHtml(title)}</div>
                    <div class="toast-confirm-message">${escapeHtml(message)}</div>
                    <input type="text" class="toast-prompt-input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(defaultValue)}">
                    <div class="toast-confirm-buttons">
                        <button class="toast-confirm-btn cancel">${escapeHtml(cancelText)}</button>
                        <button class="toast-confirm-btn confirm">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Show animation
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            const input = overlay.querySelector('.toast-prompt-input');
            const cancelBtn = overlay.querySelector('.toast-confirm-btn.cancel');
            const confirmBtn = overlay.querySelector('.toast-confirm-btn.confirm');

            const closeDialog = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve(result);
                }, 300);
            };

            const submitValue = () => {
                const value = input.value.trim();
                if (required && !value) {
                    input.style.borderColor = '#c44536';
                    input.focus();
                    return;
                }
                closeDialog(value || null);
            };

            cancelBtn.addEventListener('click', () => closeDialog(null));
            confirmBtn.addEventListener('click', submitValue);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitValue();
                }
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeDialog(null);
                }
            });

            // Close on Escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeydown);
                    closeDialog(null);
                }
            };
            document.addEventListener('keydown', handleKeydown);

            // Focus input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    };

    // Clear all toasts
    toast.clear = function() {
        const container = document.querySelector('.toast-container');
        if (container) {
            const toasts = container.querySelectorAll('.toast');
            toasts.forEach(t => hideToast(t));
        }
    };

    // Export to window
    window.toast = toast;

    // Override native alert for automatic replacement (optional - can be enabled)
    // Uncomment below to automatically replace all alert() calls
    /*
    window._originalAlert = window.alert;
    window.alert = function(message) {
        toast.info(message);
    };
    */

})();
