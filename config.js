/**
 * Configurações centralizadas para o Assistente de Regulação Médica
 * Este arquivo contém todas as constantes, timeouts, intervalos e valores de configuração
 * utilizados pela extensão.
 */

export const CONFIG = {
  // Timeouts e Delays
  TIMEOUTS: {
    DEBOUNCE_DEFAULT: 500,          // Delay padrão para debounce em ms
    DEBOUNCE_SEARCH: 200,           // Delay para busca em ms
    DEBOUNCE_TIMELINE: 300,         // Delay para timeline em ms
    DEBOUNCE_MAINTENANCE: 250,      // Delay para verificação de manutenção em ms
    DEBOUNCE_FILTERS: 300,          // Delay para aplicação de filtros em ms
    
    MESSAGE_DISPLAY: 3000,          // Tempo de exibição de mensagens em ms
    MESSAGE_SUCCESS: 4000,          // Tempo de exibição de mensagens de sucesso em ms
    MESSAGE_ERROR: 5000,            // Tempo de exibição de mensagens de erro em ms
    AUTO_REFRESH: 1200,             // Tempo para refresh automático em ms
    
    NOTIFICATION_TIMEOUT: 2000,     // Timeout para notificações em ms
  },

  // Configurações de API e Batching
  API: {
    BATCH_SIZE: 5,                  // Tamanho padrão dos lotes para processamento
    BATCH_DELAY_MS: 100,            // Delay entre lotes em ms
    MAX_ROWS: 1000,                 // Número máximo de linhas para consultas principais
    MAX_ROWS_REGULATIONS: 999,      // Número máximo de linhas para regulações
    
    // Status codes importantes
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
  },

  // Datas padrão
  DATES: {
    DEFAULT_START: "01/01/1900",    // Data inicial padrão para consultas
    TIMELINE_DEFAULT_START: "01/01/1900",  // Data inicial padrão para timeline
  },

  // Configurações de UI
  UI: {
    // Breakpoints e limites
    LINE_TRUNCATE_LIMIT: 250,       // Limite de caracteres para truncar linhas
    
    // Z-index values
    Z_INDEX_TOOLTIP: 9999,
    Z_INDEX_MODAL: 1000,
    
    // Configurações de cores YIQ
    YIQ_THRESHOLD: 128,             // Limite para determinar cor do texto
    YIQ_FORMULA: {
      RED_WEIGHT: 299,
      GREEN_WEIGHT: 587,
      BLUE_WEIGHT: 114,
      DIVISOR: 1000
    },
    
    // Configurações de ano
    TWO_DIGIT_YEAR_THRESHOLD: 100,  // Limite para anos de 2 dígitos
    YEAR_BASE: 2000,                // Base para conversão de anos
  },

  // Classes CSS padrão
  CSS_CLASSES: {
    // Estados de mensagem
    MESSAGE_ERROR: "bg-red-100 text-red-700",
    MESSAGE_SUCCESS: "bg-green-100 text-green-700", 
    MESSAGE_INFO: "bg-blue-100 text-blue-700",
    
    // Estados de paciente
    PATIENT_NO_SHOW: "bg-red-50 border-red-200",
    PATIENT_NORMAL: "bg-white",
    
    // Text colors
    TEXT_PRIMARY: "text-slate-900",
    TEXT_SECONDARY: "text-slate-600", 
    TEXT_MUTED: "text-slate-500",
    TEXT_ERROR: "text-red-600",
    TEXT_SUCCESS: "text-green-600",
    TEXT_BLUE: "text-blue-600",
    TEXT_INDIGO: "text-indigo-700",
    
    // Background colors
    BG_LOADING: "text-slate-500",
    BG_SLATE_50: "bg-slate-50",
    BG_SLATE_100: "bg-slate-100",
    
    // Input styles
    INPUT_STANDARD: "w-full px-2 py-1 border border-slate-300 rounded-md",
    INPUT_CHECKBOX: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
    
    // Button styles
    BUTTON_ICON: "p-1.5 text-slate-500 hover:bg-blue-100 hover:text-blue-600 rounded",
    BUTTON_DELETE: "p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded",
  },

  // Configurações de performance
  PERFORMANCE: {
    MAX_SEARCH_RESULTS: 10,         // Máximo de resultados de busca exibidos
    RESULTS_LIMIT: 250,             // Limite de resultados totais
    MATCHES_PER_FILE: 15,           // Máximo de matches por arquivo
    MAX_TIMELINE_EVENTS: 1000,      // Máximo de eventos na timeline
    BATCH_SIZE: 100,                // Tamanho do lote para processamento em lote
  },

  // Configurações específicas de seções
  SECTIONS: {
    // Mapeamento de nomes amigáveis
    SECTION_NAMES: {
      consultations: "consultas",
      exams: "exames", 
      appointments: "agendamentos",
      regulations: "regulações",
      documents: "documentos",
    }
  },

  // Encoding e charset
  ENCODING: {
    UTF8_CODEPAGE: 65001,           // Código da página UTF-8 para Windows
  },

  // Configurações de manifesto (ícones)
  MANIFEST: {
    ICON_SIZE_128: "128",
  }
};

// Funções helper para acessar configurações
export const getTimeout = (key) => CONFIG.TIMEOUTS[key];
export const getAPIConfig = (key) => CONFIG.API[key];
export const getUIConfig = (key) => CONFIG.UI[key];
export const getCSSClass = (key) => CONFIG.CSS_CLASSES[key];
export const getSectionName = (key) => CONFIG.SECTIONS.SECTION_NAMES[key];

// Valores de configuração legados (para compatibilidade temporária)
export const LEGACY_CONSTANTS = {
  debounceDelay: CONFIG.TIMEOUTS.DEBOUNCE_DEFAULT,
  batchSize: CONFIG.API.BATCH_SIZE,
  messageTimeout: CONFIG.TIMEOUTS.MESSAGE_DISPLAY,
};
