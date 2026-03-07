module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // IMPORTANTE: react-native-reanimated/plugin debe ir de ultimo.
      // En web, metro.config.js reemplaza el paquete por un stub CJS
      // antes de que este plugin intente procesarlo, asi que no interfiere.
      'react-native-reanimated/plugin',
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
    ],
  };
};
