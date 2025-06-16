-- Seed data for SISTRAU database

-- Insert test companies
INSERT INTO companies (id, name, rut, address, phone, email) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Transportes del Sur S.A.', '21234567890', 'Av. Italia 1234, Montevideo', '099123456', 'info@transportesdelsur.uy'),
('550e8400-e29b-41d4-a716-446655440002', 'Logística Oriental Ltda.', '21345678901', 'Ruta 8 Km 25, Canelones', '099234567', 'contacto@logisticaoriental.uy'),
('550e8400-e29b-41d4-a716-446655440003', 'Cargas Rápidas Uruguay', '21456789012', 'Av. Batlle y Ordóñez 5678, Montevideo', '099345678', 'info@cargasrapidas.uy');

-- Insert test users
INSERT INTO users (id, username, email, password_hash, role, company_id, first_name, last_name, document_number, phone) VALUES
-- Admin user (password: admin123)
('550e8400-e29b-41d4-a716-446655440010', 'admin', 'admin@sistrau.gub.uy', '$2a$10$YKpXQ8z9GjT1opsQPQq4M.6sF3zqKHYdQLrZhYBbDJFQKHhz4Qgn6', 'admin', NULL, 'Admin', 'Sistema', '12345678', '099111111'),
-- Transporter users (password: demo123)
('550e8400-e29b-41d4-a716-446655440011', 'transportista', 'transportista@transportesdelsur.uy', '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', 'transporter', '550e8400-e29b-41d4-a716-446655440001', 'Juan', 'Pérez', '30123456', '099222222'),
-- Driver users (password: demo123)
('550e8400-e29b-41d4-a716-446655440012', 'conductor1', 'conductor1@transportesdelsur.uy', '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', 'driver', '550e8400-e29b-41d4-a716-446655440001', 'Carlos', 'González', '40123456', '099333333'),
('550e8400-e29b-41d4-a716-446655440013', 'conductor2', 'conductor2@transportesdelsur.uy', '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', 'driver', '550e8400-e29b-41d4-a716-446655440001', 'María', 'Rodríguez', '40234567', '099444444'),
-- Authority user (password: demo123)
('550e8400-e29b-41d4-a716-446655440014', 'autoridad', 'autoridad@mtop.gub.uy', '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', 'authority', NULL, 'Inspector', 'MTOP', '50123456', '099555555'),
-- Union user (password: demo123)
('550e8400-e29b-41d4-a716-446655440015', 'sindicato', 'sindicato@sutcra.org.uy', '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', 'union', NULL, 'Delegado', 'SUTCRA', '60123456', '099666666');

-- Insert drivers (extend users)
INSERT INTO drivers (id, license_number, license_expiry, medical_cert_expiry) VALUES
('550e8400-e29b-41d4-a716-446655440012', 'LIC-001234', '2026-12-31', '2025-12-31'),
('550e8400-e29b-41d4-a716-446655440013', 'LIC-001235', '2026-06-30', '2025-06-30');

-- Insert test vehicles
INSERT INTO vehicles (id, company_id, plate_number, vin, brand, model, year, type, max_weight_kg, status, iot_device_id, insurance_expiry) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'ABC 1234', 'VIN123456789012345', 'Mercedes-Benz', 'Actros', 2022, 'truck', 40000, 'active', 'IOT-001', '2025-12-31'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'DEF 5678', 'VIN123456789012346', 'Scania', 'R450', 2021, 'truck', 35000, 'active', 'IOT-002', '2025-12-31'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'GHI 9012', 'VIN123456789012347', 'Volvo', 'FH16', 2023, 'truck', 42000, 'maintenance', 'IOT-003', '2025-12-31'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'JKL 3456', 'VIN123456789012348', 'Iveco', 'Stralis', 2020, 'truck', 32000, 'active', 'IOT-004', '2025-12-31'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'MNO 7890', 'VIN123456789012349', 'MAN', 'TGX', 2022, 'truck', 38000, 'active', 'IOT-005', '2025-12-31');

-- Insert IoT devices
INSERT INTO iot_devices (device_id, vehicle_id, manufacturer, model, firmware_version, is_active) VALUES
('IOT-001', '550e8400-e29b-41d4-a716-446655440020', 'TeltonikaMobility', 'FMB140', '1.2.3', true),
('IOT-002', '550e8400-e29b-41d4-a716-446655440021', 'TeltonikaMobility', 'FMB140', '1.2.3', true),
('IOT-003', '550e8400-e29b-41d4-a716-446655440022', 'TeltonikaMobility', 'FMB140', '1.2.3', true),
('IOT-004', '550e8400-e29b-41d4-a716-446655440023', 'Queclink', 'GV300', '2.1.0', true),
('IOT-005', '550e8400-e29b-41d4-a716-446655440024', 'Queclink', 'GV300', '2.1.0', true);

-- Insert test trips
INSERT INTO trips (id, vehicle_id, driver_id, status, origin_address, origin_coords, destination_address, destination_coords, planned_departure, planned_arrival, distance_km) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', 'in_progress', 
 'Terminal de Cargas, Montevideo', ST_SetSRID(ST_MakePoint(-56.2064, -34.8365), 4326),
 'Puerto de Nueva Palmira', ST_SetSRID(ST_MakePoint(-58.4167, -33.8833), 4326),
 NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 280),

('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', 'planned', 
 'Zona Franca, Montevideo', ST_SetSRID(ST_MakePoint(-56.2700, -34.8100), 4326),
 'Rivera', ST_SetSRID(ST_MakePoint(-55.5511, -30.9053), 4326),
 NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 6 hours', 500),

('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440012', 'completed', 
 'Paysandú', ST_SetSRID(ST_MakePoint(-58.0806, -32.3214), 4326),
 'Montevideo', ST_SetSRID(ST_MakePoint(-56.1881, -34.9033), 4326),
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 18 hours', 380);

-- Insert cargo guides
INSERT INTO cargo_guides (id, guide_number, trip_id, shipper_name, shipper_rut, receiver_name, receiver_rut, cargo_description, weight_kg, volume_m3, declared_value) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'GC-2025-LX3M8K4F-A1B2', '550e8400-e29b-41d4-a716-446655440030', 
 'Exportadora Nacional S.A.', '21987654321', 'Importadora del Norte', '21876543210', 
 'Productos alimenticios - Conservas', 25000, 85, 150000),

('550e8400-e29b-41d4-a716-446655440041', 'GC-2025-LX3M8K5G-C3D4', '550e8400-e29b-41d4-a716-446655440031', 
 'Fábrica de Textiles Uruguay', '21765432109', 'Distribuidora Frontera', '21654321098', 
 'Textiles - Ropa manufacturada', 8000, 120, 80000),

('550e8400-e29b-41d4-a716-446655440042', 'GC-2025-LX3M8K6H-E5F6', '550e8400-e29b-41d4-a716-446655440032', 
 'Agroindustrias del Litoral', '21543210987', 'Mercado Central', '21432109876', 
 'Productos agrícolas - Granos', 30000, 95, 200000);

-- Insert some GPS tracking data for the active trip
INSERT INTO gps_tracking (trip_id, vehicle_id, timestamp, location, speed_kmh, heading) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 
 NOW() - INTERVAL '2 hours', ST_SetSRID(ST_MakePoint(-56.2064, -34.8365), 4326), 0, 0),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 
 NOW() - INTERVAL '1 hour 30 minutes', ST_SetSRID(ST_MakePoint(-56.5123, -34.6789), 4326), 85, 270),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 
 NOW() - INTERVAL '1 hour', ST_SetSRID(ST_MakePoint(-56.8234, -34.5678), 4326), 82, 285),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 
 NOW() - INTERVAL '30 minutes', ST_SetSRID(ST_MakePoint(-57.1345, -34.4567), 4326), 88, 290),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 
 NOW(), ST_SetSRID(ST_MakePoint(-57.4456, -34.3456), 4326), 86, 295);

-- Insert some alerts
INSERT INTO alerts (id, type, severity, vehicle_id, trip_id, title, description, location, is_resolved) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'speed_violation', 'medium', '550e8400-e29b-41d4-a716-446655440020', 
 '550e8400-e29b-41d4-a716-446655440030', 'Exceso de Velocidad', 
 'Vehículo excediendo límite de velocidad: 95 km/h en zona de 90 km/h', 
 ST_SetSRID(ST_MakePoint(-57.1345, -34.4567), 4326), false),

('550e8400-e29b-41d4-a716-446655440051', 'maintenance_due', 'low', '550e8400-e29b-41d4-a716-446655440022', 
 NULL, 'Mantenimiento Programado', 
 'Vehículo requiere mantenimiento preventivo según kilometraje', 
 NULL, false),

('550e8400-e29b-41d4-a716-446655440052', 'document_expiry', 'high', '550e8400-e29b-41d4-a716-446655440021', 
 NULL, 'Documentación por Vencer', 
 'Licencia de conductor vence en 30 días', 
 NULL, true);

-- Insert daily statistics (sample data)
INSERT INTO daily_statistics (date, company_id, vehicle_id, total_trips, total_distance_km, total_weight_kg, total_driving_time_minutes, avg_speed_kmh, fuel_consumed_liters) VALUES
(CURRENT_DATE, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 2, 560, 50000, 420, 80, 168),
(CURRENT_DATE, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 1, 380, 30000, 300, 76, 114),
(CURRENT_DATE - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', 3, 720, 75000, 540, 80, 216),
(CURRENT_DATE - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 2, 450, 40000, 360, 75, 135);