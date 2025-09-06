module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // includes expo-router in SDK ≥50
    plugins: [
      // keep LAST if you actually use Reanimated; remove if you don't
      'react-native-reanimated/plugin',
    ],
  };
};
