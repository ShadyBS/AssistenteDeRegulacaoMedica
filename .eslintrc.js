/**
 * ESLint Configuration - Assistente de Regulação Médica
 *
 * Configuração específica para extensões de navegador com:
 * - Regras para Manifest V3
 * - Compatibilidade cross-browser
 * - Práticas de segurança
 * - Padrões de código médico
 */

module.exports = {
  // Ambiente de execução
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true
  },

  // Parser e configurações
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },

  // Extensões de configuração
  extends: [
    'eslint:recommended'
  ],

  // Plugins específicos
  plugins: [
    'webextensions'
  ],

  // Variáveis globais
  globals: {
    // Browser APIs
    chrome: 'readonly',
    browser: 'readonly',

    // Extension específicos
    globalThis: 'readonly',

    // Bibliotecas incluídas
    BrowserAPI: 'readonly',

    // Classes do projeto
    MemoryManager: 'readonly',
    SectionManager: 'readonly',
    TimelineManager: 'readonly',
    KeepAliveManager: 'readonly'
  },

  // Regras personalizadas
  rules: {
    // === REGRAS GERAIS ===

    // Qualidade de código
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Variáveis
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',

    // === REGRAS ESPECÍFICAS PARA EXTENSÕES ===

    // Manifest V3 compliance
    'webextensions/no-browser-tabs-executescript': 'error',
    'webextensions/no-browser-tabs-insertcss': 'error',

    // === REGRAS DE SEGURANÇA ===

    // Prevenção de XSS
    'no-script-url': 'error',

    // innerHTML seguro
    'no-unsanitized/property': 'off', // Seria ideal ter este plugin

    // === REGRAS DE COMPATIBILIDADE ===

    // Preferir APIs compatíveis
    'prefer-const': 'error',
    'no-var': 'error',

    // === REGRAS DE ESTILO ===

    // Indentação e formatação
    'indent': ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1
    }],
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],

    // Espaçamento
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',

    // Linhas
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'max-len': ['warn', {
      code: 120,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],

    // === REGRAS ESPECÍFICAS DO PROJETO ===

    // Nomenclatura
    'camelcase': ['error', {
      properties: 'never',
      ignoreDestructuring: true,
      allow: [
        // Permitir snake_case para APIs externas
        'host_permissions',
        'content_scripts',
        'background_page',
        'browser_action',
        'page_action',
        'web_accessible_resources'
      ]
    }],

    // Funções
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',

    // Objetos e arrays
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-spacing': ['error', { before: false, after: true }],

    // === REGRAS MÉDICAS/ESPECÍFICAS ===

    // Comentários obrigatórios para funções médicas críticas
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: false,
        MethodDefinition: false,
        ClassDeclaration: false,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }],

    // Complexidade
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],

    // === REGRAS DESABILITADAS ===

    // Estas regras podem ser muito restritivas para extensões
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'off'
  },

  // Configurações específicas por arquivo
  overrides: [
    // Background scripts
    {
      files: ['background.js', '**/background/**/*.js'],
      rules: {
        'no-console': 'off', // Permitir console em background para debugging
        'webextensions/no-browser-tabs-executescript': 'off' // Background pode usar estas APIs
      },
      globals: {
        importScripts: 'readonly'
      }
    },

    // Content scripts
    {
      files: ['content-script.js', '**/content/**/*.js'],
      env: {
        browser: true
      },
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error'] }] // Limitar console em content scripts
      },
      globals: {
        // DOM APIs específicas
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly'
      }
    },

    // Scripts de build
    {
      files: ['scripts/**/*.js', 'webpack.config.js', '.eslintrc.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off', // Permitir console em scripts de build
        'no-process-exit': 'off'
      }
    },

    // Arquivos de configuração
    {
      files: ['*config.js', '*Config.js'],
      rules: {
        'no-unused-vars': 'off' // Configurações podem ter variáveis não usadas
      }
    },

    // Managers
    {
      files: ['*Manager.js'],
      rules: {
        'max-lines': ['warn', 300], // Managers podem ser maiores
        'complexity': ['warn', 20]
      }
    },

    // Testes (se houver)
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'max-len': 'off'
      }
    }
  ],

  // Configurações de relatório
  reportUnusedDisableDirectives: true
};
