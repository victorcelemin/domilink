const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Stubs web: paquetes que solo tienen build ESM y rompen Metro web ─────────
//
// react-native-reanimated ~3.6 solo distribuye lib/module/ (ESM puro).
// Metro para web no lo transpila → "Unexpected token 'export'" en el bundle.
// Lo sustituimos por un stub CJS que delega en el Animated de React Native.
//
// react-native-maps tampoco funciona en web → stub con placeholder visual.
//
// IMPORTANTE: Metro puede pasar platform=null para resolutions que vienen
// de dentro de node_modules (e.g. gesture-handler → reanimated). Para esos
// casos usamos EXPO_METRO_PLATFORM_WEB (seteado en vercel.json buildCommand)
// como fallback, o detectamos via originModulePath que el build es web.
const WEB_STUBS = {
  'react-native-reanimated': require.resolve('./src/mocks/react-native-reanimated.web.js'),
  'react-native-maps':       require.resolve('./src/mocks/react-native-maps.web.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // platform puede ser 'web', null, o undefined dependiendo de si la
  // resolution viene de user-code vs node_modules internos.
  const isWebBuild =
    platform === 'web' ||
    process.env.EXPO_METRO_PLATFORM_WEB === '1';

  if (isWebBuild && WEB_STUBS[moduleName]) {
    return { filePath: WEB_STUBS[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ── Deshabilitar resolucion por campo "exports" de package.json ───────────────
// Algunos paquetes exponen puntos de entrada ESM-only a traves de "exports".
// Metro para web no puede manejarlos y produce "Unexpected token 'export'".
config.resolver.unstable_enablePackageExports = false;

// ── Extensiones adicionales ───────────────────────────────────────────────────
// Permite que Metro resuelva archivos .cjs y .mjs (formatos duales CJS/ESM).
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

// ── Condiciones de resolucion CommonJS primero ────────────────────────────────
// Prioriza la entrada "require" (CJS) sobre "import" (ESM) en package.json.
// Evita que Metro cargue el entry point ESM de paquetes dual-format.
config.resolver.unstable_conditionNames = ['require', 'default'];

// ── Transformador ─────────────────────────────────────────────────────────────
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  getTransformOptions: async () => ({
    transform: {
      // inlineRequires mejora el tiempo de inicio y evita ESM sin transpilar
      // en el bundle final al convertir imports en requires inline.
      inlineRequires: true,
    },
  }),
};

module.exports = config;
