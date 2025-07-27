#!/usr/bin/env node

/**
 * Bundle Size Analyzer - Assistente de Regulação Médica
 * 
 * Script para análise detalhada do tamanho do bundle e identificação
 * de oportunidades de otimização
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, '.dist');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'bundle-reports');

/**
 * Classe para análise de bundle size
 */
class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      targets: {},
      summary: {},
      recommendations: []
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
   * Analisa tamanho de arquivos em um diretório
   */
  async analyzeDirectory(dirPath, targetName) {
    if (!await fs.pathExists(dirPath)) {
      this.log(`Diretório não encontrado: ${dirPath}`, 'warn');
      return null;
    }

    const analysis = {
      target: targetName,
      totalSize: 0,
      files: [],
      categories: {
        javascript: { size: 0, files: [] },
        css: { size: 0, files: [] },
        html: { size: 0, files: [] },
        images: { size: 0, files: [] },
        other: { size: 0, files: [] }
      }
    };

    await this.scanDirectory(dirPath, dirPath, analysis);
    
    // Calcula percentuais
    for (const category of Object.keys(analysis.categories)) {
      const cat = analysis.categories[category];
      cat.percentage = analysis.totalSize > 0 ? 
        ((cat.size / analysis.totalSize) * 100).toFixed(2) : 0;
    }

    return analysis;
  }

  /**
   * Escaneia diretório recursivamente
   */
  async scanDirectory(currentPath, basePath, analysis) {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = await fs.stat(fullPath);
      const relativePath = path.relative(basePath, fullPath);

      if (stats.isDirectory()) {
        await this.scanDirectory(fullPath, basePath, analysis);
      } else {
        const fileInfo = {
          path: relativePath,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          extension: path.extname(item).toLowerCase()
        };

        analysis.files.push(fileInfo);
        analysis.totalSize += stats.size;

        // Categoriza arquivo
        const category = this.categorizeFile(fileInfo.extension);
        analysis.categories[category].size += stats.size;
        analysis.categories[category].files.push(fileInfo);
      }
    }
  }

  /**
   * Categoriza arquivo por extensão
   */
  categorizeFile(extension) {
    const categories = {
      javascript: ['.js', '.mjs'],
      css: ['.css'],
      html: ['.html', '.htm'],
      images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp']
    };

    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Gera recomendações baseadas na análise
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Verifica arquivos JavaScript grandes
    const largeJSFiles = analysis.categories.javascript.files
      .filter(file => file.size > 100 * 1024) // > 100KB
      .sort((a, b) => b.size - a.size);

    if (largeJSFiles.length > 0) {
      recommendations.push({
        type: 'javascript',
        priority: 'high',
        title: 'Arquivos JavaScript grandes detectados',
        description: `${largeJSFiles.length} arquivo(s) JavaScript > 100KB encontrados`,
        files: largeJSFiles.slice(0, 5), // Top 5
        suggestions: [
          'Implementar code splitting',
          'Remover dependências não utilizadas',
          'Aplicar tree shaking mais agressivo',
          'Considerar lazy loading'
        ]
      });
    }

    // Verifica total de CSS
    if (analysis.categories.css.size > 50 * 1024) { // > 50KB
      recommendations.push({
        type: 'css',
        priority: 'medium',
        title: 'Bundle CSS grande',
        description: `CSS total: ${(analysis.categories.css.size / 1024).toFixed(2)} KB`,
        suggestions: [
          'Remover CSS não utilizado',
          'Aplicar PurgeCSS',
          'Otimizar Tailwind CSS',
          'Comprimir imagens em CSS'
        ]
      });
    }

    // Verifica imagens
    const largeImages = analysis.categories.images.files
      .filter(file => file.size > 50 * 1024) // > 50KB
      .sort((a, b) => b.size - a.size);

    if (largeImages.length > 0) {
      recommendations.push({
        type: 'images',
        priority: 'medium',
        title: 'Imagens grandes detectadas',
        description: `${largeImages.length} imagem(ns) > 50KB encontradas`,
        files: largeImages.slice(0, 3),
        suggestions: [
          'Otimizar imagens com ferramentas como imagemin',
          'Converter para formatos modernos (WebP)',
          'Implementar lazy loading para imagens',
          'Considerar usar SVG para ícones'
        ]
      });
    }

    // Verifica bundle total
    const totalMB = analysis.totalSize / (1024 * 1024);
    if (totalMB > 5) { // > 5MB
      recommendations.push({
        type: 'bundle',
        priority: 'high',
        title: 'Bundle total muito grande',
        description: `Tamanho total: ${totalMB.toFixed(2)} MB`,
        suggestions: [
          'Implementar code splitting agressivo',
          'Remover dependências desnecessárias',
          'Aplicar lazy loading em módulos',
          'Considerar usar CDN para bibliotecas'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Compara com build anterior
   */
  async compareWithPrevious(currentAnalysis) {
    const previousReportPath = path.join(REPORTS_DIR, 'latest-analysis.json');
    
    if (!await fs.pathExists(previousReportPath)) {
      return null;
    }

    try {
      const previousReport = await fs.readJson(previousReportPath);
      const previousAnalysis = previousReport.targets[currentAnalysis.target];
      
      if (!previousAnalysis) {
        return null;
      }

      const comparison = {
        totalSize: {
          current: currentAnalysis.totalSize,
          previous: previousAnalysis.totalSize,
          diff: currentAnalysis.totalSize - previousAnalysis.totalSize,
          percentage: ((currentAnalysis.totalSize - previousAnalysis.totalSize) / previousAnalysis.totalSize * 100).toFixed(2)
        },
        categories: {}
      };

      // Compara categorias
      for (const category of Object.keys(currentAnalysis.categories)) {
        const current = currentAnalysis.categories[category].size;
        const previous = previousAnalysis.categories[category]?.size || 0;
        
        comparison.categories[category] = {
          current,
          previous,
          diff: current - previous,
          percentage: previous > 0 ? ((current - previous) / previous * 100).toFixed(2) : 'N/A'
        };
      }

      return comparison;
    } catch (error) {
      this.log(`Erro ao comparar com build anterior: ${error.message}`, 'warn');
      return null;
    }
  }

  /**
   * Gera relatório detalhado
   */
  async generateReport() {
    this.log('📊 Iniciando análise de bundle size...');

    await fs.ensureDir(REPORTS_DIR);

    // Analisa cada target
    const targets = ['chrome', 'firefox'];
    
    for (const target of targets) {
      const targetPath = path.join(DIST_DIR, target);
      const analysis = await this.analyzeDirectory(targetPath, target);
      
      if (analysis) {
        this.results.targets[target] = analysis;
        
        // Gera recomendações
        const recommendations = this.generateRecommendations(analysis);
        this.results.recommendations.push(...recommendations);
        
        // Compara com build anterior
        const comparison = await this.compareWithPrevious(analysis);
        if (comparison) {
          analysis.comparison = comparison;
        }
        
        this.log(`✅ Análise concluída para ${target}: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
      }
    }

    // Gera resumo
    this.generateSummary();

    // Salva relatório
    const reportPath = path.join(REPORTS_DIR, `analysis-${Date.now()}.json`);
    const latestPath = path.join(REPORTS_DIR, 'latest-analysis.json');
    
    await fs.writeJson(reportPath, this.results, { spaces: 2 });
    await fs.writeJson(latestPath, this.results, { spaces: 2 });

    // Gera relatório HTML
    await this.generateHTMLReport();

    this.log(`📋 Relatório salvo: ${reportPath}`, 'success');
    
    return this.results;
  }

  /**
   * Gera resumo da análise
   */
  generateSummary() {
    const targets = Object.values(this.results.targets);
    
    if (targets.length === 0) {
      return;
    }

    this.results.summary = {
      totalTargets: targets.length,
      averageSize: targets.reduce((sum, t) => sum + t.totalSize, 0) / targets.length,
      largestTarget: targets.reduce((max, t) => t.totalSize > max.totalSize ? t : max),
      smallestTarget: targets.reduce((min, t) => t.totalSize < min.totalSize ? t : min),
      totalRecommendations: this.results.recommendations.length,
      highPriorityRecommendations: this.results.recommendations.filter(r => r.priority === 'high').length
    };
  }

  /**
   * Gera relatório HTML
   */
  async generateHTMLReport() {
    const htmlContent = this.generateHTMLContent();
    const htmlPath = path.join(REPORTS_DIR, 'bundle-analysis.html');
    
    await fs.writeFile(htmlPath, htmlContent);
    this.log(`📄 Relatório HTML gerado: ${htmlPath}`);
  }

  /**
   * Gera conteúdo HTML do relatório
   */
  generateHTMLContent() {
    const { targets, summary, recommendations } = this.results;
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis - Assistente de Regulação Médica</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .target { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 6px; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .category { background: #f8f9fa; padding: 15px; border-radius: 4px; }
        .recommendation { margin: 15px 0; padding: 15px; border-radius: 4px; }
        .high { background: #fff5f5; border-left: 4px solid #e53e3e; }
        .medium { background: #fffaf0; border-left: 4px solid #dd6b20; }
        .low { background: #f0fff4; border-left: 4px solid #38a169; }
        .file-list { max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .file-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .size { font-weight: bold; color: #666; }
        .comparison { display: flex; align-items: center; gap: 10px; }
        .positive { color: #e53e3e; }
        .negative { color: #38a169; }
        .neutral { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Bundle Size Analysis</h1>
        <p><strong>Timestamp:</strong> ${new Date(this.results.timestamp).toLocaleString('pt-BR')}</p>
        
        ${summary ? `
        <h2>📋 Resumo</h2>
        <div class="summary">
            <div class="card">
                <h3>Targets Analisados</h3>
                <div class="size">${summary.totalTargets}</div>
            </div>
            <div class="card">
                <h3>Tamanho Médio</h3>
                <div class="size">${(summary.averageSize / 1024).toFixed(2)} KB</div>
            </div>
            <div class="card">
                <h3>Maior Bundle</h3>
                <div class="size">${summary.largestTarget.target}: ${(summary.largestTarget.totalSize / 1024).toFixed(2)} KB</div>
            </div>
            <div class="card">
                <h3>Recomendações</h3>
                <div class="size">${summary.totalRecommendations} (${summary.highPriorityRecommendations} alta prioridade)</div>
            </div>
        </div>
        ` : ''}
        
        ${Object.entries(targets).map(([targetName, target]) => `
        <div class="target">
            <h2>🎯 ${targetName.toUpperCase()}</h2>
            <p><strong>Tamanho Total:</strong> <span class="size">${(target.totalSize / 1024).toFixed(2)} KB</span></p>
            
            ${target.comparison ? `
            <div class="comparison">
                <strong>Comparação com build anterior:</strong>
                <span class="${target.comparison.totalSize.diff > 0 ? 'positive' : target.comparison.totalSize.diff < 0 ? 'negative' : 'neutral'}">
                    ${target.comparison.totalSize.diff > 0 ? '+' : ''}${(target.comparison.totalSize.diff / 1024).toFixed(2)} KB 
                    (${target.comparison.totalSize.percentage}%)
                </span>
            </div>
            ` : ''}
            
            <h3>📁 Categorias</h3>
            <div class="categories">
                ${Object.entries(target.categories).map(([catName, category]) => `
                <div class="category">
                    <h4>${catName.toUpperCase()}</h4>
                    <div class="size">${(category.size / 1024).toFixed(2)} KB (${category.percentage}%)</div>
                    <div>${category.files.length} arquivo(s)</div>
                </div>
                `).join('')}
            </div>
            
            <h3>📄 Maiores Arquivos</h3>
            <div class="file-list">
                ${target.files
                  .sort((a, b) => b.size - a.size)
                  .slice(0, 10)
                  .map(file => `
                    <div class="file-item">
                        <span>${file.path}</span>
                        <span class="size">${file.sizeKB} KB</span>
                    </div>
                  `).join('')}
            </div>
        </div>
        `).join('')}
        
        ${recommendations.length > 0 ? `
        <h2>💡 Recomendações</h2>
        ${recommendations.map(rec => `
        <div class="recommendation ${rec.priority}">
            <h3>${rec.title}</h3>
            <p>${rec.description}</p>
            <ul>
                ${rec.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
            ${rec.files ? `
            <details>
                <summary>Arquivos afetados (${rec.files.length})</summary>
                <div class="file-list">
                    ${rec.files.map(file => `
                    <div class="file-item">
                        <span>${file.path}</span>
                        <span class="size">${file.sizeKB} KB</span>
                    </div>
                    `).join('')}
                </div>
            </details>
            ` : ''}
        </div>
        `).join('')}
        ` : ''}
    </div>
</body>
</html>
    `;
  }

  /**
   * Exibe resumo no console
   */
  displaySummary() {
    const { targets, summary, recommendations } = this.results;
    
    console.log('\n📊 RESUMO DA ANÁLISE DE BUNDLE SIZE\n');
    
    // Targets
    Object.entries(targets).forEach(([name, target]) => {
      console.log(`🎯 ${name.toUpperCase()}: ${(target.totalSize / 1024).toFixed(2)} KB`);
      
      if (target.comparison) {
        const diff = target.comparison.totalSize.diff;
        const symbol = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        const sign = diff > 0 ? '+' : '';
        console.log(`   ${symbol} ${sign}${(diff / 1024).toFixed(2)} KB (${target.comparison.totalSize.percentage}%)`);
      }
    });
    
    // Recomendações
    if (recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${index + 1}. ${priority} ${rec.title}`);
        console.log(`   ${rec.description}`);
      });
    }
    
    console.log('\n✅ Análise concluída! Verifique o relatório HTML para detalhes completos.\n');
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node scripts/bundle-analyzer.js [opções]

Opções:
  --help, -h          Mostra esta ajuda
  --quiet, -q         Execução silenciosa (apenas erros)
  --open              Abre relatório HTML automaticamente

Exemplos:
  node scripts/bundle-analyzer.js                # Análise completa
  node scripts/bundle-analyzer.js --quiet        # Análise silenciosa
  node scripts/bundle-analyzer.js --open         # Análise + abre relatório
`);
    process.exit(0);
  }
  
  try {
    const analyzer = new BundleAnalyzer();
    const results = await analyzer.generateReport();
    
    if (!args.includes('--quiet') && !args.includes('-q')) {
      analyzer.displaySummary();
    }
    
    // Abre relatório HTML se solicitado
    if (args.includes('--open')) {
      const htmlPath = path.join(REPORTS_DIR, 'bundle-analysis.html');
      const { execSync } = require('child_process');
      
      try {
        // Windows
        execSync(`start ${htmlPath}`, { stdio: 'ignore' });
      } catch {
        try {
          // macOS
          execSync(`open ${htmlPath}`, { stdio: 'ignore' });
        } catch {
          try {
            // Linux
            execSync(`xdg-open ${htmlPath}`, { stdio: 'ignore' });
          } catch {
            console.log(`📄 Relatório HTML: ${htmlPath}`);
          }
        }
      }
    }
    
    // Exit code baseado em recomendações de alta prioridade
    const highPriorityCount = results.recommendations.filter(r => r.priority === 'high').length;
    process.exit(highPriorityCount > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { BundleAnalyzer };