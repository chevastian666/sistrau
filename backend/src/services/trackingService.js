const { getDb } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { createAlert } = require('./alertService');

// Handle GPS data from IoT devices
const handleGPSData = async (deviceId, data) => {
  try {
    const db = getDb();
    
    // Validate GPS data
    if (!isValidGPSData(data)) {
      logger.warn(`Invalid GPS data from device ${deviceId}`);
      return;
    }

    // Get vehicle and current trip info
    const device = await db('iot_devices')
      .where({ device_id: deviceId })
      .first();

    if (!device || !device.vehicle_id) {
      logger.warn(`No vehicle found for device ${deviceId}`);
      return;
    }

    // Find active trip for this vehicle
    const activeTrip = await db('trips')
      .where({ vehicle_id: device.vehicle_id })
      .whereIn('status', ['in_progress'])
      .orderBy('actual_departure', 'desc')
      .first();

    if (!activeTrip) {
      logger.debug(`No active trip for vehicle ${device.vehicle_id}`);
      // Could create alert for unauthorized movement
      await checkUnauthorizedMovement(device.vehicle_id, data);
      return;
    }

    // Insert GPS tracking record
    const trackingRecord = {
      trip_id: activeTrip.id,
      vehicle_id: device.vehicle_id,
      timestamp: new Date(data.timestamp),
      location: db.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [data.longitude, data.latitude]),
      speed_kmh: data.speed,
      heading: data.heading,
      altitude_m: data.altitude,
      satellites: data.satellites,
      hdop: data.hdop
    };

    await db('gps_tracking').insert(trackingRecord);

    // Update cache with latest position
    await cache.set(`vehicle:${device.vehicle_id}:position`, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      timestamp: data.timestamp
    }, 300); // 5 minutes TTL

    // Check for various conditions
    await Promise.all([
      checkSpeedLimit(device.vehicle_id, activeTrip.id, data),
      checkRouteDeviation(activeTrip, data),
      checkGeofencing(device.vehicle_id, activeTrip.id, data)
    ]);

    // Emit real-time update via WebSocket
    const io = require('../services/socketService').getIO();
    if (io) {
      io.to(`vehicle:${device.vehicle_id}`).emit('gps:update', {
        vehicleId: device.vehicle_id,
        tripId: activeTrip.id,
        position: {
          lat: data.latitude,
          lng: data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp
        }
      });
    }

  } catch (error) {
    logger.error(`Error processing GPS data from device ${deviceId}:`, error);
  }
};

// Validate GPS data structure
const isValidGPSData = (data) => {
  return data &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    data.latitude >= -90 && data.latitude <= 90 &&
    data.longitude >= -180 && data.longitude <= 180 &&
    data.timestamp;
};

// Check for speed limit violations
const checkSpeedLimit = async (vehicleId, tripId, gpsData) => {
  const SPEED_LIMIT = 90; // km/h default, could be dynamic based on road
  const SPEED_TOLERANCE = 10; // km/h tolerance

  if (gpsData.speed > SPEED_LIMIT + SPEED_TOLERANCE) {
    await createAlert({
      type: 'speed_violation',
      severity: gpsData.speed > 120 ? 'high' : 'medium',
      vehicle_id: vehicleId,
      trip_id: tripId,
      title: 'Speed Limit Violation',
      description: `Vehicle exceeding speed limit: ${gpsData.speed.toFixed(1)} km/h`,
      location: { latitude: gpsData.latitude, longitude: gpsData.longitude }
    });
  }
};

// Check for route deviation
const checkRouteDeviation = async (trip, gpsData) => {
  // Simple implementation - check distance from planned route
  // In production, would use more sophisticated route matching
  const db = getDb();
  
  // Get planned route waypoints (if any)
  const plannedRoute = await cache.get(`trip:${trip.id}:route`);
  if (!plannedRoute) return;

  const deviation = calculateDeviationFromRoute(
    { lat: gpsData.latitude, lng: gpsData.longitude },
    plannedRoute
  );

  if (deviation > 5000) { // 5km deviation
    await createAlert({
      type: 'route_deviation',
      severity: 'medium',
      vehicle_id: trip.vehicle_id,
      trip_id: trip.id,
      title: 'Route Deviation Detected',
      description: `Vehicle is ${(deviation/1000).toFixed(1)}km off planned route`,
      location: { latitude: gpsData.latitude, longitude: gpsData.longitude }
    });
  }
};

// Check geofencing rules
const checkGeofencing = async (vehicleId, tripId, gpsData) => {
  // Check if vehicle entered/exited restricted areas
  // This is a simplified version - production would have complex polygon checks
  const db = getDb();
  
  const restrictedAreas = await cache.get('geofences:restricted');
  if (!restrictedAreas) return;

  for (const area of restrictedAreas) {
    if (isPointInPolygon({ lat: gpsData.latitude, lng: gpsData.longitude }, area.polygon)) {
      await createAlert({
        type: 'geofence_violation',
        severity: 'high',
        vehicle_id: vehicleId,
        trip_id: tripId,
        title: 'Restricted Area Entry',
        description: `Vehicle entered restricted area: ${area.name}`,
        location: { latitude: gpsData.latitude, longitude: gpsData.longitude }
      });
    }
  }
};

// Check for unauthorized vehicle movement
const checkUnauthorizedMovement = async (vehicleId, gpsData) => {
  if (gpsData.speed > 5) { // Vehicle moving without active trip
    await createAlert({
      type: 'unauthorized_movement',
      severity: 'high',
      vehicle_id: vehicleId,
      title: 'Unauthorized Vehicle Movement',
      description: `Vehicle moving without active trip at ${gpsData.speed.toFixed(1)} km/h`,
      location: { latitude: gpsData.latitude, longitude: gpsData.longitude }
    });
  }
};

// Get vehicle tracking history
const getTrackingHistory = async (vehicleId, options = {}) => {
  const db = getDb();
  const { startDate, endDate, limit = 1000 } = options;

  let query = db('gps_tracking')
    .where({ vehicle_id: vehicleId })
    .select([
      'timestamp',
      db.raw('ST_X(location::geometry) as longitude'),
      db.raw('ST_Y(location::geometry) as latitude'),
      'speed_kmh',
      'heading',
      'altitude_m'
    ])
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (startDate) {
    query = query.where('timestamp', '>=', startDate);
  }
  if (endDate) {
    query = query.where('timestamp', '<=', endDate);
  }

  return query;
};

// Get real-time vehicle positions for a company
const getCompanyVehiclePositions = async (companyId) => {
  const db = getDb();
  
  // Get all vehicles for company with latest position
  const vehicles = await db.raw(`
    WITH latest_positions AS (
      SELECT DISTINCT ON (g.vehicle_id)
        g.vehicle_id,
        g.timestamp,
        ST_X(g.location::geometry) as longitude,
        ST_Y(g.location::geometry) as latitude,
        g.speed_kmh,
        g.heading
      FROM gps_tracking g
      JOIN vehicles v ON g.vehicle_id = v.id
      WHERE v.company_id = ?
        AND g.timestamp > NOW() - INTERVAL '15 minutes'
      ORDER BY g.vehicle_id, g.timestamp DESC
    )
    SELECT 
      v.id,
      v.plate_number,
      v.status,
      lp.*,
      t.id as current_trip_id,
      t.destination_address
    FROM vehicles v
    LEFT JOIN latest_positions lp ON v.id = lp.vehicle_id
    LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'in_progress'
    WHERE v.company_id = ?
  `, [companyId, companyId]);

  return vehicles.rows;
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Calculate deviation from route (simplified)
const calculateDeviationFromRoute = (point, route) => {
  let minDistance = Infinity;
  
  for (let i = 0; i < route.length - 1; i++) {
    const distance = calculateDistance(point, route[i]);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
};

// Check if point is inside polygon (simplified)
const isPointInPolygon = (point, polygon) => {
  // Ray casting algorithm
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

module.exports = {
  handleGPSData,
  getTrackingHistory,
  getCompanyVehiclePositions,
  calculateDistance
};