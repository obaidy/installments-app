module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Keep reanimated plugin last if you're using it
    plugins: ['react-native-reanimated/plugin'],
  };
};
