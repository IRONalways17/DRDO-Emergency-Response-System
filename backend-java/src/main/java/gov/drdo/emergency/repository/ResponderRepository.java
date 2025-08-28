package gov.drdo.emergency.repository;

import gov.drdo.emergency.entity.Responder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Responder entities
 */
@Repository
public interface ResponderRepository extends JpaRepository<Responder, Long> {
    
    /**
     * Find responder by responder ID
     */
    Optional<Responder> findByResponderId(String responderId);
    
    /**
     * Find responders by type
     */
    List<Responder> findByType(Responder.ResponderType type);
    
    /**
     * Find responders by status
     */
    List<Responder> findByStatus(Responder.ResponderStatus status);
    
    /**
     * Find available responders
     */
    List<Responder> findByIsAvailableTrueAndIsOnDutyTrue();
    
    /**
     * Find responders by department
     */
    List<Responder> findByDepartment(String department);
    
    /**
     * Find responders by rank
     */
    List<Responder> findByRank(Responder.ResponderRank rank);
    
    /**
     * Find responders on duty
     */
    List<Responder> findByIsOnDutyTrue();
    
    /**
     * Find responders by email
     */
    Optional<Responder> findByEmail(String email);
    
    /**
     * Find responders by phone
     */
    Optional<Responder> findByPhone(String phone);
    
    /**
     * Find responders by badge number
     */
    Optional<Responder> findByBadgeNumber(String badgeNumber);
    
    /**
     * Find responders within location radius
     */
    @Query(value = "SELECT * FROM responders r WHERE r.is_available = true AND r.is_on_duty = true " +
           "AND ST_DWithin(r.current_location, ST_GeomFromText(:point, 4326), :radiusMeters)", 
           nativeQuery = true)
    List<Responder> findAvailableRespondersNearLocation(@Param("point") String point, @Param("radiusMeters") double radiusMeters);
    
    /**
     * Find responders by type within location radius
     */
    @Query(value = "SELECT * FROM responders r WHERE r.type = :type AND r.is_available = true AND r.is_on_duty = true " +
           "AND ST_DWithin(r.current_location, ST_GeomFromText(:point, 4326), :radiusMeters) " +
           "ORDER BY ST_Distance(r.current_location, ST_GeomFromText(:point, 4326))", 
           nativeQuery = true)
    List<Responder> findRespondersByTypeNearLocation(
        @Param("type") String type, 
        @Param("point") String point, 
        @Param("radiusMeters") double radiusMeters
    );
    
    /**
     * Find responders with specific specialization
     */
    @Query("SELECT r FROM Responder r WHERE :specialization = ANY(r.specializations)")
    List<Responder> findBySpecialization(@Param("specialization") String specialization);
    
    /**
     * Find responders with specific equipment
     */
    @Query("SELECT r FROM Responder r WHERE :equipment = ANY(r.equipment)")
    List<Responder> findByEquipment(@Param("equipment") String equipment);
    
    /**
     * Find responders whose location was updated recently
     */
    List<Responder> findByLastLocationUpdateAfter(LocalDateTime timestamp);
    
    /**
     * Find responders with outdated location
     */
    @Query("SELECT r FROM Responder r WHERE r.lastLocationUpdate IS NULL OR r.lastLocationUpdate < :threshold")
    List<Responder> findRespondersWithOutdatedLocation(@Param("threshold") LocalDateTime threshold);
    
    /**
     * Count responders by status
     */
    long countByStatus(Responder.ResponderStatus status);
    
    /**
     * Count available responders
     */
    long countByIsAvailableTrueAndIsOnDutyTrue();
    
    /**
     * Count responders by type
     */
    long countByType(Responder.ResponderType type);
    
    /**
     * Find responders by vehicle type
     */
    List<Responder> findByVehicleType(Responder.VehicleType vehicleType);
    
    /**
     * Get responder statistics by type
     */
    @Query("SELECT r.type, COUNT(r) FROM Responder r GROUP BY r.type")
    List<Object[]> getResponderStatsByType();
    
    /**
     * Get responder statistics by status
     */
    @Query("SELECT r.status, COUNT(r) FROM Responder r GROUP BY r.status")
    List<Object[]> getResponderStatsByStatus();
    
    /**
     * Find senior responders (high rank)
     */
    @Query("SELECT r FROM Responder r WHERE r.rank IN ('COLONEL', 'BRIGADIER', 'MAJOR_GENERAL', 'LIEUTENANT_GENERAL', 'GENERAL', 'DIG', 'IG', 'DGP')")
    List<Responder> findSeniorResponders();
    
    /**
     * Find responders currently assigned to incidents
     */
    @Query("SELECT DISTINCT r FROM Responder r JOIN r.assignments a WHERE a.status IN ('ASSIGNED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ARRIVED')")
    List<Responder> findCurrentlyAssignedResponders();
}
