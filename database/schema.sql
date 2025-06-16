-- SISTRAU Database Schema
-- PostgreSQL 15+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic data
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'transporter', 'driver', 'authority', 'union', 'viewer');
CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'maintenance', 'suspended');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE document_type AS ENUM ('cargo_guide', 'license', 'insurance', 'permit', 'other');

-- Companies/Transporters table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    document_number VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table (extends users)
CREATE TABLE drivers (
    id UUID PRIMARY KEY REFERENCES users(id),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    biometric_data JSONB, -- Encrypted biometric data
    medical_cert_expiry DATE,
    total_hours_driven INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50) UNIQUE,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    type VARCHAR(50),
    max_weight_kg INTEGER,
    status vehicle_status DEFAULT 'active',
    iot_device_id VARCHAR(100) UNIQUE,
    last_maintenance DATE,
    insurance_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IoT Devices table
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    last_seen TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    driver_id UUID REFERENCES drivers(id) NOT NULL,
    status trip_status DEFAULT 'planned',
    origin_address TEXT NOT NULL,
    origin_coords GEOGRAPHY(POINT, 4326),
    destination_address TEXT NOT NULL,
    destination_coords GEOGRAPHY(POINT, 4326),
    planned_departure TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP,
    planned_arrival TIMESTAMP NOT NULL,
    actual_arrival TIMESTAMP,
    distance_km DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cargo Guides table
CREATE TABLE cargo_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_number VARCHAR(50) UNIQUE NOT NULL,
    trip_id UUID REFERENCES trips(id),
    shipper_name VARCHAR(255) NOT NULL,
    shipper_rut VARCHAR(20),
    receiver_name VARCHAR(255) NOT NULL,
    receiver_rut VARCHAR(20),
    cargo_description TEXT,
    weight_kg DECIMAL(10, 2),
    volume_m3 DECIMAL(10, 2),
    declared_value DECIMAL(15, 2),
    blockchain_hash VARCHAR(255), -- Hash stored in blockchain
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS Tracking table (partitioned by date for performance)
CREATE TABLE gps_tracking (
    id UUID DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    altitude_m DECIMAL(8, 2),
    satellites INTEGER,
    hdop DECIMAL(4, 2), -- Horizontal dilution of precision
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for GPS tracking
CREATE TABLE gps_tracking_2025_01 PARTITION OF gps_tracking 
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Vehicle Telemetry table
CREATE TABLE vehicle_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    engine_rpm INTEGER,
    fuel_level_percent DECIMAL(5, 2),
    coolant_temp_c DECIMAL(5, 2),
    oil_pressure_kpa DECIMAL(8, 2),
    battery_voltage DECIMAL(4, 2),
    odometer_km DECIMAL(10, 2),
    weight_per_axle JSONB, -- Array of axle weights
    diagnostic_codes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver Sessions table
CREATE TABLE driver_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    biometric_verified BOOLEAN DEFAULT false,
    driving_time_minutes INTEGER,
    rest_time_minutes INTEGER,
    distance_km DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    severity alert_severity NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    trip_id UUID REFERENCES trips(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type document_type NOT NULL,
    reference_id UUID NOT NULL, -- Can reference vehicle, driver, company, etc.
    reference_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(255), -- SHA-256 hash for integrity
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain Transactions table
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number BIGINT,
    contract_address VARCHAR(255),
    method_name VARCHAR(100),
    reference_type VARCHAR(50),
    reference_id UUID,
    gas_used BIGINT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Statistics table (pre-aggregated for performance)
CREATE TABLE daily_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    company_id UUID REFERENCES companies(id),
    vehicle_id UUID REFERENCES vehicles(id),
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10, 2) DEFAULT 0,
    total_weight_kg DECIMAL(12, 2) DEFAULT 0,
    total_driving_time_minutes INTEGER DEFAULT 0,
    avg_speed_kmh DECIMAL(5, 2),
    fuel_consumed_liters DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, company_id, vehicle_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_gps_tracking_trip ON gps_tracking(trip_id);
CREATE INDEX idx_gps_tracking_timestamp ON gps_tracking(timestamp);
CREATE INDEX idx_gps_tracking_location ON gps_tracking USING GIST(location);
CREATE INDEX idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW active_trips AS
SELECT 
    t.*,
    v.plate_number,
    d.first_name || ' ' || d.last_name as driver_name,
    c.name as company_name
FROM trips t
JOIN vehicles v ON t.vehicle_id = v.id
JOIN drivers dr ON t.driver_id = dr.id
JOIN users d ON dr.id = d.id
JOIN companies c ON v.company_id = c.id
WHERE t.status IN ('planned', 'in_progress');

CREATE VIEW vehicle_current_status AS
SELECT 
    v.*,
    ds.driver_id as current_driver_id,
    t.id as current_trip_id,
    COALESCE(vt.fuel_level_percent, 0) as fuel_level,
    COALESCE(vt.odometer_km, 0) as odometer
FROM vehicles v
LEFT JOIN driver_sessions ds ON v.id = ds.vehicle_id AND ds.end_time IS NULL
LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'in_progress'
LEFT JOIN LATERAL (
    SELECT fuel_level_percent, odometer_km 
    FROM vehicle_telemetry 
    WHERE vehicle_id = v.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) vt ON true;

-- Row Level Security policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Grant permissions (example)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO sistrau_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sistrau_app;