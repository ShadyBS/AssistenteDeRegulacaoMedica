/**
 * Jest Unit Test Configuration
 * Medical Extension Testing with Security Focus
 */

export default {
  displayName: 'Unit Tests',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/unit/**/*.test.js',
    '<rootDir>/test/unit/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**',
    '!test/**',
    '!scripts/**',
    '!config/**',
    '!build-zips.js',
    '!release.js',
    '!*.config.js'
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/test/setup/unit-setup.js'],
  
  // Module mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },
  
  // Globals for browser extension
  globals: {
    chrome: {},
    browser: {},
    AssistenteRegulacao: {}
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout for async operations
  testTimeout: 10000,
  
  // Mock configuration for browser APIs
  setupFiles: ['<rootDir>/test/mocks/browser-mocks.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for medical compliance tracking
  verbose: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Medical data security testing
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/unit',
      filename: 'unit-test-report.html',
      pageTitle: 'Assistente de Regulação - Unit Tests',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ]
};
