module.exports = function (api) {
  api.cache(true); // ✅ this line enables proper caching
  return {
    presets: ['babel-preset-expo'],
  };
};
