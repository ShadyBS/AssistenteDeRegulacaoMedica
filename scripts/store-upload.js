#!/usr/bin/env node

/**
 * Store Upload Script - Assistente de Regulação Médica
 * 
 * Script para upload automático para Chrome Web Store e Firefox Add-ons
 * Suporta upload, atualização e publicação de extensões
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configurações do projeto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_ZIPS_DIR = path.join(PROJECT_ROOT, 'dist-zips');

// Configurações das stores
const STORE_CONFIGS = {
  chrome: {
    name: 'Chrome Web Store',
    apiUrl: 'https://www.googleapis.com/chromewebstore/v1.1',
    requiredEnvVars: ['CHROME_EXTENSION_ID', 'CHROME_CLIENT_ID', 'CHROME_CLIENT_SECRET', 'CHROME_REFRESH_TOKEN'],
    zipPattern: /AssistenteDeRegulacao-chrome-v.*\.zip$/,
    description: 'Chrome/Edge/Chromium'
  },
  firefox: {
    name: 'Firefox Add-ons',
    apiUrl: 'https://addons.mozilla.org/api/v5',
    requiredEnvVars: ['FIREFOX_JWT_ISSUER', 'FIREFOX_JWT_SECRET'],
    zipPattern: /AssistenteDeRegulacao-firefox-v.*\.zip$/,
    description: 'Firefox/Mozilla'
  }
};

/**
 * Classe para gerenciar uploads para stores
 */
class StoreUploader {
  constructor(options = {}) {
    this.target = options.target;
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.autoPublish = options.autoPublish || false;
    this.skipValidation = options.skipValidation || false;
    
    if (!this.target || !STORE_CONFIGS[this.target]) {
      throw new Error(`Target inválido: ${this.target}. Use: ${Object.keys(STORE_CONFIGS).join(', ')}`);
    }
    
    this.config = STORE_CONFIGS[this.target];
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
   * Valida variáveis de ambiente necessárias
   */
  validateEnvironment() {
    this.log(`🔍 Validando ambiente para ${this.config.name}...`);
    
    const missing = this.config.requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias não encontradas para ${this.target}:\n` +
        missing.map(v => `  - ${v}`).join('\n') + '\n\n' +
        'Configure essas variáveis no arquivo .env ou como variáveis de ambiente.'
      );
    }
    
    this.log(`   ✓ Todas as variáveis de ambiente estão configuradas`, 'success');
  }

  /**
   * Encontra o arquivo ZIP mais recente para o target
   */
  async findLatestZip() {
    this.log(`📦 Procurando ZIP para ${this.target}...`);
    
    if (!await fs.pathExists(DIST_ZIPS_DIR)) {
      throw new Error(`Diretório de ZIPs não encontrado: ${DIST_ZIPS_DIR}`);
    }
    
    const files = await fs.readdir(DIST_ZIPS_DIR);
    const zipFiles = files.filter(file => this.config.zipPattern.test(file));
    
    if (zipFiles.length === 0) {
      throw new Error(
        `Nenhum ZIP encontrado para ${this.target}. ` +
        `Execute 'npm run build:all' primeiro.`
      );
    }
    
    // Ordena por data de modificação (mais recente primeiro)
    const zipStats = await Promise.all(
      zipFiles.map(async file => ({
        file,
        stats: await fs.stat(path.join(DIST_ZIPS_DIR, file))
      }))
    );
    
    zipStats.sort((a, b) => b.stats.mtime - a.stats.mtime);
    const latestZip = zipStats[0].file;
    const zipPath = path.join(DIST_ZIPS_DIR, latestZip);
    
    this.log(`   ✓ ZIP encontrado: ${latestZip}`, 'success');
    
    return zipPath;
  }

  /**
   * Extrai versão do nome do arquivo ZIP
   */
  extractVersionFromZip(zipPath) {
    const fileName = path.basename(zipPath);
    const versionMatch = fileName.match(/v(\d+\.\d+\.\d+)/);
    
    if (!versionMatch) {
      throw new Error(`Não foi possível extrair versão do arquivo: ${fileName}`);
    }
    
    return versionMatch[1];
  }

  /**
   * Valida ZIP antes do upload
   */
  async validateZip(zipPath) {
    if (this.skipValidation) {
      this.log('⚡ Pulando validação do ZIP (--skip-validation)');
      return;
    }
    
    this.log(`🔍 Validando ZIP: ${path.basename(zipPath)}...`);
    
    // Verifica se o arquivo existe e tem tamanho válido
    const stats = await fs.stat(zipPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    this.log(`   📊 Tamanho: ${sizeMB} MB`);
    
    // Limites de tamanho por store
    const maxSizes = {
      chrome: 128, // 128 MB para Chrome Web Store
      firefox: 200 // 200 MB para Firefox Add-ons
    };
    
    if (stats.size > maxSizes[this.target] * 1024 * 1024) {
      throw new Error(
        `ZIP muito grande para ${this.config.name}: ${sizeMB} MB ` +
        `(máximo: ${maxSizes[this.target]} MB)`
      );
    }
    
    // Validação básica do conteúdo (se possível)
    try {
      // Aqui poderia adicionar validação do conteúdo do ZIP
      // Por exemplo, verificar se manifest.json existe
      this.log(`   ✓ ZIP validado`, 'success');
    } catch (error) {
      this.log(`   ⚠️  Aviso na validação: ${error.message}`, 'warn');
    }
  }

  /**
   * Obtém token de acesso para Chrome Web Store
   */
  async getChromeAccessToken() {
    const { CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN } = process.env;
    
    this.log('🔑 Obtendo token de acesso para Chrome Web Store...');
    
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: CHROME_CLIENT_ID,
      client_secret: CHROME_CLIENT_SECRET,
      refresh_token: CHROME_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    });
    
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha na autenticação: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('Token de acesso não recebido');
      }
      
      this.log('   ✓ Token obtido com sucesso', 'success');
      return data.access_token;
      
    } catch (error) {
      throw new Error(`Erro ao obter token Chrome: ${error.message}`);
    }
  }

  /**
   * Gera JWT para Firefox Add-ons
   */
  generateFirefoxJWT() {
    const { FIREFOX_JWT_ISSUER, FIREFOX_JWT_SECRET } = process.env;
    
    this.log('🔑 Gerando JWT para Firefox Add-ons...');
    
    try {
      // Implementação básica de JWT (em produção, use uma biblioteca como 'jsonwebtoken')
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };
      
      const payload = {
        iss: FIREFOX_JWT_ISSUER,
        jti: Math.random().toString(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutos
      };
      
      const crypto = require('crypto');
      
      const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      
      const signature = crypto
        .createHmac('sha256', FIREFOX_JWT_SECRET)
        .update(`${base64Header}.${base64Payload}`)
        .digest('base64url');
      
      const jwt = `${base64Header}.${base64Payload}.${signature}`;
      
      this.log('   ✓ JWT gerado com sucesso', 'success');
      return jwt;
      
    } catch (error) {
      throw new Error(`Erro ao gerar JWT Firefox: ${error.message}`);
    }
  }

  /**
   * Upload para Chrome Web Store
   */
  async uploadToChrome(zipPath, version) {
    const accessToken = await this.getChromeAccessToken();
    const extensionId = process.env.CHROME_EXTENSION_ID;
    
    this.log(`🚀 Fazendo upload para Chrome Web Store...`);
    
    if (this.dryRun) {
      this.log(`Faria upload de ${path.basename(zipPath)} para Chrome Web Store`, 'dry');
      return { success: true, dryRun: true };
    }
    
    try {
      // Lê o arquivo ZIP
      const zipBuffer = await fs.readFile(zipPath);
      
      // Upload do ZIP
      const uploadUrl = `${this.config.apiUrl}/items/${extensionId}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-goog-api-version': '2'
        },
        body: zipBuffer
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload falhou: ${uploadResponse.status} ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      this.log(`   ✓ Upload concluído`, 'success');
      
      // Publicação (se solicitada)
      if (this.autoPublish) {
        await this.publishOnChrome(extensionId, accessToken);
      }
      
      return {
        success: true,
        uploadResult,
        published: this.autoPublish
      };
      
    } catch (error) {
      throw new Error(`Erro no upload para Chrome: ${error.message}`);
    }
  }

  /**
   * Publica no Chrome Web Store
   */
  async publishOnChrome(extensionId, accessToken) {
    this.log(`📢 Publicando no Chrome Web Store...`);
    
    const publishUrl = `${this.config.apiUrl}/items/${extensionId}/publish`;
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-api-version': '2'
      }
    });
    
    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Publicação falhou: ${publishResponse.status} ${errorText}`);
    }
    
    this.log(`   ✓ Publicação iniciada`, 'success');
  }

  /**
   * Upload para Firefox Add-ons
   */
  async uploadToFirefox(zipPath, version) {
    const jwt = this.generateFirefoxJWT();
    
    this.log(`🚀 Fazendo upload para Firefox Add-ons...`);
    
    if (this.dryRun) {
      this.log(`Faria upload de ${path.basename(zipPath)} para Firefox Add-ons`, 'dry');
      return { success: true, dryRun: true };
    }
    
    try {
      // Implementação do upload para Firefox
      // Nota: A API do Firefox Add-ons é mais complexa e requer
      // diferentes endpoints dependendo se é uma nova extensão ou atualização
      
      this.log(`   ⚠️  Upload para Firefox Add-ons requer implementação específica`, 'warn');
      this.log(`   📋 Passos manuais necessários:`, 'warn');
      this.log(`      1. Acesse https://addons.mozilla.org/developers/`);
      this.log(`      2. Faça login com sua conta de desenvolvedor`);
      this.log(`      3. Navegue até sua extensão`);
      this.log(`      4. Faça upload do arquivo: ${path.basename(zipPath)}`);
      
      return {
        success: true,
        manual: true,
        zipPath: zipPath
      };
      
    } catch (error) {
      throw new Error(`Erro no upload para Firefox: ${error.message}`);
    }
  }

  /**
   * Executa upload para a store especificada
   */
  async upload() {
    const startTime = Date.now();
    
    try {
      this.log(`🚀 Iniciando upload para ${this.config.name}...`);
      
      // Validações iniciais
      this.validateEnvironment();
      
      // Encontra ZIP mais recente
      const zipPath = await this.findLatestZip();
      const version = this.extractVersionFromZip(zipPath);
      
      this.log(`📋 Versão detectada: ${version}`);
      
      // Valida ZIP
      await this.validateZip(zipPath);
      
      // Upload específico por target
      let result;
      
      if (this.target === 'chrome') {
        result = await this.uploadToChrome(zipPath, version);
      } else if (this.target === 'firefox') {
        result = await this.uploadToFirefox(zipPath, version);
      }
      
      // Resumo final
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.log(`\n🎉 Upload concluído!`, 'success');
      this.log(`   ⏱️  Tempo: ${duration}s`);
      this.log(`   🎯 Target: ${this.config.name}`);
      this.log(`   📦 Arquivo: ${path.basename(zipPath)}`);
      this.log(`   🔢 Versão: ${version}`);
      
      if (result.dryRun) {
        this.log(`   🔍 Modo DRY-RUN - nenhum upload foi feito`);
      } else if (result.manual) {
        this.log(`   📋 Upload manual necessário`);
      } else {
        this.log(`   ✅ Upload automático concluído`);
        
        if (result.published) {
          this.log(`   📢 Publicação iniciada`);
        }
      }
      
      return result;
      
    } catch (error) {
      this.log(`Upload falhou: ${error.message}`, 'error');
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
    target: null,
    dryRun: false,
    verbose: false,
    autoPublish: false,
    skipValidation: false
  };
  
  // Parse argumentos
  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      options.target = arg.split('=')[1];
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--auto-publish') {
      options.autoPublish = true;
    } else if (arg === '--skip-validation') {
      options.skipValidation = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node scripts/store-upload.js --target=<store> [opções]

Targets:
  chrome      Upload para Chrome Web Store
  firefox     Upload para Firefox Add-ons

Opções:
  --dry-run, -d       Simula o upload sem enviar
  --verbose, -v       Output detalhado
  --auto-publish      Publica automaticamente após upload (Chrome apenas)
  --skip-validation   Pula validação do ZIP
  --help, -h          Mostra esta ajuda

Variáveis de Ambiente Necessárias:

Chrome Web Store:
  CHROME_EXTENSION_ID     ID da extensão no Chrome Web Store
  CHROME_CLIENT_ID        Client ID da API do Google
  CHROME_CLIENT_SECRET    Client Secret da API do Google
  CHROME_REFRESH_TOKEN    Refresh Token OAuth2

Firefox Add-ons:
  FIREFOX_JWT_ISSUER      JWT Issuer (API Key)
  FIREFOX_JWT_SECRET      JWT Secret

Exemplos:
  node scripts/store-upload.js --target=chrome
  node scripts/store-upload.js --target=firefox --dry-run
  node scripts/store-upload.js --target=chrome --auto-publish
`);
      process.exit(0);
    }
  }
  
  if (!options.target) {
    console.error('❌ Target obrigatório. Use --target=chrome ou --target=firefox');
    console.error('   Execute --help para mais informações');
    process.exit(1);
  }
  
  try {
    const uploader = new StoreUploader(options);
    await uploader.upload();
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Upload falhou:', error.message);
    process.exit(1);
  }
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { StoreUploader, STORE_CONFIGS };