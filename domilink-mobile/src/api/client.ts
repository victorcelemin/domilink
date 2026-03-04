import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * URLs de los microservicios en desarrollo local.
 *
 * Android Emulator  → 10.0.2.2   (apunta al localhost de la máquina host)
 * iOS Simulator     → localhost   (comparte red con la Mac)
 * Web (browser)     → localhost   (mismo origen)
 * Dispositivo físico→ 192.168.40.7 (IP de la máquina en la red local)
 *
 * Para cambiar al gateway unificado (cuando esté corriendo en :8080):
 *   Cambia USE_GATEWAY = true y ajusta GATEWAY_HOST
 */

const USE_GATEWAY = false; // true cuando api-gateway esté levantado en :8080

// IP de tu máquina en la red local (para dispositivos físicos)
const MACHINE_IP = '192.168.40.7';

// Host según plataforma
const getHost = () => {
  if (USE_GATEWAY) return MACHINE_IP;
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost'; // iOS simulator + web
};

const HOST = getHost();

export const SERVICE_URLS = {
  auth:    `http://${HOST}:8081`,
  company: `http://${HOST}:8085`,
  courier: `http://${HOST}:8083`,
  order:   `http://${HOST}:8084`,
};

// Para dispositivo físico en la misma red WiFi, usa la IP de la máquina:
// export const SERVICE_URLS = {
//   auth:    `http://${MACHINE_IP}:8081`,
//   company: `http://${MACHINE_IP}:8085`,
//   courier: `http://${MACHINE_IP}:8083`,
//   order:   `http://${MACHINE_IP}:8084`,
// };

export const TOKEN_KEY      = '@domilink:token';
export const USER_KEY       = '@domilink:user';
export const COMPANY_ID_KEY = '@domilink:companyId';
export const COURIER_ID_KEY = '@domilink:courierId';

/** Decodifica el payload de un JWT usando atob (disponible en web, iOS, Android/Hermes) */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Convierte Base64URL → Base64 estándar y rellena padding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    // atob devuelve bytes — convertir latin-1 a UTF-8
    const utf8 = decodeURIComponent(
      decoded.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(utf8);
  } catch {
    return null;
  }
};

/** Crea un cliente Axios ya configurado con interceptores de auth */
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

      // Sin API Gateway, inyectamos los headers que normalmente
      // el gateway extraería del JWT y reenviaría al microservicio
      const payload = decodeJwtPayload(token);
      if (payload) {
        config.headers['X-User-Id']    = payload.sub   ?? '';
        config.headers['X-User-Role']  = payload.role  ?? '';
        config.headers['X-User-Email'] = payload.email ?? '';
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

// Default export apunta a auth (para compatibilidad con código existente)
export default authClient;
