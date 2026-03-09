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

export interface WalletTransaction {
  id: string;
  type: 'DEBIT' | 'PAYMENT';
  amount: number;
  description: string;
  timestamp: string;
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
  // Wallet
  dailyDebt: number;
  lastDebtResetDate?: string;
  blockedByDebt: boolean;
  walletHistory?: WalletTransaction[];
}

export interface CourierLocation {
  courierId: string;
  latitude: number;
  longitude: number;
  available: boolean;
  updatedAt: string | null;
  name: string;
  vehicleType: string | null;
}

export const courierApi = {
  create: (payload: CreateCourierPayload) =>
    apiClient.post<Courier>('/api/couriers', payload),

  getMyCourier: () =>
    apiClient.get<Courier>('/api/couriers/me'),

  updateLocation: (latitude: number, longitude: number, available: boolean) =>
    apiClient.put('/api/couriers/location', { latitude, longitude, available }),

  getById: (id: string) =>
    apiClient.get<Courier>(`/api/couriers/${id}`),

  getAvailable: () =>
    apiClient.get<Courier[]>('/api/couriers/available'),

  /** Obtiene la ubicacion en tiempo real de un domiciliario (para tracking en mapa). */
  getCourierLocation: (courierId: string) =>
    apiClient.get<CourierLocation>(`/api/couriers/${courierId}/location`),

  // ── Wallet ────────────────────────────────────────────────────────────────

  /** Estado del wallet: deuda diaria, historial, estado de bloqueo. */
  getWallet: () =>
    apiClient.get<Courier>('/api/couriers/wallet'),

  /** Pagar la deuda diaria. amount en COP. */
  payDebt: (amount: number) =>
    apiClient.post<Courier>('/api/couriers/wallet/pay', { amount }),
};
