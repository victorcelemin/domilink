const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// ── Deteccion de build web ────────────────────────────────────────────────────
// Metro puede llamar al resolver con platform=null cuando la resolution viene
// de dentro de node_modules. Usamos EXPO_METRO_PLATFORM_WEB como flag global.
const isWebCLI =
  process.argv.some(a => a === 'web') ||
  process.env.EXPO_METRO_PLATFORM_WEB === '1';

if (isWebCLI) {
  process.env.EXPO_METRO_PLATFORM_WEB = '1';
}

const config = getDefaultConfig(__dirname);

// ── Rutas absolutas de los stubs web ─────────────────────────────────────────
const STUB_REANIMATED = require.resolve('./src/mocks/react-native-reanimated.web.js');
const STUB_MAPS       = require.resolve('./src/mocks/react-native-maps.web.js');
const STUB_GESTURE    = require.resolve('./src/mocks/react-native-gesture-handler.web.js');
const STUB_LOCATION   = require.resolve('./src/mocks/expo-location.web.js');

// Directorio raiz de react-native-reanimated en node_modules
const REANIMATED_ROOT = path.dirname(
  require.resolve('react-native-reanimated/package.json')
);
const GESTURE_ROOT = path.dirname(
  require.resolve('react-native-gesture-handler/package.json')
);

// ── Mapa de módulos por nombre exacto ────────────────────────────────────────
const MODULE_STUBS = {
  'react-native-reanimated':      STUB_REANIMATED,
  'react-native-maps':            STUB_MAPS,
  'react-native-gesture-handler': STUB_GESTURE,
  'expo-location':                STUB_LOCATION,
};

// ── Resolver personalizado ────────────────────────────────────────────────────
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isWebBuild =
    platform === 'web' ||
    process.env.EXPO_METRO_PLATFORM_WEB === '1';

  if (!isWebBuild) {
    return context.resolveRequest(context, moduleName, platform);
  }

  // 1. Interceptar por nombre exacto del paquete
  if (MODULE_STUBS[moduleName]) {
    return { filePath: MODULE_STUBS[moduleName], type: 'sourceFile' };
  }

  // 2. Interceptar sub-paths de react-native-reanimated
  //    (e.g. 'react-native-reanimated/lib/module/index')
  if (
    moduleName.startsWith('react-native-reanimated/') ||
    moduleName.startsWith('react-native-reanimated\\')
  ) {
    return { filePath: STUB_REANIMATED, type: 'sourceFile' };
  }

  // 3. Interceptar sub-paths de react-native-gesture-handler
  if (
    moduleName.startsWith('react-native-gesture-handler/') ||
    moduleName.startsWith('react-native-gesture-handler\\')
  ) {
    return { filePath: STUB_GESTURE, type: 'sourceFile' };
  }

  // Resolver normal para todo lo demás
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (e) {
    // Si la resolución normal falla para un módulo dentro de node_modules
    // de reanimated o gesture-handler, redirigir al stub
    if (context.originModulePath) {
      const origin = context.originModulePath.replace(/\\/g, '/');
      if (origin.includes('react-native-reanimated/')) {
        return { filePath: STUB_REANIMATED, type: 'sourceFile' };
      }
      if (origin.includes('react-native-gesture-handler/')) {
        return { filePath: STUB_GESTURE, type: 'sourceFile' };
      }
    }
    throw e;
  }
};

// ── Bloquear directorios ESM completos en web ─────────────────────────────────
// Metro permite bloquear rutas via blockList. Bloqueamos el directorio
// lib/module de reanimated para que Metro NUNCA intente cargar archivos ESM
// desde allí — en su lugar el resolveRequest los redirige al stub.
// NOTE: exclusionList no está en el top-level de metro-config; está en
//       metro-config/src/defaults/exclusionList
const exclusionList = require('metro-config/src/defaults/exclusionList');
config.resolver.blockList = exclusionList([
  // Bloquear todos los archivos dentro de lib/module de reanimated
  new RegExp(
    REANIMATED_ROOT.replace(/\\/g, '\\\\').replace(/\//g, '[\\/\\\\]') +
    '[\\/\\\\]lib[\\/\\\\]module[\\/\\\\].*'
  ),
]);

// ── Deshabilitar resolución por campo "exports" de package.json ───────────────
// Algunos paquetes exponen puntos de entrada ESM-only a traves de "exports".
config.resolver.unstable_enablePackageExports = false;

// ── Extensiones adicionales ───────────────────────────────────────────────────
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

// ── Condiciones de resolución CommonJS primero ────────────────────────────────
config.resolver.unstable_conditionNames = ['require', 'default'];

// ── Transformador ─────────────────────────────────────────────────────────────
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  getTransformOptions: async () => ({
    transform: {
      inlineRequires: true,
    },
  }),
};

module.exports = config;
