// backend/jest.config.js
// ═══════════════════════════════════════════════════════════════════════════════
// Configuration Jest pour Cabinet+ (ESM + Node.js)
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Use experimental VM modules to support ES Modules (package.json "type":"module")
  testEnvironment: 'node',

  // Transform ES module imports — using babel-jest
  transform: {},

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '!**/tests/setup/**',
    '!**/node_modules/**',
  ],

  // Setup file run after each test framework is installed
  setupFilesAfterEnv: ['./tests/setup/jest.setup.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Timeout per test (30 seconds for DB operations)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Don't run tests in parallel when using real DB
  maxWorkers: 1,
};

