const logger = require('../utils/logger');

class SocketHandlers {
    static setupIncidentHandlers(socket, server) {
        // Subscribe to incident updates
        socket.on('incident:subscribe', (incidentId) => {
            socket.join(`incident:${incidentId}`);
            logger.info(`User ${socket.user.username || socket.user.id} subscribed to incident ${incidentId}`);
        });

        // Unsubscribe from incident updates
        socket.on('incident:unsubscribe', (incidentId) => {
            socket.leave(`incident:${incidentId}`);
            logger.info(`User ${socket.user.username || socket.user.id} unsubscribed from incident ${incidentId}`);
        });

        // Create new incident (from citizen portal)
        socket.on('incident:create', async (incidentData) => {
            try {
                if (!incidentData.title || !incidentData.description) {
                    socket.emit('incident:error', { message: 'Title and description are required' });
                    return;
                }

                // Add timestamp and source
                incidentData.createdAt = new Date().toISOString();
                incidentData.source = 'citizen_portal';
                incidentData.reporterSocketId = socket.id;

                // Broadcast to command center
                server.io.to('role:admin').emit('incident:new', incidentData);
                server.io.to('role:operator').emit('incident:new', incidentData);

                // Store in active incidents
                server.activeIncidents.set(incidentData.id || socket.id, incidentData);

                // Send confirmation to reporter
                socket.emit('incident:created', {
                    message: 'Incident reported successfully',
                    incidentId: incidentData.id || socket.id,
                    estimatedResponseTime: this.calculateEstimatedResponseTime(incidentData.severity)
                });

                logger.info(`New incident created by ${socket.user.username || socket.user.id}: ${incidentData.title}`);

            } catch (error) {
                logger.error('Error creating incident:', error);
                socket.emit('incident:error', { message: 'Failed to create incident' });
            }
        });

        // Update incident status
        socket.on('incident:update_status', async (data) => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('incident:error', { message: 'Unauthorized to update incident status' });
                    return;
                }

                const { incidentId, status, notes } = data;
                
                // Broadcast status update
                server.io.to(`incident:${incidentId}`).emit('incident:status_updated', {
                    incidentId,
                    status,
                    notes,
                    updatedBy: socket.user.username,
                    updatedAt: new Date().toISOString()
                });

                // Update active incidents
                if (server.activeIncidents.has(incidentId)) {
                    const incident = server.activeIncidents.get(incidentId);
                    incident.status = status;
                    incident.lastUpdate = new Date().toISOString();
                    server.activeIncidents.set(incidentId, incident);
                }

                logger.info(`Incident ${incidentId} status updated to ${status} by ${socket.user.username}`);

            } catch (error) {
                logger.error('Error updating incident status:', error);
                socket.emit('incident:error', { message: 'Failed to update incident status' });
            }
        });

        // Request incident details
        socket.on('incident:get_details', async (incidentId) => {
            try {
                if (server.activeIncidents.has(incidentId)) {
                    const incident = server.activeIncidents.get(incidentId);
                    socket.emit('incident:details', incident);
                } else {
                    socket.emit('incident:error', { message: 'Incident not found' });
                }
            } catch (error) {
                logger.error('Error getting incident details:', error);
                socket.emit('incident:error', { message: 'Failed to get incident details' });
            }
        });

        // Get active incidents list
        socket.on('incident:get_active', async () => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('incident:error', { message: 'Unauthorized to view active incidents' });
                    return;
                }

                const activeIncidents = Array.from(server.activeIncidents.values());
                socket.emit('incident:active_list', activeIncidents);

            } catch (error) {
                logger.error('Error getting active incidents:', error);
                socket.emit('incident:error', { message: 'Failed to get active incidents' });
            }
        });

        // Mark incident as resolved
        socket.on('incident:resolve', async (data) => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('incident:error', { message: 'Unauthorized to resolve incident' });
                    return;
                }

                const { incidentId, resolutionNotes } = data;

                // Broadcast resolution
                server.io.to(`incident:${incidentId}`).emit('incident:resolved', {
                    incidentId,
                    resolutionNotes,
                    resolvedBy: socket.user.username,
                    resolvedAt: new Date().toISOString()
                });

                // Remove from active incidents
                server.activeIncidents.delete(incidentId);

                logger.info(`Incident ${incidentId} resolved by ${socket.user.username}`);

            } catch (error) {
                logger.error('Error resolving incident:', error);
                socket.emit('incident:error', { message: 'Failed to resolve incident' });
            }
        });
    }

    static setupResponderHandlers(socket, server) {
        // Register responder
        socket.on('responder:register', async (responderData) => {
            try {
                if (socket.user.role !== 'RESPONDER') {
                    socket.emit('responder:error', { message: 'Unauthorized responder registration' });
                    return;
                }

                // Store responder information
                socket.user.responderId = responderData.responderId;
                socket.user.responderType = responderData.type;
                socket.user.vehicleId = responderData.vehicleId;

                // Join responder-specific rooms
                socket.join(`responder:${responderData.responderId}`);
                socket.join(`responder_type:${responderData.type}`);

                // Broadcast responder online status
                server.io.to('role:admin').emit('responder:online', {
                    responderId: responderData.responderId,
                    type: responderData.type,
                    status: 'AVAILABLE',
                    connectedAt: new Date().toISOString()
                });

                socket.emit('responder:registered', { message: 'Responder registered successfully' });

                logger.info(`Responder registered: ${responderData.responderId} (${responderData.type})`);

            } catch (error) {
                logger.error('Error registering responder:', error);
                socket.emit('responder:error', { message: 'Failed to register responder' });
            }
        });

        // Update responder status
        socket.on('responder:update_status', async (statusData) => {
            try {
                if (socket.user.role !== 'RESPONDER') {
                    socket.emit('responder:error', { message: 'Unauthorized status update' });
                    return;
                }

                const { status, incidentId } = statusData;

                // Broadcast status update
                server.io.to('role:admin').emit('responder:status_update', {
                    responderId: socket.user.responderId,
                    status,
                    incidentId,
                    updatedAt: new Date().toISOString()
                });

                if (incidentId) {
                    server.io.to(`incident:${incidentId}`).emit('responder:incident_status_update', {
                        responderId: socket.user.responderId,
                        status,
                        updatedAt: new Date().toISOString()
                    });
                }

                logger.info(`Responder ${socket.user.responderId} status updated to ${status}`);

            } catch (error) {
                logger.error('Error updating responder status:', error);
                socket.emit('responder:error', { message: 'Failed to update status' });
            }
        });

        // Acknowledge assignment
        socket.on('responder:acknowledge_assignment', async (assignmentData) => {
            try {
                if (socket.user.role !== 'RESPONDER') {
                    socket.emit('responder:error', { message: 'Unauthorized assignment acknowledgment' });
                    return;
                }

                const { incidentId, eta } = assignmentData;

                // Broadcast acknowledgment
                server.io.to(`incident:${incidentId}`).emit('responder:assignment_acknowledged', {
                    responderId: socket.user.responderId,
                    incidentId,
                    eta,
                    acknowledgedAt: new Date().toISOString()
                });

                server.io.to('role:admin').emit('responder:assignment_acknowledged', {
                    responderId: socket.user.responderId,
                    incidentId,
                    eta,
                    acknowledgedAt: new Date().toISOString()
                });

                socket.emit('responder:acknowledgment_sent', { message: 'Assignment acknowledged' });

                logger.info(`Responder ${socket.user.responderId} acknowledged assignment to incident ${incidentId}`);

            } catch (error) {
                logger.error('Error acknowledging assignment:', error);
                socket.emit('responder:error', { message: 'Failed to acknowledge assignment' });
            }
        });

        // Send field update
        socket.on('responder:field_update', async (updateData) => {
            try {
                if (socket.user.role !== 'RESPONDER') {
                    socket.emit('responder:error', { message: 'Unauthorized field update' });
                    return;
                }

                const { incidentId, message, media, priority } = updateData;

                // Broadcast field update
                server.io.to(`incident:${incidentId}`).emit('responder:field_update', {
                    responderId: socket.user.responderId,
                    incidentId,
                    message,
                    media,
                    priority,
                    timestamp: new Date().toISOString()
                });

                server.io.to('role:admin').emit('responder:field_update', {
                    responderId: socket.user.responderId,
                    incidentId,
                    message,
                    media,
                    priority,
                    timestamp: new Date().toISOString()
                });

                logger.info(`Field update from responder ${socket.user.responderId} for incident ${incidentId}`);

            } catch (error) {
                logger.error('Error sending field update:', error);
                socket.emit('responder:error', { message: 'Failed to send field update' });
            }
        });
    }

    static setupLocationHandlers(socket, server) {
        // Update responder location
        socket.on('location:update', async (locationData) => {
            try {
                if (socket.user.role !== 'RESPONDER') {
                    socket.emit('location:error', { message: 'Unauthorized location update' });
                    return;
                }

                const { latitude, longitude, accuracy, heading, speed } = locationData;

                // Validate location data
                if (!latitude || !longitude || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                    socket.emit('location:error', { message: 'Invalid location coordinates' });
                    return;
                }

                const locationUpdate = {
                    responderId: socket.user.responderId,
                    latitude,
                    longitude,
                    accuracy,
                    heading,
                    speed,
                    timestamp: new Date().toISOString()
                };

                // Store location
                server.responderLocations.set(socket.user.responderId, locationUpdate);

                // Broadcast to command center
                server.io.to('role:admin').emit('location:responder_update', locationUpdate);
                server.io.to('role:operator').emit('location:responder_update', locationUpdate);

                // Cache in Redis for persistence
                if (server.redisClient) {
                    await server.redisClient.setex(
                        `responder_location:${socket.user.responderId}`,
                        300, // 5 minutes TTL
                        JSON.stringify(locationUpdate)
                    );
                }

                logger.debug(`Location updated for responder ${socket.user.responderId}: ${latitude}, ${longitude}`);

            } catch (error) {
                logger.error('Error updating location:', error);
                socket.emit('location:error', { message: 'Failed to update location' });
            }
        });

        // Get nearby responders
        socket.on('location:get_nearby_responders', async (queryData) => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('location:error', { message: 'Unauthorized to query responder locations' });
                    return;
                }

                const { latitude, longitude, radius, responderType } = queryData;
                const nearbyResponders = this.findNearbyResponders(
                    server.responderLocations,
                    latitude,
                    longitude,
                    radius,
                    responderType
                );

                socket.emit('location:nearby_responders', nearbyResponders);

            } catch (error) {
                logger.error('Error finding nearby responders:', error);
                socket.emit('location:error', { message: 'Failed to find nearby responders' });
            }
        });

        // Get all responder locations (for map view)
        socket.on('location:get_all_responders', async () => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('location:error', { message: 'Unauthorized to view all responder locations' });
                    return;
                }

                const allLocations = Array.from(server.responderLocations.values());
                socket.emit('location:all_responders', allLocations);

            } catch (error) {
                logger.error('Error getting all responder locations:', error);
                socket.emit('location:error', { message: 'Failed to get responder locations' });
            }
        });
    }

    static setupNotificationHandlers(socket, server) {
        // Send emergency alert
        socket.on('notification:emergency_alert', async (alertData) => {
            try {
                if (socket.user.role !== 'ADMIN' && socket.user.role !== 'OPERATOR') {
                    socket.emit('notification:error', { message: 'Unauthorized to send emergency alerts' });
                    return;
                }

                const alert = {
                    id: `alert_${Date.now()}`,
                    type: alertData.type,
                    message: alertData.message,
                    severity: alertData.severity,
                    targetAudience: alertData.targetAudience,
                    sentBy: socket.user.username,
                    sentAt: new Date().toISOString()
                };

                // Broadcast based on target audience
                if (alertData.targetAudience === 'ALL') {
                    server.io.emit('notification:emergency_alert', alert);
                } else if (alertData.targetAudience === 'RESPONDERS') {
                    server.io.to('role:responder').emit('notification:emergency_alert', alert);
                } else if (alertData.targetAudience === 'COMMAND_CENTER') {
                    server.io.to('role:admin').emit('notification:emergency_alert', alert);
                    server.io.to('role:operator').emit('notification:emergency_alert', alert);
                }

                logger.warn(`Emergency alert sent by ${socket.user.username}: ${alert.message}`);

            } catch (error) {
                logger.error('Error sending emergency alert:', error);
                socket.emit('notification:error', { message: 'Failed to send emergency alert' });
            }
        });

        // Send incident notification
        socket.on('notification:incident', async (notificationData) => {
            try {
                const notification = {
                    id: `notification_${Date.now()}`,
                    incidentId: notificationData.incidentId,
                    type: notificationData.type,
                    message: notificationData.message,
                    recipients: notificationData.recipients,
                    sentBy: socket.user.username,
                    sentAt: new Date().toISOString()
                };

                // Send to specific recipients
                if (notificationData.recipients && notificationData.recipients.length > 0) {
                    notificationData.recipients.forEach(recipient => {
                        server.io.to(`user:${recipient}`).emit('notification:incident', notification);
                    });
                } else {
                    // Send to incident subscribers
                    server.io.to(`incident:${notificationData.incidentId}`).emit('notification:incident', notification);
                }

                logger.info(`Incident notification sent for incident ${notificationData.incidentId}`);

            } catch (error) {
                logger.error('Error sending incident notification:', error);
                socket.emit('notification:error', { message: 'Failed to send notification' });
            }
        });
    }

    // Utility methods
    static calculateEstimatedResponseTime(severity) {
        const times = {
            'CRITICAL': 5,   // 5 minutes
            'HIGH': 10,      // 10 minutes
            'MEDIUM': 30,    // 30 minutes
            'LOW': 60        // 60 minutes
        };
        return times[severity] || 30;
    }

    static findNearbyResponders(responderLocations, latitude, longitude, radius = 5000, responderType = null) {
        const nearby = [];
        
        for (const [responderId, location] of responderLocations) {
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

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

module.exports = SocketHandlers;
