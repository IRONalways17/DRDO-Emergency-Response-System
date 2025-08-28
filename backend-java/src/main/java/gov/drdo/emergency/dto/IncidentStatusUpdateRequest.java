package gov.drdo.emergency.dto;

import gov.drdo.emergency.entity.Incident;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for updating incident status
 */
public class IncidentStatusUpdateRequest {
    
    @NotNull(message = "Status is required")
    private Incident.IncidentStatus status;
    
    private String updatedBy;
    private String notes;
    
    // Constructors
    public IncidentStatusUpdateRequest() {}
    
    public IncidentStatusUpdateRequest(Incident.IncidentStatus status, String updatedBy) {
        this.status = status;
        this.updatedBy = updatedBy;
    }
    
    // Getters and Setters
    public Incident.IncidentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Incident.IncidentStatus status) {
        this.status = status;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
}
