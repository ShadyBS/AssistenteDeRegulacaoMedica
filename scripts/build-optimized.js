#!/usr/bin/env node

/**
 * Build Script Otimizado - Assistente de Regulação Médica
 * 
 * Script otimizado que inclui APENAS os arquivos necessários para a extensão
 * funcionar no navegador, usando abordagem de whitelist para máxima segurança
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, '.dist');
const DIST_ZIPS_DIR = path.join(PROJECT_ROOT, 'dist-zips');

// Configurações de build por target
const BUILD_CONFIGS = {
  chrome: {
    manifestSource: 'manifest-edge.json',
    outputDir: path.join(DIST_DIR, 'chrome'),
    zipPrefix: 'AssistenteDeRegulacao-chrome',
    description: 'Chrome/Edge/Chromium'
  },
  firefox: {
    manifestSource: 'manifest.json',
    outputDir: path.join(DIST_DIR, 'firefox'),
    zipPrefix: 'AssistenteDeRegulacao-firefox',
    description: 'Firefox/Mozilla'
  }
};

// WHITELIST: Arquivos PERMITIDOS na extensão (apenas o essencial)
const EXTENSION_FILES = {
  // Core da extensão (obrigatórios)
  files: [
    'background.js',
    'content-script.js',
    'sidebar.js',
    'sidebar.html',
    'options.js',
    'options.html',
    
    // APIs e utilitários essenciais
    'api.js',
    'api-constants.js',
    'utils.js',
    'validation.js',
    'store.js',
    'config.js',
    'renderers.js',
    'logger.js',
    
    // Managers necessários para funcionamento
    'MemoryManager.js',
    'KeepAliveManager.js',
    'SectionManager.js',
    'TimelineManager.js',
    
    // Parsers e configurações específicas
    'consultation-parser.js',
    'field-config.js',
    'filter-config.js',
    
    // Utilitários de segurança
    'crypto-utils.js',
    'BrowserAPI.js',
    
    // Polyfills para compatibilidade
    'browser-polyfill.js',
    
    // Páginas de ajuda
    'help.html',
    'help.js'
  ],
  
  // Diretórios permitidos (com filtros internos)
  directories: [
    {
      name: 'icons',
      filter: (file) => /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(file)
    },
    {
      name: 'dist',
      filter: (file) => file === 'output.css' || /\.(css|js)$/i.test(file)
    },
    {
      name: 'ui',
      filter: (file) => /\.(js|html|css)$/i.test(file)
    }
  ]
};

/**
 * Classe otimizada para build da extensão
 */
class OptimizedExtensionBuilder {
  constructor(options = {}) {
    this.targets = options.targets || ['chrome', 'firefox'];
    this.isProduction = options.production !== false;
    this.verbose = options.verbose || false;
    
    this.log('🚀 Iniciando OptimizedExtensionBuilder');
    this.log(`   Targets: ${this.targets.join(', ')}`);
    this.log(`   Modo: ${this.isProduction ? 'Produção' : 'Desenvolvimento'}`);
  }

  /**
   * Logging com timestamp
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Valida ambiente antes do build
   */
  async validateEnvironment() {
    this.log('🔍 Validando ambiente...');

    // Verifica se os manifests existem
    for (const target of this.targets) {
      const config = BUILD_CONFIGS[target];
      const manifestPath = path.join(PROJECT_ROOT, config.manifestSource);
      
      if (!await fs.pathExists(manifestPath)) {
        throw new Error(`Manifest não encontrado: ${config.manifestSource}`);
      }
    }

    // Verifica se o CSS foi compilado
    const cssPath = path.join(PROJECT_ROOT, 'dist', 'output.css');
    if (!await fs.pathExists(cssPath)) {
      this.log('⚠️  CSS não encontrado, compilando...', 'warn');
      await this.buildCSS();
    }

    this.log('✅ Ambiente validado', 'success');
  }

  /**
   * Compila CSS com Tailwind
   */
  async buildCSS() {
    this.log('🎨 Compilando CSS...');
    
    try {
      const inputPath = path.join(PROJECT_ROOT, 'src', 'input.css');
      const outputPath = path.join(PROJECT_ROOT, 'dist', 'output.css');
      
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Arquivo CSS de entrada não encontrado: ${inputPath}`);
      }

      await fs.ensureDir(path.dirname(outputPath));
      
      const command = this.isProduction 
        ? `npx tailwindcss -i ${inputPath} -o ${outputPath} --minify`
        : `npx tailwindcss -i ${inputPath} -o ${outputPath}`;
      
      execSync(command, { 
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: PROJECT_ROOT 
      });
      
      const stats = await fs.stat(outputPath);
      this.log(`✅ CSS compilado: ${(stats.size / 1024).toFixed(2)} KB`, 'success');
      
    } catch (error) {
      throw new Error(`Falha na compilação do CSS: ${error.message}`);
    }
  }

  /**
   * Verifica se um arquivo está na whitelist
   */
  isFileAllowed(fileName) {
    return EXTENSION_FILES.files.includes(fileName);
  }

  /**
   * Verifica se um diretório está permitido e retorna o filtro
   */
  getDirectoryFilter(dirName) {
    const dirConfig = EXTENSION_FILES.directories.find(d => d.name === dirName);
    return dirConfig ? dirConfig.filter : null;
  }

  /**
   * Copia APENAS os arquivos permitidos para o build
   */
  async copyAllowedFiles(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    this.log(`📁 Copiando arquivos permitidos para ${target}...`);
    
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);
    
    let copiedCount = 0;
    let skippedCount = 0;

    // Copia arquivos individuais da whitelist
    for (const fileName of EXTENSION_FILES.files) {
      const sourcePath = path.join(PROJECT_ROOT, fileName);
      
      if (await fs.pathExists(sourcePath)) {
        const targetPath = path.join(outputDir, fileName);
        await fs.copy(sourcePath, targetPath);
        
        if (this.verbose) {
          this.log(`   ✓ Arquivo: ${fileName}`);
        }
        copiedCount++;
      } else {
        if (this.verbose) {
          this.log(`   ⚠️  Arquivo não encontrado: ${fileName}`, 'warn');
        }
        skippedCount++;
      }
    }

    // Copia diretórios permitidos com filtros
    for (const dirConfig of EXTENSION_FILES.directories) {
      const sourcePath = path.join(PROJECT_ROOT, dirConfig.name);
      
      if (await fs.pathExists(sourcePath)) {
        const targetPath = path.join(outputDir, dirConfig.name);
        
        await fs.copy(sourcePath, targetPath, {
          filter: (src, dest) => {
            const fileName = path.basename(src);
            const stats = fs.statSync(src);
            
            // Sempre permite diretórios
            if (stats.isDirectory()) {
              return true;
            }
            
            // Aplica filtro para arquivos
            const isAllowed = dirConfig.filter(fileName);
            
            if (!isAllowed && this.verbose) {
              this.log(`   - Filtrado: ${path.relative(PROJECT_ROOT, src)}`);
            }
            
            return isAllowed;
          }
        });
        
        if (this.verbose) {
          this.log(`   ✓ Diretório: ${dirConfig.name}/`);
        }
        copiedCount++;
      } else {
        if (this.verbose) {
          this.log(`   ⚠️  Diretório não encontrado: ${dirConfig.name}`, 'warn');
        }
        skippedCount++;
      }
    }

    // Copia o manifest correto
    const manifestSource = path.join(PROJECT_ROOT, config.manifestSource);
    const manifestTarget = path.join(outputDir, 'manifest.json');
    await fs.copy(manifestSource, manifestTarget);
    
    this.log(`   ✓ ${copiedCount} itens copiados, ${skippedCount} não encontrados + manifest`);
    
    return { copiedCount, skippedCount };
  }

  /**
   * Valida e processa manifest
   */
  async processManifest(target) {
    const config = BUILD_CONFIGS[target];
    const manifestPath = path.join(PROJECT_ROOT, config.manifestSource);
    
    this.log(`📄 Processando manifest para ${target}...`);
    
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent.replace(/^\uFEFF/, ''));
      
      // Validações básicas
      if (!manifest.version) {
        throw new Error('Versão não encontrada no manifest');
      }
      
      if (!manifest.name) {
        throw new Error('Nome não encontrado no manifest');
      }
      
      // Validação de versão semver
      const versionRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?$/;
      if (!versionRegex.test(manifest.version)) {
        throw new Error(`Formato de versão inválido: ${manifest.version}`);
      }
      
      this.log(`   ✓ Manifest validado: ${manifest.name} v${manifest.version}`);
      return manifest;
      
    } catch (error) {
      throw new Error(`Erro ao processar manifest ${config.manifestSource}: ${error.message}`);
    }
  }

  /**
   * Valida o build final
   */
  async validateBuild(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    this.log(`🔍 Validando build para ${target}...`);
    
    // Verifica arquivos essenciais
    const essentialFiles = [
      'manifest.json',
      'background.js',
      'content-script.js',
      'sidebar.js',
      'sidebar.html'
    ];
    
    for (const file of essentialFiles) {
      const filePath = path.join(outputDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Arquivo essencial não encontrado: ${file}`);
      }
    }
    
    // Verifica se não há arquivos proibidos
    const allFiles = await this.getAllFiles(outputDir);
    const prohibitedFiles = allFiles.filter(file => {
      const relativePath = path.relative(outputDir, file);
      return this.isProhibitedFile(relativePath);
    });
    
    if (prohibitedFiles.length > 0) {
      this.log(`   ⚠️  Arquivos proibidos encontrados:`, 'warn');
      prohibitedFiles.forEach(file => {
        this.log(`     - ${path.relative(outputDir, file)}`, 'warn');
      });
    }
    
    this.log(`   ✓ Build validado para ${target}`, 'success');
  }

  /**
   * Verifica se um arquivo é proibido na extensão
   */
  isProhibitedFile(relativePath) {
    const prohibitedPatterns = [
      /package\.json$/,
      /\.env/,
      /\.git/,
      /node_modules/,
      /\.md$/,
      /\.log$/,
      /test.*\.js$/,
      /\.config\.js$/,
      /webpack/,
      /babel/,
      /jest/,
      /eslint/
    ];
    
    return prohibitedPatterns.some(pattern => pattern.test(relativePath));
  }

  /**
   * Obtém todos os arquivos recursivamente
   */
  async getAllFiles(dir) {
    const files = [];
    
    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dir);
    return files;
  }

  /**
   * Cria ZIP otimizado
   */
  async createZip(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    // Lê versão do manifest
    const manifestPath = path.join(outputDir, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const version = manifest.version;
    
    const zipName = `${config.zipPrefix}-v${version}.zip`;
    const zipPath = path.join(DIST_ZIPS_DIR, zipName);
    
    this.log(`📦 Criando ZIP otimizado: ${zipName}...`);
    
    await fs.ensureDir(DIST_ZIPS_DIR);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        comment: `${manifest.name} v${version} - ${config.description} build (optimized)`
      });
      
      let fileCount = 0;
      
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        this.log(`   ✓ ${zipName}: ${fileCount} arquivos, ${sizeInMB} MB`, 'success');
        resolve({ zipPath, size: archive.pointer(), fileCount });
      });
      
      archive.on('error', reject);
      
      archive.on('entry', () => {
        fileCount++;
      });
      
      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });
  }

  /**
   * Gera relatório de build
   */
  async generateReport(builds) {
    const reportPath = path.join(DIST_ZIPS_DIR, 'build-report-optimized.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.isProduction ? 'production' : 'development',
      buildType: 'optimized',
      targets: this.targets,
      builds: builds,
      whitelist: EXTENSION_FILES,
      summary: {
        totalBuilds: builds.length,
        totalSize: builds.reduce((sum, build) => sum + build.size, 0),
        totalFiles: builds.reduce((sum, build) => sum + build.fileCount, 0),
        averageSize: builds.length > 0 ? builds.reduce((sum, build) => sum + build.size, 0) / builds.length : 0
      }
    };
    
    await fs.writeJson(reportPath, report, { spaces: 2 });
    this.log(`📋 Relatório salvo: ${reportPath}`);
    
    return report;
  }

  /**
   * Executa build otimizado completo
   */
  async build() {
    const startTime = Date.now();
    
    try {
      // Validação inicial
      await this.validateEnvironment();
      
      // Limpa diretórios de build
      this.log('🧹 Limpando diretórios...');
      await fs.remove(DIST_DIR);
      
      // Compila CSS
      await this.buildCSS();
      
      const builds = [];
      
      // Build para cada target
      for (const target of this.targets) {
        this.log(`\n🎯 Iniciando build otimizado para ${target}...`);
        
        // Processa manifest
        const manifest = await this.processManifest(target);
        
        // Copia APENAS arquivos permitidos
        const copyResult = await this.copyAllowedFiles(target);
        
        // Valida build
        await this.validateBuild(target);
        
        // Cria ZIP
        const zipResult = await this.createZip(target);
        
        builds.push({
          target,
          version: manifest.version,
          manifest: manifest.name,
          copyResult,
          ...zipResult
        });
        
        this.log(`✅ Build otimizado concluído para ${target}`, 'success');
      }
      
      // Gera relatório
      const report = await this.generateReport(builds);
      
      // Resumo final
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const totalSizeMB = (report.summary.totalSize / 1024 / 1024).toFixed(2);
      
      this.log(`\n🎉 Build otimizado completo!`, 'success');
      this.log(`   ⏱️  Tempo: ${duration}s`);
      this.log(`   📦 Builds: ${builds.length}`);
      this.log(`   📊 Tamanho total: ${totalSizeMB} MB`);
      this.log(`   📁 Localização: ${DIST_ZIPS_DIR}`);
      
      // Lista arquivos criados
      this.log(`\n📋 Arquivos criados:`);
      for (const build of builds) {
        this.log(`   • ${path.basename(build.zipPath)} (${build.target}) - ${build.fileCount} arquivos`);
      }
      
      // Mostra economia de espaço
      this.log(`\n�� Otimizações aplicadas:`);
      this.log(`   • Apenas arquivos essenciais incluídos`);
      this.log(`   • Arquivos de desenvolvimento excluídos`);
      this.log(`   • Documentação e testes removidos`);
      this.log(`   • Configurações de build filtradas`);
      
      return report;
      
    } catch (error) {
      this.log(`Build falhou: ${error.message}`, 'error');
      
      if (this.verbose && error.stack) {
        console.error('\n🔍 Stack trace:');
        console.error(error.stack);
      }
      
      throw error;
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse argumentos
  const options = {
    targets: [],
    production: true,
    verbose: false
  };
  
  for (const arg of args) {
    if (arg === '--target=chrome' || arg === '-t=chrome') {
      options.targets = ['chrome'];
    } else if (arg === '--target=firefox' || arg === '-t=firefox') {
      options.targets = ['firefox'];
    } else if (arg === '--dev' || arg === '--development') {
      options.production = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/build-optimized.js [opções]

Opções:
  --target=chrome     Build apenas para Chrome/Edge
  --target=firefox    Build apenas para Firefox
  --dev               Modo desenvolvimento (sem otimizações)
  --verbose, -v       Output detalhado
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/build-optimized.js                    # Build otimizado para todos os targets
  node scripts/build-optimized.js --target=chrome    # Build apenas para Chrome
  node scripts/build-optimized.js --verbose          # Build com logs detalhados

Este script usa uma abordagem de WHITELIST, incluindo apenas os arquivos
essenciais para a extensão funcionar no navegador.
`);
      process.exit(0);
    }
  }
  
  // Se nenhum target especificado, build para todos
  if (options.targets.length === 0) {
    options.targets = ['chrome', 'firefox'];
  }
  
  try {
    const builder = new OptimizedExtensionBuilder(options);
    await builder.build();
    
    console.log('\n🎯 Build otimizado concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Build otimizado falhou:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { OptimizedExtensionBuilder, BUILD_CONFIGS, EXTENSION_FILES };