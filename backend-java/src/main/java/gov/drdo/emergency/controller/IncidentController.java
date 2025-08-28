package gov.drdo.emergency.controller;

import gov.drdo.emergency.dto.IncidentCreateRequest;
import gov.drdo.emergency.dto.IncidentResponse;
import gov.drdo.emergency.dto.IncidentStatusUpdateRequest;
import gov.drdo.emergency.entity.Incident;
import gov.drdo.emergency.service.IncidentService;
import gov.drdo.emergency.service.AIAnalysisService;
import gov.drdo.emergency.service.ResponderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for incident management operations
 */
@RestController
@RequestMapping("/api/incidents")
@Tag(name = "Incident Management", description = "APIs for managing emergency incidents")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class IncidentController {
    
    @Autowired
    private IncidentService incidentService;
    
    @Autowired
    private ResponderService responderService;
    
    @Autowired
    private AIAnalysisService aiAnalysisService;
    
    /**
     * Create a new incident
     */
    @PostMapping
    @Operation(summary = "Create new incident", description = "Create a new emergency incident with optional media files")
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestPart("incident") IncidentCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        
        try {
            // Convert DTO to entity
            Incident incident = convertToEntity(request);
            
            // Create incident
            Incident createdIncident = incidentService.createIncident(incident, files);
            
            // Convert to response DTO
            IncidentResponse response = convertToResponse(createdIncident);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get incident by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get incident by ID")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable Long id) {
        Optional<Incident> incident = incidentService.getIncidentById(id);
        
        if (incident.isPresent()) {
            IncidentResponse response = convertToResponse(incident.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get incident by incident ID
     */
    @GetMapping("/incident-id/{incidentId}")
    @Operation(summary = "Get incident by incident ID")
    public ResponseEntity<IncidentResponse> getIncidentByIncidentId(@PathVariable String incidentId) {
        Optional<Incident> incident = incidentService.getIncidentByIncidentId(incidentId);
        
        if (incident.isPresent()) {
            IncidentResponse response = convertToResponse(incident.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get all incidents with filters and pagination
     */
    @GetMapping
    @Operation(summary = "Get incidents with filters", description = "Get incidents with optional filters and pagination")
    public ResponseEntity<Page<IncidentResponse>> getIncidents(
            @Parameter(description = "Incident type filter") @RequestParam(required = false) Incident.IncidentType type,
            @Parameter(description = "Severity level filter") @RequestParam(required = false) Incident.SeverityLevel severity,
            @Parameter(description = "Status filter") @RequestParam(required = false) Incident.IncidentStatus status,
            @Parameter(description = "Critical incidents only") @RequestParam(required = false) Boolean isCritical,
            @Parameter(description = "Created after date") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdAfter,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Incident> incidents = incidentService.getIncidentsByFilters(
            type, severity, status, isCritical, createdAfter, pageable);
        
        Page<IncidentResponse> response = incidents.map(this::convertToResponse);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get active incidents
     */
    @GetMapping("/active")
    @Operation(summary = "Get active incidents")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getActiveIncidents() {
        List<Incident> incidents = incidentService.getActiveIncidents();
        List<IncidentResponse> response = incidents.stream()
            .map(this::convertToResponse)
            .toList();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get critical incidents
     */
    @GetMapping("/critical")
    @Operation(summary = "Get critical incidents")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getCriticalIncidents() {
        List<Incident> incidents = incidentService.getCriticalIncidents();
        List<IncidentResponse> response = incidents.stream()
            .map(this::convertToResponse)
            .toList();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update incident status
     */
    @PutMapping("/{id}/status")
    @Operation(summary = "Update incident status")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<IncidentResponse> updateIncidentStatus(
            @PathVariable Long id,
            @Valid @RequestBody IncidentStatusUpdateRequest request) {
        
        try {
            Incident updatedIncident = incidentService.updateIncidentStatus(
                id, request.getStatus(), request.getUpdatedBy());
            
            IncidentResponse response = convertToResponse(updatedIncident);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Verify incident
     */
    @PutMapping("/{id}/verify")
    @Operation(summary = "Verify incident")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<IncidentResponse> verifyIncident(
            @PathVariable Long id,
            @RequestParam boolean isVerified,
            @RequestParam String verifiedBy) {
        
        try {
            Incident updatedIncident = incidentService.verifyIncident(id, isVerified, verifiedBy);
            IncidentResponse response = convertToResponse(updatedIncident);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Escalate incident
     */
    @PutMapping("/{id}/escalate")
    @Operation(summary = "Escalate incident")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<IncidentResponse> escalateIncident(
            @PathVariable Long id,
            @RequestParam String escalatedBy,
            @RequestParam String reason) {
        
        try {
            Incident updatedIncident = incidentService.escalateIncident(id, escalatedBy, reason);
            IncidentResponse response = convertToResponse(updatedIncident);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Dispatch responders to incident
     */
    @PostMapping("/{id}/dispatch")
    @Operation(summary = "Dispatch responders to incident")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<String> dispatchResponders(
            @PathVariable Long id,
            @RequestBody List<Long> responderIds,
            @RequestParam String dispatchedBy) {
        
        try {
            responderService.dispatchToIncident(id, responderIds, dispatchedBy);
            return ResponseEntity.ok("Responders dispatched successfully");
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Get incident statistics
     */
    @GetMapping("/statistics")
    @Operation(summary = "Get incident statistics")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<IncidentService.IncidentStatistics> getIncidentStatistics() {
        IncidentService.IncidentStatistics stats = incidentService.getIncidentStatistics();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get incidents requiring escalation
     */
    @GetMapping("/requiring-escalation")
    @Operation(summary = "Get incidents requiring escalation")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getIncidentsRequiringEscalation() {
        List<Incident> incidents = incidentService.getIncidentsRequiringEscalation();
        List<IncidentResponse> response = incidents.stream()
            .map(this::convertToResponse)
            .toList();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get overdue incidents
     */
    @GetMapping("/overdue")
    @Operation(summary = "Get overdue incidents")
    @PreAuthorize("hasRole('OPERATOR') or hasRole('ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getOverdueIncidents() {
        List<Incident> incidents = incidentService.getOverdueIncidents();
        List<IncidentResponse> response = incidents.stream()
            .map(this::convertToResponse)
            .toList();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Analyze image for threats
     */
    @PostMapping("/analyze-image")
    @Operation(summary = "Analyze image for bomb threats")
    public ResponseEntity<AIAnalysisService.AIAnalysisResult> analyzeImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam(required = false) String description) {
        
        try {
            // Convert image to base64
            String imageBase64 = java.util.Base64.getEncoder().encodeToString(image.getBytes());
            
            // Perform AI analysis
            AIAnalysisService.AIAnalysisResult result = aiAnalysisService.analyzeImage(imageBase64, description);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Analyze text description for threats
     */
    @PostMapping("/analyze-text")
    @Operation(summary = "Analyze text for threat indicators")
    public ResponseEntity<AIAnalysisService.AIAnalysisResult> analyzeText(@RequestBody String description) {
        try {
            AIAnalysisService.AIAnalysisResult result = aiAnalysisService.analyzeTextDescription(description);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Private helper methods for conversion
    
    private Incident convertToEntity(IncidentCreateRequest request) {
        Incident incident = new Incident();
        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setType(request.getType());
        incident.setSeverity(request.getSeverity());
        incident.setLocationAddress(request.getLocationAddress());
        incident.setLocationLandmark(request.getLocationLandmark());
        incident.setReporterName(request.getReporterName());
        incident.setReporterPhone(request.getReporterPhone());
        incident.setReporterEmail(request.getReporterEmail());
        
        // Set location point from coordinates
        if (request.getLatitude() != null && request.getLongitude() != null) {
            // Create Point geometry (implementation depends on your geometry library)
            // incident.setLocationPoint(createPoint(request.getLatitude(), request.getLongitude()));
        }
        
        return incident;
    }
    
    private IncidentResponse convertToResponse(Incident incident) {
        IncidentResponse response = new IncidentResponse();
        response.setId(incident.getId());
        response.setIncidentId(incident.getIncidentId());
        response.setTitle(incident.getTitle());
        response.setDescription(incident.getDescription());
        response.setType(incident.getType());
        response.setSeverity(incident.getSeverity());
        response.setStatus(incident.getStatus());
        response.setLocationAddress(incident.getLocationAddress());
        response.setLocationLandmark(incident.getLocationLandmark());
        response.setReporterName(incident.getReporterName());
        response.setReporterPhone(incident.getReporterPhone());
        response.setReporterEmail(incident.getReporterEmail());
        response.setAiConfidenceScore(incident.getAiConfidenceScore());
        response.setAiAnalysis(incident.getAiAnalysis());
        response.setAiRecommendations(incident.getAiRecommendations());
        response.setMediaFiles(incident.getMediaFiles());
        response.setResponseTimeTarget(incident.getResponseTimeTarget());
        response.setActualResponseTime(incident.getActualResponseTime());
        response.setIsCritical(incident.getIsCritical());
        response.setIsVerified(incident.getIsVerified());
        response.setEscalationLevel(incident.getEscalationLevel());
        response.setCreatedAt(incident.getCreatedAt());
        response.setUpdatedAt(incident.getUpdatedAt());
        response.setResolvedAt(incident.getResolvedAt());
        
        // Extract coordinates from location point
        if (incident.getLocationPoint() != null) {
            response.setLatitude(incident.getLocationPoint().getY());
            response.setLongitude(incident.getLocationPoint().getX());
        }
        
        return response;
    }
}
