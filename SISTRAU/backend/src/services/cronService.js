const cron = require('node-cron');
const logger = require('../utils/logger');
const { getDb, mockDb } = require('../config/database');
const { createAlert } = require('./alertService');

const startCronJobs = () => {
  // Check for expired documents every day at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily document expiry check...');
    try {
      await checkExpiredDocuments();
    } catch (error) {
      logger.error('Error in document expiry check:', error);
    }
  });

  // Generate daily statistics every night at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Generating daily statistics...');
    try {
      await generateDailyStatistics();
    } catch (error) {
      logger.error('Error generating statistics:', error);
    }
  });

  // Clean old GPS data every week
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Cleaning old GPS data...');
    try {
      await cleanOldGPSData();
    } catch (error) {
      logger.error('Error cleaning GPS data:', error);
    }
  });

  // Check vehicle maintenance every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Checking vehicle maintenance schedules...');
    try {
      await checkMaintenanceSchedules();
    } catch (error) {
      logger.error('Error checking maintenance:', error);
    }
  });

  logger.info('Cron jobs scheduled successfully');
};

const checkExpiredDocuments = async () => {
  // Mock implementation for development
  logger.info('Checking expired documents...');
  
  // In production, this would check real database
  // For now, just log the activity
  const mockDrivers = mockDb.users?.filter(u => u.role === 'driver') || [];
  logger.info(`Checked ${mockDrivers.length} drivers for license expiry`);
  
  const mockVehicles = mockDb.vehicles || [];
  logger.info(`Checked ${mockVehicles.length} vehicles for insurance expiry`);
};

const generateDailyStatistics = async () => {
  // Mock implementation for development
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Get completed trips from mock data
  const trips = mockDb.trips?.filter(trip => 
    trip.status === 'completed' && 
    new Date(trip.updatedAt || trip.createdAt) >= yesterday
  ) || [];

  logger.info(`Generated statistics for ${trips.length} completed trips`);
};

const cleanOldGPSData = async () => {
  // Mock implementation for development
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  // Clean old GPS data from mock database
  if (mockDb.gps_positions) {
    const originalCount = mockDb.gps_positions.length;
    mockDb.gps_positions = mockDb.gps_positions.filter(pos => 
      new Date(pos.timestamp) > cutoffDate
    );
    const deleted = originalCount - mockDb.gps_positions.length;
    logger.info(`Deleted ${deleted} old GPS records`);
  }
};

const checkMaintenanceSchedules = async () => {
  // Mock implementation for development
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Check vehicles in mock database
  const vehiclesNeedingMaintenance = mockDb.vehicles?.filter(vehicle => {
    const lastMaintenance = vehicle.lastMaintenance ? new Date(vehicle.lastMaintenance) : null;
    return vehicle.status === 'active' && 
           (!lastMaintenance || lastMaintenance < sixMonthsAgo);
  }) || [];

  logger.info(`Found ${vehiclesNeedingMaintenance.length} vehicles needing maintenance`);
  
  for (const vehicle of vehiclesNeedingMaintenance) {
    logger.warn(`Vehicle ${vehicle.licensePlate} needs maintenance`);
  }
};

module.exports = {
  startCronJobs
};