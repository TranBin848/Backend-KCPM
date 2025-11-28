module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
  ],
  testTimeout: 10000,
};
