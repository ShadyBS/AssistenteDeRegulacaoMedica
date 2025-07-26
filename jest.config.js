/**
 * Jest Configuration - Assistente de Regulação Médica
 * 
 * Configuração para testes unitários e de integração
 * Específica para extensões de navegador com Manifest V3
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'jsdom',
  
  // Diretórios de teste
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Arquivos a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-zips/',
    '/.dist/',
    '/.vscode/',
    '/scripts/'
  ],
  
  // Configuração de cobertura
  collectCoverage: true,
  collectCoverageFrom: [
    '*.js',
    '!node_modules/**',
    '!dist/**',
    '!dist-zips/**',
    '!.dist/**',
    '!scripts/**',
    '!webpack.config.js',
    '!jest.config.js',
    '!.eslintrc.js',
    '!tailwind.config.js',
    '!build-zips.js',
    '!release.js'
  ],
  
  // Threshold de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Relatórios de cobertura
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Diretório de cobertura
  coverageDirectory: 'coverage',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Mocks globais
  globals: {
    'chrome': {},
    'browser': {},
    'globalThis': {
      chrome: {},
      browser: {}
    }
  },
  
  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@ui/(.*)$': '<rootDir>/ui/$1'
  },
  
  // Setup para extensões de navegador
  setupFiles: [
    '<rootDir>/jest.polyfills.js'
  ],
  
  // Configurações específicas para extensões
  testEnvironmentOptions: {
    url: 'https://sigss.saude.gov.br/'
  },
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Configurações de mock
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Configurações de watch
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-zips/',
    '/.dist/'
  ]
};