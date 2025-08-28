/**
 * TCP/IP Configuration for DRDO Emergency Response System
 * Using Socket.IO default settings for better reliability
 */

const tcpConfig = {
    // Server-level TCP settings - Socket.IO defaults
    server: {
        keepAliveTimeout: 5000,    // 5 seconds (default)
        headersTimeout: 60000,     // 60 seconds (default)
        requestTimeout: 300000,    // 5 minutes (default)
        timeout: 120000,           // 2 minutes (default)
        maxConnections: 100,       // Reasonable limit
        maxHeadersCount: 100,      // Reasonable header limit
    },

    // Socket-level TCP optimizations
    socket: {
        timeout: 120000,           // 2 minutes
        keepAlive: true,
        keepAliveInterval: 30000,  // 30 seconds
        noDelay: true,             // Disable Nagle's algorithm
        allowHalfOpen: false,      // Prevent half-open connections
        writableHighWaterMark: 16384, // 16KB write buffer (default)
        readableHighWaterMark: 16384, // 16KB read buffer (default)
    },

    // Socket.IO default settings
    socketio: {
        pingTimeout: 60000,        // 60 seconds (Socket.IO default)
        pingInterval: 25000,       // 25 seconds (Socket.IO default)
        connectTimeout: 45000,     // 45 seconds (Socket.IO default)
        upgradeTimeout: 10000,     // 10 seconds (Socket.IO default)
        maxHttpBufferSize: 1e6,    // 1MB (Socket.IO default)
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        cookie: false,
        serveClient: process.env.NODE_ENV === 'development',
    },

    // HTTP compression for TCP efficiency
    compression: {
        enabled: true,
        threshold: 1024,           // Compress responses over 1KB
        level: 6,                  // Good balance of speed/compression
        memLevel: 8,               // Memory usage for compression
        chunkSize: 16384,          // 16KB chunks
    },

    // Connection pooling for database/external services
    connectionPool: {
        min: 2,
        max: 10,                   // Reduced pool size
        idleTimeoutMillis: 300000, // 5 minutes
        acquireTimeoutMillis: 60000, // 1 minute
        createTimeoutMillis: 30000,  // 30 seconds
        destroyTimeoutMillis: 5000,  // 5 seconds
        reapIntervalMillis: 1000,    // 1 second
        createRetryIntervalMillis: 200, // 200ms
    },

    // Network interface settings
    network: {
        listenAddress: '0.0.0.0',  // Listen on all interfaces
        backlog: 511,              // Connection backlog
        exclusive: false,          // Allow multiple processes
    },

    // Emergency system specific settings
    emergency: {
        criticalTimeout: 30000,    // 30 seconds for critical alerts
        highTimeout: 60000,        // 1 minute for high priority
        mediumTimeout: 180000,     // 3 minutes for medium priority
        lowTimeout: 300000,        // 5 minutes for low priority
        heartbeatInterval: 30000,  // 30 seconds heartbeat
        reconnectAttempts: 5,      // Number of reconnection attempts
        reconnectDelay: 1000,      // 1 second between attempts
    }
};

module.exports = tcpConfig;
