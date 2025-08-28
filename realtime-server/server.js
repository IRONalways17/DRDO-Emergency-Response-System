const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const redis = require('redis');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const logger = require('./utils/logger');
const config = require('./config/config');
const tcpConfig = require('./config/tcp-config');

// Import handlers and middleware
const SocketHandlers = require('./handlers/socketHandlers');
const SocketMiddleware = require('./middleware/socketMiddleware');
const ExpressMiddleware = require('./middleware/expressMiddleware');

// Import routes
const ApiRoutes = require('./routes/api');
const IncidentRoutes = require('./routes/incidents');
const ResponderRoutes = require('./routes/responders');

// Import utilities
const AuthUtils = require('./utils/auth');
const ValidationUtils = require('./utils/validation');
const SecurityUtils = require('./utils/security');

class RealtimeServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = null;
        this.redisClient = null;
        this.connectedUsers = new Map();
        this.activeIncidents = new Map();
        this.responderLocations = new Map();
    }

    async initialize() {
        try {
            // Configure TCP/IP settings for emergency response system
            this.configureTCP();

            // Initialize Redis connection
            await this.initializeRedis();

            // Setup Express middleware
            this.setupMiddleware();

            // Setup Socket.IO
            this.setupSocketIO();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            logger.info('Real-time server initialized successfully with TCP optimizations');
        } catch (error) {
            logger.error('Failed to initialize real-time server:', error);
            throw error;
        }
    }

    configureTCP() {
        // Configure server for optimal TCP/IP performance using emergency config
        this.server.keepAliveTimeout = tcpConfig.server.keepAliveTimeout;
        this.server.headersTimeout = tcpConfig.server.headersTimeout;
        this.server.requestTimeout = tcpConfig.server.requestTimeout;
        this.server.timeout = tcpConfig.server.timeout;
        this.server.maxConnections = tcpConfig.server.maxConnections;
        this.server.maxHeadersCount = tcpConfig.server.maxHeadersCount;

        // Set network interface options
        this.server.listenOptions = {
            host: tcpConfig.network.listenAddress,
            backlog: tcpConfig.network.backlog,
            exclusive: tcpConfig.network.exclusive
        };

        // TCP socket optimizations
        this.server.on('connection', (socket) => {
            socket.setTimeout(tcpConfig.socket.timeout);
            socket.setKeepAlive(tcpConfig.socket.keepAlive, tcpConfig.socket.keepAliveInterval);
            socket.setNoDelay(tcpConfig.socket.noDelay);

            logger.info('TCP connection established with emergency system optimizations', {
                remoteAddress: socket.remoteAddress,
                remotePort: socket.remotePort,
                timeout: `${tcpConfig.socket.timeout/1000/60} minutes`,
                keepAlive: `${tcpConfig.socket.keepAliveInterval/1000} seconds`,
                noDelay: tcpConfig.socket.noDelay
            });
        });

        logger.info('TCP/IP networking configured for emergency response system', {
            keepAliveTimeout: `${tcpConfig.server.keepAliveTimeout/1000/60} minutes`,
            maxConnections: tcpConfig.server.maxConnections,
            optimizations: 'enabled'
        });
    }

    async initializeRedis() {
        if (!config.redis.enabled) {
            logger.info('Redis is disabled in development mode');
            this.redisClient = null;
            return;
        }

        try {
            this.redisClient = redis.createClient({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                retry_strategy: (times) => {
                    if (times > 5) {
                        logger.warn('Redis connection failed after 5 attempts, continuing without Redis');
                        return null;
                    }
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.redisClient.on('connect', () => {
                logger.info('Connected to Redis server');
            });

            this.redisClient.on('error', (error) => {
                logger.warn('Redis connection error, continuing without Redis:', error.message);
                this.redisClient = null;
            });

            await this.redisClient.connect();
        } catch (error) {
            logger.warn('Failed to initialize Redis, continuing without Redis:', error.message);
            this.redisClient = null;
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(ExpressMiddleware.setupSecurity());
        
        // Logging middleware
        this.app.use(ExpressMiddleware.setupLogging());
        
        // Body parsing middleware
        this.app.use(ExpressMiddleware.setupBodyParsing());
        
        // Compression middleware
        this.app.use(ExpressMiddleware.compression());
        
        // Request ID middleware
        this.app.use(ExpressMiddleware.requestId());
        
        // Response headers middleware
        this.app.use(ExpressMiddleware.responseHeaders());
        
        // Metrics middleware
        this.app.use(ExpressMiddleware.metrics());
        
        // API versioning middleware
        this.app.use('/api/', ExpressMiddleware.apiVersioning());
        
        // Request timeout middleware
        this.app.use(ExpressMiddleware.requestTimeout());
        
        // Content type validation
        this.app.use('/api/', ExpressMiddleware.validateContentType());

        logger.info('Express middleware configured with comprehensive security and monitoring');
    }

    setupSocketIO() {
        this.io = socketIo(this.server, {
            cors: {
                origin: function (origin, callback) {
                    // Allow all origins in development
                    if (process.env.NODE_ENV === 'development') {
                        return callback(null, true);
                    }
                    // Production CORS check
                    if (!origin || config.cors.allowedOrigins.includes(origin)) {
                        return callback(null, true);
                    }
                    return callback(new Error('Not allowed by CORS'), false);
                },
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: tcpConfig.socketio.transports,
            // Emergency response system requires long timeouts
            pingTimeout: tcpConfig.socketio.pingTimeout,
            pingInterval: tcpConfig.socketio.pingInterval,
            allowEIO3: tcpConfig.socketio.allowEIO3,
            maxHttpBufferSize: tcpConfig.socketio.maxHttpBufferSize,
            connectTimeout: tcpConfig.socketio.connectTimeout,
            // TCP/IP optimizations for emergency systems
            allowUpgrades: true,
            upgradeTimeout: tcpConfig.socketio.upgradeTimeout,
            // Keep connections alive
            cookie: tcpConfig.socketio.cookie,
            serveClient: tcpConfig.socketio.serveClient,
            // TCP socket options for better reliability
            perMessageDeflate: {
                threshold: 1024, // Compress messages over 1KB
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10
            },
            // HTTP long polling optimizations
            httpCompression: true,
            initialPacket: {
                type: 'open',
                data: {
                    pingInterval: 300000, // 5 minutes
                    pingTimeout: 3600000, // 1 hour
                    maxPayload: 10e6 // 10MB
                }
            }
        });

        // Apply minimal middleware in development
        this.io.use(SocketMiddleware.authentication());
        this.io.use(SocketMiddleware.logging());
        this.io.use(SocketMiddleware.errorHandling());
        
        // Add gentle connection limiting even in development
        this.io.use(SocketMiddleware.connectionLimit(100)); // Allow up to 100 connections
        this.io.use(SocketMiddleware.developmentRateLimit()); // Gentle rate limiting for dev
        
        // Optional middleware only in production
        if (process.env.NODE_ENV === 'production') {
            this.io.use(SocketMiddleware.rateLimiting());
            this.io.use(SocketMiddleware.eventValidation());
            this.io.use(SocketMiddleware.dataEncryption());
            this.io.use(SocketMiddleware.heartbeat());
        }
        
        this.io.use(SocketMiddleware.emergencyMode());

        // Connection handling
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        logger.info('Socket.IO server initialized with development optimizations');
    }

    handleConnection(socket) {
        const user = socket.user;
        logger.info(`User connected: ${user.username || user.id} (${user.role})`);

        // Store connected user
        this.connectedUsers.set(socket.id, {
            socket,
            user,
            connectedAt: new Date(),
            lastActivity: new Date()
        });

        // Join role-based room
        socket.join(`role:${user.role.toLowerCase()}`);
        
        // Join user-specific room if authenticated
        if (user.username) {
            socket.join(`user:${user.username}`);
        }
        
        // Join user ID room
        socket.join(`user:${user.id}`);

        // Setup comprehensive event handlers
        SocketHandlers.setupIncidentHandlers(socket, this);
        SocketHandlers.setupResponderHandlers(socket, this);
        SocketHandlers.setupLocationHandlers(socket, this);
        SocketHandlers.setupNotificationHandlers(socket, this);

        // Add ping/pong handlers for connection testing
        socket.on('ping', (data) => {
            socket.emit('pong', data);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });

        // Handle errors with better logging
        socket.on('error', (error) => {
            logger.error('Socket error', {
                error: error.message,
                socketId: socket.id,
                userId: user.id,
                stack: error.stack
            });
        });

        // Update last activity on any event
        socket.use((packet, next) => {
            if (this.connectedUsers.has(socket.id)) {
                this.connectedUsers.get(socket.id).lastActivity = new Date();
            }
            next();
        });

        // Send initial data
        this.sendInitialData(socket);

        // Broadcast user count update
        this.broadcastUserCount();
    }

    handleDisconnection(socket, reason) {
        const user = socket.user;
        logger.info(`User disconnected: ${user.username || user.id} (${user.role}) - Reason: ${reason}`);

        // Remove from connected users
        this.connectedUsers.delete(socket.id);

        // Remove responder location if applicable
        if (user.role === 'RESPONDER' && user.responderId) {
            this.responderLocations.delete(user.responderId);
            this.broadcastResponderStatusUpdate(user.responderId, 'OFFLINE');
            
            // Notify command center about responder going offline
            this.io.to('role:admin').emit('responder:offline', {
                responderId: user.responderId,
                disconnectedAt: new Date().toISOString(),
                reason
            });
        }

        // Broadcast user count update
        this.broadcastUserCount();
    }

    async sendInitialData(socket) {
        try {
            const user = socket.user;

            if (user.role === 'ADMIN' || user.role === 'OPERATOR') {
                // Send active incidents
                const activeIncidents = await this.getActiveIncidents();
                socket.emit('incidents:active', activeIncidents);

                // Send responder status
                const responderStatus = await this.getResponderStatus();
                socket.emit('responders:status', responderStatus);

                // Send system statistics
                const statistics = await this.getSystemStatistics();
                socket.emit('system:statistics', statistics);
            }

            // Send user count
            socket.emit('system:userCount', this.connectedUsers.size);

        } catch (error) {
            logger.error('Error sending initial data:', error);
        }
    }

    setupRoutes() {
        // Main API routes (public)
        this.app.use('/', ApiRoutes);
        
        // Health check endpoint
        this.app.get('/health', ExpressMiddleware.healthCheck());

        // Metrics endpoint (included in middleware)
        // Available at /metrics

        // API routes with authentication and validation
        this.app.use('/api/external/incidents', SecurityUtils.validateAPIKey, IncidentRoutes.createRouter(this));
        this.app.use('/api/external/responders', SecurityUtils.validateAPIKey, ResponderRoutes.createRouter(this));

        // Connected users endpoint
        this.app.get('/api/connected-users', (req, res) => {
            const users = Array.from(this.connectedUsers.values()).map(({ user, connectedAt, lastActivity }) => ({
                id: user.id || user.username,
                role: user.role,
                connectedAt,
                lastActivity
            }));
            res.json(users);
        });

        // System statistics endpoint
        this.app.get('/api/statistics', (req, res) => {
            const stats = {
                connectedUsers: this.connectedUsers.size,
                activeIncidents: this.activeIncidents.size,
                onlineResponders: this.responderLocations.size,
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            };
            res.json(stats);
        });

        // Broadcast message endpoint (for external services)
        this.app.post('/api/broadcast', SecurityUtils.validateAPIKey, (req, res) => {
            try {
                const { event, data, room, priority } = req.body;

                if (!event || !data) {
                    return res.status(400).json({ error: 'Event and data are required' });
                }
                
                const broadcast = {
                    ...data,
                    timestamp: new Date().toISOString(),
                    priority: priority || 'MEDIUM',
                    source: 'external_api'
                };

                if (room) {
                    this.io.to(room).emit(event, broadcast);
                } else {
                    this.io.emit(event, broadcast);
                }
                
                logger.info(`External broadcast sent: ${event} to ${room || 'all'}`);
                res.json({ 
                    success: true,
                    recipients: room ? this.io.sockets.adapter.rooms.get(room)?.size || 0 : this.connectedUsers.size
                });
            } catch (error) {
                logger.error('Broadcast error:', error);
                res.status(500).json({ error: 'Broadcast failed' });
            }
        });

        // WebSocket status endpoint
        this.app.get('/api/websocket/status', (req, res) => {
            const rooms = Array.from(this.io.sockets.adapter.rooms.entries()).map(([room, sockets]) => ({
                room,
                connections: sockets.size
            }));

            res.json({
                totalConnections: this.connectedUsers.size,
                rooms,
                server: {
                    transports: ['websocket', 'polling'],
                    pingTimeout: 60000,
                    pingInterval: 25000
                }
            });
        });

        // Emergency system status
        this.app.get('/api/emergency/status', (req, res) => {
            const emergencyStatus = {
                isEmergencyMode: process.env.EMERGENCY_MODE === 'true',
                criticalIncidents: Array.from(this.activeIncidents.values()).filter(inc => inc.severity === 'CRITICAL').length,
                availableResponders: Array.from(this.responderLocations.values()).filter(resp => resp.status === 'AVAILABLE').length,
                systemHealth: {
                    redis: this.redisClient?.connected || false,
                    socketIO: this.io?.engine?.clientsCount || 0,
                    uptime: process.uptime()
                }
            };

            res.json(emergencyStatus);
        });
    }

    setupErrorHandling() {
        // Use our custom error handling middleware
        this.app.use(ExpressMiddleware.setupErrorHandling());
        this.app.use(ExpressMiddleware.notFoundHandler());

        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Unhandled rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            this.gracefulShutdown();
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            this.gracefulShutdown();
        });
    }

    async gracefulShutdown() {
        try {
            // Close server
            await new Promise((resolve) => {
                this.server.close(resolve);
            });

            // Close Redis connection
            if (this.redisClient) {
                await this.redisClient.quit();
            }

            logger.info('Server shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }

    // Utility methods
    async getActiveIncidents() {
        try {
            const incidents = await this.redisClient.get('active_incidents');
            return incidents ? JSON.parse(incidents) : [];
        } catch (error) {
            logger.error('Error getting active incidents:', error);
            return [];
        }
    }

    async getResponderStatus() {
        try {
            const status = await this.redisClient.get('responder_status');
            return status ? JSON.parse(status) : {};
        } catch (error) {
            logger.error('Error getting responder status:', error);
            return {};
        }
    }

    async getSystemStatistics() {
        try {
            const stats = await this.redisClient.get('system_statistics');
            return stats ? JSON.parse(stats) : {};
        } catch (error) {
            logger.error('Error getting system statistics:', error);
            return {};
        }
    }

    broadcastIncidentUpdate(incident) {
        this.io.emit('incident:update', incident);
        this.io.to('role:admin').emit('incident:admin_update', incident);
        this.io.to('role:operator').emit('incident:operator_update', incident);
        logger.info(`Incident update broadcasted: ${incident.incidentId}`);
    }

    broadcastResponderUpdate(responder) {
        this.io.to('role:admin').emit('responder:update', responder);
        this.io.to('role:operator').emit('responder:update', responder);
        this.io.to(`user:${responder.username}`).emit('responder:personal_update', responder);
        logger.info(`Responder update broadcasted: ${responder.responderId}`);
    }

    broadcastResponderStatusUpdate(responderId, status) {
        this.io.to('role:admin').emit('responder:status_update', { responderId, status });
        this.io.to('role:operator').emit('responder:status_update', { responderId, status });
    }

    broadcastEmergencyAlert(alert) {
        this.io.emit('emergency:alert', alert);
        logger.warn(`Emergency alert broadcasted: ${alert.type} - ${alert.message}`);
    }

    broadcastUserCount() {
        this.io.emit('system:userCount', this.connectedUsers.size);
    }

    findNearbyResponders(latitude, longitude, radius = 5000, responderType = null) {
        const nearby = [];
        
        for (const [responderId, location] of this.responderLocations) {
            const distance = this.calculateDistance(
                latitude, longitude,
                location.latitude, location.longitude
            );
            
            if (distance <= radius) {
                if (!responderType || location.responderType === responderType) {
                    nearby.push({
                        ...location,
                        distance
                    });
                }
            }
        }
        
        return nearby.sort((a, b) => a.distance - b.distance);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    async start() {
        await this.initialize();
        
        const port = config.server.port;
        this.server.listen(port, () => {
            logger.info(`Real-time server started on port ${port}`);
            console.log(`🚀 DRDO Emergency Real-time Server running on http://localhost:${port}`);
        });
    }

    async stop() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
        this.server.close();
        logger.info('Real-time server stopped');
    }
}

// Create and start server if this file is run directly
if (require.main === module) {
    const server = new RealtimeServer();
    server.start().catch((error) => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = RealtimeServer;
