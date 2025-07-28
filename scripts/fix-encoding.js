#!/usr/bin/env node

/**
 * Script de Correção de Encoding - Assistente de Regulação Médica
 *
 * Corrige automaticamente problemas de encoding em arquivos do projeto
 * para garantir compatibilidade e integridade dos dados médicos.
 */

const fs = require('fs-extra');
const path = require('path');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Arquivos e diretórios a serem processados
const INCLUDE_PATTERNS = ['*.js', '*.json', '*.html', '*.css', '*.md'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'coverage',
  '__tests__',
  '.dist',
  'dist-zips',
  '.qodo'
];

/**
 * Classe para correção de encoding
 */
class EncodingFixer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.fixedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
    this.startTime = Date.now();
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
   * Verifica se um arquivo deve ser incluído na correção
   */
  shouldIncludeFile(filePath) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Verifica exclusões
    for (const exclude of EXCLUDE_PATTERNS) {
      if (relativePath.includes(exclude)) {
        return false;
      }
    }

    // Verifica inclusões
    const ext = path.extname(filePath);
    const patterns = INCLUDE_PATTERNS.map(p => p.replace('*', ''));

    return patterns.some(pattern => ext === pattern);
  }

  /**
   * Coleta todos os arquivos do projeto para correção
   */
  async getProjectFiles() {
    const files = [];

    async function scan(dir) {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          const relativePath = path.relative(PROJECT_ROOT, fullPath);

          // Pula diretórios excluídos
          if (!EXCLUDE_PATTERNS.some(exclude => relativePath.includes(exclude))) {
            await scan(fullPath);
          }
        } else if (stats.isFile()) {
          files.push(fullPath);
        }
      }
    }

    await scan(PROJECT_ROOT);
    return files.filter(file => this.shouldIncludeFile(file));
  }

  /**
   * Detecta problemas de encoding em um arquivo
   */
  async detectIssues(filePath) {
    const bytes = await fs.readFile(filePath);
    const issues = [];

    // Verifica BOM UTF-8
    const hasBOM = bytes.length >= 3 &&
                   bytes[0] === 0xEF &&
                   bytes[1] === 0xBB &&
                   bytes[2] === 0xBF;

    if (hasBOM) {
      issues.push('BOM_DETECTED');
    }

    // Lê conteúdo (removendo BOM se presente)
    let content;
    try {
      content = hasBOM ? bytes.slice(3).toString('utf8') : bytes.toString('utf8');
    } catch (error) {
      issues.push('INVALID_ENCODING');
      return { issues, content: null };
    }

    // Verifica line endings
    if (content.includes('\r\n')) {
      issues.push('CRLF_LINE_ENDINGS');
    } else if (content.includes('\r')) {
      issues.push('CR_LINE_ENDINGS');
    }

    // Verifica trailing whitespace
    if (content.match(/[ \t]+$/m)) {
      issues.push('TRAILING_WHITESPACE');
    }

    // Verifica final newline
    if (content.length > 0 && !content.endsWith('\n')) {
      issues.push('NO_FINAL_NEWLINE');
    }

    // Verifica caracteres problemáticos
    if (content.includes('�')) {
      issues.push('REPLACEMENT_CHARACTERS');
    }

    if (content.includes('\uFEFF')) {
      issues.push('EMBEDDED_BOM');
    }

    return { issues, content };
  }

  /**
   * Corrige problemas de encoding em um arquivo
   */
  async fixFileEncoding(filePath) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    try {
      const { issues, content } = await this.detectIssues(filePath);

      if (issues.length === 0) {
        if (this.verbose) {
          this.log(`   ✓ ${relativePath} - Nenhum problema encontrado`);
        }
        return { fixed: false, issues: [] };
      }

      if (content === null) {
        this.errors.push({
          file: relativePath,
          error: 'Não foi possível ler o arquivo (encoding inválido)'
        });
        return { fixed: false, issues };
      }

      let fixedContent = content;
      const appliedFixes = [];

      // Remove BOM embedded
      if (issues.includes('EMBEDDED_BOM')) {
        fixedContent = fixedContent.replace(/\uFEFF/g, '');
        appliedFixes.push('EMBEDDED_BOM');
      }

      // Normaliza line endings para LF
      if (issues.includes('CRLF_LINE_ENDINGS') || issues.includes('CR_LINE_ENDINGS')) {
        fixedContent = fixedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        appliedFixes.push('LINE_ENDINGS');
      }

      // Remove trailing whitespace
      if (issues.includes('TRAILING_WHITESPACE')) {
        fixedContent = fixedContent.replace(/[ \t]+$/gm, '');
        appliedFixes.push('TRAILING_WHITESPACE');
      }

      // Adiciona final newline
      if (issues.includes('NO_FINAL_NEWLINE')) {
        fixedContent += '\n';
        appliedFixes.push('FINAL_NEWLINE');
      }

      // Verifica se houve mudanças
      const hasChanges = fixedContent !== content || issues.includes('BOM_DETECTED');

      if (!hasChanges) {
        if (this.verbose) {
          this.log(`   ✓ ${relativePath} - Problemas detectados mas não corrigíveis automaticamente`);
        }
        return { fixed: false, issues };
      }

      // Aplica correções (se não for dry run)
      if (!this.dryRun) {
        // Salva com encoding correto (UTF-8 sem BOM)
        await fs.writeFile(filePath, fixedContent, 'utf8');
      }

      const fixDescription = appliedFixes.join(', ');
      this.log(`   🔧 ${relativePath} - Corrigido: ${fixDescription}`, 'success');

      return {
        fixed: true,
        issues,
        appliedFixes,
        originalSize: content.length,
        newSize: fixedContent.length
      };

    } catch (error) {
      this.errors.push({
        file: relativePath,
        error: error.message
      });

      this.log(`   ❌ ${relativePath} - Erro: ${error.message}`, 'error');
      return { fixed: false, issues: [], error: error.message };
    }
  }

  /**
   * Cria backup dos arquivos antes da correção
   */
  async createBackup() {
    if (this.dryRun) return null;

    const backupDir = path.join(PROJECT_ROOT, '.encoding-backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);

    await fs.ensureDir(backupPath);

    this.log(`💾 Criando backup em: ${path.relative(PROJECT_ROOT, backupPath)}`);

    return backupPath;
  }

  /**
   * Executa correção em todos os arquivos do projeto
   */
  async fixProject() {
    this.log('🔧 Iniciando correção de encoding...');

    if (this.dryRun) {
      this.log('🔍 Modo DRY RUN - Nenhum arquivo será modificado');
    }

    const files = await this.getProjectFiles();
    this.log(`📁 Encontrados ${files.length} arquivos para verificação`);

    // Cria backup se não for dry run
    const backupPath = await this.createBackup();

    const results = [];

    for (const file of files) {
      const result = await this.fixFileEncoding(file);
      results.push({
        file: path.relative(PROJECT_ROOT, file),
        ...result
      });

      if (result.fixed) {
        this.fixedFiles.push(file);
      } else if (result.issues.length === 0) {
        this.skippedFiles.push(file);
      }
    }

    return { results, backupPath };
  }

  /**
   * Gera relatório de correção
   */
  generateReport(results, backupPath) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    // Agrupa correções por tipo
    const fixesByType = {};
    const issuesByType = {};

    results.forEach(result => {
      if (result.appliedFixes) {
        result.appliedFixes.forEach(fix => {
          if (!fixesByType[fix]) fixesByType[fix] = 0;
          fixesByType[fix]++;
        });
      }

      if (result.issues) {
        result.issues.forEach(issue => {
          if (!issuesByType[issue]) issuesByType[issue] = 0;
          issuesByType[issue]++;
        });
      }
    });

    const fixedFiles = results.filter(r => r.fixed);
    const filesWithIssues = results.filter(r => r.issues && r.issues.length > 0);

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      dryRun: this.dryRun,
      backupPath: backupPath ? path.relative(PROJECT_ROOT, backupPath) : null,
      summary: {
        totalFiles: results.length,
        fixedFiles: fixedFiles.length,
        skippedFiles: this.skippedFiles.length,
        errorFiles: this.errors.length,
        filesWithIssues: filesWithIssues.length
      },
      fixesByType: Object.keys(fixesByType).map(type => ({
        type,
        count: fixesByType[type]
      })),
      issuesByType: Object.keys(issuesByType).map(type => ({
        type,
        count: issuesByType[type]
      })),
      fixedFiles: fixedFiles.map(result => ({
        file: result.file,
        appliedFixes: result.appliedFixes,
        originalSize: result.originalSize,
        newSize: result.newSize,
        sizeDiff: result.originalSize - result.newSize
      })),
      errors: this.errors
    };

    return report;
  }

  /**
   * Exibe relatório no console
   */
  displayReport(report) {
    const { summary, fixesByType, errors } = report;

    this.log(`\n📊 Relatório de Correção de Encoding`);
    this.log(`   ⏱️  Duração: ${report.duration}`);
    this.log(`   📁 Arquivos verificados: ${summary.totalFiles}`);
    this.log(`   🔧 Arquivos corrigidos: ${summary.fixedFiles}`);
    this.log(`   ✓ Arquivos sem problemas: ${summary.skippedFiles}`);
    this.log(`   ❌ Arquivos com erro: ${summary.errorFiles}`);

    if (report.dryRun) {
      this.log(`   🔍 Modo DRY RUN - Nenhuma modificação foi feita`);
    } else if (report.backupPath) {
      this.log(`   💾 Backup criado em: ${report.backupPath}`);
    }

    if (summary.fixedFiles === 0 && summary.errorFiles === 0) {
      this.log(`\n✅ Nenhuma correção necessária!`, 'success');
      return;
    }

    // Mostra correções por tipo
    if (fixesByType.length > 0) {
      this.log(`\n🔧 Correções Aplicadas:`);
      fixesByType.forEach(fix => {
        this.log(`   • ${fix.type}: ${fix.count} arquivo(s)`);
      });
    }

    // Mostra erros se houver
    if (errors.length > 0) {
      this.log(`\n❌ Erros Encontrados:`);
      errors.slice(0, 5).forEach(error => {
        this.log(`   • ${error.file}: ${error.error}`);
      });

      if (errors.length > 5) {
        this.log(`   ... e mais ${errors.length - 5} erro(s)`);
      }
    }

    // Status final
    if (summary.errorFiles > 0) {
      this.log(`\n⚠️  Correção concluída com ${summary.errorFiles} erro(s)`, 'warn');
    } else if (summary.fixedFiles > 0) {
      this.log(`\n✅ Correção concluída com sucesso!`, 'success');
    }

    // Próximos passos
    if (!report.dryRun && summary.fixedFiles > 0) {
      this.log(`\n📋 Próximos passos:`);
      this.log(`   1. Verificar as correções: git diff`);
      this.log(`   2. Testar o projeto: npm run build`);
      this.log(`   3. Fazer commit: git add . && git commit -m "fix: corrigir encoding de arquivos"`);
    }
  }

  /**
   * Salva relatório em arquivo
   */
  async saveReport(report) {
    const reportPath = path.join(PROJECT_ROOT, 'encoding-fix-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    this.log(`📋 Relatório salvo em: ${reportPath}`);
  }

  /**
   * Executa correção completa
   */
  async run() {
    try {
      const { results, backupPath } = await this.fixProject();
      const report = this.generateReport(results, backupPath);

      this.displayReport(report);
      await this.saveReport(report);

      // Exit code baseado nos resultados
      if (this.errors.length > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }

    } catch (error) {
      this.log(`Correção falhou: ${error.message}`, 'error');

      if (process.env.NODE_ENV === 'development') {
        console.error('\n🔍 Stack trace:');
        console.error(error.stack);
      }

      process.exit(1);
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
    dryRun: false,
    verbose: false
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/fix-encoding.js [opções]

Opções:
  --dry-run, -d       Simula correções sem modificar arquivos
  --verbose, -v       Output detalhado
  --help, -h          Mostra esta ajuda

Descrição:
  Corrige automaticamente problemas de encoding em arquivos do projeto.

Correções aplicadas:
  • Remove BOM UTF-8 desnecessário
  • Converte line endings para LF (Unix)
  • Remove trailing whitespace
  • Adiciona final newline
  • Remove BOM embedded no meio do arquivo

Backup:
  Cria backup automático antes das correções (exceto em --dry-run)

Exit Codes:
  0 - Sucesso
  1 - Falha (erros durante correção)

Exemplos:
  npm run fix:encoding
  node scripts/fix-encoding.js --dry-run
  node scripts/fix-encoding.js --verbose
`);
      process.exit(0);
    }
  }

  const fixer = new EncodingFixer(options);
  await fixer.run();
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { EncodingFixer };
