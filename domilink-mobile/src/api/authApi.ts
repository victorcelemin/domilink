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
  /** true cuando el login requiere completar el paso 2FA (OTP) */
  requiresOtp?: boolean;
}

export interface OtpSendResponse {
  message: string;
  /** Solo presente en entorno de desarrollo para facilitar pruebas */
  otp?: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthUser>('/api/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthUser>('/api/auth/login', payload),

  /**
   * Solicita el envio de un nuevo codigo OTP al correo del usuario.
   * Llamar tras un login exitoso con requiresOtp=true.
   */
  sendOtp: (email: string) =>
    apiClient.post<OtpSendResponse>('/api/auth/otp/send', { email }),

  /**
   * Verifica el codigo OTP e intercambia por un JWT completo.
   */
  verifyOtp: (email: string, otp: string) =>
    apiClient.post<AuthUser>('/api/auth/otp/verify', { email, otp }),

  me: () =>
    apiClient.get('/api/auth/me'),
};
