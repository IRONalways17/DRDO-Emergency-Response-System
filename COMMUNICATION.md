# DRDO Emergency System - Real-time JSON Communication Guide

## Overview
The DRDO Emergency System uses Socket.IO for real-time communication between three main components:
- **Citizen Portal** (Port 3003) - Public incident reporting
- **Real-time Server** (Port 8081) - Message routing and broadcasting
- **Command Center** (Port 3002) - Emergency response coordination

## How Real-time Communication Works

### 1. Message Flow Architecture
```
Citizen Portal → Real-time Server → Command Center
     ↑                                    ↓
     └──────────── Responder Updates ─────┘
```

### 2. JSON Message Structure
All communication uses structured JSON messages with consistent format:

```json
{
  "event": "event_type",
  "data": {
    // Event-specific data
  },
  "socketId": "client_socket_id",
  "user": {
    "id": "user_id",
    "role": "CITIZEN|ADMIN|RESPONDER",
    "username": "username"
  }
}
```

### 3. Key Event Types

#### Incident Reporting
**Citizen → Server:**
```json
{
  "event": "incident:create",
  "data": {
    "title": "Suspicious Activity",
    "description": "Unattended package",
    "category": "SUSPICIOUS_ACTIVITY",
    "severity": "MEDIUM",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "DRDO Main Gate"
    },
    "reporterName": "Anonymous",
    "createdAt": "2025-08-28T14:22:08.200Z"
  }
}
```

**Server → Command Center:**
```json
{
  "event": "incident:new",
  "data": {
    "incidentId": "INC-2025-08-28-001",
    "status": "REPORTED",
    "estimatedResponseTime": "15 minutes"
  },
  "broadcastTo": ["role:admin", "role:operator"]
}
```

#### Responder Updates
**Responder → Server:**
```json
{
  "event": "responder:update_status",
  "data": {
    "responderId": "RDR-001",
    "status": "EN_ROUTE",
    "location": {
      "latitude": 28.6150,
      "longitude": 77.2100,
      "accuracy": 5.2
    },
    "eta": "8 minutes"
  }
}
```

#### Emergency Alerts
**System → All Clients:**
```json
{
  "event": "emergency:alert",
  "data": {
    "alertId": "ALERT-2025-08-28-001",
    "type": "SECURITY_THREAT",
    "message": "Security breach detected",
    "severity": "CRITICAL",
    "instructions": [
      "Evacuate immediately",
      "Contact security at 911"
    ]
  },
  "broadcastTo": "all_clients",
  "priority": "URGENT"
}
```

## Server-Side Event Handlers

```javascript
// realtime-server/handlers/socketHandlers.js
socket.on('incident:create', (data) => {
    // Process incident from citizen
    console.log('New incident:', data.title);

    // Validate and store incident
    const processedIncident = validateIncident(data);

    // Broadcast to command center operators
    io.to('role:admin').emit('incident:new', processedIncident);
    io.to('role:operator').emit('incident:new', processedIncident);
});

socket.on('responder:update_status', (data) => {
    // Update responder status
    console.log('Responder update:', data.responderId);

    // Broadcast to relevant clients
    io.to('role:admin').emit('responder:status_update', data);
    io.to('role:operator').emit('responder:status_update', data);
});

socket.on('emergency:alert', (data) => {
    // Broadcast emergency to all connected clients
    io.emit('emergency:alert', data);
});
```

## Client-Side Event Listeners

```javascript
// command-center/index.html
socket.on('incident:new', (incident) => {
    console.log('📝 New incident received');
    updateIncidentList(incident);
    updateMapMarker(incident);
    showNotification(incident);
});

socket.on('responder:status_update', (update) => {
    console.log('🚗 Responder update received');
    updateResponderMarker(update);
    updateIncidentStatus(update.incidentId, update.status);
});

socket.on('emergency:alert', (alert) => {
    console.log('🚨 Emergency alert received');
    showEmergencyAlert(alert);
    triggerEmergencyProtocol(alert);
});
```

## Key Benefits

1. **Real-time Updates**: Instant communication between all system components
2. **Structured Data**: Consistent JSON format ensures reliable message parsing
3. **Role-based Broadcasting**: Messages sent only to relevant recipients
4. **Event-driven Architecture**: Loose coupling between sender and receiver
5. **Scalable**: Easy to add new event types and message handlers

## Files Involved

- `realtime-server/server.js` - Main Socket.IO server
- `realtime-server/handlers/socketHandlers.js` - Event processing logic
- `command-center/index.html` - Command center client
- `citizen-portal/index.html` - Citizen portal client
- `realtime-communication-demo.html` - Interactive demo
- `demo-message-flow.js` - Message flow demonstration

## Testing the System

1. Start all three servers:
   ```bash
   # Terminal 1: Real-time server
   cd realtime-server && node server.js

   # Terminal 2: Command center
   cd command-center && node index.js

   # Terminal 3: Citizen portal
   cd citizen-portal && node index.js
   ```

2. Open the demo page:
   - `realtime-communication-demo.html`

3. Test message flow:
   - Run `node demo-message-flow.js` to see JSON examples

4. Monitor real-time communication in browser developer tools

## Next Steps

- Add message persistence to database
- Implement message encryption for sensitive data
- Add message queuing for offline clients
- Create admin dashboard for monitoring message traffic
