# 🔧 TASK-M-005: Error Handling Padronizado - Guia de Implementação

**⏰ Prioridade:** CRÍTICA - DEVE SER IMPLEMENTADO PRIMEIRO
**📅 Estimativa:** 2 dias
**👤 Responsável:** Quality Assurance Team
**🎯 Objetivo:** Criar infraestrutura de logging centralizada que será base para toda sanitização médica

---

## 📋 VISÃO GERAL

### 🎯 Por que TASK-M-005 é PRIMEIRO?

**TASK-M-005 é a FUNDAÇÃO de toda a arquitetura de segurança médica:**

1. **Logger Centralizado Base** - Toda sanitização depende de logging consistente
2. **TASK-C-001 (Medical Data Logging)** - Impossível sem `ErrorHandler` central
3. **TASK-A-001 (Content Script Logging)** - Usa mesma função de sanitização
4. **TASK-C-003 (Message Validation)** - Precisa de categorização de errors
5. **Compliance LGPD/HIPAA** - Requer logging médico seguro desde o início

### 🏥 Contexto Médico Específico

**Esta extensão processa dados sensíveis:**

- ✅ IDs de regulação médica (`reguId`, `reguIdp`)
- ✅ Dados de pacientes (timeline, consultas, exames)
- ✅ Informações do SIGSS e CADSUS
- ✅ Tokens de autenticação médica (`isenFullPKCrypto`)

**⚠️ NUNCA LOGAR:** CPF, CNS, nomes completos, dados demográficos, endereços

---

## 🔧 ARQUITETURA DA SOLUÇÃO

### 📁 Estrutura de Arquivos

```
AssistenteDeRegulacaoMedica/
├── ErrorHandler.js          # ✨ NOVO - Logger centralizado
├── api.js                   # 🔄 ATUALIZAR - Usar ErrorHandler
├── background.js            # 🔄 ATUALIZAR - Usar ErrorHandler
├── sidebar.js               # 🔄 ATUALIZAR - Usar ErrorHandler
├── content-script.js        # 🔄 ATUALIZAR - Usar ErrorHandler
├── utils.js                 # 🔄 ATUALIZAR - Usar ErrorHandler
└── test/
    └── unit/
        └── ErrorHandler.test.js  # ✨ NOVO - Testes completos
```

### 🎨 Design Patterns

```javascript
// Padrão Singleton para ErrorHandler
const ErrorHandler = {
  instance: null,
  getInstance() {
    /* ... */
  },
};

// Padrão Observer para listeners de erro
const ErrorObserver = {
  listeners: [],
  subscribe(callback) {
    /* ... */
  },
  notify(error) {
    /* ... */
  },
};

// Padrão Strategy para diferentes tipos de sanitização
const SanitizationStrategies = {
  MEDICAL_DATA: (data) => {
    /* ... */
  },
  API_RESPONSE: (data) => {
    /* ... */
  },
  USER_INPUT: (data) => {
    /* ... */
  },
};
```

---

## 📝 IMPLEMENTAÇÃO DETALHADA

### 🚀 PASSO 1: Criar ErrorHandler.js

**Arquivo:** `c:\AssistenteDeRegulacaoMedica\ErrorHandler.js`

```javascript
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
export const ERROR_LEVELS = {
  TRACE: 0, // Debugging detalhado (apenas dev)
  DEBUG: 1, // Informações de debug (apenas dev)
  INFO: 2, // Informações gerais (produção OK)
  WARN: 3, // Avisos (produção OK)
  ERROR: 4, // Erros (produção OK)
  FATAL: 5, // Erros críticos (produção OK)
};

/**
 * Categorias de erro específicas para ambiente médico
 */
export const ERROR_CATEGORIES = {
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
  USER_INPUT: 'user_input',
};

/**
 * Campos médicos sensíveis que NUNCA devem ser logados
 */
const SENSITIVE_MEDICAL_FIELDS = [
  // Identificação pessoal
  'cpf',
  'rg',
  'cns',
  'cartao_sus',
  'nome',
  'nome_completo',
  'nome_mae',
  'nome_pai',

  // Dados demográficos
  'data_nascimento',
  'idade',
  'sexo',
  'genero',
  'endereco',
  'rua',
  'numero',
  'bairro',
  'cidade',
  'cep',
  'telefone',
  'celular',
  'email',

  // Dados médicos específicos
  'diagnostico',
  'cid',
  'procedimento',
  'medicamento',
  'dosagem',
  'tratamento',

  // Tokens e IDs sensíveis (alguns são OK para log)
  'senha',
  'password',
  'token_acesso',
];

/**
 * Campos OK para logging (IDs técnicos necessários para debug)
 */
const LOGGABLE_TECHNICAL_FIELDS = [
  'id',
  'uuid',
  'reguId',
  'reguIdp',
  'reguIds',
  'isenPK',
  'isenFullPKCrypto',
  'sessionId',
  'requestId',
  'transactionId',
  'correlationId',
];

/**
 * Configurações do ErrorHandler baseadas no ambiente
 */
const getConfig = () => {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    (typeof chrome !== 'undefined' && chrome.runtime.getManifest().version.includes('dev'));

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
    enablePerformanceTiming: true,
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
        await api.storage.local.set({ medicalErrors: [] });
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
      window.addEventListener('error', (event) => {
        this.logError(
          'Erro JavaScript não tratado',
          {
            message: event.message,
            filename: this.sanitizeFilename(event.filename),
            lineno: event.lineno,
            colno: event.colno,
          },
          ERROR_CATEGORIES.EXTENSION_LIFECYCLE
        );
      });

      // Captura promises rejeitadas não tratadas
      window.addEventListener('unhandledrejection', (event) => {
        this.logError(
          'Promise rejeitada não tratada',
          {
            reason: event.reason?.message || 'Unknown error',
          },
          ERROR_CATEGORIES.EXTENSION_LIFECYCLE
        );
      });
    }

    // Captura violations de CSP
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.logError(
          'Violação de CSP detectada',
          {
            directive: event.violatedDirective,
            blockedURI: event.blockedURI,
            disposition: event.disposition,
          },
          ERROR_CATEGORIES.CSP_VIOLATION
        );
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
      return data.length > 5
        ? [
            ...data.slice(0, 5).map((item) => this.sanitizeForLogging(item, strategy)),
            `...${data.length - 5} more items`,
          ]
        : data.map((item) => this.sanitizeForLogging(item, strategy));
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

    return SENSITIVE_MEDICAL_FIELDS.some((sensitiveField) =>
      lowerField.includes(sensitiveField.toLowerCase())
    );
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
      extensionVersion: this.getExtensionVersion(),
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

      await api.storage.local.set({ medicalErrors: errors });
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
    this.errorObservers.forEach((observer) => {
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
      this.logInfo(`Performance: ${name} took ${duration}ms`, { duration }, category);
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
      this.logWarning('Falha ao recuperar errors armazenados', { error: error.message });
      return [];
    }
  }

  /**
   * Limpa errors armazenados
   */
  async clearStoredErrors() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      await api.storage.local.set({ medicalErrors: [] });
      this.logInfo('Errors armazenados limpos');
    } catch (error) {
      this.logWarning('Falha ao limpar errors armazenados', { error: error.message });
    }
  }
}

// Singleton instance
let errorHandlerInstance = null;

/**
 * Obtém instância singleton do ErrorHandler
 * @returns {MedicalErrorHandler} Instância do ErrorHandler
 */
export function getErrorHandler() {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new MedicalErrorHandler();
  }
  return errorHandlerInstance;
}

// Exportar instância padrão para conveniência
export const ErrorHandler = getErrorHandler();

// Exports para backward compatibility e testing
export { MedicalErrorHandler };

/**
 * Helper functions para uso rápido
 */
export const logInfo = (message, data, category) => ErrorHandler.logInfo(message, data, category);
export const logWarning = (message, data, category) =>
  ErrorHandler.logWarning(message, data, category);
export const logError = (message, data, category) => ErrorHandler.logError(message, data, category);
export const logFatal = (message, data, category) => ErrorHandler.logFatal(message, data, category);
export const logDebug = (message, data, category) => ErrorHandler.logDebug(message, data, category);

/**
 * Sanitização específica para dados médicos (export direto)
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} Dados sanitizados
 */
export const sanitizeForLog = (data) => ErrorHandler.sanitizeForLogging(data);
```

### 🧪 PASSO 2: Criar Testes Unitários

**Arquivo:** `c:\AssistenteDeRegulacaoMedica\test\unit\ErrorHandler.test.js`

```javascript
/**
 * Testes unitários para ErrorHandler
 */

import {
  getErrorHandler,
  ErrorHandler,
  ERROR_LEVELS,
  ERROR_CATEGORIES,
  sanitizeForLog,
  logInfo,
  logError,
} from '../../ErrorHandler.js';

// Mock browser APIs
global.chrome = {
  runtime: {
    getManifest: () => ({ version: '3.3.7-test' }),
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({ medicalErrors: [] })),
      set: jest.fn(() => Promise.resolve()),
    },
  },
};

global.console = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('getErrorHandler retorna sempre a mesma instância', () => {
      const instance1 = getErrorHandler();
      const instance2 = getErrorHandler();
      expect(instance1).toBe(instance2);
    });

    test('ErrorHandler exportado é a mesma instância', () => {
      const directInstance = ErrorHandler;
      const getterInstance = getErrorHandler();
      expect(directInstance).toBe(getterInstance);
    });
  });

  describe('Sanitização de Dados Médicos', () => {
    test('sanitiza campos médicos sensíveis', () => {
      const sensitiveData = {
        id: 'REGU_123',
        cpf: '123.456.789-01',
        nome: 'João Silva',
        cns: '12345678901234',
        telefone: '(11) 99999-9999',
        reguId: 'REG_456',
      };

      const sanitized = sanitizeForLog(sensitiveData);

      expect(sanitized.id).toBe('REGU_123'); // Technical ID - OK
      expect(sanitized.reguId).toBe('REG_456'); // Technical ID - OK
      expect(sanitized.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.cns).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.telefone).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('preserva IDs técnicos necessários para debug', () => {
      const technicalData = {
        reguId: 'REG_123',
        reguIdp: 'REGP_456',
        isenPK: 'ISEN_789',
        isenFullPKCrypto: 'CRYPTO_ABC',
        sessionId: 'SESS_DEF',
        requestId: 'REQ_GHI',
      };

      const sanitized = sanitizeForLog(technicalData);

      // Todos esses IDs técnicos devem ser preservados
      Object.keys(technicalData).forEach((key) => {
        expect(sanitized[key]).toBe(technicalData[key]);
      });
    });

    test('sanitiza arrays recursivamente', () => {
      const arrayData = [
        { id: 'PAT_1', nome: 'João', cpf: '123.456.789-01' },
        { id: 'PAT_2', nome: 'Maria', cpf: '987.654.321-00' },
      ];

      const sanitized = sanitizeForLog(arrayData);

      expect(sanitized).toHaveLength(2);
      expect(sanitized[0].id).toBe('PAT_1');
      expect(sanitized[0].nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized[0].cpf).toBe('[SANITIZED_MEDICAL_DATA]');
    });

    test('limita tamanho de arrays grandes', () => {
      const largeArray = new Array(10).fill({ id: 'TEST' });
      const sanitized = sanitizeForLog(largeArray);

      expect(sanitized).toHaveLength(6); // 5 items + "...X more items"
      expect(sanitized[5]).toContain('more items');
    });

    test('trunca strings muito longas', () => {
      const longString = 'A'.repeat(200);
      const sanitized = sanitizeForLog(longString);

      expect(sanitized).toHaveLength(103); // 100 chars + "..."
      expect(sanitized).toEndWith('...');
    });

    test('lida com nested objects', () => {
      const nestedData = {
        patient: {
          id: 'PAT_123',
          personalInfo: {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            medical: {
              diagnostico: 'Diabetes',
              cid: 'E11',
            },
          },
        },
        reguId: 'REG_456',
      };

      const sanitized = sanitizeForLog(nestedData);

      expect(sanitized.reguId).toBe('REG_456');
      expect(sanitized.patient.id).toBe('PAT_123');
      expect(sanitized.patient.personalInfo.nome).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.medical.diagnostico).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(sanitized.patient.personalInfo.medical.cid).toBe('[SANITIZED_MEDICAL_DATA]');
    });
  });

  describe('Logging Functionality', () => {
    test('logInfo funciona corretamente', () => {
      logInfo('Test info message', { test: 'data' }, ERROR_CATEGORIES.SIGSS_API);

      expect(console.info).toHaveBeenCalledWith('[Assistente Médico sigss_api] Test info message', {
        test: 'data',
      });
    });

    test('logError funciona corretamente', () => {
      logError('Test error message', { error: 'details' }, ERROR_CATEGORIES.MEDICAL_DATA);

      expect(console.error).toHaveBeenCalledWith(
        '[Assistente Médico medical_data] Test error message',
        { error: 'details' }
      );
    });

    test('sanitiza dados automaticamente no log', () => {
      const sensitiveData = {
        reguId: 'REG_123',
        cpf: '123.456.789-01',
        nome: 'João Silva',
      };

      logError('Erro com dados sensíveis', sensitiveData);

      const loggedData = console.error.mock.calls[0][1];
      expect(loggedData.reguId).toBe('REG_123');
      expect(loggedData.cpf).toBe('[SANITIZED_MEDICAL_DATA]');
      expect(loggedData.nome).toBe('[SANITIZED_MEDICAL_DATA]');
    });
  });

  describe('Error Categories', () => {
    test('categorias médicas estão definidas', () => {
      expect(ERROR_CATEGORIES.SIGSS_API).toBeDefined();
      expect(ERROR_CATEGORIES.CADSUS_API).toBeDefined();
      expect(ERROR_CATEGORIES.MEDICAL_DATA).toBeDefined();
      expect(ERROR_CATEGORIES.SECURITY).toBeDefined();
    });

    test('níveis de erro estão definidos', () => {
      expect(ERROR_LEVELS.DEBUG).toBe(1);
      expect(ERROR_LEVELS.INFO).toBe(2);
      expect(ERROR_LEVELS.WARN).toBe(3);
      expect(ERROR_LEVELS.ERROR).toBe(4);
      expect(ERROR_LEVELS.FATAL).toBe(5);
    });
  });

  describe('Performance Tracking', () => {
    test('performance marks funcionam', () => {
      const handler = getErrorHandler();

      handler.startPerformanceMark('test_operation');

      // Simular operação
      setTimeout(() => {
        handler.endPerformanceMark('test_operation');

        expect(console.info).toHaveBeenCalledWith(
          expect.stringContaining('Performance: test_operation took'),
          expect.objectContaining({ duration: expect.any(Number) })
        );
      }, 10);
    });
  });

  describe('Error Storage', () => {
    test('armazena errors críticos', async () => {
      const handler = getErrorHandler();

      await handler.logError('Erro crítico teste', { severity: 'high' });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalErrors: expect.arrayContaining([
            expect.objectContaining({
              message: 'Erro crítico teste',
              level: 'ERROR',
            }),
          ]),
        })
      );
    });

    test('recupera errors armazenados', async () => {
      const mockErrors = [
        { message: 'Erro 1', level: 'ERROR', timestamp: '2024-01-01T00:00:00.000Z' },
        { message: 'Erro 2', level: 'FATAL', timestamp: '2024-01-01T01:00:00.000Z' },
      ];

      chrome.storage.local.get.mockResolvedValue({ medicalErrors: mockErrors });

      const handler = getErrorHandler();
      const storedErrors = await handler.getStoredErrors();

      expect(storedErrors).toEqual(mockErrors);
    });
  });

  describe('Observer Pattern', () => {
    test('observers são notificados de novos logs', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          level: 'INFO',
        })
      );
    });

    test('unsubscribe remove observer', () => {
      const handler = getErrorHandler();
      const mockObserver = jest.fn();

      handler.subscribe(mockObserver);
      handler.unsubscribe(mockObserver);
      handler.logInfo('Test message');

      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Medical Compliance', () => {
    test('nunca loga campos médicos sensíveis', () => {
      const testCases = [
        { cpf: '123.456.789-01' },
        { cns: '12345678901234' },
        { nome_completo: 'João da Silva' },
        { data_nascimento: '1990-01-01' },
        { endereco: 'Rua das Flores, 123' },
        { telefone: '(11) 99999-9999' },
        { diagnostico: 'Diabetes Type 2' },
        { medicamento: 'Metformina 500mg' },
      ];

      testCases.forEach((testCase) => {
        const sanitized = sanitizeForLog(testCase);
        Object.values(sanitized).forEach((value) => {
          expect(value).toBe('[SANITIZED_MEDICAL_DATA]');
        });
      });
    });

    test('preserva IDs técnicos necessários para debugging médico', () => {
      const medicalTechnicalData = {
        reguId: 'REG_2024_001',
        reguIdp: 'REGP_2024_001',
        reguIds: 'REGS_2024_001',
        isenPK: 'ISEN_ABC123',
        isenFullPKCrypto: 'CRYPTO_DEF456',
        sessionId: 'SESS_GHI789',
        requestId: 'REQ_JKL012',
        transactionId: 'TXN_MNO345',
      };

      const sanitized = sanitizeForLog(medicalTechnicalData);

      Object.entries(medicalTechnicalData).forEach(([key, value]) => {
        expect(sanitized[key]).toBe(value);
      });
    });
  });
});
```

### 🔄 PASSO 3: Atualizar api.js

**Modificações em:** `c:\AssistenteDeRegulacaoMedica\api.js`

```javascript
// Adicionar no topo do arquivo, após as importações existentes
import {
  logInfo,
  logWarning,
  logError,
  ERROR_CATEGORIES,
  getErrorHandler,
} from './ErrorHandler.js';

// Substituir função handleFetchError existente
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
    operation,
  };

  logError(
    `Erro na requisição: ${response.status} ${response.statusText}`,
    errorData,
    ERROR_CATEGORIES.SIGSS_API
  );

  throw new Error('Falha na comunicação com o servidor.');
}

// Exemplo de atualização em uma função existente (getBaseUrl)
export async function getBaseUrl() {
  let data;
  try {
    const handler = getErrorHandler();
    handler.startPerformanceMark('getBaseUrl');

    data = await api.storage.sync.get('baseUrl');

    handler.endPerformanceMark('getBaseUrl');
  } catch (e) {
    logError(
      'Erro ao obter a URL base do storage',
      { errorMessage: e.message },
      ERROR_CATEGORIES.STORAGE
    );
    throw e;
  }

  if (data && data.baseUrl) {
    logInfo('URL base obtida com sucesso');
    return data.baseUrl;
  }

  logError('URL base não configurada');
  throw new Error('URL_BASE_NOT_CONFIGURED');
}

// Exemplo de como atualizar chamadas de API existentes
export async function fetchRegulationPriorities() {
  try {
    const handler = getErrorHandler();
    handler.startPerformanceMark('fetchRegulationPriorities');

    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/regulacao/prioridades`);

    if (!response.ok) {
      handleFetchError(response, 'fetchRegulationPriorities');
    }

    const data = await response.json();

    handler.endPerformanceMark('fetchRegulationPriorities');
    logInfo(
      'Prioridades de regulação obtidas com sucesso',
      { count: data.length },
      ERROR_CATEGORIES.SIGSS_API
    );

    return data;
  } catch (error) {
    logError(
      'Falha ao buscar prioridades de regulação',
      { errorMessage: error.message },
      ERROR_CATEGORIES.SIGSS_API
    );
    throw error;
  }
}
```

### 🔄 PASSO 4: Atualizar background.js

**Modificações em:** `c:\AssistenteDeRegulacaoMedica\background.js`

```javascript
// Adicionar no topo, após importações existentes
import { logInfo, logWarning, logError, ERROR_CATEGORIES } from './ErrorHandler.js';

// Atualizar o message listener
api.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'SAVE_REGULATION_DATA') {
    logInfo(
      'Recebido pedido para salvar dados da regulação',
      {
        payloadType: typeof message.payload,
        hasPayload: !!message.payload,
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );

    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        await api.storage.local.set({ pendingRegulation: regulationDetails });

        logInfo(
          'Detalhes da regulação salvos no storage local com sucesso',
          {
            regulationId: regulationDetails.id || 'unknown',
            hasDetails: !!regulationDetails,
          },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        );
      } else {
        logWarning(
          'Não foram encontrados detalhes para a regulação',
          {
            payloadType: typeof message.payload,
          },
          ERROR_CATEGORIES.BACKGROUND_SCRIPT
        );
      }
    } catch (e) {
      logError(
        'Falha ao buscar ou salvar dados da regulação',
        {
          errorMessage: e.message,
          errorType: e.constructor.name,
        },
        ERROR_CATEGORIES.BACKGROUND_SCRIPT
      );
    }
    return true;
  }
});

// Atualizar openSidebar
async function openSidebar(tab) {
  try {
    if (api.sidePanel) {
      await api.sidePanel.open({ windowId: tab.windowId });
      logInfo(
        'Sidebar aberto via sidePanel API',
        { windowId: tab.windowId },
        ERROR_CATEGORIES.BACKGROUND_SCRIPT
      );
    } else if (api.sidebarAction) {
      await api.sidebarAction.toggle();
      logInfo('Sidebar alternado via sidebarAction API', {}, ERROR_CATEGORIES.BACKGROUND_SCRIPT);
    } else {
      logWarning('Nenhuma API de sidebar disponível', {}, ERROR_CATEGORIES.BACKGROUND_SCRIPT);
    }
  } catch (error) {
    logError(
      'Falha ao abrir sidebar',
      {
        errorMessage: error.message,
        tabId: tab.id,
        windowId: tab.windowId,
      },
      ERROR_CATEGORIES.BACKGROUND_SCRIPT
    );
  }
}

// Atualizar onInstalled
api.runtime.onInstalled.addListener((details) => {
  logInfo(
    'Extensão instalada/atualizada',
    {
      reason: details.reason,
      version: api.runtime.getManifest().version,
    },
    ERROR_CATEGORIES.EXTENSION_LIFECYCLE
  );

  // resto da lógica existente...
});
```

### 🔄 PASSO 5: Atualizar sidebar.js

**Modificações em:** `c:\AssistenteDeRegulacaoMedica\sidebar.js`

```javascript
// Adicionar no topo, após as importações existentes
import {
  logInfo,
  logWarning,
  logError,
  logDebug,
  ERROR_CATEGORIES,
  getErrorHandler,
} from './ErrorHandler.js';

// Substituir console.log existentes na inicialização
document.addEventListener('DOMContentLoaded', () => {
  logInfo(
    'Assistente de Regulação Médica inicializado',
    {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
    ERROR_CATEGORIES.USER_INTERFACE
  );

  // resto da lógica de inicialização...
});

// Exemplo de atualização em função de busca de pacientes
async function searchPatients(searchTerm) {
  try {
    const handler = getErrorHandler();
    handler.startPerformanceMark('searchPatients');

    logInfo(
      'Iniciando busca de pacientes',
      {
        hasSearchTerm: !!searchTerm,
        searchTermLength: searchTerm?.length || 0,
      },
      ERROR_CATEGORIES.MEDICAL_DATA
    );

    const results = await API.searchPatients(searchTerm);

    handler.endPerformanceMark('searchPatients');

    logInfo(
      'Busca de pacientes concluída',
      {
        resultCount: results?.length || 0,
      },
      ERROR_CATEGORIES.MEDICAL_DATA
    );

    return results;
  } catch (error) {
    logError(
      'Falha na busca de pacientes',
      {
        errorMessage: error.message,
        searchTermLength: searchTerm?.length || 0,
      },
      ERROR_CATEGORIES.MEDICAL_DATA
    );
    throw error;
  }
}

// Exemplo de error recovery
function handleUIError(error, operation) {
  logError(
    `Erro na interface: ${operation}`,
    {
      errorMessage: error.message,
      operation,
      userAgent: navigator.userAgent,
    },
    ERROR_CATEGORIES.USER_INTERFACE
  );

  // Error recovery - mostrar mensagem amigável ao usuário
  Utils.showDialog({
    message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
    onConfirm: () => {
      logInfo('Usuário confirmou diálogo de erro', { operation });
    },
  });
}
```

### 🔄 PASSO 6: Atualizar content-script.js

**Modificações em:** `c:\AssistenteDeRegulacaoMedica\content-script.js`

```javascript
// Adicionar no topo
import { logInfo, logWarning, logError, ERROR_CATEGORIES } from './ErrorHandler.js';

// Substituir console.log existentes por logging sanitizado
// ANTES (linha 30-34 - PROBLEMA identificado no audit):
// console.log('[Assistente Content Script] Dados encontrados:', payload);

// DEPOIS:
logInfo(
  'Dados de regulação detectados na página SIGSS',
  {
    hasPayload: !!payload,
    pageUrl: window.location.pathname,
    payloadKeys: payload ? Object.keys(payload) : [],
  },
  ERROR_CATEGORIES.CONTENT_SCRIPT
);

// Exemplo de detecção de página SIGSS
function detectSIGSSPage() {
  const currentUrl = window.location.href;
  const isSIGSSPage = currentUrl.includes('/sigss/');

  if (isSIGSSPage) {
    logInfo(
      'Página SIGSS detectada',
      {
        pathname: window.location.pathname,
        search: window.location.search ? '[HAS_PARAMS]' : '[NO_PARAMS]',
      },
      ERROR_CATEGORIES.CONTENT_SCRIPT
    );
  }

  return isSIGSSPage;
}

// Error handling para message passing
function sendMessageToBackground(type, payload) {
  try {
    logInfo(
      'Enviando mensagem para background script',
      {
        messageType: type,
        hasPayload: !!payload,
      },
      ERROR_CATEGORIES.CONTENT_SCRIPT
    );

    api.runtime.sendMessage({ type, payload });
  } catch (error) {
    logError(
      'Falha ao enviar mensagem para background script',
      {
        messageType: type,
        errorMessage: error.message,
      },
      ERROR_CATEGORIES.CONTENT_SCRIPT
    );
  }
}
```

---

## ✅ VALIDAÇÃO E TESTES

### 🧪 PASSO 7: Executar Testes

```bash
# Executar testes unitários do ErrorHandler
npm run test:unit -- ErrorHandler.test.js

# Executar todos os testes para verificar compatibilidade
npm run test

# Verificar coverage
npm run test:coverage
```

### 🔍 PASSO 8: Validação Manual

**Checklist de Validação:**

1. **✅ Logging Sanitizado**

   - [ ] CPF/CNS nunca aparecem em logs
   - [ ] IDs técnicos (reguId, isenPK) são preservados
   - [ ] Logs são legíveis e úteis para debug

2. **✅ Performance**

   - [ ] Logging não impacta performance significativamente
   - [ ] Performance marks funcionando
   - [ ] Memory usage não aumentou

3. **✅ Cross-browser**

   - [ ] Funciona no Chrome
   - [ ] Funciona no Firefox
   - [ ] Funciona no Edge

4. **✅ Error Recovery**

   - [ ] Errors são tratados gracefully
   - [ ] UI continua responsiva após errors
   - [ ] Error storage funciona

5. **✅ Medical Compliance**
   - [ ] Zero exposição de dados sensíveis
   - [ ] Logs seguem padrões médicos
   - [ ] Auditoria pode ser feita via stored errors

### 🔧 PASSO 9: Configurar CI/CD

**Atualizar:** `.github/workflows/ci.yml`

```yaml
# Adicionar step para validar compliance médico
- name: Validate Medical Data Compliance
  run: |
    npm run test:unit -- ErrorHandler.test.js
    npm run validate:security
    npm run lint:medical-compliance
```

---

## 📋 CHECKLIST FINAL

### ✅ Implementação Completa

- [ ] **ErrorHandler.js criado** com sanitização médica
- [ ] **Testes unitários completos** (>90% coverage)
- [ ] **api.js atualizado** para usar ErrorHandler
- [ ] **background.js atualizado** para usar ErrorHandler
- [ ] **sidebar.js atualizado** para usar ErrorHandler
- [ ] **content-script.js atualizado** sem exposição de dados
- [ ] **Cross-browser testing** realizado
- [ ] **Performance benchmarks** validados
- [ ] **Medical compliance** verificado

### ✅ Preparação para Próximas Tasks

- [ ] **TASK-C-001** pode agora usar `sanitizeForLog()`
- [ ] **TASK-A-001** pode usar mesma função de sanitização
- [ ] **TASK-C-003** pode usar ErrorHandler para security logging
- [ ] **Base sólida** estabelecida para todas as security tasks

### ✅ Documentação

- [ ] **README.md atualizado** com seção de ErrorHandler
- [ ] **CHANGELOG.md atualizado** com nova feature
- [ ] **agents.md atualizado** com guidelines do ErrorHandler
- [ ] **JSDoc completo** para todas as funções

---

## 🚀 PRÓXIMOS PASSOS

### Após TASK-M-005 Completa

1. **TASK-C-002: Content Security Policy** (1 dia)

   - CSP hardening usando ErrorHandler para violations

2. **TASK-C-004: Permissions Audit** (1 dia)

   - Remove permissions desnecessárias

3. **TASK-C-001: Medical Data Logging** (1 dia)
   - **AGORA POSSÍVEL** - usa ErrorHandler já implementado
   - Implementa `sanitizeForLog()` usando infraestrutura existente

### Benefícios Imediatos

- ✅ **Zero data leaks** - dados médicos nunca logados
- ✅ **Debug eficiente** - logs estruturados e categorizados
- ✅ **Compliance automático** - sanitização built-in
- ✅ **Performance monitoring** - timing de operações críticas
- ✅ **Error recovery** - handling graceful de falhas
- ✅ **Audit trail** - stored errors para análise posterior

---

## 🏥 CONSIDERAÇÕES MÉDICAS ESPECÍFICAS

### 🔒 Compliance LGPD/HIPAA

**ErrorHandler garante:**

- ❌ **Nunca logados:** CPF, CNS, nomes, endereços, telefones
- ✅ **Sempre preservados:** IDs técnicos necessários para debug médico
- ✅ **Audit trail:** Errors críticos armazenados para compliance
- ✅ **Data retention:** Rotação automática de logs antigos

### ⚡ Performance em Ambiente Hospitalar

**Otimizações específicas:**

- 🚀 **Lazy logging** - só processa se nível adequado
- 🚀 **Async storage** - não bloqueia UI médica
- 🚀 **Memory management** - rotação automática de errors
- 🚀 **Network awareness** - fallbacks se storage indisponível

### 🛡️ Security para Extensão Médica

**Proteções implementadas:**

- 🔐 **CSP violation detection** - monitora tentativas de attack
- 🔐 **Global error capture** - nada escapa sem sanitização
- 🔐 **Observer pattern** - monitoring adicional se necessário
- 🔐 **Cross-browser compatibility** - mesmo nível de segurança

---

**🎯 RESULTADO:** Base sólida estabelecida para toda arquitetura de segurança médica, permitindo implementação segura e eficiente de todas as tasks subsequentes.
