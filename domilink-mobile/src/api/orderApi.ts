import { orderClient as apiClient } from './client';

export type PaymentMode = 'BASE' | 'PAID';
export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type PackageSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

export interface CreateOrderPayload {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  description: string;
  recipientName: string;
  recipientPhone: string;
  packageSize: PackageSize;
  paymentMode: PaymentMode;      // BASE o PAID
  baseAmount?: number;           // Solo para modo BASE: monto que lleva el domiciliario
}

export interface Order {
  id: string;
  companyId: string;
  companyUserId: string;
  courierId?: string;
  courierUserId?: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  description: string;
  recipientName: string;
  recipientPhone: string;
  packageSize: PackageSize;
  paymentMode: PaymentMode;
  baseAmount?: number;
  distanceKm: number;
  basePrice: number;
  finalPrice: number;
  vehicleTypeUsed?: string;
  status: OrderStatus;
  cancellationReason?: string;
  courierRating?: number;
  ratingComment?: string;
  createdAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface PriceEstimate {
  distanceKm: number;
  motorcyclePrice: number;
  bicyclePrice: number;
  carPrice: number;
}

export const orderApi = {
  create: (payload: CreateOrderPayload) =>
    apiClient.post<Order>('/api/orders', payload),

  getMyOrders: () =>
    apiClient.get<Order[]>('/api/orders'),

  getPending: () =>
    apiClient.get<Order[]>('/api/orders/pending'),

  getById: (id: string) =>
    apiClient.get<Order>(`/api/orders/${id}`),

  assign: (orderId: string, courierId: string, vehicleType: string) =>
    apiClient.post<Order>(`/api/orders/${orderId}/assign`, { courierId, vehicleType }),

  markInTransit: (orderId: string) =>
    apiClient.put<Order>(`/api/orders/${orderId}/in-transit`),

  markDelivered: (orderId: string) =>
    apiClient.put<Order>(`/api/orders/${orderId}/delivered`),

  cancel: (orderId: string, reason: string) =>
    apiClient.put<Order>(`/api/orders/${orderId}/cancel`, { reason }),

  rate: (orderId: string, rating: number, comment: string) =>
    apiClient.post<Order>(`/api/orders/${orderId}/rate`, { rating, comment }),

  estimatePrice: (
    pickupLat: number, pickupLon: number,
    deliveryLat: number, deliveryLon: number,
    packageSize: PackageSize
  ) =>
    apiClient.get<PriceEstimate>('/api/orders/estimate', {
      params: { pickupLat, pickupLon, deliveryLat, deliveryLon, packageSize },
    }),
};
