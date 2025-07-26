/**
 * Webpack Configuration - Assistente de Regulação Médica
 * 
 * Configuração para build de extensão de navegador com suporte a:
 * - Chrome/Edge (Manifest V3)
 * - Firefox (Manifest V3)
 * - Hot reload para desenvolvimento
 * - Otimizações para produção
 */

const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const target = env.target || 'chrome'; // chrome or firefox
  const isDevelopment = !isProduction;
  
  console.log(`🔧 Webpack build: ${target} (${isProduction ? 'production' : 'development'})`);
  
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
    
    // Source maps para debugging
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    
    // Entry points para diferentes scripts da extensão
    entry: {
      background: './background.js',
      'content-script': './content-script.js',
      sidebar: './sidebar.js',
      options: './options.js',
      // Adicione outros entry points conforme necessário
    },
    
    // Configuração de output
    output: {
      path: config.outputPath,
      filename: '[name].js',
      clean: true, // Limpa o diretório de output antes do build
      environment: {
        // Configurações para compatibilidade com extensões
        arrowFunction: false,
        bigIntLiteral: false,
        const: false,
        destructuring: false,
        dynamicImport: false,
        forOf: false,
        module: false,
      },
    },
    
    // Configuração de módulos
    module: {
      rules: [
        // CSS/Tailwind
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        
        // JavaScript (se precisar de transpilação)
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
                  modules: false
                }]
              ]
            }
          }
        },
        
        // Assets (imagens, ícones, etc.)
        {
          test: /\.(png|jpg|jpeg|gif|svg|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]'
          }
        },
        
        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]'
          }
        },
      ],
    },
    
    // Plugins
    plugins: [
      // Extração de CSS em produção
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].css',
        })
      ] : []),
      
      // Copia arquivos estáticos
      new CopyWebpackPlugin({
        patterns: [
          // Manifest específico do target
          {
            from: config.manifestSource,
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              
              // Aplicar transformações específicas se necessário
              if (target === 'chrome') {
                // Otimizações específicas para Chrome
                if (manifest.background && manifest.background.scripts) {
                  manifest.background = {
                    service_worker: manifest.background.scripts[0]
                  };
                }
              }
              
              return JSON.stringify(manifest, null, 2);
            }
          },
          
          // HTML files
          {
            from: '*.html',
            to: '[name][ext]',
            globOptions: {
              ignore: ['**/node_modules/**']
            }
          },
          
          // Ícones
          {
            from: 'icons/',
            to: 'icons/',
            noErrorOnMissing: true
          },
          
          // CSS compilado do Tailwind
          {
            from: 'dist/output.css',
            to: 'dist/output.css',
            noErrorOnMissing: true
          },
          
          // Outros assets necessários
          {
            from: 'browser-polyfill.js',
            to: 'browser-polyfill.js',
            noErrorOnMissing: true
          },
          
          // Arquivos de configuração e dados
          {
            from: '*-config.js',
            to: '[name][ext]',
            noErrorOnMissing: true
          },
          
          // Managers
          {
            from: '*Manager.js',
            to: '[name][ext]',
            noErrorOnMissing: true
          },
          
          // Outros arquivos JS necessários
          {
            from: 'api*.js',
            to: '[name][ext]',
            noErrorOnMissing: true
          },
          {
            from: 'utils.js',
            to: 'utils.js',
            noErrorOnMissing: true
          },
          {
            from: 'validation.js',
            to: 'validation.js',
            noErrorOnMissing: true
          },
          {
            from: 'store.js',
            to: 'store.js',
            noErrorOnMissing: true
          },
          {
            from: 'renderers.js',
            to: 'renderers.js',
            noErrorOnMissing: true
          },
          
          // UI components
          {
            from: 'ui/',
            to: 'ui/',
            noErrorOnMissing: true
          }
        ],
      }),
    ],
    
    // Otimizações
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction, // Remove console.log em produção
              drop_debugger: isProduction,
            },
            mangle: {
              // Preserva nomes de funções importantes para extensões
              keep_fnames: /^(chrome|browser|webextension)/,
            },
            format: {
              comments: false, // Remove comentários
            },
          },
          extractComments: false,
        }),
      ],
      
      // Split chunks para otimização (cuidado com extensões)
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
    
    // Configurações de resolução
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        // Aliases úteis para imports
        '@': path.resolve(__dirname),
        '@ui': path.resolve(__dirname, 'ui'),
        '@managers': path.resolve(__dirname),
      },
    },
    
    // Configurações específicas para extensões
    target: 'web',
    
    // Externals (bibliotecas que não devem ser bundled)
    externals: {
      // Browser APIs são fornecidas pelo navegador
      'chrome': 'chrome',
      'browser': 'browser',
    },
    
    // Configurações de desenvolvimento
    ...(isDevelopment && {
      watchOptions: {
        ignored: /node_modules/,
        poll: 1000, // Polling para sistemas que não suportam file watching
      },
      
      // Configurações de dev server (não aplicável para extensões, mas útil para debugging)
      devServer: {
        static: {
          directory: config.outputPath,
        },
        compress: true,
        port: 9000,
        hot: false, // Hot reload não funciona bem com extensões
      },
    }),
    
    // Configurações de performance
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 512kb
      maxAssetSize: 512000,
    },
    
    // Configurações de stats (output do build)
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false,
      excludeAssets: /\.(map|txt|html|jpg|png|svg)$/,
    },
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