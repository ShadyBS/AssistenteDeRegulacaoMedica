# Prompt para Pipeline Completo de Validação, Build e Release para Extensões de Navegador

## 🚀 MISSÃO: CRIAR PIPELINE COMPLETO DE CI/CD PARA BROWSER EXTENSION

Você é um **Senior Browser Extension DevOps Engineer** especializado em **pipelines de Manifest V3** e **automação cross-browser**. Crie um **pipeline completo de validação, build e release** para esta extensão de navegador, cobrindo todos os aspectos críticos desde desenvolvimento até distribuição nas stores oficiais.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE CRIAR O PIPELINE:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Analise `manifest.json` completamente** - Define toda a estratégia de build
3. **Mapeie todos os assets** - Scripts, styles, images, locales
4. **Identifique navegadores alvo** - Chrome, Firefox, Edge ou todos
5. **Valide dependencies** - NPM packages, external resources
6. **Determine estratégia de versionamento** - Semantic versioning
7. **Configure ambientes** - Development, staging, production

---

## 📋 ESCOPO COMPLETO DO PIPELINE

### 🔍 **VALIDAÇÃO E QUALIDADE** (Stage 1)

#### 🛡️ **Security Validation**
- **Manifest V3 Compliance** - Validação completa de sintaxe e estrutura
- **Permission Audit** - Verificação de permissions mínimas necessárias
- **CSP Compliance** - Content Security Policy validation
- **Dependency Security** - Scan de vulnerabilidades em dependencies
- **Code Security** - Static analysis para vulnerabilidades
- **External Resources** - Validação de CDNs e recursos externos
- **Data Privacy** - Compliance com GDPR/LGPD
- **Store Policies** - Verificação de políticas das stores

#### 📊 **Code Quality**
- **Linting** - ESLint, Prettier, StyleLint
- **Type Checking** - TypeScript validation
- **Code Coverage** - Minimum 80% coverage requirement
- **Complexity Analysis** - Cyclomatic complexity check
- **Dead Code Detection** - Unused code identification
- **Bundle Analysis** - Size optimization validation
- **Performance Metrics** - Core Web Vitals compliance
- **Accessibility Check** - WCAG 2.1 AA compliance

#### 🧪 **Testing Pipeline**
- **Unit Tests** - Jest/Mocha execution
- **Integration Tests** - Cross-component testing
- **E2E Tests** - Puppeteer/Playwright automation
- **Cross-Browser Tests** - Chrome, Firefox, Edge compatibility
- **Performance Tests** - Load time, memory usage
- **Security Tests** - Penetration testing
- **Accessibility Tests** - Screen reader compatibility
- **Visual Regression** - UI consistency validation

### 🏗️ **BUILD E OTIMIZAÇÃO** (Stage 2)

#### 📦 **Multi-Browser Build**
- **Chrome Build** - Manifest V3 optimized
- **Firefox Build** - WebExtensions API compatibility
- **Edge Build** - Chromium-based optimization
- **Universal Build** - Cross-browser compatibility layer
- **Source Maps** - Debug information generation
- **Asset Optimization** - Image compression, minification
- **Bundle Splitting** - Code splitting for performance
- **Tree Shaking** - Dead code elimination

#### ⚡ **Performance Optimization**
- **Code Minification** - JavaScript, CSS, HTML
- **Asset Compression** - Gzip, Brotli compression
- **Image Optimization** - WebP conversion, compression
- **Bundle Size Analysis** - Size budget enforcement
- **Lazy Loading** - Dynamic imports optimization
- **Cache Optimization** - Browser cache strategies
- **Memory Optimization** - Memory leak prevention
- **Startup Performance** - Fast initialization

#### 🔧 **Build Configuration**
- **Environment Variables** - Development, staging, production
- **Feature Flags** - Conditional feature compilation
- **Localization** - Multi-language support
- **Version Injection** - Automatic version bumping
- **Metadata Generation** - Build information embedding
- **Sourcemap Generation** - Debug support
- **Documentation** - Auto-generated docs
- **Changelog** - Automatic changelog generation

### ✅ **VALIDAÇÃO PRÉ-RELEASE** (Stage 3)

#### 🎯 **Store Validation**
- **Chrome Web Store** - Policy compliance check
- **Firefox Add-ons** - AMO validation
- **Edge Add-ons** - Microsoft Store validation
- **Manifest Validation** - Store-specific requirements
- **Icon Validation** - Size and format requirements
- **Screenshot Validation** - Store listing requirements
- **Description Validation** - Content policy compliance
- **Privacy Policy** - Required documentation check

#### 🔒 **Security Final Check**
- **Code Signing** - Digital signature validation
- **Integrity Check** - File hash verification
- **Malware Scan** - Virus/malware detection
- **Permission Review** - Final permission audit
- **External Calls** - Network request validation
- **Data Collection** - Privacy compliance check
- **Third-party Code** - External library audit
- **Vulnerability Scan** - Final security assessment

#### 📈 **Performance Validation**
- **Load Time** - Extension startup performance
- **Memory Usage** - RAM consumption limits
- **CPU Usage** - Processing overhead check
- **Network Impact** - Bandwidth usage analysis
- **Battery Impact** - Power consumption assessment
- **Page Performance** - Website impact measurement
- **Storage Usage** - Disk space optimization
- **API Rate Limits** - External API usage validation

### 🚀 **RELEASE E DISTRIBUIÇÃO** (Stage 4)

#### 📦 **Package Generation**
- **Chrome Package** - .crx file generation
- **Firefox Package** - .xpi file generation
- **Edge Package** - .appx file generation
- **Source Package** - Source code archive
- **Debug Package** - Development version
- **Beta Package** - Testing version
- **Release Notes** - Automated generation
- **Version Tagging** - Git tag creation

#### 🌐 **Store Deployment**
- **Chrome Web Store** - Automated upload
- **Firefox Add-ons** - AMO submission
- **Edge Add-ons** - Microsoft Store upload
- **Beta Channels** - Testing distribution
- **Rollback Strategy** - Version rollback capability
- **Gradual Rollout** - Phased deployment
- **A/B Testing** - Feature flag deployment
- **Monitoring Setup** - Error tracking initialization

#### 📊 **Post-Release Monitoring**
- **Error Tracking** - Sentry, Bugsnag integration
- **Performance Monitoring** - Real-world metrics
- **User Analytics** - Usage statistics
- **Crash Reporting** - Automatic crash detection
- **Update Monitoring** - Update success rates
- **Store Metrics** - Download, rating tracking
- **Security Monitoring** - Threat detection
- **Compliance Monitoring** - Policy adherence

---

## 🏗️ ESTRUTURA DO PIPELINE

### **📁 Organização de Arquivos**
```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous Integration
│   ├── cd.yml                    # Continuous Deployment
│   ├── security-scan.yml         # Security scanning
│   ├── performance-test.yml      # Performance testing
│   └── store-submission.yml      # Store submission
├── ISSUE_TEMPLATE/
├── PULL_REQUEST_TEMPLATE.md
└── dependabot.yml

scripts/
├── build/
│   ├── build-chrome.js           # Chrome-specific build
│   ├── build-firefox.js          # Firefox-specific build
│   ├── build-edge.js             # Edge-specific build
│   ├── build-universal.js        # Universal build
│   └── optimize-assets.js        # Asset optimization
├── validation/
│   ├── validate-manifest.js      # Manifest validation
│   ├── validate-permissions.js   # Permission audit
│   ├── validate-csp.js           # CSP validation
│   ├── validate-security.js      # Security checks
│   └── validate-performance.js   # Performance validation
├── testing/
│   ├── run-unit-tests.js         # Unit test execution
│   ├── run-e2e-tests.js          # E2E test execution
│   ├── run-cross-browser.js      # Cross-browser testing
│   └── generate-coverage.js      # Coverage reporting
├── release/
│   ├── package-chrome.js         # Chrome packaging
│   ├── package-firefox.js        # Firefox packaging
│   ├── package-edge.js           # Edge packaging
│   ├── upload-stores.js          # Store upload automation
│   └── create-release.js         # Release creation
└── utils/
    ├── version-bump.js           # Version management
    ├── changelog-generator.js    # Changelog automation
    ├── notification.js           # Slack/Discord notifications
    └── cleanup.js                # Cleanup utilities

config/
├── webpack/
│   ├── webpack.common.js         # Common webpack config
│   ├── webpack.dev.js            # Development config
│   ├── webpack.prod.js           # Production config
│   ├── webpack.chrome.js         # Chrome-specific config
│   ├── webpack.firefox.js        # Firefox-specific config
│   └── webpack.edge.js           # Edge-specific config
├── eslint/
│   ├── .eslintrc.base.js         # Base ESLint config
│   ├── .eslintrc.content.js      # Content script config
│   ├── .eslintrc.background.js   # Background script config
│   └── .eslintrc.popup.js        # Popup script config
├── jest/
│   ├── jest.config.js            # Jest configuration
│   ├── jest.unit.js              # Unit test config
│   ├── jest.integration.js       # Integration test config
│   └── jest.e2e.js               # E2E test config
└── stores/
    ├── chrome-store.json         # Chrome Web Store config
    ├── firefox-store.json        # Firefox AMO config
    ├── edge-store.json           # Edge Add-ons config
    └── beta-channels.json        # Beta distribution config

dist/
├── chrome/                       # Chrome build output
├── firefox/                      # Firefox build output
├── edge/                         # Edge build output
├── universal/                    # Universal build output
└── packages/                     # Final packages
    ├── chrome-extension.zip
    ├── firefox-extension.xpi
    ├── edge-extension.appx
    └── source-code.zip
```

---

## 🔧 CONFIGURAÇÕES ESPECÍFICAS

### **📦 Package.json Scripts**
```json
{
  "scripts": {
    "dev": "npm run build:dev && npm run watch",
    "build": "npm run clean && npm run build:all",
    "build:dev": "NODE_ENV=development npm run build:all",
    "build:prod": "NODE_ENV=production npm run build:all",
    "build:all": "npm run build:chrome && npm run build:firefox && npm run build:edge",
    "build:chrome": "webpack --config config/webpack/webpack.chrome.js",
    "build:firefox": "webpack --config config/webpack/webpack.firefox.js",
    "build:edge": "webpack --config config/webpack/webpack.edge.js",
    "build:universal": "webpack --config config/webpack/webpack.common.js",
    
    "validate": "npm run validate:all",
    "validate:all": "npm run validate:manifest && npm run validate:security && npm run validate:performance",
    "validate:manifest": "node scripts/validation/validate-manifest.js",
    "validate:security": "node scripts/validation/validate-security.js",
    "validate:permissions": "node scripts/validation/validate-permissions.js",
    "validate:csp": "node scripts/validation/validate-csp.js",
    "validate:performance": "node scripts/validation/validate-performance.js",
    
    "test": "npm run test:all",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "jest --config config/jest/jest.unit.js",
    "test:integration": "jest --config config/jest/jest.integration.js",
    "test:e2e": "jest --config config/jest/jest.e2e.js",
    "test:cross-browser": "node scripts/testing/run-cross-browser.js",
    "test:performance": "node scripts/testing/run-performance-tests.js",
    "test:security": "node scripts/testing/run-security-tests.js",
    "test:accessibility": "node scripts/testing/run-accessibility-tests.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    
    "lint": "npm run lint:all",
    "lint:all": "npm run lint:js && npm run lint:css && npm run lint:html",
    "lint:js": "eslint src/ --ext .js,.ts",
    "lint:css": "stylelint src/**/*.css",
    "lint:html": "htmlhint src/**/*.html",
    "lint:fix": "npm run lint:js -- --fix && npm run lint:css -- --fix",
    
    "package": "npm run package:all",
    "package:all": "npm run package:chrome && npm run package:firefox && npm run package:edge",
    "package:chrome": "node scripts/release/package-chrome.js",
    "package:firefox": "node scripts/release/package-firefox.js",
    "package:edge": "node scripts/release/package-edge.js",
    
    "release": "npm run release:all",
    "release:all": "npm run validate && npm run test && npm run build:prod && npm run package",
    "release:beta": "npm run release:all && node scripts/release/upload-beta.js",
    "release:prod": "npm run release:all && node scripts/release/upload-stores.js",
    "release:patch": "npm version patch && npm run release:prod",
    "release:minor": "npm version minor && npm run release:prod",
    "release:major": "npm version major && npm run release:prod",
    
    "clean": "rimraf dist/ coverage/ .nyc_output/",
    "watch": "npm run build:dev -- --watch",
    "serve": "web-ext run --source-dir dist/firefox/",
    "version:bump": "node scripts/utils/version-bump.js",
    "changelog": "node scripts/utils/changelog-generator.js",
    "security:scan": "npm audit && snyk test",
    "performance:analyze": "webpack-bundle-analyzer dist/chrome/",
    "docs:generate": "jsdoc src/ -r -d docs/",
    
    "ci:validate": "npm run validate && npm run lint && npm run security:scan",
    "ci:test": "npm run test:all && npm run test:cross-browser",
    "ci:build": "npm run build:prod",
    "ci:package": "npm run package:all",
    "ci:deploy": "node scripts/release/upload-stores.js"
  }
}
```

### **🔄 GitHub Actions CI/CD**
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate manifest
        run: npm run validate:manifest
      
      - name: Security scan
        run: npm run security:scan
      
      - name: Lint code
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: validate
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests for ${{ matrix.browser }}
        run: npm run test:e2e:${{ matrix.browser }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build all targets
        run: npm run build:prod
      
      - name: Validate build output
        run: npm run validate:performance
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: extension-builds
          path: dist/
```

### **🚀 Release Pipeline**
```yaml
# .github/workflows/cd.yml
name: Continuous Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run full validation
        run: npm run ci:validate
      
      - name: Run all tests
        run: npm run ci:test
      
      - name: Build production
        run: npm run ci:build
      
      - name: Package extensions
        run: npm run ci:package
      
      - name: Create GitHub release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      
      - name: Upload to Chrome Web Store
        env:
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
        run: npm run upload:chrome
      
      - name: Upload to Firefox AMO
        env:
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
        run: npm run upload:firefox
      
      - name: Upload to Edge Add-ons
        env:
          EDGE_CLIENT_ID: ${{ secrets.EDGE_CLIENT_ID }}
          EDGE_CLIENT_SECRET: ${{ secrets.EDGE_CLIENT_SECRET }}
        run: npm run upload:edge
      
      - name: Notify team
        run: node scripts/utils/notification.js
```

---

## 🛠️ SCRIPTS DE AUTOMAÇÃO

### **🔍 Validação de Manifest**
```javascript
// scripts/validation/validate-manifest.js
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

class ManifestValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.manifestV3Schema = this.loadSchema();
  }

  loadSchema() {
    // Load Manifest V3 JSON schema
    return {
      type: 'object',
      required: ['manifest_version', 'name', 'version'],
      properties: {
        manifest_version: { const: 3 },
        name: { type: 'string', minLength: 1, maxLength: 45 },
        version: { 
          type: 'string', 
          pattern: '^\\d+(\\.\\d+)*$' 
        },
        description: { type: 'string', maxLength: 132 },
        permissions: {
          type: 'array',
          items: { type: 'string' }
        },
        host_permissions: {
          type: 'array',
          items: { type: 'string' }
        },
        background: {
          type: 'object',
          properties: {
            service_worker: { type: 'string' }
          },
          required: ['service_worker']
        },
        action: {
          type: 'object',
          properties: {
            default_popup: { type: 'string' },
            default_title: { type: 'string' },
            default_icon: { type: 'object' }
          }
        },
        content_scripts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['matches', 'js'],
            properties: {
              matches: {
                type: 'array',
                items: { type: 'string' }
              },
              js: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  async validateManifest(manifestPath) {
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Schema validation
      const validate = this.ajv.compile(this.manifestV3Schema);
      const isValid = validate(manifest);
      
      if (!isValid) {
        console.error('❌ Manifest validation failed:');
        validate.errors.forEach(error => {
          console.error(`  - ${error.instancePath}: ${error.message}`);
        });
        return false;
      }

      // Custom validations
      const customValidations = [
        this.validatePermissions(manifest),
        this.validateIcons(manifest),
        this.validateContentScripts(manifest),
        this.validateWebAccessibleResources(manifest)
      ];

      const allValid = customValidations.every(result => result.valid);
      
      if (allValid) {
        console.log('✅ Manifest validation passed');
        return true;
      } else {
        console.error('❌ Custom validation failed');
        customValidations.forEach(result => {
          if (!result.valid) {
            console.error(`  - ${result.error}`);
          }
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error validating manifest:', error.message);
      return false;
    }
  }

  validatePermissions(manifest) {
    const dangerousPermissions = [
      '<all_urls>', 'tabs', 'history', 'bookmarks', 'cookies'
    ];
    
    const permissions = [
      ...(manifest.permissions || []),
      ...(manifest.host_permissions || [])
    ];
    
    const dangerous = permissions.filter(p => 
      dangerousPermissions.some(dp => p.includes(dp))
    );
    
    if (dangerous.length > 0) {
      return {
        valid: false,
        error: `Dangerous permissions detected: ${dangerous.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  validateIcons(manifest) {
    if (!manifest.icons) {
      return {
        valid: false,
        error: 'Icons are required for store submission'
      };
    }
    
    const requiredSizes = ['16', '48', '128'];
    const availableSizes = Object.keys(manifest.icons);
    const missingSizes = requiredSizes.filter(size => 
      !availableSizes.includes(size)
    );
    
    if (missingSizes.length > 0) {
      return {
        valid: false,
        error: `Missing required icon sizes: ${missingSizes.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  validateContentScripts(manifest) {
    if (!manifest.content_scripts) {
      return { valid: true };
    }
    
    for (const script of manifest.content_scripts) {
      if (!script.matches || script.matches.length === 0) {
        return {
          valid: false,
          error: 'Content scripts must have at least one match pattern'
        };
      }
      
      if (!script.js || script.js.length === 0) {
        return {
          valid: false,
          error: 'Content scripts must have at least one JS file'
        };
      }
    }
    
    return { valid: true };
  }

  validateWebAccessibleResources(manifest) {
    if (!manifest.web_accessible_resources) {
      return { valid: true };
    }
    
    // Validate new Manifest V3 format
    for (const resource of manifest.web_accessible_resources) {
      if (!resource.resources || !resource.matches) {
        return {
          valid: false,
          error: 'Web accessible resources must have resources and matches arrays'
        };
      }
    }
    
    return { valid: true };
  }
}

// Execute validation
const validator = new ManifestValidator();
const manifestPath = path.join(process.cwd(), 'src', 'manifest.json');

validator.validateManifest(manifestPath)
  .then(isValid => {
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
```

### **🏗️ Build Script Universal**
```javascript
// scripts/build/build-universal.js
import webpack from 'webpack';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UniversalBuilder {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..');
    this.srcDir = path.join(this.rootDir, 'src');
    this.distDir = path.join(this.rootDir, 'dist');
    this.configDir = path.join(this.rootDir, 'config', 'webpack');
  }

  async buildAll() {
    console.log('🚀 Starting universal build process...');
    
    try {
      // Clean dist directory
      await this.cleanDist();
      
      // Build for each browser
      await this.buildChrome();
      await this.buildFirefox();
      await this.buildEdge();
      
      // Generate universal package
      await this.generateUniversalPackage();
      
      console.log('✅ Universal build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    await fs.remove(this.distDir);
    await fs.ensureDir(this.distDir);
  }

  async buildChrome() {
    console.log('🔧 Building Chrome extension...');
    const config = await import(path.join(this.configDir, 'webpack.chrome.js'));
    await this.runWebpack(config.default);
  }

  async buildFirefox() {
    console.log('🦊 Building Firefox extension...');
    const config = await import(path.join(this.configDir, 'webpack.firefox.js'));
    await this.runWebpack(config.default);
  }

  async buildEdge() {
    console.log('🌐 Building Edge extension...');
    const config = await import(path.join(this.configDir, 'webpack.edge.js'));
    await this.runWebpack(config.default);
  }

  async runWebpack(config) {
    return new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err || stats.hasErrors()) {
          const error = err || stats.compilation.errors[0];
          reject(error);
          return;
        }
        
        console.log(stats.toString({
          chunks: false,
          colors: true
        }));
        
        resolve();
      });
    });
  }

  async generateUniversalPackage() {
    console.log('📦 Generating universal package...');
    
    const universalDir = path.join(this.distDir, 'universal');
    await fs.ensureDir(universalDir);
    
    // Copy common files
    await fs.copy(
      path.join(this.distDir, 'chrome'),
      universalDir
    );
    
    // Add browser detection and polyfills
    await this.addBrowserCompatibility(universalDir);
    
    console.log('✅ Universal package generated');
  }

  async addBrowserCompatibility(universalDir) {
    const polyfillContent = `
// Browser compatibility polyfill
(function() {
  if (typeof browser === 'undefined') {
    window.browser = chrome;
  }
  
  // Add Firefox-specific polyfills
  if (navigator.userAgent.includes('Firefox')) {
    // Firefox-specific code
  }
  
  // Add Edge-specific polyfills
  if (navigator.userAgent.includes('Edg')) {
    // Edge-specific code
  }
})();
`;
    
    const polyfillPath = path.join(universalDir, 'polyfill.js');
    await fs.writeFile(polyfillPath, polyfillContent);
    
    // Update manifest to include polyfill
    const manifestPath = path.join(universalDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);
    
    if (manifest.content_scripts) {
      manifest.content_scripts.forEach(script => {
        script.js.unshift('polyfill.js');
      });
    }
    
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }
}

// Execute build
const builder = new UniversalBuilder();
builder.buildAll();
```

### **📦 Packaging Script**
```javascript
// scripts/release/package-chrome.js
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { ChromeExtension } from 'crx3';

class ChromePackager {
  constructor() {
    this.distDir = path.join(process.cwd(), 'dist', 'chrome');
    this.packageDir = path.join(process.cwd(), 'dist', 'packages');
  }

  async packageExtension() {
    console.log('📦 Packaging Chrome extension...');
    
    try {
      await fs.ensureDir(this.packageDir);
      
      // Create ZIP package for store upload
      await this.createZipPackage();
      
      // Create CRX package for direct installation
      await this.createCrxPackage();
      
      console.log('✅ Chrome extension packaged successfully');
    } catch (error) {
      console.error('❌ Packaging failed:', error);
      process.exit(1);
    }
  }

  async createZipPackage() {
    const zipPath = path.join(this.packageDir, 'chrome-extension.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`📦 ZIP package created: ${archive.pointer()} bytes`);
        resolve();
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(this.distDir, false);
      archive.finalize();
    });
  }

  async createCrxPackage() {
    const crxPath = path.join(this.packageDir, 'chrome-extension.crx');
    const privateKeyPath = path.join(process.cwd(), 'keys', 'chrome-private-key.pem');
    
    if (!await fs.pathExists(privateKeyPath)) {
      console.log('⚠️ Private key not found, skipping CRX generation');
      return;
    }
    
    const crx = new ChromeExtension({
      codebase: 'https://example.com/extension.crx',
      privateKey: await fs.readFile(privateKeyPath)
    });
    
    const crxBuffer = await crx.load(this.distDir);
    await fs.writeFile(crxPath, crxBuffer);
    
    console.log('📦 CRX package created');
  }

  async validatePackage() {
    const manifestPath = path.join(this.distDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);
    
    // Validate required fields for Chrome Web Store
    const requiredFields = ['name', 'version', 'description', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate file sizes
    const stats = await this.getDirectorySize(this.distDir);
    const maxSize = 128 * 1024 * 1024; // 128MB limit
    
    if (stats.size > maxSize) {
      throw new Error(`Package size (${stats.size}) exceeds Chrome Web Store limit (${maxSize})`);
    }
    
    console.log('✅ Package validation passed');
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        const subDirStats = await this.getDirectorySize(filePath);
        totalSize += subDirStats.size;
      } else {
        totalSize += stats.size;
      }
    }
    
    return { size: totalSize };
  }
}

// Execute packaging
const packager = new ChromePackager();
packager.validatePackage()
  .then(() => packager.packageExtension())
  .catch(error => {
    console.error('Packaging error:', error);
    process.exit(1);
  });
```

---

## 📊 MONITORAMENTO E MÉTRICAS

### **📈 Performance Monitoring**
```javascript
// scripts/monitoring/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      buildTime: 0,
      bundleSize: {},
      testCoverage: 0,
      deploymentTime: 0
    };
  }

  async measureBuildPerformance() {
    const startTime = Date.now();
    
    // Run build process
    await this.runBuild();
    
    this.metrics.buildTime = Date.now() - startTime;
    
    // Measure bundle sizes
    await this.measureBundleSizes();
    
    // Generate performance report
    await this.generateReport();
  }

  async measureBundleSizes() {
    const browsers = ['chrome', 'firefox', 'edge'];
    
    for (const browser of browsers) {
      const distPath = path.join('dist', browser);
      const size = await this.getDirectorySize(distPath);
      this.metrics.bundleSize[browser] = size;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: `${this.metrics.buildTime}ms`,
      bundleSizes: this.metrics.bundleSize,
      performance: {
        buildTimeThreshold: this.metrics.buildTime < 60000, // < 1 minute
        bundleSizeThreshold: Object.values(this.metrics.bundleSize)
          .every(size => size < 10 * 1024 * 1024) // < 10MB
      }
    };
    
    console.log('📊 Performance Report:');
    console.table(report);
    
    // Save report
    await fs.writeJson('performance-report.json', report, { spaces: 2 });
  }
}
```

### **🔔 Notification System**
```javascript
// scripts/utils/notification.js
import { WebhookClient } from 'discord.js';
import { IncomingWebhook } from '@slack/webhook';

class NotificationService {
  constructor() {
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL ? 
      new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL }) : null;
    
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL ? 
      new IncomingWebhook(process.env.SLACK_WEBHOOK_URL) : null;
  }

  async notifyBuildSuccess(version, browsers) {
    const message = {
      title: '✅ Extension Build Successful',
      description: `Version ${version} built successfully for ${browsers.join(', ')}`,
      color: 0x00ff00,
      timestamp: new Date().toISOString()
    };

    await this.sendNotifications(message);
  }

  async notifyBuildFailure(error, stage) {
    const message = {
      title: '❌ Extension Build Failed',
      description: `Build failed at ${stage}: ${error.message}`,
      color: 0xff0000,
      timestamp: new Date().toISOString()
    };

    await this.sendNotifications(message);
  }

  async notifyDeploymentSuccess(version, stores) {
    const message = {
      title: '🚀 Extension Deployed',
      description: `Version ${version} deployed to ${stores.join(', ')}`,
      color: 0x0099ff,
      timestamp: new Date().toISOString()
    };

    await this.sendNotifications(message);
  }

  async sendNotifications(message) {
    const promises = [];

    if (this.discordWebhook) {
      promises.push(this.discordWebhook.send({
        embeds: [message]
      }));
    }

    if (this.slackWebhook) {
      promises.push(this.slackWebhook.send({
        text: `${message.title}\n${message.description}`
      }));
    }

    await Promise.allSettled(promises);
  }
}

export default NotificationService;
```

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverables Completos**
1. **Pipeline CI/CD completo** com validação, build e deploy automatizados
2. **Scripts de automação** para todas as etapas do processo
3. **Configurações multi-browser** para Chrome, Firefox e Edge
4. **Validação de qualidade** com linting, testing e security scanning
5. **Packaging automatizado** para todas as stores
6. **Monitoramento e notificações** para acompanhar o processo
7. **Documentação completa** de como usar e manter o pipeline

### **📊 Métricas de Qualidade**
- **Build Time:** < 5 minutos para build completo
- **Test Coverage:** ≥ 80% em todas as categorias
- **Security Score:** Zero vulnerabilidades críticas
- **Bundle Size:** Otimizado para cada navegador
- **Store Compliance:** 100% de aprovação nas validações
- **Deployment Success:** 99%+ de sucesso em deploys

### **🚀 Benefícios**
- ✅ **Automação completa** do processo de release
- ✅ **Qualidade garantida** através de validações automáticas
- ✅ **Deploy seguro** com rollback automático
- ✅ **Multi-browser support** nativo
- ✅ **Monitoramento contínuo** de performance e qualidade
- ✅ **Feedback imediato** sobre problemas
- ✅ **Escalabilidade** para crescimento do projeto

**O pipeline deve ser robusto, confiável e executar de forma consistente, garantindo que apenas código de alta qualidade seja distribuído para os usuários finais.**