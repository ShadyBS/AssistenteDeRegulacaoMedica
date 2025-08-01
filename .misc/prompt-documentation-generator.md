# Prompt para Geração Automática de Documentação de Extensões

## 📚 MISSÃO: GERAÇÃO AUTOMÁTICA DE DOCUMENTAÇÃO COMPLETA

Você é um **Senior Browser Extension Documentation Engineer** especializado em **geração automática** de documentação técnica e de usuário para extensões **Manifest V3**. Crie **documentação abrangente**, **sempre atualizada** e **facilmente navegável** que cubra todos os aspectos da extensão.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE GERAR A DOCUMENTAÇÃO:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise toda a codebase** - Entenda funcionalidades e arquitetura
3. **Examine o manifest.json** - Identifique permissions, APIs e recursos
4. **Mapeie user journeys** - Fluxos de uso da extensão
5. **Identifique audiências** - Desenvolvedores, usuários finais, administradores
6. **Determine formatos** - Markdown, HTML, PDF, interactive docs
7. **Configure automação** - Pipeline de atualização contínua

---

## 📋 TIPOS DE DOCUMENTAÇÃO PARA EXTENSÕES

### **👥 DOCUMENTAÇÃO POR AUDIÊNCIA**

#### **🔧 Documentação para Desenvolvedores**
- **API Reference** - Documentação completa de APIs
- **Architecture Guide** - Visão geral da arquitetura
- **Development Setup** - Como configurar ambiente
- **Contributing Guide** - Como contribuir para o projeto
- **Code Standards** - Padrões de código e best practices
- **Testing Guide** - Como executar e criar testes
- **Deployment Guide** - Como fazer deploy da extensão
- **Troubleshooting** - Resolução de problemas comuns

#### **👤 Documentação para Usuários Finais**
- **User Guide** - Como usar a extensão
- **Installation Guide** - Como instalar a extensão
- **Feature Overview** - Visão geral das funcionalidades
- **FAQ** - Perguntas frequentes
- **Privacy Policy** - Política de privacidade
- **Terms of Service** - Termos de uso
- **Support** - Como obter suporte
- **Release Notes** - Notas de versão

#### **🏢 Documentação para Administradores**
- **Enterprise Guide** - Deployment em ambiente corporativo
- **Group Policies** - Configuração de políticas
- **Security Guide** - Aspectos de segurança
- **Compliance** - Conformidade regulatória
- **Monitoring** - Como monitorar a extensão
- **Backup/Recovery** - Procedimentos de backup

### **📊 DOCUMENTAÇÃO POR TIPO**

#### **📖 Documentação Técnica**
- **Code Documentation** - JSDoc, comentários inline
- **API Documentation** - Endpoints, parâmetros, responses
- **Database Schema** - Estrutura de dados
- **Configuration** - Arquivos de configuração
- **Dependencies** - Bibliotecas e dependências
- **Build Process** - Processo de build e deploy

#### **🎨 Documentação Visual**
- **Architecture Diagrams** - Diagramas de arquitetura
- **Flow Charts** - Fluxos de processo
- **Screenshots** - Capturas de tela da interface
- **Video Tutorials** - Tutoriais em vídeo
- **Interactive Demos** - Demonstrações interativas
- **Wireframes** - Layouts e designs

---

## 🤖 SISTEMA DE GERAÇÃO AUTOMÁTICA

### **📝 Code Documentation Extractor**

```javascript
// Automatic Code Documentation Generator
class CodeDocumentationGenerator {
  constructor() {
    this.parsers = new Map();
    this.generators = new Map();
    this.templates = new Map();
    this.setupParsers();
    this.setupGenerators();
  }

  setupParsers() {
    // JavaScript/TypeScript parser
    this.parsers.set('javascript', {
      parse: (code) => this.parseJavaScript(code),
      extensions: ['.js', '.ts', '.jsx', '.tsx']
    });

    // JSON parser for manifest and configs
    this.parsers.set('json', {
      parse: (code) => this.parseJSON(code),
      extensions: ['.json']
    });

    // CSS parser
    this.parsers.set('css', {
      parse: (code) => this.parseCSS(code),
      extensions: ['.css', '.scss', '.sass']
    });

    // HTML parser
    this.parsers.set('html', {
      parse: (code) => this.parseHTML(code),
      extensions: ['.html', '.htm']
    });
  }

  parseJavaScript(code) {
    const documentation = {
      classes: [],
      functions: [],
      constants: [],
      exports: [],
      imports: [],
      comments: []
    };

    // Extract JSDoc comments
    const jsdocPattern = /\/\*\*([\s\S]*?)\*\//g;
    let match;
    
    while ((match = jsdocPattern.exec(code)) !== null) {
      const comment = this.parseJSDoc(match[1]);
      documentation.comments.push(comment);
    }

    // Extract classes
    const classPattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([\s\S]*?)}/g;
    while ((match = classPattern.exec(code)) !== null) {
      const [, className, parentClass, classBody] = match;
      
      const classDoc = {
        name: className,
        parent: parentClass,
        methods: this.extractMethods(classBody),
        properties: this.extractProperties(classBody),
        description: this.findPrecedingComment(code, match.index)
      };
      
      documentation.classes.push(classDoc);
    }

    // Extract functions
    const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))\s*\([^)]*\)\s*{/g;
    while ((match = functionPattern.exec(code)) !== null) {
      const functionName = match[1] || match[2];
      
      const functionDoc = {
        name: functionName,
        parameters: this.extractParameters(match[0]),
        returnType: this.extractReturnType(code, match.index),
        description: this.findPrecedingComment(code, match.index),
        isAsync: match[0].includes('async')
      };
      
      documentation.functions.push(functionDoc);
    }

    // Extract constants and exports
    const exportPattern = /export\s+(?:const|let|var|function|class|default)\s+(\w+)/g;
    while ((match = exportPattern.exec(code)) !== null) {
      documentation.exports.push({
        name: match[1],
        type: this.determineExportType(code, match.index)
      });
    }

    return documentation;
  }

  parseJSDoc(comment) {
    const lines = comment.split('\n').map(line => line.trim().replace(/^\*\s?/, ''));
    
    const doc = {
      description: '',
      params: [],
      returns: null,
      examples: [],
      since: null,
      deprecated: false,
      tags: []
    };

    let currentSection = 'description';
    let currentExample = '';

    for (const line of lines) {
      if (line.startsWith('@param')) {
        const paramMatch = line.match(/@param\s+{([^}]+)}\s+(\w+)\s*-?\s*(.*)/);
        if (paramMatch) {
          doc.params.push({
            type: paramMatch[1],
            name: paramMatch[2],
            description: paramMatch[3]
          });
        }
        currentSection = 'param';
      } else if (line.startsWith('@returns') || line.startsWith('@return')) {
        const returnMatch = line.match(/@returns?\s+{([^}]+)}\s*(.*)/);
        if (returnMatch) {
          doc.returns = {
            type: returnMatch[1],
            description: returnMatch[2]
          };
        }
        currentSection = 'returns';
      } else if (line.startsWith('@example')) {
        currentSection = 'example';
        currentExample = '';
      } else if (line.startsWith('@since')) {
        doc.since = line.replace('@since', '').trim();
      } else if (line.startsWith('@deprecated')) {
        doc.deprecated = true;
      } else if (line.startsWith('@')) {
        const tagMatch = line.match(/@(\w+)\s*(.*)/);
        if (tagMatch) {
          doc.tags.push({
            name: tagMatch[1],
            value: tagMatch[2]
          });
        }
      } else {
        if (currentSection === 'description') {
          doc.description += line + ' ';
        } else if (currentSection === 'example') {
          currentExample += line + '\n';
          if (line.trim() === '' && currentExample.trim()) {
            doc.examples.push(currentExample.trim());
            currentExample = '';
          }
        }
      }
    }

    if (currentExample.trim()) {
      doc.examples.push(currentExample.trim());
    }

    doc.description = doc.description.trim();
    return doc;
  }

  extractMethods(classBody) {
    const methods = [];
    const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = methodPattern.exec(classBody)) !== null) {
      const methodName = match[1];
      
      if (methodName !== 'constructor') {
        methods.push({
          name: methodName,
          parameters: this.extractParameters(match[0]),
          isAsync: match[0].includes('async'),
          isStatic: classBody.substring(0, match.index).includes('static'),
          visibility: this.determineVisibility(methodName)
        });
      }
    }

    return methods;
  }

  extractProperties(classBody) {
    const properties = [];
    const propertyPattern = /(?:this\.(\w+)\s*=|(\w+)\s*=)/g;
    let match;

    while ((match = propertyPattern.exec(classBody)) !== null) {
      const propertyName = match[1] || match[2];
      
      properties.push({
        name: propertyName,
        visibility: this.determineVisibility(propertyName),
        type: this.inferType(classBody, match.index)
      });
    }

    return [...new Set(properties.map(p => p.name))].map(name => 
      properties.find(p => p.name === name)
    );
  }

  generateAPIDocumentation(codebase) {
    const apiDocs = {
      overview: this.generateOverview(codebase),
      modules: [],
      classes: [],
      functions: [],
      constants: [],
      types: []
    };

    // Process each file
    for (const [filePath, content] of codebase.entries()) {
      const extension = this.getFileExtension(filePath);
      const parser = this.findParser(extension);
      
      if (parser) {
        const documentation = parser.parse(content);
        this.mergeDocumentation(apiDocs, documentation, filePath);
      }
    }

    return apiDocs;
  }

  generateOverview(codebase) {
    const manifest = this.findManifest(codebase);
    
    return {
      name: manifest?.name || 'Extension',
      version: manifest?.version || '1.0.0',
      description: manifest?.description || '',
      permissions: manifest?.permissions || [],
      hostPermissions: manifest?.host_permissions || [],
      architecture: this.analyzeArchitecture(codebase),
      entryPoints: this.findEntryPoints(codebase)
    };
  }

  analyzeArchitecture(codebase) {
    const architecture = {
      hasBackground: false,
      hasContentScripts: false,
      hasPopup: false,
      hasOptions: false,
      hasDevtools: false
    };

    for (const filePath of codebase.keys()) {
      if (filePath.includes('background')) architecture.hasBackground = true;
      if (filePath.includes('content')) architecture.hasContentScripts = true;
      if (filePath.includes('popup')) architecture.hasPopup = true;
      if (filePath.includes('options')) architecture.hasOptions = true;
      if (filePath.includes('devtools')) architecture.hasDevtools = true;
    }

    return architecture;
  }
}
```

### **📖 Documentation Templates**

```javascript
// Documentation Template System
class DocumentationTemplateSystem {
  constructor() {
    this.templates = new Map();
    this.setupTemplates();
  }

  setupTemplates() {
    // API Reference template
    this.templates.set('api-reference', {
      generate: (data) => this.generateAPIReference(data),
      format: 'markdown'
    });

    // User Guide template
    this.templates.set('user-guide', {
      generate: (data) => this.generateUserGuide(data),
      format: 'markdown'
    });

    // README template
    this.templates.set('readme', {
      generate: (data) => this.generateREADME(data),
      format: 'markdown'
    });

    // Architecture documentation
    this.templates.set('architecture', {
      generate: (data) => this.generateArchitectureDoc(data),
      format: 'markdown'
    });
  }

  generateAPIReference(apiData) {
    let markdown = `# API Reference\n\n`;
    
    // Overview
    markdown += `## Overview\n\n`;
    markdown += `**${apiData.overview.name}** v${apiData.overview.version}\n\n`;
    markdown += `${apiData.overview.description}\n\n`;

    // Architecture
    markdown += `## Architecture\n\n`;
    markdown += this.generateArchitectureSection(apiData.overview.architecture);

    // Classes
    if (apiData.classes.length > 0) {
      markdown += `## Classes\n\n`;
      
      for (const classDoc of apiData.classes) {
        markdown += `### ${classDoc.name}\n\n`;
        
        if (classDoc.description) {
          markdown += `${classDoc.description}\n\n`;
        }

        if (classDoc.parent) {
          markdown += `**Extends:** \`${classDoc.parent}\`\n\n`;
        }

        // Constructor
        markdown += `#### Constructor\n\n`;
        markdown += `\`\`\`javascript\n`;
        markdown += `new ${classDoc.name}(${this.formatParameters(classDoc.constructor?.parameters || [])})\n`;
        markdown += `\`\`\`\n\n`;

        // Methods
        if (classDoc.methods.length > 0) {
          markdown += `#### Methods\n\n`;
          
          for (const method of classDoc.methods) {
            markdown += `##### ${method.name}\n\n`;
            
            if (method.description) {
              markdown += `${method.description}\n\n`;
            }

            markdown += `\`\`\`javascript\n`;
            markdown += `${method.isAsync ? 'async ' : ''}${method.name}(${this.formatParameters(method.parameters)})\n`;
            markdown += `\`\`\`\n\n`;

            if (method.parameters.length > 0) {
              markdown += `**Parameters:**\n\n`;
              for (const param of method.parameters) {
                markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
              }
              markdown += `\n`;
            }

            if (method.returns) {
              markdown += `**Returns:** \`${method.returns.type}\` - ${method.returns.description}\n\n`;
            }
          }
        }

        // Properties
        if (classDoc.properties.length > 0) {
          markdown += `#### Properties\n\n`;
          
          for (const property of classDoc.properties) {
            markdown += `##### ${property.name}\n\n`;
            markdown += `**Type:** \`${property.type}\`\n\n`;
            if (property.description) {
              markdown += `${property.description}\n\n`;
            }
          }
        }
      }
    }

    // Functions
    if (apiData.functions.length > 0) {
      markdown += `## Functions\n\n`;
      
      for (const func of apiData.functions) {
        markdown += `### ${func.name}\n\n`;
        
        if (func.description) {
          markdown += `${func.description}\n\n`;
        }

        markdown += `\`\`\`javascript\n`;
        markdown += `${func.isAsync ? 'async ' : ''}${func.name}(${this.formatParameters(func.parameters)})\n`;
        markdown += `\`\`\`\n\n`;

        if (func.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          for (const param of func.parameters) {
            markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
          }
          markdown += `\n`;
        }

        if (func.returns) {
          markdown += `**Returns:** \`${func.returns.type}\` - ${func.returns.description}\n\n`;
        }

        if (func.examples.length > 0) {
          markdown += `**Example:**\n\n`;
          for (const example of func.examples) {
            markdown += `\`\`\`javascript\n${example}\n\`\`\`\n\n`;
          }
        }
      }
    }

    return markdown;
  }

  generateUserGuide(extensionData) {
    let markdown = `# ${extensionData.name} User Guide\n\n`;
    
    // Introduction
    markdown += `## Introduction\n\n`;
    markdown += `${extensionData.description}\n\n`;

    // Installation
    markdown += `## Installation\n\n`;
    markdown += `### From Chrome Web Store\n\n`;
    markdown += `1. Visit the [Chrome Web Store](${extensionData.storeUrl || '#'})\n`;
    markdown += `2. Click "Add to Chrome"\n`;
    markdown += `3. Confirm the installation\n\n`;

    markdown += `### Manual Installation\n\n`;
    markdown += `1. Download the extension package\n`;
    markdown += `2. Open Chrome and go to \`chrome://extensions/\`\n`;
    markdown += `3. Enable "Developer mode"\n`;
    markdown += `4. Click "Load unpacked" and select the extension folder\n\n`;

    // Features
    markdown += `## Features\n\n`;
    
    if (extensionData.features) {
      for (const feature of extensionData.features) {
        markdown += `### ${feature.name}\n\n`;
        markdown += `${feature.description}\n\n`;
        
        if (feature.howToUse) {
          markdown += `**How to use:**\n\n`;
          for (const step of feature.howToUse) {
            markdown += `${step.startsWith('1.') ? '' : '1. '}${step}\n`;
          }
          markdown += `\n`;
        }

        if (feature.screenshot) {
          markdown += `![${feature.name}](${feature.screenshot})\n\n`;
        }
      }
    }

    // Settings
    markdown += `## Settings\n\n`;
    markdown += `To access settings:\n\n`;
    markdown += `1. Right-click the extension icon\n`;
    markdown += `2. Select "Options" or "Settings"\n`;
    markdown += `3. Configure your preferences\n\n`;

    // Troubleshooting
    markdown += `## Troubleshooting\n\n`;
    markdown += `### Common Issues\n\n`;
    
    const commonIssues = [
      {
        issue: "Extension not working",
        solution: "Try refreshing the page or restarting the browser"
      },
      {
        issue: "Missing permissions",
        solution: "Check if the extension has the required permissions in browser settings"
      },
      {
        issue: "Conflicts with other extensions",
        solution: "Disable other extensions temporarily to identify conflicts"
      }
    ];

    for (const { issue, solution } of commonIssues) {
      markdown += `#### ${issue}\n\n`;
      markdown += `**Solution:** ${solution}\n\n`;
    }

    // Support
    markdown += `## Support\n\n`;
    markdown += `If you need help:\n\n`;
    markdown += `- Check the [FAQ](${extensionData.faqUrl || '#'})\n`;
    markdown += `- Report issues on [GitHub](${extensionData.githubUrl || '#'})\n`;
    markdown += `- Contact support: ${extensionData.supportEmail || 'support@example.com'}\n\n`;

    return markdown;
  }

  generateREADME(projectData) {
    let markdown = `# ${projectData.name}\n\n`;
    
    // Badges
    if (projectData.badges) {
      for (const badge of projectData.badges) {
        markdown += `![${badge.alt}](${badge.url}) `;
      }
      markdown += `\n\n`;
    }

    // Description
    markdown += `${projectData.description}\n\n`;

    // Features
    if (projectData.features) {
      markdown += `## Features\n\n`;
      for (const feature of projectData.features) {
        markdown += `- ${feature}\n`;
      }
      markdown += `\n`;
    }

    // Installation
    markdown += `## Installation\n\n`;
    markdown += `### For Users\n\n`;
    markdown += `Install from the [Chrome Web Store](${projectData.storeUrl || '#'})\n\n`;
    
    markdown += `### For Developers\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `git clone ${projectData.repositoryUrl || 'https://github.com/user/repo.git'}\n`;
    markdown += `cd ${projectData.name.toLowerCase()}\n`;
    markdown += `npm install\n`;
    markdown += `npm run build\n`;
    markdown += `\`\`\`\n\n`;

    // Usage
    markdown += `## Usage\n\n`;
    markdown += `${projectData.usage || 'See the user guide for detailed usage instructions.'}\n\n`;

    // Development
    markdown += `## Development\n\n`;
    markdown += `### Prerequisites\n\n`;
    markdown += `- Node.js 16+\n`;
    markdown += `- npm or yarn\n\n`;

    markdown += `### Setup\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `npm install\n`;
    markdown += `npm run dev\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `### Building\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `npm run build\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `### Testing\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `npm test\n`;
    markdown += `\`\`\`\n\n`;

    // Contributing
    markdown += `## Contributing\n\n`;
    markdown += `1. Fork the repository\n`;
    markdown += `2. Create a feature branch\n`;
    markdown += `3. Make your changes\n`;
    markdown += `4. Add tests\n`;
    markdown += `5. Submit a pull request\n\n`;

    // License
    markdown += `## License\n\n`;
    markdown += `${projectData.license || 'MIT'}\n\n`;

    return markdown;
  }

  formatParameters(parameters) {
    if (!parameters || parameters.length === 0) return '';
    
    return parameters.map(param => {
      let formatted = param.name;
      if (param.optional) formatted = `[${formatted}]`;
      if (param.type) formatted += `: ${param.type}`;
      return formatted;
    }).join(', ');
  }

  generateArchitectureSection(architecture) {
    let markdown = `The extension consists of the following components:\n\n`;
    
    if (architecture.hasBackground) {
      markdown += `- **Background Script**: Service worker that handles extension logic\n`;
    }
    
    if (architecture.hasContentScripts) {
      markdown += `- **Content Scripts**: Scripts injected into web pages\n`;
    }
    
    if (architecture.hasPopup) {
      markdown += `- **Popup**: Extension popup interface\n`;
    }
    
    if (architecture.hasOptions) {
      markdown += `- **Options Page**: Extension settings and configuration\n`;
    }
    
    if (architecture.hasDevtools) {
      markdown += `- **DevTools**: Developer tools integration\n`;
    }
    
    markdown += `\n`;
    return markdown;
  }
}
```

### **🔄 Automated Documentation Pipeline**

```javascript
// Automated Documentation Generation Pipeline
class DocumentationPipeline {
  constructor() {
    this.generators = new Map();
    this.watchers = new Map();
    this.outputFormats = ['markdown', 'html', 'pdf'];
    this.setupGenerators();
  }

  setupGenerators() {
    this.generators.set('code', new CodeDocumentationGenerator());
    this.generators.set('templates', new DocumentationTemplateSystem());
    this.generators.set('assets', new AssetDocumentationGenerator());
  }

  async generateAllDocumentation(projectPath, outputPath) {
    console.log('🚀 Starting documentation generation...');
    
    try {
      // Analyze project
      const projectAnalysis = await this.analyzeProject(projectPath);
      
      // Generate different types of documentation
      const docs = {
        api: await this.generateAPIDocumentation(projectAnalysis),
        userGuide: await this.generateUserGuide(projectAnalysis),
        readme: await this.generateREADME(projectAnalysis),
        architecture: await this.generateArchitectureDoc(projectAnalysis),
        changelog: await this.generateChangelog(projectPath),
        contributing: await this.generateContributingGuide(projectAnalysis)
      };

      // Generate in multiple formats
      for (const [docType, content] of Object.entries(docs)) {
        await this.generateMultipleFormats(content, docType, outputPath);
      }

      // Generate index page
      await this.generateIndexPage(docs, outputPath);

      // Copy assets
      await this.copyAssets(projectPath, outputPath);

      console.log('✅ Documentation generation completed');
      
      return {
        success: true,
        outputPath,
        generatedFiles: await this.listGeneratedFiles(outputPath)
      };

    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeProject(projectPath) {
    const analysis = {
      manifest: null,
      codebase: new Map(),
      assets: [],
      packageJson: null,
      gitInfo: null
    };

    // Read manifest.json
    try {
      const manifestPath = path.join(projectPath, 'manifest.json');
      analysis.manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    } catch (error) {
      console.warn('No manifest.json found');
    }

    // Read package.json
    try {
      const packagePath = path.join(projectPath, 'package.json');
      analysis.packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    } catch (error) {
      console.warn('No package.json found');
    }

    // Scan codebase
    const files = await this.scanDirectory(projectPath, ['.js', '.ts', '.json', '.css', '.html']);
    
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(projectPath, filePath);
      analysis.codebase.set(relativePath, content);
    }

    // Get git information
    try {
      analysis.gitInfo = await this.getGitInfo(projectPath);
    } catch (error) {
      console.warn('No git information available');
    }

    return analysis;
  }

  async generateMultipleFormats(content, docType, outputPath) {
    const formats = {
      markdown: () => content,
      html: () => this.markdownToHTML(content),
      pdf: () => this.markdownToPDF(content)
    };

    for (const format of this.outputFormats) {
      if (formats[format]) {
        const formattedContent = await formats[format]();
        const fileName = `${docType}.${format}`;
        const filePath = path.join(outputPath, fileName);
        
        await fs.writeFile(filePath, formattedContent);
        console.log(`📄 Generated ${fileName}`);
      }
    }
  }

  async setupWatcher(projectPath, outputPath) {
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch(projectPath, {
      ignored: /node_modules|\.git|dist|build/,
      persistent: true
    });

    watcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      
      // Debounce regeneration
      clearTimeout(this.regenerationTimeout);
      this.regenerationTimeout = setTimeout(async () => {
        await this.generateAllDocumentation(projectPath, outputPath);
        console.log('🔄 Documentation updated');
      }, 1000);
    });

    console.log('👁️ Watching for file changes...');
    return watcher;
  }

  async generateChangelog(projectPath) {
    try {
      // Try to get git log
      const { execSync } = require('child_process');
      const gitLog = execSync('git log --oneline --decorate --graph', {
        cwd: projectPath,
        encoding: 'utf8'
      });

      let changelog = `# Changelog\n\n`;
      changelog += `## Recent Changes\n\n`;
      
      const commits = gitLog.split('\n').slice(0, 20); // Last 20 commits
      
      for (const commit of commits) {
        if (commit.trim()) {
          changelog += `- ${commit.trim()}\n`;
        }
      }
      
      return changelog;
    } catch (error) {
      return `# Changelog\n\nNo git history available.\n`;
    }
  }

  async generateContributingGuide(projectAnalysis) {
    let guide = `# Contributing Guide\n\n`;
    
    guide += `Thank you for your interest in contributing to ${projectAnalysis.manifest?.name || 'this extension'}!\n\n`;
    
    guide += `## Development Setup\n\n`;
    guide += `1. Fork the repository\n`;
    guide += `2. Clone your fork\n`;
    guide += `3. Install dependencies: \`npm install\`\n`;
    guide += `4. Start development: \`npm run dev\`\n\n`;

    guide += `## Code Standards\n\n`;
    guide += `- Use ESLint for code linting\n`;
    guide += `- Follow the existing code style\n`;
    guide += `- Add tests for new features\n`;
    guide += `- Update documentation\n\n`;

    guide += `## Pull Request Process\n\n`;
    guide += `1. Create a feature branch\n`;
    guide += `2. Make your changes\n`;
    guide += `3. Add/update tests\n`;
    guide += `4. Update documentation\n`;
    guide += `5. Submit a pull request\n\n`;

    guide += `## Reporting Issues\n\n`;
    guide += `Please use the GitHub issue tracker to report bugs or request features.\n\n`;

    return guide;
  }

  markdownToHTML(markdown) {
    // Convert markdown to HTML
    const marked = require('marked');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    ${marked(markdown)}
</body>
</html>`;
    
    return html;
  }
}

// Usage
const pipeline = new DocumentationPipeline();

// Generate documentation
await pipeline.generateAllDocumentation('./src', './docs');

// Setup file watcher for auto-regeneration
const watcher = await pipeline.setupWatcher('./src', './docs');
```

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO

### **OBJETIVO:** Gerar documentação completa e sempre atualizada

### **ESTRUTURA DE ENTREGA:**

```
📦 DOCUMENTATION SUITE
├── 📚 docs/                        # Documentação gerada
│   ├── api/                        # Documentação de API
│   │   ├── api-reference.md        # Referência completa da API
│   │   ├── api-reference.html      # Versão HTML
│   │   └── api-reference.pdf       # Versão PDF
│   ├── user/                       # Documentação do usuário
│   │   ├── user-guide.md           # Guia do usuário
│   │   ├── installation.md         # Guia de instalação
│   │   ├── faq.md                  # Perguntas frequentes
│   │   └── troubleshooting.md      # Resolução de problemas
│   ├── developer/                  # Documentação do desenvolvedor
│   │   ├── architecture.md         # Arquitetura da extensão
│   │   ├── contributing.md         # Guia de contribuição
│   │   ├── development-setup.md    # Setup de desenvolvimento
│   │   └── testing.md              # Guia de testes
│   ├── admin/                      # Documentação administrativa
│   │   ├── enterprise-guide.md     # Guia empresarial
│   │   ├── group-policies.md       # Políticas de grupo
│   │   └── security.md             # Documentação de segurança
│   └── assets/                     # Assets da documentação
│       ├── images/                 # Screenshots e diagramas
│       ├── videos/                 # Tutoriais em vídeo
│       └── diagrams/               # Diagramas de arquitetura
├── 🤖 generators/                  # Geradores de documentação
│   ├── code-doc-generator.js       # Gerador de doc de código
│   ├── template-system.js          # Sistema de templates
│   ├── asset-generator.js          # Gerador de assets
│   └── pipeline.js                 # Pipeline de automação
├── 📝 templates/                   # Templates de documentação
│   ├── api-reference.hbs           # Template de API
│   ├── user-guide.hbs              # Template de guia do usuário
│   ├── readme.hbs                  # Template de README
│   └── architecture.hbs            # Template de arquitetura
├── ⚙️ config/                      # Configurações
│   ├── doc-config.json             # Configuração da documentação
│   ├── template-config.json        # Configuração de templates
│   └── pipeline-config.json        # Configuração do pipeline
├── 🔄 automation/                  # Scripts de automação
│   ├── watch-and-regenerate.js     # Watcher de arquivos
│   ├── deploy-docs.js              # Deploy da documentação
│   └── validate-docs.js            # Validação da documentação
└── README.md                       # Documentação do sistema
```

### **CADA DOCUMENTO DEVE CONTER:**

#### **📖 Conteúdo Estruturado**
- Índice navegável
- Seções bem organizadas
- Exemplos práticos
- Links internos e externos

#### **🎨 Formatação Consistente**
- Estilo visual uniforme
- Syntax highlighting
- Diagramas e imagens
- Responsive design

#### **🔄 Atualização Automática**
- Sincronização com código
- Versionamento automático
- Changelog gerado
- Links sempre válidos

#### **🔍 Facilidade de Busca**
- Índice de conteúdo
- Tags e categorias
- Busca full-text
- Navegação intuitiva

---

## ✅ CHECKLIST DE DOCUMENTAÇÃO COMPLETA

### **📚 Conteúdo**
- [ ] **API Reference** completa e atualizada
- [ ] **User Guide** com todos os recursos
- [ ] **Installation Guide** para diferentes cenários
- [ ] **Developer Documentation** para contribuidores
- [ ] **Architecture Documentation** detalhada
- [ ] **Troubleshooting Guide** com problemas comuns
- [ ] **FAQ** com perguntas frequentes
- [ ] **Changelog** automaticamente gerado

### **🤖 Automação**
- [ ] **Code documentation** extraída automaticamente
- [ ] **Templates** configurados e funcionais
- [ ] **Pipeline** de geração automatizada
- [ ] **File watcher** para atualizações em tempo real
- [ ] **Multi-format output** (MD, HTML, PDF)
- [ ] **Asset generation** automatizada
- [ ] **Link validation** implementada
- [ ] **Deploy automation** configurada

### **🎨 Qualidade**
- [ ] **Visual consistency** em todos os documentos
- [ ] **Navigation** intuitiva e funcional
- [ ] **Search functionality** implementada
- [ ] **Mobile responsiveness** garantida
- [ ] **Accessibility** compliance (WCAG)
- [ ] **Performance** otimizada
- [ ] **SEO optimization** aplicada
- [ ] **Analytics** configuradas

### **🔄 Manutenção**
- [ ] **Version control** para documentação
- [ ] **Review process** estabelecido
- [ ] **Update notifications** configuradas
- [ ] **Broken link detection** automatizada
- [ ] **Content validation** implementada
- [ ] **Backup strategy** definida
- [ ] **Migration plan** documentado
- [ ] **Maintenance schedule** estabelecido

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverable Final**
Um **sistema completo de documentação** que:

✅ **Gera automaticamente** toda a documentação  
✅ **Mantém sincronização** com o código  
✅ **Suporta múltiplos formatos** (MD, HTML, PDF)  
✅ **Atualiza em tempo real** com mudanças  
✅ **Fornece navegação** intuitiva e busca  
✅ **Cobre todas as audiências** (usuários, devs, admins)  
✅ **Mantém qualidade** visual e de conteúdo  

### **📚 Benefícios da Documentação**
- **⏱️ Redução de 60%** no tempo de onboarding
- **📞 Redução de 70%** em tickets de suporte
- **👥 Melhoria de 80%** na experiência do desenvolvedor
- **🔍 Facilita descoberta** de funcionalidades
- **🚀 Acelera adoção** da extensão
- **📈 Melhora ratings** nas stores

**A documentação deve ser tão boa que os usuários prefiram ler a documentação a pedir ajuda, e os desenvolvedores encontrem tudo que precisam sem precisar ler o código.**