-- DRDO Emergency Response System Database Schema
-- PostgreSQL with PostGIS extension for spatial data

-- Enable PostGIS extension for spatial data support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create database (run separately as superuser)
-- CREATE DATABASE drdo_emergency;

-- Set timezone
SET timezone = 'Asia/Kolkata';

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS responder_assignments CASCADE;
DROP TABLE IF EXISTS incident_responses CASCADE;
DROP TABLE IF EXISTS incident_updates CASCADE;
DROP TABLE IF EXISTS responders CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create incidents table
CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,
    incident_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'BOMB_THREAT', 'SUSPICIOUS_OBJECT', 'CHEMICAL_HAZARD', 
        'BIOLOGICAL_HAZARD', 'FIRE_EMERGENCY', 'MEDICAL_EMERGENCY',
        'SECURITY_BREACH', 'TERRORIST_ACTIVITY', 'NATURAL_DISASTER', 'OTHER'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED' CHECK (status IN (
        'REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'FALSE_ALARM'
    )),
    
    -- Location information
    location_point GEOMETRY(POINT, 4326),
    location_address TEXT,
    location_landmark VARCHAR(500),
    
    -- Reporter information
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    reporter_email VARCHAR(255),
    
    -- AI Analysis
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_analysis TEXT,
    ai_recommendations TEXT,
    
    -- Media files
    media_files TEXT[],
    
    -- Response metrics
    response_time_target INTEGER, -- in seconds
    actual_response_time INTEGER, -- in seconds
    
    -- Flags
    is_critical BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    escalation_level INTEGER DEFAULT 0 CHECK (escalation_level >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create spatial index on location
CREATE INDEX idx_incidents_location ON incidents USING GIST (location_point);

-- Create indexes for better performance
CREATE INDEX idx_incidents_status ON incidents (status);
CREATE INDEX idx_incidents_type ON incidents (type);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incidents_created_at ON incidents (created_at);
CREATE INDEX idx_incidents_critical ON incidents (is_critical);
CREATE INDEX idx_incidents_verified ON incidents (is_verified);

-- Create responders table
CREATE TABLE responders (
    id BIGSERIAL PRIMARY KEY,
    responder_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'BOMB_DISPOSAL', 'POLICE', 'FIRE_FIGHTER', 'PARAMEDIC', 
        'HAZMAT_SPECIALIST', 'SECURITY_OFFICER', 'FIELD_COMMANDER',
        'INTELLIGENCE_OFFICER', 'EVACUATION_COORDINATOR', 'K9_UNIT'
    )),
    
    rank VARCHAR(50) NOT NULL CHECK (rank IN (
        'CONSTABLE', 'HEAD_CONSTABLE', 'SUB_INSPECTOR', 'INSPECTOR',
        'DEPUTY_SP', 'SP', 'DIG', 'IG', 'DGP',
        'CAPTAIN', 'MAJOR', 'COLONEL', 'BRIGADIER', 
        'MAJOR_GENERAL', 'LIEUTENANT_GENERAL', 'GENERAL'
    )),
    
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN (
        'AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFF_DUTY', 'UNAVAILABLE'
    )),
    
    -- Location information
    current_location GEOMETRY(POINT, 4326),
    base_location GEOMETRY(POINT, 4326),
    
    -- Professional details
    badge_number VARCHAR(50),
    department VARCHAR(255),
    specializations TEXT[],
    equipment TEXT[],
    
    -- Vehicle information
    vehicle_number VARCHAR(50),
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN (
        'PATROL_CAR', 'AMBULANCE', 'FIRE_TRUCK', 'BOMB_DISPOSAL_UNIT',
        'HELICOPTER', 'MOTORCYCLE', 'MOBILE_COMMAND_CENTER', 
        'HAZMAT_VEHICLE', 'K9_UNIT_VEHICLE'
    )),
    
    -- Professional info
    years_of_experience INTEGER,
    
    -- Status flags
    is_on_duty BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Shift information
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes for responder locations
CREATE INDEX idx_responders_current_location ON responders USING GIST (current_location);
CREATE INDEX idx_responders_base_location ON responders USING GIST (base_location);

-- Create indexes for responders
CREATE INDEX idx_responders_type ON responders (type);
CREATE INDEX idx_responders_status ON responders (status);
CREATE INDEX idx_responders_available ON responders (is_available, is_on_duty);
CREATE INDEX idx_responders_department ON responders (department);

-- Create responder assignments table
CREATE TABLE responder_assignments (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    responder_id BIGINT NOT NULL REFERENCES responders(id) ON DELETE CASCADE,
    
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN (
        'ASSIGNED', 'ACKNOWLEDGED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED'
    )),
    
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    assigned_by VARCHAR(255),
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(incident_id, responder_id)
);

-- Create indexes for assignments
CREATE INDEX idx_assignments_incident ON responder_assignments (incident_id);
CREATE INDEX idx_assignments_responder ON responder_assignments (responder_id);
CREATE INDEX idx_assignments_status ON responder_assignments (status);

-- Create incident updates table
CREATE TABLE incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    title VARCHAR(500) NOT NULL,
    update_text TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'STATUS_CHANGE', 'RESPONDER_UPDATE', 'FIELD_REPORT', 'ESCALATION',
        'RESOLUTION', 'COMMUNICATION', 'MEDIA_UPDATE', 'SYSTEM_UPDATE'
    )),
    
    updated_by VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    attachments TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for updates
CREATE INDEX idx_updates_incident ON incident_updates (incident_id);
CREATE INDEX idx_updates_type ON incident_updates (type);
CREATE INDEX idx_updates_created_at ON incident_updates (created_at);
CREATE INDEX idx_updates_public ON incident_updates (is_public);

-- Create incident responses table
CREATE TABLE incident_responses (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    action_type VARCHAR(255) NOT NULL,
    description TEXT,
    response_team VARCHAR(255),
    resources_deployed TEXT,
    
    status VARCHAR(20) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'
    )),
    
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    outcome TEXT,
    next_actions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for responses
CREATE INDEX idx_responses_incident ON incident_responses (incident_id);
CREATE INDEX idx_responses_status ON incident_responses (status);

-- Create users table for authentication
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR', 'RESPONDER', 'VIEWER')),
    department VARCHAR(255),
    badge_number VARCHAR(50),
    
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (is_active);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responders_updated_at BEFORE UPDATE ON responders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate incident ID
CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.incident_id IS NULL THEN
        NEW.incident_id = 'INC-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || 
                         LPAD(nextval('incidents_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger for incident ID generation
CREATE TRIGGER generate_incident_id_trigger BEFORE INSERT ON incidents
    FOR EACH ROW EXECUTE FUNCTION generate_incident_id();

-- Create function to generate responder ID
CREATE OR REPLACE FUNCTION generate_responder_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.responder_id IS NULL THEN
        NEW.responder_id = 'RESP-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || 
                          LPAD(nextval('responders_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger for responder ID generation
CREATE TRIGGER generate_responder_id_trigger BEFORE INSERT ON responders
    FOR EACH ROW EXECUTE FUNCTION generate_responder_id();

-- Grant permissions (adjust as needed for your environment)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW incident_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    type,
    severity,
    status,
    COUNT(*) as count,
    AVG(actual_response_time) as avg_response_time,
    COUNT(CASE WHEN is_critical THEN 1 END) as critical_count
FROM incidents 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), type, severity, status;

-- Create index on materialized view
CREATE INDEX idx_analytics_date ON incident_analytics (date);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_incident_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW incident_analytics;
END;
$$ language 'plpgsql';

-- Comments for documentation
COMMENT ON TABLE incidents IS 'Main table storing emergency incident reports';
COMMENT ON TABLE responders IS 'Emergency response personnel and their details';
COMMENT ON TABLE responder_assignments IS 'Assignment of responders to specific incidents';
COMMENT ON TABLE incident_updates IS 'Timeline updates and logs for incidents';
COMMENT ON TABLE incident_responses IS 'Response actions taken for incidents';
COMMENT ON TABLE users IS 'System users for authentication and authorization';

-- Performance optimization hints
-- Consider partitioning incidents table by date for large datasets
-- Consider archiving old resolved incidents to separate tables
-- Regularly VACUUM and ANALYZE tables for optimal performance
