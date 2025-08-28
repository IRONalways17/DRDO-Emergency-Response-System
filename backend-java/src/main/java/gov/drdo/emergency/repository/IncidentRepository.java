package gov.drdo.emergency.repository;

import gov.drdo.emergency.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Incident entities
 */
@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    
    /**
     * Find incident by incident ID
     */
    Optional<Incident> findByIncidentId(String incidentId);
    
    /**
     * Find incidents by status
     */
    List<Incident> findByStatus(Incident.IncidentStatus status);
    
    /**
     * Find incidents by type
     */
    List<Incident> findByType(Incident.IncidentType type);
    
    /**
     * Find incidents by severity level
     */
    List<Incident> findBySeverity(Incident.SeverityLevel severity);
    
    /**
     * Find critical incidents
     */
    List<Incident> findByIsCriticalTrue();
    
    /**
     * Find unverified incidents
     */
    List<Incident> findByIsVerifiedFalse();
    
    /**
     * Find active incidents (not resolved or closed)
     */
    @Query("SELECT i FROM Incident i WHERE i.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Incident> findActiveIncidents();
    
    /**
     * Find incidents within a time range
     */
    List<Incident> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find incidents by reporter phone number
     */
    List<Incident> findByReporterPhone(String phone);
    
    /**
     * Find incidents by location within radius
     */
    @Query(value = "SELECT * FROM incidents i WHERE ST_DWithin(i.location_point, ST_GeomFromText(:point, 4326), :radiusMeters)", 
           nativeQuery = true)
    List<Incident> findByLocationWithinRadius(@Param("point") String point, @Param("radiusMeters") double radiusMeters);
    
    /**
     * Find incidents requiring escalation
     */
    @Query("SELECT i FROM Incident i WHERE i.createdAt < :timeThreshold AND i.status IN ('REPORTED', 'VERIFIED') AND i.escalationLevel < 3")
    List<Incident> findIncidentsRequiringEscalation(@Param("timeThreshold") LocalDateTime timeThreshold);
    
    /**
     * Find incidents with high AI confidence score
     */
    @Query("SELECT i FROM Incident i WHERE i.aiConfidenceScore >= :threshold")
    List<Incident> findHighConfidenceIncidents(@Param("threshold") double threshold);
    
    /**
     * Get incident statistics by status
     */
    @Query("SELECT i.status, COUNT(i) FROM Incident i GROUP BY i.status")
    List<Object[]> getIncidentStatsByStatus();
    
    /**
     * Get incident statistics by type
     */
    @Query("SELECT i.type, COUNT(i) FROM Incident i GROUP BY i.type")
    List<Object[]> getIncidentStatsByType();
    
    /**
     * Find recent incidents for dashboard
     */
    @Query("SELECT i FROM Incident i ORDER BY i.createdAt DESC")
    Page<Incident> findRecentIncidents(Pageable pageable);
    
    /**
     * Find incidents by multiple filters
     */
    @Query("SELECT i FROM Incident i WHERE " +
           "(:type IS NULL OR i.type = :type) AND " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:isCritical IS NULL OR i.isCritical = :isCritical) AND " +
           "(:createdAfter IS NULL OR i.createdAt >= :createdAfter)")
    Page<Incident> findIncidentsByFilters(
        @Param("type") Incident.IncidentType type,
        @Param("severity") Incident.SeverityLevel severity,
        @Param("status") Incident.IncidentStatus status,
        @Param("isCritical") Boolean isCritical,
        @Param("createdAfter") LocalDateTime createdAfter,
        Pageable pageable
    );
    
    /**
     * Count incidents by status
     */
    long countByStatus(Incident.IncidentStatus status);
    
    /**
     * Count critical incidents
     */
    long countByIsCriticalTrue();
    
    /**
     * Count incidents created today
     */
    @Query("SELECT COUNT(i) FROM Incident i WHERE DATE(i.createdAt) = CURRENT_DATE")
    long countIncidentsCreatedToday();
    
    /**
     * Average response time for resolved incidents
     */
    @Query("SELECT AVG(i.actualResponseTime) FROM Incident i WHERE i.actualResponseTime IS NOT NULL")
    Double getAverageResponseTime();
    
    /**
     * Find overdue incidents
     */
    @Query("SELECT i FROM Incident i WHERE i.responseTimeTarget IS NOT NULL " +
           "AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - i.createdAt)) > i.responseTimeTarget " +
           "AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Incident> findOverdueIncidents();
}
