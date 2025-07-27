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

// ✅ TASK-A-006: Rate Limiting System
class TokenBucket {
  constructor(capacity = 10, refillRate = 2, refillInterval = 1000) {
    this.capacity = capacity; // Máximo de tokens
    this.tokens = capacity; // Tokens atuais
    this.refillRate = refillRate; // Tokens adicionados por intervalo
    this.refillInterval = refillInterval; // Intervalo em ms
    this.lastRefill = Date.now();
    
    // Auto-refill tokens
    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.refillInterval);
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillInterval) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(tokens = 1) {
    this.refill(); // Atualiza tokens antes de consumir
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getAvailableTokens() {
    this.refill();
    return this.tokens;
  }

  getWaitTime(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      return 0;
    }
    
    const tokensNeeded = tokens - this.tokens;
    const timeNeeded = Math.ceil(tokensNeeded / this.refillRate) * this.refillInterval;
    return timeNeeded;
  }

  destroy() {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
  }
}

class RequestQueue {
  constructor(maxSize = 100) {
    this.queue = [];
    this.maxSize = maxSize;
    this.processing = false;
  }

  enqueue(request) {
    if (this.queue.length >= this.maxSize) {
      throw new Error(`Request queue is full (max: ${this.maxSize})`);
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        const result = await item.request();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
      
      // Pequeno delay entre processamentos
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    this.processing = false;
  }

  getQueueSize() {
    return this.queue.length;
  }

  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

class APICache {
  constructor(defaultTTL = 300000) { // 5 minutos default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Limpeza automática a cada 5 minutos
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  generateKey(url, options = {}) {
    const keyData = {
      url: url.toString(),
      method: options.method || 'GET',
      body: options.body || '',
      headers: JSON.stringify(options.headers || {})
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[API Cache] Limpeza automática: ${cleaned} itens removidos`);
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

class RateLimitMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      rateLimitedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageWaitTime: 0,
      queuedRequests: 0,
      errors: 0
    };
    
    this.requestTimes = [];
    this.maxHistorySize = 1000;
  }

  recordRequest(waitTime = 0, fromCache = false, error = false) {
    this.metrics.totalRequests++;
    
    if (waitTime > 0) {
      this.metrics.rateLimitedRequests++;
    }
    
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    if (error) {
      this.metrics.errors++;
    }
    
    this.requestTimes.push({
      timestamp: Date.now(),
      waitTime,
      fromCache,
      error
    });
    
    // Manter apenas os últimos registros
    if (this.requestTimes.length > this.maxHistorySize) {
      this.requestTimes.splice(0, this.requestTimes.length - this.maxHistorySize);
    }
    
    // Calcular tempo médio de espera
    const totalWaitTime = this.requestTimes.reduce((sum, req) => sum + req.waitTime, 0);
    this.metrics.averageWaitTime = totalWaitTime / this.requestTimes.length;
  }

  recordQueueSize(size) {
    this.metrics.queuedRequests = size;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      errorRate: this.metrics.errors / this.metrics.totalRequests || 0,
      rateLimitRate: this.metrics.rateLimitedRequests / this.metrics.totalRequests || 0
    };
  }

  getRecentActivity(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.requestTimes.filter(req => req.timestamp > cutoff);
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      rateLimitedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageWaitTime: 0,
      queuedRequests: 0,
      errors: 0
    };
    this.requestTimes = [];
  }
}

class RateLimiter {
  constructor(options = {}) {
    const {
      tokensPerSecond = 2,
      burstCapacity = 10,
      queueMaxSize = 100,
      cacheDefaultTTL = 300000, // 5 minutos
      enableCache = true,
      enableQueue = true
    } = options;
    
    this.tokenBucket = new TokenBucket(burstCapacity, tokensPerSecond, 1000);
    this.requestQueue = enableQueue ? new RequestQueue(queueMaxSize) : null;
    this.cache = enableCache ? new APICache(cacheDefaultTTL) : null;
    this.monitor = new RateLimitMonitor();
    this.enableCache = enableCache;
    this.enableQueue = enableQueue;
  }

  async execute(url, options = {}, cacheOptions = {}) {
    const startTime = Date.now();
    let fromCache = false;
    let waitTime = 0;
    
    try {
      // Verificar cache primeiro
      if (this.enableCache && this.cache) {
        const cacheKey = this.cache.generateKey(url, options);
        const cachedResult = this.cache.get(cacheKey);
        
        if (cachedResult) {
          fromCache = true;
          this.monitor.recordRequest(0, true, false);
          console.log(`[Rate Limiter] Cache hit para ${url}`);
          return cachedResult;
        }
      }
      
      // Função de requisição
      const makeRequest = async () => {
        // Verificar tokens disponíveis
        if (!this.tokenBucket.consume(1)) {
          waitTime = this.tokenBucket.getWaitTime(1);
          
          if (waitTime > 0) {
            console.log(`[Rate Limiter] Aguardando ${waitTime}ms para ${url}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Tentar consumir novamente após espera
            if (!this.tokenBucket.consume(1)) {
              throw new Error('Rate limit exceeded after waiting');
            }
          }
        }
        
        // Fazer a requisição
        const response = await fetch(url, options);
        
        // Verificar se a resposta é JSON para cache
        let result;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          result = await response.clone().json();
        } else {
          result = response;
        }
        
        // Armazenar no cache se habilitado
        if (this.enableCache && this.cache && response.ok) {
          const cacheKey = this.cache.generateKey(url, options);
          const ttl = cacheOptions.ttl || this.cache.defaultTTL;
          
          // Só cachear respostas JSON
          if (contentType && contentType.includes('application/json')) {
            this.cache.set(cacheKey, result, ttl);
            console.log(`[Rate Limiter] Resultado cacheado para ${url} (TTL: ${ttl}ms)`);
          }
        }
        
        return result;
      };
      
      // Executar com ou sem queue
      let result;
      if (this.enableQueue && this.requestQueue) {
        this.monitor.recordQueueSize(this.requestQueue.getQueueSize());
        result = await this.requestQueue.enqueue(makeRequest);
      } else {
        result = await makeRequest();
      }
      
      this.monitor.recordRequest(waitTime, fromCache, false);
      return result;
      
    } catch (error) {
      this.monitor.recordRequest(waitTime, fromCache, true);
      throw error;
    }
  }

  getMetrics() {
    const baseMetrics = this.monitor.getMetrics();
    
    return {
      ...baseMetrics,
      tokenBucket: {
        availableTokens: this.tokenBucket.getAvailableTokens(),
        capacity: this.tokenBucket.capacity,
        refillRate: this.tokenBucket.refillRate
      },
      queue: this.requestQueue ? {
        size: this.requestQueue.getQueueSize(),
        maxSize: this.requestQueue.maxSize
      } : null,
      cache: this.cache ? this.cache.getStats() : null
    };
  }

  clearCache() {
    if (this.cache) {
      this.cache.clear();
      console.log('[Rate Limiter] Cache limpo');
    }
  }

  resetMetrics() {
    this.monitor.reset();
    console.log('[Rate Limiter] Métricas resetadas');
  }

  destroy() {
    if (this.tokenBucket) {
      this.tokenBucket.destroy();
    }
    
    if (this.requestQueue) {
      this.requestQueue.clear();
    }
    
    if (this.cache) {
      this.cache.destroy();
    }
    
    console.log('[Rate Limiter] Destruído');
  }
}

// Instância global do Rate Limiter
const rateLimiter = new RateLimiter({
  tokensPerSecond: 2, // 2 requisições por segundo
  burstCapacity: 10, // Até 10 requisições em burst
  queueMaxSize: 50, // Máximo 50 requisições na fila
  cacheDefaultTTL: 300000, // Cache de 5 minutos
  enableCache: true,
  enableQueue: true
});

// Instância global do Error Boundary
const apiErrorBoundary = new APIErrorBoundary();

// ✅ TASK-A-002: Função helper para criar fallbacks
function createFallback(defaultValue, operationName) {
  return () => {
    console.warn(`[Fallback] Retornando valor padrão para ${operationName}`);
    return Promise.resolve(defaultValue);
  };
}

// ✅ TASK-A-006: Wrapper para fetch com rate limiting
async function rateLimitedFetch(url, options = {}, cacheOptions = {}) {
  try {
    return await rateLimiter.execute(url, options, cacheOptions);
  } catch (error) {
    console.error(`[Rate Limited Fetch] Erro para ${url}:`, error);
    throw error;
  }
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

      // ✅ TASK-A-006: Rate limiting aplicado
      const data = await rateLimitedFetch(url, {}, { ttl: 600000 }); // Cache por 10 minutos
      
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
      
      // ✅ TASK-A-006: Rate limiting aplicado com cache curto para buscas
      const data = await rateLimitedFetch(url, {
        headers: API_HEADERS.AJAX,
      }, { ttl: 60000 }); // Cache por 1 minuto para buscas
      
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

// ✅ TASK-A-006: Funções de Monitoramento de Rate Limiting
/**
 * Obtém as métricas atuais do rate limiter.
 * @returns {object} Métricas detalhadas do rate limiting
 */
export function getRateLimitMetrics() {
  return rateLimiter.getMetrics();
}

/**
 * Obtém a atividade recente do rate limiter.
 * @param {number} minutes - Número de minutos para buscar atividade (padrão: 5)
 * @returns {Array} Lista de requisições recentes
 */
export function getRateLimitActivity(minutes = 5) {
  return rateLimiter.monitor.getRecentActivity(minutes);
}

/**
 * Limpa o cache do rate limiter.
 * @returns {void}
 */
export function clearRateLimitCache() {
  rateLimiter.clearCache();
}

/**
 * Reseta as métricas do rate limiter.
 * @returns {void}
 */
export function resetRateLimitMetrics() {
  rateLimiter.resetMetrics();
}

/**
 * Obtém o status atual do token bucket.
 * @returns {object} Status do token bucket
 */
export function getTokenBucketStatus() {
  return {
    availableTokens: rateLimiter.tokenBucket.getAvailableTokens(),
    capacity: rateLimiter.tokenBucket.capacity,
    refillRate: rateLimiter.tokenBucket.refillRate,
    waitTimeForNextToken: rateLimiter.tokenBucket.getWaitTime(1)
  };
}

/**
 * Obtém o status atual da fila de requisições.
 * @returns {object} Status da fila
 */
export function getRequestQueueStatus() {
  if (!rateLimiter.requestQueue) {
    return { enabled: false };
  }
  
  return {
    enabled: true,
    currentSize: rateLimiter.requestQueue.getQueueSize(),
    maxSize: rateLimiter.requestQueue.maxSize,
    processing: rateLimiter.requestQueue.processing
  };
}

/**
 * Obtém estatísticas detalhadas do cache.
 * @returns {object} Estatísticas do cache
 */
export function getCacheStats() {
  if (!rateLimiter.cache) {
    return { enabled: false };
  }
  
  return {
    enabled: true,
    ...rateLimiter.cache.getStats(),
    defaultTTL: rateLimiter.cache.defaultTTL
  };
}

/**
 * Força a limpeza do cache expirado.
 * @returns {void}
 */
export function cleanupExpiredCache() {
  if (rateLimiter.cache) {
    rateLimiter.cache.cleanup();
  }
}

/**
 * Obtém um relatório completo do sistema de rate limiting.
 * @returns {object} Relatório completo
 */
export function getRateLimitReport() {
  const metrics = getRateLimitMetrics();
  const tokenBucket = getTokenBucketStatus();
  const queue = getRequestQueueStatus();
  const cache = getCacheStats();
  const recentActivity = getRateLimitActivity(10); // Últimos 10 minutos
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: metrics.totalRequests,
      cacheHitRate: metrics.cacheHitRate,
      errorRate: metrics.errorRate,
      rateLimitRate: metrics.rateLimitRate,
      averageWaitTime: metrics.averageWaitTime
    },
    tokenBucket,
    queue,
    cache,
    recentActivity: {
      count: recentActivity.length,
      requests: recentActivity.slice(-10) // Últimas 10 requisições
    },
    recommendations: generateRateLimitRecommendations(metrics, tokenBucket, queue, cache)
  };
}

/**
 * Gera recomendações baseadas nas métricas atuais.
 * @param {object} metrics - Métricas do rate limiter
 * @param {object} tokenBucket - Status do token bucket
 * @param {object} queue - Status da fila
 * @param {object} cache - Status do cache
 * @returns {Array} Lista de recomendações
 */
function generateRateLimitRecommendations(metrics, tokenBucket, queue, cache) {
  const recommendations = [];
  
  // Análise de rate limiting
  if (metrics.rateLimitRate > 0.3) {
    recommendations.push({
      type: 'warning',
      category: 'rate_limit',
      message: `Taxa de rate limiting alta (${(metrics.rateLimitRate * 100).toFixed(1)}%). Considere aumentar a capacidade do token bucket.`,
      action: 'increase_capacity'
    });
  }
  
  // Análise de cache
  if (cache.enabled && metrics.cacheHitRate < 0.5) {
    recommendations.push({
      type: 'info',
      category: 'cache',
      message: `Taxa de cache hit baixa (${(metrics.cacheHitRate * 100).toFixed(1)}%). Considere aumentar o TTL do cache.`,
      action: 'increase_ttl'
    });
  }
  
  // Análise de erros
  if (metrics.errorRate > 0.1) {
    recommendations.push({
      type: 'error',
      category: 'errors',
      message: `Taxa de erro alta (${(metrics.errorRate * 100).toFixed(1)}%). Verifique a conectividade e saúde do servidor.`,
      action: 'check_server_health'
    });
  }
  
  // Análise da fila
  if (queue.enabled && queue.currentSize > queue.maxSize * 0.8) {
    recommendations.push({
      type: 'warning',
      category: 'queue',
      message: `Fila de requisições quase cheia (${queue.currentSize}/${queue.maxSize}). Considere aumentar o tamanho da fila.`,
      action: 'increase_queue_size'
    });
  }
  
  // Análise de tokens
  if (tokenBucket.availableTokens < tokenBucket.capacity * 0.2) {
    recommendations.push({
      type: 'info',
      category: 'tokens',
      message: `Poucos tokens disponíveis (${tokenBucket.availableTokens}/${tokenBucket.capacity}). Sistema sob carga.`,
      action: 'monitor_load'
    });
  }
  
  return recommendations;
}

/**
 * Configura o rate limiter com novos parâmetros.
 * @param {object} config - Nova configuração
 * @returns {void}
 */
export function configureRateLimiter(config = {}) {
  const {
    tokensPerSecond,
    burstCapacity,
    queueMaxSize,
    cacheDefaultTTL
  } = config;
  
  console.log('[Rate Limiter] Reconfigurando com:', config);
  
  // Destruir instância atual
  rateLimiter.destroy();
  
  // Criar nova instância com configuração atualizada
  const newConfig = {
    tokensPerSecond: tokensPerSecond || 2,
    burstCapacity: burstCapacity || 10,
    queueMaxSize: queueMaxSize || 50,
    cacheDefaultTTL: cacheDefaultTTL || 300000,
    enableCache: true,
    enableQueue: true
  };
  
  // Substituir instância global
  Object.assign(rateLimiter, new RateLimiter(newConfig));
  
  console.log('[Rate Limiter] Reconfiguração concluída');
}

/**
 * Salva as métricas atuais no storage para análise posterior.
 * @returns {Promise<void>}
 */
export async function saveRateLimitMetrics() {
  try {
    const report = getRateLimitReport();
    const stored = await api.storage.local.get({ rateLimitHistory: [] });
    const history = stored.rateLimitHistory || [];
    
    // Manter apenas os últimos 100 relatórios
    history.unshift(report);
    if (history.length > 100) {
      history.splice(100);
    }
    
    await api.storage.local.set({ rateLimitHistory: history });
    console.log('[Rate Limiter] Métricas salvas no storage');
  } catch (error) {
    console.warn('[Rate Limiter] Falha ao salvar métricas:', error);
  }
}

/**
 * Obtém o histórico de métricas salvas.
 * @returns {Promise<Array>} Histórico de métricas
 */
export async function getRateLimitHistory() {
  try {
    const stored = await api.storage.local.get({ rateLimitHistory: [] });
    return stored.rateLimitHistory || [];
  } catch (error) {
    console.warn('[Rate Limiter] Falha ao recuperar histórico:', error);
    return [];
  }
}

/**
 * Limpa o histórico de métricas.
 * @returns {Promise<void>}
 */
export async function clearRateLimitHistory() {
  try {
    await api.storage.local.remove('rateLimitHistory');
    console.log('[Rate Limiter] Histórico de métricas limpo');
  } catch (error) {
    console.warn('[Rate Limiter] Falha ao limpar histórico:', error);
  }
}
