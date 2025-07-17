/**
 * @file BrowserAPI - Módulo utilitário centralizado para seleção da API do browser
 * Resolve a duplicação de código para seleção entre browser (Firefox) e chrome (Chromium)
 */

/**
 * Seleciona a API apropriada do browser baseada no ambiente
 * Firefox usa 'browser', Chromium usa 'chrome'
 * @returns {object} API do browser (browser ou chrome)
 */
function getBrowserAPI() {
  // Verifica se a API 'browser' está disponível (Firefox/WebExtensions padrão)
  if (typeof browser !== "undefined") {
    return browser;
  }
  
  // Fallback para 'chrome' (Chromium-based browsers)
  if (typeof chrome !== "undefined") {
    return chrome;
  }
  
  // Se nenhuma API estiver disponível, lança erro
  throw new Error("Nenhuma API de browser extension disponível (browser ou chrome)");
}

/**
 * Instância singleton da API do browser
 * Evita múltiplas verificações desnecessárias
 */
let browserAPIInstance = null;

/**
 * Obtém a instância singleton da API do browser
 * @returns {object} API do browser
 */
export function getBrowserAPIInstance() {
  if (!browserAPIInstance) {
    browserAPIInstance = getBrowserAPI();
    console.log('[BrowserAPI] API inicializada:', browserAPIInstance === browser ? 'Firefox (browser)' : 'Chromium (chrome)');
  }
  return browserAPIInstance;
}

/**
 * Verifica se estamos executando no Firefox
 * @returns {boolean} true se for Firefox
 */
export function isFirefox() {
  return typeof browser !== "undefined";
}

/**
 * Verifica se estamos executando em browser baseado em Chromium
 * @returns {boolean} true se for Chromium
 */
export function isChromium() {
  return typeof chrome !== "undefined" && typeof browser === "undefined";
}

/**
 * Obtém informações sobre o ambiente do browser
 * @returns {object} Informações do ambiente
 */
export function getBrowserInfo() {
  const api = getBrowserAPIInstance();
  return {
    isFirefox: isFirefox(),
    isChromium: isChromium(),
    hasManifestV3: api.runtime?.getManifest?.()?.manifest_version === 3,
    browserName: isFirefox() ? 'Firefox' : 'Chromium',
    apiObject: isFirefox() ? 'browser' : 'chrome'
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