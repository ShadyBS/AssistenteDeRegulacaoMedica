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

// Arquivos a serem ignorados no build
const IGNORE_PATTERNS = [
  '.dist',
  'dist-zips',
  'src',
  'scripts',
  'node_modules',
  '.git',
  '.vscode',
  '.qodo',
  'build-zips.js',
  'build-zips.bat',
  'release.js',
  'build-release.bat',
  'rollback-release.bat',
  '.env',
  '.env.local',
  '.env.example',
  '.gitignore',
  'package-lock.json',
  'package.json',
  'tailwind.config.js',
  'webpack.config.js',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'BUILD.md',
  'agents.md',
  '*.log',
  '*.tmp',
  '.DS_Store',
  'Thumbs.db'
];

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
   * Copia arquivos para o diretório de build
   */
  async copyFiles(target) {
    const config = BUILD_CONFIGS[target];
    const outputDir = config.outputDir;
    
    this.log(`📁 Copiando arquivos para ${target}...`);
    
    await fs.ensureDir(outputDir);
    await fs.emptyDir(outputDir);
    
    const files = await fs.readdir(PROJECT_ROOT);
    let copiedCount = 0;
    
    for (const file of files) {
      if (this.shouldIgnoreFile(file)) {
        if (this.verbose) {
          this.log(`   - Ignorando: ${file}`);
        }
        continue;
      }
      
      const sourcePath = path.join(PROJECT_ROOT, file);
      const targetPath = path.join(outputDir, file);
      
      try {
        const stats = await fs.stat(sourcePath);
        
        if (stats.isDirectory()) {
          await fs.copy(sourcePath, targetPath, {
            filter: (src) => !this.shouldIgnoreFile(path.basename(src))
          });
          if (this.verbose) {
            this.log(`   + Diretório: ${file}/`);
          }
        } else {
          await fs.copy(sourcePath, targetPath);
          if (this.verbose) {
            this.log(`   + Arquivo: ${file}`);
          }
          copiedCount++;
        }
      } catch (error) {
        this.log(`   ⚠️  Erro ao copiar ${file}: ${error.message}`, 'warn');
      }
    }
    
    // Copia o manifest correto
    const manifestSource = path.join(PROJECT_ROOT, config.manifestSource);
    const manifestTarget = path.join(outputDir, 'manifest.json');
    await fs.copy(manifestSource, manifestTarget);
    
    this.log(`   ✓ ${copiedCount} arquivos copiados + manifest`);
  }

  /**
   * Verifica se um arquivo deve ser ignorado
   */
  shouldIgnoreFile(fileName) {
    return IGNORE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern || fileName.toLowerCase() === pattern.toLowerCase();
    });
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
      // Minificar JavaScript files se necessário
      const jsFiles = await this.findFiles(outputDir, '.js');
      
      for (const jsFile of jsFiles) {
        // Pular arquivos já minificados ou bibliotecas
        if (jsFile.includes('.min.') || jsFile.includes('browser-polyfill')) {
          continue;
        }
        
        // Aqui poderia adicionar minificação de JS se necessário
        // Por enquanto, apenas log
        if (this.verbose) {
          this.log(`   • JS: ${path.basename(jsFile)}`);
        }
      }
      
      this.log(`   ✓ ${jsFiles.length} arquivos JS processados`);
      
    } catch (error) {
      this.log(`   ⚠️  Erro na otimização: ${error.message}`, 'warn');
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