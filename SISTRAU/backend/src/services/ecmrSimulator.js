const logger = require('../utils/logger');
const { emitECMRUpdate } = require('./socketService');
const axios = require('axios');

class ECMRSimulator {
  constructor() {
    this.activeECMRs = new Map();
    this.simulationInterval = null;
    this.locationUpdateInterval = null;
    this.apiUrl = process.env.API_URL || 'http://localhost:3001/api';
  }

  start(interval = 30000) { // Update every 30 seconds
    logger.info('Starting e-CMR simulator');
    
    // Initial fetch of active e-CMRs
    this.fetchActiveECMRs();
    
    // Periodic updates
    this.simulationInterval = setInterval(() => {
      this.updateECMRStatuses();
    }, interval);
    
    // Location updates for in-transit e-CMRs
    this.locationUpdateInterval = setInterval(() => {
      this.updateLocations();
    }, 10000); // Every 10 seconds
  }

  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
    logger.info('e-CMR simulator stopped');
  }

  async fetchActiveECMRs() {
    try {
      // Get active e-CMRs (issued or in_transit)
      const response = await axios.get(`${this.apiUrl}/ecmr`, {
        params: {
          status: 'in_transit',
          limit: 50
        },
        headers: {
          Authorization: 'Bearer mock-token'
        }
      });
      
      if (response.data && response.data.data) {
        response.data.data.forEach(ecmr => {
          this.activeECMRs.set(ecmr.id, ecmr);
        });
      }
    } catch (error) {
      logger.debug('e-CMR simulator: waiting for active e-CMRs');
    }
  }

  async updateECMRStatuses() {
    for (const [ecmrId, ecmr] of this.activeECMRs) {
      try {
        // Simulate different events based on current status
        switch (ecmr.status) {
          case 'issued':
            // Simulate carrier pickup (sign)
            if (Math.random() < 0.3) { // 30% chance
              await this.simulateCarrierSignature(ecmrId);
            }
            break;
            
          case 'in_transit':
            // Simulate arrival and receiver signature
            if (ecmr.tracking && ecmr.tracking.currentLocation) {
              const distanceToDestination = this.calculateDistance(
                ecmr.tracking.currentLocation,
                ecmr.journey.destination.coordinates
              );
              
              if (distanceToDestination < 5) { // Within 5km
                if (Math.random() < 0.4) { // 40% chance
                  await this.simulateReceiverSignature(ecmrId);
                }
              }
            }
            break;
            
          case 'completed':
            // Remove from active tracking
            this.activeECMRs.delete(ecmrId);
            break;
        }
        
        // Random events
        if (Math.random() < 0.1) { // 10% chance
          this.simulateRandomEvent(ecmrId);
        }
        
      } catch (error) {
        logger.error(`Error updating e-CMR ${ecmrId}:`, error);
      }
    }
    
    // Periodically refresh the list
    if (Math.random() < 0.2) { // 20% chance
      this.fetchActiveECMRs();
    }
  }

  async updateLocations() {
    for (const [ecmrId, ecmr] of this.activeECMRs) {
      if (ecmr.status === 'in_transit') {
        try {
          const newLocation = this.simulateMovement(ecmr);
          
          await axios.patch(
            `${this.apiUrl}/ecmr/${ecmrId}/location`,
            newLocation,
            {
              headers: {
                Authorization: 'Bearer mock-token'
              }
            }
          );
          
          // Update local copy
          if (!ecmr.tracking) ecmr.tracking = {};
          ecmr.tracking.currentLocation = newLocation;
          
        } catch (error) {
          logger.debug(`Error updating location for e-CMR ${ecmrId}`);
        }
      }
    }
  }

  simulateMovement(ecmr) {
    if (!ecmr.tracking || !ecmr.tracking.currentLocation) {
      // Start from origin
      return {
        lat: ecmr.journey.origin.coordinates.lat,
        lng: ecmr.journey.origin.coordinates.lng,
        speed: 60 + Math.random() * 30, // 60-90 km/h
        heading: this.calculateBearing(
          ecmr.journey.origin.coordinates,
          ecmr.journey.destination.coordinates
        )
      };
    }
    
    const current = ecmr.tracking.currentLocation;
    const destination = ecmr.journey.destination.coordinates;
    
    // Calculate progress towards destination
    const distance = this.calculateDistance(current, destination);
    const bearing = this.calculateBearing(current, destination);
    
    // Move 1-3 km towards destination
    const moveDistance = (1 + Math.random() * 2) / 111; // Convert km to degrees
    
    let newLat = current.lat + (moveDistance * Math.cos(bearing * Math.PI / 180));
    let newLng = current.lng + (moveDistance * Math.sin(bearing * Math.PI / 180));
    
    // Add some randomness to simulate real driving
    newLat += (Math.random() - 0.5) * 0.001;
    newLng += (Math.random() - 0.5) * 0.001;
    
    // Speed variations
    let speed = 70 + Math.random() * 20; // 70-90 km/h highway
    if (distance < 10) speed = 40 + Math.random() * 20; // 40-60 km/h city
    
    return {
      lat: newLat,
      lng: newLng,
      speed: Math.round(speed),
      heading: Math.round(bearing),
      address: this.generateAddressFromCoords(newLat, newLng)
    };
  }

  async simulateCarrierSignature(ecmrId) {
    try {
      await axios.post(
        `${this.apiUrl}/ecmr/${ecmrId}/sign`,
        {
          type: 'carrier',
          signature: 'data:image/png;base64,simulatedCarrierSignature'
        },
        {
          headers: {
            Authorization: 'Bearer mock-token'
          }
        }
      );
      
      logger.info(`Simulated carrier signature for e-CMR ${ecmrId}`);
      
      // Update local status
      const ecmr = this.activeECMRs.get(ecmrId);
      if (ecmr) {
        ecmr.status = 'in_transit';
      }
    } catch (error) {
      logger.debug(`Error simulating carrier signature: ${error.message}`);
    }
  }

  async simulateReceiverSignature(ecmrId) {
    try {
      await axios.post(
        `${this.apiUrl}/ecmr/${ecmrId}/sign`,
        {
          type: 'receiver',
          signature: 'data:image/png;base64,simulatedReceiverSignature'
        },
        {
          headers: {
            Authorization: 'Bearer mock-token'
          }
        }
      );
      
      logger.info(`Simulated receiver signature for e-CMR ${ecmrId}`);
      
      // Complete the e-CMR
      await axios.post(
        `${this.apiUrl}/ecmr/${ecmrId}/complete`,
        {},
        {
          headers: {
            Authorization: 'Bearer mock-token'
          }
        }
      );
      
      // Remove from active tracking
      this.activeECMRs.delete(ecmrId);
      
    } catch (error) {
      logger.debug(`Error simulating receiver signature: ${error.message}`);
    }
  }

  simulateRandomEvent(ecmrId) {
    const events = [
      {
        type: 'inspection',
        description: 'Customs inspection at border',
        severity: 'info'
      },
      {
        type: 'delay',
        description: 'Traffic congestion - estimated 30 min delay',
        severity: 'warning'
      },
      {
        type: 'checkpoint',
        description: 'Passed weight control checkpoint',
        severity: 'info'
      },
      {
        type: 'rest',
        description: 'Driver rest stop',
        severity: 'info'
      }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    emitECMRUpdate(ecmrId, {
      type: 'event',
      event: {
        ...event,
        timestamp: new Date().toISOString(),
        ecmrId
      }
    });
  }

  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateBearing(coord1, coord2) {
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  generateAddressFromCoords(lat, lng) {
    // Simulate address based on coordinates
    const routes = [
      'Ruta 1', 'Ruta 5', 'Ruta 8', 'Ruta 9', 'Ruta 11',
      'Ruta Interbalnearia', 'Av. Italia', 'Camino Maldonado'
    ];
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    const km = Math.floor(Math.random() * 200) + 10;
    
    return `${route} Km ${km}`;
  }
}

// Create singleton instance
const ecmrSimulator = new ECMRSimulator();

module.exports = ecmrSimulator;