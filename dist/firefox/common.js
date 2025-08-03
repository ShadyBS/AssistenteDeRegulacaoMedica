"use strict";
(self["webpackChunkassistente_de_regulacao_medica"] = self["webpackChunkassistente_de_regulacao_medica"] || []).push([[76,984],{

/***/ 239:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AQ: () => (/* binding */ setupTabs),
/* harmony export */   Eg: () => (/* binding */ getContrastYIQ),
/* harmony export */   J2: () => (/* binding */ normalizeString),
/* harmony export */   LJ: () => (/* binding */ getNestedValue),
/* harmony export */   Pr: () => (/* binding */ filterTimelineEvents),
/* harmony export */   Z9: () => (/* binding */ calculateRelativeDate),
/* harmony export */   _U: () => (/* binding */ parseDate),
/* harmony export */   de: () => (/* binding */ clearMessage),
/* harmony export */   i1: () => (/* binding */ toggleLoader),
/* harmony export */   rG: () => (/* binding */ showMessage),
/* harmony export */   sg: () => (/* binding */ debounce),
/* harmony export */   td: () => (/* binding */ normalizeTimelineData),
/* harmony export */   ui: () => (/* binding */ showDialog)
/* harmony export */ });
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(322);


/**
 * Exibe um modal customizado de confirmação.
 * @param {Object} options
 * @param {string} options.message Mensagem a exibir
 * @param {Function} options.onConfirm Callback para confirmação
 * @param {Function} [options.onCancel] Callback para cancelamento
 */
function showDialog({
  message,
  onConfirm,
  onCancel
}) {
  let modal = document.getElementById('custom-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div class="mb-4 text-slate-800 text-base" id="custom-confirm-message"></div>
          <div class="flex justify-end gap-2">
            <button id="custom-confirm-cancel" class="px-4 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300">Cancelar</button>
            <button id="custom-confirm-ok" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.querySelector('#custom-confirm-message').textContent = message;
  const okBtn = modal.querySelector('#custom-confirm-ok');
  const cancelBtn = modal.querySelector('#custom-confirm-cancel');
  const close = () => {
    modal.style.display = 'none';
  };
  okBtn.onclick = () => {
    close();
    onConfirm && onConfirm();
  };
  cancelBtn.onclick = () => {
    close();
    onCancel && onCancel();
  };
}
/**
 * @file Contém funções utilitárias compartilhadas em toda a extensão.
 */

/**
 * Atraso na execução de uma função após o utilizador parar de digitar.
 * @param {Function} func A função a ser executada.
 * @param {number} [delay=500] O tempo de espera em milissegundos.
 * @returns {Function} A função com debounce.
 */
function debounce(func, delay = 500) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Mostra ou esconde o loader principal.
 * @param {boolean} show - `true` para mostrar, `false` para esconder.
 */
function toggleLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

/**
 * Exibe uma mensagem na área de mensagens.
 * @param {string} text O texto da mensagem.
 * @param {'error' | 'success' | 'info'} [type='error'] O tipo de mensagem.
 */
function showMessage(text, type = 'error') {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.textContent = text;
    const typeClasses = {
      error: 'bg-red-100 text-red-700',
      success: 'bg-green-100 text-green-700',
      info: 'bg-blue-100 text-blue-700'
    };
    messageArea.className = `p-3 rounded-md text-sm ${typeClasses[type] || typeClasses.error}`;
    messageArea.style.display = 'block';
  }
}

/**
 * Limpa a área de mensagens.
 */
function clearMessage() {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.style.display = 'none';
  }
}

/**
 * Converte uma string de data em vários formatos para um objeto Date.
 * @param {string} dateString A data no formato "dd/MM/yyyy" ou "yyyy-MM-dd", podendo conter prefixos.
 * @returns {Date|null} O objeto Date ou null se a string for inválida.
 */
function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  // Tenta extrair o primeiro padrão de data válido da string.
  const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{2,4})/);
  if (!dateMatch) return null;
  const matchedDate = dateMatch[0];
  let year, month, day;

  // Tenta o formato YYYY-MM-DD
  if (matchedDate.includes('-')) {
    [year, month, day] = matchedDate.split('-').map(Number);
  } else if (matchedDate.includes('/')) {
    // Tenta o formato DD/MM/YYYY
    [day, month, year] = matchedDate.split('/').map(Number);
  }

  // Valida se os números são válidos e se a data é real
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Lida com anos de 2 dígitos (ex: '24' -> 2024)
  if (year >= 0 && year < 100) {
    year += 2000;
  }
  const date = new Date(Date.UTC(year, month - 1, day));

  // Confirma que a data não "rolou" para o mês seguinte (ex: 31 de Abril -> 1 de Maio)
  if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
    return date;
  }
  return null; // Retorna nulo se a data for inválida (ex: 31/02/2024)
}

/**
 * Obtém um valor aninhado de um objeto de forma segura.
 * @param {object} obj O objeto.
 * @param {string} path O caminho para a propriedade (ex: 'a.b.c').
 * @returns {*} O valor encontrado ou undefined.
 */
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Calcula uma data relativa à data atual com base num desvio em meses.
 * @param {number} offsetInMonths - O número de meses a adicionar ou subtrair.
 * @returns {Date} O objeto Date resultante.
 */
function calculateRelativeDate(offsetInMonths) {
  const date = new Date();
  // setMonth lida corretamente com transições de ano e dias do mês
  date.setMonth(date.getMonth() + offsetInMonths);
  return date;
}

/**
 * Retorna 'black' ou 'white' para o texto dependendo do contraste com a cor de fundo.
 * @param {string} hexcolor - A cor de fundo em formato hexadecimal (com ou sem #).
 * @returns {'black' | 'white'}
 */
function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

/**
 * Normaliza uma string removendo acentos, cedilha e convertendo para minúsculas.
 * @param {string} str - A string a ser normalizada.
 * @returns {string} A string normalizada.
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Configura um sistema de abas (tabs) dentro de um container.
 * @param {HTMLElement} container - O elemento que contém os botões e os painéis das abas.
 */
function setupTabs(container) {
  if (!container) return;
  const tabButtons = container.querySelectorAll('.tab-button');
  const tabContents = container.querySelectorAll('.tab-content');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      const activeContent = container.querySelector(`#${tabName}-tab`);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}

/**
 * Normalizes data from various sources into a single, sorted timeline event list.
 * @param {object} apiData - An object containing arrays of consultations, exams, etc.
 * @returns {Array<object>} A sorted array of timeline event objects.
 */
function normalizeTimelineData(apiData) {
  const events = [];

  // Normalize Consultations
  try {
    (apiData.consultations || []).forEach(c => {
      if (!c || !c.date) return;
      const searchText = normalizeString([c.specialty, c.professional, c.unit, ...c.details.map(d => d.value)].join(' '));
      events.push({
        type: 'consultation',
        date: parseDate(c.date.split('\n')[0]),
        sortableDate: c.sortableDate || parseDate(c.date),
        title: `Consulta: ${c.specialty || 'Especialidade não informada'}`,
        summary: `com ${c.professional || 'Profissional não informado'}`,
        details: c,
        subDetails: c.details || [],
        searchText
      });
    });
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('TIMELINE_NORMALIZATION', 'Failed to normalize consultation data for timeline', {
      errorMessage: e.message
    });
  }

  // Normalize Exams
  try {
    (apiData.exams || []).forEach(e => {
      const eventDate = parseDate(e.date);
      if (!e || !eventDate) return;
      const searchText = normalizeString([e.examName, e.professional, e.specialty].filter(Boolean).join(' '));
      events.push({
        type: 'exam',
        date: eventDate,
        sortableDate: eventDate,
        title: `Exame Solicitado: ${e.examName || 'Nome não informado'}`,
        summary: `Solicitado por ${e.professional || 'Não informado'}`,
        details: e,
        subDetails: [{
          label: 'Resultado',
          value: e.hasResult ? 'Disponível' : 'Pendente'
        }],
        searchText
      });
    });
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('TIMELINE_NORMALIZATION', 'Failed to normalize exam data for timeline', {
      errorMessage: e.message
    });
  }

  // Normalize Appointments
  try {
    (apiData.appointments || []).forEach(a => {
      if (!a || !a.date) return;
      const searchText = normalizeString([a.specialty, a.description, a.location, a.professional].join(' '));
      events.push({
        type: 'appointment',
        date: parseDate(a.date),
        sortableDate: parseDate(a.date),
        title: `Agendamento: ${a.specialty || a.description || 'Não descrito'}`,
        summary: a.location || 'Local não informado',
        details: a,
        subDetails: [{
          label: 'Status',
          value: a.status || 'N/A'
        }, {
          label: 'Hora',
          value: a.time || 'N/A'
        }],
        searchText
      });
    });
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('TIMELINE_NORMALIZATION', 'Failed to normalize appointment data for timeline', {
      errorMessage: e.message
    });
  }

  // Normalize Regulations
  try {
    (apiData.regulations || []).forEach(r => {
      if (!r || !r.date) return;
      const searchText = normalizeString([r.procedure, r.requester, r.provider, r.cid].join(' '));
      events.push({
        type: 'regulation',
        date: parseDate(r.date),
        sortableDate: parseDate(r.date),
        title: `Regulação: ${r.procedure || 'Procedimento não informado'}`,
        summary: `Solicitante: ${r.requester || 'Não informado'}`,
        details: r,
        subDetails: [{
          label: 'Status',
          value: r.status || 'N/A'
        }, {
          label: 'Prioridade',
          value: r.priority || 'N/A'
        }],
        searchText
      });
    });
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('TIMELINE_NORMALIZATION', 'Failed to normalize regulation data for timeline', {
      errorMessage: e.message
    });
  }

  // --- INÍCIO DA MODIFICAÇÃO ---
  // Normalize Documents
  try {
    (apiData.documents || []).forEach(doc => {
      if (!doc || !doc.date) return;
      const searchText = normalizeString(doc.description || '');
      events.push({
        type: 'document',
        date: parseDate(doc.date),
        sortableDate: parseDate(doc.date),
        title: `Documento: ${doc.description || 'Sem descrição'}`,
        summary: `Tipo: ${doc.fileType.toUpperCase()}`,
        details: doc,
        subDetails: [],
        searchText
      });
    });
  } catch (e) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('TIMELINE_NORMALIZATION', 'Failed to normalize document data for timeline', {
      errorMessage: e.message
    });
  }
  // --- FIM DA MODIFICAÇÃO ---

  // Filter out events with invalid dates and sort all events by date, newest first.
  return events.filter(event => event.sortableDate instanceof Date && !isNaN(event.sortableDate)).sort((a, b) => b.sortableDate - a.sortableDate);
}

/**
 * Filters timeline events based on automation rule filters.
 * @param {Array<object>} events - The full array of timeline events.
 * @param {object} automationFilters - The filter settings from an automation rule.
 * @returns {Array<object>} A new array with the filtered events.
 */
function filterTimelineEvents(events, automationFilters) {
  if (!automationFilters) return events;
  const checkText = (text, filterValue) => {
    if (!filterValue) return true; // If filter is empty, it passes
    const terms = filterValue.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    if (terms.length === 0) return true;
    const normalizedText = normalizeString(text || '');
    return terms.some(term => normalizedText.includes(term));
  };
  return events.filter(event => {
    try {
      switch (event.type) {
        case 'consultation':
          {
            const consultFilters = automationFilters.consultations || {};
            // Procura por um campo rotulado como CID ou CIAP para uma busca precisa.
            const cidDetail = (event.details.details || []).find(d => normalizeString(d.label).includes('cid') || normalizeString(d.label).includes('ciap'));
            const cidText = cidDetail ? cidDetail.value : '';
            return checkText(event.details.specialty, consultFilters['consultation-filter-specialty']) && checkText(event.details.professional, consultFilters['consultation-filter-professional']) && checkText(cidText, consultFilters['consultation-filter-cid']);
          }
        case 'exam':
          {
            const examFilters = automationFilters.exams || {};
            return checkText(event.details.examName, examFilters['exam-filter-name']) && checkText(event.details.professional, examFilters['exam-filter-professional']) && checkText(event.details.specialty, examFilters['exam-filter-specialty']);
          }
        case 'appointment':
          {
            const apptFilters = automationFilters.appointments || {};
            const apptText = `${event.details.specialty} ${event.details.professional} ${event.details.location}`;
            return checkText(apptText, apptFilters['appointment-filter-term']);
          }
        case 'regulation':
          {
            const regFilters = automationFilters.regulations || {};
            return checkText(event.details.procedure, regFilters['regulation-filter-procedure']) && checkText(event.details.requester, regFilters['regulation-filter-requester']) && (regFilters['regulation-filter-status'] === 'todos' || !regFilters['regulation-filter-status'] || event.details.status.toUpperCase() === regFilters['regulation-filter-status'].toUpperCase()) && (regFilters['regulation-filter-priority'] === 'todas' || !regFilters['regulation-filter-priority'] || event.details.priority.toUpperCase() === regFilters['regulation-filter-priority'].toUpperCase());
          }
        default:
          return true;
      }
    } catch (e) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('TIMELINE_FILTERING', 'Error filtering timeline event, it will be included by default', {
        eventType: event === null || event === void 0 ? void 0 : event.type,
        errorMessage: e.message
      });
      return true;
    }
  });
}

/***/ }),

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

/***/ 335:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   M: () => (/* binding */ store)
/* harmony export */ });
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(322);
/**
 * @file store.js - Gestor de estado centralizado para a aplicação.
 * Implementa um padrão simples de "publish-subscribe" para gerir o estado global.
 */


const state = {
  currentPatient: {
    ficha: null,
    cadsus: null,
    lastCadsusCheck: null,
    isUpdating: false
  },
  recentPatients: [],
  savedFilterSets: {}
};
const listeners = [];
const store = {
  /**
   * Adiciona uma função de callback à lista de listeners.
   * @param {Function} listener A função a ser adicionada.
   * @returns {Function} Uma função para remover o listener (unsubscribe).
   */
  subscribe(listener) {
    listeners.push(listener);
    // PASSO 3.3: Retorna uma função de unsubscribe para melhor gestão de memória.
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
  _notify() {
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('STORE_LISTENER', 'Erro num listener do store', {
          errorMessage: error.message
        });
      }
    }
  },
  setPatient(fichaData, cadsusData) {
    state.currentPatient.ficha = fichaData;
    state.currentPatient.cadsus = cadsusData;
    state.currentPatient.lastCadsusCheck = cadsusData ? new Date() : null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },
  clearPatient() {
    state.currentPatient.ficha = null;
    state.currentPatient.cadsus = null;
    state.currentPatient.lastCadsusCheck = null;
    state.currentPatient.isUpdating = false;
    this._notify();
  },
  setPatientUpdating() {
    state.currentPatient.isUpdating = true;
    this._notify();
  },
  getPatient() {
    return state.currentPatient.ficha ? state.currentPatient : null;
  },
  setRecentPatients(patients) {
    state.recentPatients = patients;
    this._notify();
  },
  getRecentPatients() {
    return state.recentPatients;
  },
  setSavedFilterSets(sets) {
    state.savedFilterSets = sets;
    this._notify();
  },
  getSavedFilterSets() {
    return state.savedFilterSets;
  },
  getState() {
    return {
      currentPatient: {
        ...state.currentPatient
      },
      recentPatients: [...state.recentPatients],
      savedFilterSets: {
        ...state.savedFilterSets
      }
    };
  }
};

/***/ }),

/***/ 338:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   N: () => (/* binding */ SectionManager),
/* harmony export */   Q: () => (/* binding */ getSortIndicator)
/* harmony export */ });
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(322);
/* harmony import */ var _filter_config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(733);
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(335);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(239);
/**
 * @file Módulo SectionManager, responsável por gerir uma secção inteira da sidebar.
 */






/**
 * Gera o HTML para o indicador de ordenação (seta para cima/baixo).
 * @param {string} key - A chave da coluna atual.
 * @param {object} state - O objeto de estado de ordenação da secção.
 * @returns {string} O caractere da seta ou uma string vazia.
 */
function getSortIndicator(key, state) {
  if (state.key !== key) return '';
  return state.order === 'asc' ? '▲' : '▼';
}
class SectionManager {
  /**
   * @param {string} sectionKey - A chave da secção (ex: "consultations").
   * @param {object} config - Configurações específicas da secção.
   * @param {Function} config.fetchFunction - A função da API para buscar dados.
   * @param {Function} config.renderFunction - A função para renderizar os dados.
   * @param {object} config.initialSortState - O estado inicial de ordenação.
   * @param {object} globalSettings - Configurações globais da aplicação.
   */
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.prefix = this.getPrefix(sectionKey);
    this.config = config;
    this.globalSettings = globalSettings;
    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;
    this.sortState = {
      ...config.initialSortState
    };
    this.fetchType = 'all';
    this.elements = {};
    this.init();
  }
  getPrefix(sectionKey) {
    const map = {
      consultations: 'consultation',
      exams: 'exam',
      appointments: 'appointment',
      regulations: 'regulation',
      documents: 'document'
    };
    return map[sectionKey] || sectionKey;
  }
  init() {
    this.cacheDomElements();
    this.renderFilterControls();
    this.addEventListeners();
    _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.subscribe(() => this.onStateChange());
  }
  onStateChange() {
    var _this$currentPatient, _this$currentPatient$, _newPatient$isenPK;
    const patientState = _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getPatient();
    const newPatient = patientState ? patientState.ficha : null;
    if (((_this$currentPatient = this.currentPatient) === null || _this$currentPatient === void 0 ? void 0 : (_this$currentPatient$ = _this$currentPatient.isenPK) === null || _this$currentPatient$ === void 0 ? void 0 : _this$currentPatient$.idp) !== (newPatient === null || newPatient === void 0 ? void 0 : (_newPatient$isenPK = newPatient.isenPK) === null || _newPatient$isenPK === void 0 ? void 0 : _newPatient$isenPK.idp)) {
      this.setPatient(newPatient);
    }
    this.populateSavedFilterDropdown();
  }
  cacheDomElements() {
    const {
      sectionKey,
      prefix
    } = this;
    this.elements = {
      section: document.getElementById(`${sectionKey}-section`),
      wrapper: document.getElementById(`${sectionKey}-wrapper`),
      content: document.getElementById(`${sectionKey}-content`),
      fetchBtn: document.getElementById(`fetch-${sectionKey}-btn`),
      toggleBtn: document.getElementById(`toggle-${sectionKey}-list-btn`),
      toggleMoreBtn: document.getElementById(`toggle-more-${prefix}-filters-btn`),
      clearBtn: document.getElementById(`clear-${prefix}-filters-btn`),
      mainFilters: document.getElementById(`${prefix}-main-filters`),
      moreFilters: document.getElementById(`${prefix}-more-filters`),
      automationFeedback: document.getElementById(`${sectionKey}-automation-feedback`)
    };
  }
  addEventListeners() {
    var _el$fetchBtn, _el$toggleBtn, _el$toggleMoreBtn, _el$clearBtn, _el$section, _el$section2, _el$section3, _el$fetchBtn2, _el$toggleBtn2, _el$toggleMoreBtn2, _el$clearBtn2, _el$section4, _el$section5, _el$section6;
    // Remove listeners antes de adicionar
    if (!this._listeners) this._listeners = {};
    const el = this.elements;
    (_el$fetchBtn = el.fetchBtn) === null || _el$fetchBtn === void 0 ? void 0 : _el$fetchBtn.removeEventListener('click', this._listeners.onFetchBtnClick);
    (_el$toggleBtn = el.toggleBtn) === null || _el$toggleBtn === void 0 ? void 0 : _el$toggleBtn.removeEventListener('click', this._listeners.onToggleBtnClick);
    (_el$toggleMoreBtn = el.toggleMoreBtn) === null || _el$toggleMoreBtn === void 0 ? void 0 : _el$toggleMoreBtn.removeEventListener('click', this._listeners.onToggleMoreBtnClick);
    (_el$clearBtn = el.clearBtn) === null || _el$clearBtn === void 0 ? void 0 : _el$clearBtn.removeEventListener('click', this._listeners.onClearBtnClick);
    (_el$section = el.section) === null || _el$section === void 0 ? void 0 : _el$section.removeEventListener('input', this._listeners.onSectionInput);
    (_el$section2 = el.section) === null || _el$section2 === void 0 ? void 0 : _el$section2.removeEventListener('change', this._listeners.onSectionChange);
    (_el$section3 = el.section) === null || _el$section3 === void 0 ? void 0 : _el$section3.removeEventListener('click', this._listeners.onSectionClick);

    // Funções nomeadas
    this._listeners.onFetchBtnClick = this.onFetchBtnClick.bind(this);
    this._listeners.onToggleBtnClick = this.onToggleBtnClick.bind(this);
    this._listeners.onToggleMoreBtnClick = this.onToggleMoreBtnClick.bind(this);
    this._listeners.onClearBtnClick = this.onClearBtnClick.bind(this);
    this._listeners.onSectionInput = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .debounce */ .sg(this.onSectionInput.bind(this), 300);
    this._listeners.onSectionChange = this.onSectionChange.bind(this);
    this._listeners.onSectionClick = this.onSectionClick.bind(this);

    // Adiciona
    (_el$fetchBtn2 = el.fetchBtn) === null || _el$fetchBtn2 === void 0 ? void 0 : _el$fetchBtn2.addEventListener('click', this._listeners.onFetchBtnClick);
    (_el$toggleBtn2 = el.toggleBtn) === null || _el$toggleBtn2 === void 0 ? void 0 : _el$toggleBtn2.addEventListener('click', this._listeners.onToggleBtnClick);
    (_el$toggleMoreBtn2 = el.toggleMoreBtn) === null || _el$toggleMoreBtn2 === void 0 ? void 0 : _el$toggleMoreBtn2.addEventListener('click', this._listeners.onToggleMoreBtnClick);
    (_el$clearBtn2 = el.clearBtn) === null || _el$clearBtn2 === void 0 ? void 0 : _el$clearBtn2.addEventListener('click', this._listeners.onClearBtnClick);
    (_el$section4 = el.section) === null || _el$section4 === void 0 ? void 0 : _el$section4.addEventListener('input', this._listeners.onSectionInput);
    (_el$section5 = el.section) === null || _el$section5 === void 0 ? void 0 : _el$section5.addEventListener('change', this._listeners.onSectionChange);
    (_el$section6 = el.section) === null || _el$section6 === void 0 ? void 0 : _el$section6.addEventListener('click', this._listeners.onSectionClick);
  }
  onFetchBtnClick() {
    this.fetchData();
  }
  onToggleBtnClick() {
    this.toggleSection();
  }
  onToggleMoreBtnClick() {
    this.toggleMoreFilters();
  }
  onClearBtnClick() {
    this.clearFilters();
  }
  onSectionInput(e) {
    if (e.target.matches("input[type='text'], input[type='date']")) {
      this.applyFiltersAndRender();
    }
  }
  onSectionChange(e) {
    if (e.target.matches("select, input[type='checkbox']")) {
      if (e.target.closest('.filter-select-group')) {
        this.handleFetchTypeChange(e.target);
      } else {
        this.applyFiltersAndRender();
      }
    }
    if (e.target.id === `${this.prefix}-saved-filters-select`) this.loadFilterSet();
  }
  onSectionClick(e) {
    const target = e.target;
    const sortHeader = target.closest('.sort-header');
    if (sortHeader) this.handleSort(sortHeader.dataset.sortKey);
    if (target.closest(`#${this.prefix}-save-filter-btn`)) this.saveFilterSet();
    if (target.closest(`#${this.prefix}-delete-filter-btn`)) this.deleteFilterSet();
    if (target.closest('.clear-automation-btn')) {
      this.clearAutomationFeedbackAndFilters(true);
    }
  }
  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearFilters(false); // Reseta os filtros para o padrão ao trocar de paciente.
    this.clearAutomationFeedbackAndFilters(false);
    this.applyFiltersAndRender();
    if (this.elements.section) {
      this.elements.section.style.display = patient ? 'block' : 'none';
    }
    if (patient && this.globalSettings.userPreferences[`autoLoad${this.sectionKey.charAt(0).toUpperCase() + this.sectionKey.slice(1)}`]) {
      this.fetchData();
    }
  }
  async fetchData() {
    if (!this.currentPatient) {
      if (this.elements.section.style.display !== 'none') _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG('Nenhum paciente selecionado.');
      return;
    }
    if (this.isLoading) return;
    this.isLoading = true;
    this.elements.content.innerHTML = '<p class="text-slate-500">Carregando...</p>';
    try {
      var _this$elements$mainFi;
      const fetchTypeElement = (_this$elements$mainFi = this.elements.mainFilters) === null || _this$elements$mainFi === void 0 ? void 0 : _this$elements$mainFi.querySelector(`#${this.prefix}-fetch-type-buttons`);
      if (fetchTypeElement) {
        this.fetchType = fetchTypeElement.value;
      }
      const dataInicialValue = this.elements.dateInitial ? this.elements.dateInitial.value : null;
      const dataFinalValue = this.elements.dateFinal ? this.elements.dateFinal.value : null;
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: dataInicialValue ? new Date(dataInicialValue).toLocaleDateString('pt-BR') : '01/01/1900',
        dataFinal: dataFinalValue ? new Date(dataFinalValue).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        type: this.fetchType
      };
      if (this.sectionKey === 'exams') {
        params.comResultado = this.fetchType === 'withResult' || this.fetchType === 'all';
        params.semResultado = this.fetchType === 'withoutResult' || this.fetchType === 'all';
      }
      const result = await this.config.fetchFunction(params);
      this.allData = Array.isArray(result) ? result : result.jsonData || [];
    } catch (error) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SECTION_DATA_FETCH', `Erro ao buscar dados para ${this.sectionKey}`, {
        sectionKey: this.sectionKey,
        errorMessage: error.message
      });
      const sectionNameMap = {
        consultations: 'consultas',
        exams: 'exames',
        appointments: 'agendamentos',
        regulations: 'regulações',
        documents: 'documentos'
      };
      const friendlyName = sectionNameMap[this.sectionKey] || this.sectionKey;
      _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG(`Erro ao buscar ${friendlyName}. Verifique a conexão e a URL base.`);
      this.allData = [];
    } finally {
      this.isLoading = false;
      this.applyFiltersAndRender();
    }
  }
  applyFiltersAndRender() {
    let filteredData = [...this.allData];
    if (this.config.filterLogic) {
      filteredData = this.config.filterLogic(filteredData, this.getFilterValues(), this.fetchType);
    }
    const sortedData = this.sortData(filteredData);
    this.config.renderFunction(sortedData, this.sortState, this.globalSettings);
    this.updateActiveFiltersIndicator();
  }
  sortData(data) {
    const {
      key,
      order
    } = this.sortState;
    return [...data].sort((a, b) => {
      let valA, valB;
      if (key === 'date' || key === 'sortableDate') {
        valA = a.sortableDate || _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .parseDate */ ._U(a.date);
        valB = b.sortableDate || _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .parseDate */ ._U(b.date);
      } else {
        valA = (a[key] || '').toString().toLowerCase();
        valB = (b[key] || '').toString().toLowerCase();
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
  getFilterValues() {
    const values = {};
    const filters = _filter_config_js__WEBPACK_IMPORTED_MODULE_1__/* .filterConfig */ .J[this.sectionKey] || [];
    filters.forEach(filter => {
      if (filter.type === 'component') return;
      const el = document.getElementById(filter.id);
      if (el) {
        values[filter.id] = el.type === 'checkbox' ? el.checked : el.value;
      }
    });
    return values;
  }
  toggleSection() {
    var _this$elements$wrappe;
    (_this$elements$wrappe = this.elements.wrapper) === null || _this$elements$wrappe === void 0 ? void 0 : _this$elements$wrappe.classList.toggle('show');
    this.elements.toggleBtn.textContent = this.elements.wrapper.classList.contains('show') ? 'Recolher' : 'Expandir';
  }
  toggleMoreFilters() {
    const shouldShow = !this.elements.moreFilters.classList.contains('show');
    this.elements.moreFilters.classList.toggle('show', shouldShow);
    this.elements.toggleMoreBtn.querySelector('.button-text').textContent = shouldShow ? 'Menos filtros' : 'Mais filtros';
    this.updateActiveFiltersIndicator();
  }
  clearFilters(shouldRender = true) {
    const sectionLayout = this.globalSettings.filterLayout[this.sectionKey] || [];
    const layoutMap = new Map(sectionLayout.map(f => [f.id, f]));

    // --- INÍCIO DA CORREÇÃO ---
    // Reseta o período de busca para o padrão global da seção
    const dateRangeDefaults = this.globalSettings.userPreferences.dateRangeDefaults;
    const defaultRanges = {
      consultations: {
        start: -6,
        end: 0
      },
      exams: {
        start: -6,
        end: 0
      },
      appointments: {
        start: -1,
        end: 3
      },
      regulations: {
        start: -12,
        end: 0
      },
      documents: {
        start: -24,
        end: 0
      }
    };
    const range = dateRangeDefaults[this.sectionKey] || defaultRanges[this.sectionKey];
    if (this.elements.dateInitial) this.elements.dateInitial.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(range.start);
    if (this.elements.dateFinal) this.elements.dateFinal.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(range.end);
    // --- FIM DA CORREÇÃO ---

    (_filter_config_js__WEBPACK_IMPORTED_MODULE_1__/* .filterConfig */ .J[this.sectionKey] || []).forEach(filter => {
      if (filter.type === 'component') return;
      const el = document.getElementById(filter.id);
      if (el) {
        const savedFilterSettings = layoutMap.get(filter.id);
        let defaultValue;
        if (savedFilterSettings && savedFilterSettings.defaultValue !== undefined) {
          defaultValue = savedFilterSettings.defaultValue;
        } else {
          var _filter$defaultChecke;
          defaultValue = (_filter$defaultChecke = filter.defaultChecked) !== null && _filter$defaultChecke !== void 0 ? _filter$defaultChecke : filter.options ? filter.options[0].value : '';
        }
        if (el.type === 'checkbox') {
          el.checked = defaultValue;
        } else {
          el.value = defaultValue;
        }
        if (el.classList.contains('filter-select-group')) {
          this.handleFetchTypeChange(el);
        }
      }
    });
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }
  handleSort(sortKey) {
    if (this.sortState.key === sortKey) {
      this.sortState.order = this.sortState.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState.key = sortKey;
      this.sortState.order = 'desc';
    }
    this.applyFiltersAndRender();
  }
  handleFetchTypeChange(element) {
    this.fetchType = element.value || element.dataset.fetchType;
    this.fetchData();
  }
  updateActiveFiltersIndicator() {
    var _this$elements$toggle;
    const indicator = (_this$elements$toggle = this.elements.toggleMoreBtn) === null || _this$elements$toggle === void 0 ? void 0 : _this$elements$toggle.querySelector('span:not(.button-text)');
    if (!indicator || !this.elements.moreFilters) return;
    const isShown = this.elements.moreFilters.classList.contains('show');
    let activeCount = 0;
    const filterElements = this.elements.moreFilters.querySelectorAll('input, select');
    filterElements.forEach(el => {
      if ((el.type === 'select-one' || el.type === 'select') && el.value !== 'todos' && el.value !== 'todas' && el.value !== '' && el.value !== 'all') activeCount++;else if (el.type === 'text' && el.value.trim() !== '') activeCount++;else if (el.type === 'checkbox' && el.checked) activeCount++;
    });
    if (activeCount > 0 && !isShown) {
      indicator.textContent = activeCount;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }
  saveFilterSet() {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Digite um nome para o conjunto de filtros:');
    if (!name || name.trim() === '') {
      _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG('Nome inválido. O filtro não foi salvo.');
      return;
    }
    const savedSets = _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getSavedFilterSets();
    if (!savedSets[this.sectionKey]) {
      savedSets[this.sectionKey] = [];
    }
    const existingIndex = savedSets[this.sectionKey].findIndex(set => set.name === name);
    const filterValues = this.getFilterValues();
    const newSet = {
      name,
      values: filterValues
    };
    if (existingIndex > -1) {
      savedSets[this.sectionKey][existingIndex] = newSet;
    } else {
      savedSets[this.sectionKey].push(newSet);
    }
    browser.storage.local.set({
      savedFilterSets: savedSets
    });
    _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.setSavedFilterSets(savedSets);
    _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG(`Filtro "${name}" salvo com sucesso.`, 'success');
  }
  loadFilterSet() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    const name = select.value;
    if (!name) return;
    const set = (_store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getSavedFilterSets()[this.sectionKey] || []).find(s => s.name === name);
    if (!set) return;
    Object.entries(set.values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = value;else el.value = value;
        if (el.classList.contains('filter-select-group')) {
          this.handleFetchTypeChange(el);
        }
      }
    });
    this.applyFiltersAndRender();
  }
  deleteFilterSet() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    const name = select.value;
    if (!name) {
      _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG('Selecione um filtro para apagar.');
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmation = window.confirm(`Tem certeza que deseja apagar o filtro "${name}"?`);
    if (!confirmation) return;
    const savedSets = _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getSavedFilterSets();
    savedSets[this.sectionKey] = (savedSets[this.sectionKey] || []).filter(set => set.name !== name);
    browser.storage.local.set({
      savedFilterSets: savedSets
    });
    _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.setSavedFilterSets(savedSets);
    _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .showMessage */ .rG(`Filtro "${name}" apagado.`, 'success');
  }
  populateSavedFilterDropdown() {
    const select = document.getElementById(`${this.prefix}-saved-filters-select`);
    if (!select) return;
    const currentSelection = select.value;
    select.innerHTML = '<option value="">Carregar filtro...</option>';
    const sets = _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getSavedFilterSets()[this.sectionKey] || [];
    sets.forEach(set => {
      const option = document.createElement('option');
      option.value = set.name;
      option.textContent = set.name;
      select.appendChild(option);
    });
    select.value = currentSelection;
  }
  renderFilterControls() {
    try {
      const sectionFilters = _filter_config_js__WEBPACK_IMPORTED_MODULE_1__/* .filterConfig */ .J[this.sectionKey] || [];
      const sectionLayout = this.globalSettings.filterLayout[this.sectionKey] || [];
      const layoutMap = new Map(sectionLayout.map(f => [f.id, f]));
      const sortedItems = [...sectionFilters].sort((a, b) => {
        var _layoutMap$get$order, _layoutMap$get, _layoutMap$get$order2, _layoutMap$get2;
        const orderA = (_layoutMap$get$order = (_layoutMap$get = layoutMap.get(a.id)) === null || _layoutMap$get === void 0 ? void 0 : _layoutMap$get.order) !== null && _layoutMap$get$order !== void 0 ? _layoutMap$get$order : Infinity;
        const orderB = (_layoutMap$get$order2 = (_layoutMap$get2 = layoutMap.get(b.id)) === null || _layoutMap$get2 === void 0 ? void 0 : _layoutMap$get2.order) !== null && _layoutMap$get$order2 !== void 0 ? _layoutMap$get$order2 : Infinity;
        return orderA - orderB;
      });
      if (this.elements.mainFilters) this.elements.mainFilters.innerHTML = '';
      if (this.elements.moreFilters) this.elements.moreFilters.innerHTML = '';
      sortedItems.forEach(item => {
        var _layoutMap$get3;
        const location = ((_layoutMap$get3 = layoutMap.get(item.id)) === null || _layoutMap$get3 === void 0 ? void 0 : _layoutMap$get3.location) || item.defaultLocation;
        const container = location === 'main' ? this.elements.mainFilters : this.elements.moreFilters;
        if (container) {
          let element;
          if (item.type === 'component') {
            element = this.createUiComponent(item.componentName);
          } else {
            element = this.createFilterElement(item);
          }
          if (element) {
            container.appendChild(element);
          }
        }
      });
    } catch (e) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SECTION_FILTER_RENDER', `Erro ao renderizar filtros para ${this.sectionKey}`, {
        sectionKey: this.sectionKey,
        errorMessage: e.message
      });
    }
  }
  createUiComponent(componentName) {
    switch (componentName) {
      case 'date-range':
        return this.renderDateRangeComponent();
      case 'saved-filters':
        return this.renderSavedFiltersComponent();
      default:
        return null;
    }
  }
  renderDateRangeComponent() {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-2 gap-4 text-sm';
    container.innerHTML = `
        <div>
            <label for="${this.prefix}-date-initial" class="block font-medium">Data Inicial</label>
            <input type="date" id="${this.prefix}-date-initial" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
        <div>
            <label for="${this.prefix}-date-final" class="block font-medium">Data Final</label>
            <input type="date" id="${this.prefix}-date-final" class="mt-1 w-full px-2 py-1 border border-slate-300 rounded-md"/>
        </div>
      `;
    this.elements.dateInitial = container.querySelector(`#${this.prefix}-date-initial`);
    this.elements.dateFinal = container.querySelector(`#${this.prefix}-date-final`);
    return container;
  }
  renderSavedFiltersComponent() {
    const container = document.createElement('div');
    container.className = 'mt-4 pt-4 border-t';
    container.id = `${this.prefix}-saved-filters-container`;
    container.innerHTML = `
      <h3 class="text-sm font-semibold text-slate-600 mt-3 mb-2">Filtros Salvos</h3>
      <div class="flex items-center gap-2">
        <select id="${this.prefix}-saved-filters-select" class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md bg-white text-sm" title="Carregar um filtro salvo">
          <option value="">Carregar filtro...</option>
        </select>
        <button id="${this.prefix}-saved-filters-load" class="px-2 py-1 bg-blue-500 text-white rounded-md text-sm">Carregar</button>
        <button id="${this.prefix}-saved-filters-delete" class="px-2 py-1 bg-red-500 text-white rounded-md text-sm">Excluir</button>
      </div>
    `;
    return container;
  }
  applyAutomationFilters(filterSettings, ruleName) {
    if (!filterSettings) return;

    // --- INÍCIO DA CORREÇÃO ---
    // Aplica o período de busca da regra, se definido
    if (filterSettings.dateRange) {
      const {
        start,
        end
      } = filterSettings.dateRange;
      if (this.elements.dateInitial && start !== null && !isNaN(start)) {
        this.elements.dateInitial.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(start);
      }
      if (this.elements.dateFinal && end !== null && !isNaN(end)) {
        this.elements.dateFinal.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(end);
      }
    }
    // --- FIM DA CORREÇÃO ---

    Object.entries(filterSettings).forEach(([filterId, value]) => {
      // Pula a propriedade dateRange que já foi tratada
      if (filterId === 'dateRange') return;
      const el = document.getElementById(filterId);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = value;
        } else {
          el.value = value;
        }
      }
    });
    this.fetchData();
    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center">
                <span>Filtro automático aplicado: <strong>${ruleName}</strong></span>
                <button class="clear-automation-btn text-blue-800 hover:text-blue-900 font-bold" title="Limpar filtro automático">&times;</button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove('hidden');
    }
  }
  clearAutomationFeedbackAndFilters(shouldRender = true) {
    if (this.elements.automationFeedback && !this.elements.automationFeedback.classList.contains('hidden')) {
      this.elements.automationFeedback.classList.add('hidden');
      this.elements.automationFeedback.innerHTML = '';
      this.clearFilters(false);
    }
    if (shouldRender) {
      this.applyFiltersAndRender();
    }
  }
}

/***/ }),

/***/ 574:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $4: () => (/* binding */ fetchRegulationPriorities),
/* harmony export */   $_: () => (/* binding */ getBaseUrl),
/* harmony export */   DM: () => (/* binding */ fetchRegulationAttachmentUrl),
/* harmony export */   EI: () => (/* binding */ fetchAppointmentDetails),
/* harmony export */   GP: () => (/* binding */ fetchCadsusData),
/* harmony export */   K4: () => (/* binding */ fetchExamesSolicitados),
/* harmony export */   Ns: () => (/* binding */ fetchAppointments),
/* harmony export */   P_: () => (/* binding */ fetchDocuments),
/* harmony export */   Pn: () => (/* binding */ fetchExamAppointmentDetails),
/* harmony export */   Sp: () => (/* binding */ fetchResultadoExame),
/* harmony export */   Tp: () => (/* binding */ fetchVisualizaUsuario),
/* harmony export */   bW: () => (/* binding */ searchPatients),
/* harmony export */   hr: () => (/* binding */ fetchRegulationDetails),
/* harmony export */   lQ: () => (/* binding */ fetchAllTimelineData),
/* harmony export */   pP: () => (/* binding */ fetchDocumentUrl),
/* harmony export */   v0: () => (/* binding */ fetchAllRegulations),
/* harmony export */   wF: () => (/* binding */ fetchAllConsultations)
/* harmony export */ });
/* unused harmony exports clearRegulationLock, fetchProntuarioHash, fetchConsultasEspecializadas, fetchConsultasBasicas, fetchRegulationAttachments, keepSessionAlive */
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
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('SIGSS_API', 'Não foi possível buscar as prioridades de regulação', {
        status: response.status,
        statusText: response.statusText
      });
      return [];
    }
    const data = await response.json();
    // Filtra apenas as ativas e ordena pela ordem de exibição definida no sistema
    return data.filter(p => p.coreIsAtivo === 't').sort((a, b) => a.coreOrdemExibicao - b.coreOrdemExibicao);
  } catch (error) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SIGSS_API', 'Erro de rede ao buscar prioridades', {
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
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SESSION_MANAGEMENT', 'A resposta do servidor não foi JSON. Provável expiração de sessão', {
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
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('CADSUS_API', 'A busca no CADSUS falhou', {
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
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logError */ .vV)('SIGSS_API', 'Falha ao buscar detalhes do agendamento', {
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
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('SIGSS_API', 'Falha ao buscar detalhes para o agendamento', {
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
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('SIGSS_API', 'Falha ao buscar anexos para regulação', {
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
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_0__/* .logWarning */ .FF)('TIMELINE_API', 'Falha em chamada de API para a timeline', {
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
      logWarning('SESSION_MANAGEMENT', 'Keep-alive falhou', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
    const data = await response.json();
    logInfo('SESSION_MANAGEMENT', 'Sessão mantida ativa', {
      sessionActive: true,
      hasSessionData: !!data
    });
    return true;
  } catch (error) {
    logError('SESSION_MANAGEMENT', 'Erro ao manter sessão ativa', {
      errorMessage: error.message
    });
    return false;
  }
}

/***/ }),

/***/ 690:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IC: () => (/* binding */ renderRegulations),
/* harmony export */   Rb: () => (/* binding */ renderExams),
/* harmony export */   lT: () => (/* binding */ renderAppointments),
/* harmony export */   rX: () => (/* binding */ renderConsultations),
/* harmony export */   s8: () => (/* binding */ renderTimeline),
/* harmony export */   zL: () => (/* binding */ renderDocuments)
/* harmony export */ });
/* harmony import */ var _SectionManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(338);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(239);
/**
 * @file Contém todas as funções responsáveis por gerar o HTML dos resultados.
 */



function renderConsultations(consultations, sortState) {
  const contentDiv = document.getElementById('consultations-content');
  if (!contentDiv) return;
  if (consultations.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhuma consulta encontrada para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="specialty">Especialidade/Profissional <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('specialty', sortState)}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="sortableDate">Data <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('sortableDate', sortState)}</span></span>
    </div>
  `;
  contentDiv.innerHTML = headers + consultations.map(c => `
        <div class="p-3 mb-3 border rounded-lg ${c.isNoShow ? 'bg-red-50 border-red-200' : 'bg-white'} consultation-item">
            <div class="flex justify-between items-start cursor-pointer consultation-header">
                <div>
                    <p class="font-bold text-blue-700 pointer-events-none">${c.specialty}</p>
                    <p class="text-sm text-slate-600 pointer-events-none">${c.professional}</p>
                </div>
                <p class="text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap text-right pointer-events-none">${c.date.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="consultation-body collapse-section show">
                ${c.isNoShow ? '<p class="text-center font-bold text-red-600 mt-2">PACIENTE FALTOU</p>' : `
                <p class="text-sm text-slate-500 mt-1">${c.unit}</p>
                <div class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    ${c.details.map(d => `<p class="text-xs font-semibold text-slate-500 uppercase">${d.label}</p><p class="text-sm text-slate-700 whitespace-pre-wrap">${d.value.replace(/\n/g, '<br>')} <span class="copy-icon" title="Copiar" data-copy-text="${d.value}">📄</span></p>`).join('')}
                </div>`}
            </div>
        </div>
    `).join('');
}
function renderExams(exams, sortState) {
  const contentDiv = document.getElementById('exams-content');
  if (!contentDiv) return;
  if (exams.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhum exame encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="examName">Nome do Exame <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('examName', sortState)}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('date', sortState)}</span></span>
    </div>
  `;
  contentDiv.innerHTML = headers + exams.map(exam => {
    const idp = exam.resultIdp;
    const ids = exam.resultIds;
    const idpStr = idp !== null && idp !== undefined ? String(idp) : '';
    const idsStr = ids !== null && ids !== undefined ? String(ids) : '';
    const showBtn = exam.hasResult && idp !== null && idp !== undefined && ids !== null && ids !== undefined && idpStr !== '' && idsStr !== '';
    return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <p class="font-semibold text-indigo-700">${exam.examName || 'Nome do exame não informado'} <span class="copy-icon" title="Copiar" data-copy-text="${exam.examName}">📄</span></p>
            <div class="text-sm text-slate-500 mt-1">
                <p>Solicitado por: ${exam.professional || 'Não informado'} (${exam.specialty || 'N/A'})</p>
                <p>Data: ${exam.date || 'Não informada'}</p>
            </div>
            ${showBtn ? `<button class="view-exam-result-btn mt-2 w-full text-sm bg-green-100 text-green-800 py-1 rounded hover:bg-green-200" data-idp="${idpStr}" data-ids="${idsStr}">Visualizar Resultado</button>` : ''}
        </div>
      `;
  }).join('');
}
function renderAppointments(appointments, sortState) {
  const contentDiv = document.getElementById('appointments-content');
  if (!contentDiv) return;
  const statusStyles = {
    AGENDADO: 'bg-blue-100 text-blue-800',
    PRESENTE: 'bg-green-100 text-green-800',
    FALTOU: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-yellow-100 text-yellow-800',
    ATENDIDO: 'bg-purple-100 text-purple-800'
  };
  if (appointments.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhum agendamento encontrado para o filtro selecionado.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="specialty">Especialidade <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('specialty', sortState)}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('status', sortState)}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('date', sortState)}</span></span>
    </div>
  `;
  contentDiv.innerHTML = headers + appointments.map(item => {
    const style = statusStyles[item.status] || 'bg-gray-100 text-gray-800';
    let typeText = item.type;
    if (item.isSpecialized) {
      typeText = 'CONSULTA ESPECIALIZADA';
    } else if (item.isOdonto) {
      typeText = 'CONSULTA ODONTO';
    } else if (item.type.toUpperCase().includes('EXAME')) {
      typeText = 'EXAME';
    }
    const [idp, ids] = item.id.split('-');
    return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${typeText}</p>
                    <p class="text-sm text-indigo-600 font-medium">${item.specialty || 'Sem especialidade'}</p>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${item.status}</span>
            </div>
            <div class="text-sm text-slate-500 mt-2 border-t pt-2">
                <p><strong>Data:</strong> ${item.date} às ${item.time}</p>
                <p><strong>Local:</strong> ${item.location}</p>
                <p><strong>Profissional:</strong> ${item.professional}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t">
                 <button class="view-appointment-details-btn text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${idp || ''}" data-ids="${ids || ''}" data-type="${item.type}">
                    Ver Detalhes
                </button>
            </div>
        </div>
      `;
  }).join('');
}
function renderRegulations(regulations, sortState, globalSettings) {
  const contentDiv = document.getElementById('regulations-content');
  if (!contentDiv) return;
  const priorityNameMap = new Map();
  const priorityColorMap = new Map();
  if (globalSettings && globalSettings.regulationPriorities) {
    globalSettings.regulationPriorities.forEach(prio => {
      priorityNameMap.set(prio.coreDescricao, prio.coreDescricao);
      priorityColorMap.set(prio.coreDescricao, prio.coreCor);
    });
  }
  const statusStyles = {
    AUTORIZADO: 'bg-green-100 text-green-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    NEGADO: 'bg-red-100 text-red-800',
    DEVOLVIDO: 'bg-orange-100 text-orange-800',
    CANCELADA: 'bg-gray-100 text-gray-800',
    'EM ANÁLISE': 'bg-blue-100 text-blue-800'
  };
  if (regulations.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhum resultado encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="procedure">Procedimento <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('procedure', sortState)}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('status', sortState)}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('date', sortState)}</span></span>
    </div>
  `;
  contentDiv.innerHTML = headers + regulations.map(item => {
    const statusKey = (item.status || '').toUpperCase();
    const style = statusStyles[statusKey] || 'bg-gray-100 text-gray-800';
    const priorityKey = (item.priority || '').toUpperCase();
    const priorityColor = priorityColorMap.get(priorityKey) || 'CCCCCC';
    const textColor = _utils_js__WEBPACK_IMPORTED_MODULE_1__/* .getContrastYIQ */ .Eg(priorityColor);
    const priorityStyle = `background-color: #${priorityColor}; color: ${textColor};`;
    const priorityText = priorityNameMap.get(priorityKey) || item.priority;
    const typeText = (item.type || '').startsWith('CON') ? 'CONSULTA' : 'EXAME';
    const typeColor = typeText === 'CONSULTA' ? 'text-cyan-700' : 'text-fuchsia-700';
    const attachmentsHtml = item.attachments && item.attachments.length > 0 ? `
            <div class="mt-2 pt-2 border-t border-slate-100">
                <p class="text-xs font-semibold text-slate-500 mb-1">ANEXOS:</p>
                <div class="space-y-1">
                    ${item.attachments.map(att => `
                        <button class="view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center" data-idp="${att.idp}" data-ids="${att.ids}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
                                <span class="truncate" title="${att.description} (${att.fileType.toUpperCase()})">${att.description} (${att.fileType.toUpperCase()})</span>
                            </div>
                            <span class="text-xs text-slate-400 flex-shrink-0 ml-2">${att.date}</span>
                        </button>`).join('')}
                </div>
            </div>
            ` : '';
    return `
            <div class="p-3 mb-3 border rounded-lg bg-white">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                           <p class="font-bold ${typeColor}">${typeText}</p>
                           <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="${priorityStyle}">${priorityText}</span>
                        </div>
                        <p class="text-sm text-slate-800 font-medium">${item.procedure} <span class="copy-icon" title="Copiar" data-copy-text="${item.procedure}">📄</span></p>
                        <p class="text-xs text-slate-500">${item.cid} <span class="copy-icon" title="Copiar" data-copy-text="${item.cid}">📄</span></p>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${item.status}</span>
                </div>
                <div class="text-sm text-slate-500 mt-2 border-t pt-2 space-y-1">
                    <p><strong>Data:</strong> ${item.date}</p>
                    <p><strong>Solicitante:</strong> ${item.requester}</p>
                    <p><strong>Executante:</strong> ${item.provider || 'Não definido'}</p>
                </div>
                <div class="mt-2 pt-2 border-t">
                     <button class="view-regulation-details-btn w-full text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${item.idp}" data-ids="${item.ids}">
                        Visualizar Detalhes
                    </button>
                </div>
                ${attachmentsHtml}
            </div>
      `;
  }).join('');
}
function renderDocuments(documents, sortState) {
  const contentDiv = document.getElementById('documents-content');
  if (!contentDiv) return;
  if (!documents || documents.length === 0) {
    contentDiv.innerHTML = '<p class="text-slate-500">Nenhum documento encontrado.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="description">Descrição <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('description', sortState)}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${(0,_SectionManager_js__WEBPACK_IMPORTED_MODULE_0__/* .getSortIndicator */ .Q)('date', sortState)}</span></span>
    </div>
  `;
  contentDiv.innerHTML = headers + documents.map(doc => `
        <div class="p-3 mb-2 border rounded-lg bg-white">
            <p class="font-semibold text-gray-800">${doc.description}</p>
            <div class="text-sm text-slate-500 mt-1">
                <span>Data: ${doc.date}</span> |
                <span class="font-medium">Tipo: ${doc.fileType.toUpperCase()}</span>
            </div>
            <button class="view-document-btn mt-2 w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200" data-idp="${doc.idp}" data-ids="${doc.ids}">
                Visualizar Documento
            </button>
        </div>
      `).join('');
}

/**
 * Renders the timeline based on the provided events and status.
 * @param {Array<object>} events - The array of timeline event objects.
 * @param {'loading'|'empty'|'error'|'success'} status - The current status of the timeline.
 */
function renderTimeline(events, status) {
  const contentDiv = document.getElementById('timeline-content');
  if (!contentDiv) return;
  const eventTypeStyles = {
    consultation: {
      label: 'Consulta',
      color: 'blue',
      bgColorClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      icon: 'M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3m-6-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'
    },
    exam: {
      label: 'Exame',
      color: 'green',
      bgColorClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
      icon: 'M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3'
    },
    appointment: {
      label: 'Agendamento',
      color: 'purple',
      bgColorClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      icon: 'M8 2v4M16 2v4M3 10h18M3 4h18v16H3zM9 16l2 2 4-4'
    },
    regulation: {
      label: 'Regulação',
      color: 'red',
      bgColorClass: 'bg-red-100',
      iconColorClass: 'text-red-600',
      icon: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4'
    },
    // --- INÍCIO DA MODIFICAÇÃO ---
    document: {
      label: 'Documento',
      color: 'gray',
      bgColorClass: 'bg-gray-100',
      iconColorClass: 'text-gray-600',
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6'
    }
    // --- FIM DA MODIFICAÇÃO ---
  };
  let contentHtml = '';
  switch (status) {
    case 'loading':
      contentHtml = '<p class="text-slate-500 text-center">A carregar linha do tempo...</p>';
      break;
    case 'empty':
      contentHtml = '<p class="text-slate-500 text-center">Nenhum evento encontrado para este paciente.</p>';
      break;
    case 'error':
      contentHtml = '<p class="text-red-500 text-center">Ocorreu um erro ao carregar os dados. Tente novamente.</p>';
      break;
    case 'success':
      if (events.length === 0) {
        contentHtml = '<p class="text-slate-500 text-center">Nenhum evento encontrado para os filtros aplicados.</p>';
        break;
      }
      contentHtml = '<div class="relative space-y-4">';
      contentHtml += '<div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>';
      contentHtml += events.map(event => {
        const style = eventTypeStyles[event.type] || {
          label: 'Evento',
          color: 'gray',
          icon: ''
        };
        const dateString = event.date instanceof Date && !isNaN(event.date) ? event.date.toLocaleDateString('pt-BR') : 'Data Inválida';
        let topRightDetailsHtml = '';
        let extraInfoHtml = '';
        if (event.type === 'appointment') {
          const a = event.details;
          const [idp, ids] = a.id.split('-');
          const statusStyles = {
            AGENDADO: 'text-blue-600',
            PRESENTE: 'text-green-600',
            FALTOU: 'text-red-600',
            CANCELADO: 'text-yellow-600',
            ATENDIDO: 'text-purple-600'
          };
          const statusClass = statusStyles[a.status] || 'text-slate-600';
          const timeHtml = `<div class="text-xs text-slate-500">às ${a.time}</div>`;
          const statusHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${a.status}</div>`;
          const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
          const detailsButtonHtml = `<button class="view-appointment-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${idp}" data-ids="${ids}" data-type="${a.type}">${icon}<span>Detalhes</span></button>`;
          topRightDetailsHtml = timeHtml + statusHtml + detailsButtonHtml;
        } else if (event.type === 'exam') {
          const statusText = event.details.hasResult ? 'Com Resultado' : 'Sem Resultado';
          const statusClass = event.details.hasResult ? 'text-green-600' : 'text-yellow-600';
          topRightDetailsHtml = `<div class="mt-1 text-xs font-semibold ${statusClass}">${statusText}</div>`;
          if (event.details.hasResult && event.details.resultIdp && event.details.resultIds) {
            topRightDetailsHtml += `<button class="view-exam-result-btn mt-2 text-xs bg-green-100 text-green-800 py-1 px-3 rounded hover:bg-green-200" data-idp="${event.details.resultIdp}" data-ids="${event.details.resultIds}">Visualizar Resultado</button>`;
          }
        } else if (event.type === 'regulation') {
          const r = event.details;
          if (r.idp && r.ids) {
            const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
            topRightDetailsHtml = `<button class="view-regulation-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1" data-idp="${r.idp}" data-ids="${r.ids}">${icon}<span>Detalhes</span></button>`;
          }
        }
        if (event.type === 'consultation') {
          const c = event.details;
          const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-search-2"><path d="M14 2v6h6"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m9 21-1.5-1.5"/></svg>';
          topRightDetailsHtml = `<button class="timeline-toggle-details-btn mt-2 text-xs bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200 flex items-center gap-1">${icon}<span>Detalhes</span></button>`;
          extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    <p class="text-sm text-slate-500 mb-2">${c.unit}</p>
                    ${c.details.map(d => `
                        <p class="text-xs font-semibold text-slate-500 uppercase mb-1">${d.label}</p>
                        <p class="text-sm text-slate-700 mb-2">${d.value.replace(/\n/g, '<br>')} <span class="copy-icon" title="Copiar" data-copy-text="${d.value}">📄</span></p>
                    `).join('')}
                </div>
            `;
        } else if (event.type === 'regulation') {
          const r = event.details;
          const attachmentsHtml = r.attachments && r.attachments.length > 0 ? `
                <div class="mt-2 pt-2 border-t border-slate-100">
                    <p class="text-xs font-semibold text-slate-500 mb-1">ANEXOS:</p>
                    <div class="space-y-1">
                        ${r.attachments.map(att => `
                            <button class="view-regulation-attachment-btn w-full text-left text-sm bg-gray-50 text-gray-700 py-1 px-2 rounded hover:bg-gray-100 flex justify-between items-center" data-idp="${att.idp}" data-ids="${att.ids}">
                                <div class="flex items-center gap-2 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="flex-shrink-0" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/><path d="M4.5 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/></svg>
                                    <span class="truncate" title="${att.description} (${att.fileType.toUpperCase()})">${att.description} (${att.fileType.toUpperCase()})</span>
                                </div>
                                <span class="text-xs text-slate-400 flex-shrink-0 ml-2">${att.date}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                ` : '';
          extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200 text-sm">
                    <p class="mb-1"><strong>Status:</strong> ${r.status}</p>
                    <p class="mb-1"><strong>Prioridade:</strong> ${r.priority}</p>
                    <p class="mb-1"><strong>CID:</strong> ${r.cid}</p>
                    <p class="mb-2"><strong>Executante:</strong> ${r.provider || 'Não definido'}</p>
                    ${attachmentsHtml}
                </div>
            `;
          // --- INÍCIO DA MODIFICAÇÃO ---
        } else if (event.type === 'document') {
          const doc = event.details;
          extraInfoHtml = `
                <div class="timeline-details-body mt-2 pt-2 border-t border-slate-200">
                    <button class="view-document-btn w-full text-sm bg-gray-100 text-gray-800 py-1 rounded hover:bg-gray-200" data-idp="${doc.idp}" data-ids="${doc.ids}">
                        Visualizar Documento
                    </button>
                </div>
            `;
        }
        // --- FIM DA MODIFICAÇÃO ---

        return `
                    <div class="relative pl-10 timeline-item" data-event-type="${event.type}">
                        <div class="absolute left-4 top-2 -ml-[15px] h-[30px] w-[30px] rounded-full ${style.bgColorClass} border-2 border-white flex items-center justify-center ${style.iconColorClass}" title="${style.label}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="${style.icon}" />
                            </svg>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div class="timeline-header cursor-pointer">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-sm font-semibold text-${style.color}-700">${event.title}</p>
                                        <p class="text-xs text-slate-600">${event.summary}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0 ml-2">
                                        <p class="text-xs font-medium text-slate-500">${dateString}</p>
                                        ${topRightDetailsHtml}
                                    </div>
                                </div>
                            </div>
                            ${extraInfoHtml}
                        </div>
                    </div>
                `;
      }).join('');
      contentHtml += '</div>';
      break;
  }
  contentDiv.innerHTML = contentHtml;
}

/***/ }),

/***/ 733:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   J: () => (/* binding */ filterConfig)
/* harmony export */ });
/**
 * Define a configuração padrão para todos os filtros disponíveis na extensão.
 * Este arquivo centraliza a definição de cada filtro, que será usado tanto
 * na página de opções (para configurar a disposição) quanto na barra lateral
 * (para renderização e funcionamento).
 *
 * Estrutura de cada objeto de filtro:
 * - id: Identificador único do elemento HTML.
 * - label: O texto que descreve o filtro na interface.
 * - type: O tipo de elemento ('text', 'select', 'checkbox', 'selectGroup', 'component').
 * - section: A qual seção principal o filtro pertence.
 * - defaultLocation: Onde o filtro aparece por padrão ('main' ou 'more').
 * - componentName: (Apenas para type 'component') O nome do componente a ser renderizado.
 * - placeholder: (Opcional) Texto de exemplo para campos de texto.
 * - options: (Opcional) Um array de objetos {value, text} para 'select' ou 'selectGroup'.
 * - defaultChecked: (Opcional) Estado padrão para 'checkbox'.
 */

const filterConfig = {
  consultations: [{
    id: 'consultation-date-range',
    label: 'Filtro de Datas',
    type: 'component',
    componentName: 'date-range',
    section: 'consultations',
    defaultLocation: 'main'
  }, {
    id: 'consultation-filter-keyword',
    label: 'Busca por Palavra-chave',
    type: 'text',
    section: 'consultations',
    defaultLocation: 'main',
    placeholder: 'Busque em todo o conteúdo...'
  }, {
    id: 'hide-no-show-checkbox',
    label: 'Ocultar faltas',
    type: 'checkbox',
    section: 'consultations',
    defaultLocation: 'main',
    defaultChecked: false
  }, {
    id: 'fetch-type-buttons',
    label: 'Tipo de Consulta',
    type: 'selectGroup',
    section: 'consultations',
    defaultLocation: 'more',
    options: [{
      value: 'all',
      text: 'Todas'
    }, {
      value: 'basic',
      text: 'Básicas'
    }, {
      value: 'specialized',
      text: 'Especializadas'
    }]
  }, {
    id: 'consultation-filter-cid',
    label: 'CID/CIAP',
    type: 'text',
    section: 'consultations',
    defaultLocation: 'more',
    placeholder: 'Ex: A09, Z00...'
  }, {
    id: 'consultation-filter-specialty',
    label: 'Especialidade',
    type: 'text',
    section: 'consultations',
    defaultLocation: 'more',
    placeholder: 'Digite especialidades, separe por vírgula...'
  }, {
    id: 'consultation-filter-professional',
    label: 'Profissional',
    type: 'text',
    section: 'consultations',
    defaultLocation: 'more',
    placeholder: 'Digite nomes, separe por vírgula...'
  }, {
    id: 'consultation-filter-unit',
    label: 'Unidade de Saúde',
    type: 'text',
    section: 'consultations',
    defaultLocation: 'more',
    placeholder: 'Digite unidades, separe por vírgula...'
  }, {
    id: 'consultation-saved-filters',
    label: 'Filtros Salvos',
    type: 'component',
    componentName: 'saved-filters',
    section: 'consultations',
    defaultLocation: 'more'
  }],
  exams: [{
    id: 'exam-date-range',
    label: 'Filtro de Datas',
    type: 'component',
    componentName: 'date-range',
    section: 'exams',
    defaultLocation: 'main'
  }, {
    id: 'exam-fetch-type-buttons',
    label: 'Status do Resultado',
    type: 'selectGroup',
    section: 'exams',
    defaultLocation: 'main',
    options: [{
      value: 'all',
      text: 'Todos'
    }, {
      value: 'withResult',
      text: 'Com Resultado'
    }, {
      value: 'withoutResult',
      text: 'Sem Resultado'
    }]
  }, {
    id: 'exam-filter-name',
    label: 'Nome do Exame',
    type: 'text',
    section: 'exams',
    defaultLocation: 'main',
    placeholder: 'Digite nomes, separe por vírgula...'
  }, {
    id: 'exam-filter-professional',
    label: 'Profissional Solicitante',
    type: 'text',
    section: 'exams',
    defaultLocation: 'more',
    placeholder: 'Digite nomes, separe por vírgula...'
  }, {
    id: 'exam-filter-specialty',
    label: 'Especialidade Solicitante',
    type: 'text',
    section: 'exams',
    defaultLocation: 'more',
    placeholder: 'Digite especialidades, separe por vírgula...'
  }, {
    id: 'exam-saved-filters',
    label: 'Filtros Salvos',
    type: 'component',
    componentName: 'saved-filters',
    section: 'exams',
    defaultLocation: 'more'
  }],
  appointments: [{
    id: 'appointment-date-range',
    label: 'Filtro de Datas',
    type: 'component',
    componentName: 'date-range',
    section: 'appointments',
    defaultLocation: 'main'
  }, {
    id: 'appointment-fetch-type-buttons',
    label: 'Tipo de Agendamento',
    type: 'selectGroup',
    section: 'appointments',
    defaultLocation: 'main',
    options: [{
      value: 'all',
      text: 'Todos'
    }, {
      value: 'consultas',
      text: 'Consultas'
    }, {
      value: 'exames',
      text: 'Exames'
    }]
  }, {
    id: 'appointment-filter-status',
    label: 'Status',
    type: 'select',
    section: 'appointments',
    defaultLocation: 'main',
    options: [{
      value: 'todos',
      text: 'Todos'
    }, {
      value: 'AGENDADO',
      text: 'Agendado'
    }, {
      value: 'PRESENTE',
      text: 'Presente'
    }, {
      value: 'FALTOU',
      text: 'Faltou'
    }, {
      value: 'CANCELADO',
      text: 'Cancelado'
    }, {
      value: 'ATENDIDO',
      text: 'Atendido'
    }]
  }, {
    id: 'appointment-filter-term',
    label: 'Busca por Termo',
    type: 'text',
    section: 'appointments',
    defaultLocation: 'more',
    placeholder: 'Profissional, especialidade...'
  }, {
    id: 'appointment-filter-location',
    label: 'Local',
    type: 'text',
    section: 'appointments',
    defaultLocation: 'more',
    placeholder: 'Digite locais, separe por vírgula...'
  }, {
    id: 'appointment-saved-filters',
    label: 'Filtros Salvos',
    type: 'component',
    componentName: 'saved-filters',
    section: 'appointments',
    defaultLocation: 'more'
  }],
  regulations: [{
    id: 'regulation-date-range',
    label: 'Filtro de Datas',
    type: 'component',
    componentName: 'date-range',
    section: 'regulations',
    defaultLocation: 'main'
  }, {
    id: 'regulation-fetch-type-buttons',
    label: 'Modalidade',
    type: 'selectGroup',
    section: 'regulations',
    defaultLocation: 'main',
    options: [{
      value: 'all',
      text: 'Todos'
    }, {
      value: 'ENC',
      text: 'Consultas'
    }, {
      value: 'EXA',
      text: 'Exames'
    }]
  }, {
    id: 'regulation-filter-status',
    label: 'Status',
    type: 'select',
    section: 'regulations',
    defaultLocation: 'main',
    options: [{
      value: 'todos',
      text: 'Todos'
    }, {
      value: 'AUTORIZADO',
      text: 'Autorizado'
    }, {
      value: 'PENDENTE',
      text: 'Pendente'
    }, {
      value: 'NEGADO',
      text: 'Negado'
    }, {
      value: 'DEVOLVIDO',
      text: 'Devolvido'
    }, {
      value: 'CANCELADA',
      text: 'Cancelada'
    }, {
      value: 'EM ANÁLISE',
      text: 'Em Análise'
    }]
  }, {
    id: 'regulation-filter-priority',
    label: 'Prioridade',
    type: 'select',
    section: 'regulations',
    defaultLocation: 'more',
    options: [{
      value: 'todas',
      text: 'Todas'
    } // Opções serão populadas dinamicamente
    ]
  }, {
    id: 'regulation-filter-procedure',
    label: 'Procedimento/Especialidade',
    type: 'text',
    section: 'regulations',
    defaultLocation: 'more',
    placeholder: 'Ex: Ortopedia, Raio X...'
  }, {
    id: 'regulation-filter-requester',
    label: 'Profissional/Unidade Solicitante',
    type: 'text',
    section: 'regulations',
    defaultLocation: 'more',
    placeholder: 'Digite nomes, separe por vírgula...'
  }, {
    id: 'regulation-saved-filters',
    label: 'Filtros Salvos',
    type: 'component',
    componentName: 'saved-filters',
    section: 'regulations',
    defaultLocation: 'more'
  }],
  documents: [{
    id: 'document-date-range',
    label: 'Filtro de Datas',
    type: 'component',
    componentName: 'date-range',
    section: 'documents',
    defaultLocation: 'main'
  }, {
    id: 'document-filter-keyword',
    label: 'Busca por Palavra-chave',
    type: 'text',
    section: 'documents',
    defaultLocation: 'main',
    placeholder: 'Busque na descrição do documento...'
  }]
};

/***/ }),

/***/ 869:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Q: () => (/* binding */ defaultFieldConfig)
/* harmony export */ });
/* unused harmony export getNestedValue */
/**
 * Define a configuração padrão para os campos da ficha do paciente.
 * Este é o "molde" que a extensão usará se nenhuma configuração personalizada for encontrada.
 *
 * Estrutura de cada objeto de campo:
 * - id: Um identificador único para o campo (usado no HTML).
 * - key: O caminho para acessar o dado no objeto da ficha LOCAL (ex: 'entidadeFisica.entidade.entiNome').
 * - cadsusKey: O índice do dado correspondente no array 'cell' do CADSUS. Null se não houver correspondência.
 * - label: O nome do campo exibido na interface (pode ser editado pelo usuário).
 * - enabled: Se o campo deve ser exibido por padrão.
 * - section: Onde o campo aparece por padrão ('main' para sempre visível, 'more' para "Mostrar Mais").
 * - formatter: (Opcional) Uma função para formatar o valor antes da exibição e comparação.
 */

// Função para obter um valor aninhado de um objeto de forma segura
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Função para normalizar e formatar telefones para exibição
const formatPhone = value => {
  if (!value) return '';
  // Remove todos os caracteres não numéricos, incluindo o DDI 55 que pode vir do CADSUS
  const digits = String(value).replace(/\D/g, '').replace(/^55/, '');
  if (digits.length === 11) {
    // (XX) XXXXX-XXXX
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    // (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value; // Retorna original se não corresponder
};

// Formatter para valores 't' (true) e 'f' (false)
const formatBoolean = value => {
  if (value === 't' || value === true) return 'Sim';
  if (value === 'f' || value === false) return 'Não';
  return value;
};
const defaultFieldConfig = [
// --- Seção Principal (Main) ---
{
  id: 'nomeCompleto',
  key: 'entidadeFisica.entidade.entiNome',
  cadsusKey: 2,
  label: 'Nome',
  enabled: true,
  section: 'main',
  order: 1
}, {
  id: 'cpf',
  key: 'entidadeFisica.entfCPF',
  cadsusKey: 50,
  label: 'CPF',
  enabled: true,
  section: 'main',
  order: 2,
  formatter: value => String(value || '').replace(/\D/g, '') // Normaliza para comparação
}, {
  id: 'cns',
  key: 'isenNumCadSus',
  cadsusKey: cell => (String(cell[1]) || '').split('\n')[0].replace(/\s*\(.*\)/, '').trim(),
  label: 'CNS',
  enabled: true,
  section: 'main',
  order: 3
}, {
  id: 'nomeMae',
  key: 'entidadeFisica.entfNomeMae',
  cadsusKey: 7,
  label: 'Nome da Mãe',
  enabled: true,
  section: 'main',
  order: 4
}, {
  id: 'dtNasc',
  key: 'entidadeFisica.entfDtNasc',
  cadsusKey: 3,
  label: 'Nascimento',
  enabled: true,
  section: 'main',
  order: 5
}, {
  id: 'telefone',
  key: data => {
    var _data$entidadeFisica, _data$entidadeFisica$, _data$entidadeFisica2, _data$entidadeFisica3;
    return `${((_data$entidadeFisica = data.entidadeFisica) === null || _data$entidadeFisica === void 0 ? void 0 : (_data$entidadeFisica$ = _data$entidadeFisica.entidade) === null || _data$entidadeFisica$ === void 0 ? void 0 : _data$entidadeFisica$.entiTel1Pre) || ''}${((_data$entidadeFisica2 = data.entidadeFisica) === null || _data$entidadeFisica2 === void 0 ? void 0 : (_data$entidadeFisica3 = _data$entidadeFisica2.entidade) === null || _data$entidadeFisica3 === void 0 ? void 0 : _data$entidadeFisica3.entiTel1) || ''}`;
  },
  cadsusKey: 16,
  label: 'Telefone',
  enabled: true,
  section: 'main',
  order: 6,
  formatter: formatPhone
},
// --- Seção "Mostrar Mais" (More) ---
{
  id: 'nomeSocial',
  key: 'entidadeFisica.entidade.entiNomeSocial',
  cadsusKey: null,
  label: 'Nome Social',
  enabled: true,
  section: 'more',
  order: 1
}, {
  id: 'rg',
  key: 'entidadeFisica.entfRG',
  cadsusKey: 51,
  // CORRIGIDO
  label: 'RG',
  enabled: true,
  section: 'more',
  order: 2
}, {
  id: 'endereco',
  key: data => {
    var _data$entidadeFisica4, _data$entidadeFisica5, _data$entidadeFisica6, _data$entidadeFisica7, _data$entidadeFisica8, _data$entidadeFisica9, _data$entidadeFisica0;
    return `${((_data$entidadeFisica4 = data.entidadeFisica) === null || _data$entidadeFisica4 === void 0 ? void 0 : (_data$entidadeFisica5 = _data$entidadeFisica4.entidade) === null || _data$entidadeFisica5 === void 0 ? void 0 : (_data$entidadeFisica6 = _data$entidadeFisica5.logradouro) === null || _data$entidadeFisica6 === void 0 ? void 0 : (_data$entidadeFisica7 = _data$entidadeFisica6.tipoLogradouro) === null || _data$entidadeFisica7 === void 0 ? void 0 : _data$entidadeFisica7.tiloNome) || ''} ${String(((_data$entidadeFisica8 = data.entidadeFisica) === null || _data$entidadeFisica8 === void 0 ? void 0 : (_data$entidadeFisica9 = _data$entidadeFisica8.entidade) === null || _data$entidadeFisica9 === void 0 ? void 0 : (_data$entidadeFisica0 = _data$entidadeFisica9.logradouro) === null || _data$entidadeFisica0 === void 0 ? void 0 : _data$entidadeFisica0.logrNome) || '').split('/')[0].trim()}`.trim();
  },
  cadsusKey: cell => `${String(cell[35] || '')} ${String(cell[34] || '').split('/')[0].trim()}`.trim(),
  label: 'Endereço',
  enabled: true,
  section: 'more',
  order: 3
}, {
  id: 'bairro',
  key: 'entidadeFisica.entidade.localidade.locaNome',
  cadsusKey: 30,
  label: 'Bairro',
  enabled: true,
  section: 'more',
  order: 4
}, {
  id: 'cidade',
  key: 'entidadeFisica.entidade.localidade.cidade.cidaNome',
  cadsusKey: 29,
  label: 'Cidade',
  enabled: true,
  section: 'more',
  order: 5
}, {
  id: 'cep',
  key: 'entidadeFisica.entidade.entiEndeCEP',
  cadsusKey: 41,
  label: 'CEP',
  enabled: true,
  section: 'more',
  order: 6,
  formatter: value => String(value || '').replace(/\D/g, '') // Normaliza para comparação
}, {
  id: 'alergiaMedicamentos',
  key: 'isenAlergMedicamentos',
  cadsusKey: null,
  label: 'Alergia a Medicamentos',
  enabled: true,
  section: 'more',
  order: 7
}, {
  id: 'alergiaAlimentos',
  key: 'isenAlergAlimentos',
  cadsusKey: null,
  label: 'Alergia a Alimentos',
  enabled: true,
  section: 'more',
  order: 8
}, {
  id: 'alergiaQuimicos',
  key: 'isenAlergElementosQuimicos',
  cadsusKey: null,
  label: 'Alergia a Químicos',
  enabled: true,
  section: 'more',
  order: 9
}, {
  id: 'acamado',
  key: 'isenIsAcamado',
  cadsusKey: null,
  label: 'Acamado',
  enabled: true,
  section: 'more',
  order: 10,
  formatter: formatBoolean
}, {
  id: 'deficiente',
  key: 'isenPessoaDeficiente',
  cadsusKey: null,
  label: 'Pessoa com Deficiência',
  enabled: true,
  section: 'more',
  order: 11,
  formatter: formatBoolean
}, {
  id: 'gemeo',
  key: 'isenPossuiIrmaoGemeo',
  cadsusKey: null,
  label: 'Possui Irmão Gêmeo',
  enabled: true,
  section: 'more',
  order: 12,
  formatter: formatBoolean
}, {
  id: 'statusCadastro',
  key: 'status.valor',
  cadsusKey: null,
  label: 'Status do Cadastro',
  enabled: true,
  section: 'more',
  order: 13
}, {
  id: 'unidadeSaude',
  key: 'unidadeSaude.entidade.entiNome',
  cadsusKey: null,
  label: 'Unidade de Saúde',
  enabled: true,
  section: 'more',
  order: 14
}, {
  id: 'observacao',
  key: 'entidadeFisica.entidade.entiObs',
  cadsusKey: null,
  label: 'Observação do Cadastro',
  enabled: true,
  section: 'more',
  order: 15
}, {
  id: 'nomePai',
  key: 'entidadeFisica.entfNomePai',
  cadsusKey: 8,
  // CORRIGIDO
  label: 'Nome do Pai',
  enabled: false,
  section: 'more',
  order: 16
}, {
  id: 'racaCor',
  key: 'entidadeFisica.racaCor.racoNome',
  cadsusKey: 11,
  // CORRIGIDO
  label: 'Raça/Cor',
  enabled: false,
  section: 'more',
  order: 17
}, {
  id: 'grauInstrucao',
  key: 'entidadeFisica.grauInstrucao.grinNome',
  cadsusKey: null,
  label: 'Grau de Instrução',
  enabled: false,
  section: 'more',
  order: 18
}, {
  id: 'cidadeNascimento',
  key: 'entidadeFisica.cidadeNasc.cidaNome',
  cadsusKey: 45,
  // CORRIGIDO
  label: 'Cidade de Nascimento',
  enabled: false,
  section: 'more',
  order: 19
}, {
  id: 'nacionalidade',
  key: 'entidadeFisica.nacionalidade.naciDescricao',
  cadsusKey: 23,
  // CORRIGIDO
  label: 'Nacionalidade',
  enabled: false,
  section: 'more',
  order: 20
}, {
  id: 'religiao',
  key: 'entidadeFisica.religiao.reliNome',
  cadsusKey: null,
  label: 'Religião',
  enabled: false,
  section: 'more',
  order: 21
}, {
  id: 'cbo',
  key: 'entidadeFisica.cbo.dcboNome',
  cadsusKey: null,
  label: 'Profissão (CBO)',
  enabled: false,
  section: 'more',
  order: 22
}, {
  id: 'pis',
  key: 'entidadeFisica.entfPis',
  cadsusKey: 55,
  // CORRIGIDO
  label: 'PIS',
  enabled: false,
  section: 'more',
  order: 23
}, {
  id: 'ctps',
  key: data => {
    var _data$entidadeFisica1, _data$entidadeFisica10;
    const ctps = ((_data$entidadeFisica1 = data.entidadeFisica) === null || _data$entidadeFisica1 === void 0 ? void 0 : _data$entidadeFisica1.entfCTPS) || '';
    const serie = ((_data$entidadeFisica10 = data.entidadeFisica) === null || _data$entidadeFisica10 === void 0 ? void 0 : _data$entidadeFisica10.entfCTPSSerie) || '';
    if (!ctps) return '';
    return `${ctps} (Série: ${serie})`;
  },
  cadsusKey: null,
  label: 'CTPS',
  enabled: false,
  section: 'more',
  order: 24
}, {
  id: 'convulsivo',
  key: 'isenIsConvulsivo',
  cadsusKey: null,
  label: 'É Convulsivo',
  enabled: true,
  section: 'more',
  order: 25,
  formatter: formatBoolean
}, {
  id: 'bpc',
  key: 'isenRecebeBPC',
  cadsusKey: null,
  label: 'Recebe BPC',
  enabled: true,
  section: 'more',
  order: 26,
  formatter: formatBoolean
}, {
  id: 'autista',
  key: 'isenEspectroAutista',
  cadsusKey: null,
  label: 'Espectro Autista',
  enabled: true,
  section: 'more',
  order: 27,
  formatter: formatBoolean
}];

// Exporta a função para obter valores, será útil no sidebar.js


/***/ })

}]);