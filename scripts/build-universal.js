#!/usr/bin/env node

/**
 * 🏗️ UNIVERSAL BUILD SCRIPT - ASSISTENTE DE REGULAÇÃO MÉDICA
 *
 * Script avançado de build para múltiplos navegadores
 * Suporte completo para Chrome, Firefox e Edge
 * Otimização automática e validação de qualidade
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, '.dist');
const packageDir = path.join(rootDir, 'dist-zips');

class UniversalBuilder {
  constructor(options = {}) {
    this.options = {
      target: 'all', // chrome, firefox, edge, all
      environment: 'production', // development, production
      optimize: true,
      validate: true,
      verbose: false,
      ...options
    };

    this.buildStats = {
      startTime: Date.now(),
      targets: [],
      errors: [],
      warnings: [],
      sizes: {}
    };

    this.log('🚀 Initializing Universal Builder...');
    this.log(`Target: ${this.options.target}`);
    this.log(`Environment: ${this.options.environment}`);
  }

  log(message, level = 'info') {
    if (!this.options.verbose && level === 'debug') return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async buildAll() {
    try {
      this.log('🏗️ Starting universal build process...');

      // Preparar ambiente
      await this.prepareEnvironment();

      // Validar pré-requisitos
      if (this.options.validate) {
        await this.validatePrerequisites();
      }

      // Build CSS
      await this.buildCSS();

      // Determinar targets
      const targets = this.getTargets();

      // Build para cada target
      for (const target of targets) {
        await this.buildTarget(target);
      }

      // Criar pacotes de distribuição
      await this.createDistributionPackages();

      // Validação pós-build
      if (this.options.validate) {
        await this.validateBuildOutput();
      }

      // Relatório final
      await this.generateBuildReport();

      this.log('🎉 Universal build completed successfully!', 'success');

    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      this.buildStats.errors.push(error.message);
      throw error;
    }
  }

  async prepareEnvironment() {
    this.log('🧹 Preparing build environment...');

    // Limpar diretórios de build
    await fs.remove(distDir);
    await fs.remove(packageDir);

    // Criar diretórios necessários
    await fs.ensureDir(distDir);
    await fs.ensureDir(packageDir);

    // Verificar se node_modules existe
    const nodeModulesPath = path.join(rootDir, 'node_modules');
    if (!await fs.pathExists(nodeModulesPath)) {
      this.log('📦 Installing dependencies...', 'warning');
      execSync('npm ci', { cwd: rootDir, stdio: 'inherit' });
    }

    this.log('✅ Environment prepared', 'success');
  }

  async validatePrerequisites() {
    this.log('🔍 Validating prerequisites...');

    const requiredFiles = [
      'manifest.json',
      'manifest-edge.json',
      'background.js',
      'content-script.js',
      'sidebar.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Validar manifests
    await this.validateManifests();

    this.log('✅ Prerequisites validated', 'success');
  }

  async validateManifests() {
    this.log('📄 Validating manifests...');

    const firefoxManifest = await fs.readJson(path.join(rootDir, 'manifest.json'));
    const chromeManifest = await fs.readJson(path.join(rootDir, 'manifest-edge.json'));

    // Verificar versões sincronizadas
    if (firefoxManifest.version !== chromeManifest.version) {
      throw new Error(`Manifest versions not synchronized: Firefox=${firefoxManifest.version}, Chrome=${chromeManifest.version}`);
    }

    // Verificar Manifest V3
    if (firefoxManifest.manifest_version !== 3 || chromeManifest.manifest_version !== 3) {
      throw new Error('Manifests must use Manifest V3');
    }

    // Verificar campos obrigatórios
    const requiredFields = ['name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!firefoxManifest[field] || !chromeManifest[field]) {
        throw new Error(`Required manifest field missing: ${field}`);
      }
    }

    this.log('✅ Manifests validated', 'success');
  }

  async buildCSS() {
    this.log('🎨 Building CSS assets...');

    try {
      const cssCommand = this.options.environment === 'production'
        ? 'npm run build:css:optimized'
        : 'npm run build:css';

      execSync(cssCommand, { cwd: rootDir, stdio: 'pipe' });

      // Verificar se CSS foi gerado
      const cssPath = path.join(rootDir, 'dist', 'output.css');
      if (await fs.pathExists(cssPath)) {
        const stats = await fs.stat(cssPath);
        this.buildStats.sizes.css = stats.size;
        this.log(`✅ CSS built successfully (${Math.round(stats.size / 1024)} KB)`, 'success');
      } else {
        throw new Error('CSS build failed - output file not found');
      }

    } catch (error) {
      throw new Error(`CSS build failed: ${error.message}`);
    }
  }

  getTargets() {
    if (this.options.target === 'all') {
      return ['chrome', 'firefox', 'edge'];
    }
    return [this.options.target];
  }

  async buildTarget(target) {
    this.log(`🏗️ Building for ${target}...`);

    const targetDir = path.join(distDir, target);
    await fs.ensureDir(targetDir);

    try {
      // Copiar arquivos base
      await this.copyBaseFiles(targetDir, target);

      // Aplicar transformações específicas do target
      await this.applyTargetTransformations(targetDir, target);

      // Otimizar se necessário
      if (this.options.optimize) {
        await this.optimizeTarget(targetDir, target);
      }

      // Validar build do target
      await this.validateTargetBuild(targetDir, target);

      this.buildStats.targets.push(target);
      this.log(`✅ ${target} build completed`, 'success');

    } catch (error) {
      const errorMsg = `${target} build failed: ${error.message}`;
      this.log(errorMsg, 'error');
      this.buildStats.errors.push(errorMsg);
      throw error;
    }
  }

  async copyBaseFiles(targetDir, target) {
    this.log(`📁 Copying base files for ${target}...`, 'debug');

    // Lista de arquivos para copiar
    const baseFiles = [
      'background.js',
      'content-script.js',
      'sidebar.js',
      'sidebar.html',
      'api.js',
      'api-constants.js',
      'validation.js',
      'utils.js',
      'store.js',
      'renderers.js',
      'config.js',
      'logger.js',
      'browser-polyfill.js',
      'options.html',
      'options.js',
      'help.html',
      'help.js'
    ];

    // Copiar arquivos JavaScript e HTML
    for (const file of baseFiles) {
      const srcPath = path.join(rootDir, file);
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, path.join(targetDir, file));
      }
    }

    // Copiar manifest específico
    const manifestSrc = target === 'firefox' ? 'manifest.json' : 'manifest-edge.json';
    await fs.copy(
      path.join(rootDir, manifestSrc),
      path.join(targetDir, 'manifest.json')
    );

    // Copiar CSS compilado
    const cssPath = path.join(rootDir, 'dist', 'output.css');
    if (await fs.pathExists(cssPath)) {
      await fs.copy(cssPath, path.join(targetDir, 'output.css'));
    }

    // Copiar ícones
    const iconsDir = path.join(rootDir, 'icons');
    if (await fs.pathExists(iconsDir)) {
      await fs.copy(iconsDir, path.join(targetDir, 'icons'));
    }

    // Copiar managers
    const managersDir = path.join(rootDir, 'managers');
    if (await fs.pathExists(managersDir)) {
      await fs.copy(managersDir, path.join(targetDir, 'managers'));
    } else {
      // Copiar arquivos de manager individuais
      const managerFiles = [
        'KeepAliveManager.js',
        'MemoryManager.js',
        'SectionManager.js',
        'TimelineManager.js'
      ];

      for (const file of managerFiles) {
        const srcPath = path.join(rootDir, file);
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, path.join(targetDir, file));
        }
      }
    }

    // Copiar UI components
    const uiDir = path.join(rootDir, 'ui');
    if (await fs.pathExists(uiDir)) {
      await fs.copy(uiDir, path.join(targetDir, 'ui'));
    }
  }

  async applyTargetTransformations(targetDir, target) {
    this.log(`🔧 Applying ${target} transformations...`, 'debug');

    // Transformações específicas por navegador
    switch (target) {
      case 'firefox':
        await this.applyFirefoxTransformations(targetDir);
        break;
      case 'chrome':
        await this.applyChromeTransformations(targetDir);
        break;
      case 'edge':
        await this.applyEdgeTransformations(targetDir);
        break;
    }
  }

  async applyFirefoxTransformations(targetDir) {
    // Adicionar polyfills específicos do Firefox se necessário
    const polyfillContent = `
// Firefox-specific polyfills and compatibility layer
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = chrome;
}

// Firefox-specific initialization
console.log('[Firefox] Extension initialized');
`;

    await fs.writeFile(
      path.join(targetDir, 'firefox-polyfill.js'),
      polyfillContent
    );
  }

  async applyChromeTransformations(targetDir) {
    // Adicionar polyfills específicos do Chrome se necessário
    const polyfillContent = `
// Chrome-specific polyfills and compatibility layer
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = chrome;
}

// Chrome-specific initialization
console.log('[Chrome] Extension initialized');
`;

    await fs.writeFile(
      path.join(targetDir, 'chrome-polyfill.js'),
      polyfillContent
    );
  }

  async applyEdgeTransformations(targetDir) {
    // Edge usa a mesma base do Chrome, mas pode ter otimizações específicas
    const polyfillContent = `
// Edge-specific polyfills and compatibility layer
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = chrome;
}

// Edge-specific initialization
console.log('[Edge] Extension initialized');
`;

    await fs.writeFile(
      path.join(targetDir, 'edge-polyfill.js'),
      polyfillContent
    );
  }

  async optimizeTarget(targetDir, target) {
    this.log(`⚡ Optimizing ${target} build...`, 'debug');

    // Minificar JavaScript se em produção
    if (this.options.environment === 'production') {
      await this.minifyJavaScript(targetDir);
    }

    // Otimizar imagens
    await this.optimizeImages(targetDir);

    // Remover arquivos desnecessários
    await this.removeUnnecessaryFiles(targetDir, target);
  }

  async minifyJavaScript(targetDir) {
    // Implementação básica de minificação
    // Em produção, usaríamos ferramentas como Terser
    this.log('🗜️ Minifying JavaScript...', 'debug');

    const jsFiles = await this.getJavaScriptFiles(targetDir);

    for (const file of jsFiles) {
      try {
        let content = await fs.readFile(file, 'utf8');

        // Remover comentários simples
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/\/\/.*$/gm, '');

        // Remover espaços extras
        content = content.replace(/\s+/g, ' ');
        content = content.trim();

        await fs.writeFile(file, content);
      } catch (error) {
        this.log(`Warning: Could not minify ${file}: ${error.message}`, 'warning');
      }
    }
  }

  async getJavaScriptFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getJavaScriptFiles(fullPath);
        files.push(...subFiles);
      } else if (item.endsWith('.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async optimizeImages(targetDir) {
    this.log('🖼️ Optimizing images...', 'debug');

    const iconsDir = path.join(targetDir, 'icons');
    if (await fs.pathExists(iconsDir)) {
      // Implementação básica - em produção usaríamos sharp ou imagemin
      this.log('Images optimization placeholder', 'debug');
    }
  }

  async removeUnnecessaryFiles(targetDir, target) {
    this.log('🧹 Removing unnecessary files...', 'debug');

    // Arquivos que podem ser removidos em produção
    const unnecessaryFiles = [
      '.DS_Store',
      'Thumbs.db',
      '*.map',
      '*.log'
    ];

    // Remover polyfills de outros navegadores
    if (target === 'firefox') {
      unnecessaryFiles.push('chrome-polyfill.js', 'edge-polyfill.js');
    } else if (target === 'chrome') {
      unnecessaryFiles.push('firefox-polyfill.js', 'edge-polyfill.js');
    } else if (target === 'edge') {
      unnecessaryFiles.push('firefox-polyfill.js', 'chrome-polyfill.js');
    }

    for (const pattern of unnecessaryFiles) {
      try {
        const files = await this.globFiles(targetDir, pattern);
        for (const file of files) {
          await fs.remove(file);
        }
      } catch (error) {
        // Ignorar erros de arquivos não encontrados
      }
    }
  }

  async globFiles(dir, pattern) {
    // Implementação simples de glob
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.globFiles(fullPath, pattern);
        files.push(...subFiles);
      } else if (this.matchPattern(item, pattern)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  matchPattern(filename, pattern) {
    // Implementação simples de pattern matching
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  async validateTargetBuild(targetDir, target) {
    this.log(`🔍 Validating ${target} build...`, 'debug');

    // Verificar se manifest existe
    const manifestPath = path.join(targetDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Manifest not found for ${target}`);
    }

    // Verificar arquivos essenciais
    const essentialFiles = ['background.js', 'content-script.js'];
    for (const file of essentialFiles) {
      const filePath = path.join(targetDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Essential file missing for ${target}: ${file}`);
      }
    }

    // Calcular tamanho do build
    const buildSize = await this.calculateDirectorySize(targetDir);
    this.buildStats.sizes[target] = buildSize;

    this.log(`📊 ${target} build size: ${Math.round(buildSize / 1024)} KB`, 'debug');
  }

  async calculateDirectorySize(dir) {
    let totalSize = 0;
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullPath);
      } else {
        totalSize += stat.size;
      }
    }

    return totalSize;
  }

  async createDistributionPackages() {
    this.log('📦 Creating distribution packages...');

    for (const target of this.buildStats.targets) {
      await this.createZipPackage(target);
    }

    this.log('✅ Distribution packages created', 'success');
  }

  async createZipPackage(target) {
    this.log(`📦 Creating ${target} package...`, 'debug');

    const targetDir = path.join(distDir, target);
    const zipPath = path.join(packageDir, `AssistenteDeRegulacao-${target}-v${await this.getVersion()}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const size = archive.pointer();
        this.buildStats.sizes[`${target}_zip`] = size;
        this.log(`✅ ${target} package created: ${Math.round(size / 1024)} KB`, 'success');
        resolve();
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(targetDir, false);
      archive.finalize();
    });
  }

  async getVersion() {
    const packageJson = await fs.readJson(path.join(rootDir, 'package.json'));
    return packageJson.version;
  }

  async validateBuildOutput() {
    this.log('🔍 Validating build output...');

    // Verificar se todos os pacotes foram criados
    for (const target of this.buildStats.targets) {
      const zipPath = path.join(packageDir, `AssistenteDeRegulacao-${target}-v${await this.getVersion()}.zip`);
      if (!await fs.pathExists(zipPath)) {
        throw new Error(`Package not created for ${target}`);
      }
    }

    // Verificar tamanhos dos pacotes
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const target of this.buildStats.targets) {
      const zipSize = this.buildStats.sizes[`${target}_zip`];
      if (zipSize > maxSize) {
        this.log(`Warning: ${target} package is large (${Math.round(zipSize / 1024 / 1024)} MB)`, 'warning');
        this.buildStats.warnings.push(`Large package: ${target}`);
      }
    }

    this.log('✅ Build output validated', 'success');
  }

  async generateBuildReport() {
    this.log('📊 Generating build report...');

    const endTime = Date.now();
    const duration = endTime - this.buildStats.startTime;

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      targets: this.buildStats.targets,
      environment: this.options.environment,
      sizes: this.buildStats.sizes,
      errors: this.buildStats.errors,
      warnings: this.buildStats.warnings,
      success: this.buildStats.errors.length === 0
    };

    // Salvar relatório
    const reportPath = path.join(rootDir, 'build-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    // Log do relatório
    this.log('📊 Build Report:', 'success');
    this.log(`  Duration: ${report.duration}`);
    this.log(`  Targets: ${report.targets.join(', ')}`);
    this.log(`  Errors: ${report.errors.length}`);
    this.log(`  Warnings: ${report.warnings.length}`);

    if (report.sizes.css) {
      this.log(`  CSS Size: ${Math.round(report.sizes.css / 1024)} KB`);
    }

    for (const target of report.targets) {
      if (report.sizes[target]) {
        this.log(`  ${target} Size: ${Math.round(report.sizes[target] / 1024)} KB`);
      }
      if (report.sizes[`${target}_zip`]) {
        this.log(`  ${target} ZIP: ${Math.round(report.sizes[`${target}_zip`] / 1024)} KB`);
      }
    }

    this.log(`📄 Report saved to: ${reportPath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--target' && args[i + 1]) {
      options.target = args[i + 1];
      i++;
    } else if (arg === '--env' && args[i + 1]) {
      options.environment = args[i + 1];
      i++;
    } else if (arg === '--no-optimize') {
      options.optimize = false;
    } else if (arg === '--no-validate') {
      options.validate = false;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  try {
    const builder = new UniversalBuilder(options);
    await builder.buildAll();
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default UniversalBuilder;
