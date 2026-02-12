// EquiMarket Bot Protection System
// Uses honeypot + time-based validation + simple math CAPTCHA
(function() {
    'use strict';

    // Configuration
    const MIN_SUBMIT_TIME = 3000; // Minimum 3 seconds before form can be submitted
    const CAPTCHA_QUESTIONS = [
        { q: '3 + 4 = ?', a: '7' },
        { q: '5 + 2 = ?', a: '7' },
        { q: '8 - 3 = ?', a: '5' },
        { q: '6 + 1 = ?', a: '7' },
        { q: '9 - 4 = ?', a: '5' },
        { q: '2 + 6 = ?', a: '8' },
        { q: '7 - 2 = ?', a: '5' },
        { q: '4 + 4 = ?', a: '8' },
        { q: '10 - 6 = ?', a: '4' },
        { q: '1 + 5 = ?', a: '6' }
    ];

    // Track form load times
    const formLoadTimes = new Map();

    // Initialize protection for a form
    const protectForm = (form, options = {}) => {
        if (!form) return null;

        const formId = form.id || `form-${Date.now()}`;
        formLoadTimes.set(formId, Date.now());

        // Add honeypot field
        const honeypot = createHoneypot();
        form.appendChild(honeypot);

        // Add CAPTCHA if requested
        let captchaData = null;
        if (options.captcha) {
            captchaData = addCaptcha(form, options.captchaContainer);
        }

        // Store protection data
        form.dataset.protectionId = formId;

        return {
            formId,
            captchaData,
            validate: () => validateForm(form, captchaData)
        };
    };

    // Create honeypot field
    const createHoneypot = () => {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;overflow:hidden;pointer-events:none;';
        container.setAttribute('aria-hidden', 'true');
        container.setAttribute('tabindex', '-1');

        container.innerHTML = `
            <label for="website_url">Website (leave empty)</label>
            <input type="text" name="website_url" id="website_url" tabindex="-1" autocomplete="off">
            <label for="email_confirm">Confirm Email (leave empty)</label>
            <input type="email" name="email_confirm" id="email_confirm" tabindex="-1" autocomplete="off">
        `;

        return container;
    };

    // Add CAPTCHA to form
    const addCaptcha = (form, containerSelector) => {
        const question = CAPTCHA_QUESTIONS[Math.floor(Math.random() * CAPTCHA_QUESTIONS.length)];
        const captchaId = `captcha-${Date.now()}`;

        const captchaHTML = `
            <div class="captcha-container" id="${captchaId}" style="margin-top:16px;padding:16px;background:#f5f4f0;border-radius:12px;border:1px solid #e5e5e5;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <span style="font-size:16px;font-weight:600;color:#1a3d2e;">Doğrulama</span>
                    <span style="font-weight:600;color:#2a2a2a;">Robot Doğrulaması</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:16px;color:#2a2a2a;font-weight:500;">${question.q}</span>
                    <input type="text"
                        name="captcha_answer"
                        id="captcha_answer_${captchaId}"
                        placeholder="Cevap"
                        maxlength="3"
                        autocomplete="off"
                        style="width:80px;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:16px;text-align:center;">
                </div>
            </div>
        `;

        if (containerSelector) {
            const container = form.querySelector(containerSelector);
            if (container) {
                container.innerHTML = captchaHTML;
            }
        } else {
            // Insert before submit button
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.insertAdjacentHTML('beforebegin', captchaHTML);
            } else {
                form.insertAdjacentHTML('beforeend', captchaHTML);
            }
        }

        return {
            id: captchaId,
            answer: question.a,
            inputId: `captcha_answer_${captchaId}`
        };
    };

    // Validate form
    const validateForm = (form, captchaData) => {
        const errors = [];

        // Check honeypot
        const websiteField = form.querySelector('input[name="website_url"]');
        const emailConfirmField = form.querySelector('input[name="email_confirm"]');

        if ((websiteField && websiteField.value) || (emailConfirmField && emailConfirmField.value)) {
            console.warn('[Bot Protection] Honeypot triggered');
            errors.push('bot_detected');
            return { valid: false, errors, isBot: true };
        }

        // Check time
        const formId = form.dataset.protectionId;
        const loadTime = formLoadTimes.get(formId);
        if (loadTime) {
            const elapsed = Date.now() - loadTime;
            if (elapsed < MIN_SUBMIT_TIME) {
                console.warn('[Bot Protection] Form submitted too quickly');
                errors.push('too_fast');
            }
        }

        // Check CAPTCHA
        if (captchaData) {
            const input = document.getElementById(captchaData.inputId);
            if (!input || input.value.trim() !== captchaData.answer) {
                errors.push('captcha_invalid');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            isBot: errors.includes('bot_detected')
        };
    };

    // Reset CAPTCHA
    const resetCaptcha = (captchaId) => {
        const container = document.getElementById(captchaId);
        if (!container) return null;

        const question = CAPTCHA_QUESTIONS[Math.floor(Math.random() * CAPTCHA_QUESTIONS.length)];
        const newCaptchaId = `captcha-${Date.now()}`;

        // Update question text
        const questionSpan = container.querySelector('span[style*="font-weight:500"]');
        if (questionSpan) {
            questionSpan.textContent = question.q;
        }

        // Clear input
        const input = container.querySelector('input[name="captcha_answer"]');
        if (input) {
            input.value = '';
            input.id = `captcha_answer_${newCaptchaId}`;
        }

        container.id = newCaptchaId;

        return {
            id: newCaptchaId,
            answer: question.a,
            inputId: `captcha_answer_${newCaptchaId}`
        };
    };

    // Check if request looks like a bot (for server-side check)
    const generateSecurityToken = () => {
        const data = {
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
            touchSupport: 'ontouchstart' in window
        };

        // Simple hash of the data
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return {
            token: Math.abs(hash).toString(36) + Date.now().toString(36),
            timestamp: data.timestamp
        };
    };

    // Show error message
    const showCaptchaError = (message) => {
        if (window.showToast) {
            window.showToast(message || 'Lütfen doğrulama işlemini tamamlayın', 'error');
        } else {
            alert(message || 'Lütfen doğrulama işlemini tamamlayın');
        }
    };

    // Expose API globally
    window.EquiMarketCaptcha = {
        protectForm,
        validateForm,
        resetCaptcha,
        generateSecurityToken,
        showCaptchaError,
        MIN_SUBMIT_TIME
    };
})();
