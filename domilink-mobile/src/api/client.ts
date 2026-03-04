import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Configuracion de URLs para los microservicios.
 *
 * PRODUCCION (Cloud Run):
 *   - Todas las peticiones van al API Gateway via EXPO_PUBLIC_API_URL
 *   - El gateway enruta internamente a cada microservicio
 *
 * DESARROLLO LOCAL:
 *   - Android Emulator  → 10.0.2.2  (apunta al localhost del host)
 *   - iOS Simulator     → localhost
 *   - Web (browser)     → localhost
 *   - Dispositivo fisico→ IP de la maquina en la red local
 */

// URL de produccion inyectada en build time por el workflow de GitHub Actions
const PRODUCTION_GATEWAY = process.env.EXPO_PUBLIC_API_URL ?? '';

// IP de tu maquina en la red local (para desarrollo con dispositivo fisico)
const MACHINE_IP = '192.168.40.7';

const getLocalHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost'; // iOS simulator + web
};

// Si existe EXPO_PUBLIC_API_URL, usar el gateway de produccion
// De lo contrario, usar los servicios locales por separado
const IS_PRODUCTION = PRODUCTION_GATEWAY.length > 0;

export const GATEWAY_URL = IS_PRODUCTION
  ? PRODUCTION_GATEWAY
  : `http://${getLocalHost()}:8080`;

// En produccion todo va al gateway; en local apunta a cada servicio directamente
export const SERVICE_URLS = IS_PRODUCTION
  ? {
      auth:    PRODUCTION_GATEWAY,
      company: PRODUCTION_GATEWAY,
      courier: PRODUCTION_GATEWAY,
      order:   PRODUCTION_GATEWAY,
    }
  : {
      auth:    `http://${getLocalHost()}:8081`,
      company: `http://${getLocalHost()}:8082`,
      courier: `http://${getLocalHost()}:8083`,
      order:   `http://${getLocalHost()}:8084`,
    };

export const TOKEN_KEY      = '@domilink:token';
export const USER_KEY       = '@domilink:user';
export const COMPANY_ID_KEY = '@domilink:companyId';
export const COURIER_ID_KEY = '@domilink:courierId';

/** Decodifica el payload de un JWT */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    const utf8 = decodeURIComponent(
      decoded.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(utf8);
  } catch {
    return null;
  }
};

/** Crea un cliente Axios con interceptores de autenticacion */
const createClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const token      = await AsyncStorage.getItem(TOKEN_KEY);
    const companyId  = await AsyncStorage.getItem(COMPANY_ID_KEY);
    const courierId  = await AsyncStorage.getItem(COURIER_ID_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // En local (sin gateway) inyectamos los headers que el gateway normalmente
      // extraeria del JWT y reenviaria al microservicio
      if (!IS_PRODUCTION) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          config.headers['X-User-Id']    = payload.sub   ?? '';
          config.headers['X-User-Role']  = payload.role  ?? '';
          config.headers['X-User-Email'] = payload.email ?? '';
        }
      }
    }
    if (companyId) config.headers['X-Company-Id'] = companyId;
    if (courierId) config.headers['X-Courier-Id'] = courierId;

    return config;
  }, (err) => Promise.reject(err));

  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, COMPANY_ID_KEY, COURIER_ID_KEY]);
      }
      return Promise.reject(err);
    }
  );

  return client;
};

export const authClient    = createClient(SERVICE_URLS.auth);
export const companyClient = createClient(SERVICE_URLS.company);
export const courierClient = createClient(SERVICE_URLS.courier);
export const orderClient   = createClient(SERVICE_URLS.order);

// Default export apunta a auth (para compatibilidad)
export default authClient;
