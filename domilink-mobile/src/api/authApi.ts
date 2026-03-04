import { authClient as apiClient } from './client';

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: 'COMPANY' | 'COURIER';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  role: 'COMPANY' | 'COURIER' | 'ADMIN';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthUser>('/api/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthUser>('/api/auth/login', payload),

  me: () =>
    apiClient.get('/api/auth/me'),
};
