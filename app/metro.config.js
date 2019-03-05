/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */

const path = require("path");

module.exports = {
  projectRoot: path.resolve(__dirname, ".."),
  resolver: {
    sourceExts: ["js", "jsx", "ts", "tsx"],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
