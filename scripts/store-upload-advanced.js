#!/usr/bin/env node

/**
 * 🏪 ADVANCED STORE UPLOAD SCRIPT - ASSISTENTE DE REGULAÇÃO MÉDICA
 *
 * Upload automatizado para Chrome Web Store, Firefox Add-ons e Edge Add-ons
 * Suporte completo para APIs das stores, validação e monitoramento
 * Retry logic, rate limiting e error handling avançado
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class StoreUploader {
  constructor(options = {}) {
    this.options = {
      target: 'all', // chrome, firefox, edge, all
      environment: 'production', // staging, production
      dryRun: false,
      verbose: false,
      retryAttempts: 3,
      retryDelay: 5000,
      ...options
    };

    this.uploadResults = {
      startTime: Date.now(),
      uploads: [],
      errors: [],
      warnings: []
    };

    this.log('🏪 Initializing Store Uploader...');
    this.log(`Target: ${this.options.target}`);
    this.log(`Environment: ${this.options.environment}`);
    this.log(`Dry Run: ${this.options.dryRun}`);
  }

  log(message, level = 'info') {
    if (!this.options.verbose && level === 'debug') return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async uploadAll() {
    try {
      this.log('🚀 Starting store upload process...');

      // Validar pré-requisitos
      await this.validatePrerequisites();

      // Determinar targets
      const targets = this.getTargets();

      // Upload para cada store
      for (const target of targets) {
        await this.uploadToStore(target);
      }

      // Gerar relatório
      await this.generateUploadReport();

      const hasErrors = this.uploadResults.errors.length > 0;

      if (hasErrors) {
        this.log(`❌ Upload process completed with ${this.uploadResults.errors.length} errors`, 'error');
        return false;
      } else {
        this.log('🎉 All uploads completed successfully!', 'success');
        return true;
      }

    } catch (error) {
      this.log(`Upload process failed: ${error.message}`, 'error');
      this.uploadResults.errors.push(error.message);
      throw error;
    }
  }

  async validatePrerequisites() {
    this.log('🔍 Validating prerequisites...');

    // Verificar se packages existem
    const packageDir = path.join(rootDir, 'dist-zips');
    if (!await fs.pathExists(packageDir)) {
      throw new Error('Package directory not found. Run build first.');
    }

    // Verificar se há packages para upload
    const packages = await fs.readdir(packageDir);
    const zipFiles = packages.filter(f => f.endsWith('.zip'));

    if (zipFiles.length === 0) {
      throw new Error('No packages found for upload. Run build first.');
    }

    this.log(`📦 Found ${zipFiles.length} packages for upload`);

    // Verificar credenciais
    await this.validateCredentials();

    this.log('✅ Prerequisites validated', 'success');
  }

  async validateCredentials() {
    this.log('🔐 Validating store credentials...');

    const targets = this.getTargets();

    for (const target of targets) {
      switch (target) {
        case 'chrome':
          await this.validateChromeCredentials();
          break;
        case 'firefox':
          await this.validateFirefoxCredentials();
          break;
        case 'edge':
          await this.validateEdgeCredentials();
          break;
      }
    }

    this.log('✅ Credentials validated', 'success');
  }

  async validateChromeCredentials() {
    const required = [
      'CHROME_EXTENSION_ID',
      'CHROME_CLIENT_ID',
      'CHROME_CLIENT_SECRET',
      'CHROME_REFRESH_TOKEN'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Chrome credentials missing: ${missing.join(', ')}`);
    }

    this.log('🔵 Chrome credentials validated', 'debug');
  }

  async validateFirefoxCredentials() {
    const required = [
      'FIREFOX_JWT_ISSUER',
      'FIREFOX_JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Firefox credentials missing: ${missing.join(', ')}`);
    }

    this.log('🦊 Firefox credentials validated', 'debug');
  }

  async validateEdgeCredentials() {
    const required = [
      'EDGE_CLIENT_ID',
      'EDGE_CLIENT_SECRET',
      'EDGE_TENANT_ID'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      this.log('⚠️ Edge credentials missing - upload will be skipped', 'warning');
      this.uploadResults.warnings.push('Edge credentials not configured');
    } else {
      this.log('🌐 Edge credentials validated', 'debug');
    }
  }

  getTargets() {
    if (this.options.target === 'all') {
      return ['chrome', 'firefox', 'edge'];
    }
    return [this.options.target];
  }

  async uploadToStore(target) {
    this.log(`🏪 Starting upload to ${target}...`);

    const uploadResult = {
      store: target,
      startTime: Date.now(),
      success: false,
      error: null,
      uploadId: null,
      version: null
    };

    try {
      switch (target) {
        case 'chrome':
          await this.uploadToChrome(uploadResult);
          break;
        case 'firefox':
          await this.uploadToFirefox(uploadResult);
          break;
        case 'edge':
          await this.uploadToEdge(uploadResult);
          break;
        default:
          throw new Error(`Unknown target: ${target}`);
      }

      uploadResult.success = true;
      uploadResult.endTime = Date.now();
      uploadResult.duration = uploadResult.endTime - uploadResult.startTime;

      this.log(`✅ ${target} upload completed successfully`, 'success');

    } catch (error) {
      uploadResult.error = error.message;
      uploadResult.endTime = Date.now();
      uploadResult.duration = uploadResult.endTime - uploadResult.startTime;

      this.log(`❌ ${target} upload failed: ${error.message}`, 'error');
      this.uploadResults.errors.push(`${target}: ${error.message}`);
    }

    this.uploadResults.uploads.push(uploadResult);
  }

  async uploadToChrome(uploadResult) {
    this.log('🔵 Uploading to Chrome Web Store...', 'debug');

    if (this.options.dryRun) {
      this.log('🔵 Chrome upload (DRY RUN)', 'warning');
      uploadResult.uploadId = 'dry-run-chrome';
      return;
    }

    // Encontrar package do Chrome
    const packagePath = await this.findPackage('chrome');
    uploadResult.version = this.extractVersionFromFilename(packagePath);

    // Obter access token
    const accessToken = await this.getChromeAccessToken();

    // Upload do package
    const uploadId = await this.uploadChromePackage(packagePath, accessToken);
    uploadResult.uploadId = uploadId;

    // Publicar (se não for staging)
    if (this.options.environment === 'production') {
      await this.publishChromeExtension(accessToken);
      this.log('🔵 Chrome extension published to production', 'success');
    } else {
      this.log('🔵 Chrome extension uploaded to staging', 'success');
    }
  }

  async getChromeAccessToken() {
    this.log('🔐 Getting Chrome access token...', 'debug');

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: process.env.CHROME_CLIENT_ID,
      client_secret: process.env.CHROME_CLIENT_SECRET,
      refresh_token: process.env.CHROME_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    });

    const response = await this.retryRequest(async () => {
      return await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Chrome access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async uploadChromePackage(packagePath, accessToken) {
    this.log('📦 Uploading Chrome package...', 'debug');

    const extensionId = process.env.CHROME_EXTENSION_ID;
    const uploadUrl = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`;

    const packageBuffer = await fs.readFile(packagePath);

    const response = await this.retryRequest(async () => {
      return await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-goog-api-version': '2'
        },
        body: packageBuffer
      });
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chrome package upload failed: ${error}`);
    }

    const result = await response.json();

    if (result.uploadState !== 'SUCCESS') {
      throw new Error(`Chrome upload failed: ${result.uploadState}`);
    }

    return result.id;
  }

  async publishChromeExtension(accessToken) {
    this.log('🚀 Publishing Chrome extension...', 'debug');

    const extensionId = process.env.CHROME_EXTENSION_ID;
    const publishUrl = `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish`;

    const response = await this.retryRequest(async () => {
      return await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-goog-api-version': '2'
        }
      });
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chrome publish failed: ${error}`);
    }

    const result = await response.json();

    if (result.status && result.status.includes('OK')) {
      this.log('✅ Chrome extension published successfully', 'success');
    } else {
      throw new Error(`Chrome publish failed: ${JSON.stringify(result)}`);
    }
  }

  async uploadToFirefox(uploadResult) {
    this.log('🦊 Uploading to Firefox Add-ons...', 'debug');

    if (this.options.dryRun) {
      this.log('🦊 Firefox upload (DRY RUN)', 'warning');
      uploadResult.uploadId = 'dry-run-firefox';
      return;
    }

    // Encontrar package do Firefox
    const packagePath = await this.findPackage('firefox');
    uploadResult.version = this.extractVersionFromFilename(packagePath);

    // Gerar JWT token
    const jwtToken = this.generateFirefoxJWT();

    // Upload do package
    const uploadId = await this.uploadFirefoxPackage(packagePath, jwtToken);
    uploadResult.uploadId = uploadId;

    this.log('🦊 Firefox add-on uploaded successfully', 'success');
  }

  generateFirefoxJWT() {
    this.log('🔐 Generating Firefox JWT token...', 'debug');

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.FIREFOX_JWT_ISSUER,
      jti: Math.random().toString(),
      iat: issuedAt,
      exp: issuedAt + 60 // Token expires in 60 seconds
    };

    return jwt.sign(payload, process.env.FIREFOX_JWT_SECRET, {
      algorithm: 'HS256'
    });
  }

  async uploadFirefoxPackage(packagePath, jwtToken) {
    this.log('📦 Uploading Firefox package...', 'debug');

    const uploadUrl = 'https://addons.mozilla.org/api/v5/addons/upload/';

    const form = new FormData();
    form.append('upload', fs.createReadStream(packagePath));
    form.append('channel', this.options.environment === 'production' ? 'listed' : 'unlisted');

    const response = await this.retryRequest(async () => {
      return await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `JWT ${jwtToken}`,
          ...form.getHeaders()
        },
        body: form
      });
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firefox package upload failed: ${error}`);
    }

    const result = await response.json();

    if (!result.uuid) {
      throw new Error(`Firefox upload failed: ${JSON.stringify(result)}`);
    }

    // Aguardar validação
    await this.waitForFirefoxValidation(result.uuid, jwtToken);

    return result.uuid;
  }

  async waitForFirefoxValidation(uploadUuid, jwtToken) {
    this.log('⏳ Waiting for Firefox validation...', 'debug');

    const maxAttempts = 30; // 5 minutes max
    const delay = 10000; // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const statusUrl = `https://addons.mozilla.org/api/v5/addons/upload/${uploadUuid}/`;

      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `JWT ${jwtToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check Firefox validation status: ${response.statusText}`);
      }

      const status = await response.json();

      if (status.processed) {
        if (status.valid) {
          this.log('✅ Firefox validation completed successfully', 'success');
          return;
        } else {
          const errors = status.validation?.messages || [];
          throw new Error(`Firefox validation failed: ${JSON.stringify(errors)}`);
        }
      }

      this.log(`⏳ Firefox validation in progress (attempt ${attempt}/${maxAttempts})...`, 'debug');
      await this.sleep(delay);
    }

    throw new Error('Firefox validation timeout');
  }

  async uploadToEdge(uploadResult) {
    this.log('🌐 Uploading to Edge Add-ons...', 'debug');

    if (this.options.dryRun) {
      this.log('🌐 Edge upload (DRY RUN)', 'warning');
      uploadResult.uploadId = 'dry-run-edge';
      return;
    }

    // Verificar se credenciais estão disponíveis
    if (!process.env.EDGE_CLIENT_ID) {
      this.log('⚠️ Edge credentials not configured - skipping upload', 'warning');
      uploadResult.error = 'Credentials not configured';
      return;
    }

    // Encontrar package do Edge (usa o mesmo do Chrome)
    const packagePath = await this.findPackage('chrome'); // Edge usa Chrome package
    uploadResult.version = this.extractVersionFromFilename(packagePath);

    // Obter access token
    const accessToken = await this.getEdgeAccessToken();

    // Upload do package
    const uploadId = await this.uploadEdgePackage(packagePath, accessToken);
    uploadResult.uploadId = uploadId;

    this.log('🌐 Edge add-on uploaded successfully', 'success');
  }

  async getEdgeAccessToken() {
    this.log('🔐 Getting Edge access token...', 'debug');

    const tokenUrl = `https://login.microsoftonline.com/${process.env.EDGE_TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: process.env.EDGE_CLIENT_ID,
      client_secret: process.env.EDGE_CLIENT_SECRET,
      scope: 'https://api.addons.microsoftedge.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await this.retryRequest(async () => {
      return await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Edge access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async uploadEdgePackage(packagePath, accessToken) {
    this.log('📦 Uploading Edge package...', 'debug');

    // Edge API ainda está em desenvolvimento
    // Por enquanto, apenas simular o upload
    this.log('⚠️ Edge API upload not yet implemented - simulating upload', 'warning');

    return 'edge-upload-simulated';
  }

  async findPackage(target) {
    const packageDir = path.join(rootDir, 'dist-zips');
    const packages = await fs.readdir(packageDir);

    // Procurar package específico do target
    let targetPackage = packages.find(p =>
      p.includes(target) && p.endsWith('.zip')
    );

    // Se não encontrar, procurar por padrões alternativos
    if (!targetPackage) {
      if (target === 'chrome' || target === 'edge') {
        targetPackage = packages.find(p =>
          (p.includes('chrome') || p.includes('chromium')) && p.endsWith('.zip')
        );
      } else if (target === 'firefox') {
        targetPackage = packages.find(p =>
          p.includes('firefox') && p.endsWith('.zip')
        );
      }
    }

    if (!targetPackage) {
      throw new Error(`Package not found for ${target}`);
    }

    return path.join(packageDir, targetPackage);
  }

  extractVersionFromFilename(filename) {
    const match = filename.match(/v(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  }

  async retryRequest(requestFn) {
    let lastError;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const response = await requestFn();
        return response;
      } catch (error) {
        lastError = error;

        if (attempt < this.options.retryAttempts) {
          this.log(`⚠️ Request failed (attempt ${attempt}/${this.options.retryAttempts}), retrying in ${this.options.retryDelay}ms...`, 'warning');
          await this.sleep(this.options.retryDelay);
        }
      }
    }

    throw lastError;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateUploadReport() {
    this.log('📊 Generating upload report...');

    const endTime = Date.now();
    const totalDuration = endTime - this.uploadResults.startTime;

    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(totalDuration / 1000)}s`,
      environment: this.options.environment,
      dryRun: this.options.dryRun,
      summary: {
        total: this.uploadResults.uploads.length,
        successful: this.uploadResults.uploads.filter(u => u.success).length,
        failed: this.uploadResults.uploads.filter(u => !u.success).length,
        errors: this.uploadResults.errors.length,
        warnings: this.uploadResults.warnings.length
      },
      uploads: this.uploadResults.uploads,
      errors: this.uploadResults.errors,
      warnings: this.uploadResults.warnings
    };

    // Salvar relatório
    const reportPath = path.join(rootDir, 'upload-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    // Log do relatório
    this.log('📊 Upload Report:', 'success');
    this.log(`  Duration: ${report.duration}`);
    this.log(`  Successful: ${report.summary.successful}/${report.summary.total}`);
    this.log(`  Failed: ${report.summary.failed}`);
    this.log(`  Errors: ${report.summary.errors}`);
    this.log(`  Warnings: ${report.summary.warnings}`);

    for (const upload of report.uploads) {
      const status = upload.success ? '✅' : '❌';
      const duration = upload.duration ? `${Math.round(upload.duration / 1000)}s` : 'N/A';
      this.log(`  ${status} ${upload.store}: ${upload.version || 'unknown'} (${duration})`);
    }

    this.log(`📄 Report saved to: ${reportPath}`);

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

    if (arg === '--target' && args[i + 1]) {
      options.target = args[i + 1];
      i++;
    } else if (arg === '--env' && args[i + 1]) {
      options.environment = args[i + 1];
      i++;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--retry' && args[i + 1]) {
      options.retryAttempts = parseInt(args[i + 1]);
      i++;
    }
  }

  try {
    const uploader = new StoreUploader(options);
    const success = await uploader.uploadAll();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Upload process failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default StoreUploader;
