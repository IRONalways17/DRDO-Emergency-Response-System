package gov.drdo.emergency.dto;

import gov.drdo.emergency.entity.Incident;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for creating new incidents
 */
public class IncidentCreateRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Incident type is required")
    private Incident.IncidentType type;
    
    @NotNull(message = "Severity level is required")
    private Incident.SeverityLevel severity;
    
    private String locationAddress;
    private String locationLandmark;
    private Double latitude;
    private Double longitude;
    
    @NotBlank(message = "Reporter name is required")
    private String reporterName;
    
    @NotBlank(message = "Reporter phone is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
    private String reporterPhone;
    
    @Email(message = "Invalid email format")
    private String reporterEmail;
    
    // Constructors
    public IncidentCreateRequest() {}
    
    // Getters and Setters
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
}
