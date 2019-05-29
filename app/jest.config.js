module.exports = {
  displayName: require("./package.json").name,
  preset: "react-native",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[tj]s?(x)"],
  clearMocks: true,
  transform: {
    "^.+\\.[jt]sx?$": require.resolve("react-native/jest/preprocessor.js"),
  },
};
