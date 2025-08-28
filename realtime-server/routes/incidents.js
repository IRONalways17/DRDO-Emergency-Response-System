const express = require('express');
const ValidationUtils = require('../utils/validation');
const logger = require('../utils/logger');

class IncidentRoutes {
    static createRouter(server) {
        const router = express.Router();

        // Broadcast incident update
        router.post('/incidents/:id/update', async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;

                // Validate update data
                const errors = [];
                if (!updateData.status && !updateData.message && !updateData.priority) {
                    errors.push('At least one update field is required');
                }

                if (updateData.status && !['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(updateData.status)) {
                    errors.push('Invalid status');
                }

                if (errors.length > 0) {
                    return res.status(400).json({ errors });
                }

                // Broadcast to all subscribers
                const update = {
                    incidentId: id,
                    ...updateData,
                    updatedAt: new Date().toISOString(),
                    source: 'backend'
                };

                server.io.to(`incident:${id}`).emit('incident:update', update);
                server.io.to('role:admin').emit('incident:update', update);
                server.io.to('role:operator').emit('incident:update', update);

                // Update active incidents cache
                if (server.activeIncidents.has(id)) {
                    const incident = server.activeIncidents.get(id);
                    Object.assign(incident, updateData);
                    incident.lastUpdate = new Date().toISOString();
                    server.activeIncidents.set(id, incident);
                }

                logger.incident('Incident updated via API', { incidentId: id, updateData });

                res.json({ 
                    success: true, 
                    message: 'Incident update broadcasted',
                    subscriberCount: server.io.sockets.adapter.rooms.get(`incident:${id}`)?.size || 0
                });

            } catch (error) {
                logger.error('Error broadcasting incident update:', error);
                res.status(500).json({ error: 'Failed to broadcast update' });
            }
        });

        // Create new incident
        router.post('/incidents', async (req, res) => {
            try {
                const incidentData = ValidationUtils.sanitizeIncidentData(req.body);
                const errors = ValidationUtils.validateIncidentData(incidentData);

                if (errors.length > 0) {
                    return res.status(400).json({ errors });
                }

                // Add metadata
                incidentData.id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                incidentData.createdAt = new Date().toISOString();
                incidentData.status = 'REPORTED';
                incidentData.source = 'backend';

                // Store in active incidents
                server.activeIncidents.set(incidentData.id, incidentData);

                // Broadcast to command center
                server.io.to('role:admin').emit('incident:new', incidentData);
                server.io.to('role:operator').emit('incident:new', incidentData);

                // Notify nearby responders if location available
                if (incidentData.location && incidentData.location.latitude && incidentData.location.longitude) {
                    const nearbyResponders = server.findNearbyResponders(
                        incidentData.location.latitude,
                        incidentData.location.longitude,
                        5000 // 5km radius
                    );

                    nearbyResponders.forEach(responder => {
                        server.io.to(`responder:${responder.responderId}`).emit('incident:nearby', {
                            ...incidentData,
                            distance: responder.distance
                        });
                    });
                }

                logger.incident('New incident created via API', { incidentId: incidentData.id });

                res.status(201).json({
                    success: true,
                    incident: incidentData,
                    message: 'Incident created and broadcasted'
                });

            } catch (error) {
                logger.error('Error creating incident via API:', error);
                res.status(500).json({ error: 'Failed to create incident' });
            }
        });

        // Get active incidents
        router.get('/incidents/active', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                const severity = req.query.severity;
                const status = req.query.status;

                let incidents = Array.from(server.activeIncidents.values());

                // Apply filters
                if (severity) {
                    incidents = incidents.filter(inc => inc.severity === severity);
                }
                if (status) {
                    incidents = incidents.filter(inc => inc.status === status);
                }

                // Sort by creation time (newest first)
                incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Pagination
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedIncidents = incidents.slice(startIndex, endIndex);

                res.json({
                    incidents: paginatedIncidents,
                    pagination: {
                        page,
                        limit,
                        total: incidents.length,
                        pages: Math.ceil(incidents.length / limit)
                    }
                });

            } catch (error) {
                logger.error('Error fetching active incidents:', error);
                res.status(500).json({ error: 'Failed to fetch incidents' });
            }
        });

        // Get incident details
        router.get('/incidents/:id', async (req, res) => {
            try {
                const { id } = req.params;

                if (server.activeIncidents.has(id)) {
                    const incident = server.activeIncidents.get(id);
                    res.json({ incident });
                } else {
                    res.status(404).json({ error: 'Incident not found' });
                }

            } catch (error) {
                logger.error('Error fetching incident details:', error);
                res.status(500).json({ error: 'Failed to fetch incident' });
            }
        });

        // Assign responders to incident
        router.post('/incidents/:id/assign', async (req, res) => {
            try {
                const { id } = req.params;
                const { responderIds, priority, eta } = req.body;

                if (!Array.isArray(responderIds) || responderIds.length === 0) {
                    return res.status(400).json({ error: 'Responder IDs are required' });
                }

                const assignment = {
                    incidentId: id,
                    responderIds,
                    priority: priority || 'MEDIUM',
                    eta,
                    assignedAt: new Date().toISOString(),
                    assignedBy: 'system'
                };

                // Notify assigned responders
                responderIds.forEach(responderId => {
                    server.io.to(`responder:${responderId}`).emit('responder:assignment', assignment);
                });

                // Broadcast assignment to command center
                server.io.to('role:admin').emit('incident:assignment', assignment);
                server.io.to(`incident:${id}`).emit('incident:assignment', assignment);

                logger.incident('Responders assigned to incident', { incidentId: id, responderIds });

                res.json({
                    success: true,
                    assignment,
                    message: 'Responders assigned successfully'
                });

            } catch (error) {
                logger.error('Error assigning responders:', error);
                res.status(500).json({ error: 'Failed to assign responders' });
            }
        });

        // Send emergency alert for incident
        router.post('/incidents/:id/alert', async (req, res) => {
            try {
                const { id } = req.params;
                const { message, severity, targetAudience, radius } = req.body;

                if (!message) {
                    return res.status(400).json({ error: 'Alert message is required' });
                }

                const alert = {
                    id: `alert_${Date.now()}`,
                    incidentId: id,
                    message,
                    severity: severity || 'HIGH',
                    targetAudience: targetAudience || 'ALL',
                    radius: radius || 5000,
                    sentAt: new Date().toISOString(),
                    sentBy: 'system'
                };

                // Broadcast based on target audience
                if (targetAudience === 'ALL') {
                    server.io.emit('notification:emergency_alert', alert);
                } else if (targetAudience === 'RESPONDERS') {
                    server.io.to('role:responder').emit('notification:emergency_alert', alert);
                } else if (targetAudience === 'COMMAND_CENTER') {
                    server.io.to('role:admin').emit('notification:emergency_alert', alert);
                    server.io.to('role:operator').emit('notification:emergency_alert', alert);
                }

                logger.emergency('Emergency alert sent for incident', { incidentId: id, alert });

                res.json({
                    success: true,
                    alert,
                    message: 'Emergency alert sent'
                });

            } catch (error) {
                logger.error('Error sending emergency alert:', error);
                res.status(500).json({ error: 'Failed to send alert' });
            }
        });

        // Close incident
        router.post('/incidents/:id/close', async (req, res) => {
            try {
                const { id } = req.params;
                const { resolutionNotes, closedBy } = req.body;

                if (!server.activeIncidents.has(id)) {
                    return res.status(404).json({ error: 'Incident not found' });
                }

                const closure = {
                    incidentId: id,
                    status: 'CLOSED',
                    resolutionNotes,
                    closedBy: closedBy || 'system',
                    closedAt: new Date().toISOString()
                };

                // Broadcast closure
                server.io.to(`incident:${id}`).emit('incident:closed', closure);
                server.io.to('role:admin').emit('incident:closed', closure);

                // Remove from active incidents
                server.activeIncidents.delete(id);

                logger.incident('Incident closed', { incidentId: id, closedBy });

                res.json({
                    success: true,
                    closure,
                    message: 'Incident closed successfully'
                });

            } catch (error) {
                logger.error('Error closing incident:', error);
                res.status(500).json({ error: 'Failed to close incident' });
            }
        });

        return router;
    }
}

module.exports = IncidentRoutes;
