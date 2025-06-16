const crypto = require('crypto');

// Generate unique guide number
const generateGuideNumber = async () => {
  const prefix = 'GC'; // Guía de Carga
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `${prefix}-${year}-${timestamp}-${random}`;
};

// Generate tracking code
const generateTrackingCode = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Format RUT (Registro Único Tributario)
const formatRUT = (rut) => {
  if (!rut) return '';
  
  // Remove any non-numeric characters
  const cleanRUT = rut.replace(/[^0-9]/g, '');
  
  // Format as XX.XXX.XXX-X
  if (cleanRUT.length === 12) {
    return cleanRUT.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3-$4');
  }
  
  return rut;
};

// Validate RUT
const validateRUT = (rut) => {
  if (!rut) return false;
  
  const cleanRUT = rut.replace(/[^0-9]/g, '');
  return cleanRUT.length === 12;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Format weight
const formatWeight = (weightKg) => {
  if (!weightKg) return '0 kg';
  
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toFixed(2)} ton`;
  }
  
  return `${weightKg.toFixed(2)} kg`;
};

// Format currency (UYU)
const formatCurrency = (amount) => {
  if (!amount) return '$U 0';
  
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Generate random plate number (for testing)
const generatePlateNumber = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
  const randomDigit = () => Math.floor(Math.random() * 10);
  
  return `${randomLetter()}${randomLetter()}${randomLetter()} ${randomDigit()}${randomDigit()}${randomDigit()}${randomDigit()}`;
};

// Parse GPS coordinates from string
const parseCoordinates = (coordString) => {
  if (!coordString) return null;
  
  // Expected format: "-34.9011,-56.1645" or "lat:-34.9011,lng:-56.1645"
  const match = coordString.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2])
    };
  }
  
  return null;
};

// Check if point is within Uruguay bounds
const isWithinUruguay = (lat, lon) => {
  // Approximate bounds of Uruguay
  const bounds = {
    north: -30.0,
    south: -35.0,
    east: -53.0,
    west: -58.5
  };
  
  return lat >= bounds.south && lat <= bounds.north &&
         lon >= bounds.west && lon <= bounds.east;
};

// Format date for display
const formatDate = (date, format = 'full') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'date':
      return d.toLocaleDateString('es-UY');
    case 'time':
      return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return d.toLocaleString('es-UY');
    case 'full':
    default:
      return d.toLocaleString('es-UY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }
};

// Calculate ETA based on distance and average speed
const calculateETA = (distanceKm, avgSpeedKmh = 60) => {
  const hours = distanceKm / avgSpeedKmh;
  const now = new Date();
  const eta = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  return {
    eta,
    duration: hours,
    durationFormatted: formatDuration(hours * 60)
  };
};

// Format duration in minutes to human readable
const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  
  return `${hours} h ${mins} min`;
};

// Validate vehicle plate number
const validatePlateNumber = (plate) => {
  if (!plate) return false;
  
  // Uruguay plate format: ABC 1234 or AB 12345
  const pattern = /^[A-Z]{2,3}\s?\d{4,5}$/;
  return pattern.test(plate.toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim());
};

// Generate random VIN (for testing)
const generateVIN = () => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return vin;
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

// Generate random color (for charts)
const generateRandomColor = () => {
  const colors = [
    '#1976d2', '#dc004e', '#388e3c', '#f57c00',
    '#7b1fa2', '#0097a7', '#5d4037', '#616161'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = {
  generateGuideNumber,
  generateTrackingCode,
  formatRUT,
  validateRUT,
  calculateDistance,
  formatWeight,
  formatCurrency,
  generatePlateNumber,
  parseCoordinates,
  isWithinUruguay,
  formatDate,
  calculateETA,
  formatDuration,
  validatePlateNumber,
  generateVIN,
  sanitizeFilename,
  generateRandomColor
};