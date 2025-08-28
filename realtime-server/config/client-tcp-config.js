/**
 * Client-side TCP/IP Configuration for DRDO Emergency Response System
 * Optimized for maintaining long-running connections with the real-time server
 */

const clientTcpConfig = {
    // Socket.IO client configuration
    socketio: {
        // Connection settings
        timeout: 3600000,              // 1 hour connection timeout
        reconnection: true,            // Enable reconnection
        reconnectionAttempts: 10,      // Number of reconnection attempts
        reconnectionDelay: 5000,       // 5 seconds initial delay
        reconnectionDelayMax: 300000,  // 5 minutes maximum delay
        randomizationFactor: 0.5,      // Randomization factor

        // Transport settings
        transports: ['websocket', 'polling'],
        upgrade: true,                 // Allow transport upgrades
        rememberUpgrade: true,         // Remember transport upgrades

        // Timeout settings for emergency system
        pingTimeout: 3600000,         // 1 hour ping timeout
        pingInterval: 300000,         // 5 minutes ping interval

        // Buffer settings
        maxHttpBufferSize: 10e6,      // 10MB buffer size

        // Force new connection settings
        forceNew: false,              // Reuse connections
        multiplex: true,              // Multiplex connections

        // Query parameters
        query: {
            emergency: 'true',        // Mark as emergency connection
            keepAlive: '3600000'      // 1 hour keep alive
        },

        // Extra headers for emergency system
        extraHeaders: {
            'X-Emergency-System': 'true',
            'X-Connection-Timeout': '3600000',
            'Connection': 'keep-alive'
        }
    },

    // HTTP client configuration
    http: {
        timeout: 3600000,             // 1 hour timeout
        keepAlive: true,              // Enable keep alive
        keepAliveMsecs: 60000,        // 60 seconds keep alive interval
        maxSockets: 10,               // Maximum sockets per host
        maxFreeSockets: 5,            // Maximum free sockets
        timeout: 3600000,             // 1 hour timeout
        agent: {
            keepAlive: true,
            keepAliveMsecs: 60000,
            maxSockets: 10,
            maxFreeSockets: 5
        }
    },

    // WebSocket specific settings
    websocket: {
        timeout: 3600000,             // 1 hour timeout
        handshakeTimeout: 300000,     // 5 minutes handshake timeout
        perMessageDeflate: {
            threshold: 1024,          // Compress messages over 1KB
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
        }
    },

    // Emergency system specific settings
    emergency: {
        heartbeatInterval: 30000,     // 30 seconds heartbeat
        connectionCheckInterval: 60000, // 1 minute connection check
        maxReconnectDelay: 300000,    // 5 minutes max reconnect delay
        emergencyReconnectMultiplier: 0.5, // Faster reconnect for emergencies
        criticalEventTimeout: 300000, // 5 minutes for critical events
        highEventTimeout: 600000,     // 10 minutes for high priority
        mediumEventTimeout: 1800000,  // 30 minutes for medium priority
        lowEventTimeout: 3600000      // 1 hour for low priority
    },

    // Network error handling
    errorHandling: {
        networkErrors: [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'EPIPE',
            'ECONNABORTED'
        ],
        retryDelays: [1000, 2000, 5000, 10000, 30000, 60000], // Progressive delays
        maxRetries: 10,
        circuitBreakerTimeout: 300000 // 5 minutes circuit breaker
    }
};

module.exports = clientTcpConfig;
