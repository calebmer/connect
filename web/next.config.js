const withTypescript = require("@zeit/next-typescript");
const withTranspileModules = require("next-transpile-modules");
const package = require("./package.json");

module.exports = withTranspileModules(
  withTypescript({
    webpack: config => {
      // Alias all `react-native` imports to `react-native-web`
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "react-native$": "react-native-web",
      };

      return config;
    },

    transpileModules: Object.keys(package.dependencies).filter(name =>
      name.startsWith("@connect"),
    ),
  }),
);
