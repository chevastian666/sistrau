// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  companyId?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 'admin' | 'transporter' | 'driver' | 'authority' | 'union' | 'viewer';

// Company types
export interface Company {
  id: string;
  name: string;
  rut: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

// Vehicle types
export interface Vehicle {
  id: string;
  companyId: string;
  plateNumber: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: number;
  type?: string;
  maxWeightKg?: number;
  status: VehicleStatus;
  iotDeviceId?: string;
  lastMaintenance?: string;
  insuranceExpiry?: string;
  currentPosition?: VehiclePosition;
  createdAt: string;
}

export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'suspended';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

// Trip types
export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  originAddress: string;
  originCoords?: Coordinates;
  destinationAddress: string;
  destinationCoords?: Coordinates;
  plannedDeparture: string;
  actualDeparture?: string;
  plannedArrival: string;
  actualArrival?: string;
  distanceKm?: number;
  vehicle?: Vehicle;
  driver?: User;
  cargoGuide?: CargoGuide;
  createdAt: string;
}

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Cargo Guide types
export interface CargoGuide {
  id: string;
  guideNumber: string;
  tripId?: string;
  shipperName: string;
  shipperRut?: string;
  receiverName: string;
  receiverRut?: string;
  cargoDescription?: string;
  weightKg?: number;
  volumeM3?: number;
  declaredValue?: number;
  blockchainHash?: string;
  createdAt: string;
}

// GPS Tracking types
export interface GPSTracking {
  id: string;
  tripId: string;
  vehicleId: string;
  timestamp: string;
  location: Coordinates;
  speedKmh?: number;
  heading?: number;
  altitudeM?: number;
  satellites?: number;
  hdop?: number;
}

// Alert types
export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  title: string;
  description?: string;
  location?: Coordinates;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Statistics types
export interface DailyStatistics {
  date: string;
  companyId?: string;
  vehicleId?: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalWeightKg: number;
  totalDrivingTimeMinutes: number;
  avgSpeedKmh?: number;
  fuelConsumedLiters?: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  documentNumber: string;
  companyId?: string;
  phone?: string;
}

// Filter types
export interface VehicleFilters {
  status?: VehicleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TripFilters {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AlertFilters {
  type?: string;
  severity?: AlertSeverity;
  isResolved?: boolean;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// WebSocket event types
export interface SocketEvents {
  'gps:update': {
    vehicleId: string;
    tripId: string;
    position: VehiclePosition;
  };
  'alert:new': Alert;
  'trip:statusUpdate': {
    tripId: string;
    status: TripStatus;
  };
  'telemetry:update': {
    vehicleId: string;
    data: any;
  };
}