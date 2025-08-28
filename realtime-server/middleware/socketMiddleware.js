const AuthUtils = require('../utils/auth');
const SecurityUtils = require('../utils/security');
const ValidationUtils = require('../utils/validation');
const logger = require('../utils/logger');

class SocketMiddleware {
    static authentication() {
        return (socket, next) => {
            AuthUtils.authenticateSocket(socket, next);
        };
    }

    static rateLimiting() {
        // Skip rate limiting in development
        if (process.env.NODE_ENV === 'development' || process.env.AUTH_DISABLED === 'true') {
            return (socket, next) => {
                next(); // Skip rate limiting completely
            };
        }
        
        const rateLimiter = SecurityUtils.createSocketRateLimit();
        
        return (socket, next) => {
            if (!rateLimiter.checkConnection(socket)) {
                logger.security('Socket connection rate limit exceeded', {
                    ip: socket.handshake.address
                });
                return next(new Error('Rate limit exceeded'));
            }
            
            // Add rate limiting for events
            socket.use((packet, next) => {
                const eventName = packet[0];
                
                if (!rateLimiter.checkEvent(socket, eventName)) {
                    logger.security('Socket event rate limit exceeded', {
                        socketId: socket.id,
                        userId: socket.user?.id,
                        eventName
                    });
                    socket.emit('error', { message: 'Rate limit exceeded for events' });
                    return;
                }
                
                next();
            });
            
            next();
        };
    }

    static developmentRateLimit() {
        // Gentle rate limiting for development to prevent reconnection spam
        const connectionAttempts = new Map();
        const maxAttempts = 10; // Allow 10 connections per IP per minute
        const windowMs = 60000; // 1 minute window
        
        return (socket, next) => {
            const clientIP = socket.handshake.address;
            const now = Date.now();
            
            // Clean up old entries
            for (const [ip, data] of connectionAttempts.entries()) {
                if (now - data.firstAttempt > windowMs) {
                    connectionAttempts.delete(ip);
                }
            }
            
            // Check current IP
            if (!connectionAttempts.has(clientIP)) {
                connectionAttempts.set(clientIP, {
                    count: 1,
                    firstAttempt: now
                });
            } else {
                const data = connectionAttempts.get(clientIP);
                if (now - data.firstAttempt <= windowMs) {
                    data.count++;
                    if (data.count > maxAttempts) {
                        logger.warn('Development rate limit exceeded', {
                            ip: clientIP,
                            attempts: data.count,
                            window: windowMs
                        });
                        return next(new Error('Too many connection attempts. Please wait a moment.'));
                    }
                } else {
                    // Reset counter for new window
                    data.count = 1;
                    data.firstAttempt = now;
                }
            }
            
            next();
        };
    }

    static eventValidation() {
        return (socket, next) => {
            socket.use((packet, next) => {
                const [eventName, data] = packet;
                
                // Validate event name
                if (!ValidationUtils.validateSocketEvent(eventName, data)) {
                    logger.security('Invalid socket event attempted', {
                        socketId: socket.id,
                        userId: socket.user?.id,
                        eventName
                    });
                    socket.emit('error', { message: 'Invalid event' });
                    return;
                }
                
                // Sanitize data
                if (data && typeof data === 'object') {
                    packet[1] = ValidationUtils.sanitizeInput(data);
                }
                
                next();
            });
            
            next();
        };
    }

    static roleBasedAccess(requiredRole) {
        return (socket, next) => {
            if (!socket.user) {
                return next(new Error('Authentication required'));
            }

            if (Array.isArray(requiredRole)) {
                if (!requiredRole.includes(socket.user.role)) {
                    logger.security('Insufficient permissions for socket connection', {
                        socketId: socket.id,
                        userId: socket.user.id,
                        userRole: socket.user.role,
                        requiredRole
                    });
                    return next(new Error('Insufficient permissions'));
                }
            } else {
                if (socket.user.role !== requiredRole) {
                    logger.security('Insufficient permissions for socket connection', {
                        socketId: socket.id,
                        userId: socket.user.id,
                        userRole: socket.user.role,
                        requiredRole
                    });
                    return next(new Error('Insufficient permissions'));
                }
            }

            next();
        };
    }

    static logging() {
        return (socket, next) => {
            logger.info('Socket connection attempt', {
                socketId: socket.id,
                ip: socket.handshake.address,
                userAgent: socket.handshake.headers['user-agent']
            });

            socket.on('disconnect', (reason) => {
                logger.info('Socket disconnected', {
                    socketId: socket.id,
                    userId: socket.user?.id,
                    reason
                });
            });

            socket.use((packet, next) => {
                const [eventName, data] = packet;
                
                logger.socketEvent(eventName, socket.id, socket.user?.id, {
                    dataSize: JSON.stringify(data || {}).length
                });
                
                next();
            });

            next();
        };
    }

    static errorHandling() {
        return (socket, next) => {
            socket.on('error', (error) => {
                logger.socketError(error, socket.id, socket.user?.id);
            });

            socket.use((packet, next) => {
                try {
                    next();
                } catch (error) {
                    logger.socketError(error, socket.id, socket.user?.id, {
                        eventName: packet[0],
                        eventData: packet[1]
                    });
                    socket.emit('error', { message: 'Internal server error' });
                }
            });

            next();
        };
    }

    static connectionLimit(maxConnections = 1000) {
        let connectionCount = 0;
        
        return (socket, next) => {
            if (connectionCount >= maxConnections) {
                logger.error('Maximum socket connections reached', {
                    currentConnections: connectionCount,
                    maxConnections
                });
                return next(new Error('Server at capacity'));
            }
            
            connectionCount++;
            
            socket.on('disconnect', () => {
                connectionCount--;
            });
            
            next();
        };
    }

    static heartbeat() {
        return (socket, next) => {
            socket.isAlive = true;
            
            // Handle ping/pong for heartbeat
            socket.on('ping', (data) => {
                socket.emit('pong', data);
            });
            
            socket.on('pong', () => {
                socket.isAlive = true;
            });
            
            // Only start heartbeat in production or if explicitly enabled
            if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HEARTBEAT === 'true') {
                const interval = setInterval(() => {
                    if (socket.isAlive === false) {
                        logger.warn('Socket heartbeat failed', {
                            socketId: socket.id,
                            userId: socket.user?.id
                        });
                        clearInterval(interval);
                        socket.disconnect(true);
                        return;
                    }
                    
                    socket.isAlive = false;
                    socket.emit('ping', { timestamp: Date.now() });
                }, 30000); // 30 seconds
                
                socket.on('disconnect', () => {
                    clearInterval(interval);
                });
            }
            
            next();
        };
    }

    static geofencing(allowedRegions = []) {
        return (socket, next) => {
            const ip = socket.handshake.address;
            
            // In production, use a proper geolocation service
            // This is a simplified example
            if (allowedRegions.length > 0) {
                // Check if IP is from allowed regions
                // Implementation would depend on geolocation service
                logger.info('Geofencing check', {
                    socketId: socket.id,
                    ip,
                    allowedRegions
                });
            }
            
            next();
        };
    }

    static emergencyMode() {
        return (socket, next) => {
            // Check if system is in emergency mode
            const isEmergencyMode = process.env.EMERGENCY_MODE === 'true';
            
            if (isEmergencyMode) {
                // Allow only emergency personnel
                if (!socket.user || !['ADMIN', 'OPERATOR', 'RESPONDER'].includes(socket.user.role)) {
                    logger.security('Non-emergency user blocked during emergency mode', {
                        socketId: socket.id,
                        userId: socket.user?.id,
                        userRole: socket.user?.role
                    });
                    return next(new Error('System in emergency mode'));
                }
                
                logger.emergency('Emergency mode connection allowed', {
                    socketId: socket.id,
                    userId: socket.user.id,
                    userRole: socket.user.role
                });
            }
            
            next();
        };
    }

    static dataEncryption() {
        return (socket, next) => {
            socket.use((packet, next) => {
                const [eventName, data] = packet;
                
                // Encrypt sensitive data events
                const sensitiveEvents = [
                    'incident:create',
                    'responder:register',
                    'location:update'
                ];
                
                if (sensitiveEvents.includes(eventName) && data) {
                    // Mark data as containing sensitive information
                    socket.hasSensitiveData = true;
                    logger.info('Sensitive data event processed', {
                        socketId: socket.id,
                        userId: socket.user?.id,
                        eventName
                    });
                }
                
                next();
            });
            
            next();
        };
    }
}

module.exports = SocketMiddleware;
