const jwt = require('jsonwebtoken');
const logger = require('./logger');

class AuthUtils {
    static generateToken(payload, expiresIn = process.env.JWT_EXPIRY || '24h') {
        try {
            return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
        } catch (error) {
            logger.error('Error generating JWT token:', error);
            throw new Error('Token generation failed');
        }
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            logger.security('Invalid JWT token verification attempt', { error: error.message });
            throw new Error('Invalid token');
        }
    }

    static extractTokenFromSocket(socket) {
        // Try to get token from handshake auth
        if (socket.handshake.auth && socket.handshake.auth.token) {
            return socket.handshake.auth.token;
        }

        // Try to get token from query parameters
        if (socket.handshake.query && socket.handshake.query.token) {
            return socket.handshake.query.token;
        }

        // Try to get token from headers
        if (socket.handshake.headers && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7);
            }
        }

        return null;
    }

    static authenticateSocket(socket, next) {
        try {
            // In development mode, allow connections without authentication
            if (process.env.NODE_ENV === 'development' || process.env.AUTH_DISABLED === 'true') {
                // Create a default user for development
                socket.user = {
                    id: `dev_user_${Date.now()}`,
                    username: 'Development User',
                    role: 'CITIZEN',
                    isDevelopment: true
                };
                
                // Join default rooms
                socket.join(`user:${socket.user.id}`);
                socket.join('role:citizen');
                socket.join('development');
                
                logger.info('Socket connected in development mode (no auth required)', {
                    socketId: socket.id,
                    ip: socket.handshake.address 
                });
                
                return next();
            }
            
            const token = AuthUtils.extractTokenFromSocket(socket);
            
            if (!token) {
                logger.security('Socket connection attempt without token', { 
                    socketId: socket.id,
                    ip: socket.handshake.address 
                });
                return next(new Error('Authentication required'));
            }

            const decoded = AuthUtils.verifyToken(token);
            socket.user = decoded;
            
            // Join user-specific room
            socket.join(`user:${decoded.id}`);
            
            // Join role-specific room
            if (decoded.role) {
                socket.join(`role:${decoded.role.toLowerCase()}`);
            }

            logger.security('Socket authenticated successfully', {
                socketId: socket.id,
                userId: decoded.id,
                username: decoded.username,
                role: decoded.role
            });

            next();
        } catch (error) {
            logger.security('Socket authentication failed', {
                socketId: socket.id,
                ip: socket.handshake.address,
                error: error.message
            });
            next(new Error('Authentication failed'));
        }
    }

    static authorizeRole(allowedRoles) {
        return (socket, next) => {
            if (!socket.user) {
                return next(new Error('User not authenticated'));
            }

            if (!allowedRoles.includes(socket.user.role)) {
                logger.security('Unauthorized role access attempt', {
                    socketId: socket.id,
                    userId: socket.user.id,
                    userRole: socket.user.role,
                    allowedRoles
                });
                return next(new Error('Insufficient permissions'));
            }

            next();
        };
    }

    static validateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            logger.security('API request without API key', {
                ip: req.ip,
                url: req.url,
                method: req.method
            });
            return res.status(401).json({ error: 'API key required' });
        }

        // In production, validate against a proper API key store
        const validApiKeys = [
            process.env.JAVA_API_KEY || 'drdo-java-backend-2024',
            process.env.ADMIN_API_KEY || 'drdo-admin-2024'
        ];

        if (!validApiKeys.includes(apiKey)) {
            logger.security('Invalid API key attempt', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                apiKey: apiKey.substring(0, 8) + '...'
            });
            return res.status(401).json({ error: 'Invalid API key' });
        }

        logger.info('API request authenticated', {
            ip: req.ip,
            url: req.url,
            method: req.method
        });

        next();
    }

    static createGuestToken(guestId) {
        const guestPayload = {
            id: guestId,
            type: 'guest',
            role: 'CITIZEN',
            permissions: ['incident:create', 'incident:subscribe']
        };

        return AuthUtils.generateToken(guestPayload, '1h');
    }

    static refreshToken(token) {
        try {
            const decoded = AuthUtils.verifyToken(token);
            
            // Remove JWT fields
            delete decoded.iat;
            delete decoded.exp;
            
            // Generate new token
            return AuthUtils.generateToken(decoded);
        } catch (error) {
            logger.security('Token refresh failed', { error: error.message });
            throw new Error('Token refresh failed');
        }
    }

    static hashPassword(password) {
        const bcrypt = require('bcrypt');
        return bcrypt.hashSync(password, 10);
    }

    static comparePassword(password, hash) {
        const bcrypt = require('bcrypt');
        return bcrypt.compareSync(password, hash);
    }

    static generateSessionId() {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    static sanitizeUserData(user) {
        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.passwordHash;
        delete sanitized.resetToken;
        delete sanitized.refreshToken;
        return sanitized;
    }

    static logSecurityEvent(event, details = {}) {
        logger.security(`Security Event: ${event}`, details);
    }

    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            return Date.now() >= decoded.exp * 1000;
        } catch (error) {
            return true;
        }
    }

    static extractUserFromToken(token) {
        try {
            const decoded = AuthUtils.verifyToken(token);
            return AuthUtils.sanitizeUserData(decoded);
        } catch (error) {
            return null;
        }
    }
}

module.exports = AuthUtils;
