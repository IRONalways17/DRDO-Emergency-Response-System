const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${message} ${metaString}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'drdo-realtime-server' },
    transports: [
        // Write all logs to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
            tailable: true
        }),
        // Write error logs to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
            tailable: true
        }),
        // Write emergency logs to emergency.log
        new winston.transports.File({
            filename: path.join(logsDir, 'emergency.log'),
            level: 'warn',
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
            tailable: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Add custom logging methods for emergency system
logger.emergency = (message, meta = {}) => {
    logger.error(`[EMERGENCY] ${message}`, meta);
};

logger.incident = (message, meta = {}) => {
    logger.warn(`[INCIDENT] ${message}`, meta);
};

logger.responder = (message, meta = {}) => {
    logger.info(`[RESPONDER] ${message}`, meta);
};

logger.security = (message, meta = {}) => {
    logger.warn(`[SECURITY] ${message}`, meta);
};

logger.performance = (message, meta = {}) => {
    logger.info(`[PERFORMANCE] ${message}`, meta);
};

// Request logging middleware
logger.requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        if (res.statusCode >= 400) {
            logger.error('HTTP Request Error', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });
    
    next();
};

// Socket logging helper
logger.socketEvent = (event, socketId, userId, data = {}) => {
    logger.info(`Socket Event: ${event}`, {
        socketId,
        userId,
        event,
        ...data
    });
};

// Error logging helper
logger.socketError = (error, socketId, userId, context = {}) => {
    logger.error('Socket Error', {
        error: error.message,
        stack: error.stack,
        socketId,
        userId,
        ...context
    });
};

module.exports = logger;
