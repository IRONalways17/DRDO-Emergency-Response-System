package gov.drdo.emergency.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing incident response actions
 */
@Entity
@Table(name = "incident_responses")
public class IncidentResponse {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    
    @Column(nullable = false)
    private String actionType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "response_team")
    private String responseTeam;
    
    @Column(name = "resources_deployed")
    private String resourcesDeployed;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResponseStatus status = ResponseStatus.INITIATED;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "outcome", columnDefinition = "TEXT")
    private String outcome;
    
    @Column(name = "next_actions", columnDefinition = "TEXT")
    private String nextActions;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    // Enums
    public enum ResponseStatus {
        INITIATED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        FAILED
    }
    
    // Constructors
    public IncidentResponse() {}
    
    public IncidentResponse(Incident incident, String actionType, String description) {
        this.incident = incident;
        this.actionType = actionType;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Incident getIncident() {
        return incident;
    }
    
    public void setIncident(Incident incident) {
        this.incident = incident;
    }
    
    public String getActionType() {
        return actionType;
    }
    
    public void setActionType(String actionType) {
        this.actionType = actionType;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getResponseTeam() {
        return responseTeam;
    }
    
    public void setResponseTeam(String responseTeam) {
        this.responseTeam = responseTeam;
    }
    
    public String getResourcesDeployed() {
        return resourcesDeployed;
    }
    
    public void setResourcesDeployed(String resourcesDeployed) {
        this.resourcesDeployed = resourcesDeployed;
    }
    
    public ResponseStatus getStatus() {
        return status;
    }
    
    public void setStatus(ResponseStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public String getOutcome() {
        return outcome;
    }
    
    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }
    
    public String getNextActions() {
        return nextActions;
    }
    
    public void setNextActions(String nextActions) {
        this.nextActions = nextActions;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
