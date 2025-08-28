const config = {
    server: {
        port: process.env.REALTIME_SERVER_PORT || 8081,
        host: process.env.REALTIME_SERVER_HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development'
    },

    redis: {
        enabled: process.env.REDIS_ENABLED !== 'false',
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0
    },

    cors: {
        allowedOrigins: [
            process.env.CITIZEN_PORTAL_URL || 'http://localhost:3001',
            process.env.COMMAND_CENTER_URL || 'http://localhost:3000',
            'http://localhost:8080', // Java backend
            'http://localhost:8081', // Self
            'https://*.drdo.gov.in',
            // Development origins
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'null', // For file:// protocol
            ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',') : [])
        ]
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
        expiresIn: process.env.JWT_EXPIRY || '24h'
    },

    rateLimit: {
        enabled: process.env.NODE_ENV !== 'development', // Disable in development
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000 // Increased for development
    },

    emergency: {
        criticalResponseTime: parseInt(process.env.CRITICAL_RESPONSE_TIME) || 300, // 5 minutes
        highResponseTime: parseInt(process.env.HIGH_RESPONSE_TIME) || 600, // 10 minutes
        mediumResponseTime: parseInt(process.env.MEDIUM_RESPONSE_TIME) || 1800, // 30 minutes
        autoEscalationTime: parseInt(process.env.AUTO_ESCALATION_TIME) || 1800, // 30 minutes
        maxConcurrentIncidents: parseInt(process.env.MAX_CONCURRENT_INCIDENTS) || 100
    },

    location: {
        updateInterval: parseInt(process.env.LOCATION_UPDATE_INTERVAL) || 30000, // 30 seconds
        maxLocationAge: parseInt(process.env.MAX_LOCATION_AGE) || 300000, // 5 minutes
        defaultRadius: parseInt(process.env.DEFAULT_SEARCH_RADIUS) || 5000 // 5km
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/realtime-server.log',
        maxSize: process.env.LOG_MAX_SIZE || '10MB',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    },

    websocket: {
        maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 1000,
        pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 60000,
        pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000,
        upgradeTimeout: parseInt(process.env.WS_UPGRADE_TIMEOUT) || 10000
    },

    broadcast: {
        retryAttempts: parseInt(process.env.BROADCAST_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.BROADCAST_RETRY_DELAY) || 1000,
        batchSize: parseInt(process.env.BROADCAST_BATCH_SIZE) || 100
    },

    cache: {
        incidentTTL: parseInt(process.env.INCIDENT_CACHE_TTL) || 3600, // 1 hour
        responderTTL: parseInt(process.env.RESPONDER_CACHE_TTL) || 1800, // 30 minutes
        statisticsTTL: parseInt(process.env.STATISTICS_CACHE_TTL) || 300 // 5 minutes
    },

    monitoring: {
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
    },

    security: {
        enableHelmet: process.env.ENABLE_HELMET !== 'false',
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        enableTrustedProxy: process.env.ENABLE_TRUSTED_PROXY === 'true'
    },

    // External service URLs
    services: {
        javaBackend: process.env.JAVA_API_URL || 'http://localhost:8080',
        citizenPortal: process.env.CITIZEN_PORTAL_URL || 'http://localhost:3000',
        commandCenter: process.env.COMMAND_CENTER_URL || 'http://localhost:3001'
    },

    // Feature flags
    features: {
        enableLocationTracking: process.env.ENABLE_LOCATION_TRACKING !== 'false',
        enableBroadcastAPI: process.env.ENABLE_BROADCAST_API !== 'false',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true'
    }
};

// Validate required configuration
const requiredConfigs = [
    'server.port',
    'redis.host',
    'jwt.secret'
];

function validateConfig() {
    const missing = [];
    
    requiredConfigs.forEach(path => {
        const keys = path.split('.');
        let current = config;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                missing.push(path);
                break;
            }
            current = current[key];
        }
    });
    
    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
}

// Validate configuration on module load
validateConfig();

module.exports = config;
