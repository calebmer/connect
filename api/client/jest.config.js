module.exports = {
  displayName: require("./package.json").name,
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
  transform: {
    "^.+\\.[jt]sx?$": require.resolve("../server/jest-transformer"),
  },
  globals: {
    __DEV__: false,
    __TEST__: true,
  },
};
