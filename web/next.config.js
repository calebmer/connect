const withTypescript = require("@zeit/next-typescript");
const withTranspileModules = require("next-transpile-modules");
const package = require("./package.json");

module.exports = withTranspileModules(
  withTypescript({
    webpack: (config, {isServer}) => {
      // Alias all `react-native` imports to `react-native-web`
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "react-native$": "react-native-web",
      };

      // When building for server-side rendering we might want to conditionally
      // build a different file entirely. We will pick the server-side file
      // before picking the client-side file.
      if (isServer) {
        config.resolve.extensions.push(
          ".web.server.js",
          ".web.server.jsx",
          ".web.server.ts",
          ".web.server.tsx",
        );
      }

      // Add extensions for conditionally building React Native Web
      // platform files.
      config.resolve.extensions.push(
        ".web.js",
        ".web.jsx",
        ".web.ts",
        ".web.tsx",
      );

      return config;
    },

    transpileModules: Object.keys(package.dependencies).filter(name =>
      name.startsWith("@connect"),
    ),
  }),
);
