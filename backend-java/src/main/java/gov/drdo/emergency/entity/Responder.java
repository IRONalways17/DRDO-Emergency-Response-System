package gov.drdo.emergency.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing an emergency responder
 */
@Entity
@Table(name = "responders")
public class Responder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String responderId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String phone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResponderType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResponderRank rank;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResponderStatus status = ResponderStatus.AVAILABLE;
    
    @Column(name = "current_location", columnDefinition = "geometry(Point,4326)")
    private Point currentLocation;
    
    @Column(name = "base_location", columnDefinition = "geometry(Point,4326)")
    private Point baseLocation;
    
    @Column(name = "badge_number")
    private String badgeNumber;
    
    @Column(name = "department")
    private String department;
    
    @Column(name = "specializations", columnDefinition = "TEXT[]")
    private String[] specializations;
    
    @Column(name = "equipment", columnDefinition = "TEXT[]")
    private String[] equipment;
    
    @Column(name = "vehicle_number")
    private String vehicleNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;
    
    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;
    
    @Column(name = "is_on_duty")
    private Boolean isOnDuty = true;
    
    @Column(name = "is_available")
    private Boolean isAvailable = true;
    
    @Column(name = "shift_start")
    private LocalDateTime shiftStart;
    
    @Column(name = "shift_end")
    private LocalDateTime shiftEnd;
    
    @Column(name = "last_location_update")
    private LocalDateTime lastLocationUpdate;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "responder", fetch = FetchType.LAZY)
    private List<ResponderAssignment> assignments;
    
    // Enums
    public enum ResponderType {
        BOMB_DISPOSAL,
        POLICE,
        FIRE_FIGHTER,
        PARAMEDIC,
        HAZMAT_SPECIALIST,
        SECURITY_OFFICER,
        FIELD_COMMANDER,
        INTELLIGENCE_OFFICER,
        EVACUATION_COORDINATOR,
        K9_UNIT
    }
    
    public enum ResponderRank {
        CONSTABLE,
        HEAD_CONSTABLE,
        SUB_INSPECTOR,
        INSPECTOR,
        DEPUTY_SP,
        SP,
        DIG,
        IG,
        DGP,
        CAPTAIN,
        MAJOR,
        COLONEL,
        BRIGADIER,
        MAJOR_GENERAL,
        LIEUTENANT_GENERAL,
        GENERAL
    }
    
    public enum ResponderStatus {
        AVAILABLE,
        ASSIGNED,
        EN_ROUTE,
        ON_SCENE,
        BUSY,
        OFF_DUTY,
        UNAVAILABLE
    }
    
    public enum VehicleType {
        PATROL_CAR,
        AMBULANCE,
        FIRE_TRUCK,
        BOMB_DISPOSAL_UNIT,
        HELICOPTER,
        MOTORCYCLE,
        MOBILE_COMMAND_CENTER,
        HAZMAT_VEHICLE,
        K9_UNIT_VEHICLE
    }
    
    // Constructors
    public Responder() {}
    
    public Responder(String name, String email, String phone, ResponderType type, ResponderRank rank) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.type = type;
        this.rank = rank;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getResponderId() {
        return responderId;
    }
    
    public void setResponderId(String responderId) {
        this.responderId = responderId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public ResponderType getType() {
        return type;
    }
    
    public void setType(ResponderType type) {
        this.type = type;
    }
    
    public ResponderRank getRank() {
        return rank;
    }
    
    public void setRank(ResponderRank rank) {
        this.rank = rank;
    }
    
    public ResponderStatus getStatus() {
        return status;
    }
    
    public void setStatus(ResponderStatus status) {
        this.status = status;
    }
    
    public Point getCurrentLocation() {
        return currentLocation;
    }
    
    public void setCurrentLocation(Point currentLocation) {
        this.currentLocation = currentLocation;
    }
    
    public Point getBaseLocation() {
        return baseLocation;
    }
    
    public void setBaseLocation(Point baseLocation) {
        this.baseLocation = baseLocation;
    }
    
    public String getBadgeNumber() {
        return badgeNumber;
    }
    
    public void setBadgeNumber(String badgeNumber) {
        this.badgeNumber = badgeNumber;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public String[] getSpecializations() {
        return specializations;
    }
    
    public void setSpecializations(String[] specializations) {
        this.specializations = specializations;
    }
    
    public String[] getEquipment() {
        return equipment;
    }
    
    public void setEquipment(String[] equipment) {
        this.equipment = equipment;
    }
    
    public String getVehicleNumber() {
        return vehicleNumber;
    }
    
    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }
    
    public VehicleType getVehicleType() {
        return vehicleType;
    }
    
    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }
    
    public Integer getYearsOfExperience() {
        return yearsOfExperience;
    }
    
    public void setYearsOfExperience(Integer yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }
    
    public Boolean getIsOnDuty() {
        return isOnDuty;
    }
    
    public void setIsOnDuty(Boolean isOnDuty) {
        this.isOnDuty = isOnDuty;
    }
    
    public Boolean getIsAvailable() {
        return isAvailable;
    }
    
    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
    
    public LocalDateTime getShiftStart() {
        return shiftStart;
    }
    
    public void setShiftStart(LocalDateTime shiftStart) {
        this.shiftStart = shiftStart;
    }
    
    public LocalDateTime getShiftEnd() {
        return shiftEnd;
    }
    
    public void setShiftEnd(LocalDateTime shiftEnd) {
        this.shiftEnd = shiftEnd;
    }
    
    public LocalDateTime getLastLocationUpdate() {
        return lastLocationUpdate;
    }
    
    public void setLastLocationUpdate(LocalDateTime lastLocationUpdate) {
        this.lastLocationUpdate = lastLocationUpdate;
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
    
    public List<ResponderAssignment> getAssignments() {
        return assignments;
    }
    
    public void setAssignments(List<ResponderAssignment> assignments) {
        this.assignments = assignments;
    }
}
