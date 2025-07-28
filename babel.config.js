/**
 * Babel Configuration - Assistente de Regulação Médica
 *
 * Configuração para transpilação e otimização de JavaScript com:
 * - Suporte para Chrome 88+ e Firefox 78+
 * - Tree shaking preservado
 * - Otimizações para bundle size
 * - Remoção de código debug em produção
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Targets específicos para extensões de navegador
        targets: {
          chrome: '88',
          firefox: '78',
          edge: '88'
        },

        // Preserva ES modules para tree shaking
        modules: false,

        // Polyfills automáticos baseados no uso
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true
        },

        // Otimizações específicas
        bugfixes: true,
        shippedProposals: true,

        // Configurações de debug
        debug: process.env.NODE_ENV === 'development',

        // Inclui apenas polyfills necessários
        include: [
          // Funcionalidades específicas que podem ser necessárias
          'es.promise',
          'es.array.includes',
          'es.object.assign'
        ],

        // Exclui polyfills desnecessários para navegadores modernos
        exclude: [
          'es.array.iterator',
          'es.promise.finally',
          'web.dom-collections.iterator'
        ]
      }
    ]
  ],

  plugins: [
    // Plugins para produção (otimização de bundle size)
    ...(process.env.NODE_ENV === 'production' ? [
      // Remove console.log, console.info, console.debug
      [
        'transform-remove-console',
        {
          exclude: ['error', 'warn'] // Preserva console.error e console.warn
        }
      ],

      // Remove debugger statements
      'transform-remove-debugger'
    ] : []),

    // Plugins para desenvolvimento
    ...(process.env.NODE_ENV === 'development' ? [
      // Adiciona nomes de função para debugging
      '@babel/plugin-transform-function-name'
    ] : [])
  ],

  // Configurações de cache
  cacheDirectory: true,
  cacheCompression: false,

  // Configura��ões específicas por ambiente
  env: {
    production: {
      plugins: [
        // Otimizações adicionais para produção
        [
          'transform-remove-console',
          {
            exclude: ['error', 'warn']
          }
        ],
        'transform-remove-debugger'
      ]
    },

    development: {
      // Configurações para desenvolvimento
      compact: false,
      comments: true
    },

    test: {
      // Configurações para testes
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            }
          }
        ]
      ]
    }
  },

  // Ignora node_modules por padrão
  ignore: [
    'node_modules/**',
    '**/*.min.js'
  ],

  // Configurações de parsing
  parserOpts: {
    strictMode: true,
    allowImportExportEverywhere: false,
    allowReturnOutsideFunction: false
  },

  // Configurações de geração de código
  generatorOpts: {
    compact: process.env.NODE_ENV === 'production',
    comments: process.env.NODE_ENV !== 'production',
    minified: process.env.NODE_ENV === 'production'
  }
};
