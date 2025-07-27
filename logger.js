/**
 * @file Sistema de Logging Estruturado - TASK-M-001
 * Sistema centralizado de logging com níveis, contexto, timestamps e rotação
 * Compatível com Firefox, Chrome e Edge
 */

import { CONFIG } from './config.js';

/**
 * Níveis de log disponíveis
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * Configuração padrão do logger
 */
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  maxStoredLogs: 500,
  rotationSize: 100,
  enableConsole: true,
  enableStorage: true,
  timestampFormat: 'ISO',
  contextFields: ['component', 'operation', 'userId', 'sessionId']
};

/**
 * Sistema centralizado de logging estruturado
 */
class StructuredLogger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.logBuffer = [];
    this.isInitialized = false;
    this.api = null;
    
    this.init();
  }

  /**
   * Inicializa o logger
   */
  async init() {
    try {
      // Compatibilidade cross-browser
      this.api = globalThis.browser || globalThis.chrome;
      
      if (this.api && this.config.enableStorage) {
        await this.loadStoredLogs();
        await this.setupRotation();
      }
      
      this.isInitialized = true;
      this.info('Logger inicializado', { 
        component: 'Logger',
        sessionId: this.sessionId,
        config: this.config 
      });
    } catch (error) {
      console.error('[Logger] Falha na inicialização:', error);
    }
  }

  /**
   * Gera ID único da sessão
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formata timestamp conforme configuração
   */
  formatTimestamp() {
    const now = new Date();
    
    switch (this.config.timestampFormat) {
      case 'ISO':
        return now.toISOString();
      case 'LOCAL':
        return now.toLocaleString('pt-BR');
      case 'UNIX':
        return now.getTime();
      default:
        return now.toISOString();
    }
  }

  /**
   * Cria entrada de log estruturada
   */
  createLogEntry(level, message, context = {}) {
    const timestamp = this.formatTimestamp();
    const levelName = Object.keys(LOG_LEVELS)[level];
    
    // Filtra campos de contexto permitidos
    const filteredContext = {};
    this.config.contextFields.forEach(field => {
      if (context[field] !== undefined) {
        filteredContext[field] = context[field];
      }
    });

    return {
      timestamp,
      level: levelName,
      levelValue: level,
      message,
      context: filteredContext,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location?.href : 'background',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  shouldLog(level) {
    return level >= this.config.level;
  }

  /**
   * Formata mensagem para console
   */
  formatConsoleMessage(entry) {
    const prefix = `[${entry.level}] ${entry.timestamp.substring(11, 19)}`;
    const component = entry.context.component ? `[${entry.context.component}]` : '';
    return `${prefix} ${component} ${entry.message}`;
  }

  /**
   * Envia log para console
   */
  logToConsole(entry) {
    if (!this.config.enableConsole) return;

    const message = this.formatConsoleMessage(entry);
    const contextData = Object.keys(entry.context).length > 0 ? entry.context : undefined;

    switch (entry.level) {
      case 'DEBUG':
        console.debug(message, contextData);
        break;
      case 'INFO':
        console.info(message, contextData);
        break;
      case 'WARN':
        console.warn(message, contextData);
        break;
      case 'ERROR':
        console.error(message, contextData);
        break;
      default:
        console.log(message, contextData);
    }
  }

  /**
   * Adiciona log ao buffer
   */
  addToBuffer(entry) {
    this.logBuffer.push(entry);
    
    // Limita tamanho do buffer
    if (this.logBuffer.length > this.config.maxStoredLogs) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxStoredLogs);
    }
  }

  /**
   * Salva logs no storage
   */
  async saveToStorage() {
    if (!this.api || !this.config.enableStorage || this.logBuffer.length === 0) {
      return;
    }

    try {
      const storageKey = 'structuredLogs';
      const existingData = await this.api.storage.local.get([storageKey]);
      const existingLogs = existingData[storageKey] || [];
      
      const allLogs = [...existingLogs, ...this.logBuffer];
      
      // Aplica rotação se necessário
      const logsToStore = allLogs.length > this.config.maxStoredLogs 
        ? allLogs.slice(-this.config.maxStoredLogs)
        : allLogs;

      await this.api.storage.local.set({
        [storageKey]: logsToStore,
        lastLogRotation: Date.now()
      });

      this.logBuffer = [];
    } catch (error) {
      console.error('[Logger] Falha ao salvar no storage:', error);
    }
  }

  /**
   * Carrega logs do storage
   */
  async loadStoredLogs() {
    if (!this.api || !this.config.enableStorage) return;

    try {
      const data = await this.api.storage.local.get(['structuredLogs']);
      const storedLogs = data.structuredLogs || [];
      
      // Mantém apenas logs recentes no buffer
      this.logBuffer = storedLogs.slice(-this.config.rotationSize);
    } catch (error) {
      console.error('[Logger] Falha ao carregar logs do storage:', error);
    }
  }

  /**
   * Configura rotação automática de logs
   */
  async setupRotation() {
    // Rotação a cada 5 minutos
    setInterval(async () => {
      await this.saveToStorage();
      await this.performRotation();
    }, 5 * 60 * 1000);
  }

  /**
   * Executa rotação de logs
   */
  async performRotation() {
    if (!this.api || !this.config.enableStorage) return;

    try {
      const data = await this.api.storage.local.get(['structuredLogs', 'lastLogRotation']);
      const logs = data.structuredLogs || [];
      const lastRotation = data.lastLogRotation || 0;
      
      // Rotaciona se há muitos logs ou se passou muito tempo
      const shouldRotate = logs.length > this.config.maxStoredLogs || 
                          (Date.now() - lastRotation) > (24 * 60 * 60 * 1000); // 24h

      if (shouldRotate) {
        const recentLogs = logs.slice(-this.config.rotationSize);
        
        await this.api.storage.local.set({
          structuredLogs: recentLogs,
          lastLogRotation: Date.now()
        });

        this.info('Rotação de logs executada', {
          component: 'Logger',
          operation: 'rotation',
          removedLogs: logs.length - recentLogs.length,
          remainingLogs: recentLogs.length
        });
      }
    } catch (error) {
      console.error('[Logger] Falha na rotação de logs:', error);
    }
  }

  /**
   * Método principal de logging
   */
  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    
    this.logToConsole(entry);
    this.addToBuffer(entry);

    // Salva periodicamente no storage
    if (this.logBuffer.length % 10 === 0) {
      this.saveToStorage().catch(error => {
        console.error('[Logger] Falha ao salvar logs:', error);
      });
    }

    return entry;
  }

  /**
   * Métodos de conveniência para diferentes níveis
   */
  debug(message, context = {}) {
    return this.log(LOG_LEVELS.DEBUG, message, context);
  }

  info(message, context = {}) {
    return this.log(LOG_LEVELS.INFO, message, context);
  }

  warn(message, context = {}) {
    return this.log(LOG_LEVELS.WARN, message, context);
  }

  error(message, context = {}) {
    return this.log(LOG_LEVELS.ERROR, message, context);
  }

  /**
   * Métodos utilitários
   */

  /**
   * Obtém logs armazenados
   */
  async getStoredLogs(filters = {}) {
    if (!this.api || !this.config.enableStorage) {
      return this.logBuffer;
    }

    try {
      const data = await this.api.storage.local.get(['structuredLogs']);
      let logs = data.structuredLogs || [];

      // Aplica filtros
      if (filters.level) {
        logs = logs.filter(log => log.levelValue >= filters.level);
      }

      if (filters.component) {
        logs = logs.filter(log => log.context.component === filters.component);
      }

      if (filters.since) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.since));
      }

      if (filters.limit) {
        logs = logs.slice(-filters.limit);
      }

      return logs;
    } catch (error) {
      console.error('[Logger] Falha ao recuperar logs:', error);
      return [];
    }
  }

  /**
   * Exporta logs para debugging
   */
  async exportLogs(format = 'json') {
    const logs = await this.getStoredLogs();
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'level', 'message', 'component', 'operation'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
          const row = [
            log.timestamp,
            log.level,
            `"${log.message.replace(/"/g, '""')}"`,
            log.context.component || '',
            log.context.operation || ''
          ];
          csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
      
      case 'text':
        return logs.map(log => 
          `${log.timestamp} [${log.level}] ${log.context.component ? `[${log.context.component}] ` : ''}${log.message}`
        ).join('\n');
      
      default:
        return logs;
    }
  }

  /**
   * Limpa logs armazenados
   */
  async clearLogs() {
    this.logBuffer = [];
    
    if (this.api && this.config.enableStorage) {
      try {
        await this.api.storage.local.remove(['structuredLogs', 'lastLogRotation']);
        this.info('Logs limpos', { component: 'Logger', operation: 'clear' });
      } catch (error) {
        console.error('[Logger] Falha ao limpar logs do storage:', error);
      }
    }
  }

  /**
   * Obtém estatísticas dos logs
   */
  async getLogStats() {
    const logs = await this.getStoredLogs();
    
    const stats = {
      total: logs.length,
      byLevel: {},
      byComponent: {},
      sessionId: this.sessionId,
      oldestLog: logs.length > 0 ? logs[0].timestamp : null,
      newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };

    // Conta por nível
    Object.keys(LOG_LEVELS).forEach(level => {
      stats.byLevel[level] = logs.filter(log => log.level === level).length;
    });

    // Conta por componente
    logs.forEach(log => {
      const component = log.context.component || 'unknown';
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
    });

    return stats;
  }

  /**
   * Configura nível de log dinamicamente
   */
  setLogLevel(level) {
    if (typeof level === 'string') {
      level = LOG_LEVELS[level.toUpperCase()];
    }
    
    if (level !== undefined && level >= 0 && level <= 3) {
      this.config.level = level;
      this.info('Nível de log alterado', { 
        component: 'Logger', 
        operation: 'setLevel',
        newLevel: Object.keys(LOG_LEVELS)[level]
      });
    }
  }

  /**
   * Força salvamento imediato
   */
  async flush() {
    await this.saveToStorage();
  }

  /**
   * Destrói o logger e limpa recursos
   */
  async destroy() {
    await this.flush();
    this.logBuffer = [];
    this.isInitialized = false;
  }
}

// Instância global do logger
let globalLogger = null;

/**
 * Obtém instância global do logger
 */
export function getLogger(config = {}) {
  if (!globalLogger) {
    globalLogger = new StructuredLogger(config);
  }
  return globalLogger;
}

/**
 * Métodos de conveniência para logging global
 */
export function debug(message, context = {}) {
  return getLogger().debug(message, context);
}

export function info(message, context = {}) {
  return getLogger().info(message, context);
}

export function warn(message, context = {}) {
  return getLogger().warn(message, context);
}

export function error(message, context = {}) {
  return getLogger().error(message, context);
}

/**
 * Utilitários de debugging
 */
export async function exportLogs(format = 'json') {
  return await getLogger().exportLogs(format);
}

export async function getLogStats() {
  return await getLogger().getLogStats();
}

export async function clearLogs() {
  return await getLogger().clearLogs();
}

export function setLogLevel(level) {
  return getLogger().setLogLevel(level);
}

/**
 * Configuração específica para diferentes componentes
 */
export const COMPONENT_CONFIGS = {
  API: { component: 'API' },
  BACKGROUND: { component: 'Background' },
  CONTENT: { component: 'Content' },
  SIDEBAR: { component: 'Sidebar' },
  VALIDATION: { component: 'Validation' },
  MEMORY: { component: 'Memory' },
  CRYPTO: { component: 'Crypto' },
  STORAGE: { component: 'Storage' }
};

/**
 * Cria logger específico para componente
 */
export function createComponentLogger(componentName) {
  const logger = getLogger();
  
  return {
    debug: (message, context = {}) => logger.debug(message, { ...context, component: componentName }),
    info: (message, context = {}) => logger.info(message, { ...context, component: componentName }),
    warn: (message, context = {}) => logger.warn(message, { ...context, component: componentName }),
    error: (message, context = {}) => logger.error(message, { ...context, component: componentName })
  };
}

// Exporta classe para uso avançado
export { StructuredLogger };

// Inicialização automática
if (typeof window !== 'undefined' || typeof globalThis.chrome !== 'undefined' || typeof globalThis.browser !== 'undefined') {
  // Inicializa logger global automaticamente
  getLogger();
}