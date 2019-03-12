module.exports = {
  displayName: require("./package.json").name,
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
  clearMocks: true,
  transform: {
    "^.+\\.[jt]sx?$": require.resolve("./jest-transformer"),
  },
};
