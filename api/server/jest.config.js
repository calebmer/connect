module.exports = {
  displayName: require("./package.json").name,
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
  clearMocks: true,
  globalSetup: require.resolve("./jest-global-setup"),
  globalTeardown: require.resolve("./jest-global-teardown"),
  transform: {
    "^.+\\.[jt]sx?$": require.resolve("./jest-transformer"),
  },
};
