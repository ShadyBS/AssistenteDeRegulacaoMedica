#!/usr/bin/env node

/**
 * Validation Script - Assistente de Regulação Médica (Improved)
 *
 * Sistema completo de validação para extensão de navegador
 * Inclui validações de código, manifests, segurança e compatibilidade
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Classe principal para validações
 */
class ExtensionValidator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.fixIssues = options.fix || false;
    this.skipLinting = options.skipLinting || false;
    this.skipSecurity = options.skipSecurity || false;

    this.errors = [];
    this.warnings = [];
    this.fixes = [];
  }

  /**
   * Logging com categorização
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        this.errors.push(message);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}`);
        this.warnings.push(message);
        break;
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      case 'fix':
        console.log(`${prefix} 🔧 ${message}`);
        this.fixes.push(message);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Valida estrutura dos manifests
   */
  async validateManifests() {
    this.log('📄 Validando manifests...');

    const manifestFiles = [
      { file: 'manifest.json', target: 'Firefox' },
      { file: 'manifest-edge.json', target: 'Chrome/Edge' }
    ];

    const manifests = {};

    for (const { file, target } of manifestFiles) {
      const manifestPath = path.join(PROJECT_ROOT, file);

      try {
        if (!await fs.pathExists(manifestPath)) {
          this.log(`Manifest não encontrado: ${file}`, 'error');
          continue;
        }

        // Lê e valida JSON
        const content = await fs.readFile(manifestPath, 'utf8');
        const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM

        let manifest;
        try {
          manifest = JSON.parse(cleanContent);
        } catch (parseError) {
          this.log(`JSON inválido em ${file}: ${parseError.message}`, 'error');
          continue;
        }

        manifests[target] = manifest;

        // Validações básicas
        await this.validateManifestStructure(manifest, file, target);

        this.log(`   ✓ ${file} (${target}) validado`);

      } catch (error) {
        this.log(`Erro ao validar ${file}: ${error.message}`, 'error');
      }
    }

    // Validação de sincronização entre manifests
    await this.validateManifestSync(manifests);

    return manifests;
  }

  /**
   * Valida estrutura individual do manifest
   */
  async validateManifestStructure(manifest, file, target) {
    // Campos obrigatórios
    const requiredFields = ['name', 'version', 'manifest_version', 'description'];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        this.log(`Campo obrigatório ausente em ${file}: ${field}`, 'error');
      }
    }

    // Validação de versão
    if (manifest.version) {
      const versionRegex = /^\d+\.\d+\.\d+(-[\w\.-]+)?$/;
      if (!versionRegex.test(manifest.version)) {
        this.log(`Formato de versão inválido em ${file}: ${manifest.version}`, 'error');
      }
    }

    // Validação de Manifest V3
    if (manifest.manifest_version !== 3) {
      this.log(`Manifest V3 obrigatório em ${file}. Versão atual: ${manifest.manifest_version}`, 'error');
    }

    // Validações específicas por target
    if (target === 'Chrome/Edge') {
      // Chrome/Edge específico
      if (manifest.background && !manifest.background.service_worker) {
        this.log(`Chrome requer service_worker em background (${file})`, 'warn');
      }

      if (manifest.browser_action) {
        this.log(`Chrome usa 'action' em vez de 'browser_action' (${file})`, 'warn');
      }
    } else if (target === 'Firefox') {
      // Firefox específico
      if (manifest.background && manifest.background.service_worker) {
        this.log(`Firefox pode não suportar service_worker completamente (${file})`, 'warn');
      }
    }
  }

  /**
   * Valida sincronização entre manifests
   */
  async validateManifestSync(manifests) {
    const firefox = manifests['Firefox'];
    const chrome = manifests['Chrome/Edge'];

    if (!firefox || !chrome) {
      this.log('Não é possível validar sincronização - manifests ausentes', 'warn');
      return;
    }

    // Campos que devem ser idênticos
    const syncFields = ['name', 'version', 'description'];

    for (const field of syncFields) {
      if (firefox[field] !== chrome[field]) {
        this.log(`Campo dessincronizado '${field}': Firefox="${firefox[field]}" vs Chrome="${chrome[field]}"`, 'error');
      }
    }

    this.log('   ✓ Sincronização de manifests validada');
  }

  /**
   * Valida código JavaScript
   */
  async validateJavaScript() {
    if (this.skipLinting) {
      this.log('⚡ Pulando validação de JavaScript (--skip-linting)');
      return;
    }

    this.log('🔍 Validando código JavaScript...');

    try {
      // Verifica se ESLint está disponível
      try {
        execSync('npx eslint --version', { stdio: 'pipe' });
      } catch (error) {
        this.log('ESLint não encontrado, pulando validação de código', 'warn');
        return;
      }

      // Lista arquivos JavaScript principais
      const jsFiles = [
        'background.js',
        'content-script.js',
        'sidebar.js',
        'api.js',
        'utils.js',
        'validation.js',
        'store.js',
        'config.js'
      ];

      const existingFiles = [];
      for (const file of jsFiles) {
        const filePath = path.join(PROJECT_ROOT, file);
        if (await fs.pathExists(filePath)) {
          existingFiles.push(file);
        }
      }

      if (existingFiles.length === 0) {
        this.log('Nenhum arquivo JavaScript encontrado para validação', 'warn');
        return;
      }

      // Executa ESLint
      const command = `npx eslint ${existingFiles.join(' ')} --format=compact`;

      try {
        execSync(command, {
          stdio: this.verbose ? 'inherit' : 'pipe',
          cwd: PROJECT_ROOT
        });
        this.log(`   ✓ ${existingFiles.length} arquivos JavaScript validados`);
      } catch (error) {
        this.log(`Problemas encontrados no código JavaScript`, 'warn');

        if (this.fixIssues) {
          try {
            execSync(`${command} --fix`, {
              stdio: this.verbose ? 'inherit' : 'pipe',
              cwd: PROJECT_ROOT
            });
            this.log('Auto-fix aplicado ao código JavaScript', 'fix');
          } catch (fixError) {
            this.log('Não foi possível aplicar auto-fix completo', 'warn');
          }
        }
      }

    } catch (error) {
      this.log(`Erro na validação de JavaScript: ${error.message}`, 'error');
    }
  }

  /**
   * Validações de segurança
   */
  async validateSecurity() {
    if (this.skipSecurity) {
      this.log('⚡ Pulando validações de segurança (--skip-security)');
      return;
    }

    this.log('🔒 Executando validações de segurança...');

    // Busca por padrões inseguros
    const securityPatterns = [
      {
        pattern: /innerHTML\s*=\s*[^"']*\+/g,
        message: 'Uso potencialmente inseguro de innerHTML com concatenação',
        severity: 'error'
      }
    ];

    const jsFiles = await this.findJavaScriptFiles();
    let issuesFound = 0;

    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);

      for (const { pattern, message, severity } of securityPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          issuesFound++;
          this.log(`${fileName}: ${message} (${matches.length} ocorrência(s))`, severity);
        }
      }
    }

    if (issuesFound === 0) {
      this.log('   ✓ Nenhum problema de segurança detectado');
    } else {
      this.log(`   ⚠️  ${issuesFound} problema(s) de segurança detectado(s)`);
    }
  }

  /**
   * Encontra arquivos JavaScript no projeto (excluindo arquivos de configuração)
   */
  async findJavaScriptFiles() {
    const files = [];

    // Arquivos e diretórios a serem ignorados
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist-zips',
      '.dist',
      'coverage',
      '__tests__',
      'jest.setup.js',
      'jest.config.js',
      'jest.polyfills.js',
      'webpack.config.js',
      'tailwind.config.js',
      'scripts/validate.js',
      'scripts/validate-improved.js'
    ];

    async function scan(dir) {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          // Pula diretórios específicos
          if (excludePatterns.includes(item)) {
            continue;
          }
          await scan(fullPath);
        } else if (item.endsWith('.js') && !item.includes('.min.')) {
          // Verifica se o arquivo deve ser excluído
          const relativePath = path.relative(PROJECT_ROOT, fullPath);
          const shouldExclude = excludePatterns.some(pattern =>
            item === pattern || relativePath.includes(pattern)
          );

          if (!shouldExclude) {
            files.push(fullPath);
          }
        }
      }
    }

    await scan(PROJECT_ROOT);
    return files;
  }

  /**
   * Valida compatibilidade cross-browser
   */
  async validateCompatibility() {
    this.log('🌐 Validando compatibilidade cross-browser...');

    const jsFiles = await this.findJavaScriptFiles();
    let compatibilityIssues = 0;

    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);

      // Ignora o arquivo BrowserAPI.js, que gerencia a API do browser intencionalmente
      if (fileName === 'BrowserAPI.js') {
        continue;
      }

      // Verifica uso direto de chrome.* sem fallback
      const hasDirectChromeUsage = /(?<!browser\s*\|\|\s*)(^|\s)chrome\./gm.test(content);
      const hasBrowserFallback = content.includes('globalThis.browser || globalThis.chrome') ||
                                 content.includes('browser || chrome');

      if (hasDirectChromeUsage && !hasBrowserFallback) {
        compatibilityIssues++;
        this.log(`${fileName}: Uso direto de chrome.* API sem fallback para browser.*`, 'warn');
      }
    }

    if (compatibilityIssues === 0) {
      this.log('   ✓ Nenhum problema de compatibilidade detectado');
    } else {
      this.log(`   ⚠️  ${compatibilityIssues} problema(s) de compatibilidade detectado(s)`);
    }
  }

  /**
   * Valida performance e tamanho
   */
  async validatePerformance() {
    this.log('⚡ Validando performance...');

    // Verifica se CSS foi compilado
    const cssPath = path.join(PROJECT_ROOT, 'dist', 'output.css');
    if (await fs.pathExists(cssPath)) {
      const stats = await fs.stat(cssPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      this.log(`   ✓ CSS compilado: ${sizeMB} MB`);
    } else {
      this.log('CSS não compilado - execute npm run build:css', 'warn');
    }
  }

  /**
   * Gera relatório de validação
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        fixes: this.fixes.length,
        status: this.errors.length === 0 ? 'PASS' : 'FAIL'
      },
      details: {
        errors: this.errors,
        warnings: this.warnings,
        fixes: this.fixes
      }
    };

    return report;
  }

  /**
   * Executa todas as validações
   */
  async validate() {
    const startTime = Date.now();

    this.log('🔍 Iniciando validações completas...\n');

    try {
      // Validações principais
      await this.validateManifests();
      await this.validateJavaScript();
      await this.validateSecurity();
      await this.validateCompatibility();
      await this.validatePerformance();

      // Gera relatório
      const report = this.generateReport();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Resumo final
      this.log(`\n📊 Validação concluída em ${duration}s:`);
      this.log(`   ❌ Erros: ${report.summary.errors}`);
      this.log(`   ⚠️  Avisos: ${report.summary.warnings}`);
      this.log(`   🔧 Correções: ${report.summary.fixes}`);
      this.log(`   📋 Status: ${report.summary.status}`);

      if (report.summary.status === 'PASS') {
        this.log('\n✅ Todas as validações passaram!', 'success');
      } else {
        this.log('\n❌ Validação falhou - corrija os erros antes de continuar', 'error');
      }

      return report;

    } catch (error) {
      this.log(`Erro durante validação: ${error.message}`, 'error');
      throw error;
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    verbose: false,
    fix: false,
    skipLinting: false,
    skipSecurity: false
  };

  // Parse argumentos
  for (const arg of args) {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--fix' || arg === '-f') {
      options.fix = true;
    } else if (arg === '--skip-linting') {
      options.skipLinting = true;
    } else if (arg === '--skip-security') {
      options.skipSecurity = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/validate-improved.js [opções]

Opções:
  --verbose, -v       Output detalhado
  --fix, -f           Aplica correções automáticas quando possível
  --skip-linting      Pula validação de código JavaScript
  --skip-security     Pula validações de segurança
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/validate-improved.js                 # Validação completa
  node scripts/validate-improved.js --fix           # Validação com auto-fix
  node scripts/validate-improved.js --verbose       # Validação com logs detalhados
`);
      process.exit(0);
    }
  }

  try {
    const validator = new ExtensionValidator(options);
    const report = await validator.validate();

    // Salva relatório
    const reportPath = path.join(PROJECT_ROOT, 'validation-report-improved.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(`\n📋 Relatório salvo em: ${reportPath}`);

    process.exit(report.summary.status === 'PASS' ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Validação falhou:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { ExtensionValidator };
