package gov.drdo.emergency.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing an emergency incident
 */
@Entity
@Table(name = "incidents")
public class Incident {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String incidentId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeverityLevel severity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status = IncidentStatus.REPORTED;
    
    @Column(name = "location_point", columnDefinition = "geometry(Point,4326)")
    private Point locationPoint;
    
    @Column(name = "location_address")
    private String locationAddress;
    
    @Column(name = "location_landmark")
    private String locationLandmark;
    
    @Column(name = "reporter_name")
    private String reporterName;
    
    @Column(name = "reporter_phone")
    private String reporterPhone;
    
    @Column(name = "reporter_email")
    private String reporterEmail;
    
    @Column(name = "ai_confidence_score")
    private Double aiConfidenceScore;
    
    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;
    
    @Column(name = "ai_recommendations", columnDefinition = "TEXT")
    private String aiRecommendations;
    
    @Column(name = "media_files", columnDefinition = "TEXT[]")
    private String[] mediaFiles;
    
    @Column(name = "response_time_target")
    private Integer responseTimeTarget; // in seconds
    
    @Column(name = "actual_response_time")
    private Integer actualResponseTime; // in seconds
    
    @Column(name = "is_critical")
    private Boolean isCritical = false;
    
    @Column(name = "is_verified")
    private Boolean isVerified = false;
    
    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    // Relationships
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IncidentResponse> responses;
    
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IncidentUpdate> updates;
    
    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ResponderAssignment> assignments;
    
    // Enums
    public enum IncidentType {
        BOMB_THREAT,
        SUSPICIOUS_OBJECT,
        CHEMICAL_HAZARD,
        BIOLOGICAL_HAZARD,
        FIRE_EMERGENCY,
        MEDICAL_EMERGENCY,
        SECURITY_BREACH,
        TERRORIST_ACTIVITY,
        NATURAL_DISASTER,
        OTHER
    }
    
    public enum SeverityLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
    
    public enum IncidentStatus {
        REPORTED,
        VERIFIED,
        ASSIGNED,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        FALSE_ALARM
    }
    
    // Constructors
    public Incident() {}
    
    public Incident(String title, String description, IncidentType type, SeverityLevel severity) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.severity = severity;
    }
    
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
    
    public IncidentType getType() {
        return type;
    }
    
    public void setType(IncidentType type) {
        this.type = type;
    }
    
    public SeverityLevel getSeverity() {
        return severity;
    }
    
    public void setSeverity(SeverityLevel severity) {
        this.severity = severity;
    }
    
    public IncidentStatus getStatus() {
        return status;
    }
    
    public void setStatus(IncidentStatus status) {
        this.status = status;
    }
    
    public Point getLocationPoint() {
        return locationPoint;
    }
    
    public void setLocationPoint(Point locationPoint) {
        this.locationPoint = locationPoint;
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
    
    public List<IncidentResponse> getResponses() {
        return responses;
    }
    
    public void setResponses(List<IncidentResponse> responses) {
        this.responses = responses;
    }
    
    public List<IncidentUpdate> getUpdates() {
        return updates;
    }
    
    public void setUpdates(List<IncidentUpdate> updates) {
        this.updates = updates;
    }
    
    public List<ResponderAssignment> getAssignments() {
        return assignments;
    }
    
    public void setAssignments(List<ResponderAssignment> assignments) {
        this.assignments = assignments;
    }
}
