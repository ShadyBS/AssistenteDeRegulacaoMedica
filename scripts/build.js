#!/usr/bin/env node

/**
 * Build Script Principal - Assistente de Regulação Médica
 * 
 * Script principal que coordena todo o processo de build para Chrome e Firefox
 * Inclui manifest switching, asset optimization, validação e geração de ZIPs
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');
const archiver = require('archiver');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = PROJECT_ROOT;
const DIST_DIR = path.join(PROJECT_ROOT, '.dist');
const DIST_ZIPS_DIR = path.join(PROJECT_ROOT, 'dist-zips');

// Configurações de build por target
const BUILD_CONFIGS = {
  chrome: {
    manifestSource: 'manifest-edge.json',
    outputDir: path.join(DIST_DIR, 'chrome'),
    zipPrefix: 'AssistenteDeRegulacao-chrome',
    description: 'Chrome/Edge/Chromium',
    manifestVersion: 3,
    background: {
      service_worker: 'background.js'
    },
    action: {
      default_popup: 'sidebar.html'
    }
  },
  firefox: {
    manifestSource: 'manifest.json',
    outputDir: path.join(DIST_DIR, 'firefox'),
    zipPrefix: 'AssistenteDeRegulacao-firefox',
    description: 'Firefox/Mozilla',
    manifestVersion: 3,
    background: {
      scripts: ['background.js']
    },
    browser_action: {
      default_popup: 'sidebar.html'
    }
  }
};

// WHITELIST: Arquivos PERMITIDOS na extensão (apenas o essencial)
const EXTENSION_FILES = [
  // Core da extensão (obrigatórios)
  "background.js",
  "content-script.js",
  "sidebar.js",
  "sidebar.html",
  "options.js",
  "options.html",
  
  // APIs e utilitários essenciais
  "api.js",
  "api-constants.js",
  "utils.js",
  "validation.js",
  "store.js",
  "config.js",
  "renderers.js",
  "logger.js",
  "test-logger.js",
  
  // Managers necessários para funcionamento
  "MemoryManager.js",
  "KeepAliveManager.js",
  "SectionManager.js",
  "TimelineManager.js",
  
  // Parsers e configurações específicas
  "consultation-parser.js",
  "field-config.js",
  "filter-config.js",
  
  // Utilitários de segurança
  "crypto-utils.js",
  "BrowserAPI.js",
  
  // Polyfills para compatibilidade
  "browser-polyfill.js",
  
  // Páginas de ajuda
  "help.html",
  "help.js"
];

// Diretórios permitidos com filtros específicos
const ALLOWED_DIRECTORIES = {
  "icons": (file) => /\.(png|jpg|jpeg|gif|svg|ico)$/i.test(file),
  "dist": (file) => file === "output.css" || /\.(css|js)$/i.test(file),
  "ui": (file) => /\.(js|html|css)$/i.test(file)
};

/**
 * Classe principal para gerenciar o processo de build
 */
class ExtensionBuilder {
  constructor(options = {}) {
    this.targets = options.targets || ['chrome', 'firefox'];
    this.isDryRun = options.dryRun || false;
    this.isProduction = options.production !== false;
    this.verbose = options.verbose || false;
    
    this.log('🚀 Iniciando ExtensionBuilder');
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

    // Verifica Node.js version
    const nodeVersion = process.version;
    const requiredNodeVersion = '16.0.0';
    if (!this.isVersionCompatible(nodeVersion.substring(1), requiredNodeVersion)) {
      throw new Error(`Node.js ${requiredNodeVersion}+ é necessário. Versão atual: ${nodeVersion}`);
    }

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
   * Compara versões semver
   */
  isVersionCompatible(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (currentParts[i] > requiredParts[i]) return true;
      if (currentParts[i] < requiredParts[i]) return false;
    }
    return true;
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
   * Valida e processa manifest para target específico
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
      
      // Aplicar otimizações específicas do target se necessário
      if (target === 'chrome') {
        // Otimizações específicas para Chrome
        if (manifest.background && manifest.background.scripts) {
          manifest.background = { service_worker: manifest.background.scripts[0] };
        }
      }
      
      this.log(`   ✓ Manifest validado: ${manifest.name} v${manifest.version}`);
      return manifest;
      
    } catch (error) {
      throw new Error(`Erro ao processar manifest ${config.manifestSource}: ${error.message}`);
    }
  }

  /**
   * Copia arquivos para o diretório de build usando WHITELIST
   */
  async copyFiles(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    this.log(`📁 Copiando arquivos para ${target} (WHITELIST)...`);
    
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);
    
    let copiedCount = 0;
    let skippedCount = 0;
    
    // Copia APENAS arquivos individuais permitidos
    for (const fileName of EXTENSION_FILES) {
      const sourcePath = path.join(PROJECT_ROOT, fileName);
      
      if (await fs.pathExists(sourcePath)) {
        const stats = await fs.stat(sourcePath);
        
        if (stats.isFile()) {
          const targetPath = path.join(outputDir, fileName);
          await fs.copy(sourcePath, targetPath);
          
          if (this.verbose) {
            this.log(`   + ${fileName}`);
          }
          copiedCount++;
        }
      } else {
        if (this.verbose) {
          this.log(`   ⚠️  Arquivo não encontrado: ${fileName}`);
        }
        skippedCount++;
      }
    }
    
    // Copia diretórios permitidos com filtros
    for (const [dirName, filter] of Object.entries(ALLOWED_DIRECTORIES)) {
      const sourceDirPath = path.join(PROJECT_ROOT, dirName);
      const targetDirPath = path.join(outputDir, dirName);
      
      if (await fs.pathExists(sourceDirPath)) {
        await fs.ensureDir(targetDirPath);
        
        const result = await this.copyDirectoryWithFilter(sourceDirPath, targetDirPath, dirName, filter);
        copiedCount += result.fileCount;
        skippedCount += result.skippedCount;
      } else {
        if (this.verbose) {
          this.log(`   ⚠️  Diretório não encontrado: ${dirName}`);
        }
      }
    }
    
    // Copia o manifest correto
    const manifestSource = path.join(PROJECT_ROOT, config.manifestSource);
    const manifestTarget = path.join(outputDir, 'manifest.json');
    await fs.copy(manifestSource, manifestTarget);
    
    if (this.verbose) {
      this.log(`   + manifest.json (${config.manifestSource})`);
    }
    copiedCount++;
    
    this.log(`   ✓ ${copiedCount} arquivos copiados, ${skippedCount} filtrados`);
  }

  /**
   * Copia arquivos de um diretório com filtro
   */
  async copyDirectoryWithFilter(sourceDirPath, targetDirPath, dirName, filter) {
    let fileCount = 0;
    let skippedCount = 0;
    
    const files = await fs.readdir(sourceDirPath);
    
    for (const file of files) {
      const sourceFilePath = path.join(sourceDirPath, file);
      const targetFilePath = path.join(targetDirPath, file);
      const stats = await fs.stat(sourceFilePath);
      
      if (stats.isFile()) {
        const isAllowed = filter(file);
        
        if (isAllowed) {
          await fs.copy(sourceFilePath, targetFilePath);
          
          if (this.verbose) {
            this.log(`   + ${dirName}/${file}`);
          }
          fileCount++;
        } else {
          if (this.verbose) {
            this.log(`   - Filtrado: ${dirName}/${file}`);
          }
          skippedCount++;
        }
      } else if (stats.isDirectory()) {
        // Processa subdiretórios recursivamente
        const subTargetDir = path.join(targetDirPath, file);
        await fs.ensureDir(subTargetDir);
        
        const subFiles = await fs.readdir(sourceFilePath);
        
        for (const subFile of subFiles) {
          const subSourcePath = path.join(sourceFilePath, subFile);
          const subTargetPath = path.join(subTargetDir, subFile);
          const subStats = await fs.stat(subSourcePath);
          
          if (subStats.isFile()) {
            const isAllowed = filter(subFile);
            
            if (isAllowed) {
              await fs.copy(subSourcePath, subTargetPath);
              
              if (this.verbose) {
                this.log(`   + ${dirName}/${file}/${subFile}`);
              }
              fileCount++;
            } else {
              if (this.verbose) {
                this.log(`   - Filtrado: ${dirName}/${file}/${subFile}`);
              }
              skippedCount++;
            }
          }
        }
      }
    }
    
    return { fileCount, skippedCount };
  }

  
  /**
   * Otimiza assets (minificação, compressão)
   */
  async optimizeAssets(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    if (!this.isProduction) {
      this.log(`⚡ Pulando otimização (modo desenvolvimento)`);
      return;
    }
    
    this.log(`⚡ Otimizando assets para ${target}...`);
    
    try {
      // Otimiza JavaScript files
      const jsFiles = await this.findFiles(outputDir, '.js');
      let optimizedCount = 0;
      
      for (const jsFile of jsFiles) {
        // Pular arquivos já minificados ou bibliotecas
        if (jsFile.includes('.min.') || jsFile.includes('browser-polyfill')) {
          continue;
        }
        
        // Remove comentários e espaços desnecessários
        const content = await fs.readFile(jsFile, 'utf8');
        const originalSize = content.length;
        
        // Otimizações básicas
        let optimized = content
          // Remove comentários de linha
          .replace(/\/\/.*$/gm, '')
          // Remove comentários de bloco (preserva JSDoc importantes)
          .replace(/\/\*(?!\*\s*@)[\s\S]*?\*\//g, '')
          // Remove espaços múltiplos
          .replace(/\s+/g, ' ')
          // Remove espaços antes/depois de operadores
          .replace(/\s*([{}();,=])\s*/g, '$1')
          // Remove quebras de linha desnecessárias
          .replace(/\n\s*\n/g, '\n')
          .trim();
        
        if (optimized.length < originalSize) {
          await fs.writeFile(jsFile, optimized);
          optimizedCount++;
          
          if (this.verbose) {
            const savings = ((originalSize - optimized.length) / originalSize * 100).toFixed(1);
            this.log(`   • ${path.basename(jsFile)}: -${savings}%`);
          }
        }
      }
      
      // Otimiza CSS files
      const cssFiles = await this.findFiles(outputDir, '.css');
      for (const cssFile of cssFiles) {
        if (cssFile.includes('.min.')) continue;
        
        const content = await fs.readFile(cssFile, 'utf8');
        const originalSize = content.length;
        
        // Otimizações básicas de CSS
        let optimized = content
          // Remove comentários
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Remove espaços desnecessários
          .replace(/\s+/g, ' ')
          // Remove espaços ao redor de caracteres especiais
          .replace(/\s*([{}:;,>+~])\s*/g, '$1')
          // Remove último ponto e vírgula antes de }
          .replace(/;}/g, '}')
          .trim();
        
        if (optimized.length < originalSize) {
          await fs.writeFile(cssFile, optimized);
          
          if (this.verbose) {
            const savings = ((originalSize - optimized.length) / originalSize * 100).toFixed(1);
            this.log(`   • ${path.basename(cssFile)}: -${savings}%`);
          }
        }
      }
      
      // Remove arquivos desnecessários
      await this.removeUnnecessaryFiles(outputDir);
      
      this.log(`   ✓ ${optimizedCount} arquivos JS otimizados`);
      
    } catch (error) {
      this.log(`   ⚠️  Erro na otimização: ${error.message}`, 'warn');
    }
  }

  /**
   * Remove arquivos desnecessários do build
   */
  async removeUnnecessaryFiles(outputDir) {
    const unnecessaryPatterns = [
      '**/*.map', // Source maps
      '**/*.md',  // Documentação
      '**/*.txt', // Arquivos de texto
      '**/LICENSE*', // Licenças
      '**/CHANGELOG*', // Changelogs
      '**/.DS_Store', // macOS
      '**/Thumbs.db', // Windows
      '**/*.log' // Logs
    ];
    
    for (const pattern of unnecessaryPatterns) {
      try {
        const files = await this.findFilesByPattern(outputDir, pattern);
        for (const file of files) {
          await fs.remove(file);
          if (this.verbose) {
            this.log(`   - Removido: ${path.relative(outputDir, file)}`);
          }
        }
      } catch (error) {
        // Ignora erros de arquivos não encontrados
      }
    }
  }

  /**
   * Encontra arquivos por padrão glob
   */
  async findFilesByPattern(dir, pattern) {
    const files = [];
    
    // Implementação simples sem dependência externa
    const glob = (dir, pattern) => {
      const results = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          results.push(...glob(fullPath, pattern));
        } else {
          // Verifica padrões simples
          if (pattern.includes('*.map') && item.endsWith('.map')) {
            results.push(fullPath);
          } else if (pattern.includes('*.md') && item.endsWith('.md')) {
            results.push(fullPath);
          } else if (pattern.includes('*.txt') && item.endsWith('.txt')) {
            results.push(fullPath);
          } else if (pattern.includes('LICENSE') && item.includes('LICENSE')) {
            results.push(fullPath);
          } else if (pattern.includes('CHANGELOG') && item.includes('CHANGELOG')) {
            results.push(fullPath);
          } else if (pattern.includes('.DS_Store') && item === '.DS_Store') {
            results.push(fullPath);
          } else if (pattern.includes('Thumbs.db') && item === 'Thumbs.db') {
            results.push(fullPath);
          } else if (pattern.includes('*.log') && item.endsWith('.log')) {
            results.push(fullPath);
          }
        }
      }
      
      return results;
    };
    
    try {
      return glob(dir, pattern);
    } catch (error) {
      return [];
    }
  }

  /**
   * Encontra arquivos por extensão
   */
  async findFiles(dir, extension) {
    const files = [];
    
    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await scan(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dir);
    return files;
  }

  /**
   * Executa validações de qualidade
   */
  async validateBuild(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    this.log(`🔍 Validando build para ${target}...`);
    
    // Verifica se o manifest existe e é válido
    const manifestPath = path.join(outputDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error('Manifest.json não encontrado no build');
    }
    
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    
    // Verifica arquivos essenciais
    const essentialFiles = [
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
    
    // Verifica se o CSS foi incluído
    const cssPath = path.join(outputDir, 'dist', 'output.css');
    if (!await fs.pathExists(cssPath)) {
      this.log('   ⚠️  CSS compilado não encontrado', 'warn');
    }
    
    this.log(`   ✓ Build validado para ${target}`, 'success');
  }

  /**
   * Cria ZIP do build
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
    
    this.log(`📦 Criando ZIP: ${zipName}...`);
    
    await fs.ensureDir(DIST_ZIPS_DIR);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { 
        zlib: { level: 9 },
        comment: `${manifest.name} v${version} - ${config.description} build`
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
    const reportPath = path.join(DIST_ZIPS_DIR, 'build-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.isProduction ? 'production' : 'development',
      targets: this.targets,
      builds: builds,
      summary: {
        totalBuilds: builds.length,
        totalSize: builds.reduce((sum, build) => sum + build.size, 0),
        totalFiles: builds.reduce((sum, build) => sum + build.fileCount, 0)
      }
    };
    
    await fs.writeJson(reportPath, report, { spaces: 2 });
    this.log(`📋 Relatório salvo: ${reportPath}`);
    
    return report;
  }

  /**
   * Executa build completo
   */
  async build() {
    const startTime = Date.now();
    
    try {
      // Validação inicial
      await this.validateEnvironment();
      
      // Limpa diretórios de build
      this.log('🧹 Limpando diretórios...');
      await fs.remove(DIST_DIR);
      await fs.remove(DIST_ZIPS_DIR);
      
      // Compila CSS
      await this.buildCSS();
      
      const builds = [];
      
      // Build para cada target
      for (const target of this.targets) {
        this.log(`\n🎯 Iniciando build para ${target}...`);
        
        // Processa manifest
        const manifest = await this.processManifest(target);
        
        // Copia arquivos
        await this.copyFiles(target);
        
        // Otimiza assets
        await this.optimizeAssets(target);
        
        // Valida build
        await this.validateBuild(target);
        
        // Cria ZIP
        const zipResult = await this.createZip(target);
        
        builds.push({
          target,
          version: manifest.version,
          manifest: manifest.name,
          ...zipResult
        });
        
        this.log(`✅ Build concluído para ${target}`, 'success');
      }
      
      // Gera relatório
      const report = await this.generateReport(builds);
      
      // Resumo final
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const totalSizeMB = (report.summary.totalSize / 1024 / 1024).toFixed(2);
      
      this.log(`\n🎉 Build completo!`, 'success');
      this.log(`   ⏱️  Tempo: ${duration}s`);
      this.log(`   📦 Builds: ${builds.length}`);
      this.log(`   ���� Tamanho total: ${totalSizeMB} MB`);
      this.log(`   📁 Localização: ${DIST_ZIPS_DIR}`);
      
      // Lista arquivos criados
      this.log(`\n📋 Arquivos criados:`);
      for (const build of builds) {
        this.log(`   • ${path.basename(build.zipPath)} (${build.target})`);
      }
      
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
    dryRun: false,
    production: true,
    verbose: false
  };
  
  for (const arg of args) {
    if (arg === '--target=chrome' || arg === '-t=chrome') {
      options.targets = ['chrome'];
    } else if (arg === '--target=firefox' || arg === '-t=firefox') {
      options.targets = ['firefox'];
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--dev' || arg === '--development') {
      options.production = false;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/build.js [opções]

Opções:
  --target=chrome     Build apenas para Chrome/Edge
  --target=firefox    Build apenas para Firefox
  --dry-run, -d       Simula o build sem criar arquivos
  --dev               Modo desenvolvimento (sem otimizações)
  --verbose, -v       Output detalhado
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/build.js                    # Build para todos os targets
  node scripts/build.js --target=chrome    # Build apenas para Chrome
  node scripts/build.js --dev --verbose    # Build desenvolvimento com logs
`);
      process.exit(0);
    }
  }
  
  // Se nenhum target especificado, build para todos
  if (options.targets.length === 0) {
    options.targets = ['chrome', 'firefox'];
  }
  
  try {
    const builder = new ExtensionBuilder(options);
    await builder.build();
    
    console.log('\n🎯 Build concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Build falhou:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { ExtensionBuilder, BUILD_CONFIGS };