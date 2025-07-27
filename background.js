// Background script compatível com Firefox
// Usa API básica do browser para máxima compatibilidade

// API básica compatível com Firefox e Chrome
const api = globalThis.browser || globalThis.chrome;

// Variáveis globais para módulos carregados dinamicamente
let fetchRegulationDetails, KeepAliveManager, getBrowserAPIInstance;
let encryptForStorage, decryptFromStorage, cleanupExpiredData, MEDICAL_DATA_CONFIG;
let createComponentLogger, logger;
let keepAliveManager = null;

// Rate limiting para mensagens
const messageRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 100; // máximo 100 mensagens por minuto por origem

// Função para carregar módulos dinamicamente
async function loadModules() {
  try {
    console.log('[Background] Carregando módulos...');
    
    const apiModule = await import("./api.js");
    fetchRegulationDetails = apiModule.fetchRegulationDetails;
    
    const keepAliveModule = await import("./KeepAliveManager.js");
    KeepAliveManager = keepAliveModule.KeepAliveManager;
    
    const browserAPIModule = await import("./BrowserAPI.js");
    getBrowserAPIInstance = browserAPIModule.getBrowserAPIInstance;
    
    const cryptoModule = await import("./crypto-utils.js");
    encryptForStorage = cryptoModule.encryptForStorage;
    decryptFromStorage = cryptoModule.decryptFromStorage;
    cleanupExpiredData = cryptoModule.cleanupExpiredData;
    MEDICAL_DATA_CONFIG = cryptoModule.MEDICAL_DATA_CONFIG;
    
    const loggerModule = await import("./logger.js");
    createComponentLogger = loggerModule.createComponentLogger;
    
    // Inicializar logger após carregamento
    logger = createComponentLogger('Background');
    
    console.log('[Background] Módulos carregados com sucesso');
    return true;
  } catch (error) {
    console.error('[Background] Erro ao carregar módulos:', error);
    return false;
  }
}

// Rate limiting check
function checkRateLimit(senderId) {
  const now = Date.now();
  const key = senderId || 'unknown';
  
  if (!messageRateLimit.has(key)) {
    messageRateLimit.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  const rateData = messageRateLimit.get(key);
  
  // Reset window if expired
  if (now - rateData.windowStart > RATE_LIMIT_WINDOW) {
    messageRateLimit.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  // Check if limit exceeded
  if (rateData.count >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }
  
  // Increment counter
  rateData.count++;
  return true;
}

// Inicializar KeepAliveManager
function initializeKeepAlive() {
  if (!keepAliveManager && KeepAliveManager) {
    try {
      keepAliveManager = new KeepAliveManager();
      if (logger) {
        logger.info("KeepAliveManager inicializado", { operation: 'initializeKeepAlive' });
      } else {
        console.log('[Background] KeepAliveManager inicializado');
      }
    } catch (error) {
      console.error('[Background] Erro ao inicializar KeepAliveManager:', error);
    }
  }
}

// Configurar limpeza automática de dados médicos
async function setupDataCleanup() {
  if (!cleanupExpiredData) return;
  
  try {
    // Limpa dados expirados na inicialização
    await cleanupExpiredData(api);
    
    // Configura limpeza periódica (a cada 30 minutos)
    api.alarms.create('cleanupExpiredData', { periodInMinutes: 30 });
    
    if (logger) {
      logger.info('Sistema de limpeza automática configurado');
    }
  } catch (error) {
    console.error('[Background] Erro ao configurar limpeza de dados:', error);
  }
}

// Listener para alarmes
api.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupExpiredData' && cleanupExpiredData) {
    try {
      if (logger) {
        logger.info('Executando limpeza automática de dados expirados', { 
          operation: 'setupDataCleanup',
          alarmName: alarm.name 
        });
      }
      await cleanupExpiredData(api);
    } catch (error) {
      console.error('[Background] Erro na limpeza automática:', error);
    }
  }
});

// Listener de mensagens
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const timestamp = new Date().toISOString();
  
  // Rate limiting check
  const senderId = sender?.id || sender?.tab?.id || 'unknown';
  if (!checkRateLimit(senderId)) {
    console.warn('[Background] Rate limit excedido para sender:', senderId);
    return false;
  }

  // Validar origem da mensagem
  if (!sender || !sender.tab) {
    // Mensagens de outras partes da extensão (popup, sidebar, etc.)
    if (!sender.id || sender.id !== api.runtime.id) {
      console.warn('[Background] Mensagem rejeitada - origem não confiável');
      return false;
    }
  } else {
    // Mensagens de content scripts devem vir de páginas SIGSS autorizadas
    const allowedOrigins = [
      'sigss.saude.gov.br',
      'sigss-hom.saude.gov.br', 
      'sigss.mv.com.br',
      'sigss.cloudmv.com.br',
      'localhost:3000',
      'localhost:8080',
      '127.0.0.1'
    ];
    
    const senderUrl = sender.tab.url || sender.url || '';
    const senderOrigin = new URL(senderUrl).origin;
    
    const isAuthorized = allowedOrigins.some(domain => {
      if (domain.startsWith('http')) {
        return senderOrigin === domain;
      }
      return senderUrl.includes(domain);
    });
    
    if (!isAuthorized) {
      console.warn('[Background] Mensagem rejeitada - origem não autorizada:', senderUrl);
      return false;
    }
  }

  // Validar estrutura da mensagem
  if (!message || typeof message !== 'object' || !message.type) {
    console.warn('[Background] Mensagem rejeitada - estrutura inválida');
    return false;
  }

  // Validar tipos de mensagem permitidos
  const allowedMessageTypes = [
    'SAVE_REGULATION_DATA',
    'GET_KEEPALIVE_STATUS',
    'GET_PATIENT_DATA',
    'VALIDATE_CNS',
    'VALIDATE_CPF',
    'CLEAR_CACHE'
  ];

  if (!allowedMessageTypes.includes(message.type)) {
    console.warn('[Background] Tipo de mensagem não permitido:', message.type);
    return false;
  }

  // Log de mensagem autorizada
  console.log(`[Background] ${timestamp} - Mensagem autorizada:`, {
    type: message.type,
    senderId,
    origin: sender?.tab?.url || sender?.url || 'extension'
  });

  // Processar mensagens
  if (message.type === "SAVE_REGULATION_DATA") {
    if (!fetchRegulationDetails) {
      console.error('[Background] fetchRegulationDetails não disponível');
      return false;
    }
    
    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        // Criptografar dados médicos sensíveis antes do armazenamento
        if (encryptForStorage && MEDICAL_DATA_CONFIG) {
          const encryptedData = await encryptForStorage(
            regulationDetails, 
            MEDICAL_DATA_CONFIG.SENSITIVE_TTL_MINUTES
          );
          
          await api.storage.local.set({ 
            pendingRegulation: encryptedData,
            pendingRegulationTimestamp: Date.now()
          });
        } else {
          // Fallback sem criptografia se módulos não estiverem disponíveis
          await api.storage.local.set({ 
            pendingRegulation: regulationDetails,
            pendingRegulationTimestamp: Date.now()
          });
        }
        
        console.log('[Background] Detalhes da regulação salvos no storage local');
      } else {
        console.warn('[Background] Não foram encontrados detalhes para a regulação:', message.payload);
      }
    } catch (e) {
      console.error('[Background] Falha ao buscar ou salvar dados da regulação:', e);
    }
    return true;
  }
  
  // Comando para verificar status do KeepAlive
  if (message.type === "GET_KEEPALIVE_STATUS") {
    if (keepAliveManager) {
      try {
        const status = await keepAliveManager.getStatus();
        sendResponse(status);
      } catch (error) {
        sendResponse({ isActive: false, error: error.message });
      }
    } else {
      sendResponse({ isActive: false, error: "KeepAliveManager não inicializado" });
    }
    return true;
  }

  // Mensagem não reconhecida
  console.warn('[Background] Tipo de mensagem não reconhecido:', message.type);
  return false;
});

// Função para abrir sidebar
async function openSidebar(tab) {
  try {
    if (api.sidePanel) {
      await api.sidePanel.open({ windowId: tab.windowId });
    } else if (api.sidebarAction) {
      await api.sidebarAction.toggle();
    }
  } catch (error) {
    console.error('[Background] Erro ao abrir sidebar:', error);
  }
}

// Listener para clique na ação da extensão
api.action.onClicked.addListener(openSidebar);

// Listener para startup
api.runtime.onStartup.addListener(async () => {
  console.log('[Background] Service worker reiniciado - reinicializando');
  await initializeExtension();
});

// Listener para instalação
api.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extensão instalada/atualizada');
  
  // Aguardar inicialização
  await initializeExtension();
  
  // Configurar sidePanel se disponível
  if (api.sidePanel) {
    try {
      await api.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } catch (e) {
      console.error('[Background] Falha ao definir o comportamento do sidePanel:', e);
    }
  }

  // Criar menu de contexto
  try {
    api.contextMenus.create({
      id: "openSidePanel",
      title: "Alternar Assistente de Regulação",
      contexts: ["all"],
    });
  } catch (error) {
    console.error('[Background] Erro ao criar menu de contexto:', error);
  }

  // Listener para menu de contexto
  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
      openSidebar(tab);
    }
  });

  // Abrir página de ajuda na instalação
  if (details.reason === "install") {
    try {
      api.tabs.create({ url: api.runtime.getURL("help.html") });
    } catch (error) {
      console.error('[Background] Erro ao abrir página de ajuda:', error);
    }
  }
});

// Função principal de inicialização
async function initializeExtension() {
  console.log('[Background] Iniciando extensão...');
  
  try {
    // Carregar módulos
    const modulesLoaded = await loadModules();
    
    if (modulesLoaded) {
      // Inicializar componentes
      initializeKeepAlive();
      await setupDataCleanup();
      
      if (logger) {
        logger.info('[Background] Inicialização completa');
      } else {
        console.log('[Background] Inicialização completa');
      }
    } else {
      console.error('[Background] Falha ao carregar módulos - extensão pode não funcionar corretamente');
    }
  } catch (error) {
    console.error('[Background] Erro na inicialização:', error);
  }
}

// Inicializar a extensão
initializeExtension();