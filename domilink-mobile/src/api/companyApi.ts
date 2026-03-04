import { companyClient as apiClient } from './client';

export interface CreateCompanyPayload {
  name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  createdAt: string;
}

export const companyApi = {
  create: (payload: CreateCompanyPayload) =>
    apiClient.post<Company>('/api/companies', payload),

  getMyCompany: () =>
    apiClient.get<Company>('/api/companies/me'),

  getById: (id: string) =>
    apiClient.get<Company>(`/api/companies/${id}`),
};
