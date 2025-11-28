module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  errorOnDeprecated: false,
  testTimeout: 10000,
};
