const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Log formatı
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
        if (stack) log += `\n${stack}`;
        if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
        return log;
    })
);

// Console formatı (renkli)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) log += `\n${stack}`;
        return log;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // Console - her zaman
        new winston.transports.Console({
            format: consoleFormat
        }),
        // Dosya - tüm loglar
        new winston.transports.File({
            filename: path.join(logDir, 'app.log'),
            format: logFormat,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5
        }),
        // Dosya - sadece hatalar
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        })
    ]
});

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        };

        if (res.statusCode >= 400) {
            logger.warn('Request failed', logData);
        } else if (duration > 3000) {
            logger.warn('Slow request', logData);
        }
    });
    next();
};

module.exports = { logger, requestLogger };
