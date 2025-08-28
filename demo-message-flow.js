#!/usr/bin/env node

/**
 * DRDO Emergency System - Real-time JSON Message Flow Demo
 * This script demonstrates how JSON messages are exchanged between sites
 */

console.log('🚀 DRDO Real-time Communication Demo');
console.log('=====================================\n');

// Simulate different types of JSON messages
const messageExamples = {
    incidentReport: {
        event: 'incident:create',
        data: {
            title: 'Suspicious Activity',
            description: 'Unattended package near main entrance',
            category: 'SUSPICIOUS_ACTIVITY',
            severity: 'MEDIUM',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'DRDO Headquarters Main Gate'
            },
            reporterName: 'Anonymous',
            reporterPhone: 'Not provided',
            createdAt: new Date().toISOString(),
            source: 'citizen_portal'
        },
        socketId: 'citizen_socket_123',
        user: {
            id: 'dev_user_123456789',
            role: 'CITIZEN',
            username: 'citizen_user'
        }
    },

    responderUpdate: {
        event: 'responder:update_status',
        data: {
            responderId: 'RDR-001',
            status: 'EN_ROUTE',
            incidentId: 'INC-2025-08-28-001',
            location: {
                latitude: 28.6150,
                longitude: 77.2100,
                accuracy: 5.2
            },
            eta: '8 minutes',
            updatedAt: new Date().toISOString()
        },
        socketId: 'responder_socket_789',
        user: {
            id: 'responder_001',
            role: 'RESPONDER',
            responderId: 'RDR-001',
            responderType: 'SECURITY'
        }
    },

    emergencyAlert: {
        event: 'emergency:alert',
        data: {
            alertId: 'ALERT-2025-08-28-001',
            type: 'SECURITY_THREAT',
            message: 'Security breach detected at Main Gate. All personnel take cover.',
            severity: 'CRITICAL',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                radius: 500
            },
            instructions: [
                'Evacuate the area immediately',
                'Contact security at extension 911',
                'Do not approach suspicious individuals'
            ],
            issuedBy: 'Security Control Room',
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        },
        broadcastTo: 'all_clients',
        priority: 'URGENT',
        timestamp: new Date().toISOString()
    }
};

function simulateMessageFlow() {
    console.log('📡 Simulating Real-time Message Flow\n');

    // Step 1: Citizen reports incident
    console.log('1️⃣ CITIZEN PORTAL → REAL-TIME SERVER');
    console.log('Event: incident:create');
    console.log('JSON Message:');
    console.log(JSON.stringify(messageExamples.incidentReport, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Step 2: Server processes and broadcasts to Command Center
    console.log('2️⃣ REAL-TIME SERVER → COMMAND CENTER');
    console.log('Event: incident:new (broadcast)');
    const broadcastMessage = {
        event: 'incident:new',
        data: {
            ...messageExamples.incidentReport.data,
            incidentId: 'INC-2025-08-28-001',
            status: 'REPORTED',
            estimatedResponseTime: '15 minutes'
        },
        broadcastTo: ['role:admin', 'role:operator'],
        timestamp: new Date().toISOString()
    };
    console.log('JSON Message:');
    console.log(JSON.stringify(broadcastMessage, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Step 3: Responder updates status
    console.log('3️⃣ RESPONDER → REAL-TIME SERVER');
    console.log('Event: responder:update_status');
    console.log('JSON Message:');
    console.log(JSON.stringify(messageExamples.responderUpdate, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Step 4: Server broadcasts responder update
    console.log('4️⃣ REAL-TIME SERVER → ALL CLIENTS');
    console.log('Event: responder:status_update (broadcast)');
    const responderBroadcast = {
        event: 'responder:status_update',
        data: messageExamples.responderUpdate.data,
        broadcastTo: ['role:admin', 'role:operator', 'role:citizen'],
        timestamp: new Date().toISOString()
    };
    console.log('JSON Message:');
    console.log(JSON.stringify(responderBroadcast, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Step 5: Emergency alert broadcast
    console.log('5️⃣ SECURITY SYSTEM → ALL CLIENTS');
    console.log('Event: emergency:alert (broadcast to all)');
    console.log('JSON Message:');
    console.log(JSON.stringify(messageExamples.emergencyAlert, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');
}

function showEventHandlers() {
    console.log('🔧 Socket.IO Event Handlers Structure');
    console.log('=====================================\n');

    console.log('SERVER-SIDE HANDLERS:');
    console.log(`
// realtime-server/handlers/socketHandlers.js
socket.on('incident:create', (data) => {
    console.log('📝 Processing incident:', data.title);
    // Validate incident data
    // Store in database
    // Broadcast to command center
    io.to('role:admin').emit('incident:new', processedIncident);
    io.to('role:operator').emit('incident:new', processedIncident);
});

socket.on('responder:update_status', (data) => {
    console.log('🚗 Responder status update:', data.responderId);
    // Update responder location/status
    // Broadcast to relevant clients
    io.to('role:admin').emit('responder:status_update', data);
});

socket.on('emergency:alert', (data) => {
    console.log('🚨 Emergency alert:', data.message);
    // Log emergency event
    // Broadcast to all connected clients
    io.emit('emergency:alert', data);
});
`);
    console.log('\nCLIENT-SIDE LISTENERS:');
    console.log(`
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
`);
}

function showMessageStructure() {
    console.log('📋 JSON Message Structure Reference');
    console.log('===================================\n');

    console.log('INCIDENT REPORT STRUCTURE:');
    console.log(JSON.stringify({
        event: 'incident:create',
        data: {
            title: 'string',
            description: 'string',
            category: 'SUSPICIOUS_ACTIVITY | MEDICAL_EMERGENCY | FIRE | SECURITY_BREACH',
            severity: 'LOW | MEDIUM | HIGH | CRITICAL',
            location: {
                latitude: 'number',
                longitude: 'number',
                address: 'string (optional)'
            },
            reporterName: 'string',
            reporterPhone: 'string (optional)',
            createdAt: 'ISO 8601 timestamp',
            source: 'citizen_portal | command_center'
        },
        socketId: 'string',
        user: {
            id: 'string',
            role: 'CITIZEN | ADMIN | RESPONDER',
            username: 'string'
        }
    }, null, 2));

    console.log('\nRESPONDER UPDATE STRUCTURE:');
    console.log(JSON.stringify({
        event: 'responder:update_status',
        data: {
            responderId: 'string',
            status: 'AVAILABLE | EN_ROUTE | ON_SCENE | RETURNING',
            incidentId: 'string (optional)',
            location: {
                latitude: 'number',
                longitude: 'number',
                accuracy: 'number (meters)'
            },
            eta: 'string (optional)',
            updatedAt: 'ISO 8601 timestamp'
        },
        socketId: 'string',
        user: {
            id: 'string',
            role: 'RESPONDER',
            responderId: 'string',
            responderType: 'SECURITY | MEDICAL | FIRE'
        }
    }, null, 2));

    console.log('\nEMERGENCY ALERT STRUCTURE:');
    console.log(JSON.stringify({
        event: 'emergency:alert',
        data: {
            alertId: 'string',
            type: 'SECURITY_THREAT | MEDICAL_EMERGENCY | FIRE | EVACUATION',
            message: 'string',
            severity: 'LOW | MEDIUM | HIGH | CRITICAL',
            location: {
                latitude: 'number',
                longitude: 'number',
                radius: 'number (meters)'
            },
            instructions: 'array of strings',
            issuedBy: 'string',
            issuedAt: 'ISO 8601 timestamp',
            expiresAt: 'ISO 8601 timestamp (optional)'
        },
        broadcastTo: 'all_clients | array of roles',
        priority: 'NORMAL | URGENT | CRITICAL',
        timestamp: 'ISO 8601 timestamp'
    }, null, 2));
}

// Run the demonstration
console.log('Starting DRDO Real-time Communication Demo...\n');
simulateMessageFlow();
showEventHandlers();
showMessageStructure();

console.log('✅ Demo completed!');
console.log('\n💡 Key Points:');
console.log('• All communication uses JSON format');
console.log('• Messages flow through Socket.IO real-time server');
console.log('• Server broadcasts relevant messages to appropriate clients');
console.log('• Each message includes metadata (timestamps, user info, etc.)');
console.log('• Events are typed for easy client-side handling');
console.log('\n🔗 To see live demo, open: realtime-communication-demo.html');
