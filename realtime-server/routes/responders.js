const express = require('express');
const ValidationUtils = require('../utils/validation');
const logger = require('../utils/logger');

class ResponderRoutes {
    static createRouter(server) {
        const router = express.Router();

        // Update responder status
        router.post('/responders/:id/status', async (req, res) => {
            try {
                const { id } = req.params;
                const { status, incidentId, notes } = req.body;

                const validStatuses = ['AVAILABLE', 'BUSY', 'EN_ROUTE', 'ON_SCENE', 'UNAVAILABLE'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ error: 'Invalid status' });
                }

                const statusUpdate = {
                    responderId: id,
                    status,
                    incidentId,
                    notes,
                    updatedAt: new Date().toISOString()
                };

                // Broadcast to command center
                server.io.to('role:admin').emit('responder:status_update', statusUpdate);
                server.io.to('role:operator').emit('responder:status_update', statusUpdate);

                // If associated with incident, notify incident subscribers
                if (incidentId) {
                    server.io.to(`incident:${incidentId}`).emit('responder:incident_status_update', statusUpdate);
                }

                // Notify the responder
                server.io.to(`responder:${id}`).emit('responder:status_confirmed', statusUpdate);

                logger.responder('Responder status updated via API', { responderId: id, status });

                res.json({
                    success: true,
                    statusUpdate,
                    message: 'Status updated successfully'
                });

            } catch (error) {
                logger.error('Error updating responder status:', error);
                res.status(500).json({ error: 'Failed to update status' });
            }
        });

        // Update responder location
        router.post('/responders/:id/location', async (req, res) => {
            try {
                const { id } = req.params;
                const locationData = req.body;

                const errors = ValidationUtils.validateLocationUpdate(locationData);
                if (errors.length > 0) {
                    return res.status(400).json({ errors });
                }

                const locationUpdate = {
                    responderId: id,
                    ...locationData,
                    timestamp: new Date().toISOString()
                };

                // Store location
                server.responderLocations.set(id, locationUpdate);

                // Broadcast to command center
                server.io.to('role:admin').emit('location:responder_update', locationUpdate);
                server.io.to('role:operator').emit('location:responder_update', locationUpdate);

                // Cache in Redis
                if (server.redisClient) {
                    await server.redisClient.setex(
                        `responder_location:${id}`,
                        300, // 5 minutes TTL
                        JSON.stringify(locationUpdate)
                    );
                }

                logger.responder('Responder location updated via API', { responderId: id });

                res.json({
                    success: true,
                    locationUpdate,
                    message: 'Location updated successfully'
                });

            } catch (error) {
                logger.error('Error updating responder location:', error);
                res.status(500).json({ error: 'Failed to update location' });
            }
        });

        // Get nearby responders
        router.get('/responders/nearby', async (req, res) => {
            try {
                const { lat, lng, radius, type } = req.query;

                if (!lat || !lng) {
                    return res.status(400).json({ error: 'Latitude and longitude are required' });
                }

                const latitude = parseFloat(lat);
                const longitude = parseFloat(lng);
                const searchRadius = parseInt(radius) || 5000;

                if (!ValidationUtils.validateCoordinates(latitude, longitude)) {
                    return res.status(400).json({ error: 'Invalid coordinates' });
                }

                if (!ValidationUtils.validateRadius(searchRadius)) {
                    return res.status(400).json({ error: 'Invalid radius' });
                }

                const nearbyResponders = server.findNearbyResponders(
                    latitude,
                    longitude,
                    searchRadius,
                    type
                );

                res.json({
                    responders: nearbyResponders,
                    query: {
                        latitude,
                        longitude,
                        radius: searchRadius,
                        type: type || 'all'
                    }
                });

            } catch (error) {
                logger.error('Error finding nearby responders:', error);
                res.status(500).json({ error: 'Failed to find nearby responders' });
            }
        });

        // Get all active responders
        router.get('/responders/active', async (req, res) => {
            try {
                const { type, status } = req.query;

                let responders = Array.from(server.responderLocations.values());

                // Apply filters
                if (type) {
                    responders = responders.filter(r => r.responderType === type);
                }

                if (status) {
                    responders = responders.filter(r => r.status === status);
                }

                // Sort by last update time
                responders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                res.json({
                    responders,
                    count: responders.length
                });

            } catch (error) {
                logger.error('Error fetching active responders:', error);
                res.status(500).json({ error: 'Failed to fetch responders' });
            }
        });

        // Send message to responder
        router.post('/responders/:id/message', async (req, res) => {
            try {
                const { id } = req.params;
                const { message, priority, type } = req.body;

                if (!message) {
                    return res.status(400).json({ error: 'Message is required' });
                }

                const messageData = {
                    id: `msg_${Date.now()}`,
                    responderId: id,
                    message,
                    priority: priority || 'MEDIUM',
                    type: type || 'GENERAL',
                    sentAt: new Date().toISOString(),
                    sentBy: 'system'
                };

                // Send to specific responder
                server.io.to(`responder:${id}`).emit('responder:message', messageData);

                logger.responder('Message sent to responder', { responderId: id, messageType: type });

                res.json({
                    success: true,
                    messageData,
                    message: 'Message sent successfully'
                });

            } catch (error) {
                logger.error('Error sending message to responder:', error);
                res.status(500).json({ error: 'Failed to send message' });
            }
        });

        // Broadcast to all responders of a type
        router.post('/responders/broadcast', async (req, res) => {
            try {
                const { message, responderType, priority, region } = req.body;

                if (!message) {
                    return res.status(400).json({ error: 'Message is required' });
                }

                const broadcast = {
                    id: `broadcast_${Date.now()}`,
                    message,
                    responderType,
                    priority: priority || 'MEDIUM',
                    region,
                    sentAt: new Date().toISOString(),
                    sentBy: 'system'
                };

                // Broadcast to appropriate responders
                if (responderType) {
                    server.io.to(`responder_type:${responderType}`).emit('responder:broadcast', broadcast);
                } else {
                    server.io.to('role:responder').emit('responder:broadcast', broadcast);
                }

                logger.responder('Broadcast sent to responders', { responderType, region });

                res.json({
                    success: true,
                    broadcast,
                    message: 'Broadcast sent successfully'
                });

            } catch (error) {
                logger.error('Error broadcasting to responders:', error);
                res.status(500).json({ error: 'Failed to broadcast message' });
            }
        });

        // Get responder details
        router.get('/responders/:id', async (req, res) => {
            try {
                const { id } = req.params;

                const location = server.responderLocations.get(id);
                
                if (!location) {
                    return res.status(404).json({ error: 'Responder not found or offline' });
                }

                res.json({
                    responder: location
                });

            } catch (error) {
                logger.error('Error fetching responder details:', error);
                res.status(500).json({ error: 'Failed to fetch responder details' });
            }
        });

        // Emergency recall - bring all responders back
        router.post('/responders/emergency-recall', async (req, res) => {
            try {
                const { reason, priority } = req.body;

                const recallOrder = {
                    id: `recall_${Date.now()}`,
                    type: 'EMERGENCY_RECALL',
                    reason: reason || 'Emergency situation requires immediate return',
                    priority: priority || 'CRITICAL',
                    issuedAt: new Date().toISOString(),
                    issuedBy: 'system'
                };

                // Send to all responders
                server.io.to('role:responder').emit('responder:emergency_recall', recallOrder);

                // Notify command center
                server.io.to('role:admin').emit('system:emergency_recall_issued', recallOrder);

                logger.emergency('Emergency recall issued for all responders', { reason });

                res.json({
                    success: true,
                    recallOrder,
                    message: 'Emergency recall issued to all responders'
                });

            } catch (error) {
                logger.error('Error issuing emergency recall:', error);
                res.status(500).json({ error: 'Failed to issue emergency recall' });
            }
        });

        // Get responder assignments
        router.get('/responders/:id/assignments', async (req, res) => {
            try {
                const { id } = req.params;
                const { status, limit } = req.query;

                // In a real system, this would query the database
                // For now, we'll return active assignments from memory
                
                const assignments = [];
                for (const [incidentId, incident] of server.activeIncidents) {
                    if (incident.assignedResponders && incident.assignedResponders.includes(id)) {
                        if (!status || incident.status === status) {
                            assignments.push({
                                incidentId,
                                incident,
                                assignedAt: incident.assignedAt,
                                status: incident.status
                            });
                        }
                    }
                }

                // Sort by assignment time
                assignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

                // Apply limit
                const limitNum = parseInt(limit) || 50;
                const limitedAssignments = assignments.slice(0, limitNum);

                res.json({
                    assignments: limitedAssignments,
                    count: limitedAssignments.length,
                    total: assignments.length
                });

            } catch (error) {
                logger.error('Error fetching responder assignments:', error);
                res.status(500).json({ error: 'Failed to fetch assignments' });
            }
        });

        return router;
    }
}

module.exports = ResponderRoutes;
