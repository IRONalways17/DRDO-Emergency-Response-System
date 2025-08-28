package gov.drdo.emergency.dto;

import gov.drdo.emergency.entity.Incident;

import java.time.LocalDateTime;

/**
 * DTO for incident response data
 */
public class IncidentResponse {
    
    private Long id;
    private String incidentId;
    private String title;
    private String description;
    private Incident.IncidentType type;
    private Incident.SeverityLevel severity;
    private Incident.IncidentStatus status;
    
    private String locationAddress;
    private String locationLandmark;
    private Double latitude;
    private Double longitude;
    
    private String reporterName;
    private String reporterPhone;
    private String reporterEmail;
    
    private Double aiConfidenceScore;
    private String aiAnalysis;
    private String aiRecommendations;
    
    private String[] mediaFiles;
    
    private Integer responseTimeTarget;
    private Integer actualResponseTime;
    
    private Boolean isCritical;
    private Boolean isVerified;
    private Integer escalationLevel;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    
    // Constructors
    public IncidentResponse() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getIncidentId() {
        return incidentId;
    }
    
    public void setIncidentId(String incidentId) {
        this.incidentId = incidentId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Incident.IncidentType getType() {
        return type;
    }
    
    public void setType(Incident.IncidentType type) {
        this.type = type;
    }
    
    public Incident.SeverityLevel getSeverity() {
        return severity;
    }
    
    public void setSeverity(Incident.SeverityLevel severity) {
        this.severity = severity;
    }
    
    public Incident.IncidentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Incident.IncidentStatus status) {
        this.status = status;
    }
    
    public String getLocationAddress() {
        return locationAddress;
    }
    
    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }
    
    public String getLocationLandmark() {
        return locationLandmark;
    }
    
    public void setLocationLandmark(String locationLandmark) {
        this.locationLandmark = locationLandmark;
    }
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public String getReporterName() {
        return reporterName;
    }
    
    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }
    
    public String getReporterPhone() {
        return reporterPhone;
    }
    
    public void setReporterPhone(String reporterPhone) {
        this.reporterPhone = reporterPhone;
    }
    
    public String getReporterEmail() {
        return reporterEmail;
    }
    
    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }
    
    public Double getAiConfidenceScore() {
        return aiConfidenceScore;
    }
    
    public void setAiConfidenceScore(Double aiConfidenceScore) {
        this.aiConfidenceScore = aiConfidenceScore;
    }
    
    public String getAiAnalysis() {
        return aiAnalysis;
    }
    
    public void setAiAnalysis(String aiAnalysis) {
        this.aiAnalysis = aiAnalysis;
    }
    
    public String getAiRecommendations() {
        return aiRecommendations;
    }
    
    public void setAiRecommendations(String aiRecommendations) {
        this.aiRecommendations = aiRecommendations;
    }
    
    public String[] getMediaFiles() {
        return mediaFiles;
    }
    
    public void setMediaFiles(String[] mediaFiles) {
        this.mediaFiles = mediaFiles;
    }
    
    public Integer getResponseTimeTarget() {
        return responseTimeTarget;
    }
    
    public void setResponseTimeTarget(Integer responseTimeTarget) {
        this.responseTimeTarget = responseTimeTarget;
    }
    
    public Integer getActualResponseTime() {
        return actualResponseTime;
    }
    
    public void setActualResponseTime(Integer actualResponseTime) {
        this.actualResponseTime = actualResponseTime;
    }
    
    public Boolean getIsCritical() {
        return isCritical;
    }
    
    public void setIsCritical(Boolean isCritical) {
        this.isCritical = isCritical;
    }
    
    public Boolean getIsVerified() {
        return isVerified;
    }
    
    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
    
    public Integer getEscalationLevel() {
        return escalationLevel;
    }
    
    public void setEscalationLevel(Integer escalationLevel) {
        this.escalationLevel = escalationLevel;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
    
    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
