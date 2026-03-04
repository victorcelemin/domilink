import { courierClient as apiClient } from './client';

export interface CreateCourierPayload {
  firstName: string;
  lastName: string;
  documentNumber: string;
  phone: string;
  email: string;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'WALKING' | 'CAR';
  vehiclePlate?: string;
  vehicleModel?: string;
}

export interface Courier {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  available: boolean;
  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  totalDeliveries: number;
}

export const courierApi = {
  create: (payload: CreateCourierPayload) =>
    apiClient.post<Courier>('/api/couriers', payload),

  getMyCourier: () =>
    apiClient.get<Courier>('/api/couriers/me'),

  updateLocation: (latitude: number, longitude: number, available: boolean) =>
    apiClient.put('/api/couriers/location', { latitude, longitude, available }),
};
