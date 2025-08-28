const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

class SecurityUtils {
    static configureCORS() {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
        
        return cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, etc.) or from file:// protocol for development
                if (!origin || origin === 'null') return callback(null, true);
                
                // Allow file:// protocol for local development
                if (origin.startsWith('file://')) return callback(null, true);
                
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                } else {
                    logger.security('CORS violation attempt', { origin });
                    return callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: process.env.CORS_CREDENTIALS === 'true',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
        });
    }

    static configureHelmet() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "ws:"]
                }
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" }
        });
    }

    static createRateLimit(windowMs, max, skipSuccessfulRequests = false) {
        return rateLimit({
            windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
            max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            skipSuccessfulRequests,
            message: {
                error: 'Too many requests from this IP, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                logger.security('Rate limit exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.url
                });
                res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.round(windowMs / 1000)
                });
            }
        });
    }

    static createSocketRateLimit() {
        const connections = new Map();
        const events = new Map();

        return {
            checkConnection: (socket) => {
                const ip = socket.handshake.address;
                const now = Date.now();
                const connectionWindow = 60000; // 1 minute
                const maxConnectionsPerIP = 10;

                if (!connections.has(ip)) {
                    connections.set(ip, []);
                }

                const ipConnections = connections.get(ip);
                
                // Remove old connections
                const recentConnections = ipConnections.filter(time => now - time < connectionWindow);
                connections.set(ip, recentConnections);

                if (recentConnections.length >= maxConnectionsPerIP) {
                    logger.security('Socket connection rate limit exceeded', { ip });
                    return false;
                }

                recentConnections.push(now);
                connections.set(ip, recentConnections);
                return true;
            },

            checkEvent: (socket, eventName) => {
                const key = `${socket.id}:${eventName}`;
                const now = Date.now();
                const eventWindow = 60000; // 1 minute
                const maxEventsPerMinute = 60;

                if (!events.has(key)) {
                    events.set(key, []);
                }

                const eventHistory = events.get(key);
                
                // Remove old events
                const recentEvents = eventHistory.filter(time => now - time < eventWindow);
                events.set(key, recentEvents);

                if (recentEvents.length >= maxEventsPerMinute) {
                    logger.security('Socket event rate limit exceeded', {
                        socketId: socket.id,
                        userId: socket.user?.id,
                        eventName
                    });
                    return false;
                }

                recentEvents.push(now);
                events.set(key, recentEvents);
                return true;
            }
        };
    }

    static validateAPIKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            logger.security('Missing API key', {
                ip: req.ip,
                url: req.url,
                method: req.method
            });
            return res.status(401).json({ error: 'API key required' });
        }

        // In production, this should check against a secure key store
        const validKeys = [
            process.env.JAVA_API_KEY || 'drdo-java-backend-2024',
            process.env.ADMIN_API_KEY || 'drdo-admin-2024',
            process.env.EMERGENCY_API_KEY || 'drdo-emergency-2024'
        ];

        if (!validKeys.includes(apiKey)) {
            logger.security('Invalid API key attempt', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                keyPrefix: apiKey.substring(0, 8)
            });
            return res.status(401).json({ error: 'Invalid API key' });
        }

        next();
    }

    static encryptSensitiveData(data) {
        const crypto = require('crypto');
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    static decryptSensitiveData(encryptedData) {
        const crypto = require('crypto');
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        
        const decipher = crypto.createDecipher(
            algorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    static hashSensitiveData(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    static generateSecureToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

    static validateIPAddress(ip) {
        // Simple IP validation - in production, use more sophisticated checks
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    static sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        
        // Remove sensitive headers
        delete sanitized.authorization;
        delete sanitized['x-api-key'];
        delete sanitized.cookie;
        
        return sanitized;
    }

    static createSecurityMiddleware() {
        return (req, res, next) => {
            // Add security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            
            // Log security-relevant requests
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                logger.security('Security-relevant request', {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            }
            
            next();
        };
    }

    static monitorSuspiciousActivity() {
        const suspiciousPatterns = new Map();
        
        return {
            checkRequest: (req) => {
                const ip = req.ip;
                const userAgent = req.get('User-Agent') || '';
                const url = req.url;
                
                // Check for suspicious patterns
                const suspicious = [
                    url.includes('..'),
                    url.includes('<script'),
                    url.includes('SELECT '),
                    url.includes('DROP '),
                    userAgent.includes('sqlmap'),
                    userAgent.includes('nikto'),
                    userAgent.includes('nmap')
                ];
                
                if (suspicious.some(pattern => pattern)) {
                    logger.security('Suspicious request detected', {
                        ip,
                        userAgent,
                        url,
                        method: req.method
                    });
                    
                    // Track suspicious IPs
                    if (!suspiciousPatterns.has(ip)) {
                        suspiciousPatterns.set(ip, 0);
                    }
                    suspiciousPatterns.set(ip, suspiciousPatterns.get(ip) + 1);
                    
                    return false;
                }
                
                return true;
            },
            
            getSuspiciousIPs: () => {
                return Array.from(suspiciousPatterns.entries())
                    .filter(([ip, count]) => count > 5)
                    .map(([ip, count]) => ({ ip, count }));
            }
        };
    }

    static createEmergencyBypass(emergencyCode) {
        return (req, res, next) => {
            const bypassCode = req.headers['x-emergency-bypass'];
            
            if (bypassCode === emergencyCode) {
                logger.emergency('Emergency bypass activated', {
                    ip: req.ip,
                    url: req.url,
                    method: req.method
                });
                req.isEmergencyBypass = true;
            }
            
            next();
        };
    }
}

module.exports = SecurityUtils;
