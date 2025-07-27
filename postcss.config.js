/**
 * PostCSS Configuration - Assistente de Regulação Médica
 * 
 * Configuração para otimização de CSS com:
 * - Autoprefixer para compatibilidade cross-browser
 * - CSSnano para minificação em produção
 * - Otimizações específicas para extensões
 */

module.exports = {
  plugins: [
    // Autoprefixer para compatibilidade cross-browser
    require('autoprefixer')({
      overrideBrowserslist: [
        'Chrome >= 88',
        'Firefox >= 78',
        'Edge >= 88'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    }),
    
    // CSSnano para minificação em produção
    ...(process.env.NODE_ENV === 'production' ? [
      require('cssnano')({
        preset: ['default', {
          // Configurações específicas para extensões
          discardComments: {
            removeAll: true
          },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true,
          minifyFontValues: true,
          convertValues: {
            length: false // Preserva unidades para compatibilidade
          },
          calc: {
            precision: 3
          },
          colormin: true,
          orderedValues: true,
          uniqueSelectors: true,
          mergeRules: true,
          mergeLonghand: true,
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: true,
          normalizeUrl: false, // Preserva URLs para extensões
          svgo: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    removeViewBox: false,
                    cleanupIDs: false
                  }
                }
              }
            ]
          }
        }]
      })
    ] : [])
  ]
};