const axios = require('axios');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    this.businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER;
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.templates = {
      vehicleAlert: 'vehicle_alert_template',
      driverCompliance: 'driver_compliance_template',
      maintenanceReminder: 'maintenance_reminder_template',
      tripUpdate: 'trip_update_template',
      emergencyAlert: 'emergency_alert_template'
    };
  }

  /**
   * Send WhatsApp message using Business API
   */
  async sendMessage(to, message, type = 'text') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: type,
      };

      if (type === 'text') {
        payload.text = { body: message };
      } else if (type === 'template') {
        payload.template = message;
      }

      const response = await axios.post(
        `${this.apiUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp message sent successfully', {
        to,
        messageId: response.data.messages[0].id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        error: error.message,
        to,
        type
      });
      throw error;
    }
  }

  /**
   * Send vehicle alert via WhatsApp
   */
  async sendVehicleAlert(phoneNumber, vehicleData, alertType) {
    const message = this.formatVehicleAlert(vehicleData, alertType);
    
    // For critical alerts, also send location
    if (alertType === 'critical') {
      await this.sendLocation(
        phoneNumber,
        vehicleData.location.lat,
        vehicleData.location.lng,
        vehicleData.plateNumber
      );
    }

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send driver compliance alert
   */
  async sendComplianceAlert(phoneNumber, driverData, violation) {
    const message = `⚠️ *ALERTA DE CUMPLIMIENTO*\n\n` +
      `Conductor: ${driverData.name}\n` +
      `Vehículo: ${driverData.vehicle}\n` +
      `Violación: ${violation.type}\n` +
      `Severidad: ${violation.severity}\n` +
      `Hora: ${new Date(violation.timestamp).toLocaleString('es-UY')}\n\n` +
      `${violation.description}\n\n` +
      `Por favor tome acción inmediata.`;

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send maintenance reminder
   */
  async sendMaintenanceReminder(phoneNumber, vehicleData, maintenanceType) {
    const message = `🔧 *RECORDATORIO DE MANTENIMIENTO*\n\n` +
      `Vehículo: ${vehicleData.plateNumber}\n` +
      `Tipo: ${maintenanceType}\n` +
      `Kilometraje actual: ${vehicleData.mileage} km\n` +
      `Fecha límite: ${vehicleData.dueDate}\n\n` +
      `Reserve su turno lo antes posible.`;

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send trip update notification
   */
  async sendTripUpdate(phoneNumber, tripData) {
    const statusEmoji = {
      'started': '🚛',
      'in_progress': '📍',
      'delayed': '⏰',
      'completed': '✅',
      'cancelled': '❌'
    };

    const message = `${statusEmoji[tripData.status] || '📢'} *ACTUALIZACIÓN DE VIAJE*\n\n` +
      `Viaje ID: ${tripData.id}\n` +
      `Estado: ${tripData.status.toUpperCase()}\n` +
      `Origen: ${tripData.origin}\n` +
      `Destino: ${tripData.destination}\n` +
      `Conductor: ${tripData.driver}\n` +
      `Actualización: ${tripData.update}\n\n` +
      `Hora: ${new Date().toLocaleString('es-UY')}`;

    return this.sendMessage(phoneNumber, message);
  }

  /**
   * Send location via WhatsApp
   */
  async sendLocation(phoneNumber, latitude, longitude, name) {
    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(phoneNumber),
      type: 'location',
      location: {
        latitude: latitude,
        longitude: longitude,
        name: name,
        address: `Lat: ${latitude}, Lng: ${longitude}`
      }
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to send location via WhatsApp', { error: error.message });
      throw error;
    }
  }

  /**
   * Send emergency SOS alert
   */
  async sendEmergencyAlert(phoneNumbers, emergencyData) {
    const message = `🆘 *ALERTA DE EMERGENCIA*\n\n` +
      `Conductor: ${emergencyData.driver}\n` +
      `Vehículo: ${emergencyData.vehicle}\n` +
      `Ubicación: ${emergencyData.location}\n` +
      `Tipo: ${emergencyData.type}\n\n` +
      `¡REQUIERE ATENCIÓN INMEDIATA!\n\n` +
      `Contacto: ${emergencyData.phone}`;

    // Send to multiple emergency contacts
    const sendPromises = phoneNumbers.map(phone => 
      this.sendMessage(phone, message)
    );

    // Also send location to all contacts
    const locationPromises = phoneNumbers.map(phone =>
      this.sendLocation(
        phone,
        emergencyData.coordinates.lat,
        emergencyData.coordinates.lng,
        `SOS - ${emergencyData.vehicle}`
      )
    );

    await Promise.all([...sendPromises, ...locationPromises]);
    
    logger.info('Emergency alerts sent to all contacts', {
      contacts: phoneNumbers.length,
      emergency: emergencyData.type
    });
  }

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add Uruguay country code if not present
    if (!cleaned.startsWith('598')) {
      cleaned = '598' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Format vehicle alert message
   */
  formatVehicleAlert(vehicleData, alertType) {
    const alertEmoji = {
      speeding: '🚨',
      maintenance: '🔧',
      fuel_low: '⛽',
      route_deviation: '🗺️',
      accident: '💥',
      breakdown: '🚧'
    };

    return `${alertEmoji[alertType] || '⚠️'} *ALERTA DE VEHÍCULO*\n\n` +
      `Vehículo: ${vehicleData.plateNumber}\n` +
      `Conductor: ${vehicleData.driver}\n` +
      `Tipo de alerta: ${alertType.toUpperCase()}\n` +
      `Ubicación: ${vehicleData.location.address}\n` +
      `Velocidad: ${vehicleData.speed} km/h\n` +
      `Hora: ${new Date().toLocaleString('es-UY')}\n\n` +
      `Mensaje: ${vehicleData.alertMessage}`;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotification(phoneNumbers, message) {
    const results = await Promise.allSettled(
      phoneNumbers.map(phone => this.sendMessage(phone, message))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Bulk WhatsApp notifications sent', {
      total: phoneNumbers.length,
      successful,
      failed
    });

    return { successful, failed, total: phoneNumbers.length };
  }

  /**
   * Verify WhatsApp number is valid and registered
   */
  async verifyNumber(phoneNumber) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/contacts`,
        {
          params: {
            blocking: 'wait',
            contacts: JSON.stringify([this.formatPhoneNumber(phoneNumber)])
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.contacts[0].status === 'valid';
    } catch (error) {
      logger.error('Failed to verify WhatsApp number', { 
        error: error.message,
        phoneNumber 
      });
      return false;
    }
  }
}

module.exports = new WhatsAppService();