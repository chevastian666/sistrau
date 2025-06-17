export type TripStatus = 'scheduled' | 'in_transit' | 'paused' | 'completed' | 'cancelled' | 'delayed';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TripRoute {
  origin: string;
  destination: string;
  waypoints: string[];
  distance: number;
  estimatedDuration: number;
  plannedRoute?: any;
}

export interface TripCargo {
  description: string;
  weight: number;
  volume: number;
  value: number;
  dangerousGoods: boolean;
  specialRequirements: string[];
  units?: number;
  type?: string;
}

export interface TripSchedule {
  departureTime: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  plannedStops?: any[];
}

export interface TripCheckpoint {
  id: string;
  location: string;
  arrivedAt: string;
  departedAt?: string;
  notes?: string;
  photos?: string[];
  coordinates?: { lat: number; lng: number };
  type?: string;
}

export interface TripExpenses {
  fuel: number;
  tolls: number;
  maintenance: number;
  other: number;
  currency?: string;
}

export interface TripDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TripAlert {
  id: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: any;
}

export interface TripMetrics {
  totalDistanceCovered: number;
  averageSpeed: number;
  fuelConsumption: number;
  stopsCount: number;
  delaysCount: number;
  efficiencyScore: number;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
    type?: string;
  };
  driverId: string;
  driver: {
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone: string;
  };
  ecmrId?: string;
  route: TripRoute;
  cargo: TripCargo;
  schedule: TripSchedule;
  status: TripStatus;
  checkpoints: TripCheckpoint[];
  expenses: TripExpenses;
  documents: TripDocument[];
  alerts: TripAlert[];
  metrics?: TripMetrics;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  companyId?: string;
}

export interface TripFilters {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TripStats {
  total: number;
  inTransit: number;
  completed: number;
  delayed: number;
  totalDistance: number;
  avgEfficiency: number;
}

export interface TripTimeline {
  id: string;
  type: 'departure' | 'checkpoint' | 'alert' | 'arrival';
  timestamp: string;
  location?: string;
  description: string;
  severity?: AlertSeverity;
  icon: string;
}

export interface CreateTripData {
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  distance?: number;
  estimatedDuration?: number;
  departureTime: string;
  estimatedArrival?: string;
  cargoDescription: string;
  cargoWeight: number;
  cargoVolume?: number;
  cargoValue?: number;
  dangerousGoods?: boolean;
  specialRequirements?: string[];
}