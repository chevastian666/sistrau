const { getDb } = require('../config/database');
const logger = require('../utils/logger');
const { createAlert } = require('./alertService');

const handleTelemetryData = async (deviceId, data) => {
  try {
    const db = getDb();
    
    // Get vehicle from device
    const device = await db('iot_devices')
      .where({ device_id: deviceId })
      .first();

    if (!device || !device.vehicle_id) {
      logger.warn(`No vehicle found for device ${deviceId}`);
      return;
    }

    // Insert telemetry data
    const telemetryRecord = {
      vehicle_id: device.vehicle_id,
      timestamp: new Date(data.timestamp),
      engine_rpm: data.engineRpm,
      fuel_level_percent: data.fuelLevel,
      coolant_temp_c: data.coolantTemp,
      oil_pressure_kpa: data.oilPressure,
      battery_voltage: data.batteryVoltage,
      odometer_km: data.odometer,
      weight_per_axle: JSON.stringify(data.weightPerAxle || []),
      diagnostic_codes: JSON.stringify(data.diagnosticCodes || [])
    };

    await db('vehicle_telemetry').insert(telemetryRecord);

    // Check for alerts
    await checkTelemetryAlerts(device.vehicle_id, data);

    logger.debug(`Telemetry data processed for vehicle ${device.vehicle_id}`);

  } catch (error) {
    logger.error(`Error processing telemetry data from device ${deviceId}:`, error);
  }
};

const checkTelemetryAlerts = async (vehicleId, data) => {
  // Check fuel level
  if (data.fuelLevel && data.fuelLevel < 15) {
    await createAlert({
      type: 'low_fuel',
      severity: data.fuelLevel < 10 ? 'high' : 'medium',
      vehicle_id: vehicleId,
      title: 'Nivel de Combustible Bajo',
      description: `Nivel de combustible: ${data.fuelLevel.toFixed(1)}%`
    });
  }

  // Check engine temperature
  if (data.coolantTemp && data.coolantTemp > 95) {
    await createAlert({
      type: 'high_temperature',
      severity: data.coolantTemp > 100 ? 'critical' : 'high',
      vehicle_id: vehicleId,
      title: 'Temperatura Alta del Motor',
      description: `Temperatura: ${data.coolantTemp.toFixed(1)}°C`
    });
  }

  // Check battery voltage
  if (data.batteryVoltage && data.batteryVoltage < 12.0) {
    await createAlert({
      type: 'low_battery',
      severity: 'medium',
      vehicle_id: vehicleId,
      title: 'Voltaje de Batería Bajo',
      description: `Voltaje: ${data.batteryVoltage.toFixed(1)}V`
    });
  }

  // Check diagnostic codes
  if (data.diagnosticCodes && data.diagnosticCodes.length > 0) {
    await createAlert({
      type: 'diagnostic_trouble',
      severity: 'high',
      vehicle_id: vehicleId,
      title: 'Códigos de Diagnóstico Detectados',
      description: `Códigos: ${data.diagnosticCodes.join(', ')}`
    });
  }
};

module.exports = {
  handleTelemetryData,
  checkTelemetryAlerts
};