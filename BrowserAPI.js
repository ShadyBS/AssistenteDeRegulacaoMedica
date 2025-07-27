/**
 * @file BrowserAPI - Módulo utilitário centralizado para seleção da API do browser
 * Resolve a duplicação de código para seleção entre browser (Firefox) e chrome (Chromium)
 */

/**
 * Seleciona a API apropriada do browser baseada no ambiente e retorna o objeto e o nome.
 * @returns {{api: object, name: string}} Objeto contendo a API do browser e seu nome
 */
function getBrowserAPI() {
  // ✅ SEGURANÇA: Verificação mais robusta de APIs
  
  // Verifica globalThis primeiro (mais moderno e seguro)
  if (typeof globalThis !== 'undefined') {
    if (globalThis.browser && globalThis.browser.runtime) {
      return { api: globalThis.browser, name: 'Firefox' };
    }
    if (globalThis.chrome && globalThis.chrome.runtime) {
      return { api: globalThis.chrome, name: 'Chromium' };
    }
  }
  
  // Fallback para verificação direta (compatibilidade)
  if (typeof browser !== "undefined" && browser.runtime) {
    return { api: browser, name: 'Firefox' };
  }
  
  if (typeof chrome !== "undefined" && chrome.runtime) {
    return { api: chrome, name: 'Chromium' };
  }
  
  // Fallback para window (contextos específicos)
  if (typeof window !== 'undefined') {
    if (window.browser && window.browser.runtime) {
      return { api: window.browser, name: 'Firefox' };
    }
    if (window.chrome && window.chrome.runtime) {
      return { api: window.chrome, name: 'Chromium' };
    }
  }
  
  // Se nenhuma API estiver disponível, lança erro detalhado
  throw new Error("Nenhuma API de browser extension disponível. Verifique se está executando em contexto de extensão.");
}

/**
 * Instância singleton com informações da API do browser
 * @type {{api: object, name: string} | null}
 */
let browserAPIInfo = null;

/**
 * Inicializa e obtém as informações da API do browser
 * @returns {{api: object, name: string}}
 */
function getBrowserAPIInfoInternal() {
  if (!browserAPIInfo) {
    browserAPIInfo = getBrowserAPI();
    console.log(`[BrowserAPI] API inicializada: ${browserAPIInfo.name}`);
  }
  return browserAPIInfo;
}

/**
 * Obtém a instância singleton da API do browser
 * @returns {object} API do browser
 */
export function getBrowserAPIInstance() {
  return getBrowserAPIInfoInternal().api;
}

/**
 * Verifica se estamos executando no Firefox
 * @returns {boolean} true se for Firefox
 */
export function isFirefox() {
  return getBrowserAPIInfoInternal().name === 'Firefox';
}

/**
 * Verifica se estamos executando em browser baseado em Chromium
 * @returns {boolean} true se for Chromium
 */
export function isChromium() {
  return getBrowserAPIInfoInternal().name === 'Chromium';
}

/**
 * Obtém informações sobre o ambiente do browser
 * @returns {object} Informações do ambiente
 */
export function getBrowserInfo() {
  const api = getBrowserAPIInstance();
  const ff = isFirefox();
  return {
    isFirefox: ff,
    isChromium: !ff,
    hasManifestV3: api.runtime?.getManifest?.()?.manifest_version === 3,
    browserName: ff ? 'Firefox' : 'Chromium',
    apiObject: ff ? 'browser' : 'chrome'
  };
}

/**
 * Wrapper para métodos comuns da API do browser com tratamento de erros
 */
export class BrowserAPIWrapper {
  constructor() {
    this.api = getBrowserAPIInstance();
  }

  /**
   * Acesso direto à API do browser
   * @returns {object} API do browser
   */
  get raw() {
    return this.api;
  }

  /**
   * Wrapper para storage.local
   * @returns {object} API de storage local
   */
  get storageLocal() {
    return this.api.storage.local;
  }

  /**
   * Wrapper para storage.sync
   * @returns {object} API de storage sync
   */
  get storageSync() {
    return this.api.storage.sync;
  }

  /**
   * Wrapper para runtime
   * @returns {object} API de runtime
   */
  get runtime() {
    return this.api.runtime;
  }

  /**
   * Wrapper para tabs
   * @returns {object} API de tabs
   */
  get tabs() {
    return this.api.tabs;
  }

  /**
   * Wrapper para alarms
   * @returns {object} API de alarms
   */
  get alarms() {
    return this.api.alarms;
  }

  /**
   * Obtém informações do manifest
   * @returns {object} Dados do manifest
   */
  getManifest() {
    return this.api.runtime.getManifest();
  }

  /**
   * Verifica se uma permissão está concedida
   * @param {string} permission - Nome da permissão
   * @returns {Promise<boolean>} true se a permissão estiver concedida
   */
  async hasPermission(permission) {
    try {
      return await this.api.permissions.contains({ permissions: [permission] });
    } catch (error) {
      console.warn(`[BrowserAPI] Erro ao verificar permissão ${permission}:`, error);
      return false;
    }
  }

  /**
   * Solicita uma permissão
   * @param {string} permission - Nome da permissão
   * @returns {Promise<boolean>} true se a permissão foi concedida
   */
  async requestPermission(permission) {
    try {
      return await this.api.permissions.request({ permissions: [permission] });
    } catch (error) {
      console.error(`[BrowserAPI] Erro ao solicitar permissão ${permission}:`, error);
      return false;
    }
  }
}

// Instância singleton do wrapper
let wrapperInstance = null;

/**
 * Obtém a instância singleton do wrapper da API
 * @returns {BrowserAPIWrapper} Instância do wrapper
 */
export function getBrowserAPIWrapper() {
  if (!wrapperInstance) {
    wrapperInstance = new BrowserAPIWrapper();
  }
  return wrapperInstance;
}

// Exporta a instância da API como padrão para compatibilidade
export default getBrowserAPIInstance();

// Log de inicialização
console.log('[BrowserAPI] Módulo carregado -', getBrowserInfo());
