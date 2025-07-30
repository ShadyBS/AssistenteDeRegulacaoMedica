/**
 * Webpack Configuration - Assistente de Regulação Médica
 *
 * Configuração otimizada para build de extensão de navegador com:
 * - Chrome/Edge (Manifest V3)
 * - Firefox (Manifest V3)
 * - Tree shaking agressivo
 * - Code splitting inteligente
 * - Bundle size otimizado
 * - Lazy loading de módulos
 */

const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const target = env.target || 'chrome'; // chrome or firefox
  const isDevelopment = !isProduction;
  const analyze = env.analyze === 'true';

  console.log(`🔧 Webpack build: ${target} (${isProduction ? 'production' : 'development'})`);
  if (analyze) console.log('📊 Bundle analysis enabled');

  // Configurações específicas por target
  const targetConfigs = {
    chrome: {
      manifestSource: 'manifest-edge.json',
      outputPath: path.resolve(__dirname, '.dist', 'chrome'),
      description: 'Chrome/Edge/Chromium'
    },
    firefox: {
      manifestSource: 'manifest.json',
      outputPath: path.resolve(__dirname, '.dist', 'firefox'),
      description: 'Firefox/Mozilla'
    }
  };

  const config = targetConfigs[target];

  if (!config) {
    throw new Error(`Target inválido: ${target}. Use 'chrome' ou 'firefox'`);
  }

  return {
    // Modo de desenvolvimento ou produção
    mode: isProduction ? 'production' : 'development',

    // Source maps otimizados
    devtool: isProduction ? false : 'cheap-module-source-map', // Remove source maps em produção para reduzir tamanho

    // Entry points otimizados com lazy loading
    entry: {
      // Core scripts (sempre carregados)
      background: './background.js',
      'content-script': './content-script.js',

      // UI scripts (carregados sob demanda)
      sidebar: {
        import: './sidebar.js',
        dependOn: 'shared'
      },
      options: {
        import: './options.js',
        dependOn: 'shared'
      },

      // Shared dependencies
      shared: ['./api-constants.js', './validation.js', './utils.js']
    },

    // Configuração de output otimizada
    output: {
      path: config.outputPath,
      filename: (pathData) => {
        // Nomes otimizados para cache busting
        const isShared = pathData.chunk.name === 'shared';
        return isShared ? 'shared/[name].[contenthash:8].js' : '[name].js';
      },
      chunkFilename: 'chunks/[name].[contenthash:8].js',
      clean: true,
      // Configurações otimizadas para extensões
      environment: {
        arrowFunction: true, // Habilita arrow functions para código mais compacto
        bigIntLiteral: false,
        const: true, // Habilita const para melhor otimização
        destructuring: true, // Habilita destructuring
        dynamicImport: false, // Desabilita dynamic imports por segurança
        forOf: true,
        module: false,
      },
    },

    // Configuração de módulos otimizada
    module: {
      rules: [
        // CSS/Tailwind com otimizações
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: false,
                sourceMap: !isProduction
              }
            },
            // PostCSS para otimizações adicionais
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer'],
                    ...(isProduction ? [['cssnano', { preset: 'default' }]] : [])
                  ]
                }
              }
            }
          ],
        },

        // JavaScript com otimizações agressivas
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    chrome: '88',
                    firefox: '78'
                  },
                  modules: false, // Preserva ES modules para tree shaking
                  useBuiltIns: 'usage',
                  corejs: 3,
                  // Otimizações específicas
                  bugfixes: true,
                  shippedProposals: true
                }]
              ],
              plugins: [
                // Plugins para redução de bundle size
                ...(isProduction ? [
                  ['transform-remove-console', { exclude: ['error', 'warn'] }],
                  ['transform-remove-debugger']
                ] : [])
              ],
              // Cache para builds mais rápidos
              cacheDirectory: true,
              cacheCompression: false
            }
          }
        },

        // Assets otimizados
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb - inline pequenos assets
            }
          },
          generator: {
            filename: 'assets/[name].[hash:8][ext]'
          }
        },

        // Fonts otimizados
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]'
          }
        },
      ],
    },

    // Plugins otimizados
    plugins: [
      // Extração de CSS otimizada
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'styles/[name].[contenthash:8].css',
          chunkFilename: 'styles/[name].[contenthash:8].css',
          ignoreOrder: true // Ignora ordem de CSS para melhor otimização
        })
      ] : []),

      // Bundle analyzer (apenas quando solicitado)
      ...(analyze ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: `bundle-analysis-${target}.html`
        })
      ] : []),

      // Copia arquivos estáticos com otimizações
      new CopyWebpackPlugin({
        patterns: [
          // Manifest específico do target
          {
            from: config.manifestSource,
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());

              // Otimizações específicas do target
              if (target === 'chrome') {
                if (manifest.background && manifest.background.scripts) {
                  manifest.background = {
                    service_worker: manifest.background.scripts[0]
                  };
                }
              }

              // Remove campos desnecessários em produção
              if (isProduction) {
                delete manifest.developer;
                delete manifest.homepage_url;
              }

              return JSON.stringify(manifest, null, isProduction ? 0 : 2);
            }
          },

          // HTML files com minificação
          {
            from: '*.html',
            to: '[name][ext]',
            transform: isProduction ? (content) => {
              // Minificação básica de HTML
              return content.toString()
                .replace(/\s+/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
            } : undefined,
            globOptions: {
              ignore: ['**/node_modules/**']
            }
          },

          // Ícones (apenas necessários)
          {
            from: 'icons/',
            to: 'icons/',
            noErrorOnMissing: true,
            globOptions: {
              ignore: isProduction ? ['**/*.svg'] : [] // Remove SVGs em produção se não usados
            }
          },

          // CSS compilado do Tailwind
          {
            from: 'dist/output.css',
            to: 'dist/output.css',
            noErrorOnMissing: true
          },

          // Browser polyfill (apenas se necessário)
          {
            from: 'browser-polyfill.js',
            to: 'browser-polyfill.js',
            noErrorOnMissing: true
          },

          // Arquivos essenciais apenas
          {
            from: 'api-constants.js',
            to: 'api-constants.js'
          },
          {
            from: 'validation.js',
            to: 'validation.js'
          },
          {
            from: 'utils.js',
            to: 'utils.js'
          },

          // Managers (lazy loaded)
          {
            from: '*Manager.js',
            to: 'managers/[name][ext]',
            noErrorOnMissing: true
          },

          // API files
          {
            from: 'api.js',
            to: 'api.js'
          },
          {
            from: 'store.js',
            to: 'store.js'
          },
          {
            from: 'renderers.js',
            to: 'renderers.js'
          },

          // UI components (apenas se existirem)
          {
            from: 'ui/',
            to: 'ui/',
            noErrorOnMissing: true,
            globOptions: {
              ignore: isProduction ? ['**/*.md', '**/*.txt'] : []
            }
          }
        ],
      }),
    ],

    // Otimizações agressivas
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Otimizações agressivas para redução de tamanho
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
              passes: 2, // Múltiplas passadas de otimização
              unsafe: false, // Mantém segurança para extensões
              unsafe_comps: false,
              unsafe_math: false,
              unsafe_proto: false,
              // Otimizações específicas
              dead_code: true,
              evaluate: true,
              if_return: true,
              join_vars: true,
              reduce_vars: true,
              unused: true,
              // Preserva funcionalidade de extensão
              keep_fargs: false,
              keep_infinity: true
            },
            mangle: {
              // Preserva nomes importantes para extensões
              keep_fnames: /^(chrome|browser|webextension)/,
              reserved: ['chrome', 'browser', 'webextension'],
              safari10: true
            },
            format: {
              comments: false,
              ascii_only: true, // Melhor compatibilidade
              ecma: 2018
            },
            ecma: 2018,
            safari10: true
          },
          extractComments: false,
          parallel: true
        }),
      ],

      // Code splitting inteligente
      splitChunks: {
        chunks: 'all',
        minSize: 20000, // 20kb mínimo para criar chunk
        maxSize: 200000, // 200kb máximo por chunk
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true
          },

          // Shared utilities
          shared: {
            name: 'shared',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            test: /\.(js)$/,
            enforce: true
          },

          // CSS comum
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true
          }
        },
      },

      // Tree shaking agressivo
      usedExports: true,
      sideEffects: false, // Habilita tree shaking agressivo

      // Otimização de módulos
      moduleIds: isProduction ? 'deterministic' : 'named',
      chunkIds: isProduction ? 'deterministic' : 'named',

      // Concatenação de módulos
      concatenateModules: isProduction,

      // Remoção de módulos vazios
      removeEmptyChunks: true,

      // Merge de chunks duplicados
      mergeDuplicateChunks: true,

      // Otimização de imports
      providedExports: true,
      innerGraph: true
    },

    // Configurações de resolução otimizadas
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        // Aliases para imports mais eficientes
        '@': path.resolve(__dirname),
        '@ui': path.resolve(__dirname, 'ui'),
        '@managers': path.resolve(__dirname),
        '@utils': path.resolve(__dirname, 'utils.js'),
        '@api': path.resolve(__dirname, 'api.js'),
        '@constants': path.resolve(__dirname, 'api-constants.js')
      },
      // Cache de resolução
      cache: true,
      // Otimização de busca de módulos
      modules: ['node_modules'],
      // Fallbacks desnecessários removidos
      fallback: false
    },

    // Configurações específicas para extensões
    target: 'web',

    // Externals otimizados
    externals: {
      // Browser APIs fornecidas pelo navegador
      'chrome': 'chrome',
      'browser': 'browser'
    },

    // Configurações de desenvolvimento
    ...(isDevelopment && {
      watchOptions: {
        ignored: /node_modules/,
        poll: 1000,
        aggregateTimeout: 300
      }
    }),

    // Configurações de performance otimizadas
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 300000, // 300kb (reduzido de 512kb)
      maxAssetSize: 300000,
      assetFilter: (assetFilename) => {
        // Ignora arquivos que não afetam performance
        return !assetFilename.endsWith('.map') &&
               !assetFilename.endsWith('.html') &&
               !assetFilename.includes('icons/');
      }
    },

    // Configurações de stats otimizadas
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false,
      excludeAssets: /\.(map|txt|html|jpg|png|svg)$/,
      // Mostra informações de otimização
      optimizationBailout: isProduction,
      reasons: false,
      source: false,
      timings: true,
      version: false,
      warnings: true,
      errors: true,
      errorDetails: true
    },

    // Cache para builds mais rápidos
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },

    // Experiments para funcionalidades avançadas
    experiments: {
      // Habilita otimizações futuras
      topLevelAwait: false, // Desabilitado para compatibilidade com extensões
      outputModule: false
    }
  };
};

// Função helper para verificar se arquivo existe
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Exporta também configurações para uso em outros scripts
module.exports.targetConfigs = {
  chrome: {
    manifestSource: 'manifest-edge.json',
    outputPath: path.resolve(__dirname, '.dist', 'chrome'),
    description: 'Chrome/Edge/Chromium'
  },
  firefox: {
    manifestSource: 'manifest.json',
    outputPath: path.resolve(__dirname, '.dist', 'firefox'),
    description: 'Firefox/Mozilla'
  }
};
