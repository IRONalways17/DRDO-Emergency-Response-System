-- DRDO Emergency Response System - Seed Data
-- Sample data for development and testing

-- Insert sample users
INSERT INTO users (username, email, password_hash, full_name, role, department, badge_number, is_active, is_verified) VALUES
('admin', 'admin@drdo.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqjWwNNvvq6k4kBBbQhKxFe', 'System Administrator', 'ADMIN', 'IT Department', 'ADMIN001', true, true),
('operator1', 'operator1@drdo.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqjWwNNvvq6k4kBBbQhKxFe', 'Emergency Operator 1', 'OPERATOR', 'Emergency Operations', 'OP001', true, true),
('operator2', 'operator2@drdo.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqjWwNNvvq6k4kBBbQhKxFe', 'Emergency Operator 2', 'OPERATOR', 'Emergency Operations', 'OP002', true, true),
('commander1', 'commander1@drdo.gov.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqjWwNNvvq6k4kBBbQhKxFe', 'Field Commander', 'OPERATOR', 'Field Operations', 'CMD001', true, true);

-- Insert sample responders
INSERT INTO responders (name, email, phone, type, rank, department, badge_number, 
                       specializations, equipment, vehicle_number, vehicle_type, 
                       years_of_experience, current_location, base_location) VALUES

-- Bomb Disposal Experts
('Major Rajesh Kumar', 'rajesh.kumar@drdo.gov.in', '+919876543210', 'BOMB_DISPOSAL', 'MAJOR', 
 'Bomb Disposal Squad', 'BDS001', 
 ARRAY['Explosive Ordnance Disposal', 'Chemical Detection', 'Nuclear Materials'], 
 ARRAY['EOD Suit', 'X-Ray Machine', 'Bomb Detection Robot'], 
 'BDS-001', 'BOMB_DISPOSAL_UNIT', 15,
 ST_GeomFromText('POINT(77.2090 28.6139)', 4326), -- Delhi
 ST_GeomFromText('POINT(77.2090 28.6139)', 4326)),

('Captain Priya Sharma', 'priya.sharma@drdo.gov.in', '+919876543211', 'BOMB_DISPOSAL', 'CAPTAIN', 
 'Bomb Disposal Squad', 'BDS002', 
 ARRAY['IED Detection', 'Chemical Analysis', 'Blast Investigation'], 
 ARRAY['Portable X-Ray', 'Chemical Kit', 'Blast Suit'], 
 'BDS-002', 'BOMB_DISPOSAL_UNIT', 12,
 ST_GeomFromText('POINT(77.2100 28.6150)', 4326),
 ST_GeomFromText('POINT(77.2090 28.6139)', 4326)),

-- Police Officers
('Inspector Vikram Singh', 'vikram.singh@delhi.police.gov.in', '+919876543212', 'POLICE', 'INSPECTOR', 
 'Delhi Police Special Cell', 'DPS001', 
 ARRAY['Counter Terrorism', 'Crowd Control', 'Intelligence'], 
 ARRAY['Assault Rifle', 'Body Armor', 'Communication Radio'], 
 'DL-01-PA-1234', 'PATROL_CAR', 18,
 ST_GeomFromText('POINT(77.2070 28.6120)', 4326),
 ST_GeomFromText('POINT(77.2070 28.6120)', 4326)),

('Sub Inspector Anita Reddy', 'anita.reddy@delhi.police.gov.in', '+919876543213', 'POLICE', 'SUB_INSPECTOR', 
 'Delhi Police', 'DPS002', 
 ARRAY['Traffic Management', 'First Aid', 'Public Safety'], 
 ARRAY['Service Pistol', 'First Aid Kit', 'Traffic Equipment'], 
 'DL-01-PB-5678', 'PATROL_CAR', 10,
 ST_GeomFromText('POINT(77.2080 28.6130)', 4326),
 ST_GeomFromText('POINT(77.2070 28.6120)', 4326)),

-- Fire Fighters
('Fire Officer Suresh Pillai', 'suresh.pillai@delhifire.gov.in', '+919876543214', 'FIRE_FIGHTER', 'CAPTAIN', 
 'Delhi Fire Service', 'DFS001', 
 ARRAY['Fire Suppression', 'Rescue Operations', 'Hazmat Response'], 
 ARRAY['Fire Truck', 'Breathing Apparatus', 'Rescue Tools'], 
 'DL-01-FT-9012', 'FIRE_TRUCK', 20,
 ST_GeomFromText('POINT(77.2060 28.6110)', 4326),
 ST_GeomFromText('POINT(77.2060 28.6110)', 4326)),

-- Paramedics
('Dr. Meera Joshi', 'meera.joshi@aiims.edu', '+919876543215', 'PARAMEDIC', 'MAJOR', 
 'AIIMS Emergency', 'AIIMS001', 
 ARRAY['Emergency Medicine', 'Trauma Care', 'Chemical Exposure'], 
 ARRAY['Ambulance', 'Defibrillator', 'Medical Kit'], 
 'DL-01-AMB-3456', 'AMBULANCE', 14,
 ST_GeomFromText('POINT(77.2050 28.6100)', 4326),
 ST_GeomFromText('POINT(77.2050 28.6100)', 4326)),

-- HAZMAT Specialists
('Colonel Amit Verma', 'amit.verma@drdo.gov.in', '+919876543216', 'HAZMAT_SPECIALIST', 'COLONEL', 
 'DRDO CBRN Division', 'CBRN001', 
 ARRAY['Chemical Detection', 'Biological Threats', 'Decontamination'], 
 ARRAY['HAZMAT Suit', 'Chemical Detector', 'Decon Equipment'], 
 'DL-01-HAZ-7890', 'HAZMAT_VEHICLE', 22,
 ST_GeomFromText('POINT(77.2040 28.6090)', 4326),
 ST_GeomFromText('POINT(77.2040 28.6090)', 4326)),

-- Field Commanders
('Brigadier Ravi Nair', 'ravi.nair@drdo.gov.in', '+919876543217', 'FIELD_COMMANDER', 'BRIGADIER', 
 'DRDO Command Center', 'CMD001', 
 ARRAY['Incident Command', 'Strategic Planning', 'Multi-Agency Coordination'], 
 ARRAY['Mobile Command Center', 'Satellite Communication', 'Tactical Radio'], 
 'DL-01-CMD-1122', 'MOBILE_COMMAND_CENTER', 25,
 ST_GeomFromText('POINT(77.2030 28.6080)', 4326),
 ST_GeomFromText('POINT(77.2030 28.6080)', 4326)),

-- K9 Units
('Head Constable Raj Kumar', 'raj.kumar@crpf.gov.in', '+919876543218', 'K9_UNIT', 'HEAD_CONSTABLE', 
 'CRPF K9 Unit', 'K9001', 
 ARRAY['Explosive Detection', 'Drug Detection', 'Search and Rescue'], 
 ARRAY['K9 Partner', 'Detection Equipment', 'Handler Gear'], 
 'DL-01-K9-3344', 'K9_UNIT_VEHICLE', 8,
 ST_GeomFromText('POINT(77.2020 28.6070)', 4326),
 ST_GeomFromText('POINT(77.2020 28.6070)', 4326)),

-- Intelligence Officers
('Deputy SP Intelligence', 'intel.officer@delhi.police.gov.in', '+919876543219', 'INTELLIGENCE_OFFICER', 'DEPUTY_SP', 
 'Special Branch', 'SB001', 
 ARRAY['Intelligence Gathering', 'Threat Assessment', 'Surveillance'], 
 ARRAY['Surveillance Equipment', 'Communication Devices', 'Recording Equipment'], 
 'DL-01-INT-5566', 'PATROL_CAR', 16,
 ST_GeomFromText('POINT(77.2010 28.6060)', 4326),
 ST_GeomFromText('POINT(77.2010 28.6060)', 4326));

-- Insert sample incidents for testing
INSERT INTO incidents (title, description, type, severity, location_point, location_address, 
                      location_landmark, reporter_name, reporter_phone, reporter_email,
                      ai_confidence_score, is_critical, status) VALUES

('Suspicious Package at Metro Station', 
 'Unattended bag found at Rajiv Chowk Metro Station. Bag appears to have wires visible.',
 'SUSPICIOUS_OBJECT', 'HIGH', 
 ST_GeomFromText('POINT(77.2190 28.6328)', 4326),
 'Rajiv Chowk Metro Station, Connaught Place, New Delhi, 110001',
 'Near Gate No. 3, Rajiv Chowk Metro Station',
 'Ramesh Kumar', '+919876543220', 'ramesh.kumar@email.com',
 0.85, true, 'VERIFIED'),

('Bomb Threat Call at Red Fort', 
 'Anonymous caller reported bomb threat at Red Fort. Caller mentioned timer device.',
 'BOMB_THREAT', 'CRITICAL', 
 ST_GeomFromText('POINT(77.2410 28.6562)', 4326),
 'Red Fort, Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi, 110006',
 'Main entrance area of Red Fort',
 'Security Guard', '+919876543221', 'security@redfort.gov.in',
 0.95, true, 'ASSIGNED'),

('Chemical Spill at Industrial Area', 
 'Unknown chemical spill reported at industrial complex. Workers experiencing breathing difficulties.',
 'CHEMICAL_HAZARD', 'MEDIUM', 
 ST_GeomFromText('POINT(77.1025 28.7041)', 4326),
 'Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015',
 'Near IFFCO Chowk Metro Station',
 'Factory Supervisor', '+919876543222', 'supervisor@factory.com',
 0.70, false, 'IN_PROGRESS'),

('Fire Emergency at Shopping Mall', 
 'Fire reported on 3rd floor of Select City Walk mall. Smoke visible, people evacuating.',
 'FIRE_EMERGENCY', 'HIGH', 
 ST_GeomFromText('POINT(77.2265 28.5245)', 4326),
 'Select CITYWALK, A-3, District Centre, Saket, New Delhi, 110017',
 'Near PVR Cinemas, 3rd Floor',
 'Mall Security', '+919876543223', 'security@selectcitywalk.com',
 0.60, true, 'RESOLVED'),

('Medical Emergency at Airport', 
 'Passenger collapsed at IGI Airport Terminal 3. Suspected heart attack.',
 'MEDICAL_EMERGENCY', 'HIGH', 
 ST_GeomFromText('POINT(77.1031 28.5665)', 4326),
 'Indira Gandhi International Airport, Terminal 3, New Delhi, 110037',
 'Departure Gate 15, Terminal 3',
 'Airport Staff', '+919876543224', 'emergency@dial.aero',
 0.40, false, 'CLOSED');

-- Insert sample incident updates
INSERT INTO incident_updates (incident_id, title, update_text, type, updated_by, is_public) VALUES
(1, 'Bomb Squad Dispatched', 'Bomb disposal team dispatched to location. Area being evacuated.', 'RESPONDER_UPDATE', 'operator1', true),
(1, 'Area Secured', 'Perimeter secured. Bomb squad examining suspicious package.', 'FIELD_REPORT', 'Major Rajesh Kumar', true),
(2, 'Red Fort Evacuation Started', 'Visitor evacuation initiated. All tours suspended.', 'STATUS_CHANGE', 'Brigadier Ravi Nair', true),
(3, 'HAZMAT Team Arrived', 'Chemical response team on scene. Containment in progress.', 'RESPONDER_UPDATE', 'Colonel Amit Verma', false),
(4, 'Fire Suppressed', 'Fire successfully extinguished. No casualties reported.', 'RESOLUTION', 'Fire Officer Suresh Pillai', true),
(5, 'Patient Stabilized', 'Patient stable and transported to hospital.', 'RESOLUTION', 'Dr. Meera Joshi', true);

-- Insert sample responder assignments
INSERT INTO responder_assignments (incident_id, responder_id, status, priority, assigned_by, 
                                 estimated_arrival_time, actual_arrival_time) VALUES
(1, 1, 'ARRIVED', 'URGENT', 'operator1', 
    CURRENT_TIMESTAMP + INTERVAL '10 minutes', 
    CURRENT_TIMESTAMP + INTERVAL '8 minutes'),
(1, 3, 'EN_ROUTE', 'HIGH', 'operator1', 
    CURRENT_TIMESTAMP + INTERVAL '15 minutes', NULL),
(2, 2, 'ASSIGNED', 'URGENT', 'operator2', 
    CURRENT_TIMESTAMP + INTERVAL '12 minutes', NULL),
(2, 8, 'ACKNOWLEDGED', 'URGENT', 'operator2', 
    CURRENT_TIMESTAMP + INTERVAL '20 minutes', NULL),
(3, 7, 'COMPLETED', 'HIGH', 'commander1', 
    CURRENT_TIMESTAMP - INTERVAL '30 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
(4, 5, 'COMPLETED', 'HIGH', 'operator1', 
    CURRENT_TIMESTAMP - INTERVAL '45 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '40 minutes'),
(5, 6, 'COMPLETED', 'HIGH', 'operator2', 
    CURRENT_TIMESTAMP - INTERVAL '60 minutes', 
    CURRENT_TIMESTAMP - INTERVAL '55 minutes');

-- Insert sample incident responses
INSERT INTO incident_responses (incident_id, action_type, description, response_team, 
                              resources_deployed, status, start_time, end_time, outcome) VALUES
(1, 'Area Evacuation', 'Evacuated 500m radius around suspicious package', 'Police & Security', 
    '4 Police units, 2 Security teams', 'COMPLETED', 
    CURRENT_TIMESTAMP - INTERVAL '2 hours', 
    CURRENT_TIMESTAMP - INTERVAL '90 minutes', 
    'Area successfully evacuated, no injuries'),
    
(2, 'Threat Assessment', 'Analyzing bomb threat credibility and response requirements', 'Intelligence Team', 
    '2 Intelligence officers, 1 Threat analyst', 'IN_PROGRESS', 
    CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL, NULL),
    
(3, 'Chemical Containment', 'Containing chemical spill and treating affected personnel', 'HAZMAT Team', 
    '1 HAZMAT vehicle, 3 Specialists, 1 Medical team', 'COMPLETED', 
    CURRENT_TIMESTAMP - INTERVAL '3 hours', 
    CURRENT_TIMESTAMP - INTERVAL '1 hour', 
    'Spill contained, 2 workers treated and released'),
    
(4, 'Fire Suppression', 'Extinguishing fire and ensuring building safety', 'Fire Department', 
    '3 Fire trucks, 12 Firefighters, 1 Rescue team', 'COMPLETED', 
    CURRENT_TIMESTAMP - INTERVAL '4 hours', 
    CURRENT_TIMESTAMP - INTERVAL '3 hours', 
    'Fire extinguished, building cleared as safe'),
    
(5, 'Medical Treatment', 'Providing emergency medical care to patient', 'Medical Team', 
    '1 Ambulance, 2 Paramedics, 1 Doctor', 'COMPLETED', 
    CURRENT_TIMESTAMP - INTERVAL '5 hours', 
    CURRENT_TIMESTAMP - INTERVAL '4 hours', 
    'Patient stabilized and transported to hospital');

-- Update some incidents with resolved status and actual response times
UPDATE incidents SET 
    status = 'RESOLVED',
    resolved_at = CURRENT_TIMESTAMP - INTERVAL '1 hour',
    actual_response_time = 2400  -- 40 minutes
WHERE id = 3;

UPDATE incidents SET 
    status = 'CLOSED',
    resolved_at = CURRENT_TIMESTAMP - INTERVAL '3 hours',
    actual_response_time = 1800  -- 30 minutes
WHERE id = 4;

UPDATE incidents SET 
    status = 'CLOSED',
    resolved_at = CURRENT_TIMESTAMP - INTERVAL '4 hours',
    actual_response_time = 900   -- 15 minutes
WHERE id = 5;

-- Refresh the materialized view
SELECT refresh_incident_analytics();

-- Create some sample historical data for analytics (last 30 days)
INSERT INTO incidents (title, description, type, severity, location_point, location_address, 
                      reporter_name, reporter_phone, status, created_at, resolved_at, actual_response_time) 
SELECT 
    'Historical Incident ' || generate_series,
    'Sample historical incident for analytics',
    (ARRAY['BOMB_THREAT', 'SUSPICIOUS_OBJECT', 'FIRE_EMERGENCY', 'MEDICAL_EMERGENCY'])[floor(random() * 4 + 1)],
    (ARRAY['LOW', 'MEDIUM', 'HIGH'])[floor(random() * 3 + 1)],
    ST_GeomFromText('POINT(' || (77.0 + random() * 0.5) || ' ' || (28.4 + random() * 0.4) || ')', 4326),
    'Sample Address, New Delhi',
    'Sample Reporter',
    '+919876543999',
    'RESOLVED',
    CURRENT_TIMESTAMP - (random() * INTERVAL '30 days'),
    CURRENT_TIMESTAMP - (random() * INTERVAL '29 days'),
    floor(random() * 3600 + 300)::integer  -- Random response time between 5 minutes to 1 hour
FROM generate_series(1, 50);

-- Refresh analytics view again with new data
SELECT refresh_incident_analytics();

-- Display summary of inserted data
SELECT 'Sample Data Summary' as info;
SELECT 'Users: ' || count(*) as count FROM users;
SELECT 'Responders: ' || count(*) as count FROM responders;
SELECT 'Incidents: ' || count(*) as count FROM incidents;
SELECT 'Assignments: ' || count(*) as count FROM responder_assignments;
SELECT 'Updates: ' || count(*) as count FROM incident_updates;
SELECT 'Responses: ' || count(*) as count FROM incident_responses;

-- Show incident status distribution
SELECT status, count(*) as count 
FROM incidents 
GROUP BY status 
ORDER BY status;

-- Show responder availability
SELECT 
    type,
    count(*) as total,
    count(CASE WHEN is_available AND is_on_duty THEN 1 END) as available
FROM responders 
GROUP BY type 
ORDER BY type;
