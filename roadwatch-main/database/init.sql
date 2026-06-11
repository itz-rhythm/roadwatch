-- Enable UUID generation and PostGIS extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. wards Table
CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(100) DEFAULT 'India',
    executive_engineer_name VARCHAR(255),
    executive_engineer_email VARCHAR(255),
    executive_engineer_phone VARCHAR(15),
    zone_engineer_email VARCHAR(255),
    city_engineer_email VARCHAR(255),
    state_engineer_email VARCHAR(255),
    ward_population INTEGER,
    total_road_length_km NUMERIC,
    geom geometry(Polygon, 4326)
);

-- 2. users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) CHECK (role IN ('citizen', 'volunteer', 'ward_authority', 'city_engineer', 'admin')),
    ward_id INTEGER REFERENCES wards(id),
    reputation_points INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    profile_photo_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ
);

-- 3. contractors Table
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_no VARCHAR(100) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(15),
    registered_state VARCHAR(255),
    total_roads_built INTEGER DEFAULT 0,
    total_roads_failed INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    failure_frequency_score NUMERIC(5,2),
    corruption_risk_flag BOOLEAN DEFAULT false,
    blacklisted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. roads Table
CREATE TABLE roads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    road_type VARCHAR(50) CHECK (road_type IN ('NH', 'SH', 'MDR', 'ODR', 'VR', 'Urban')),
    ward_id INTEGER REFERENCES wards(id),
    contractor_id UUID REFERENCES contractors(id),
    last_repair_date DATE,
    repair_cost NUMERIC(15,2),
    amount_sanctioned NUMERIC(15,2),
    amount_spent NUMERIC(15,2),
    budget_source VARCHAR(255),
    tender_id VARCHAR(100),
    warranty_until DATE,
    responsible_department VARCHAR(255),
    condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 10),
    geom geometry(LineString, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    category VARCHAR(50) CHECK (category IN ('pothole', 'waterlogging', 'broken_divider', 'missing_manhole', 'road_crack', 'illegal_digging', 'faded_markings', 'black_spot', 'streetlight_failure')),
    title VARCHAR(255),
    description TEXT,
    severity VARCHAR(50) CHECK (severity IN ('minor', 'moderate', 'dangerous', 'critical')),
    ai_severity VARCHAR(50),
    final_severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'assigned', 'in_progress', 'completed', 'rejected')),
    location geometry(Point, 4326),
    address TEXT,
    ward_id INTEGER REFERENCES wards(id),
    road_id UUID REFERENCES roads(id),
    media_urls JSONB DEFAULT '[]'::jsonb,
    upvote_count INTEGER DEFAULT 0,
    parent_complaint_id UUID REFERENCES complaints(id),
    assigned_to UUID REFERENCES users(id),
    contractor_id UUID REFERENCES contractors(id),
    sla_deadline TIMESTAMPTZ,
    is_emergency BOOLEAN DEFAULT false,
    voice_transcript TEXT,
    resolved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. complaint_timeline Table
CREATE TABLE complaint_timeline (
    id SERIAL PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id),
    status VARCHAR(50),
    note TEXT,
    photo_url TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- 7. upvotes Table
CREATE TABLE upvotes (
    user_id UUID REFERENCES users(id),
    complaint_id UUID REFERENCES complaints(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, complaint_id)
);

-- 8. black_spots Table
CREATE TABLE black_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location geometry(Point, 4326),
    ward_id INTEGER REFERENCES wards(id),
    risk_type VARCHAR(50) CHECK (risk_type IN ('accident_prone', 'poor_lighting', 'blind_turn', 'waterlogging', 'unmarked_speedbreaker', 'unsafe_at_night')),
    report_count INTEGER DEFAULT 1,
    time_based_risk JSONB,
    confirmed_by_authority BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. contractor_ratings Table
CREATE TABLE contractor_ratings (
    id SERIAL PRIMARY KEY,
    contractor_id UUID REFERENCES contractors(id),
    user_id UUID REFERENCES users(id),
    road_id UUID REFERENCES roads(id),
    road_quality INTEGER CHECK (road_quality >= 1 AND road_quality <= 5),
    repair_durability INTEGER CHECK (repair_durability >= 1 AND repair_durability <= 5),
    site_cleanup INTEGER CHECK (site_cleanup >= 1 AND site_cleanup <= 5),
    response_time INTEGER CHECK (response_time >= 1 AND response_time <= 5),
    overall_score NUMERIC(3,2),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. repair_logs Table
CREATE TABLE repair_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id UUID REFERENCES roads(id),
    contractor_id UUID REFERENCES contractors(id),
    work_description TEXT,
    materials_used TEXT,
    cost_claimed NUMERIC(15,2),
    cost_verified NUMERIC(15,2),
    start_date DATE,
    end_date DATE,
    before_photo_url TEXT,
    after_photo_url TEXT,
    verified_by UUID REFERENCES users(id),
    blockchain_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. escalations Table
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id),
    escalated_from_email VARCHAR(255),
    escalated_to_email VARCHAR(255),
    escalation_level INTEGER CHECK (escalation_level >= 1 AND escalation_level <= 4),
    reason TEXT,
    email_sent_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- 12. rewards Table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    points_earned INTEGER,
    reason VARCHAR(255),
    badge_awarded VARCHAR(255),
    complaint_id UUID REFERENCES complaints(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. weather_risk_zones Table
CREATE TABLE weather_risk_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location geometry(Point, 4326),
    ward_id INTEGER REFERENCES wards(id),
    risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    last_rainfall_mm NUMERIC,
    predicted_failure_probability NUMERIC(3,2),
    flagged_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Indexes

-- Spatial Indexes (GIST)
CREATE INDEX idx_wards_geom ON wards USING GIST (geom);
CREATE INDEX idx_roads_geom ON roads USING GIST (geom);
CREATE INDEX idx_complaints_location ON complaints USING GIST (location);
CREATE INDEX idx_black_spots_location ON black_spots USING GIST (location);
CREATE INDEX idx_weather_risk_zones_location ON weather_risk_zones USING GIST (location);

-- B-Tree Indexes for Performance
CREATE INDEX idx_complaints_dashboard ON complaints (ward_id, status, created_at);
CREATE INDEX idx_complaints_user ON complaints (user_id);
CREATE INDEX idx_contractor_ratings_contractor ON contractor_ratings (contractor_id);
