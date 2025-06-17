const { emitVehiclePosition, emitVehicleAlert } = require('./socketService');
const logger = require('../utils/logger');

class GPSSimulator {
  constructor() {
    this.vehicles = new Map();
    this.intervalId = null;
    this.isRunning = false;
  }

  // Add vehicle to simulation
  addVehicle(vehicleData) {
    this.vehicles.set(vehicleData.vehicleId, {
      ...vehicleData,
      lastUpdate: new Date().toISOString(),
      route: vehicleData.route || this.generateRandomRoute(vehicleData.position),
      routeIndex: 0,
      speedVariation: Math.random() * 20 + 30, // 30-50 km/h base speed
      alerts: vehicleData.alerts || [],
    });
    
    logger.info(`Vehicle ${vehicleData.vehicleId} added to GPS simulation`);
  }

  // Remove vehicle from simulation
  removeVehicle(vehicleId) {
    this.vehicles.delete(vehicleId);
    logger.info(`Vehicle ${vehicleId} removed from GPS simulation`);
  }

  // Generate a random route around Montevideo
  generateRandomRoute(startPosition) {
    const route = [startPosition];
    let current = { ...startPosition };
    
    // Generate 5-10 waypoints
    const waypointCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < waypointCount; i++) {
      // Move 0.01-0.05 degrees in a random direction
      const deltaLat = (Math.random() - 0.5) * 0.1;
      const deltaLng = (Math.random() - 0.5) * 0.1;
      
      current = {
        lat: current.lat + deltaLat,
        lng: current.lng + deltaLng,
      };
      
      route.push({ ...current });
    }
    
    return route;
  }

  // Calculate new position along route
  updateVehiclePosition(vehicle) {
    if (!vehicle.route || vehicle.route.length === 0) {
      return vehicle.position;
    }

    const currentWaypoint = vehicle.route[vehicle.routeIndex];
    const nextWaypoint = vehicle.route[vehicle.routeIndex + 1];

    if (!nextWaypoint) {
      // Reached end of route, generate new random route
      vehicle.route = this.generateRandomRoute(vehicle.position);
      vehicle.routeIndex = 0;
      return vehicle.position;
    }

    // Move towards next waypoint
    const deltaLat = nextWaypoint.lat - currentWaypoint.lat;
    const deltaLng = nextWaypoint.lng - currentWaypoint.lng;
    
    // Calculate distance to next waypoint
    const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
    
    // Move a small step towards the waypoint
    const stepSize = 0.0001; // Adjust based on desired speed
    
    if (distance < stepSize) {
      // Reached waypoint, move to next
      vehicle.routeIndex++;
      vehicle.position = { ...nextWaypoint };
    } else {
      // Move towards waypoint
      const ratio = stepSize / distance;
      vehicle.position = {
        lat: vehicle.position.lat + deltaLat * ratio,
        lng: vehicle.position.lng + deltaLng * ratio,
      };
    }

    return vehicle.position;
  }

  // Simulate realistic speed variations
  updateVehicleSpeed(vehicle) {
    const baseSpeed = vehicle.speedVariation;
    const variation = (Math.random() - 0.5) * 10; // ±5 km/h variation
    const newSpeed = Math.max(0, baseSpeed + variation);
    
    // Simulate traffic conditions
    if (Math.random() < 0.1) { // 10% chance of traffic
      return Math.max(0, newSpeed * 0.3); // Slow down significantly
    }
    
    // Simulate speed limits
    if (newSpeed > 80 && Math.random() < 0.3) {
      // Generate speed alert
      const alert = {
        id: `ALERT-${Date.now()}`,
        vehicleId: vehicle.vehicleId,
        type: 'speed',
        severity: 'medium',
        message: `Velocidad excesiva: ${Math.round(newSpeed)} km/h`,
        timestamp: new Date().toISOString(),
      };
      
      // Add alert to vehicle
      if (!vehicle.alerts) vehicle.alerts = [];
      vehicle.alerts.push(alert);
      
      // Keep only last 5 alerts per vehicle
      if (vehicle.alerts.length > 5) {
        vehicle.alerts = vehicle.alerts.slice(-5);
      }
      
      emitVehicleAlert(vehicle.vehicleId, alert);
    }
    
    return Math.min(newSpeed, 100); // Max speed 100 km/h
  }

  // Update vehicle heading based on movement
  updateVehicleHeading(vehicle, newPosition) {
    const deltaLat = newPosition.lat - vehicle.position.lat;
    const deltaLng = newPosition.lng - vehicle.position.lng;
    
    if (deltaLat === 0 && deltaLng === 0) {
      return vehicle.heading || 0;
    }
    
    // Calculate heading in degrees
    let heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    if (heading < 0) heading += 360;
    
    return Math.round(heading);
  }

  // Simulate battery drain
  updateBattery(vehicle) {
    const currentBattery = vehicle.battery || 100;
    const drainRate = 0.1; // 0.1% per update
    const newBattery = Math.max(0, currentBattery - drainRate);
    
    // Generate low battery alert
    if (newBattery < 20 && currentBattery >= 20) {
      const alert = {
        id: `ALERT-${Date.now()}`,
        vehicleId: vehicle.vehicleId,
        type: 'battery',
        severity: 'high',
        message: `Batería baja: ${Math.round(newBattery)}%`,
        timestamp: new Date().toISOString(),
      };
      
      // Add alert to vehicle
      if (!vehicle.alerts) vehicle.alerts = [];
      vehicle.alerts.push(alert);
      
      // Keep only last 5 alerts per vehicle
      if (vehicle.alerts.length > 5) {
        vehicle.alerts = vehicle.alerts.slice(-5);
      }
      
      emitVehicleAlert(vehicle.vehicleId, alert);
    }
    
    return newBattery;
  }

  // Simulate GPS signal strength
  updateSignal(vehicle) {
    const baseSignal = 85;
    const variation = (Math.random() - 0.5) * 20; // ±10% variation
    return Math.max(0, Math.min(100, baseSignal + variation));
  }

  // Update single vehicle
  updateVehicle(vehicle) {
    const newPosition = this.updateVehiclePosition(vehicle);
    const newSpeed = this.updateVehicleSpeed(vehicle);
    const newHeading = this.updateVehicleHeading(vehicle, newPosition);
    const newBattery = this.updateBattery(vehicle);
    const newSignal = this.updateSignal(vehicle);
    
    // Determine status based on speed
    let status = 'active';
    if (newSpeed === 0) {
      status = 'idle';
    } else if (newSpeed < 5) {
      status = 'stopped';
    }
    
    // Simulate random offline events
    if (Math.random() < 0.001) { // 0.1% chance
      status = 'offline';
    }

    const updatedVehicle = {
      ...vehicle,
      position: newPosition,
      speed: Math.round(newSpeed),
      heading: newHeading,
      battery: Math.round(newBattery),
      signal: Math.round(newSignal),
      status,
      timestamp: new Date().toISOString(),
      alerts: vehicle.alerts || [],
    };

    // Store updated vehicle
    this.vehicles.set(vehicle.vehicleId, updatedVehicle);

    // Emit position update
    emitVehiclePosition(vehicle.vehicleId, updatedVehicle);

    return updatedVehicle;
  }

  // Update all vehicles
  updateAllVehicles() {
    for (const [vehicleId, vehicle] of this.vehicles) {
      try {
        this.updateVehicle(vehicle);
      } catch (error) {
        logger.error(`Error updating vehicle ${vehicleId}:`, error);
      }
    }
  }

  // Start simulation
  start(intervalMs = 5000) { // Default 5 seconds
    if (this.isRunning) {
      logger.warn('GPS simulator is already running');
      return;
    }

    this.intervalId = setInterval(() => {
      this.updateAllVehicles();
    }, intervalMs);

    this.isRunning = true;
    logger.info(`GPS simulator started with ${intervalMs}ms interval`);
  }

  // Stop simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('GPS simulator stopped');
  }

  // Get current vehicle positions
  getVehiclePositions() {
    return Array.from(this.vehicles.values());
  }

  // Get specific vehicle position
  getVehiclePosition(vehicleId) {
    return this.vehicles.get(vehicleId);
  }
}

// Create singleton instance
const gpsSimulator = new GPSSimulator();

// Initialize with mock vehicles
const mockVehicles = [
  {
    vehicleId: 'VEH-001',
    plateNumber: 'ABC-1234',
    driverId: 'DRV-001',
    driverName: 'Juan Pérez',
    position: { lat: -34.9011, lng: -56.1645 },
    speed: 45,
    heading: 135,
    status: 'active',
    battery: 85,
    signal: 90,
    engineStatus: true,
    fuel: 65,
    temperature: 22,
    tripId: 'TRIP-001',
  },
  {
    vehicleId: 'VEH-002',
    plateNumber: 'XYZ-5678',
    driverId: 'DRV-002',
    driverName: 'María González',
    position: { lat: -34.8721, lng: -56.1819 },
    speed: 0,
    heading: 45,
    status: 'idle',
    battery: 92,
    signal: 85,
    engineStatus: false,
    fuel: 80,
    temperature: 21,
  },
  {
    vehicleId: 'VEH-003',
    plateNumber: 'DEF-9012',
    driverId: 'DRV-003',
    driverName: 'Carlos Rodriguez',
    position: { lat: -34.8854, lng: -56.1953 },
    speed: 62,
    heading: 270,
    status: 'active',
    battery: 70,
    signal: 75,
    engineStatus: true,
    fuel: 45,
    temperature: 23,
    tripId: 'TRIP-002',
    alerts: [
      {
        id: 'ALERT-001',
        type: 'speed',
        severity: 'medium',
        message: 'Velocidad sobre el límite permitido',
        timestamp: new Date().toISOString(),
      },
    ],
  },
];

// Add mock vehicles to simulator
mockVehicles.forEach(vehicle => {
  gpsSimulator.addVehicle(vehicle);
});

module.exports = gpsSimulator;