package gov.drdo.emergency.service;

import gov.drdo.emergency.entity.Incident;
import gov.drdo.emergency.entity.IncidentUpdate;
import gov.drdo.emergency.repository.IncidentRepository;
import gov.drdo.emergency.repository.IncidentUpdateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class for incident management operations
 */
@Service
@Transactional
public class IncidentService {
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    @Autowired
    private IncidentUpdateRepository incidentUpdateRepository;
    
    @Autowired
    private AIAnalysisService aiAnalysisService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private FileUploadService fileUploadService;
    
    @Autowired
    private WebSocketService webSocketService;
    
    /**
     * Create a new incident
     */
    public Incident createIncident(Incident incident, List<MultipartFile> mediaFiles) {
        // Generate unique incident ID
        incident.setIncidentId(generateIncidentId());
        
        // Set response time target based on severity
        setResponseTimeTarget(incident);
        
        // Upload media files if provided
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            String[] uploadedFiles = fileUploadService.uploadFiles(mediaFiles);
            incident.setMediaFiles(uploadedFiles);
        }
        
        // Save incident
        Incident savedIncident = incidentRepository.save(incident);
        
        // Create initial update
        createIncidentUpdate(savedIncident, "Incident Reported", 
            "New incident has been reported and is awaiting verification.", 
            IncidentUpdate.UpdateType.STATUS_CHANGE, "SYSTEM");
        
        // Perform AI analysis if media files are present
        if (incident.getMediaFiles() != null && incident.getMediaFiles().length > 0) {
            performAIAnalysis(savedIncident);
        }
        
        // Send notifications
        notificationService.sendIncidentAlert(savedIncident);
        
        // Broadcast real-time update
        webSocketService.broadcastIncidentUpdate(savedIncident);
        
        return savedIncident;
    }
    
    /**
     * Update incident status
     */
    public Incident updateIncidentStatus(Long incidentId, Incident.IncidentStatus newStatus, String updatedBy) {
        Optional<Incident> optionalIncident = incidentRepository.findById(incidentId);
        if (optionalIncident.isEmpty()) {
            throw new RuntimeException("Incident not found with ID: " + incidentId);
        }
        
        Incident incident = optionalIncident.get();
        Incident.IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(newStatus);
        
        // Set resolved time if status is RESOLVED
        if (newStatus == Incident.IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
            calculateActualResponseTime(incident);
        }
        
        Incident updatedIncident = incidentRepository.save(incident);
        
        // Create status update
        createIncidentUpdate(updatedIncident, "Status Update", 
            String.format("Status changed from %s to %s", oldStatus, newStatus), 
            IncidentUpdate.UpdateType.STATUS_CHANGE, updatedBy);
        
        // Send notifications
        notificationService.sendStatusUpdateNotification(updatedIncident, oldStatus);
        
        // Broadcast real-time update
        webSocketService.broadcastIncidentUpdate(updatedIncident);
        
        return updatedIncident;
    }
    
    /**
     * Get incident by ID
     */
    @Transactional(readOnly = true)
    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }
    
    /**
     * Get incident by incident ID
     */
    @Transactional(readOnly = true)
    public Optional<Incident> getIncidentByIncidentId(String incidentId) {
        return incidentRepository.findByIncidentId(incidentId);
    }
    
    /**
     * Get all incidents with pagination
     */
    @Transactional(readOnly = true)
    public Page<Incident> getAllIncidents(Pageable pageable) {
        return incidentRepository.findAll(pageable);
    }
    
    /**
     * Get incidents by filters
     */
    @Transactional(readOnly = true)
    public Page<Incident> getIncidentsByFilters(
            Incident.IncidentType type,
            Incident.SeverityLevel severity,
            Incident.IncidentStatus status,
            Boolean isCritical,
            LocalDateTime createdAfter,
            Pageable pageable) {
        return incidentRepository.findIncidentsByFilters(type, severity, status, isCritical, createdAfter, pageable);
    }
    
    /**
     * Get active incidents
     */
    @Transactional(readOnly = true)
    public List<Incident> getActiveIncidents() {
        return incidentRepository.findActiveIncidents();
    }
    
    /**
     * Get critical incidents
     */
    @Transactional(readOnly = true)
    public List<Incident> getCriticalIncidents() {
        return incidentRepository.findByIsCriticalTrue();
    }
    
    /**
     * Get recent incidents for dashboard
     */
    @Transactional(readOnly = true)
    public Page<Incident> getRecentIncidents(Pageable pageable) {
        return incidentRepository.findRecentIncidents(pageable);
    }
    
    /**
     * Verify incident
     */
    public Incident verifyIncident(Long incidentId, boolean isVerified, String verifiedBy) {
        Optional<Incident> optionalIncident = incidentRepository.findById(incidentId);
        if (optionalIncident.isEmpty()) {
            throw new RuntimeException("Incident not found with ID: " + incidentId);
        }
        
        Incident incident = optionalIncident.get();
        incident.setIsVerified(isVerified);
        
        if (isVerified) {
            incident.setStatus(Incident.IncidentStatus.VERIFIED);
        }
        
        Incident updatedIncident = incidentRepository.save(incident);
        
        // Create verification update
        createIncidentUpdate(updatedIncident, "Incident Verification", 
            isVerified ? "Incident has been verified as legitimate" : "Incident verification failed", 
            IncidentUpdate.UpdateType.STATUS_CHANGE, verifiedBy);
        
        // Broadcast real-time update
        webSocketService.broadcastIncidentUpdate(updatedIncident);
        
        return updatedIncident;
    }
    
    /**
     * Escalate incident
     */
    public Incident escalateIncident(Long incidentId, String escalatedBy, String reason) {
        Optional<Incident> optionalIncident = incidentRepository.findById(incidentId);
        if (optionalIncident.isEmpty()) {
            throw new RuntimeException("Incident not found with ID: " + incidentId);
        }
        
        Incident incident = optionalIncident.get();
        incident.setEscalationLevel(incident.getEscalationLevel() + 1);
        
        // Increase severity if not already critical
        if (incident.getSeverity() != Incident.SeverityLevel.CRITICAL) {
            escalateSeverity(incident);
        }
        
        Incident updatedIncident = incidentRepository.save(incident);
        
        // Create escalation update
        createIncidentUpdate(updatedIncident, "Incident Escalated", 
            String.format("Incident escalated to level %d. Reason: %s", 
                updatedIncident.getEscalationLevel(), reason), 
            IncidentUpdate.UpdateType.ESCALATION, escalatedBy);
        
        // Send escalation notifications
        notificationService.sendEscalationNotification(updatedIncident, reason);
        
        // Broadcast real-time update
        webSocketService.broadcastIncidentUpdate(updatedIncident);
        
        return updatedIncident;
    }
    
    /**
     * Get incidents requiring escalation
     */
    @Transactional(readOnly = true)
    public List<Incident> getIncidentsRequiringEscalation() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(30); // 30 minutes threshold
        return incidentRepository.findIncidentsRequiringEscalation(threshold);
    }
    
    /**
     * Get overdue incidents
     */
    @Transactional(readOnly = true)
    public List<Incident> getOverdueIncidents() {
        return incidentRepository.findOverdueIncidents();
    }
    
    /**
     * Get incident statistics
     */
    @Transactional(readOnly = true)
    public IncidentStatistics getIncidentStatistics() {
        IncidentStatistics stats = new IncidentStatistics();
        
        // Basic counts
        stats.setTotalIncidents(incidentRepository.count());
        stats.setActiveIncidents(incidentRepository.findActiveIncidents().size());
        stats.setCriticalIncidents(incidentRepository.countByIsCriticalTrue());
        stats.setIncidentsToday(incidentRepository.countIncidentsCreatedToday());
        
        // Status distribution
        stats.setStatusDistribution(incidentRepository.getIncidentStatsByStatus());
        
        // Type distribution
        stats.setTypeDistribution(incidentRepository.getIncidentStatsByType());
        
        // Average response time
        stats.setAverageResponseTime(incidentRepository.getAverageResponseTime());
        
        return stats;
    }
    
    // Private helper methods
    
    private String generateIncidentId() {
        String prefix = "INC-" + LocalDateTime.now().getYear() + "-";
        String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return prefix + suffix;
    }
    
    private void setResponseTimeTarget(Incident incident) {
        switch (incident.getSeverity()) {
            case CRITICAL:
                incident.setResponseTimeTarget(300); // 5 minutes
                incident.setIsCritical(true);
                break;
            case HIGH:
                incident.setResponseTimeTarget(600); // 10 minutes
                break;
            case MEDIUM:
                incident.setResponseTimeTarget(1800); // 30 minutes
                break;
            case LOW:
                incident.setResponseTimeTarget(3600); // 1 hour
                break;
        }
    }
    
    private void calculateActualResponseTime(Incident incident) {
        if (incident.getCreatedAt() != null && incident.getResolvedAt() != null) {
            long responseTimeSeconds = java.time.Duration.between(
                incident.getCreatedAt(), incident.getResolvedAt()).getSeconds();
            incident.setActualResponseTime((int) responseTimeSeconds);
        }
    }
    
    private void escalateSeverity(Incident incident) {
        switch (incident.getSeverity()) {
            case LOW:
                incident.setSeverity(Incident.SeverityLevel.MEDIUM);
                break;
            case MEDIUM:
                incident.setSeverity(Incident.SeverityLevel.HIGH);
                break;
            case HIGH:
                incident.setSeverity(Incident.SeverityLevel.CRITICAL);
                incident.setIsCritical(true);
                break;
        }
    }
    
    private void createIncidentUpdate(Incident incident, String title, String updateText, 
                                    IncidentUpdate.UpdateType type, String updatedBy) {
        IncidentUpdate update = new IncidentUpdate();
        update.setIncident(incident);
        update.setTitle(title);
        update.setUpdateText(updateText);
        update.setType(type);
        update.setUpdatedBy(updatedBy);
        update.setIsPublic(shouldUpdateBePublic(type));
        
        incidentUpdateRepository.save(update);
    }
    
    private boolean shouldUpdateBePublic(IncidentUpdate.UpdateType type) {
        return type == IncidentUpdate.UpdateType.STATUS_CHANGE || 
               type == IncidentUpdate.UpdateType.RESOLUTION;
    }
    
    private void performAIAnalysis(Incident incident) {
        // Perform AI analysis asynchronously
        aiAnalysisService.analyzeIncidentAsync(incident);
    }
    
    // Inner class for statistics
    public static class IncidentStatistics {
        private long totalIncidents;
        private long activeIncidents;
        private long criticalIncidents;
        private long incidentsToday;
        private List<Object[]> statusDistribution;
        private List<Object[]> typeDistribution;
        private Double averageResponseTime;
        
        // Getters and setters
        public long getTotalIncidents() { return totalIncidents; }
        public void setTotalIncidents(long totalIncidents) { this.totalIncidents = totalIncidents; }
        
        public long getActiveIncidents() { return activeIncidents; }
        public void setActiveIncidents(long activeIncidents) { this.activeIncidents = activeIncidents; }
        
        public long getCriticalIncidents() { return criticalIncidents; }
        public void setCriticalIncidents(long criticalIncidents) { this.criticalIncidents = criticalIncidents; }
        
        public long getIncidentsToday() { return incidentsToday; }
        public void setIncidentsToday(long incidentsToday) { this.incidentsToday = incidentsToday; }
        
        public List<Object[]> getStatusDistribution() { return statusDistribution; }
        public void setStatusDistribution(List<Object[]> statusDistribution) { this.statusDistribution = statusDistribution; }
        
        public List<Object[]> getTypeDistribution() { return typeDistribution; }
        public void setTypeDistribution(List<Object[]> typeDistribution) { this.typeDistribution = typeDistribution; }
        
        public Double getAverageResponseTime() { return averageResponseTime; }
        public void setAverageResponseTime(Double averageResponseTime) { this.averageResponseTime = averageResponseTime; }
    }
}
