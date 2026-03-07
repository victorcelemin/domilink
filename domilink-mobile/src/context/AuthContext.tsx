import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthUser } from '../api/authApi';
import { companyApi } from '../api/companyApi';
import { courierApi } from '../api/courierApi';
import { TOKEN_KEY, USER_KEY, COMPANY_ID_KEY, COURIER_ID_KEY } from '../api/client';

/**
 * Resultado de login: puede ser exito directo o requerir paso 2FA.
 */
export type LoginResult =
  | { requiresOtp: false }
  | { requiresOtp: true; email: string; role: 'COMPANY' | 'COURIER' | 'ADMIN'; otpDev?: string };

interface AuthContextType {
  user: AuthUser | null;
  companyId: string | null;
  courierId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Retorna LoginResult para que el componente sepa si navegar al paso OTP. */
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, displayName: string, role: 'COMPANY' | 'COURIER') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Verifica el OTP ingresado por el usuario y completa la sesion. */
  verifyOtp: (email: string, otp: string) => Promise<void>;
  /**
   * Solicita un nuevo OTP al backend.
   * Retorna el codigo OTP si el backend lo incluye en la respuesta (solo dev).
   */
  resendOtp: (email: string) => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [courierId, setCourierId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al iniciar la app, restaurar sesion guardada
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [token, userStr, savedCompanyId, savedCourierId] = await AsyncStorage.multiGet([
        TOKEN_KEY, USER_KEY, COMPANY_ID_KEY, COURIER_ID_KEY,
      ]);

      if (token[1] && userStr[1]) {
        const savedUser: AuthUser = JSON.parse(userStr[1]);
        setUser(savedUser);
        setCompanyId(savedCompanyId[1]);
        setCourierId(savedCourierId[1]);
      }
    } catch (e) {
      console.warn('Error restaurando sesion:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const { data } = await authApi.login({ email, password });

    if (data.requiresOtp) {
      // Disparar el envio del OTP automaticamente
      let otpDev: string | undefined;
      try {
        const otpResp = await authApi.sendOtp(email);
        otpDev = otpResp.data.otp; // solo presente en dev
      } catch {
        // Si falla el envio del OTP igual redirigir a la pantalla para que el usuario pueda solicitar uno
      }
      return { requiresOtp: true, email, role: data.role as 'COMPANY' | 'COURIER' | 'ADMIN', otpDev };
    }

    await saveSession(data);
    await loadProfile(data);
    return { requiresOtp: false };
  };

  const verifyOtp = async (email: string, otp: string): Promise<void> => {
    const { data } = await authApi.verifyOtp(email, otp);
    await saveSession(data);
    await loadProfile(data);
  };

  const resendOtp = async (email: string): Promise<string | undefined> => {
    const { data } = await authApi.sendOtp(email);
    return data.otp;
  };

  const register = async (
    email: string, password: string,
    displayName: string, role: 'COMPANY' | 'COURIER'
  ) => {
    const { data } = await authApi.register({ email, password, displayName, role });
    await saveSession(data);
    // Intentar cargar perfil (puede fallar si aun no existe — es normal para usuario nuevo)
    await loadProfile(data);
  };

  const saveSession = async (authUser: AuthUser) => {
    setUser(authUser);
    // Solo guardar token si existe (no guardar respuestas requiresOtp intermedias)
    const pairs: [string, string][] = [[USER_KEY, JSON.stringify(authUser)]];
    if (authUser.accessToken) {
      pairs.push([TOKEN_KEY, authUser.accessToken]);
    }
    await AsyncStorage.multiSet(pairs);
  };

  /**
   * Carga el perfil de empresa o domiciliario despues del login
   * para obtener el ID del perfil (diferente del userId).
   */
  const loadProfile = async (authUser: AuthUser) => {
    try {
      if (authUser.role === 'COMPANY') {
        const { data } = await companyApi.getMyCompany();
        setCompanyId(data.id);
        await AsyncStorage.setItem(COMPANY_ID_KEY, data.id);
      } else if (authUser.role === 'COURIER') {
        const { data } = await courierApi.getMyCourier();
        setCourierId(data.id);
        await AsyncStorage.setItem(COURIER_ID_KEY, data.id);
      }
    } catch {
      // Perfil no creado aun (usuario nuevo), no es error
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user);
  };

  const logout = async () => {
    setUser(null);
    setCompanyId(null);
    setCourierId(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, COMPANY_ID_KEY, COURIER_ID_KEY]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      companyId,
      courierId,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshProfile,
      verifyOtp,
      resendOtp,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
