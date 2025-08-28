package gov.drdo.emergency.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing incident updates and logs
 */
@Entity
@Table(name = "incident_updates")
public class IncidentUpdate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "update_text", columnDefinition = "TEXT")
    private String updateText;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UpdateType type;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
    @Column(name = "attachments", columnDefinition = "TEXT[]")
    private String[] attachments;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    // Enums
    public enum UpdateType {
        STATUS_CHANGE,
        RESPONDER_UPDATE,
        FIELD_REPORT,
        ESCALATION,
        RESOLUTION,
        COMMUNICATION,
        MEDIA_UPDATE,
        SYSTEM_UPDATE
    }
    
    // Constructors
    public IncidentUpdate() {}
    
    public IncidentUpdate(Incident incident, String title, String updateText, UpdateType type) {
        this.incident = incident;
        this.title = title;
        this.updateText = updateText;
        this.type = type;
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
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getUpdateText() {
        return updateText;
    }
    
    public void setUpdateText(String updateText) {
        this.updateText = updateText;
    }
    
    public UpdateType getType() {
        return type;
    }
    
    public void setType(UpdateType type) {
        this.type = type;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public Boolean getIsPublic() {
        return isPublic;
    }
    
    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }
    
    public String[] getAttachments() {
        return attachments;
    }
    
    public void setAttachments(String[] attachments) {
        this.attachments = attachments;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
