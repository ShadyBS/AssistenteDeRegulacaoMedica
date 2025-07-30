#!/usr/bin/env node

/**
 * Script de Validação de Encoding - Assistente de Regulação Médica
 *
 * Valida encoding de todos os arquivos do projeto para prevenir problemas
 * de codificação de caracteres em builds e dados médicos.
 */

const fs = require('fs-extra');
const path = require('path');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Arquivos e diretórios a serem validados
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
 * Classe para validação de encoding
 */
class EncodingValidator {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
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
   * Verifica se um arquivo deve ser incluído na validação
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
   * Coleta todos os arquivos do projeto para validação
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
   * Valida encoding de um arquivo específico
   */
  async validateFileEncoding(filePath) {
    try {
      const bytes = await fs.readFile(filePath);
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      const issues = [];

      // Verifica BOM UTF-8
      if (bytes.length >= 3 &&
          bytes[0] === 0xEF &&
          bytes[1] === 0xBB &&
          bytes[2] === 0xBF) {
        issues.push({
          type: 'BOM_DETECTED',
          severity: 'error',
          message: 'Arquivo contém BOM UTF-8 desnecessário',
          fix: 'Remover BOM do início do arquivo'
        });
      }

      // Verifica se é UTF-8 válido
      let content;
      try {
        content = bytes.toString('utf8');
        // Tenta re-codificar para verificar validade
        Buffer.from(content, 'utf8');
      } catch (error) {
        issues.push({
          type: 'INVALID_ENCODING',
          severity: 'error',
          message: 'Encoding inválido ou corrompido',
          fix: 'Converter arquivo para UTF-8',
          error: error.message
        });
        return { file: relativePath, issues };
      }

      // Verifica line endings
      const hasCRLF = content.includes('\r\n');
      const hasCR = content.includes('\r') && !content.includes('\r\n');

      if (hasCRLF) {
        issues.push({
          type: 'CRLF_LINE_ENDINGS',
          severity: 'warning',
          message: 'Arquivo usa line endings CRLF (Windows)',
          fix: 'Converter para LF (Unix)'
        });
      }

      if (hasCR) {
        issues.push({
          type: 'CR_LINE_ENDINGS',
          severity: 'warning',
          message: 'Arquivo usa line endings CR (Mac clássico)',
          fix: 'Converter para LF (Unix)'
        });
      }

      // Verifica trailing whitespace
      const lines = content.split('\n');
      const trailingWhitespaceLines = [];

      lines.forEach((line, index) => {
        if (line.match(/[ \t]+$/)) {
          trailingWhitespaceLines.push(index + 1);
        }
      });

      if (trailingWhitespaceLines.length > 0) {
        issues.push({
          type: 'TRAILING_WHITESPACE',
          severity: 'warning',
          message: `Trailing whitespace em ${trailingWhitespaceLines.length} linha(s)`,
          fix: 'Remover espaços no final das linhas',
          lines: trailingWhitespaceLines.slice(0, 5) // Mostra apenas as primeiras 5
        });
      }

      // Verifica final newline
      if (content.length > 0 && !content.endsWith('\n')) {
        issues.push({
          type: 'NO_FINAL_NEWLINE',
          severity: 'warning',
          message: 'Arquivo não termina com newline',
          fix: 'Adicionar newline no final do arquivo'
        });
      }

      // Verifica caracteres de replacement
      if (content.includes('�')) {
        issues.push({
          type: 'REPLACEMENT_CHARACTERS',
          severity: 'error',
          message: 'Arquivo contém caracteres de replacement (�)',
          fix: 'Corrigir encoding ou dados corrompidos'
        });
      }

      // Verifica possível double encoding
      if (/[À-ÿ]{3,}/.test(content) && !/\s/.test(content.match(/[À-ÿ]{3,}/)?.[0] || '')) {
        issues.push({
          type: 'POSSIBLE_DOUBLE_ENCODING',
          severity: 'warning',
          message: 'Possível double encoding detectado',
          fix: 'Verificar se dados foram codificados múltiplas vezes'
        });
      }

      // Verifica BOM no meio do texto
      if (content.includes('\uFEFF')) {
        issues.push({
          type: 'EMBEDDED_BOM',
          severity: 'error',
          message: 'BOM encontrado no meio do arquivo',
          fix: 'Remover caracteres BOM embedded'
        });
      }

      return { file: relativePath, issues };

    } catch (error) {
      return {
        file: path.relative(PROJECT_ROOT, filePath),
        issues: [{
          type: 'READ_ERROR',
          severity: 'error',
          message: `Erro ao ler arquivo: ${error.message}`,
          fix: 'Verificar permissões e integridade do arquivo'
        }]
      };
    }
  }

  /**
   * Valida encoding de todos os arquivos do projeto
   */
  async validateProject() {
    this.log('🔍 Iniciando validação de encoding...');

    const files = await this.getProjectFiles();
    this.log(`📁 Encontrados ${files.length} arquivos para validação`);

    const results = [];

    for (const file of files) {
      const result = await this.validateFileEncoding(file);
      results.push(result);

      if (result.issues.length > 0) {
        this.issues.push(...result.issues.map(issue => ({
          ...issue,
          file: result.file
        })));
      }

      this.checkedFiles++;
    }

    return results;
  }

  /**
   * Gera relatório de validação
   */
  generateReport(results) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    // Agrupa issues por tipo
    const issuesByType = {};
    const issuesBySeverity = { error: 0, warning: 0 };

    this.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
      issuesBySeverity[issue.severity]++;
    });

    // Arquivos com problemas
    const filesWithIssues = results.filter(r => r.issues.length > 0);

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        totalFiles: this.checkedFiles,
        filesWithIssues: filesWithIssues.length,
        totalIssues: this.issues.length,
        errors: issuesBySeverity.error,
        warnings: issuesBySeverity.warning
      },
      issuesByType: Object.keys(issuesByType).map(type => ({
        type,
        count: issuesByType[type].length,
        severity: issuesByType[type][0]?.severity || 'unknown',
        files: issuesByType[type].map(i => i.file)
      })),
      filesWithIssues: filesWithIssues.map(result => ({
        file: result.file,
        issueCount: result.issues.length,
        issues: result.issues
      }))
    };

    return report;
  }

  /**
   * Exibe relatório no console
   */
  displayReport(report) {
    const { summary, issuesByType, filesWithIssues } = report;

    this.log(`\n📊 Relatório de Validação de Encoding`);
    this.log(`   ⏱️  Duração: ${report.duration}`);
    this.log(`   📁 Arquivos verificados: ${summary.totalFiles}`);
    this.log(`   ⚠️  Arquivos com problemas: ${summary.filesWithIssues}`);
    this.log(`   🔴 Erros: ${summary.errors}`);
    this.log(`   🟡 Avisos: ${summary.warnings}`);

    if (summary.totalIssues === 0) {
      this.log(`\n✅ Nenhum problema de encoding encontrado!`, 'success');
      return;
    }

    // Mostra resumo por tipo
    if (issuesByType.length > 0) {
      this.log(`\n📋 Problemas por Tipo:`);
      issuesByType.forEach(typeInfo => {
        const icon = typeInfo.severity === 'error' ? '🔴' : '🟡';
        this.log(`   ${icon} ${typeInfo.type}: ${typeInfo.count} arquivo(s)`);
      });
    }

    // Mostra detalhes dos arquivos com problemas
    if (filesWithIssues.length > 0) {
      this.log(`\n📄 Arquivos com Problemas:`);

      filesWithIssues.slice(0, 10).forEach(fileInfo => {
        this.log(`\n   📁 ${fileInfo.file} (${fileInfo.issueCount} problema(s)):`);

        fileInfo.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '   🔴' : '   🟡';
          this.log(`${icon} ${issue.type}: ${issue.message}`);
          this.log(`      💡 Solução: ${issue.fix}`);

          if (issue.lines) {
            this.log(`      📍 Linhas: ${issue.lines.join(', ')}${issue.lines.length === 5 ? '...' : ''}`);
          }
        });
      });

      if (filesWithIssues.length > 10) {
        this.log(`\n   ... e mais ${filesWithIssues.length - 10} arquivo(s) com problemas`);
      }
    }

    // Instruções de correção
    this.log(`\n🔧 Para corrigir automaticamente:`);
    this.log(`   npm run fix:encoding`);

    // Status final
    if (summary.errors > 0) {
      this.log(`\n❌ Validação falhou: ${summary.errors} erro(s) crítico(s)`, 'error');
    } else if (summary.warnings > 0) {
      this.log(`\n⚠️  Validação passou com avisos: ${summary.warnings} aviso(s)`, 'warn');
    }
  }

  /**
   * Salva relatório em arquivo
   */
  async saveReport(report) {
    const reportPath = path.join(PROJECT_ROOT, 'encoding-validation-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    this.log(`📋 Relatório salvo em: ${reportPath}`);
  }

  /**
   * Executa validação completa
   */
  async run() {
    try {
      const results = await this.validateProject();
      const report = this.generateReport(results);

      this.displayReport(report);
      await this.saveReport(report);

      // Exit code baseado nos resultados
      if (report.summary.errors > 0) {
        process.exit(1);
      } else if (report.summary.warnings > 0) {
        process.exit(0); // Avisos não falham o build
      } else {
        process.exit(0);
      }

    } catch (error) {
      this.log(`Validação falhou: ${error.message}`, 'error');

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

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node scripts/validate-encoding.js [opções]

Opções:
  --help, -h          Mostra esta ajuda

Descrição:
  Valida encoding de todos os arquivos do projeto para prevenir
  problemas de codificação de caracteres.

Verifica:
  • BOM UTF-8 desnecessário
  • Encoding inválido ou corrompido
  • Line endings inconsistentes (CRLF/CR)
  • Trailing whitespace
  • Ausência de final newline
  • Caracteres de replacement (�)
  • Possível double encoding
  • BOM embedded no meio do arquivo

Exit Codes:
  0 - Sucesso (sem erros)
  1 - Falha (erros críticos encontrados)

Exemplos:
  npm run validate:encoding
  node scripts/validate-encoding.js
`);
    process.exit(0);
  }

  const validator = new EncodingValidator();
  await validator.run();
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { EncodingValidator };


