#!/usr/bin/env node

/**
 * 📄 MANIFEST VALIDATION SCRIPT - ASSISTENTE DE REGULAÇÃO MÉDICA
 *
 * Validação completa de manifests para Manifest V3
 * Verificação de compliance, segurança e políticas das stores
 * Suporte para Firefox e Chrome/Edge
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class ManifestValidator {
  constructor(options = {}) {
    this.options = {
      strict: true,
      checkSecurity: true,
      checkStoreCompliance: true,
      verbose: false,
      ...options
    };

    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  log(message, level = 'info') {
    if (!this.options.verbose && level === 'debug') return;

    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';

    console.log(`${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  async validateAll() {
    this.log('🔍 Starting manifest validation...');

    try {
      // Validar manifests individuais
      await this.validateManifest('manifest.json', 'firefox');
      await this.validateManifest('manifest-edge.json', 'chrome');

      // Validar sincronização entre manifests
      await this.validateSynchronization();

      // Gerar relatório
      await this.generateReport();

      const hasErrors = this.errors.length > 0;

      if (hasErrors) {
        this.log(`❌ Validation failed with ${this.errors.length} errors and ${this.warnings.length} warnings`, 'error');
        return false;
      } else {
        this.log(`✅ Validation passed with ${this.warnings.length} warnings`, 'success');
        return true;
      }

    } catch (error) {
      this.addError(`Validation process failed: ${error.message}`);
      return false;
    }
  }

  async validateManifest(filename, browser) {
    this.log(`📄 Validating ${filename} for ${browser}...`);

    const manifestPath = path.join(rootDir, filename);

    if (!await fs.pathExists(manifestPath)) {
      this.addError(`Manifest file not found: ${filename}`);
      return;
    }

    try {
      const manifest = await fs.readJson(manifestPath);
      this.validationResults[browser] = manifest;

      // Validações básicas
      await this.validateBasicStructure(manifest, browser);

      // Validações de Manifest V3
      await this.validateManifestV3(manifest, browser);

      // Validações de segurança
      if (this.options.checkSecurity) {
        await this.validateSecurity(manifest, browser);
      }

      // Validações de compliance das stores
      if (this.options.checkStoreCompliance) {
        await this.validateStoreCompliance(manifest, browser);
      }

      // Validações específicas do navegador
      await this.validateBrowserSpecific(manifest, browser);

      this.log(`✅ ${filename} validation completed`, 'success');

    } catch (error) {
      this.addError(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  async validateBasicStructure(manifest, browser) {
    this.log(`🔍 Validating basic structure for ${browser}...`, 'debug');

    // Campos obrigatórios
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'description'
    ];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        this.addError(`${browser}: Missing required field '${field}'`);
      }
    }

    // Validar tipos de dados
    if (manifest.manifest_version && typeof manifest.manifest_version !== 'number') {
      this.addError(`${browser}: manifest_version must be a number`);
    }

    if (manifest.name && typeof manifest.name !== 'string') {
      this.addError(`${browser}: name must be a string`);
    }

    if (manifest.version && typeof manifest.version !== 'string') {
      this.addError(`${browser}: version must be a string`);
    }

    if (manifest.description && typeof manifest.description !== 'string') {
      this.addError(`${browser}: description must be a string`);
    }

    // Validar formato da versão
    if (manifest.version && !this.isValidVersion(manifest.version)) {
      this.addError(`${browser}: Invalid version format '${manifest.version}' (expected: X.Y.Z)`);
    }
  }

  isValidVersion(version) {
    // Validar formato semver básico
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  async validateManifestV3(manifest, browser) {
    this.log(`🔍 Validating Manifest V3 compliance for ${browser}...`, 'debug');

    // Verificar versão do manifest
    if (manifest.manifest_version !== 3) {
      this.addError(`${browser}: Must use Manifest V3 (found: ${manifest.manifest_version})`);
      return;
    }

    // Verificar service worker (obrigatório no V3)
    if (!manifest.background) {
      this.addError(`${browser}: Missing background field (required in Manifest V3)`);
    } else {
      if (!manifest.background.service_worker) {
        this.addError(`${browser}: Missing service_worker in background (required in Manifest V3)`);
      }

      // Verificar se não usa scripts (V2)
      if (manifest.background.scripts) {
        this.addError(`${browser}: background.scripts not allowed in Manifest V3 (use service_worker)`);
      }

      if (manifest.background.persistent !== undefined) {
        this.addError(`${browser}: background.persistent not allowed in Manifest V3`);
      }
    }

    // Verificar action vs browser_action
    if (manifest.browser_action) {
      this.addError(`${browser}: browser_action deprecated in Manifest V3 (use action)`);
    }

    if (manifest.page_action) {
      this.addError(`${browser}: page_action deprecated in Manifest V3 (use action)`);
    }

    // Verificar web_accessible_resources formato V3
    if (manifest.web_accessible_resources) {
      if (Array.isArray(manifest.web_accessible_resources)) {
        // Verificar se é array de strings (V2) ou objetos (V3)
        const firstItem = manifest.web_accessible_resources[0];
        if (typeof firstItem === 'string') {
          this.addError(`${browser}: web_accessible_resources must use Manifest V3 format (array of objects)`);
        } else if (typeof firstItem === 'object') {
          // Validar estrutura V3
          for (const resource of manifest.web_accessible_resources) {
            if (!resource.resources || !Array.isArray(resource.resources)) {
              this.addError(`${browser}: web_accessible_resources items must have 'resources' array`);
            }
            if (!resource.matches || !Array.isArray(resource.matches)) {
              this.addError(`${browser}: web_accessible_resources items must have 'matches' array`);
            }
          }
        }
      }
    }

    // Verificar host_permissions (novo no V3)
    if (manifest.permissions && manifest.permissions.some(p => p.includes('://'))) {
      this.addWarning(`${browser}: Host permissions should be in 'host_permissions' field in Manifest V3`);
    }
  }

  async validateSecurity(manifest, browser) {
    this.log(`🔒 Validating security for ${browser}...`, 'debug');

    // Validar Content Security Policy
    if (manifest.content_security_policy) {
      await this.validateCSP(manifest.content_security_policy, browser);
    } else {
      this.addWarning(`${browser}: No Content Security Policy defined`);
    }

    // Validar permissões
    await this.validatePermissions(manifest, browser);

    // Validar host permissions
    await this.validateHostPermissions(manifest, browser);

    // Verificar external resources
    await this.validateExternalResources(manifest, browser);
  }

  async validateCSP(csp, browser) {
    this.log(`🔒 Validating CSP for ${browser}...`, 'debug');

    let cspString = '';

    if (typeof csp === 'string') {
      // Manifest V2 format
      cspString = csp;
      this.addWarning(`${browser}: CSP should use Manifest V3 object format`);
    } else if (typeof csp === 'object') {
      // Manifest V3 format
      if (csp.extension_pages) {
        cspString = csp.extension_pages;
      } else {
        this.addError(`${browser}: CSP object missing 'extension_pages' field`);
        return;
      }
    }

    // Verificar diretivas obrigatórias
    if (!cspString.includes('script-src')) {
      this.addError(`${browser}: CSP missing 'script-src' directive`);
    }

    if (!cspString.includes("object-src 'none'")) {
      this.addError(`${browser}: CSP should include "object-src 'none'"`);
    }

    // Verificar práticas inseguras
    if (cspString.includes('unsafe-eval')) {
      this.addError(`${browser}: CSP contains 'unsafe-eval' - security risk`);
    }

    if (cspString.includes('unsafe-inline')) {
      this.addError(`${browser}: CSP contains 'unsafe-inline' - security risk`);
    }

    // Verificar wildcards
    if (cspString.includes('*')) {
      this.addWarning(`${browser}: CSP contains wildcards - review for security implications`);
    }
  }

  async validatePermissions(manifest, browser) {
    this.log(`🔒 Validating permissions for ${browser}...`, 'debug');

    if (!manifest.permissions) {
      return;
    }

    // Permissões perigosas que requerem justificativa
    const dangerousPermissions = [
      'tabs',
      'history',
      'bookmarks',
      'cookies',
      'debugger',
      'management',
      'nativeMessaging',
      'privacy',
      'proxy',
      'system.cpu',
      'system.memory',
      'system.storage'
    ];

    // Permissões que requerem consentimento do usuário
    const sensitivePermissions = [
      'geolocation',
      'notifications',
      'camera',
      'microphone',
      'clipboardRead',
      'clipboardWrite'
    ];

    for (const permission of manifest.permissions) {
      if (dangerousPermissions.includes(permission)) {
        this.addWarning(`${browser}: Dangerous permission detected: '${permission}' - ensure it's necessary`);
      }

      if (sensitivePermissions.includes(permission)) {
        this.addWarning(`${browser}: Sensitive permission detected: '${permission}' - ensure user consent is handled`);
      }
    }

    // Verificar permissões desnecessárias comuns
    const unnecessaryPermissions = [
      'unlimitedStorage', // Raramente necessário
      'background' // Não é uma permissão válida
    ];

    for (const permission of manifest.permissions) {
      if (unnecessaryPermissions.includes(permission)) {
        this.addWarning(`${browser}: Potentially unnecessary permission: '${permission}'`);
      }
    }
  }

  async validateHostPermissions(manifest, browser) {
    this.log(`🌐 Validating host permissions for ${browser}...`, 'debug');

    if (!manifest.host_permissions) {
      return;
    }

    for (const hostPermission of manifest.host_permissions) {
      // Verificar permissões muito amplas
      if (hostPermission === '<all_urls>') {
        this.addWarning(`${browser}: Very broad host permission '<all_urls>' - consider specific patterns`);
      }

      if (hostPermission === '*://*/*') {
        this.addWarning(`${browser}: Very broad host permission '*://*/*' - consider specific patterns`);
      }

      // Verificar HTTP vs HTTPS
      if (hostPermission.startsWith('http://')) {
        this.addWarning(`${browser}: HTTP host permission detected - prefer HTTPS: '${hostPermission}'`);
      }

      // Verificar formato válido
      if (!this.isValidHostPermission(hostPermission)) {
        this.addError(`${browser}: Invalid host permission format: '${hostPermission}'`);
      }
    }
  }

  isValidHostPermission(permission) {
    // Validação básica de formato de host permission
    const validPatterns = [
      /^https?:\/\/\*\//,           // http://*/
      /^https?:\/\/\*\.\w+\//,      // http://*.example.com/
      /^https?:\/\/[\w.-]+\//,      // http://example.com/
      /^<all_urls>$/,               // <all_urls>
      /^\*:\/\/\*\/\*$/,           // *://*/*
      /^file:\/\/\/\*$/             // file:///*
    ];

    return validPatterns.some(pattern => pattern.test(permission));
  }

  async validateExternalResources(manifest, browser) {
    this.log(`🌐 Validating external resources for ${browser}...`, 'debug');

    // Verificar se há recursos HTTP em manifest
    const manifestString = JSON.stringify(manifest);

    if (manifestString.includes('http://')) {
      this.addWarning(`${browser}: HTTP resources detected in manifest - prefer HTTPS`);
    }

    // Verificar web_accessible_resources
    if (manifest.web_accessible_resources) {
      for (const resource of manifest.web_accessible_resources) {
        if (typeof resource === 'object' && resource.resources) {
          for (const res of resource.resources) {
            if (res.includes('http://')) {
              this.addWarning(`${browser}: HTTP resource in web_accessible_resources: '${res}'`);
            }
          }
        }
      }
    }
  }

  async validateStoreCompliance(manifest, browser) {
    this.log(`🏪 Validating store compliance for ${browser}...`, 'debug');

    if (browser === 'chrome') {
      await this.validateChromeStoreCompliance(manifest);
    } else if (browser === 'firefox') {
      await this.validateFirefoxStoreCompliance(manifest);
    }
  }

  async validateChromeStoreCompliance(manifest) {
    this.log('🔵 Validating Chrome Web Store compliance...', 'debug');

    // Verificar limites de tamanho de campos
    if (manifest.name && manifest.name.length > 45) {
      this.addError(`Chrome: Extension name too long (${manifest.name.length} > 45 characters)`);
    }

    if (manifest.description && manifest.description.length > 132) {
      this.addError(`Chrome: Description too long (${manifest.description.length} > 132 characters)`);
    }

    // Verificar ícones obrigatórios
    if (!manifest.icons) {
      this.addError('Chrome: Icons are required for Chrome Web Store');
    } else {
      const requiredSizes = ['16', '48', '128'];
      const availableSizes = Object.keys(manifest.icons);

      for (const size of requiredSizes) {
        if (!availableSizes.includes(size)) {
          this.addError(`Chrome: Missing required icon size: ${size}x${size}`);
        }
      }
    }

    // Verificar campos recomendados
    if (!manifest.short_name) {
      this.addWarning('Chrome: short_name field recommended for better display');
    }

    if (!manifest.author) {
      this.addWarning('Chrome: author field recommended');
    }
  }

  async validateFirefoxStoreCompliance(manifest) {
    this.log('🦊 Validating Firefox Add-ons compliance...', 'debug');

    // Verificar ID da extensão
    if (!manifest.browser_specific_settings?.gecko?.id) {
      this.addWarning('Firefox: Extension ID not specified in browser_specific_settings.gecko.id');
    } else {
      const id = manifest.browser_specific_settings.gecko.id;
      if (!this.isValidFirefoxId(id)) {
        this.addError(`Firefox: Invalid extension ID format: '${id}'`);
      }
    }

    // Verificar versão mínima do Firefox
    if (manifest.browser_specific_settings?.gecko?.strict_min_version) {
      const minVersion = manifest.browser_specific_settings.gecko.strict_min_version;
      this.log(`Firefox: Minimum version specified: ${minVersion}`, 'debug');
    }

    // Verificar campos específicos do Firefox
    if (manifest.developer) {
      this.log('Firefox: Developer information provided', 'debug');
    }
  }

  isValidFirefoxId(id) {
    // Validar formato do ID do Firefox
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const guidRegex = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/i;

    return emailRegex.test(id) || guidRegex.test(id);
  }

  async validateBrowserSpecific(manifest, browser) {
    this.log(`🔍 Validating ${browser}-specific features...`, 'debug');

    if (browser === 'firefox') {
      // Validações específicas do Firefox
      if (manifest.sidebar_action) {
        this.log('Firefox: Sidebar action detected', 'debug');

        if (!manifest.sidebar_action.default_panel) {
          this.addError('Firefox: sidebar_action missing default_panel');
        }
      }

      // Verificar APIs específicas do Firefox
      if (manifest.permissions?.includes('tabs') && !manifest.permissions.includes('activeTab')) {
        this.addWarning('Firefox: Consider using activeTab instead of tabs permission');
      }

    } else if (browser === 'chrome') {
      // Validações específicas do Chrome
      if (manifest.action) {
        this.log('Chrome: Action detected', 'debug');
      }

      // Verificar APIs específicas do Chrome
      if (manifest.permissions?.includes('declarativeContent')) {
        this.log('Chrome: declarativeContent permission detected', 'debug');
      }
    }
  }

  async validateSynchronization() {
    this.log('🔄 Validating manifest synchronization...');

    const firefoxManifest = this.validationResults.firefox;
    const chromeManifest = this.validationResults.chrome;

    if (!firefoxManifest || !chromeManifest) {
      this.addError('Cannot validate synchronization - one or both manifests failed to load');
      return;
    }

    // Verificar campos que devem ser idênticos
    const syncFields = ['name', 'version', 'description'];

    for (const field of syncFields) {
      if (firefoxManifest[field] !== chromeManifest[field]) {
        this.addError(`Manifest synchronization error: '${field}' differs between Firefox and Chrome`);
        this.log(`  Firefox: '${firefoxManifest[field]}'`, 'debug');
        this.log(`  Chrome: '${chromeManifest[field]}'`, 'debug');
      }
    }

    // Verificar permissões básicas (podem diferir ligeiramente)
    const firefoxPerms = new Set(firefoxManifest.permissions || []);
    const chromePerms = new Set(chromeManifest.permissions || []);

    const onlyFirefox = [...firefoxPerms].filter(p => !chromePerms.has(p));
    const onlyChrome = [...chromePerms].filter(p => !firefoxPerms.has(p));

    if (onlyFirefox.length > 0) {
      this.addWarning(`Permissions only in Firefox: ${onlyFirefox.join(', ')}`);
    }

    if (onlyChrome.length > 0) {
      this.addWarning(`Permissions only in Chrome: ${onlyChrome.join(', ')}`);
    }

    this.log('✅ Synchronization validation completed', 'success');
  }

  async generateReport() {
    this.log('📊 Generating validation report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        success: this.errors.length === 0
      },
      errors: this.errors,
      warnings: this.warnings,
      manifests: this.validationResults
    };

    // Salvar relatório
    const reportPath = path.join(rootDir, 'manifest-validation-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    this.log(`📄 Validation report saved to: ${reportPath}`);

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--no-strict') {
      options.strict = false;
    } else if (arg === '--no-security') {
      options.checkSecurity = false;
    } else if (arg === '--no-store-compliance') {
      options.checkStoreCompliance = false;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  try {
    const validator = new ManifestValidator(options);
    const success = await validator.validateAll();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation process failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ManifestValidator;
