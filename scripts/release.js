#!/usr/bin/env node

/**
 * Enhanced Release Script - Assistente de Regulação Médica
 * 
 * Sistema completo de release que integra com o novo build system
 * Inclui validação, build, versionamento, GitHub release e store upload
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const simpleGit = require('simple-git');
const { Octokit } = require('@octokit/rest');
const semver = require('semver');

// Importa outros scripts
const { ExtensionBuilder } = require('./build.js');
const { ExtensionValidator } = require('./validate.js');
const { VersionManager } = require('./version.js');
const { StoreUploader } = require('./store-upload.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const git = simpleGit(PROJECT_ROOT);

// Configurações do repositório
const REPO_CONFIG = {
  owner: 'ShadyBS',
  repo: 'AssistenteDeRegulacaoMedica',
  mainBranch: 'main'
};

/**
 * Classe principal para gerenciar releases
 */
class ReleaseManager {
  constructor(options = {}) {
    this.version = options.version;
    this.increment = options.increment;
    this.dryRun = options.dryRun || false;
    this.skipValidation = options.skipValidation || false;
    this.skipBuild = options.skipBuild || false;
    this.skipGitHub = options.skipGitHub || false;
    this.skipStores = options.skipStores || false;
    this.autoPublish = options.autoPublish || false;
    this.verbose = options.verbose || false;
    
    this.steps = [];
    this.artifacts = [];
  }

  /**
   * Logging com timestamp e tracking de steps
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
      case 'step':
        console.log(`${prefix} 🔄 ${message}`);
        this.steps.push({ step: message, timestamp: new Date().toISOString() });
        break;
      case 'dry':
        console.log(`${prefix} 🔍 [DRY-RUN] ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Valida ambiente para release
   */
  async validateEnvironment() {
    this.log('🔍 Validando ambiente para release...', 'step');
    
    // Verifica Node.js version
    const nodeVersion = process.version;
    const requiredNodeVersion = '16.0.0';
    if (!this.isVersionCompatible(nodeVersion.substring(1), requiredNodeVersion)) {
      throw new Error(`Node.js ${requiredNodeVersion}+ é necessário. Versão atual: ${nodeVersion}`);
    }
    
    // Verifica se está em um repositório Git
    try {
      await git.checkIsRepo();
    } catch (error) {
      throw new Error('Não está em um repositório Git válido');
    }
    
    // Verifica branch atual
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    if (currentBranch !== REPO_CONFIG.mainBranch) {
      throw new Error(`Deve estar na branch '${REPO_CONFIG.mainBranch}' para criar release. Branch atual: ${currentBranch}`);
    }
    
    // Verifica se o diretório está limpo
    const status = await git.status();
    if (!status.isClean()) {
      throw new Error(
        'Diretório de trabalho tem modificações não commitadas.\n' +
        'Faça commit ou stash das alterações antes de criar release.'
      );
    }
    
    // Verifica se há commits para release
    await git.fetch(['--tags']);
    const lastTag = await this.getLastTag();
    if (lastTag) {
      const log = await git.log({ from: lastTag, to: 'HEAD' });
      if (log.all.length === 0) {
        throw new Error(`Não há commits novos desde a última tag ${lastTag}`);
      }
    }
    
    // Verifica variáveis de ambiente para GitHub
    if (!this.skipGitHub && !process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN não configurado. Configure no .env ou pule com --skip-github');
    }
    
    this.log('   ✓ Ambiente validado', 'success');
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
   * Obtém última tag do repositório
   */
  async getLastTag() {
    try {
      const tags = await git.tags();
      return tags.latest || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Executa validações de qualidade
   */
  async runValidations() {
    if (this.skipValidation) {
      this.log('⚡ Pulando validações (--skip-validation)');
      return;
    }
    
    this.log('🔍 Executando validações de qualidade...', 'step');
    
    if (this.dryRun) {
      this.log('Executaria validações completas', 'dry');
      return;
    }
    
    try {
      const validator = new ExtensionValidator({
        verbose: this.verbose,
        fix: false // Não aplicar fixes automáticos durante release
      });
      
      const report = await validator.validate();
      
      if (report.summary.status !== 'PASS') {
        throw new Error(
          `Validações falharam: ${report.summary.errors} erro(s), ${report.summary.warnings} aviso(s)\n` +
          'Corrija os problemas antes de criar release.'
        );
      }
      
      this.log(`   ✓ Validações passaram: ${report.summary.warnings} aviso(s)`, 'success');
      
    } catch (error) {
      throw new Error(`Falha nas validações: ${error.message}`);
    }
  }

  /**
   * Determina nova versão
   */
  async determineNewVersion() {
    this.log('🔢 Determinando nova versão...', 'step');
    
    const currentVersion = await this.getCurrentVersion();
    let newVersion;
    
    if (this.version) {
      // Versão específica fornecida
      if (!semver.valid(this.version)) {
        throw new Error(`Versão inválida: ${this.version}`);
      }
      
      if (!semver.gt(this.version, currentVersion)) {
        throw new Error(`Nova versão (${this.version}) deve ser maior que atual (${currentVersion})`);
      }
      
      newVersion = this.version;
      
    } else if (this.increment) {
      // Incremento automático
      newVersion = semver.inc(currentVersion, this.increment);
      
      if (!newVersion) {
        throw new Error(`Incremento inválido: ${this.increment}`);
      }
      
    } else {
      // Determina incremento baseado nos commits
      newVersion = await this.determineVersionFromCommits(currentVersion);
    }
    
    this.log(`   📋 Versão atual: ${currentVersion}`);
    this.log(`   🎯 Nova versão: ${newVersion}`);
    
    return { currentVersion, newVersion };
  }

  /**
   * Obtém versão atual do package.json
   */
  async getCurrentVersion() {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    return packageJson.version;
  }

  /**
   * Determina versão baseada nos commits (Conventional Commits)
   */
  async determineVersionFromCommits(currentVersion) {
    const lastTag = await this.getLastTag();
    const log = await git.log(lastTag ? { from: lastTag, to: 'HEAD' } : { maxCount: 50 });
    
    let hasBreaking = false;
    let hasFeature = false;
    let hasFix = false;
    
    for (const commit of log.all) {
      const message = commit.message.toLowerCase();
      
      if (message.includes('breaking change') || message.includes('!:')) {
        hasBreaking = true;
        break;
      } else if (message.startsWith('feat')) {
        hasFeature = true;
      } else if (message.startsWith('fix')) {
        hasFix = true;
      }
    }
    
    let increment;
    if (hasBreaking) {
      increment = 'major';
    } else if (hasFeature) {
      increment = 'minor';
    } else if (hasFix) {
      increment = 'patch';
    } else {
      increment = 'patch'; // Default para outros tipos de commit
    }
    
    this.log(`   🤖 Incremento automático determinado: ${increment}`);
    return semver.inc(currentVersion, increment);
  }

  /**
   * Atualiza versão nos arquivos
   */
  async updateVersion(newVersion) {
    this.log('📝 Atualizando versão nos arquivos...', 'step');
    
    if (this.dryRun) {
      this.log(`Atualizaria versão para ${newVersion}`, 'dry');
      return;
    }
    
    const versionManager = new VersionManager({
      dryRun: false,
      verbose: this.verbose,
      skipGit: true, // Faremos o commit manualmente
      skipChangelog: false
    });
    
    await versionManager.updatePackageJson(newVersion);
    await versionManager.updateManifests(newVersion);
    await versionManager.updateChangelog(newVersion);
    
    this.log(`   ✓ Versão atualizada para ${newVersion}`, 'success');
  }

  /**
   * Executa build completo
   */
  async runBuild() {
    if (this.skipBuild) {
      this.log('⚡ Pulando build (--skip-build)');
      return;
    }
    
    this.log('🏗️  Executando build completo...', 'step');
    
    if (this.dryRun) {
      this.log('Executaria build para Chrome e Firefox', 'dry');
      return;
    }
    
    try {
      const builder = new ExtensionBuilder({
        targets: ['chrome', 'firefox'],
        production: true,
        verbose: this.verbose
      });
      
      const report = await builder.build();
      
      // Registra artifacts criados
      for (const build of report.builds) {
        this.artifacts.push({
          type: 'zip',
          target: build.target,
          path: build.zipPath,
          size: build.size,
          version: build.version
        });
      }
      
      this.log(`   ✓ Build concluído: ${report.builds.length} ZIP(s) criado(s)`, 'success');
      
    } catch (error) {
      throw new Error(`Falha no build: ${error.message}`);
    }
  }

  /**
   * Cria commit e tag Git
   */
  async createGitTag(newVersion) {
    this.log('🏷️  Criando commit e tag Git...', 'step');
    
    if (this.dryRun) {
      this.log(`Criaria commit e tag v${newVersion}`, 'dry');
      return;
    }
    
    try {
      // Adiciona arquivos modificados
      await git.add([
        'package.json',
        'manifest.json',
        'manifest-edge.json',
        'CHANGELOG.md'
      ]);
      
      // Cria commit
      const commitMessage = `chore(release): v${newVersion}`;
      await git.commit(commitMessage);
      
      // Cria tag
      const tagName = `v${newVersion}`;
      await git.addTag(tagName);
      
      // Push
      await git.push('origin', REPO_CONFIG.mainBranch);
      await git.push('origin', tagName);
      
      this.log(`   ✓ Commit e tag ${tagName} criados e enviados`, 'success');
      
    } catch (error) {
      throw new Error(`Falha nas operações Git: ${error.message}`);
    }
  }

  /**
   * Gera changelog para release
   */
  async generateChangelog(currentVersion) {
    const lastTag = await this.getLastTag();
    const log = await git.log(lastTag ? { from: lastTag, to: 'HEAD' } : { maxCount: 50 });
    
    if (log.all.length === 0) {
      return 'Primeira release';
    }
    
    // Categoriza commits por tipo
    const categories = {
      feat: { title: '✨ Novas Funcionalidades', items: [] },
      fix: { title: '🐛 Correções', items: [] },
      docs: { title: '📚 Documentação', items: [] },
      style: { title: '💄 Estilo', items: [] },
      refactor: { title: '♻️ Refatorações', items: [] },
      perf: { title: '⚡ Performance', items: [] },
      test: { title: '✅ Testes', items: [] },
      chore: { title: '🔧 Manutenção', items: [] },
      security: { title: '🔒 Segurança', items: [] },
      other: { title: '📋 Outras Alterações', items: [] }
    };
    
    log.all.forEach(entry => {
      const message = entry.message.trim();
      const match = message.match(/^(\w+)(\(.+\))?\s*:\s*(.+)/);
      
      if (match) {
        const [, type, scope, description] = match;
        const category = categories[type] || categories.other;
        category.items.push(`- ${description}${scope ? ` ${scope}` : ''}`);
      } else {
        categories.other.items.push(`- ${message}`);
      }
    });
    
    // Monta changelog
    let changelog = '';
    
    for (const [key, category] of Object.entries(categories)) {
      if (category.items.length > 0) {
        changelog += `## ${category.title}\n${category.items.join('\n')}\n\n`;
      }
    }
    
    return changelog.trim() || 'Atualizações diversas';
  }

  /**
   * Cria release no GitHub
   */
  async createGitHubRelease(newVersion) {
    if (this.skipGitHub) {
      this.log('⚡ Pulando GitHub release (--skip-github)');
      return;
    }
    
    this.log('🚀 Criando release no GitHub...', 'step');
    
    if (this.dryRun) {
      this.log(`Criaria release v${newVersion} no GitHub`, 'dry');
      return;
    }
    
    try {
      const octokit = new Octokit({ 
        auth: process.env.GITHUB_TOKEN,
        userAgent: 'AssistenteDeRegulacao-Release-Script/2.0.0'
      });
      
      // Gera changelog
      const changelog = await this.generateChangelog();
      
      // Cria release
      const releaseResponse = await octokit.repos.createRelease({
        owner: REPO_CONFIG.owner,
        repo: REPO_CONFIG.repo,
        tag_name: `v${newVersion}`,
        name: `v${newVersion}`,
        body: changelog,
        draft: false,
        prerelease: semver.prerelease(newVersion) !== null,
      });
      
      this.log(`   ✓ Release criado: ${releaseResponse.data.html_url}`, 'success');
      
      // Upload de assets
      const releaseId = releaseResponse.data.id;
      const zipArtifacts = this.artifacts.filter(a => a.type === 'zip');
      
      if (zipArtifacts.length > 0) {
        this.log(`   📤 Fazendo upload de ${zipArtifacts.length} arquivo(s)...`);
        
        for (const artifact of zipArtifacts) {
          const fileName = path.basename(artifact.path);
          const fileData = await fs.readFile(artifact.path);
          
          await octokit.repos.uploadReleaseAsset({
            owner: REPO_CONFIG.owner,
            repo: REPO_CONFIG.repo,
            release_id: releaseId,
            name: fileName,
            data: fileData,
          });
          
          this.log(`      • ${fileName} (${artifact.target})`);
        }
        
        this.log(`   ✅ Todos os arquivos enviados`, 'success');
      }
      
      return releaseResponse.data;
      
    } catch (error) {
      throw new Error(`Falha no GitHub release: ${error.message}`);
    }
  }

  /**
   * Upload para stores (opcional)
   */
  async uploadToStores() {
    if (this.skipStores) {
      this.log('⚡ Pulando upload para stores (--skip-stores)');
      return;
    }
    
    this.log('🏪 Preparando upload para stores...', 'step');
    
    if (this.dryRun) {
      this.log('Faria upload para Chrome Web Store e Firefox Add-ons', 'dry');
      return;
    }
    
    const results = {};
    
    // Chrome Web Store
    try {
    if (process.env.CHROME_EXTENSION_ID) {
    this.log('   🔵 Fazendo upload para Chrome Web Store...');
    
    const chromeUploader = new StoreUploader({
    target: 'chrome',
    autoPublish: this.autoPublish,
    verbose: this.verbose
    });
    
    results.chrome = await chromeUploader.upload();
    this.log(`   ✓ Chrome Web Store: ${results.chrome.success ? 'Sucesso' : 'Falha'}`, 'success');
    
    } else {
    this.log('   ⚠️  Chrome Web Store: Variáveis de ambiente não configuradas', 'warn');
    }
    } catch (error) {
    this.log(`   ❌ Chrome Web Store: ${error.message}`, 'error');
    results.chrome = { success: false, error: error.message };
    }
    
    // Firefox Add-ons
    try {
      if (process.env.FIREFOX_JWT_ISSUER) {
        this.log('   🦊 Preparando upload para Firefox Add-ons...');
        
        const firefoxUploader = new StoreUploader({
          target: 'firefox',
          verbose: this.verbose
        });
        
        results.firefox = await firefoxUploader.upload();
        this.log(`   ✓ Firefox Add-ons: ${results.firefox.success ? 'Sucesso' : 'Falha'}`, 'success');
        
      } else {
        this.log('   ⚠️  Firefox Add-ons: Variáveis de ambiente não configuradas', 'warn');
      }
    } catch (error) {
      this.log(`   ❌ Firefox Add-ons: ${error.message}`, 'error');
      results.firefox = { success: false, error: error.message };
    }
    
    return results;
  }

  /**
   * Gera relatório final
   */
  generateReport(versionInfo, releaseData, storeResults) {
    return {
      timestamp: new Date().toISOString(),
      version: versionInfo,
      steps: this.steps,
      artifacts: this.artifacts,
      github: releaseData ? {
        url: releaseData.html_url,
        id: releaseData.id,
        assets: releaseData.assets?.length || 0
      } : null,
      stores: storeResults || {},
      dryRun: this.dryRun
    };
  }

  /**
   * Executa processo completo de release
   */
  async release() {
    const startTime = Date.now();
    
    try {
      this.log('🚀 Iniciando processo de release completo...\n');
      
      // 1. Validação de ambiente
      await this.validateEnvironment();
      
      // 2. Validações de qualidade
      await this.runValidations();
      
      // 3. Determina nova versão
      const versionInfo = await this.determineNewVersion();
      
      // 4. Atualiza versão nos arquivos
      await this.updateVersion(versionInfo.newVersion);
      
      // 5. Executa build
      await this.runBuild();
      
      // 6. Cria commit e tag Git
      await this.createGitTag(versionInfo.newVersion);
      
      // 7. Cria release no GitHub
      const releaseData = await this.createGitHubRelease(versionInfo.newVersion);
      
      // 8. Upload para stores (opcional)
      const storeResults = await this.uploadToStores();
      
      // Gera relatório final
      const report = this.generateReport(versionInfo, releaseData, storeResults);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Resumo final
      this.log(`\n🎉 Release v${versionInfo.newVersion} concluído!`, 'success');
      this.log(`   ⏱️  Tempo total: ${duration}s`);
      this.log(`   📊 Steps executados: ${this.steps.length}`);
      this.log(`   📦 Artifacts criados: ${this.artifacts.length}`);
      
      if (releaseData) {
        this.log(`   🔗 GitHub: ${releaseData.html_url}`);
      }
      
      if (storeResults.chrome?.success) {
        this.log(`   🔵 Chrome Web Store: Upload concluído`);
      }
      
      if (storeResults.firefox?.success) {
        this.log(`   🦊 Firefox Add-ons: Upload concluído`);
      }
      
      // Próximos passos
      this.log(`\n📋 Próximos passos:`);
      if (releaseData) {
        this.log(`   • Verifique a release: ${releaseData.html_url}`);
      }
      this.log(`   • Teste os ZIPs baixados`);
      this.log(`   • Monitore aprovação nas stores`);
      this.log(`   • Comunique a release para usuários`);
      
      return report;
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.log(`\n❌ Release falhou após ${duration}s:`, 'error');
      this.log(`   ${error.message}`);
      
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
  
  const options = {
    version: null,
    increment: null,
    dryRun: false,
    skipValidation: false,
    skipBuild: false,
    skipGitHub: false,
    skipStores: false,
    autoPublish: false,
    verbose: false
  };
  
  // Parse argumentos
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (semver.valid(arg)) {
      options.version = arg;
    } else if (['patch', 'minor', 'major', 'prerelease'].includes(arg)) {
      options.increment = arg;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--skip-validation') {
      options.skipValidation = true;
    } else if (arg === '--skip-build') {
      options.skipBuild = true;
    } else if (arg === '--skip-github') {
      options.skipGitHub = true;
    } else if (arg === '--skip-stores') {
      options.skipStores = true;
    } else if (arg === '--auto-publish') {
      options.autoPublish = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/release.js [versão|incremento] [opções]

Versão/Incremento:
  1.2.3           Define versão específica
  patch           Incrementa patch (1.0.0 → 1.0.1)
  minor           Incrementa minor (1.0.0 → 1.1.0)
  major           Incrementa major (1.0.0 → 2.0.0)
  prerelease      Incrementa prerelease (1.0.0 → 1.0.1-0)
  (automático)    Determina incremento baseado nos commits

Opções:
  --dry-run, -d       Simula o release sem fazer alterações
  --skip-validation   Pula validações de qualidade
  --skip-build        Pula processo de build
  --skip-github       Pula criação de GitHub release
  --skip-stores       Pula upload para stores
  --auto-publish      Publica automaticamente nas stores
  --verbose, -v       Output detalhado
  --help, -h          Mostra esta ajuda

Variáveis de Ambiente:
  GITHUB_TOKEN            Token para GitHub releases
  CHROME_EXTENSION_ID     ID da extensão no Chrome Web Store
  CHROME_CLIENT_ID        Client ID da API do Google
  CHROME_CLIENT_SECRET    Client Secret da API do Google
  CHROME_REFRESH_TOKEN    Refresh Token OAuth2
  FIREFOX_JWT_ISSUER      JWT Issuer para Firefox Add-ons
  FIREFOX_JWT_SECRET      JWT Secret para Firefox Add-ons

Exemplos:
  node scripts/release.js                    # Release automático
  node scripts/release.js patch              # Release patch
  node scripts/release.js 2.0.0              # Release versão específica
  node scripts/release.js --dry-run          # Simula release
  node scripts/release.js --skip-stores      # Release sem upload para stores
`);
      process.exit(0);
    }
  }
  
  try {
    const releaseManager = new ReleaseManager(options);
    const report = await releaseManager.release();
    
    // Salva relatório
    const reportPath = path.join(PROJECT_ROOT, 'release-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(`\n📋 Relatório salvo em: ${reportPath}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Release falhou:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { ReleaseManager };