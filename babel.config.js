module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // ["nativewind/babel"], // temporarily disabled
      ["react-native-reanimated/plugin"],
    ],
  };
};

