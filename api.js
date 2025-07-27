import "./browser-polyfill.js";
import { CONFIG, getAPIConfig } from "./config.js";
import { getBrowserAPIInstance } from "./BrowserAPI.js";
import {
  API_ENDPOINTS,
  API_PARAMS,
  API_HEADERS,
  API_ERROR_MESSAGES,
  API_UTILS,
  API_VALIDATIONS,
  REGULATION_FILTERS,
  PRONTUARIO_PARAMS,
  DATA_FORMATS,
  HTTP_STATUS,
} from "./api-constants.js";
import { parseConsultasHTML } from "./consultation-parser.js";

const api = getBrowserAPIInstance();

// ✅ TASK-A-002: Error Boundaries e Circuit Breaker Pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, resetTimeout = 30000) {
    this.threshold = threshold; // Número de falhas antes de abrir o circuito
    this.timeout = timeout; // Timeout para requisições
    this.resetTimeout = resetTimeout; // Tempo para tentar fechar o circuito
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation, operationName = 'API Operation') {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`[Circuit Breaker] Tentando fechar circuito para ${operationName}`);
      } else {
        const error = new Error(`Circuit breaker is OPEN for ${operationName}`);
        error.circuitBreakerOpen = true;
        throw error;
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${this.timeout}ms`)), this.timeout)
        )
      ]);

      // Sucesso - reset do circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log(`[Circuit Breaker] Circuito fechado para ${operationName}`);
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
        console.error(`[Circuit Breaker] Circuito aberto para ${operationName} após ${this.failureCount} falhas`);
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// ✅ TASK-A-002: Retry Logic com Backoff Exponencial
class RetryHandler {
  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async execute(operation, operationName = 'API Operation') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Não fazer retry para erros que não são temporários
        if (this.isNonRetryableError(error)) {
          console.error(`[Retry Handler] Erro não recuperável em ${operationName}:`, error.message);
          throw error;
        }

        if (attempt === this.maxRetries) {
          console.error(`[Retry Handler] Falha final em ${operationName} após ${this.maxRetries + 1} tentativas`);
          break;
        }

        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        
        console.warn(`[Retry Handler] Tentativa ${attempt + 1}/${this.maxRetries + 1} falhou para ${operationName}, tentando novamente em ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  isNonRetryableError(error) {
    // Erros que não devem ser retentados
    if (error.circuitBreakerOpen) return true;
    if (error.message.includes('URL_BASE_NOT_CONFIGURED')) return true;
    if (error.message.includes('inválido')) return true;
    if (error.message.includes('necessário')) return true;
    
    // Códigos HTTP que não devem ser retentados
    if (error.status) {
      const nonRetryableStatuses = [400, 401, 403, 404, 422];
      return nonRetryableStatuses.includes(error.status);
    }
    
    return false;
  }
}

// ✅ TASK-A-002: Logging Estruturado para Erros
class ErrorLogger {
  static log(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location?.href || 'extension-context'
    };

    // Log estruturado no console
    console.error(`[API Error] ${timestamp}:`, errorInfo);

    // Salvar no storage para debugging (últimos 50 erros)
    this.saveToStorage(errorInfo).catch(storageError => {
      console.warn('[Error Logger] Falha ao salvar erro no storage:', storageError);
    });
  }

  static async saveToStorage(errorInfo) {
    try {
      const stored = await api.storage.local.get({ apiErrors: [] });
      const errors = stored.apiErrors || [];
      
      // Manter apenas os últimos 50 erros
      errors.unshift(errorInfo);
      if (errors.length > 50) {
        errors.splice(50);
      }
      
      await api.storage.local.set({ apiErrors: errors });
    } catch (error) {
      // Falha silenciosa para não criar loop de erros
    }
  }

  static async getStoredErrors() {
    try {
      const stored = await api.storage.local.get({ apiErrors: [] });
      return stored.apiErrors || [];
    } catch (error) {
      console.warn('[Error Logger] Falha ao recuperar erros do storage:', error);
      return [];
    }
  }

  static async clearStoredErrors() {
    try {
      await api.storage.local.remove('apiErrors');
      console.log('[Error Logger] Erros armazenados limpos');
    } catch (error) {
      console.warn('[Error Logger] Falha ao limpar erros do storage:', error);
    }
  }
}

// ✅ TASK-A-002: Wrapper para Operações de API com Error Boundaries
class APIErrorBoundary {
  constructor() {
    this.circuitBreaker = new CircuitBreaker();
    this.retryHandler = new RetryHandler();
  }

  async execute(operation, operationName = 'API Operation', options = {}) {
    const {
      enableRetry = true,
      enableCircuitBreaker = true,
      fallback = null,
      context = {}
    } = options;

    try {
      const wrappedOperation = async () => {
        if (enableRetry) {
          return await this.retryHandler.execute(operation, operationName);
        } else {
          return await operation();
        }
      };

      if (enableCircuitBreaker) {
        return await this.circuitBreaker.execute(wrappedOperation, operationName);
      } else {
        return await wrappedOperation();
      }
    } catch (error) {
      // Log estruturado do erro
      ErrorLogger.log(error, {
        operationName,
        context,
        circuitBreakerState: this.circuitBreaker.getState()
      });

      // Tentar fallback se disponível
      if (fallback && typeof fallback === 'function') {
        try {
          console.warn(`[API Error Boundary] Usando fallback para ${operationName}`);
          return await fallback();
        } catch (fallbackError) {
          ErrorLogger.log(fallbackError, {
            operationName: `${operationName} (fallback)`,
            context
          });
          throw fallbackError;
        }
      }

      // Re-throw o erro original se não há fallback
      throw error;
    }
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }
}

// Instância global do Error Boundary
const apiErrorBoundary = new APIErrorBoundary();

// ✅ TASK-A-002: Função helper para criar fallbacks
function createFallback(defaultValue, operationName) {
  return () => {
    console.warn(`[Fallback] Retornando valor padrão para ${operationName}`);
    return Promise.resolve(defaultValue);
  };
}

// Default configuration for batched API requests
const DEFAULT_BATCH_CONFIG = {
  ATTACHMENT_BATCH_SIZE: CONFIG.API.BATCH_SIZE, // Process 5 attachments at a time
  BATCH_DELAY_MS: CONFIG.API.BATCH_DELAY_MS, // 100ms delay between batches
};

/**
 * Gets the current batch configuration from storage or returns defaults.
 * @returns {Promise<object>} The batch configuration object
 */
async function getBatchConfig() {
  try {
    const stored = await api.storage.sync.get({
      batchAttachmentSize: DEFAULT_BATCH_CONFIG.ATTACHMENT_BATCH_SIZE,
      batchDelayMs: DEFAULT_BATCH_CONFIG.BATCH_DELAY_MS,
    });

    return {
      ATTACHMENT_BATCH_SIZE: Math.max(
        1,
        parseInt(stored.batchAttachmentSize, 10) ||
          DEFAULT_BATCH_CONFIG.ATTACHMENT_BATCH_SIZE
      ),
      BATCH_DELAY_MS: Math.max(
        0,
        parseInt(stored.batchDelayMs, 10) || DEFAULT_BATCH_CONFIG.BATCH_DELAY_MS
      ),
    };
  } catch (error) {
    console.warn("Failed to load batch configuration, using defaults:", error);
    return DEFAULT_BATCH_CONFIG;
  }
}

/**
 * Processes an array of items in batches to prevent overwhelming the server.
 * This utility function implements rate limiting for API requests by:
 * - Processing items in configurable batch sizes
 * - Adding delays between batches to reduce server load
 * - Handling individual item failures gracefully
 * - Implementing timeout and retry logic for robustness
 *
 * Used to replace Promise.all() calls that could create too many concurrent requests.
 *
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} batchSize - Number of items to process per batch
 * @param {number} delayMs - Delay in milliseconds between batches
 * @returns {Promise<Array>} Array of processed results
 */
async function processBatched(
  items,
  processor,
  batchSize = CONFIG.API.BATCH_SIZE,
  delayMs = CONFIG.API.BATCH_DELAY_MS
) {
  const results = [];
  const maxRetries = 3;
  const batchTimeout = 30000; // 30 segundos timeout por lote

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // ✅ SEGURO: Implementar timeout para cada lote
        const batchResults = await Promise.race([
          Promise.all(
            batch.map(async (item, index) => {
              try {
                return await processor(item, i + index);
              } catch (error) {
                console.warn(`Batch processing error for item ${i + index}:`, error);
                return null; // Return null for failed items
              }
            })
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Batch timeout')), batchTimeout)
          )
        ]);
        
        results.push(...batchResults);
        break; // Sucesso, sair do loop de retry
        
      } catch (error) {
        retryCount++;
        console.warn(`Lote ${i} falhou (tentativa ${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount === maxRetries) {
          console.error(`Lote ${i} falhou após ${maxRetries} tentativas, preenchendo com nulls`);
          // Preenche com nulls para manter índices consistentes
          results.push(...batch.map(() => null));
        } else {
          // Delay exponencial entre tentativas
          const retryDelay = delayMs * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // Add delay between batches (except for the last batch)
    if (i + batchSize < items.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Obtém a URL base do sistema a partir das configurações salvas pelo usuário.
 * @returns {Promise<string>} A URL base salva.
 */
export async function getBaseUrl() {
  let data;
  try {
    data = await api.storage.sync.get("baseUrl");
  } catch (e) {
    console.error("Erro ao obter a URL base do storage:", e);
    throw e;
  }

  if (data && data.baseUrl) {
    return data.baseUrl;
  }

  console.error("URL base não configurada. Vá em 'Opções' para configurá-la.");
  throw new Error("URL_BASE_NOT_CONFIGURED");
}

/**
 * Lida com erros de fetch de forma centralizada.
 * @param {Response} response - O objeto de resposta do fetch.
 */
function handleFetchError(response) {
  console.error(
    `Erro na requisição: ${response.status} ${response.statusText}`
  );
  throw new Error("Falha na comunicação com o servidor.");
}

/**
 * Extrai o texto de uma string HTML.
 * @param {string} htmlString - A string HTML.
 * @returns {string} O texto extraído.
 */
function getTextFromHTML(htmlString) {
  if (!htmlString) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.textContent || "";
}

/**
 * Busca as configurações de prioridade de regulação do sistema.
 * @returns {Promise<Array<object>>} Uma lista de objetos de prioridade.
 */
export async function fetchRegulationPriorities() {
  return await apiErrorBoundary.execute(
    async () => {
      const baseUrl = await getBaseUrl();
      const url = API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.REGULATION_PRIORITIES);

      const response = await fetch(url);
      if (!response.ok) {
        const error = new Error(API_ERROR_MESSAGES.PRIORITIES_FETCH_FAILED);
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      // Filtra apenas as ativas e ordena pela ordem de exibição definida no sistema
      return data
        .filter((p) => p.coreIsAtivo === "t")
        .sort((a, b) => a.coreOrdemExibicao - b.coreOrdemExibicao);
    },
    'fetchRegulationPriorities',
    {
      fallback: createFallback([], 'fetchRegulationPriorities'),
      context: { endpoint: API_ENDPOINTS.REGULATION_PRIORITIES }
    }
  );
}

/**
 * Busca os detalhes completos de uma regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @returns {Promise<object>} O objeto com os dados da regulação.
 */
export async function fetchRegulationDetails({ reguIdp, reguIds }) {
  if (!API_VALIDATIONS.isValidRegulationId(reguIdp, reguIds)) {
    throw new Error(API_ERROR_MESSAGES.MISSING_REGULATION_ID);
  }
  
  const baseUrl = await getBaseUrl();
  const url = new URL(API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.REGULATION_DETAILS));
  url.search = new URLSearchParams({
    "reguPK.idp": reguIdp,
    "reguPK.ids": reguIds,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: API_HEADERS.AJAX,
  });

  if (!response.ok) {
    handleFetchError(response);
    return null;
  }

  if (!API_VALIDATIONS.isJsonResponse(response)) {
    throw new Error(API_ERROR_MESSAGES.INVALID_RESPONSE);
  }

  const data = await response.json();
  // O objeto de dados está aninhado sob a chave "regulacao"
  return data.regulacao || null;
}


// ✅ SEGURANÇA: Import estático para evitar dynamic imports inseguros
import { validateSearchTerm, sanitizeSearchTerm, validateCPF, validateCNS } from "./validation.js";

export async function searchPatients(term) {
  // Early exit for empty terms
  if (!term || term.length < 1) return [];

  return await apiErrorBoundary.execute(
    async () => {
      // Validate and sanitize the search term
      const validation = validateSearchTerm(term);
      if (!validation.valid) {
        throw new Error(API_ERROR_MESSAGES.INVALID_SEARCH_TERM);
      }

      const sanitizedTerm = sanitizeSearchTerm(term);
      if (!sanitizedTerm) {
        throw new Error("Search term cannot be empty after sanitization");
      }

      const baseUrl = await getBaseUrl();
      const url = new URL(API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.PATIENT_SEARCH));
      url.search = new URLSearchParams({ searchString: sanitizedTerm });
      
      const response = await fetch(url, {
        headers: API_HEADERS.AJAX,
      });
      
      if (!response.ok) {
        const error = new Error("Falha na comunicação com o servidor.");
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      
      return Array.isArray(data)
        ? data.map((p) => ({
            idp: p[0],
            ids: p[1],
            value: p[5],
            cns: p[6],
            dataNascimento: p[7],
            cpf: p[15],
          }))
        : [];
    },
    'searchPatients',
    {
      fallback: createFallback([], 'searchPatients'),
      context: { searchTerm: term?.substring(0, 10) + '...' }
    }
  );
}

export async function fetchVisualizaUsuario({ idp, ids }) {
  if (!API_VALIDATIONS.isValidRegulationId(idp, ids)) {
    throw new Error(`ID inválido. idp: '${idp}', ids: '${ids}'.`);
  }
  
  const baseUrl = await getBaseUrl();
  const url = API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.PATIENT_DETAILS);
  const body = `isenPK.idp=${encodeURIComponent(idp)}&isenPK.ids=${encodeURIComponent(ids)}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: API_HEADERS.FORM,
    body,
  });
  
  if (!response.ok) handleFetchError(response);

  if (!API_VALIDATIONS.isJsonResponse(response)) {
    console.error(API_ERROR_MESSAGES.INVALID_RESPONSE);
    throw new Error(API_ERROR_MESSAGES.SESSION_EXPIRED);
  }

  const patientData = await response.json();
  return patientData?.usuarioServico || {};
}

export async function fetchProntuarioHash({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  if (!isenFullPKCrypto) {
    throw new Error("ID criptografado necessário.");
  }

  const baseUrl = await getBaseUrl();
  const url = API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.PARAM_HASH);
  
  const paramString = API_UTILS.buildProntuarioParamString({
    isenFullPKCrypto,
    dataInicial,
    dataFinal,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: API_HEADERS.FORM,
    body: `paramString=${paramString}`,
  });

  if (!response.ok) {
    throw new Error(API_ERROR_MESSAGES.HASH_GENERATION_FAILED);
  }

  const data = await response.json();
  if (data?.string) return data.string;
  throw new Error(data.mensagem || "Resposta não continha o hash.");
}

export async function fetchConsultasEspecializadas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  if (!isenFullPKCrypto) throw new Error("ID criptografado necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsultaEspecializadas_HTML`
  );
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal,
  });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: data?.tabela || "",
    jsonData: parseConsultasHTML(data?.tabela || ""),
  };
}

export async function fetchConsultasBasicas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  if (!isenFullPKCrypto) throw new Error("ID criptografado necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsulta_HTML`
  );
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal,
  });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: data?.tabela || "",
    jsonData: parseConsultasHTML(data?.tabela || ""),
  };
}

export async function fetchAllConsultations({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  const [basicasResult, especializadasResult] = await Promise.all([
    fetchConsultasBasicas({ isenFullPKCrypto, dataInicial, dataFinal }),
    fetchConsultasEspecializadas({ isenFullPKCrypto, dataInicial, dataFinal }),
  ]);
  const combinedJsonData = [
    ...basicasResult.jsonData,
    ...especializadasResult.jsonData,
  ];
  const combinedHtmlData = `<h3>Consultas Básicas</h3>${basicasResult.htmlData}<h3>Consultas Especializadas</h3>${especializadasResult.htmlData}`;
  return { jsonData: combinedJsonData, htmlData: combinedHtmlData };
}

export async function fetchExamesSolicitados({
  isenPK,
  dataInicial,
  dataFinal,
  comResultado,
  semResultado,
}) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/exameRequisitado/findAllReex`);
  const params = {
    "filters[0]": `dataInicial:${dataInicial}`,
    "filters[1]": `dataFinal:${dataFinal}`,
    "filters[2]": `isenPK:${isenPK}`,
    exameSolicitadoMin: "true",
    exameSolicitadoOutro: "true",
    exameComResultado: comResultado,
    exameSemResultado: semResultado,
    tipoBusca: "reex",
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "reex.reexData",
    sord: "asc",
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      id: row.id || "",
      date: cell[2] || "",
      examName: (cell[5] || "").trim(),
      hasResult: (cell[6] || "") === "SIM",
      professional: cell[8] || "",
      specialty: cell[9] || "",
      resultIdp: cell[13] != null ? String(cell[13]) : "",
      resultIds: cell[14] != null ? String(cell[14]) : "",
    };
  });
}

export async function fetchResultadoExame({ idp, ids }) {
  if (!idp || !ids)
    throw new Error("IDs do resultado do exame são necessários.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resultadoExame/visualizaImagem`);
  url.search = new URLSearchParams({
    "iterPK.idp": idp,
    "iterPK.ids": ids,
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return data?.path || null;
}

export async function fetchCadsusData({ cpf, cns, skipValidation = false }) {
  if (!cpf && !cns) {
    return null;
  }

  return await apiErrorBoundary.execute(
    async () => {
      // Só validar se não for uma busca interna (quando skipValidation for false)
      if (!skipValidation) {
        // ✅ SEGURANÇA: Usando imports estáticos já disponíveis no topo do arquivo

        // Validate CPF if provided
        if (cpf) {
          const cpfValidation = validateCPF(cpf);
          if (!cpfValidation.valid) {
            throw new Error(`CPF inválido: ${cpfValidation.message}`);
          }
        }

        // Validate CNS if provided
        if (cns) {
          const cnsValidation = validateCNS(cns);
          if (!cnsValidation.valid) {
            throw new Error(`CNS inválido: ${cnsValidation.message}`);
          }
        }
      }

      const baseUrl = await getBaseUrl();
      const url = new URL(API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.CADSUS_SEARCH));

      const params = API_UTILS.buildCadsusParams({ cpf, cns });
      url.search = params.toString();

      const response = await fetch(url, {
        headers: API_HEADERS.AJAX,
      });

      if (!response.ok) {
        const error = new Error(API_ERROR_MESSAGES.CADSUS_SEARCH_FAILED);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (data && data.rows && data.rows.length > 0) {
        return data.rows[0].cell;
      }

      return null;
    },
    'fetchCadsusData',
    {
      fallback: createFallback(null, 'fetchCadsusData'),
      context: { cpf: cpf ? '***' : null, cns: cns ? '***' : null }
    }
  );
}

export async function fetchAppointmentDetails({ idp, ids }) {
  if (!idp || !ids) throw new Error("ID do agendamento é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoConsulta/visualiza`);
  url.search = new URLSearchParams({
    "agcoPK.idp": idp,
    "agcoPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    console.error(`Falha ao buscar detalhes do agendamento ${idp}-${ids}`);
    return null;
  }
  const data = await response.json();
  return data?.agendamentoConsulta || null;
}

/**
 * NEW: Busca os detalhes de um agendamento de exame.
 * @param {object} params
 * @param {string} params.idp - O IDP do agendamento de exame.
 * @param {string} params.ids - O IDS do agendamento de exame.
 * @returns {Promise<object>} O objeto com os dados do agendamento de exame.
 */
export async function fetchExamAppointmentDetails({ idp, ids }) {
  if (!idp || !ids) throw new Error("ID do agendamento de exame é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoExame/visualizar`);
  url.search = new URLSearchParams({
    "examPK.idp": idp,
    "examPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    handleFetchError(response);
    return null;
  }
  const data = await response.json();
  return data?.agendamentoExame || null;
}

export async function fetchAppointments({ isenPK, dataInicial, dataFinal }) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resumoCompromisso/lista`);
  const params = {
    isenPK,
    dataInicial,
    dataFinal,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "data",
    sord: "desc",
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  const basicAppointments = (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    let status = "AGENDADO";
    if (String(cell[10]).includes("red")) status = "FALTOU";
    else if (String(cell[7]).includes("blue")) status = "PRESENTE";
    else if (String(cell[8]).includes("red")) status = "CANCELADO";
    else if (String(cell[11]).includes("blue")) status = "ATENDIDO";

    return {
      id: row.id || "",
      type: cell[1] || "N/A",
      date: cell[2] || "",
      time: cell[3] || "",
      location: cell[4] || "",
      professional: cell[5] || "",
      description: (cell[6] || "").trim(),
      status: status,
    };
  });

  // Get current batch configuration for appointments
  const batchConfig = await getBatchConfig();

  // Process appointment enrichment in batches to prevent overwhelming the server
  const enrichedAppointments = await processBatched(
    basicAppointments,
    async (appt) => {
      if (appt.type.toUpperCase().includes("EXAME")) {
        // CORREÇÃO: O ID de agendamentos de exame vem no formato "EXAM-IDP-IDS".
        // A lógica posterior (renderizadores) espera "IDP-IDS".
        // Normalizamos o ID aqui para garantir consistência.
        const parts = (appt.id || "").split("-");
        if (parts.length === 3 && parts[0].toUpperCase() === "EXAM") {
          // Reconstrói o appt com o ID normalizado.
          return {
            ...appt,
            id: `${parts[1]}-${parts[2]}`,
            specialty: appt.description || "Exame sem descrição",
          };
        }
        return {
          ...appt,
          specialty: appt.description || "Exame sem descrição",
        };
      }

      const [idp, ids] = appt.id.split("-");
      if (!idp || !ids) return appt;

      try {
        const details = await fetchAppointmentDetails({ idp, ids });
        if (details) {
          let specialtyString = "Sem especialidade";
          const apcn = details.atividadeProfissionalCnes;

          if (apcn && apcn.apcnNome) {
            specialtyString = apcn.apcnCod
              ? `${apcn.apcnNome} (${apcn.apcnCod})`
              : apcn.apcnNome;
          }

          return {
            ...appt,
            isSpecialized: details.agcoIsEspecializada === "t",
            isOdonto: details.agcoIsOdonto === "t",
            specialty: specialtyString,
          };
        }
      } catch (error) {
        console.warn(
          `Falha ao buscar detalhes para o agendamento ${appt.id}`,
          error
        );
      }
      return appt;
    },
    batchConfig.ATTACHMENT_BATCH_SIZE,
    batchConfig.BATCH_DELAY_MS
  );

  return enrichedAppointments;
}

async function fetchRegulations({
  isenPK,
  modalidade,
  dataInicial,
  dataFinal,
}) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/regulacaoRegulador/lista`);

  const params = {
    "filters[0]": `isFiltrarData:${!!dataInicial}`,
    "filters[1]": `dataInicial:${dataInicial || ""}`,
    "filters[2]": `dataFinal:${dataFinal || ""}`,
    "filters[3]": `modalidade:${modalidade}`,
    "filters[4]": "solicitante:undefined",
    "filters[5]": `usuarioServico:${isenPK}`,
    "filters[6]": "autorizado:true",
    "filters[7]": "pendente:true",
    "filters[8]": "devolvido:true",
    "filters[9]": "negado:true",
    "filters[10]": "emAnalise:true",
    "filters[11]": "cancelados:true",
    "filters[12]": "cboFiltro:",
    "filters[13]": "procedimentoFiltro:",
    "filters[14]": "reguGravidade:",
    "filters[15]": "reguIsRetorno:...",
    "filters[16]": "codBarProtocolo:",
    "filters[17]": "reguIsAgendadoFiltro:todos",
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "regu.reguDataPrevista",
    sord: "desc",
  };

  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    let idp = null,
      ids = null;
    const idMatch = (row.id || "").match(/reguPK(\d+)-(\d+)/);
    if (idMatch && idMatch.length === 3) {
      idp = idMatch[1];
      ids = idMatch[2];
    }

    const descriptionHtml = cell[6] || "";
    const [procedure, cid] = descriptionHtml.split("<br/>");

    return {
      id: row.id,
      idp,
      ids,
      type: cell[2] || "N/A",
      priority: getTextFromHTML(cell[3]),
      date: cell[4] || "",
      status: getTextFromHTML(cell[5]),
      procedure: getTextFromHTML(procedure),
      cid: cid ? cid.trim() : "",
      requester: cell[7] || "",
      provider: cell[8] || "",
      isenFullPKCrypto: cell[9] || "",
    };
  });
}

export async function fetchAllRegulations({
  isenPK,
  dataInicial,
  dataFinal,
  type = "all",
}) {
  let regulationsToFetch = [];

  if (type === "all") {
    regulationsToFetch = await Promise.all([
      fetchRegulations({ isenPK, modalidade: "ENC", dataInicial, dataFinal }),
      fetchRegulations({ isenPK, modalidade: "EXA", dataInicial, dataFinal }),
    ]);
  } else if (type === "ENC") {
    regulationsToFetch = [
      await fetchRegulations({
        isenPK,
        modalidade: "ENC",
        dataInicial,
        dataFinal,
      }),
    ];
  } else if (type === "EXA") {
    regulationsToFetch = [
      await fetchRegulations({
        isenPK,
        modalidade: "EXA",
        dataInicial,
        dataFinal,
      }),
    ];
  }

  const allRegulations = regulationsToFetch.flat();

  // Get current batch configuration
  const batchConfig = await getBatchConfig();

  // Process attachment fetching in batches to prevent overwhelming the server
  const regulationsWithAttachments = await processBatched(
    allRegulations,
    async (regulation) => {
      if (regulation.idp && regulation.ids) {
        try {
          // CORREÇÃO: Usa o ID da própria regulação como o isenPK para esta chamada específica.
          const attachmentIsenPk = `${regulation.idp}-${regulation.ids}`;
          const attachments = await fetchRegulationAttachments({
            reguIdp: regulation.idp,
            reguIds: regulation.ids,
            isenPK: attachmentIsenPk,
          });
          return { ...regulation, attachments };
        } catch (error) {
          console.warn(
            `Falha ao buscar anexos para regulação ${regulation.id}:`,
            error
          );
          return { ...regulation, attachments: [] };
        }
      }
      return { ...regulation, attachments: [] };
    },
    batchConfig.ATTACHMENT_BATCH_SIZE,
    batchConfig.BATCH_DELAY_MS
  );

  regulationsWithAttachments.sort((a, b) => {
    const dateA = a.date.split("/").reverse().join("-");
    const dateB = b.date.split("/").reverse().join("-");
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
export async function fetchDocuments({ isenPK }) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const [idp, ids] = isenPK.split("-");
  if (!idp || !ids)
    throw new Error("ID (isenPK) do paciente em formato inválido.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/buscaGrid`);
  const params = {
    "isenPK.idp": idp,
    "isenPK.ids": ids,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS_REGULATIONS),
    page: "1",
    sidx: "isar.isarData desc, isar.isarPK.idp",
    sord: "desc",
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || "",
      description: (cell[3] || "").trim(),
      fileType: (cell[4] || "").toLowerCase(),
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
export async function fetchDocumentUrl({ idp, ids }) {
  if (!idp || !ids) throw new Error("IDs do documento são necessários.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/getHashArquivo`);
  url.search = new URLSearchParams({
    "isarPK.idp": idp,
    "isarPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  if (data?.isenArquivo?.img) {
    const filePath = data.isenArquivo.img;
    return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`;
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
export async function fetchRegulationAttachments({ reguIdp, reguIds, isenPK }) {
  if (!reguIdp || !reguIds) throw new Error("ID da regulação é necessário.");
  if (!isenPK) throw new Error("ID do paciente (isenPK) é necessário.");

  const [isenIdp, isenIds] = isenPK.split("-");
  if (!isenIdp || !isenIds)
    throw new Error("ID do paciente (isenPK) em formato inválido.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/buscaGrid`);
  const params = {
    "isenPK.idp": isenIdp,
    "isenPK.ids": isenIds,
    "reguPK.idp": reguIdp,
    "reguPK.ids": reguIds,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS_REGULATIONS),
    page: "1",
    sidx: "", // Corrigido para corresponder à requisição da aplicação
    sord: "asc", // Corrigido para corresponder à requisição da aplicação
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || "",
      description: (cell[3] || "").trim(),
      fileType: (cell[4] || "").toLowerCase(),
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
export async function fetchRegulationAttachmentUrl({ idp, ids }) {
  if (!idp || !ids) throw new Error("IDs do anexo são necessários.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/getHashArquivo`);
  url.search = new URLSearchParams({
    "rearPK.idp": idp,
    "rearPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  if (data?.regulacaoArquivo?.img) {
    const filePath = data.regulacaoArquivo.img;
    return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`;
  }

  return null;
}

/**
 * Fetches all data sources for the patient timeline concurrently.
 * @param {object} params - The parameters for the API calls.
 * @returns {Promise<object>} An object containing the data from all sources.
 */
export async function fetchAllTimelineData({
  isenPK,
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  // Usando um objeto de promessas para tornar a extração de resultados mais robusta.
  const dataPromises = {
    consultations: fetchAllConsultations({
      isenFullPKCrypto,
      dataInicial,
      dataFinal,
    }),
    exams: fetchExamesSolicitados({
      isenPK,
      dataInicial,
      dataFinal,
      comResultado: true,
      semResultado: true,
    }),
    appointments: fetchAppointments({ isenPK, dataInicial, dataFinal }),
    regulations: fetchAllRegulations({
      isenPK,
      dataInicial,
      dataFinal,
      type: "all",
    }),
    documents: fetchDocuments({ isenPK }),
  };

  const results = await Promise.allSettled(Object.values(dataPromises));
  const dataKeys = Object.keys(dataPromises);

  const getValueOrDefault = (result, defaultValue = []) => {
    if (result.status === "fulfilled") {
      if (result.value && typeof result.value.jsonData !== "undefined") {
        return result.value.jsonData; // For consultations
      }
      return result.value; // For others
    }
    console.warn("Falha em chamada de API para a timeline:", result.reason);
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
export async function keepSessionAlive() {
  return await apiErrorBoundary.execute(
    async () => {
      const baseUrl = await getBaseUrl();
      const url = API_UTILS.buildUrl(baseUrl, API_ENDPOINTS.SYSTEM_DATETIME);

      const response = await fetch(url, {
        method: "GET",
        headers: API_HEADERS.KEEP_ALIVE,
        cache: "no-cache",
      });

      if (!response.ok) {
        // Se for erro 401 ou 403, provavelmente a sessão expirou
        if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
          const error = new Error("Sessão expirou - keep-alive não pode manter a sessão ativa");
          error.status = response.status;
          throw error;
        }

        const error = new Error(`${API_ERROR_MESSAGES.KEEP_ALIVE_FAILED} com status ${response.status} - ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      if (!API_VALIDATIONS.isJsonResponse(response)) {
        throw new Error(API_ERROR_MESSAGES.KEEP_ALIVE_NOT_JSON);
      }

      const data = await response.json();

      // Verifica se a resposta contém dados válidos
      // A resposta pode ser um objeto com propriedades ou uma string direta
      if (data) {
        // Se for um objeto com propriedades específicas
        if (typeof data === 'object' && (data.dataHora || data.data || data.hora)) {
          console.log(`Sessão mantida ativa: ${data.dataHora || data.data || "OK"}`);
          return true;
        }
        // Se for uma string direta com data/hora (formato ISO ou similar)
        else if (typeof data === 'string' && data.trim().length > 0) {
          console.log(`Sessão mantida ativa: ${data}`);
          return true;
        }
        // Se for qualquer outro valor não-nulo/não-vazio
        else if (data !== null && data !== undefined && data !== '') {
          console.log(`Sessão mantida ativa: ${JSON.stringify(data)}`);
          return true;
        }
      }
      
      throw new Error(API_ERROR_MESSAGES.KEEP_ALIVE_INVALID_RESPONSE);
    },
    'keepSessionAlive',
    {
      fallback: createFallback(false, 'keepSessionAlive'),
      context: { endpoint: API_ENDPOINTS.SYSTEM_DATETIME }
    }
  );
}

// ✅ TASK-A-002: Funções de Debugging e Monitoramento
/**
 * Obtém os erros armazenados para debugging.
 * @returns {Promise<Array>} Lista dos últimos erros de API
 */
export async function getAPIErrors() {
  return await ErrorLogger.getStoredErrors();
}

/**
 * Limpa os erros armazenados.
 * @returns {Promise<void>}
 */
export async function clearAPIErrors() {
  return await ErrorLogger.clearStoredErrors();
}

/**
 * Obtém o estado atual do Circuit Breaker.
 * @returns {object} Estado do circuit breaker
 */
export function getCircuitBreakerState() {
  return apiErrorBoundary.getCircuitBreakerState();
}

/**
 * Força o reset do Circuit Breaker (para debugging).
 * @returns {void}
 */
export function resetCircuitBreaker() {
  apiErrorBoundary.circuitBreaker.state = 'CLOSED';
  apiErrorBoundary.circuitBreaker.failureCount = 0;
  apiErrorBoundary.circuitBreaker.lastFailureTime = null;
  console.log('[Circuit Breaker] Reset manual executado');
}
