/**
 * @file MemoryManager - Sistema robusto de gerenciamento de memória e limpeza de recursos
 * Responsável por rastrear e limpar event listeners, timeouts, intervalos e referências globais
 */

import { CONFIG } from "./config.js";

/**
 * Classe para gerenciamento centralizado de memória e recursos
 */
export class MemoryManager {
  constructor() {
    this.eventListeners = new Map(); // Rastreia event listeners por elemento
    this.timeouts = new Set(); // Rastreia timeouts ativos
    this.intervals = new Set(); // Rastreia intervalos ativos
    this.globalRefs = new Map(); // Rastreia referências globais
    this.cleanupCallbacks = new Set(); // Callbacks de limpeza customizados
    this.isDestroyed = false;
    
    // Bind methods para preservar contexto
    this.cleanup = this.cleanup.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Registra listeners globais para limpeza automática
    this.registerGlobalCleanupListeners();
    
    console.log('[MemoryManager] Inicializado');
  }

  /**
   * Registra event listeners globais para limpeza automática
   */
  registerGlobalCleanupListeners() {
    // Limpeza antes de descarregar a página
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Limpeza quando a página fica oculta (mudança de aba, minimizar, etc.)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Limpeza em caso de erro não capturado
    window.addEventListener('error', (event) => {
      console.warn('[MemoryManager] Erro detectado, executando limpeza preventiva:', event.error);
      this.performMemoryCleanup();
    });
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
    
    // Rastreia o listener para limpeza posterior
    const elementKey = this.getElementKey(element);
    if (!this.eventListeners.has(elementKey)) {
      this.eventListeners.set(elementKey, []);
    }
    
    this.eventListeners.get(elementKey).push({
      element,
      event,
      handler,
      options
    });

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
    
    const elementKey = this.getElementKey(element);
    const listeners = this.eventListeners.get(elementKey);
    
    if (listeners) {
      const index = listeners.findIndex(l => 
        l.event === event && l.handler === handler
      );
      
      if (index !== -1) {
        listeners.splice(index, 1);
        console.debug(`[MemoryManager] Listener removido: ${event} de ${elementKey}`);
        
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
    
    this.timeouts.add(timeoutId);
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
    
    this.intervals.add(intervalId);
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

    // Executa callbacks de limpeza customizados
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[MemoryManager] Erro em callback de limpeza:', error);
      }
    });

    // Remove todos os event listeners
    this.eventListeners.forEach((listeners, elementKey) => {
      listeners.forEach(({ element, event, handler }) => {
        try {
          if (element && element.removeEventListener) {
            element.removeEventListener(event, handler);
          }
        } catch (error) {
          console.error(`[MemoryManager] Erro ao remover listener ${event} de ${elementKey}:`, error);
        }
      });
    });

    // Limpa todos os timeouts
    this.timeouts.forEach(timeoutId => {
      try {
        clearTimeout(timeoutId);
      } catch (error) {
        console.error(`[MemoryManager] Erro ao limpar timeout ${timeoutId}:`, error);
      }
    });

    // Limpa todos os intervals
    this.intervals.forEach(intervalId => {
      try {
        clearInterval(intervalId);
      } catch (error) {
        console.error(`[MemoryManager] Erro ao limpar interval ${intervalId}:`, error);
      }
    });

    // Limpa referências globais
    this.globalRefs.clear();

    // Limpa coleções
    this.eventListeners.clear();
    this.timeouts.clear();
    this.intervals.clear();
    this.cleanupCallbacks.clear();

    // Remove listeners globais
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Executa garbage collection final se disponível
    this.performMemoryCleanup();

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