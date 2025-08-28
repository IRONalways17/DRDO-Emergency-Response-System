# DRDO Emergency Response System - Real-time Server

## Overview

The Real-time Server is a critical component of the DRDO Emergency Response System that handles real-time communication between all system components using WebSocket technology. It provides instant updates for incidents, responder coordination, location tracking, and emergency notifications.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Citizen       │    │   Command       │    │   Responder     │
│   Portal        │    │   Center        │    │   Mobile App    │
│   (Next.js)     │    │   (Next.js)     │    │   (React Native)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │              WebSocket Connections          │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
┌──────────────────────────────────────────────────────────────────┐
│                    REAL-TIME SERVER                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Socket.IO  │  │   Express   │  │    Redis    │              │
│  │   Handlers  │  │     API     │  │   PubSub    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Middleware  │  │ Validation  │  │  Security   │              │
│  │   Layer     │  │   Utils     │  │   Utils     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────v───────┐    ┌─────────v───────┐    ┌─────────v───────┐
│   Java Backend  │    │   PostgreSQL   │    │      Redis      │
│   REST API      │    │   Database     │    │     Cache       │
│   (Spring Boot) │    │                │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### Real-time Communication
- **WebSocket Connections**: Instant bidirectional communication
- **Room-based Broadcasting**: Efficient message routing
- **Role-based Access Control**: Secure communication channels
- **Connection Management**: Automatic reconnection and heartbeat

### Incident Management
- **Live Incident Updates**: Real-time status changes
- **Emergency Alerts**: Immediate broadcast to relevant personnel
- **Assignment Notifications**: Instant responder assignment updates
- **Progress Tracking**: Live updates from field operations

### Responder Coordination
- **Location Tracking**: Real-time GPS positioning
- **Status Updates**: Availability and assignment status
- **Field Communications**: Direct messaging and updates
- **Emergency Recall**: System-wide responder notifications

### Security & Monitoring
- **JWT Authentication**: Secure connection establishment
- **Rate Limiting**: Protection against abuse
- **Comprehensive Logging**: Audit trail and debugging
- **Health Monitoring**: System status and metrics

## Technology Stack

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **Redis**: In-memory data store and pub/sub
- **Winston**: Comprehensive logging
- **JWT**: JSON Web Token authentication
- **Helmet**: Security middleware
- **Rate Limiting**: Request throttling

## Installation

### Prerequisites
- Node.js 18+ and npm 9+
- Redis server
- PostgreSQL database (for integration)

### Setup
```bash
# Navigate to real-time server directory
cd realtime-server

# Install dependencies
npm install

# Copy environment configuration
cp ../.env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev

# Or start production server
npm start
```

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
REALTIME_SERVER_PORT=8081

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Configuration
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/realtime-server.log
```

## API Endpoints

### Health & Monitoring
```
GET /health                    - Health check
GET /api/statistics           - System statistics
GET /api/connected-users      - Connected users list
GET /api/websocket/status     - WebSocket status
GET /metrics                  - Performance metrics
```

### External Integration (Requires API Key)
```
POST /api/external/incidents/:id/update    - Update incident
POST /api/external/incidents               - Create incident
POST /api/external/responders/:id/status   - Update responder status
POST /api/external/responders/:id/location - Update responder location
GET  /api/external/responders/nearby       - Find nearby responders
POST /api/broadcast                         - Broadcast message
```

## WebSocket Events

### Client → Server Events

#### Incident Events
```javascript
// Subscribe to incident updates
socket.emit('incident:subscribe', incidentId);

// Create new incident
socket.emit('incident:create', {
  title: 'Bomb Threat Report',
  description: 'Suspicious package found...',
  location: { latitude: 28.6139, longitude: 77.2090 },
  severity: 'CRITICAL',
  category: 'BOMB_THREAT'
});

// Update incident status
socket.emit('incident:update_status', {
  incidentId: 'inc_123',
  status: 'IN_PROGRESS',
  notes: 'Responders on scene'
});
```

#### Responder Events
```javascript
// Register as responder
socket.emit('responder:register', {
  responderId: 'resp_001',
  type: 'BOMB_SQUAD',
  vehicleId: 'BS-001'
});

// Update location
socket.emit('location:update', {
  latitude: 28.6139,
  longitude: 77.2090,
  accuracy: 5,
  heading: 180,
  speed: 45
});

// Update status
socket.emit('responder:update_status', {
  status: 'EN_ROUTE',
  incidentId: 'inc_123'
});
```

### Server → Client Events

#### Incident Updates
```javascript
// New incident created
socket.on('incident:new', (incident) => {
  console.log('New incident:', incident);
});

// Incident status updated
socket.on('incident:status_updated', (update) => {
  console.log('Status update:', update);
});

// Emergency alert
socket.on('notification:emergency_alert', (alert) => {
  console.log('EMERGENCY:', alert.message);
});
```

#### Responder Updates
```javascript
// Responder assignment
socket.on('responder:assignment', (assignment) => {
  console.log('New assignment:', assignment);
});

// Location update
socket.on('location:responder_update', (location) => {
  console.log('Responder moved:', location);
});

// Responder status change
socket.on('responder:status_update', (status) => {
  console.log('Status change:', status);
});
```

## Authentication

### JWT Token Structure
```javascript
{
  id: 'user_123',
  username: 'admin',
  role: 'ADMIN', // ADMIN, OPERATOR, RESPONDER, CITIZEN
  permissions: ['incident:create', 'responder:assign'],
  iat: 1640995200,
  exp: 1641081600
}
```

### Connection Authentication
```javascript
// Option 1: In connection handshake
const socket = io('ws://localhost:8081', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

// Option 2: In headers
const socket = io('ws://localhost:8081', {
  extraHeaders: {
    'Authorization': 'Bearer your_jwt_token_here'
  }
});
```

## Security Features

### Rate Limiting
- **Connection Limits**: Max 10 connections per IP per minute
- **Event Limits**: Max 60 events per socket per minute
- **API Limits**: Max 100 requests per IP per minute

### Access Control
- **Role-based Rooms**: Automatic room assignment based on user role
- **Event Validation**: All events validated before processing
- **Data Sanitization**: Input sanitization for security

### Monitoring
- **Security Logging**: All security events logged
- **Suspicious Activity Detection**: Automatic threat detection
- **Connection Monitoring**: Real-time connection tracking

## Performance

### Scalability
- **Horizontal Scaling**: Redis adapter for multi-instance deployment
- **Connection Pooling**: Efficient connection management
- **Memory Management**: Automatic cleanup of inactive connections

### Monitoring
- **Real-time Metrics**: Connection counts, event rates, response times
- **Health Checks**: Continuous system health monitoring
- **Performance Logging**: Detailed performance analytics

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t drdo-realtime-server .

# Run container
docker run -d \
  --name realtime-server \
  -p 8081:8081 \
  -e NODE_ENV=production \
  -e REDIS_HOST=redis \
  drdo-realtime-server
```

### Production Configuration
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name realtime-server

# Enable clustering
pm2 start server.js -i max --name realtime-cluster

# Monitor processes
pm2 monit
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Testing
```bash
# Test WebSocket connections
node test/websocket-test.js

# Load testing
npm run test:load
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check Redis connectivity
   - Verify JWT token validity
   - Check CORS configuration

2. **High Memory Usage**
   - Monitor connection counts
   - Check for memory leaks
   - Review data retention policies

3. **Performance Issues**
   - Monitor event rates
   - Check Redis performance
   - Review middleware overhead

### Debug Mode
```bash
# Enable debug logging
DEBUG=drdo:* npm run dev

# Monitor real-time connections
curl http://localhost:8081/api/websocket/status
```

## Architecture Decisions

### Why Socket.IO?
- **Reliability**: Automatic fallback to polling
- **Scalability**: Built-in clustering support
- **Features**: Rooms, namespaces, broadcasting
- **Community**: Large ecosystem and support

### Why Redis?
- **Performance**: In-memory operations
- **Pub/Sub**: Native publish/subscribe
- **Scaling**: Multi-instance coordination
- **Persistence**: Optional data persistence

### Security Considerations
- **Authentication**: JWT-based security
- **Authorization**: Role-based access control
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive data validation

## Contributing

Please see the main project README for contribution guidelines.

## License

This project is developed for DRDO and contains sensitive security-related code. All rights reserved.

## Support

For technical support or questions about the real-time server:
- Internal DRDO documentation
- Development team contact
- System administrator guidance
