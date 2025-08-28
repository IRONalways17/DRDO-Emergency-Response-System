package gov.drdo.emergency.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing responder assignment to incidents
 */
@Entity
@Table(name = "responder_assignments")
public class ResponderAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", nullable = false)
    private Responder responder;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;
    
    @Column(name = "assigned_by")
    private String assignedBy;
    
    @Column(name = "estimated_arrival_time")
    private LocalDateTime estimatedArrivalTime;
    
    @Column(name = "actual_arrival_time")
    private LocalDateTime actualArrivalTime;
    
    @Column(name = "completion_time")
    private LocalDateTime completionTime;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;
    
    // Enums
    public enum AssignmentStatus {
        ASSIGNED,
        ACKNOWLEDGED,
        EN_ROUTE,
        ARRIVED,
        COMPLETED,
        CANCELLED
    }
    
    public enum Priority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }
    
    // Constructors
    public ResponderAssignment() {}
    
    public ResponderAssignment(Incident incident, Responder responder, Priority priority) {
        this.incident = incident;
        this.responder = responder;
        this.priority = priority;
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
    
    public Responder getResponder() {
        return responder;
    }
    
    public void setResponder(Responder responder) {
        this.responder = responder;
    }
    
    public AssignmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(AssignmentStatus status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public LocalDateTime getEstimatedArrivalTime() {
        return estimatedArrivalTime;
    }
    
    public void setEstimatedArrivalTime(LocalDateTime estimatedArrivalTime) {
        this.estimatedArrivalTime = estimatedArrivalTime;
    }
    
    public LocalDateTime getActualArrivalTime() {
        return actualArrivalTime;
    }
    
    public void setActualArrivalTime(LocalDateTime actualArrivalTime) {
        this.actualArrivalTime = actualArrivalTime;
    }
    
    public LocalDateTime getCompletionTime() {
        return completionTime;
    }
    
    public void setCompletionTime(LocalDateTime completionTime) {
        this.completionTime = completionTime;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
}
