#!/usr/bin/env node

/**
 * Version Management Script - Assistente de Regulação Médica
 * 
 * Sistema de versionamento semântico que atualiza:
 * - package.json
 * - manifest.json (Firefox)
 * - manifest-edge.json (Chrome/Edge)
 * - CHANGELOG.md
 * - Git tags
 */

const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const simpleGit = require('simple-git');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const git = simpleGit(PROJECT_ROOT);

/**
 * Classe para gerenciamento de versões
 */
class VersionManager {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.skipGit = options.skipGit || false;
    this.skipChangelog = options.skipChangelog || false;
    
    this.changes = [];
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
      case 'dry':
        console.log(`${prefix} 🔍 [DRY-RUN] ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Obtém versão atual do package.json
   */
  async getCurrentVersion() {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!await fs.pathExists(packagePath)) {
      throw new Error('package.json não encontrado');
    }
    
    const packageJson = await fs.readJson(packagePath);
    
    if (!packageJson.version) {
      throw new Error('Versão não encontrada no package.json');
    }
    
    return packageJson.version;
  }

  /**
   * Valida se a nova versão é válida
   */
  validateNewVersion(currentVersion, newVersion, increment) {
    if (!semver.valid(newVersion)) {
      throw new Error(`Versão inválida: ${newVersion}`);
    }
    
    if (!semver.gt(newVersion, currentVersion)) {
      throw new Error(`Nova versão (${newVersion}) deve ser maior que a atual (${currentVersion})`);
    }
    
    // Valida se o incremento está correto
    if (increment) {
      const expectedVersion = semver.inc(currentVersion, increment);
      if (newVersion !== expectedVersion) {
        throw new Error(`Versão esperada para ${increment}: ${expectedVersion}, recebida: ${newVersion}`);
      }
    }
    
    return true;
  }

  /**
   * Calcula nova versão baseada no incremento
   */
  calculateNewVersion(currentVersion, increment) {
    const validIncrements = ['patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'];
    
    if (!validIncrements.includes(increment)) {
      throw new Error(`Incremento inválido: ${increment}. Use: ${validIncrements.join(', ')}`);
    }
    
    return semver.inc(currentVersion, increment);
  }

  /**
   * Atualiza package.json
   */
  async updatePackageJson(newVersion) {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    
    this.log(`📦 Atualizando package.json...`);
    
    if (this.dryRun) {
      this.log(`Atualizaria package.json para versão ${newVersion}`, 'dry');
      return;
    }
    
    const packageJson = await fs.readJson(packagePath);
    const oldVersion = packageJson.version;
    
    packageJson.version = newVersion;
    
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });
    
    this.changes.push({
      file: 'package.json',
      oldVersion,
      newVersion
    });
    
    this.log(`   ✓ package.json: ${oldVersion} → ${newVersion}`, 'success');
  }

  /**
   * Atualiza manifests
   */
  async updateManifests(newVersion) {
    const manifestFiles = [
      { file: 'manifest.json', description: 'Firefox' },
      { file: 'manifest-edge.json', description: 'Chrome/Edge' }
    ];
    
    this.log(`📄 Atualizando manifests...`);
    
    for (const { file, description } of manifestFiles) {
      const manifestPath = path.join(PROJECT_ROOT, file);
      
      if (!await fs.pathExists(manifestPath)) {
        this.log(`   ⚠️  ${file} não encontrado`, 'warn');
        continue;
      }
      
      if (this.dryRun) {
        this.log(`Atualizaria ${file} (${description}) para versão ${newVersion}`, 'dry');
        continue;
      }
      
      try {
        // Lê manifest preservando formatação
        const content = await fs.readFile(manifestPath, 'utf8');
        const cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM
        const manifest = JSON.parse(cleanContent);
        
        const oldVersion = manifest.version;
        manifest.version = newVersion;
        
        // Escreve com formatação consistente
        const newContent = JSON.stringify(manifest, null, 2) + '\n';
        await fs.writeFile(manifestPath, newContent, 'utf8');
        
        this.changes.push({
          file,
          oldVersion,
          newVersion,
          description
        });
        
        this.log(`   ✓ ${file} (${description}): ${oldVersion} → ${newVersion}`, 'success');
        
      } catch (error) {
        this.log(`   ❌ Erro ao atualizar ${file}: ${error.message}`, 'error');
        throw error;
      }
    }
  }

  /**
   * Atualiza CHANGELOG.md
   */
  async updateChangelog(newVersion) {
    if (this.skipChangelog) {
      this.log('⚡ Pulando atualização do CHANGELOG (--skip-changelog)');
      return;
    }
    
    const changelogPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');
    
    this.log(`📝 Atualizando CHANGELOG.md...`);
    
    if (this.dryRun) {
      this.log(`Atualizaria CHANGELOG.md com versão ${newVersion}`, 'dry');
      return;
    }
    
    try {
      let changelogContent = '';
      
      if (await fs.pathExists(changelogPath)) {
        changelogContent = await fs.readFile(changelogPath, 'utf8');
      } else {
        // Cria CHANGELOG inicial
        changelogContent = `# Changelog - Assistente de Regulação Médica

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

`;
      }
      
      // Gera entrada para nova versão
      const today = new Date().toISOString().split('T')[0];
      const newEntry = `## [${newVersion}] - ${today}

### Added
- Nova versão ${newVersion}

### Changed
- Atualizações diversas

### Fixed
- Correções de bugs

`;
      
      // Insere nova entrada após [Unreleased]
      const unreleasedIndex = changelogContent.indexOf('## [Unreleased]');
      
      if (unreleasedIndex !== -1) {
        const insertIndex = changelogContent.indexOf('\n\n', unreleasedIndex) + 2;
        changelogContent = 
          changelogContent.slice(0, insertIndex) +
          newEntry +
          changelogContent.slice(insertIndex);
      } else {
        // Se não encontrar [Unreleased], adiciona no início
        changelogContent = `# Changelog - Assistente de Regulação Médica

## [Unreleased]

${newEntry}${changelogContent}`;
      }
      
      await fs.writeFile(changelogPath, changelogContent, 'utf8');
      
      this.changes.push({
        file: 'CHANGELOG.md',
        action: 'updated',
        version: newVersion
      });
      
      this.log(`   ✓ CHANGELOG.md atualizado com versão ${newVersion}`, 'success');
      
    } catch (error) {
      this.log(`   ⚠️  Erro ao atualizar CHANGELOG: ${error.message}`, 'warn');
    }
  }

  /**
   * Cria commit e tag Git
   */
  async createGitTag(newVersion) {
    if (this.skipGit) {
      this.log('⚡ Pulando operações Git (--skip-git)');
      return;
    }
    
    this.log(`🏷️  Criando tag Git...`);
    
    if (this.dryRun) {
      this.log(`Criaria commit e tag v${newVersion}`, 'dry');
      return;
    }
    
    try {
      // Verifica se há mudanças para commitar
      const status = await git.status();
      
      if (status.files.length > 0) {
        // Adiciona arquivos modificados
        await git.add([
          'package.json',
          'manifest.json',
          'manifest-edge.json',
          'CHANGELOG.md'
        ]);
        
        // Cria commit
        const commitMessage = `chore(release): bump version to ${newVersion}`;
        await git.commit(commitMessage);
        
        this.log(`   ✓ Commit criado: ${commitMessage}`, 'success');
      }
      
      // Cria tag
      const tagName = `v${newVersion}`;
      await git.addTag(tagName);
      
      this.log(`   ✓ Tag ${tagName} criada`, 'success');
      
      this.changes.push({
        action: 'git',
        commit: `chore(release): bump version to ${newVersion}`,
        tag: tagName
      });
      
    } catch (error) {
      this.log(`   ❌ Erro nas operações Git: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Valida ambiente antes de executar
   */
  async validateEnvironment() {
    this.log('🔍 Validando ambiente...');
    
    // Verifica se está em um repositório Git
    if (!this.skipGit) {
      try {
        await git.checkIsRepo();
      } catch (error) {
        throw new Error('Não está em um repositório Git válido');
      }
      
      // Verifica se o diretório está limpo (exceto arquivos que serão modificados)
      const status = await git.status();
      const allowedModified = ['package.json', 'manifest.json', 'manifest-edge.json', 'CHANGELOG.md'];
      const unexpectedChanges = status.files.filter(file => 
        !allowedModified.includes(file.path) && file.working_dir !== ' '
      );
      
      if (unexpectedChanges.length > 0) {
        this.log('⚠️  Há modificações não commitadas:', 'warn');
        unexpectedChanges.forEach(file => {
          this.log(`     ${file.path} (${file.working_dir})`, 'warn');
        });
        
        if (!this.dryRun) {
          throw new Error('Faça commit das modificações antes de alterar a versão');
        }
      }
    }
    
    // Verifica se os arquivos necessários existem
    const requiredFiles = ['package.json'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Arquivo obrigatório não encontrado: ${file}`);
      }
    }
    
    this.log('   ✓ Ambiente validado', 'success');
  }

  /**
   * Gera relatório das mudanças
   */
  generateReport(currentVersion, newVersion) {
    const report = {
      timestamp: new Date().toISOString(),
      version: {
        from: currentVersion,
        to: newVersion,
        increment: this.getVersionIncrement(currentVersion, newVersion)
      },
      changes: this.changes,
      dryRun: this.dryRun
    };
    
    return report;
  }

  /**
   * Determina o tipo de incremento da versão
   */
  getVersionIncrement(oldVersion, newVersion) {
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);
    
    if (newParts[0] > oldParts[0]) return 'major';
    if (newParts[1] > oldParts[1]) return 'minor';
    if (newParts[2] > oldParts[2]) return 'patch';
    
    return 'unknown';
  }

  /**
   * Executa bump de versão
   */
  async bumpVersion(increment, customVersion = null) {
    const startTime = Date.now();
    
    try {
      // Validação inicial
      await this.validateEnvironment();
      
      // Obtém versão atual
      const currentVersion = await this.getCurrentVersion();
      this.log(`📋 Versão atual: ${currentVersion}`);
      
      // Calcula nova versão
      let newVersion;
      if (customVersion) {
        newVersion = customVersion;
        this.validateNewVersion(currentVersion, newVersion);
      } else {
        newVersion = this.calculateNewVersion(currentVersion, increment);
      }
      
      this.log(`🎯 Nova versão: ${newVersion} (${increment || 'custom'})`);
      
      if (this.dryRun) {
        this.log('🔍 Modo DRY-RUN - nenhuma alteração será feita', 'dry');
      }
      
      // Executa atualizações
      await this.updatePackageJson(newVersion);
      await this.updateManifests(newVersion);
      await this.updateChangelog(newVersion);
      await this.createGitTag(newVersion);
      
      // Gera relatório
      const report = this.generateReport(currentVersion, newVersion);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Resumo final
      this.log(`\n🎉 Versão atualizada com sucesso!`, 'success');
      this.log(`   ⏱️  Tempo: ${duration}s`);
      this.log(`   📊 Arquivos modificados: ${this.changes.length}`);
      this.log(`   🔄 ${currentVersion} → ${newVersion}`);
      
      if (!this.dryRun) {
        this.log(`\n📋 Próximos passos:`);
        this.log(`   • Execute 'git push origin main --tags' para enviar as mudanças`);
        this.log(`   • Execute 'npm run build:all' para gerar builds`);
        this.log(`   • Execute 'npm run release ${newVersion}' para criar release`);
      }
      
      return report;
      
    } catch (error) {
      this.log(`Falha no bump de versão: ${error.message}`, 'error');
      throw error;
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Uso: node scripts/version.js <incremento|versão> [opções]

Incrementos:
  patch       Incrementa versão patch (1.0.0 → 1.0.1)
  minor       Incrementa versão minor (1.0.0 → 1.1.0)
  major       Incrementa versão major (1.0.0 → 2.0.0)
  prerelease  Incrementa prerelease (1.0.0 → 1.0.1-0)
  
Ou especifique uma versão específica:
  1.2.3       Define versão específica

Opções:
  --dry-run, -d       Simula as mudanças sem aplicá-las
  --verbose, -v       Output detalhado
  --skip-git          Pula operações Git (commit e tag)
  --skip-changelog    Pula atualização do CHANGELOG.md
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/version.js patch           # Incrementa patch
  node scripts/version.js minor --dry-run # Simula incremento minor
  node scripts/version.js 2.0.0           # Define versão específica
`);
    process.exit(0);
  }
  
  const versionArg = args[0];
  const options = {
    dryRun: false,
    verbose: false,
    skipGit: false,
    skipChangelog: false
  };
  
  // Parse opções
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--skip-git') {
      options.skipGit = true;
    } else if (arg === '--skip-changelog') {
      options.skipChangelog = true;
    } else if (arg === '--help' || arg === '-h') {
      // Já mostrado acima
      process.exit(0);
    }
  }
  
  try {
    const versionManager = new VersionManager(options);
    
    // Determina se é incremento ou versão específica
    const validIncrements = ['patch', 'minor', 'major', 'prerelease', 'prepatch', 'preminor', 'premajor'];
    
    if (validIncrements.includes(versionArg)) {
      // É um incremento
      await versionManager.bumpVersion(versionArg);
    } else if (semver.valid(versionArg)) {
      // É uma versão específica
      await versionManager.bumpVersion(null, versionArg);
    } else {
      throw new Error(`Incremento ou versão inválida: ${versionArg}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro no gerenciamento de versão:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { VersionManager };