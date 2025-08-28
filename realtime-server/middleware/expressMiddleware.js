const express = require('express');
const SecurityUtils = require('../utils/security');
const logger = require('../utils/logger');

class ExpressMiddleware {
    static setupSecurity() {
        const router = express.Router();

        // Helmet for security headers
        router.use(SecurityUtils.configureHelmet());

        // CORS configuration
        router.use(SecurityUtils.configureCORS());

        // Custom security middleware
        router.use(SecurityUtils.createSecurityMiddleware());

        // Rate limiting
        router.use('/api/', SecurityUtils.createRateLimit());

        // API key validation for external services
        router.use('/api/external/', SecurityUtils.validateAPIKey);

        // Suspicious activity monitoring
        const activityMonitor = SecurityUtils.monitorSuspiciousActivity();
        router.use((req, res, next) => {
            if (!activityMonitor.checkRequest(req)) {
                return res.status(400).json({ error: 'Suspicious activity detected' });
            }
            next();
        });

        return router;
    }

    static setupLogging() {
        return (req, res, next) => {
            // Request logging
            logger.requestLogger(req, res, next);
        };
    }

    static setupBodyParsing() {
        const router = express.Router();

        // JSON body parser with size limit
        router.use(express.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));

        // URL encoded parser
        router.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        return router;
    }

    static setupErrorHandling() {
        return (err, req, res, next) => {
            logger.error('Express error', {
                error: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method,
                ip: req.ip
            });

            // Don't leak error details in production
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({
                    error: 'Internal server error'
                });
            }

            res.status(err.status || 500).json({
                error: err.message,
                stack: err.stack
            });
        };
    }

    static notFoundHandler() {
        return (req, res) => {
            logger.warn('404 - Route not found', {
                url: req.url,
                method: req.method,
                ip: req.ip
            });

            res.status(404).json({
                error: 'Route not found'
            });
        };
    }

    static healthCheck() {
        return (req, res) => {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };

            res.json(healthData);
        };
    }

    static validateContentType(allowedTypes = ['application/json']) {
        return (req, res, next) => {
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                const contentType = req.get('Content-Type');
                
                if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
                    logger.security('Invalid content type', {
                        contentType,
                        allowedTypes,
                        url: req.url,
                        method: req.method,
                        ip: req.ip
                    });
                    
                    return res.status(400).json({
                        error: 'Invalid content type'
                    });
                }
            }
            
            next();
        };
    }

    static requestTimeout(timeout = 3600000) { // 1 hour default for emergency systems
        return (req, res, next) => {
            // Set socket timeout for TCP connections
            if (req.socket) {
                req.socket.setTimeout(timeout);
                req.socket.setKeepAlive(true, 60000); // Keep alive every 60 seconds
                req.socket.setNoDelay(true); // Disable Nagle's algorithm for real-time data
            }

            req.setTimeout(timeout, () => {
                logger.warn('Request timeout - Emergency system requires long connections', {
                    url: req.url,
                    method: req.method,
                    timeout: `${timeout}ms (${timeout/1000/60} minutes)`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                if (!res.headersSent) {
                    res.status(408).json({
                        error: 'Request timeout - Emergency system connection maintained',
                        timeout: `${timeout/1000/60} minutes`,
                        reconnect: true
                    });
                }
            });

            next();
        };
    }

    static compression() {
        const compression = require('compression');
        
        return compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            threshold: 1024
        });
    }

    static staticFiles() {
        const path = require('path');
        
        return express.static(path.join(__dirname, '..', 'public'), {
            maxAge: '1d',
            etag: true,
            lastModified: true
        });
    }

    static apiVersioning() {
        return (req, res, next) => {
            // Default to v1 if no version specified
            req.apiVersion = req.headers['api-version'] || 'v1';
            
            // Validate API version
            const supportedVersions = ['v1'];
            if (!supportedVersions.includes(req.apiVersion)) {
                return res.status(400).json({
                    error: 'Unsupported API version',
                    supportedVersions
                });
            }
            
            next();
        };
    }

    static responseHeaders() {
        return (req, res, next) => {
            // Add response headers
            res.setHeader('X-API-Version', req.apiVersion || 'v1');
            res.setHeader('X-Response-Time', Date.now());
            res.setHeader('X-Request-ID', req.id || 'unknown');
            
            next();
        };
    }

    static requestId() {
        const { v4: uuidv4 } = require('uuid');
        
        return (req, res, next) => {
            req.id = uuidv4();
            res.setHeader('X-Request-ID', req.id);
            next();
        };
    }

    static metrics() {
        const metrics = {
            requests: 0,
            errors: 0,
            responseTime: []
        };
        
        return (req, res, next) => {
            const start = Date.now();
            metrics.requests++;
            
            res.on('finish', () => {
                const responseTime = Date.now() - start;
                metrics.responseTime.push(responseTime);
                
                // Keep only last 1000 response times
                if (metrics.responseTime.length > 1000) {
                    metrics.responseTime.shift();
                }
                
                if (res.statusCode >= 400) {
                    metrics.errors++;
                }
                
                logger.performance('Request completed', {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime: `${responseTime}ms`,
                    requestId: req.id
                });
            });
            
            // Expose metrics endpoint
            if (req.url === '/metrics') {
                const avgResponseTime = metrics.responseTime.length > 0
                    ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length
                    : 0;
                
                return res.json({
                    totalRequests: metrics.requests,
                    totalErrors: metrics.errors,
                    averageResponseTime: Math.round(avgResponseTime),
                    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0
                });
            }
            
            next();
        };
    }
}

module.exports = ExpressMiddleware;
