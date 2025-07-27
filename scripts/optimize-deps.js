#!/usr/bin/env node

/**
 * Dependency Optimizer - Assistente de Regulação Médica
 * 
 * Script para identificar e remover dependências não utilizadas,
 * otimizar imports e reduzir bundle size
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

/**
 * Classe para otimização de dependências
 */
class DependencyOptimizer {
  constructor() {
    this.packageJson = null;
    this.usedDependencies = new Set();
    this.unusedDependencies = new Set();
    this.results = {
      analyzed: 0,
      unused: 0,
      savings: 0
    };
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
   * Carrega package.json
   */
  async loadPackageJson() {
    try {
      this.packageJson = await fs.readJson(PACKAGE_JSON_PATH);
      this.log('📦 Package.json carregado');
    } catch (error) {
      throw new Error(`Erro ao carregar package.json: ${error.message}`);
    }
  }

  /**
   * Escaneia arquivos JavaScript para encontrar imports
   */
  async scanJavaScriptFiles() {
    this.log('🔍 Escaneando arquivos JavaScript...');
    
    const jsFiles = await this.findJavaScriptFiles(PROJECT_ROOT);
    
    for (const filePath of jsFiles) {
      await this.analyzeFile(filePath);
    }
    
    this.log(`📄 ${jsFiles.length} arquivos JavaScript analisados`);
  }

  /**
   * Encontra todos os arquivos JavaScript no projeto
   */
  async findJavaScriptFiles(dir) {
    const files = [];
    const excludeDirs = ['node_modules', '.git', '.dist', 'dist-zips', 'coverage', '__tests__'];
    
    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            await scan(fullPath);
          }
        } else if (item.endsWith('.js') && !item.includes('.min.')) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dir);
    return files;
  }

  /**
   * Analisa um arquivo para encontrar dependências
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Padrões de import/require
      const patterns = [
        /require\(['"`]([^'"`]+)['"`]\)/g,
        /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
        /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        /import\s+['"`]([^'"`]+)['"`]/g
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const dependency = match[1];
          
          // Ignora imports relativos e internos
          if (!dependency.startsWith('.') && !dependency.startsWith('/')) {
            // Extrai nome do pacote (remove subpaths)
            const packageName = dependency.split('/')[0];
            if (packageName.startsWith('@')) {
              // Scoped packages
              const scopedName = dependency.split('/').slice(0, 2).join('/');
              this.usedDependencies.add(scopedName);
            } else {
              this.usedDependencies.add(packageName);
            }
          }
        }
      }
    } catch (error) {
      this.log(`Erro ao analisar ${filePath}: ${error.message}`, 'warn');
    }
  }

  /**
   * Identifica dependências não utilizadas
   */
  identifyUnusedDependencies() {
    this.log('🔍 Identificando dependências não utilizadas...');
    
    const allDependencies = new Set([
      ...Object.keys(this.packageJson.dependencies || {}),
      ...Object.keys(this.packageJson.devDependencies || {})
    ]);
    
    // Dependências essenciais que podem não aparecer em imports diretos
    const essentialDeps = new Set([
      'webpack',
      'webpack-cli',
      'tailwindcss',
      'postcss',
      'autoprefixer',
      'eslint',
      'jest',
      'babel-loader',
      '@babel/core',
      '@babel/preset-env'
    ]);
    
    for (const dep of allDependencies) {
      if (!this.usedDependencies.has(dep) && !essentialDeps.has(dep)) {
        this.unusedDependencies.add(dep);
      }
    }
    
    this.results.analyzed = allDependencies.size;
    this.results.unused = this.unusedDependencies.size;
    
    this.log(`📊 ${this.results.analyzed} dependências analisadas`);
    this.log(`🗑️  ${this.results.unused} dependências não utilizadas encontradas`);
  }

  /**
   * Calcula economia potencial
   */
  async calculateSavings() {
    if (this.unusedDependencies.size === 0) {
      return;
    }
    
    this.log('💰 Calculando economia potencial...');
    
    try {
      // Simula remoção para calcular economia
      const tempPackageJson = { ...this.packageJson };
      
      for (const dep of this.unusedDependencies) {
        delete tempPackageJson.dependencies?.[dep];
        delete tempPackageJson.devDependencies?.[dep];
      }
      
      // Estima economia baseada no número de dependências
      // (cálculo aproximado - na prática seria necessário npm install para medição exata)
      this.results.savings = this.unusedDependencies.size * 2; // ~2MB por dependência média
      
      this.log(`💾 Economia estimada: ~${this.results.savings}MB`);
    } catch (error) {
      this.log(`Erro ao calcular economia: ${error.message}`, 'warn');
    }
  }

  /**
   * Gera relatório de otimização
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results,
      usedDependencies: Array.from(this.usedDependencies).sort(),
      unusedDependencies: Array.from(this.unusedDependencies).sort(),
      recommendations: []
    };
    
    // Gera recomendações
    if (this.unusedDependencies.size > 0) {
      report.recommendations.push({
        type: 'remove-unused',
        priority: 'medium',
        title: 'Remover dependências não utilizadas',
        description: `${this.unusedDependencies.size} dependências podem ser removidas`,
        action: `npm uninstall ${Array.from(this.unusedDependencies).join(' ')}`,
        dependencies: Array.from(this.unusedDependencies)
      });
    }
    
    // Verifica dependências que poderiam ser devDependencies
    const prodDeps = Object.keys(this.packageJson.dependencies || {});
    const buildOnlyDeps = prodDeps.filter(dep => 
      dep.includes('webpack') || 
      dep.includes('babel') || 
      dep.includes('eslint') ||
      dep.includes('tailwind') ||
      dep.includes('postcss')
    );
    
    if (buildOnlyDeps.length > 0) {
      report.recommendations.push({
        type: 'move-to-dev',
        priority: 'low',
        title: 'Mover dependências para devDependencies',
        description: `${buildOnlyDeps.length} dependências de build estão em dependencies`,
        dependencies: buildOnlyDeps
      });
    }
    
    return report;
  }

  /**
   * Remove dependências não utilizadas
   */
  async removeUnusedDependencies(dryRun = true) {
    if (this.unusedDependencies.size === 0) {
      this.log('✅ Nenhuma dependência não utilizada encontrada');
      return;
    }
    
    const depsToRemove = Array.from(this.unusedDependencies);
    
    if (dryRun) {
      this.log('🔍 DRY RUN - Dependências que seriam removidas:');
      depsToRemove.forEach(dep => {
        this.log(`  - ${dep}`);
      });
      this.log('\n💡 Execute com --remove para remover efetivamente');
      return;
    }
    
    this.log('🗑️  Removendo dependências não utilizadas...');
    
    try {
      const command = `npm uninstall ${depsToRemove.join(' ')}`;
      this.log(`Executando: ${command}`);
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: PROJECT_ROOT 
      });
      
      this.log('✅ Dependências removidas com sucesso', 'success');
    } catch (error) {
      this.log(`Erro ao remover dependências: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Otimiza package.json
   */
  async optimizePackageJson() {
    this.log('📦 Otimizando package.json...');
    
    const optimized = { ...this.packageJson };
    
    // Ordena dependências alfabeticamente
    if (optimized.dependencies) {
      const sorted = {};
      Object.keys(optimized.dependencies).sort().forEach(key => {
        sorted[key] = optimized.dependencies[key];
      });
      optimized.dependencies = sorted;
    }
    
    if (optimized.devDependencies) {
      const sorted = {};
      Object.keys(optimized.devDependencies).sort().forEach(key => {
        sorted[key] = optimized.devDependencies[key];
      });
      optimized.devDependencies = sorted;
    }
    
    // Remove campos desnecessários
    delete optimized.readme;
    delete optimized._id;
    delete optimized._from;
    delete optimized._resolved;
    delete optimized._integrity;
    
    await fs.writeJson(PACKAGE_JSON_PATH, optimized, { spaces: 2 });
    this.log('✅ Package.json otimizado');
  }

  /**
   * Executa análise completa
   */
  async analyze() {
    this.log('🚀 Iniciando análise de dependências...');
    
    await this.loadPackageJson();
    await this.scanJavaScriptFiles();
    this.identifyUnusedDependencies();
    await this.calculateSavings();
    
    const report = this.generateReport();
    
    // Salva relatório
    const reportPath = path.join(PROJECT_ROOT, 'dependency-analysis.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    this.log(`📋 Relatório salvo: ${reportPath}`, 'success');
    
    return report;
  }

  /**
   * Exibe resumo no console
   */
  displaySummary(report) {
    console.log('\n📊 RESUMO DA ANÁLISE DE DEPENDÊNCIAS\n');
    
    console.log(`📦 Total de dependências: ${report.summary.analyzed}`);
    console.log(`✅ Dependências utilizadas: ${report.usedDependencies.length}`);
    console.log(`🗑️  Dependências não utilizadas: ${report.summary.unused}`);
    
    if (report.summary.savings > 0) {
      console.log(`💾 Economia estimada: ~${report.summary.savings}MB`);
    }
    
    if (report.unusedDependencies.length > 0) {
      console.log('\n🗑️  DEPENDÊNCIAS NÃO UTILIZADAS:');
      report.unusedDependencies.forEach(dep => {
        console.log(`  - ${dep}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}`);
        console.log(`   ${rec.description}`);
        if (rec.action) {
          console.log(`   Comando: ${rec.action}`);
        }
      });
    }
    
    console.log('\n✅ Análise concluída!\n');
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node scripts/optimize-deps.js [opções]

Opções:
  --remove            Remove dependências não utilizadas (padrão: dry run)
  --optimize          Otimiza package.json (ordenação, limpeza)
  --quiet, -q         Execução silenciosa
  --help, -h          Mostra esta ajuda

Exemplos:
  node scripts/optimize-deps.js                    # Análise (dry run)
  node scripts/optimize-deps.js --remove           # Remove dependências
  node scripts/optimize-deps.js --optimize         # Otimiza package.json
`);
    process.exit(0);
  }
  
  try {
    const optimizer = new DependencyOptimizer();
    const report = await optimizer.analyze();
    
    if (!args.includes('--quiet') && !args.includes('-q')) {
      optimizer.displaySummary(report);
    }
    
    // Remove dependências se solicitado
    if (args.includes('--remove')) {
      await optimizer.removeUnusedDependencies(false);
    } else if (report.unusedDependencies.length > 0) {
      await optimizer.removeUnusedDependencies(true);
    }
    
    // Otimiza package.json se solicitado
    if (args.includes('--optimize')) {
      await optimizer.optimizePackageJson();
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { DependencyOptimizer };