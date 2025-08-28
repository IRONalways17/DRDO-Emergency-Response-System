const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// Root route
router.get('/', (req, res) => {
    res.json({
        message: 'DRDO Emergency Response Real-time Server',
        version: '1.0.0',
        status: 'operational',
        services: {
            socketio: 'active',
            rest_api: 'active',
            emergency_protocols: 'active'
        },
        endpoints: {
            health: '/health',
            incidents: '/api/incidents',
            responders: '/api/responders',
            websocket: 'ws://localhost:8081',
            test_dashboard: '/test'
        },
        timestamp: new Date().toISOString()
    });
});

// Test dashboard route
router.get('/test', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    try {
        const dashboardPath = path.join(__dirname, '../test-dashboard.html');
        const dashboard = fs.readFileSync(dashboardPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(dashboard);
    } catch (error) {
        logger.error('Failed to serve test dashboard', { error: error.message });
        res.status(500).json({ error: 'Test dashboard not available' });
    }
});

// Health check route
router.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
        status: 'healthy',
        uptime: uptime,
        timestamp: new Date().toISOString(),
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        environment: process.env.NODE_ENV || 'development',
        services: {
            express: 'running',
            socketio: 'running',
            redis: process.env.REDIS_ENABLED === 'true' ? 'connected' : 'disabled'
        }
    });
});

// API status
router.get('/api', (req, res) => {
    res.json({
        message: 'DRDO Emergency Response API',
        version: '1.0.0',
        endpoints: [
            'GET /api/incidents - List all incidents',
            'POST /api/incidents - Create new incident',
            'GET /api/incidents/:id - Get specific incident',
            'PUT /api/incidents/:id - Update incident',
            'GET /api/responders - List all responders',
            'POST /api/responders - Register new responder',
            'GET /api/responders/:id - Get specific responder',
            'PUT /api/responders/:id - Update responder'
        ],
        realtime: {
            websocket: 'ws://localhost:8081',
            events: [
                'incident:create',
                'incident:update',
                'responder:register',
                'responder:update',
                'location:update',
                'notification:emergency_alert'
            ]
        }
    });
});

module.exports = router;
