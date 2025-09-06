module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',          // <-- required for expo-router
      'react-native-reanimated/plugin', // keep LAST if you use Reanimated
    ],
  };
};
