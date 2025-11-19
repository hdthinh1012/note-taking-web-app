module.exports = {
  testEnvironment: 'node',
  // Allow Jest to transform ESM modules like uuid
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  // Use babel-jest to transform both our code and ESM packages
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  // Increase timeout for integration tests
  testTimeout: 60000,
  setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
};
