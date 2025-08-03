/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 322:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FF: () => (/* binding */ logWarning),
/* harmony export */   L9: () => (/* binding */ getErrorHandler),
/* harmony export */   Uu: () => (/* binding */ ERROR_CATEGORIES),
/* harmony export */   fH: () => (/* binding */ logInfo),
/* harmony export */   vV: () => (/* binding */ logError)
/* harmony export */ });
/* unused harmony exports ERROR_LEVELS, ErrorHandler, MedicalErrorHandler, logFatal, logDebug, sanitizeForLog */
/**
 * 🏥 ASSISTENTE DE REGULAÇÃO MÉDICA - ERROR HANDLER CENTRALIZADO
 *
 * 🔒 ATENÇÃO: Este módulo lida com dados médicos sensíveis
 * 📋 Compliance: LGPD, HIPAA, Lei Geral de Proteção de Dados
 * 🚨 NUNCA logar: CPF, CNS, nomes completos, dados demográficos
 */

/**
 * Níveis de severidade para logging médico
 */
const ERROR_LEVELS = {
  TRACE: 0,
  // Debugging detalhado (apenas dev)
  DEBUG: 1,
  // Informações de debug (apenas dev)
  INFO: 2,
  // Informações gerais (produção OK)
  WARN: 3,
  // Avisos (produção OK)
  ERROR: 4,
  // Erros (produção OK)
  FATAL: 5 // Erros críticos (produção OK)
};

/**
 * Categorias de erro específicas para ambiente médico
 */
const ERROR_CATEGORIES = {
  // APIs médicas
  SIGSS_API: 'sigss_api',
  CADSUS_API: 'cadsus_api',
  MEDICAL_DATA: 'medical_data',
  // Extensão
  EXTENSION_LIFECYCLE: 'extension_lifecycle',
  CONTENT_SCRIPT: 'content_script',
  BACKGROUND_SCRIPT: 'background_script',
  // Segurança
  SECURITY: 'security',
  PERMISSIONS: 'permissions',
  CSP_VIOLATION: 'csp_violation',
  // Performance
  MEMORY: 'memory',
  STORAGE: 'storage',
  NETWORK: 'network',
  // UI/UX
  USER_INTERFACE: 'user_interface',
  USER_INPUT: 'user_input'
};

/**
 * Campos médicos sensíveis que NUNCA devem ser logados
 */
const SENSITIVE_MEDICAL_FIELDS = [
// Identificação pessoal
'cpf', 'rg', 'cns', 'cartao_sus', 'nome', 'nome_completo', 'nome_mae', 'nome_pai',
// Dados demográficos
'data_nascimento', 'idade', 'sexo', 'genero', 'endereco', 'rua', 'numero', 'bairro', 'cidade', 'cep', 'telefone', 'celular', 'email',
// Dados médicos específicos
'diagnostico', 'cid', 'procedimento', 'medicamento', 'dosagem', 'tratamento',
// Tokens e IDs sensíveis (alguns são OK para log)
'senha', 'password', 'token_acesso'];

/**
 * Campos OK para logging (IDs técnicos necessários para debug)
 */
const LOGGABLE_TECHNICAL_FIELDS = ['id', 'uuid', 'reguId', 'reguIdp', 'reguIds', 'isenPK', 'isenFullPKCrypto', 'sessionId', 'requestId', 'transactionId', 'correlationId'];

/**
 * Configurações do ErrorHandler baseadas no ambiente
 */
const getConfig = () => {
  let isDevelopment = false;
  try {
    // Detectar ambiente de desenvolvimento baseado na versão da extensão
    isDevelopment = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest && chrome.runtime.getManifest().version.includes('dev');
  } catch {
    // Fallback para produção se não conseguir acessar manifest
    isDevelopment = false;
  }
  return {
    // Nível mínimo para logging
    minLevel: isDevelopment ? ERROR_LEVELS.DEBUG : ERROR_LEVELS.INFO,
    // Habilitar console.log em produção (com sanitização)
    enableConsoleLogging: true,
    // Habilitar storage de errors críticos
    enableErrorStorage: true,
    // Máximo de errors no storage (rotação)
    maxStoredErrors: 100,
    // Habilitar stack traces (apenas dev)
    enableStackTraces: isDevelopment,
    // Habilitar timing de performance
    enablePerformanceTiming: true
  };
};

/**
 * Classe principal do ErrorHandler
 */
class MedicalErrorHandler {
  constructor() {
    this.config = getConfig();
    this.errorObservers = [];
    this.performanceMarks = new Map();
    this.initializeErrorStorage();
    this.setupGlobalErrorHandling();
  }

  /**
   * Inicializa storage para errors críticos
   */
  async initializeErrorStorage() {
    if (!this.config.enableErrorStorage) return;
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.local.get('medicalErrors');
      if (!result.medicalErrors) {
        await api.storage.local.set({
          medicalErrors: []
        });
      }
    } catch (error) {
      // Fallback silencioso se storage não estiver disponível
      console.warn('[ErrorHandler] Storage não disponível:', error.message);
    }
  }

  /**
   * Configura captura global de errors não tratados
   */
  setupGlobalErrorHandling() {
    // Captura errors de JavaScript não tratados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        this.logError('Erro JavaScript não tratado', {
          message: event.message,
          filename: this.sanitizeFilename(event.filename),
          lineno: event.lineno,
          colno: event.colno
        }, ERROR_CATEGORIES.EXTENSION_LIFECYCLE);
      });

      // Captura promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', event => {
        var _event$reason;
        this.logError('Promise rejeitada não tratada', {
          reason: ((_event$reason = event.reason) === null || _event$reason === void 0 ? void 0 : _event$reason.message) || 'Unknown error'
        }, ERROR_CATEGORIES.EXTENSION_LIFECYCLE);
      });
    }

    // Captura violations de CSP
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', event => {
        this.logError('Violação de CSP detectada', {
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          disposition: event.disposition
        }, ERROR_CATEGORIES.CSP_VIOLATION);
      });
    }
  }

  /**
   * Sanitiza dados médicos para logging seguro
   * @param {any} data - Dados a serem sanitizados
   * @param {string} strategy - Estratégia de sanitização
   * @returns {any} Dados sanitizados
   */
  sanitizeForLogging(data, strategy = 'MEDICAL_DATA') {
    if (data === null || data === undefined) return data;

    // Primitivos são safe (numbers, booleans, strings simples)
    if (typeof data !== 'object') {
      return typeof data === 'string' && data.length > 100 ? `${data.substring(0, 100)}...` : data;
    }

    // Arrays
    if (Array.isArray(data)) {
      return data.length > 5 ? [...data.slice(0, 5).map(item => this.sanitizeForLogging(item, strategy)), `...${data.length - 5} more items`] : data.map(item => this.sanitizeForLogging(item, strategy));
    }

    // Objects
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Verificar se o campo é sensível
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[SANITIZED_MEDICAL_DATA]';
        continue;
      }

      // Campos técnicos OK para logging
      if (LOGGABLE_TECHNICAL_FIELDS.includes(key)) {
        sanitized[key] = value;
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value, strategy);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Verifica se um campo é sensível para logging
   * @param {string} fieldName - Nome do campo
   * @returns {boolean} Se o campo é sensível
   */
  isSensitiveField(fieldName) {
    const lowerField = fieldName.toLowerCase();
    return SENSITIVE_MEDICAL_FIELDS.some(sensitiveField => lowerField.includes(sensitiveField.toLowerCase()));
  }

  /**
   * Sanitiza filename para remover informações sensíveis do path
   * @param {string} filename - Nome do arquivo
   * @returns {string} Filename sanitizado
   */
  sanitizeFilename(filename) {
    if (!filename) return 'unknown';

    // Remove paths absolutos, mantém apenas o nome do arquivo
    const parts = filename.split(/[/\\]/);
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Log de informações gerais (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do log
   */
  logInfo(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.INFO, message, data, category);
  }

  /**
   * Log de warnings (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do warning
   */
  logWarning(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.WARN, message, data, category);
  }

  /**
   * Log de errors (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do erro
   */
  logError(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.ERROR, message, data, category);
  }

  /**
   * Log de errors críticos (safe para produção)
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do erro crítico
   */
  logFatal(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.FATAL, message, data, category);
  }

  /**
   * Log apenas para desenvolvimento
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria do debug
   */
  logDebug(message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    this.log(ERROR_LEVELS.DEBUG, message, data, category);
  }

  /**
   * Método principal de logging com sanitização automática
   * @param {number} level - Nível do log
   * @param {string} message - Mensagem
   * @param {any} data - Dados adicionais
   * @param {string} category - Categoria
   */
  log(level, message, data = null, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    // Verificar nível mínimo
    if (level < this.config.minLevel) return;

    // Sanitizar dados automaticamente
    const sanitizedData = data ? this.sanitizeForLogging(data) : null;

    // Criar entrada de log
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      category,
      message,
      data: sanitizedData,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      extensionVersion: this.getExtensionVersion()
    };

    // Adicionar stack trace apenas em desenvolvimento
    if (this.config.enableStackTraces && level >= ERROR_LEVELS.ERROR) {
      logEntry.stack = new Error().stack;
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.outputToConsole(level, logEntry);
    }

    // Storage de errors críticos
    if (this.config.enableErrorStorage && level >= ERROR_LEVELS.ERROR) {
      this.storeError(logEntry);
    }

    // Notificar observers
    this.notifyObservers(logEntry);
  }

  /**
   * Output para console com formatação adequada
   * @param {number} level - Nível do log
   * @param {object} logEntry - Entrada de log
   */
  outputToConsole(level, logEntry) {
    const prefix = `[Assistente Médico ${logEntry.category}]`;
    const message = `${prefix} ${logEntry.message}`;
    switch (level) {
      case ERROR_LEVELS.TRACE:
      case ERROR_LEVELS.DEBUG:
        console.debug(message, logEntry.data);
        break;
      case ERROR_LEVELS.INFO:
        console.info(message, logEntry.data);
        break;
      case ERROR_LEVELS.WARN:
        console.warn(message, logEntry.data);
        break;
      case ERROR_LEVELS.ERROR:
        console.error(message, logEntry.data);
        break;
      case ERROR_LEVELS.FATAL:
        console.error(`🚨 FATAL: ${message}`, logEntry.data);
        break;
    }
  }

  /**
   * Armazena errors críticos para análise posterior
   * @param {object} logEntry - Entrada de log
   */
  async storeError(logEntry) {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.local.get('medicalErrors');
      let errors = result.medicalErrors || [];

      // Adicionar novo erro
      errors.unshift(logEntry);

      // Manter apenas os últimos N errors (rotação)
      if (errors.length > this.config.maxStoredErrors) {
        errors = errors.slice(0, this.config.maxStoredErrors);
      }
      await api.storage.local.set({
        medicalErrors: errors
      });
    } catch (error) {
      // Fallback silencioso
      console.warn('[ErrorHandler] Falha ao armazenar erro:', error.message);
    }
  }

  /**
   * Notifica observers de novos logs
   * @param {object} logEntry - Entrada de log
   */
  notifyObservers(logEntry) {
    this.errorObservers.forEach(observer => {
      try {
        observer(logEntry);
      } catch (error) {
        // Evitar loops infinitos de error
        console.warn('[ErrorHandler] Observer error:', error.message);
      }
    });
  }

  /**
   * Registra observer para logs
   * @param {Function} callback - Callback do observer
   */
  subscribe(callback) {
    this.errorObservers.push(callback);
  }

  /**
   * Remove observer
   * @param {Function} callback - Callback para remover
   */
  unsubscribe(callback) {
    const index = this.errorObservers.indexOf(callback);
    if (index > -1) {
      this.errorObservers.splice(index, 1);
    }
  }

  /**
   * Inicia marcação de performance
   * @param {string} name - Nome da operação
   */
  startPerformanceMark(name) {
    if (!this.config.enablePerformanceTiming) return;
    this.performanceMarks.set(name, Date.now());
  }

  /**
   * Finaliza marcação de performance
   * @param {string} name - Nome da operação
   * @param {string} category - Categoria do log
   */
  endPerformanceMark(name, category = ERROR_CATEGORIES.EXTENSION_LIFECYCLE) {
    if (!this.config.enablePerformanceTiming) return;
    const startTime = this.performanceMarks.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logInfo(`Performance: ${name} took ${duration}ms`, {
        duration
      }, category);
      this.performanceMarks.delete(name);
    }
  }

  /**
   * Obtém nome do nível
   * @param {number} level - Nível
   * @returns {string} Nome do nível
   */
  getLevelName(level) {
    const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    return levelNames[level] || 'UNKNOWN';
  }

  /**
   * Obtém versão da extensão
   * @returns {string} Versão da extensão
   */
  getExtensionVersion() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime.getManifest().version;
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Recupera errors armazenados
   * @returns {Promise<Array>} Lista de errors
   */
  async getStoredErrors() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.local.get('medicalErrors');
      return result.medicalErrors || [];
    } catch (error) {
      this.logWarning('Falha ao recuperar errors armazenados', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Limpa errors armazenados
   */
  async clearStoredErrors() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      await api.storage.local.set({
        medicalErrors: []
      });
      this.logInfo('Errors armazenados limpos');
    } catch (error) {
      this.logWarning('Falha ao limpar errors armazenados', {
        error: error.message
      });
    }
  }
}

// Singleton instance
let errorHandlerInstance = null;

/**
 * Obtém instância singleton do ErrorHandler
 * @returns {MedicalErrorHandler} Instância do ErrorHandler
 */
function getErrorHandler() {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new MedicalErrorHandler();
  }
  return errorHandlerInstance;
}

// Exportar instância padrão para conveniência
const ErrorHandler = getErrorHandler();

// Exports para backward compatibility e testing


/**
 * Helper functions para uso rápido
 */
const logInfo = (message, data, category) => ErrorHandler.logInfo(message, data, category);
const logWarning = (message, data, category) => ErrorHandler.logWarning(message, data, category);
const logError = (message, data, category) => ErrorHandler.logError(message, data, category);
const logFatal = (message, data, category) => ErrorHandler.logFatal(message, data, category);
const logDebug = (message, data, category) => ErrorHandler.logDebug(message, data, category);

/**
 * Sanitização específica para dados médicos (export direto)
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} Dados sanitizados
 */
const sanitizeForLog = data => ErrorHandler.sanitizeForLogging(data);

/***/ }),

/***/ 574:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JA: () => (/* binding */ keepSessionAlive),
/* harmony export */   hr: () => (/* binding */ fetchRegulationDetails)
/* harmony export */ });
/* unused harmony exports getBaseUrl, fetchRegulationPriorities, clearRegulationLock, searchPatients, fetchVisualizaUsuario, fetchProntuarioHash, fetchConsultasEspecializadas, fetchConsultasBasicas, fetchAllConsultations, fetchExamesSolicitados, fetchResultadoExame, fetchCadsusData, fetchAppointmentDetails, fetchExamAppointmentDetails, fetchAppointments, fetchAllRegulations, fetchDocuments, fetchDocumentUrl, fetchRegulationAttachments, fetchRegulationAttachmentUrl, fetchAllTimelineData */
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(322);


const api = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Obtém a URL base do sistema a partir das configurações salvas pelo usuário.
 * @returns {Promise<string>} A URL base salva.
 */
async function getBaseUrl() {
  let data;
  try {
    const handler = (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .getErrorHandler */ .L9)();
    handler.startPerformanceMark('getBaseUrl');
    data = await api.storage.sync.get('baseUrl');
    handler.endPerformanceMark('getBaseUrl', _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.STORAGE);
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('Erro ao obter a URL base do storage', {
      errorMessage: e.message
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.STORAGE);
    throw e;
  }
  if (data && data.baseUrl) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logInfo */ .fH)('URL base obtida com sucesso', null, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.STORAGE);
    return data.baseUrl;
  }
  (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('URL base não configurada', null, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.STORAGE);
  throw new Error('URL_BASE_NOT_CONFIGURED');
}

/**
 * Lida com erros de fetch de forma centralizada usando ErrorHandler.
 * @param {Response} response - O objeto de resposta do fetch.
 * @param {string} operation - Nome da operação para contexto
 */
function handleFetchError(response, operation = 'API Call') {
  const errorData = {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    operation
  };
  (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)(`Erro na requisição: ${response.status} ${response.statusText}`, errorData, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
  throw new Error('Falha na comunicação com o servidor.');
}

/**
 * Extrai o texto de uma string HTML.
 * @param {string} htmlString - A string HTML.
 * @returns {string} O texto extraído.
 */
function getTextFromHTML(htmlString) {
  if (!htmlString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Busca as configurações de prioridade de regulação do sistema.
 * @returns {Promise<Array<object>>} Uma lista de objetos de prioridade.
 */
async function fetchRegulationPriorities() {
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/configuracaoGravidade/loadConfiguracaoRegra`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logWarning('SIGSS_API', 'Não foi possível buscar as prioridades de regulação', {
        status: response.status,
        statusText: response.statusText
      });
      return [];
    }
    const data = await response.json();
    // Filtra apenas as ativas e ordena pela ordem de exibição definida no sistema
    return data.filter(p => p.coreIsAtivo === 't').sort((a, b) => a.coreOrdemExibicao - b.coreOrdemExibicao);
  } catch (error) {
    logError('SIGSS_API', 'Erro de rede ao buscar prioridades', {
      errorMessage: error.message
    });
    return []; // Retorna lista vazia em caso de falha de rede
  }
}

/**
 * Limpa o lock de uma regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @returns {Promise<boolean>} True se a operação foi bem-sucedida, false caso contrário.
 */
async function clearRegulationLock({
  reguIdp,
  reguIds
}) {
  if (!reguIdp || !reguIds) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('REGULATION_LOCK', 'IDs da regulação não fornecidos para limpeza de lock', {
      hasReguIdp: !!reguIdp,
      hasReguIds: !!reguIds
    });
    return false;
  }
  try {
    const baseUrl = await getBaseUrl();
    const url = new URL(`${baseUrl}/sigss/regulacao/limparLock`);
    const lockId = `${reguIdp}-${reguIds}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `lock=${lockId}`
    });
    if (response.ok) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logInfo */ .fH)('REGULATION_LOCK', 'Lock da regulação liberado com sucesso', {
        lockIdProvided: !!lockId
      });
      return true;
    } else {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('REGULATION_LOCK', 'Falha ao liberar lock da regulação', {
        status: response.status,
        statusText: response.statusText,
        lockIdProvided: !!lockId
      });
      return false;
    }
  } catch (error) {
    // Ignora erros conforme solicitado
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('REGULATION_LOCK', 'Erro ao liberar lock da regulação', {
      errorMessage: error.message
    });
    return false;
  }
}

/**
 * Busca os detalhes completos de uma regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @returns {Promise<object>} O objeto com os dados da regulação.
 */
async function fetchRegulationDetails({
  reguIdp,
  reguIds
}) {
  if (!reguIdp || !reguIds) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('IDs da regulação são necessários', {
      reguIdp,
      reguIds
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
    throw new Error('IDs da regulação são necessários.');
  }
  try {
    const handler = (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .getErrorHandler */ .L9)();
    handler.startPerformanceMark('fetchRegulationDetails');
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logInfo */ .fH)('Iniciando busca de detalhes da regulação', {
      reguIdp,
      reguIds
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
    const baseUrl = await getBaseUrl();
    // Este é o endpoint que vimos no arquivo HAR.
    const url = new URL(`${baseUrl}/sigss/regulacaoControleSolicitacao/visualiza`);
    url.search = new URLSearchParams({
      'reguPK.idp': reguIdp,
      'reguPK.ids': reguIds
    }).toString();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    if (!response.ok) {
      handleFetchError(response, 'fetchRegulationDetails');
      return null;
    }
    let result = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      // O objeto de dados está aninhado sob a chave "regulacao"
      result = data.regulacao || null;
    } else {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('Resposta do servidor não foi JSON', {
        contentType
      }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
      throw new Error('A resposta do servidor não foi JSON. A sessão pode ter expirado.');
    }
    handler.endPerformanceMark('fetchRegulationDetails', _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logInfo */ .fH)('Detalhes da regulação obtidos com sucesso', {
      reguIdp,
      reguIds,
      hasResult: !!result
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);

    // Libera o lock após obter os detalhes, independente do resultado
    // Não aguardamos o resultado da limpeza do lock para não atrasar a resposta
    clearRegulationLock({
      reguIdp,
      reguIds
    }).catch(error => (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('Erro ao limpar lock após buscar detalhes', {
      errorMessage: error.message,
      reguIdp,
      reguIds
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API));
    return result;
  } catch (error) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('Falha ao buscar detalhes da regulação', {
      errorMessage: error.message,
      reguIdp,
      reguIds
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .ERROR_CATEGORIES */ .Uu.SIGSS_API);
    throw error;
  }
}
function parseConsultasHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tbody > tr'));
  const consultations = [];
  const getFormattedText = element => {
    if (!element) return '';
    const clone = element.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.parentNode.replaceChild(document.createTextNode('\n'), br));
    return clone.textContent || '';
  };
  const parseDateForSorting = dateString => {
    const datePart = (dateString.split('\n').find(p => p.startsWith('At')) || dateString).replace('At', '').trim();
    const match = datePart.match(/(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?/);
    if (!match) return null;
    const [, day, month, year, hour = 0, minute = 0, second = 0] = match;
    return new Date(year, month - 1, day, hour, minute, second);
  };
  let i = 0;
  while (i < rows.length) {
    const mainRow = rows[i];
    const mainCells = mainRow.querySelectorAll('td');
    if (mainCells.length < 5 || !mainCells[0].className.includes('width10')) {
      i++;
      continue;
    }
    const dateText = mainCells[1].textContent.trim().replace(/\s+/g, ' ');
    const consultation = {
      priority: mainCells[0].textContent.trim(),
      date: dateText.replace('At', '\nAt'),
      sortableDate: parseDateForSorting(dateText),
      unit: mainCells[2].textContent.trim(),
      specialty: mainCells[3].textContent.trim(),
      professional: mainCells[4].textContent.trim().replace(/Insc\.: \d+/, '').trim(),
      details: [],
      isNoShow: mainRow.textContent.includes('FALTOU A CONSULTA')
    };
    let endIndex = rows.findIndex((row, index) => index > i && row.querySelectorAll('td').length > 5 && row.querySelectorAll('td')[0].className.includes('width10'));
    if (endIndex === -1) endIndex = rows.length;
    const blockRows = rows.slice(i + 1, endIndex);
    const isSoapNote = blockRows.some(row => row.textContent.includes('SOAP -'));
    if (isSoapNote) {
      const soapSections = ['SUBJETIVO', 'OBJETIVO', 'AVALIAÇÃO', 'PLANO'];
      soapSections.forEach(sectionName => {
        const headerRowIndex = blockRows.findIndex(row => row.textContent.includes(`SOAP - ${sectionName}`));
        if (headerRowIndex === -1) return;
        let content = '',
          ciapCid = '',
          obsNota = '';
        const contentEndIndex = blockRows.findIndex((row, index) => index > headerRowIndex && row.textContent.includes('SOAP -'));
        const sectionRows = blockRows.slice(headerRowIndex + 1, contentEndIndex !== -1 ? contentEndIndex : blockRows.length);
        sectionRows.forEach(row => {
          const diagCell = Array.from(row.querySelectorAll('td')).find(cell => cell.textContent.includes('CID -') || cell.textContent.includes('CIAP -'));
          if (diagCell) {
            ciapCid = diagCell.textContent.trim();
            if (diagCell.nextElementSibling) ciapCid += ` - ${diagCell.nextElementSibling.textContent.trim()}`;
          }
          const descDiv = row.querySelector('.divHpdnObs');
          if (descDiv) content += getFormattedText(descDiv);
          const obsCell = Array.from(row.querySelectorAll('td')).find(cell => cell.textContent.trim().startsWith('OBS./NOTA:'));
          if (obsCell) obsNota = obsCell.textContent.replace('OBS./NOTA:', '').trim();
        });
        let finalValue = '';
        if (ciapCid) finalValue += ciapCid.trim();
        if (obsNota) finalValue += (finalValue ? '\n' : '') + `Obs.: ${obsNota.trim()}`;
        if (content) finalValue += (finalValue ? '\n' : '') + `Descrição: ${content.trim()}`;
        if (finalValue.trim()) consultation.details.push({
          label: sectionName,
          value: finalValue
        });
      });
    } else {
      blockRows.forEach(row => {
        const cidCell = Array.from(row.querySelectorAll('td')).find(cell => cell.textContent.includes('CID -'));
        if (cidCell) {
          const descCell = cidCell.nextElementSibling;
          if (descCell) consultation.details.push({
            label: 'Hipótese Diagnóstica',
            value: `${cidCell.textContent.trim()} - ${descCell.textContent.trim()}`
          });
        }
        const rowText = row.textContent.trim();
        if (rowText.includes('DESCRIÇÃO DA CONSULTA')) {
          const nextRow = row.nextElementSibling;
          const descDiv = nextRow === null || nextRow === void 0 ? void 0 : nextRow.querySelector('.divHpdnObs');
          if (descDiv) consultation.details.push({
            label: 'Descrição da Consulta',
            value: getFormattedText(descDiv).trim()
          });
        }
        if (rowText.includes('OBSERVAÇÃO DE ENFERMAGEM:')) {
          const obsCell = row.querySelector('td[colspan]');
          if (obsCell) consultation.details.push({
            label: 'Observação de Enfermagem',
            value: getFormattedText(obsCell).replace('OBSERVAÇÃO DE ENFERMAGEM:', '').trim()
          });
        }
      });
    }
    consultations.push(consultation);
    i = endIndex;
  }
  return consultations;
}
async function searchPatients(term) {
  if (!term || term.length < 1) return [];
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/usuarioServico/busca`);
  url.search = new URLSearchParams({
    searchString: term
  });
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return Array.isArray(data) ? data.map(p => ({
    idp: p[0],
    ids: p[1],
    value: p[5],
    cns: p[6],
    dataNascimento: p[7],
    cpf: p[15]
  })) : [];
}
async function fetchVisualizaUsuario({
  idp,
  ids
}) {
  if (!idp || !ids) throw new Error(`ID inválido. idp: '${idp}', ids: '${ids}'.`);
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/sigss/usuarioServico/visualiza`;
  const body = `isenPK.idp=${encodeURIComponent(idp)}&isenPK.ids=${encodeURIComponent(ids)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/javascript, */*; q=0.01'
    },
    body
  });
  if (!response.ok) handleFetchError(response);
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const patientData = await response.json();
    return (patientData === null || patientData === void 0 ? void 0 : patientData.usuarioServico) || {};
  } else {
    logError('SESSION_MANAGEMENT', 'A resposta do servidor não foi JSON. Provável expiração de sessão', {
      contentType
    });
    throw new Error('A sessão pode ter expirado. Por favor, faça login no sistema novamente.');
  }
}
async function fetchProntuarioHash({
  isenFullPKCrypto,
  dataInicial,
  dataFinal
}) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/sigss/common/queryStrToParamHash`;
  const rawParamString = `isenFullPKCrypto=${isenFullPKCrypto}&moip_idp=4&moip_ids=1&dataInicial=${dataInicial}&dataFinal=${dataFinal}&ppdc=t&consulta_basica=t&obs_enfermagem=t&encaminhamento=t&consulta_especializada=t&consulta_odonto=t&exame_solicitado=t&exame=t&triagem=t&procedimento=t&vacina=t&proc_odonto=t&medicamento_receitado=t&demais_orientacoes=t&medicamento_retirado=t&aih=t&acs=t&lista_espera=t&beneficio=f&internacao=t&apac=t&procedimento_coletivo=t&justificativa=&responsavelNome=&responsavelCPF=&isOdonto=t&isSoOdonto=f`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: `paramString=${encodeURIComponent(rawParamString)}`
  });
  if (!response.ok) throw new Error('Não foi possível gerar o passe de acesso.');
  const data = await response.json();
  if (data !== null && data !== void 0 && data.string) return data.string;
  throw new Error(data.mensagem || 'Resposta não continha o hash.');
}
async function fetchConsultasEspecializadas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal
}) {
  if (!isenFullPKCrypto) throw new Error('ID criptografado necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsultaEspecializadas_HTML`);
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal
  });
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: (data === null || data === void 0 ? void 0 : data.tabela) || '',
    jsonData: parseConsultasHTML((data === null || data === void 0 ? void 0 : data.tabela) || '')
  };
}
async function fetchConsultasBasicas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal
}) {
  if (!isenFullPKCrypto) throw new Error('ID criptografado necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsulta_HTML`);
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal
  });
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: (data === null || data === void 0 ? void 0 : data.tabela) || '',
    jsonData: parseConsultasHTML((data === null || data === void 0 ? void 0 : data.tabela) || '')
  };
}
async function fetchAllConsultations({
  isenFullPKCrypto,
  dataInicial,
  dataFinal
}) {
  const [basicasResult, especializadasResult] = await Promise.all([fetchConsultasBasicas({
    isenFullPKCrypto,
    dataInicial,
    dataFinal
  }), fetchConsultasEspecializadas({
    isenFullPKCrypto,
    dataInicial,
    dataFinal
  })]);
  const combinedJsonData = [...basicasResult.jsonData, ...especializadasResult.jsonData];
  const combinedHtmlData = `<h3>Consultas Básicas</h3>${basicasResult.htmlData}<h3>Consultas Especializadas</h3>${especializadasResult.htmlData}`;
  return {
    jsonData: combinedJsonData,
    htmlData: combinedHtmlData
  };
}
async function fetchExamesSolicitados({
  isenPK,
  dataInicial,
  dataFinal,
  comResultado,
  semResultado
}) {
  if (!isenPK) throw new Error('ID (isenPK) do paciente é necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/exameRequisitado/findAllReex`);
  const params = {
    'filters[0]': `dataInicial:${dataInicial}`,
    'filters[1]': `dataFinal:${dataFinal}`,
    'filters[2]': `isenPK:${isenPK}`,
    exameSolicitadoMin: 'true',
    exameSolicitadoOutro: 'true',
    exameComResultado: comResultado,
    exameSemResultado: semResultado,
    tipoBusca: 'reex',
    _search: 'false',
    nd: Date.now(),
    rows: '1000',
    page: '1',
    sidx: 'reex.reexData',
    sord: 'asc'
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return ((data === null || data === void 0 ? void 0 : data.rows) || []).map(row => {
    const cell = row.cell || [];
    return {
      id: row.id || '',
      date: cell[2] || '',
      examName: (cell[5] || '').trim(),
      hasResult: (cell[6] || '') === 'SIM',
      professional: cell[8] || '',
      specialty: cell[9] || '',
      resultIdp: cell[13] != null ? String(cell[13]) : '',
      resultIds: cell[14] != null ? String(cell[14]) : ''
    };
  });
}
async function fetchResultadoExame({
  idp,
  ids
}) {
  if (!idp || !ids) throw new Error('IDs do resultado do exame são necessários.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resultadoExame/visualizaImagem`);
  url.search = new URLSearchParams({
    'iterPK.idp': idp,
    'iterPK.ids': ids
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return (data === null || data === void 0 ? void 0 : data.path) || null;
}
async function fetchCadsusData({
  cpf,
  cns
}) {
  if (!cpf && !cns) {
    return null;
  }
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/usuarioServicoConsultaPDQ/consultarPaciente`);
  const params = new URLSearchParams({
    _search: 'false',
    rows: '50',
    page: '1',
    sidx: 'nome',
    sord: 'asc',
    'pdq.cartaoNacionalSus': '',
    'pdq.cpf': '',
    'pdq.rg': '',
    'pdq.nome': '',
    'pdq.dataNascimento': '',
    'pdq.sexo': '',
    'pdq.nomeMae': ''
  });
  if (cpf) {
    const formattedCpf = String(cpf).replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    params.set('pdq.cpf', formattedCpf);
  } else if (cns) {
    params.set('pdq.cartaoNacionalSus', cns);
  }
  url.search = params.toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) {
    logWarning('CADSUS_API', 'A busca no CADSUS falhou', {
      status: response.status,
      statusText: response.statusText
    });
    return null;
  }
  const data = await response.json();
  if (data && data.rows && data.rows.length > 0) {
    return data.rows[0].cell;
  }
  return null;
}
async function fetchAppointmentDetails({
  idp,
  ids
}) {
  if (!idp || !ids) throw new Error('ID do agendamento é necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoConsulta/visualiza`);
  url.search = new URLSearchParams({
    'agcoPK.idp': idp,
    'agcoPK.ids': ids
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) {
    logError('SIGSS_API', 'Falha ao buscar detalhes do agendamento', {
      status: response.status,
      statusText: response.statusText,
      hasIdp: !!idp,
      hasIds: !!ids
    });
    return null;
  }
  const data = await response.json();
  return (data === null || data === void 0 ? void 0 : data.agendamentoConsulta) || null;
}

/**
 * NEW: Busca os detalhes de um agendamento de exame.
 * @param {object} params
 * @param {string} params.idp - O IDP do agendamento de exame.
 * @param {string} params.ids - O IDS do agendamento de exame.
 * @returns {Promise<object>} O objeto com os dados do agendamento de exame.
 */
async function fetchExamAppointmentDetails({
  idp,
  ids
}) {
  if (!idp || !ids) throw new Error('ID do agendamento de exame é necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoExame/visualizar`);
  url.search = new URLSearchParams({
    'examPK.idp': idp,
    'examPK.ids': ids
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) {
    handleFetchError(response);
    return null;
  }
  const data = await response.json();
  return (data === null || data === void 0 ? void 0 : data.agendamentoExame) || null;
}
async function fetchAppointments({
  isenPK,
  dataInicial,
  dataFinal
}) {
  if (!isenPK) throw new Error('ID (isenPK) do paciente é necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resumoCompromisso/lista`);
  const params = {
    isenPK,
    dataInicial,
    dataFinal,
    _search: 'false',
    nd: Date.now(),
    rows: '1000',
    page: '1',
    sidx: 'data',
    sord: 'desc'
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  const basicAppointments = ((data === null || data === void 0 ? void 0 : data.rows) || []).map(row => {
    const cell = row.cell || [];
    let status = 'AGENDADO';
    if (String(cell[10]).includes('red')) status = 'FALTOU';else if (String(cell[7]).includes('blue')) status = 'PRESENTE';else if (String(cell[8]).includes('red')) status = 'CANCELADO';else if (String(cell[11]).includes('blue')) status = 'ATENDIDO';
    return {
      id: row.id || '',
      type: cell[1] || 'N/A',
      date: cell[2] || '',
      time: cell[3] || '',
      location: cell[4] || '',
      professional: cell[5] || '',
      description: (cell[6] || '').trim(),
      status: status
    };
  });
  const enrichedAppointments = [];
  const batchSize = 10;
  for (let i = 0; i < basicAppointments.length; i += batchSize) {
    const batch = basicAppointments.slice(i, i + batchSize);
    const promises = batch.map(async appt => {
      if (appt.type.toUpperCase().includes('EXAME')) {
        return {
          ...appt,
          specialty: appt.description || 'Exame sem descrição'
        };
      }
      const [idp, ids] = appt.id.split('-');
      if (!idp || !ids) return appt;
      try {
        const details = await fetchAppointmentDetails({
          idp,
          ids
        });
        if (details) {
          let specialtyString = 'Sem especialidade';
          const apcn = details.atividadeProfissionalCnes;
          if (apcn && apcn.apcnNome) {
            specialtyString = apcn.apcnCod ? `${apcn.apcnNome} (${apcn.apcnCod})` : apcn.apcnNome;
          }
          return {
            ...appt,
            isSpecialized: details.agcoIsEspecializada === 't',
            isOdonto: details.agcoIsOdonto === 't',
            specialty: specialtyString
          };
        }
      } catch (error) {
        logWarning('SIGSS_API', 'Falha ao buscar detalhes para o agendamento', {
          appointmentId: appt.id,
          errorMessage: error.message
        });
      }
      return appt;
    });
    const settledBatch = await Promise.all(promises);
    enrichedAppointments.push(...settledBatch);
  }
  return enrichedAppointments;
}
async function fetchRegulations({
  isenPK,
  modalidade,
  dataInicial,
  dataFinal
}) {
  if (!isenPK) throw new Error('ID (isenPK) do paciente é necessário.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/regulacaoRegulador/lista`);
  const params = {
    'filters[0]': `isFiltrarData:${!!dataInicial}`,
    'filters[1]': `dataInicial:${dataInicial || ''}`,
    'filters[2]': `dataFinal:${dataFinal || ''}`,
    'filters[3]': `modalidade:${modalidade}`,
    'filters[4]': 'solicitante:undefined',
    'filters[5]': `usuarioServico:${isenPK}`,
    'filters[6]': 'autorizado:true',
    'filters[7]': 'pendente:true',
    'filters[8]': 'devolvido:true',
    'filters[9]': 'negado:true',
    'filters[10]': 'emAnalise:true',
    'filters[11]': 'cancelados:true',
    'filters[12]': 'cboFiltro:',
    'filters[13]': 'procedimentoFiltro:',
    'filters[14]': 'reguGravidade:',
    'filters[15]': 'reguIsRetorno:...',
    'filters[16]': 'codBarProtocolo:',
    'filters[17]': 'reguIsAgendadoFiltro:todos',
    _search: 'false',
    nd: Date.now(),
    rows: '1000',
    page: '1',
    sidx: 'regu.reguDataPrevista',
    sord: 'desc'
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return ((data === null || data === void 0 ? void 0 : data.rows) || []).map(row => {
    const cell = row.cell || [];
    let idp = null,
      ids = null;
    const idMatch = (row.id || '').match(/reguPK(\d+)-(\d+)/);
    if (idMatch && idMatch.length === 3) {
      idp = idMatch[1];
      ids = idMatch[2];
    }
    const descriptionHtml = cell[6] || '';
    const [procedure, cid] = descriptionHtml.split('<br/>');
    return {
      id: row.id,
      idp,
      ids,
      type: cell[2] || 'N/A',
      priority: getTextFromHTML(cell[3]),
      date: cell[4] || '',
      status: getTextFromHTML(cell[5]),
      procedure: getTextFromHTML(procedure),
      cid: cid ? cid.trim() : '',
      requester: cell[7] || '',
      provider: cell[8] || '',
      isenFullPKCrypto: cell[9] || ''
    };
  });
}
async function fetchAllRegulations({
  isenPK,
  dataInicial,
  dataFinal,
  type = 'all'
}) {
  let regulationsToFetch = [];
  if (type === 'all') {
    regulationsToFetch = await Promise.all([fetchRegulations({
      isenPK,
      modalidade: 'ENC',
      dataInicial,
      dataFinal
    }), fetchRegulations({
      isenPK,
      modalidade: 'EXA',
      dataInicial,
      dataFinal
    })]);
  } else if (type === 'ENC') {
    regulationsToFetch = [await fetchRegulations({
      isenPK,
      modalidade: 'ENC',
      dataInicial,
      dataFinal
    })];
  } else if (type === 'EXA') {
    regulationsToFetch = [await fetchRegulations({
      isenPK,
      modalidade: 'EXA',
      dataInicial,
      dataFinal
    })];
  }
  const allRegulations = regulationsToFetch.flat();
  const regulationsWithAttachments = await Promise.all(allRegulations.map(async regulation => {
    if (regulation.idp && regulation.ids) {
      try {
        // CORREÇÃO: Usa o ID da própria regulação como o isenPK para esta chamada específica.
        const attachmentIsenPk = `${regulation.idp}-${regulation.ids}`;
        const attachments = await fetchRegulationAttachments({
          reguIdp: regulation.idp,
          reguIds: regulation.ids,
          isenPK: attachmentIsenPk
        });
        return {
          ...regulation,
          attachments
        };
      } catch (error) {
        logWarning('SIGSS_API', 'Falha ao buscar anexos para regulação', {
          regulationId: regulation.id,
          errorMessage: error.message
        });
        return {
          ...regulation,
          attachments: []
        };
      }
    }
    return {
      ...regulation,
      attachments: []
    };
  }));
  regulationsWithAttachments.sort((a, b) => {
    const dateA = a.date.split('/').reverse().join('-');
    const dateB = b.date.split('/').reverse().join('-');
    return new Date(dateB) - new Date(dateA);
  });
  return regulationsWithAttachments;
}

/**
 * Busca a lista de documentos anexados ao cadastro de um paciente.
 * @param {object} params
 * @param {string} params.isenPK - O PK do paciente no formato "idp-ids".
 * @returns {Promise<Array<object>>} Uma lista de objetos de documento.
 */
async function fetchDocuments({
  isenPK
}) {
  if (!isenPK) throw new Error('ID (isenPK) do paciente é necessário.');
  const [idp, ids] = isenPK.split('-');
  if (!idp || !ids) throw new Error('ID (isenPK) do paciente em formato inválido.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/buscaGrid`);
  const params = {
    'isenPK.idp': idp,
    'isenPK.ids': ids,
    _search: 'false',
    nd: Date.now(),
    rows: '999',
    page: '1',
    sidx: 'isar.isarData desc, isar.isarPK.idp',
    sord: 'desc'
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return ((data === null || data === void 0 ? void 0 : data.rows) || []).map(row => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || '',
      description: (cell[3] || '').trim(),
      fileType: (cell[4] || '').toLowerCase()
    };
  });
}

/**
 * Obtém a URL de visualização para um documento específico.
 * @param {object} params
 * @param {string} params.idp - O IDP do documento.
 * @param {string} params.ids - O IDS do documento.
 * @returns {Promise<string|null>} A URL completa para visualização do arquivo.
 */
async function fetchDocumentUrl({
  idp,
  ids
}) {
  var _data$isenArquivo;
  if (!idp || !ids) throw new Error('IDs do documento são necessários.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/getHashArquivo`);
  url.search = new URLSearchParams({
    'isarPK.idp': idp,
    'isarPK.ids': ids
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  if (data !== null && data !== void 0 && (_data$isenArquivo = data.isenArquivo) !== null && _data$isenArquivo !== void 0 && _data$isenArquivo.img) {
    const filePath = data.isenArquivo.img;
    return filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
  }
  return null;
}

/**
 * Busca a lista de arquivos anexados a uma solicitação de regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @param {string} params.isenPK - O PK do paciente no formato "idp-ids".
 * @returns {Promise<Array<object>>} Uma lista de objetos de anexo.
 */
async function fetchRegulationAttachments({
  reguIdp,
  reguIds,
  isenPK
}) {
  if (!reguIdp || !reguIds) throw new Error('ID da regulação é necessário.');
  if (!isenPK) throw new Error('ID do paciente (isenPK) é necessário.');
  const [isenIdp, isenIds] = isenPK.split('-');
  if (!isenIdp || !isenIds) throw new Error('ID do paciente (isenPK) em formato inválido.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/buscaGrid`);
  const params = {
    'isenPK.idp': isenIdp,
    'isenPK.ids': isenIds,
    'reguPK.idp': reguIdp,
    'reguPK.ids': reguIds,
    _search: 'false',
    nd: Date.now(),
    rows: '999',
    page: '1',
    sidx: '',
    // Corrigido para corresponder à requisição da aplicação
    sord: 'asc' // Corrigido para corresponder à requisição da aplicação
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return ((data === null || data === void 0 ? void 0 : data.rows) || []).map(row => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || '',
      description: (cell[3] || '').trim(),
      fileType: (cell[4] || '').toLowerCase()
    };
  });
}

/**
 * Obtém a URL de visualização para um anexo de regulação específico.
 * @param {object} params
 * @param {string} params.idp - O IDP do anexo (rearPK.idp).
 * @param {string} params.ids - O IDS do anexo (rearPK.ids).
 * @returns {Promise<string|null>} A URL completa para visualização do arquivo.
 */
async function fetchRegulationAttachmentUrl({
  idp,
  ids
}) {
  var _data$regulacaoArquiv;
  if (!idp || !ids) throw new Error('IDs do anexo são necessários.');
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/getHashArquivo`);
  url.search = new URLSearchParams({
    'rearPK.idp': idp,
    'rearPK.ids': ids
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  if (data !== null && data !== void 0 && (_data$regulacaoArquiv = data.regulacaoArquivo) !== null && _data$regulacaoArquiv !== void 0 && _data$regulacaoArquiv.img) {
    const filePath = data.regulacaoArquivo.img;
    return filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
  }
  return null;
}

/**
 * Fetches all data sources for the patient timeline concurrently.
 * @param {object} params - The parameters for the API calls.
 * @returns {Promise<object>} An object containing the data from all sources.
 */
async function fetchAllTimelineData({
  isenPK,
  isenFullPKCrypto,
  dataInicial,
  dataFinal
}) {
  // Usando um objeto de promessas para tornar a extração de resultados mais robusta.
  const dataPromises = {
    consultations: fetchAllConsultations({
      isenFullPKCrypto,
      dataInicial,
      dataFinal
    }),
    exams: fetchExamesSolicitados({
      isenPK,
      dataInicial,
      dataFinal,
      comResultado: true,
      semResultado: true
    }),
    appointments: fetchAppointments({
      isenPK,
      dataInicial,
      dataFinal
    }),
    regulations: fetchAllRegulations({
      isenPK,
      dataInicial,
      dataFinal,
      type: 'all'
    }),
    documents: fetchDocuments({
      isenPK
    })
  };
  const results = await Promise.allSettled(Object.values(dataPromises));
  const dataKeys = Object.keys(dataPromises);
  const getValueOrDefault = (result, defaultValue = []) => {
    if (result.status === 'fulfilled') {
      if (result.value && typeof result.value.jsonData !== 'undefined') {
        return result.value.jsonData; // For consultations
      }
      return result.value; // For others
    }
    logWarning('TIMELINE_API', 'Falha em chamada de API para a timeline', {
      reason: result.reason
    });
    return defaultValue;
  };
  const timelineData = {};
  dataKeys.forEach((key, index) => {
    timelineData[key] = getValueOrDefault(results[index]);
  });
  return timelineData;
}

/**
 * Envia uma requisição para manter a sessão ativa no sistema.
 * @returns {Promise<boolean>} True se a requisição foi bem-sucedida, false caso contrário.
 */
async function keepSessionAlive() {
  try {
    const baseUrl = await getBaseUrl();
    const url = new URL(`${baseUrl}/sigss/common/dataHora`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    if (!response.ok) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('SESSION_MANAGEMENT', 'Keep-alive falhou', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
    const data = await response.json();
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logInfo */ .fH)('SESSION_MANAGEMENT', 'Sessão mantida ativa', {
      sessionActive: true,
      hasSessionData: !!data
    });
    return true;
  } catch (error) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SESSION_MANAGEMENT', 'Erro ao manter sessão ativa', {
      errorMessage: error.message
    });
    return false;
  }
}

/***/ }),

/***/ 657:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ KeepAliveManager)
/* harmony export */ });
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 */

class KeepAliveManager {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos

    this.init();
  }
  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();

    // Escuta mudanças nas configurações
    if (typeof browser !== 'undefined') {
      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.keepSessionAliveInterval) {
          this.updateInterval(changes.keepSessionAliveInterval.newValue);
        }
      });
    }
  }
  async loadSettings() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.sync.get({
        keepSessionAliveInterval: 10
      });
      this.updateInterval(result.keepSessionAliveInterval);
    } catch (error) {
      console.error('Erro ao carregar configurações do keep-alive:', error);
    }
  }
  updateInterval(minutes) {
    const newMinutes = parseInt(minutes, 10) || 0;
    this.intervalMinutes = newMinutes;

    // Para o timer atual
    this.stop();

    // Inicia novo timer se o valor for maior que 0
    if (this.intervalMinutes > 0) {
      this.start();
    }
  }
  start() {
    if (this.intervalMinutes <= 0) {
      console.log('Keep-alive desativado (intervalo = 0)');
      return;
    }
    if (this.isActive) {
      console.log('Keep-alive já está ativo');
      return;
    }
    const intervalMs = this.intervalMinutes * 60 * 1000; // Converte minutos para milissegundos

    this.intervalId = setInterval(async () => {
      try {
        const success = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .keepSessionAlive */ .JA();
        if (success) {
          console.log(`Keep-alive executado com sucesso (${new Date().toLocaleTimeString()})`);
        } else {
          console.warn(`Keep-alive falhou (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error('Erro no keep-alive:', error);
      }
    }, intervalMs);
    this.isActive = true;
    console.log(`Keep-alive iniciado: ${this.intervalMinutes} minutos (${intervalMs}ms)`);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('Keep-alive parado');
  }
  getStatus() {
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      nextExecution: this.isActive ? new Date(Date.now() + this.intervalMinutes * 60 * 1000) : null
    };
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(322);
/* harmony import */ var _KeepAliveManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(657);




const api = typeof browser !== 'undefined' ? browser : chrome;
api.runtime.onMessage.addListener(async message => {
  if (message.type === 'SAVE_REGULATION_DATA') {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Recebido pedido para salvar dados da regulação', {
      payloadType: typeof message.payload,
      hasPayload: !!message.payload
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    try {
      const regulationDetails = await (0,_api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchRegulationDetails */ .hr)(message.payload);
      if (regulationDetails) {
        // CORREÇÃO: Usando storage.local em vez de storage.session para maior compatibilidade.
        await api.storage.local.set({
          pendingRegulation: regulationDetails
        });
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Detalhes da regulação salvos no storage local com sucesso', {
          regulationId: regulationDetails.id || 'unknown',
          hasDetails: !!regulationDetails
        }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
      } else {
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logWarning */ .FF)('Não foram encontrados detalhes para a regulação', {
          payloadType: typeof message.payload
        }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
      }
    } catch (e) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logError */ .vV)('Falha ao buscar ou salvar dados da regulação', {
        errorMessage: e.message,
        errorType: e.constructor.name
      }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    }
    return true;
  }
});
async function openSidebar(tab) {
  try {
    if (api.sidePanel) {
      await api.sidePanel.open({
        windowId: tab.windowId
      });
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Sidebar aberto via sidePanel API', {
        windowId: tab.windowId
      }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    } else if (api.sidebarAction) {
      await api.sidebarAction.toggle();
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Sidebar alternado via sidebarAction API', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    } else {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logWarning */ .FF)('Nenhuma API de sidebar disponível', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    }
  } catch (error) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logError */ .vV)('Falha ao abrir sidebar', {
      errorMessage: error.message,
      tabId: tab.id,
      windowId: tab.windowId
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
  }
}
api.action.onClicked.addListener(openSidebar);
new _KeepAliveManager_js__WEBPACK_IMPORTED_MODULE_2__/* .KeepAliveManager */ .E();
api.runtime.onInstalled.addListener(details => {
  (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Extensão instalada/atualizada', {
    reason: details.reason,
    version: api.runtime.getManifest().version
  }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.EXTENSION_LIFECYCLE);
  if (api.sidePanel) {
    api.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false
    }).catch(e => (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logError */ .vV)('Falha ao definir o comportamento do sidePanel', {
      errorMessage: e.message
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT));
  }
  api.contextMenus.create({
    id: 'openSidePanel',
    title: 'Alternar Assistente de Regulação',
    contexts: ['all']
  });
  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
      openSidebar(tab);
    }
  });
  if (details.reason === 'install') {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .logInfo */ .fH)('Primeira instalação detectada, abrindo página de ajuda', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_1__/* .ERROR_CATEGORIES */ .Uu.EXTENSION_LIFECYCLE);
    api.tabs.create({
      url: api.runtime.getURL('help.html')
    });
  }
});
/******/ })()
;