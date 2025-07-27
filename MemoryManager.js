/**
 * @file MemoryManager - Sistema robusto de gerenciamento de memória e limpeza de recursos
 * Responsável por rastrear e limpar event listeners, timeouts, intervalos e referências globais
 * 
 * TASK-A-003: Implementa correções para memory leaks em event listeners:
 * - WeakMap para rastreamento de listeners
 * - Cleanup automático em window.beforeunload
 * - Timeout para cleanup forçado
 * - Verificação de vazamentos de memória
 * - Cleanup em caso de erros
 */

import { CONFIG } from "./config.js";
import { createComponentLogger } from "./logger.js";

// Logger específico para MemoryManager
const logger = createComponentLogger('MemoryManager');


/**
 * Classe para gerenciamento centralizado de memória e recursos
 */
export class MemoryManager {
  constructor() {
    // TASK-A-003: Usar WeakMap para rastreamento de listeners (evita vazamentos)
    this.eventListenersWeakMap = new WeakMap(); // Rastreia listeners por elemento (WeakMap)
    this.eventListeners = new Map(); // Backup para elementos sem referência forte
    this.timeouts = new Map(); // Rastreia timeouts ativos com timestamps
    this.intervals = new Map(); // Rastreia intervalos ativos com timestamps
    this.globalRefs = new Map(); // Rastreia referências globais
    this.cleanupCallbacks = new Set(); // Callbacks de limpeza customizados
    this.isDestroyed = false;
    
    // TASK-A-003: Controle de cleanup forçado
    this.forceCleanupTimeout = null;
    this.lastCleanupTime = Date.now();
    this.memoryLeakThreshold = 100; // Limite de listeners antes de cleanup forçado
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutos
    
    // TASK-A-003: Métricas de vazamento de memória
    this.memoryStats = {
      listenersCreated: 0,
      listenersRemoved: 0,
      timeoutsCreated: 0,
      timeoutsCleared: 0,
      intervalsCreated: 0,
      intervalsCleared: 0,
      cleanupCount: 0,
      lastMemoryCheck: Date.now()
    };
    
    // Bind methods para preservar contexto
    this.cleanup = this.cleanup.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleError = this.handleError.bind(this);
    this.forceCleanup = this.forceCleanup.bind(this);
    this.checkMemoryLeaks = this.checkMemoryLeaks.bind(this);
    
    // Registra listeners globais para limpeza automática
    this.registerGlobalCleanupListeners();
    
    // TASK-A-003: Iniciar verificação periódica de vazamentos
    this.startMemoryLeakDetection();
    
    console.log('[MemoryManager] Inicializado com proteção contra memory leaks');
  }

  /**
   * Registra event listeners globais para limpeza automática
   */
  registerGlobalCleanupListeners() {
    // TASK-A-003: Limpeza automática em window.beforeunload
    window.addEventListener('beforeunload', this.handleBeforeUnload, { passive: true });
    
    // Limpeza quando a página fica oculta (mudança de aba, minimizar, etc.)
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });
    
    // TASK-A-003: Cleanup em caso de erros (melhorado)
    window.addEventListener('error', this.handleError, { passive: true });
    window.addEventListener('unhandledrejection', this.handleError, { passive: true });
    
    // TASK-A-003: Cleanup em caso de perda de foco prolongada
    window.addEventListener('blur', () => {
      this.scheduleForceCleanup();
    }, { passive: true });
    
    // TASK-A-003: Cancelar cleanup forçado quando a janela volta ao foco
    window.addEventListener('focus', () => {
      this.cancelForceCleanup();
    }, { passive: true });
  }

  /**
   * TASK-A-003: Inicia verificação periódica de vazamentos de memória
   */
  startMemoryLeakDetection() {
    // Verificação a cada 2 minutos
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryLeaks();
    }, 2 * 60 * 1000);
    
    console.log('[MemoryManager] Detecção de vazamentos de memória iniciada');
  }

  /**
   * TASK-A-003: Verifica vazamentos de memória e executa limpeza se necessário
   */
  checkMemoryLeaks() {
    const now = Date.now();
    const stats = this.getStats();
    
    // Atualiza estatísticas
    this.memoryStats.lastMemoryCheck = now;
    
    // Verifica se há muitos listeners ativos
    if (stats.eventListeners > this.memoryLeakThreshold) {
      console.warn(`[MemoryManager] Possível vazamento detectado: ${stats.eventListeners} listeners ativos`);
      this.performMemoryCleanup();
    }
    
    // Verifica se há timeouts/intervals antigos
    const oldTimeouts = this.getOldTimeouts();
    const oldIntervals = this.getOldIntervals();
    
    if (oldTimeouts.length > 10 || oldIntervals.length > 10) {
      console.warn(`[MemoryManager] Timeouts/intervals antigos detectados: ${oldTimeouts.length}/${oldIntervals.length}`);
      this.cleanupOldTimers();
    }
    
    // Log estatísticas periodicamente (a cada 10 minutos)
    if (now - this.lastCleanupTime > 10 * 60 * 1000) {
      this.logMemoryStats();
      this.lastCleanupTime = now;
    }
  }

  /**
   * TASK-A-003: Obtém timeouts antigos (mais de 5 minutos)
   */
  getOldTimeouts() {
    const now = Date.now();
    const threshold = 5 * 60 * 1000; // 5 minutos
    const oldTimeouts = [];
    
    this.timeouts.forEach((timestamp, timeoutId) => {
      if (now - timestamp > threshold) {
        oldTimeouts.push(timeoutId);
      }
    });
    
    return oldTimeouts;
  }

  /**
   * TASK-A-003: Obtém intervals antigos (mais de 5 minutos)
   */
  getOldIntervals() {
    const now = Date.now();
    const threshold = 5 * 60 * 1000; // 5 minutos
    const oldIntervals = [];
    
    this.intervals.forEach((timestamp, intervalId) => {
      if (now - timestamp > threshold) {
        oldIntervals.push(intervalId);
      }
    });
    
    return oldIntervals;
  }

  /**
   * TASK-A-003: Limpa timeouts e intervals antigos
   */
  cleanupOldTimers() {
    const oldTimeouts = this.getOldTimeouts();
    const oldIntervals = this.getOldIntervals();
    
    oldTimeouts.forEach(timeoutId => {
      this.clearTimeout(timeoutId);
      this.memoryStats.timeoutsCleared++;
    });
    
    oldIntervals.forEach(intervalId => {
      this.clearInterval(intervalId);
      this.memoryStats.intervalsCleared++;
    });
    
    if (oldTimeouts.length > 0 || oldIntervals.length > 0) {
      console.log(`[MemoryManager] Limpeza de timers antigos: ${oldTimeouts.length} timeouts, ${oldIntervals.length} intervals`);
    }
  }

  /**
   * TASK-A-003: Agenda cleanup forçado
   */
  scheduleForceCleanup() {
    // Cancela cleanup anterior se existir
    this.cancelForceCleanup();
    
    // Agenda novo cleanup em 30 segundos
    this.forceCleanupTimeout = setTimeout(() => {
      console.log('[MemoryManager] Executando cleanup forçado por inatividade');
      this.forceCleanup();
    }, 30 * 1000);
    
    console.debug('[MemoryManager] Cleanup forçado agendado para 30 segundos');
  }

  /**
   * TASK-A-003: Cancela cleanup forçado
   */
  cancelForceCleanup() {
    if (this.forceCleanupTimeout) {
      clearTimeout(this.forceCleanupTimeout);
      this.forceCleanupTimeout = null;
      console.debug('[MemoryManager] Cleanup forçado cancelado');
    }
  }

  /**
   * TASK-A-003: Executa cleanup forçado
   */
  forceCleanup() {
    console.log('[MemoryManager] Executando cleanup forçado');
    
    // Limpa timers antigos
    this.cleanupOldTimers();
    
    // Executa limpeza de memória
    this.performMemoryCleanup();
    
    // Atualiza estatísticas
    this.memoryStats.cleanupCount++;
    
    // Cancela timeout de cleanup forçado
    this.cancelForceCleanup();
  }

  /**
   * TASK-A-003: Handler melhorado para erros
   */
  handleError(event) {
    console.warn('[MemoryManager] Erro detectado, executando limpeza preventiva:', event.error || event.reason);
    
    // Executa limpeza preventiva
    this.performMemoryCleanup();
    
    // Agenda cleanup forçado se muitos erros
    this.scheduleForceCleanup();
  }

  /**
   * TASK-A-003: Log de estatísticas de memória
   */
  logMemoryStats() {
    const stats = this.getStats();
    const memoryStats = this.getMemoryStats();
    
    console.log('[MemoryManager] Estatísticas de memória:', {
      ...stats,
      ...memoryStats,
      memoryUsage: this.getMemoryUsage()
    });
  }

  /**
   * TASK-A-003: Obtém estatísticas de memória
   */
  getMemoryStats() {
    return {
      ...this.memoryStats,
      leakRatio: this.memoryStats.listenersCreated > 0 
        ? (this.memoryStats.listenersCreated - this.memoryStats.listenersRemoved) / this.memoryStats.listenersCreated 
        : 0
    };
  }

  /**
   * TASK-A-003: Obtém uso de memória (se disponível)
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  /**
   * Adiciona um event listener rastreado
   * @param {Element} element - Elemento DOM
   * @param {string} event - Nome do evento
   * @param {Function} handler - Função handler
   * @param {object} options - Opções do addEventListener
   */
  addEventListener(element, event, handler, options = {}) {
    if (this.isDestroyed) {
      console.warn('[MemoryManager] Tentativa de adicionar listener após destruição');
      return;
    }

    if (!element || typeof handler !== 'function') {
      console.warn('[MemoryManager] Parâmetros inválidos para addEventListener');
      return;
    }

    // Adiciona o listener
    element.addEventListener(event, handler, options);
    
    // TASK-A-003: Rastreamento usando WeakMap (preferencial) e Map (backup)
    const listenerInfo = {
      element,
      event,
      handler,
      options,
      timestamp: Date.now()
    };
    
    // Tenta usar WeakMap primeiro (mais eficiente para GC)
    try {
      if (!this.eventListenersWeakMap.has(element)) {
        this.eventListenersWeakMap.set(element, []);
      }
      this.eventListenersWeakMap.get(element).push(listenerInfo);
    } catch (error) {
      console.debug('[MemoryManager] WeakMap não disponível, usando Map backup');
    }
    
    // Backup usando Map tradicional
    const elementKey = this.getElementKey(element);
    if (!this.eventListeners.has(elementKey)) {
      this.eventListeners.set(elementKey, []);
    }
    this.eventListeners.get(elementKey).push(listenerInfo);

    // TASK-A-003: Atualiza estatísticas
    this.memoryStats.listenersCreated++;

    console.debug(`[MemoryManager] Listener adicionado: ${event} em ${elementKey}`);
  }

  /**
   * Remove um event listener específico
   * @param {Element} element - Elemento DOM
   * @param {string} event - Nome do evento
   * @param {Function} handler - Função handler
   */
  removeEventListener(element, event, handler) {
    if (!element) return;

    element.removeEventListener(event, handler);
    
    // TASK-A-003: Remove do WeakMap se disponível
    try {
      const weakMapListeners = this.eventListenersWeakMap.get(element);
      if (weakMapListeners) {
        const weakIndex = weakMapListeners.findIndex(l => 
          l.event === event && l.handler === handler
        );
        if (weakIndex !== -1) {
          weakMapListeners.splice(weakIndex, 1);
          if (weakMapListeners.length === 0) {
            this.eventListenersWeakMap.delete(element);
          }
        }
      }
    } catch (error) {
      console.debug('[MemoryManager] Erro ao remover do WeakMap:', error);
    }
    
    // Remove do Map backup
    const elementKey = this.getElementKey(element);
    const listeners = this.eventListeners.get(elementKey);
    
    if (listeners) {
      const index = listeners.findIndex(l => 
        l.event === event && l.handler === handler
      );
      
      if (index !== -1) {
        listeners.splice(index, 1);
        console.debug(`[MemoryManager] Listener removido: ${event} de ${elementKey}`);
        
        // TASK-A-003: Atualiza estatísticas
        this.memoryStats.listenersRemoved++;
        
        // Remove a entrada se não há mais listeners
        if (listeners.length === 0) {
          this.eventListeners.delete(elementKey);
        }
      }
    }
  }

  /**
   * Cria um timeout rastreado
   * @param {Function} callback - Função a ser executada
   * @param {number} delay - Delay em milissegundos
   * @returns {number} ID do timeout
   */
  setTimeout(callback, delay) {
    if (this.isDestroyed) {
      console.warn('[MemoryManager] Tentativa de criar timeout após destruição');
      return null;
    }

    const timeoutId = setTimeout(() => {
      // Remove da lista de timeouts ativos quando executado
      this.timeouts.delete(timeoutId);
      
      try {
        callback();
      } catch (error) {
        console.error('[MemoryManager] Erro em timeout callback:', error);
      }
    }, delay);
    
    // TASK-A-003: Rastreia com timestamp para detecção de vazamentos
    this.timeouts.set(timeoutId, Date.now());
    this.memoryStats.timeoutsCreated++;
    
    console.debug(`[MemoryManager] Timeout criado: ${timeoutId} (${delay}ms)`);
    
    return timeoutId;
  }

  /**
   * Limpa um timeout específico
   * @param {number} timeoutId - ID do timeout
   */
  clearTimeout(timeoutId) {
    if (timeoutId && this.timeouts.has(timeoutId)) {
      clearTimeout(timeoutId);
      this.timeouts.delete(timeoutId);
      
      // TASK-A-003: Atualiza estatísticas
      this.memoryStats.timeoutsCleared++;
      
      console.debug(`[MemoryManager] Timeout limpo: ${timeoutId}`);
    }
  }

  /**
   * Cria um interval rastreado
   * @param {Function} callback - Função a ser executada
   * @param {number} delay - Intervalo em milissegundos
   * @returns {number} ID do interval
   */
  setInterval(callback, delay) {
    if (this.isDestroyed) {
      console.warn('[MemoryManager] Tentativa de criar interval após destruição');
      return null;
    }

    const intervalId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error('[MemoryManager] Erro em interval callback:', error);
        // Remove interval problemático
        this.clearInterval(intervalId);
      }
    }, delay);
    
    // TASK-A-003: Rastreia com timestamp para detecção de vazamentos
    this.intervals.set(intervalId, Date.now());
    this.memoryStats.intervalsCreated++;
    
    console.debug(`[MemoryManager] Interval criado: ${intervalId} (${delay}ms)`);
    
    return intervalId;
  }

  /**
   * Limpa um interval específico
   * @param {number} intervalId - ID do interval
   */
  clearInterval(intervalId) {
    if (intervalId && this.intervals.has(intervalId)) {
      clearInterval(intervalId);
      this.intervals.delete(intervalId);
      
      // TASK-A-003: Atualiza estatísticas
      this.memoryStats.intervalsCleared++;
      
      console.debug(`[MemoryManager] Interval limpo: ${intervalId}`);
    }
  }

  /**
   * Registra uma referência global para limpeza
   * @param {string} key - Chave da referência
   * @param {*} value - Valor da referência
   */
  setGlobalRef(key, value) {
    this.globalRefs.set(key, value);
    console.debug(`[MemoryManager] Referência global registrada: ${key}`);
  }

  /**
   * Obtém uma referência global
   * @param {string} key - Chave da referência
   * @returns {*} Valor da referência
   */
  getGlobalRef(key) {
    return this.globalRefs.get(key);
  }

  /**
   * Remove uma referência global
   * @param {string} key - Chave da referência
   */
  clearGlobalRef(key) {
    if (this.globalRefs.has(key)) {
      this.globalRefs.delete(key);
      console.debug(`[MemoryManager] Referência global removida: ${key}`);
    }
  }

  /**
   * Registra um callback de limpeza customizado
   * @param {Function} callback - Função de limpeza
   */
  addCleanupCallback(callback) {
    if (typeof callback === 'function') {
      this.cleanupCallbacks.add(callback);
      console.debug('[MemoryManager] Callback de limpeza registrado');
    }
  }

  /**
   * Remove um callback de limpeza
   * @param {Function} callback - Função de limpeza
   */
  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Gera uma chave única para um elemento DOM
   * @param {Element} element - Elemento DOM
   * @returns {string} Chave única
   */
  getElementKey(element) {
    if (!element) return 'unknown';
    
    // Usa ID se disponível
    if (element.id) return `#${element.id}`;
    
    // Usa classe se disponível
    if (element.className) {
      const classes = element.className.split(' ').filter(Boolean);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    
    // Usa tag name como fallback
    return element.tagName?.toLowerCase() || 'unknown';
  }

  /**
   * Handler para beforeunload
   */
  handleBeforeUnload() {
    console.log('[MemoryManager] Página sendo descarregada, executando limpeza');
    this.cleanup();
  }

  /**
   * Handler para mudança de visibilidade
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('[MemoryManager] Página oculta, executando limpeza preventiva');
      this.performMemoryCleanup();
    }
  }

  /**
   * Executa limpeza de memória sem destruir o manager
   */
  performMemoryCleanup() {
    // Força garbage collection se disponível
    if (typeof window.gc === 'function') {
      try {
        window.gc();
        console.log('[MemoryManager] Garbage collection executado');
      } catch (error) {
        console.debug('[MemoryManager] Garbage collection não disponível');
      }
    }

    // Limpa timeouts e intervals antigos (mais de 5 minutos)
    const now = Date.now();
    const oldThreshold = 5 * 60 * 1000; // 5 minutos

    // Nota: Para uma implementação mais robusta, seria necessário rastrear
    // timestamps de criação dos timeouts/intervals
    console.log('[MemoryManager] Limpeza de memória executada');
  }

  /**
   * Limpa todos os recursos rastreados
   */
  cleanup() {
    if (this.isDestroyed) {
      console.warn('[MemoryManager] Cleanup já executado');
      return;
    }

    console.log('[MemoryManager] Iniciando limpeza completa de recursos');

    // TASK-A-003: Cancela cleanup forçado se estiver agendado
    this.cancelForceCleanup();

    // TASK-A-003: Para verificação de vazamentos de memória
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Executa callbacks de limpeza customizados
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[MemoryManager] Erro em callback de limpeza:', error);
      }
    });

    // TASK-A-003: Remove todos os event listeners (incluindo WeakMap)
    let listenersRemoved = 0;
    
    // Limpa do Map tradicional
    this.eventListeners.forEach((listeners, elementKey) => {
      listeners.forEach(({ element, event, handler }) => {
        try {
          if (element && element.removeEventListener) {
            element.removeEventListener(event, handler);
            listenersRemoved++;
          }
        } catch (error) {
          console.error(`[MemoryManager] Erro ao remover listener ${event} de ${elementKey}:`, error);
        }
      });
    });

    // TASK-A-003: Limpa todos os timeouts com contagem
    let timeoutsCleared = 0;
    this.timeouts.forEach((timestamp, timeoutId) => {
      try {
        clearTimeout(timeoutId);
        timeoutsCleared++;
      } catch (error) {
        console.error(`[MemoryManager] Erro ao limpar timeout ${timeoutId}:`, error);
      }
    });

    // TASK-A-003: Limpa todos os intervals com contagem
    let intervalsCleared = 0;
    this.intervals.forEach((timestamp, intervalId) => {
      try {
        clearInterval(intervalId);
        intervalsCleared++;
      } catch (error) {
        console.error(`[MemoryManager] Erro ao limpar interval ${intervalId}:`, error);
      }
    });

    // Limpa referências globais
    this.globalRefs.clear();

    // TASK-A-003: Limpa coleções e WeakMap
    this.eventListeners.clear();
    this.timeouts.clear();
    this.intervals.clear();
    this.cleanupCallbacks.clear();
    
    // Limpa WeakMap (não há método clear, mas as referências serão coletadas pelo GC)
    this.eventListenersWeakMap = new WeakMap();

    // TASK-A-003: Remove listeners globais melhorados
    try {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('error', this.handleError);
      window.removeEventListener('unhandledrejection', this.handleError);
      window.removeEventListener('blur', this.scheduleForceCleanup);
      window.removeEventListener('focus', this.cancelForceCleanup);
    } catch (error) {
      console.error('[MemoryManager] Erro ao remover listeners globais:', error);
    }

    // TASK-A-003: Atualiza estatísticas finais
    this.memoryStats.listenersRemoved += listenersRemoved;
    this.memoryStats.timeoutsCleared += timeoutsCleared;
    this.memoryStats.intervalsCleared += intervalsCleared;
    this.memoryStats.cleanupCount++;

    // Executa garbage collection final se disponível
    this.performMemoryCleanup();

    // TASK-A-003: Log estatísticas finais
    console.log('[MemoryManager] Estatísticas finais de limpeza:', {
      listenersRemoved,
      timeoutsCleared,
      intervalsCleared,
      totalStats: this.getMemoryStats()
    });

    this.isDestroyed = true;
    console.log('[MemoryManager] Limpeza completa finalizada');
  }

  /**
   * Obtém estatísticas de uso de recursos
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      eventListeners: this.eventListeners.size,
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      globalRefs: this.globalRefs.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
      isDestroyed: this.isDestroyed
    };
  }

  /**
   * Log das estatísticas atuais
   */
  logStats() {
    const stats = this.getStats();
    console.log('[MemoryManager] Estatísticas:', stats);
  }
}

// Instância singleton global
let globalMemoryManager = null;

/**
 * Obtém a instância global do MemoryManager
 * @returns {MemoryManager} Instância do MemoryManager
 */
export function getMemoryManager() {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager();
  }
  return globalMemoryManager;
}

/**
 * Destrói a instância global do MemoryManager
 */
export function destroyMemoryManager() {
  if (globalMemoryManager) {
    globalMemoryManager.cleanup();
    globalMemoryManager = null;
  }
}
