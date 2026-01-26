// Bot Protection Middleware
// Validates honeypot fields and timing checks

const MIN_REQUEST_TIME = 2000; // 2 seconds minimum between page load and form submit
const requestTimestamps = new Map();

// Clean up old timestamps periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, time] of requestTimestamps.entries()) {
        if (now - time > 3600000) { // 1 hour
            requestTimestamps.delete(key);
        }
    }
}, 600000); // Clean every 10 minutes

// Main bot protection middleware
const botProtection = (options = {}) => {
    const {
        honeypotFields = ['website_url', 'email_confirm'],
        checkTiming = true,
        minTime = MIN_REQUEST_TIME
    } = options;

    return (req, res, next) => {
        // Check honeypot fields
        for (const field of honeypotFields) {
            if (req.body[field]) {
                console.log(`[Bot Protection] Honeypot triggered: ${field}`);
                // Silently fail (don't tell bots they've been caught)
                return res.status(200).json({
                    success: true,
                    message: 'İşlem başarılı'
                });
            }
            // Remove honeypot field from body
            delete req.body[field];
        }

        // Check timing (if client sent a security token)
        if (checkTiming && req.body.security_timestamp) {
            const timestamp = parseInt(req.body.security_timestamp);
            if (!isNaN(timestamp)) {
                const elapsed = Date.now() - timestamp;
                if (elapsed < minTime) {
                    console.log(`[Bot Protection] Request too fast: ${elapsed}ms`);
                    return res.status(400).json({
                        success: false,
                        message: 'Lütfen biraz bekleyin ve tekrar deneyin'
                    });
                }
            }
            delete req.body.security_timestamp;
        }

        // Check for suspicious patterns
        if (isSuspiciousRequest(req)) {
            console.log('[Bot Protection] Suspicious request detected');
            return res.status(429).json({
                success: false,
                message: 'İstek reddedildi'
            });
        }

        next();
    };
};

// Check for suspicious request patterns
const isSuspiciousRequest = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Check for empty or suspicious user agents
    if (!userAgent || userAgent.length < 10) {
        return true;
    }

    // Check for known bot user agents
    const botPatterns = [
        /bot/i,
        /spider/i,
        /crawl/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python-requests/i,
        /java\//i,
        /node-fetch/i
    ];

    // Allow some legitimate bots
    const allowedBots = [
        /googlebot/i,
        /bingbot/i,
        /slurp/i,
        /duckduckbot/i,
        /facebookexternalhit/i,
        /twitterbot/i
    ];

    const isBot = botPatterns.some(p => p.test(userAgent));
    const isAllowedBot = allowedBots.some(p => p.test(userAgent));

    // If it's a bot but not an allowed one, mark as suspicious
    // But only for POST requests (allow bots to read)
    if (isBot && !isAllowedBot && req.method === 'POST') {
        return true;
    }

    return false;
};

// Simple CAPTCHA validator (for math CAPTCHA)
const validateCaptcha = (answer, expected) => {
    if (!answer || !expected) return false;
    return answer.toString().trim() === expected.toString().trim();
};

// Track request timestamp
const trackRequest = (identifier) => {
    requestTimestamps.set(identifier, Date.now());
};

// Get request timestamp
const getRequestTimestamp = (identifier) => {
    return requestTimestamps.get(identifier);
};

module.exports = {
    botProtection,
    isSuspiciousRequest,
    validateCaptcha,
    trackRequest,
    getRequestTimestamp
};
