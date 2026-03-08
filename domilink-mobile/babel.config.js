module.exports = function (api) {
  api.cache(true);

  // react-native-reanimated/plugin solo es necesario en nativo (iOS/Android).
  // En web Metro sustituye el paquete por un stub CJS antes de bundle,
  // por lo que el plugin no tiene efecto util y puede generar errores
  // si intenta procesar codigo que ya fue reemplazado.
  const isWeb =
    process.env.EXPO_METRO_PLATFORM_WEB === '1' ||
    process.env.BABEL_ENV === 'web' ||
    process.argv.some(a => a === 'web');

  const plugins = [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      // safe: false permite que el build continue aunque el .env no tenga
      // todas las variables definidas en .env.example
      safe: false,
      // allowUndefined: true evita que crash si se importa una variable
      // que no existe en el .env
      allowUndefined: true,
    }],
  ];

  // Solo agregar el plugin de reanimated en builds nativos
  if (!isWeb) {
    // IMPORTANTE: reanimated/plugin DEBE ir al final de la lista de plugins.
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
