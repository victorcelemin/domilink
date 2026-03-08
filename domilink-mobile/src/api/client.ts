import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Configuracion de URLs para los microservicios.
 *
 * PRODUCCION WEB (Vercel):
 *   - Las peticiones usan rutas relativas  ('')  → van al proxy de Vercel
 *   - Vercel reenvía /api/* al gateway de Cloud Run en el servidor
 *   - Asi el browser NUNCA habla directamente con Cloud Run → sin CORS
 *
 * PRODUCCION MOVIL (Android / iOS):
 *   - Las peticiones van directamente al API Gateway via EXPO_PUBLIC_API_URL
 *   - Las apps nativas no tienen restriccion de CORS
 *
 * DESARROLLO LOCAL:
 *   - Android Emulator  → 10.0.2.2  (apunta al localhost del host)
 *   - iOS Simulator     → localhost
 *   - Web (browser)     → localhost (gateway local en :8080)
 */

// URL del gateway de Cloud Run (usada solo por apps nativas en produccion)
const PRODUCTION_GATEWAY = process.env.EXPO_PUBLIC_API_URL ?? '';

const getLocalHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
};

/**
 * Determina el baseURL correcto segun plataforma y entorno:
 *
 * WEB en produccion (Vercel, EXPO_PUBLIC_APP_ENV=production):
 *   → '' (vacio) — las peticiones /api/... son relativas al mismo origen.
 *   → Vercel intercepta /api/* y hace proxy al gateway de Cloud Run.
 *   → El browser nunca ve la URL de Cloud Run → CORS eliminado por diseno.
 *
 * WEB en desarrollo local (expo start --web):
 *   → http://localhost:8080 — apunta directamente al gateway local.
 *   → El proxy de Vercel no existe en local, se necesita la URL absoluta.
 *
 * MOVIL + produccion (EXPO_PUBLIC_API_URL definida):
 *   → URL completa del gateway. Las apps nativas no tienen restriccion CORS.
 *
 * MOVIL/WEB + desarrollo local (sin EXPO_PUBLIC_API_URL):
 *   → Gateway local en :8080.
 */
const IS_VERCEL_PROD = process.env.EXPO_PUBLIC_APP_ENV === 'production';

const getBaseURL = (): string => {
  if (Platform.OS === 'web') {
    // En produccion (Vercel) usar rutas relativas → el proxy reenvía al gateway.
    if (IS_VERCEL_PROD) {
      return '';
    }
    // En desarrollo local apuntar directamente al gateway en localhost.
    // El servidor local no tiene CORS issue porque origen y gateway comparten host.
    return `http://localhost:8080`;
  }

  // Nativo con gateway de produccion configurado
  if (PRODUCTION_GATEWAY.length > 0) {
    return PRODUCTION_GATEWAY;
  }

  // Desarrollo local nativo
  return `http://${getLocalHost()}:8080`;
};

const IS_PRODUCTION = PRODUCTION_GATEWAY.length > 0;

export const GATEWAY_URL = IS_PRODUCTION
  ? PRODUCTION_GATEWAY
  : `http://${getLocalHost()}:8080`;

const BASE_URL = getBaseURL();

export const SERVICE_URLS = {
  auth:    BASE_URL,
  company: BASE_URL,
  courier: BASE_URL,
  order:   BASE_URL,
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
