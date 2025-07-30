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
  // Logger ainda não está disponível, então o console.log é aceitável aqui.
  console.log('[Background] Carregando módulos...');

  try {
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

    logger.info('Módulos carregados com sucesso');
    return true;
  } catch (error) {
    // O logger pode não ter sido inicializado, então use console.error como fallback
    const log = logger || console;
    log.error('Erro ao carregar módulos:', error);
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
      logger.info("KeepAliveManager inicializado", { operation: 'initializeKeepAlive' });
    } catch (error) {
      logger.error('Erro ao inicializar KeepAliveManager:', error);
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

    logger.info('Sistema de limpeza automática configurado');
  } catch (error) {
    logger.error('Erro ao configurar limpeza de dados:', error);
  }
}

// Listener para alarmes
api.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupExpiredData' && cleanupExpiredData) {
    try {
      logger.info('Executando limpeza automática de dados expirados', {
        operation: 'setupDataCleanup',
        alarmName: alarm.name
      });
      await cleanupExpiredData(api);
    } catch (error) {
      logger.error('Erro na limpeza automática:', error);
    }
  }
});

// Listener de mensagens
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const timestamp = new Date().toISOString();

  // Rate limiting check
  const senderId = sender?.id || sender?.tab?.id || 'unknown';
  if (!checkRateLimit(senderId)) {
    logger.warn('Rate limit excedido para sender:', { senderId });
    return false;
  }

  // Validar origem da mensagem
  if (!sender || !sender.tab) {
    // Mensagens de outras partes da extensão (popup, sidebar, etc.)
    if (!sender.id || sender.id !== api.runtime.id) {
      logger.warn('Mensagem rejeitada - origem não confiável (não é da extensão)');
      return false;
    }
  } else {
    // Mensagens de content scripts devem vir de páginas SIGSS autorizadas
    // Usar validação baseada em sufixos de domínio em vez de lista hardcoded
    const senderUrl = sender.tab.url || sender.url || '';
    
    let isAuthorized = false;
    let rejectionReason = '';

    try {
      const urlObj = new URL(senderUrl);
      const hostname = urlObj.hostname.toLowerCase();

      // Domínios autorizados baseados em sufixos
      const authorizedSuffixes = [
        'gov.br',           // Qualquer *.gov.br
        'mv.com.br',        // Qualquer *.mv.com.br  
        'cloudmv.com.br'    // Qualquer *.cloudmv.com.br
      ];

      // Localhost para desenvolvimento
      const localhostPatterns = [
        'localhost',
        '127.0.0.1'
      ];

      // Verificar sufixos autorizados
      isAuthorized = authorizedSuffixes.some(suffix => {
        return hostname === suffix || hostname.endsWith('.' + suffix);
      });

      // Verificar localhost para desenvolvimento
      if (!isAuthorized) {
        isAuthorized = localhostPatterns.some(pattern => {
          return hostname === pattern || hostname.startsWith(pattern + ':');
        });
      }

      if (!isAuthorized) {
        rejectionReason = `Domínio '${hostname}' não termina com sufixos autorizados: ${authorizedSuffixes.join(', ')} ou localhost/127.0.0.1`;
      }

    } catch (urlError) {
      isAuthorized = false;
      rejectionReason = `URL inválida: ${urlError.message}`;
    }

    if (!isAuthorized) {
      logger.warn('Mensagem rejeitada - origem não autorizada:', { 
        senderUrl,
        rejectionReason,
        operation: 'validateMessageOrigin'
      });
      return false;
    }

    // Log de origem autorizada para debugging
    logger.debug('Origem autorizada validada:', {
      senderUrl,
      hostname: new URL(senderUrl).hostname,
      operation: 'validateMessageOrigin'
    });
  }

  // Validar estrutura da mensagem
  if (!message || typeof message !== 'object' || !message.type) {
    logger.warn('Mensagem rejeitada - estrutura inválida', { message });
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
    logger.warn('Tipo de mensagem não permitido:', { type: message.type });
    return false;
  }

  // Log de mensagem autorizada
  logger.info('Mensagem autorizada:', {
    type: message.type,
    senderId,
    origin: sender?.tab?.url || sender?.url || 'extension'
  });

  // Processar mensagens
  if (message.type === "SAVE_REGULATION_DATA") {
    if (!fetchRegulationDetails) {
      logger.error('fetchRegulationDetails não disponível');
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

        logger.info('Detalhes da regulação salvos no storage local');
      } else {
        logger.warn('Não foram encontrados detalhes para a regulação:', message.payload);
      }
    } catch (e) {
      logger.error('Falha ao buscar ou salvar dados da regulação:', e);
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
  logger.warn('Tipo de mensagem não reconhecido:', { type: message.type });
  return false;
});

// Função para abrir sidebar com detecção robusta de browser
async function openSidebar(tab) {
  try {
    // Detectar browser baseado na disponibilidade de APIs específicas
    const isFirefox = typeof globalThis.browser !== 'undefined' && !globalThis.chrome;
    const isChrome = typeof globalThis.chrome !== 'undefined';

    logger.info('Tentando abrir sidebar/sidePanel', {
      operation: 'openSidebar',
      browser: isFirefox ? 'Firefox' : isChrome ? 'Chrome/Edge' : 'Unknown',
      hasSidePanel: !!api.sidePanel,
      hasSidebarAction: !!api.sidebarAction,
      tabId: tab?.id,
      windowId: tab?.windowId
    });

    // Chrome/Edge: usar sidePanel API
    if (api.sidePanel && typeof api.sidePanel.open === 'function') {
      logger.debug('Usando Chrome sidePanel API');
      await api.sidePanel.open({ windowId: tab.windowId });
      logger.info('SidePanel aberto com sucesso no Chrome/Edge');
      return;
    }

    // Firefox: usar sidebarAction API
    if (api.sidebarAction && typeof api.sidebarAction.open === 'function') {
      logger.debug('Usando Firefox sidebarAction.open API');
      await api.sidebarAction.open();
      logger.info('Sidebar aberto com sucesso no Firefox');
      return;
    }

    // Fallback para Firefox: toggle se open não estiver disponível
    if (api.sidebarAction && typeof api.sidebarAction.toggle === 'function') {
      logger.debug('Usando Firefox sidebarAction.toggle API como fallback');
      await api.sidebarAction.toggle();
      logger.info('Sidebar alternado com sucesso no Firefox (fallback)');
      return;
    }

    // Se nenhuma API estiver disponível, tentar abrir como popup
    if (api.windows && api.windows.create) {
      logger.warn('Nenhuma API de sidebar disponível, abrindo como popup');
      await api.windows.create({
        url: api.runtime.getURL('sidebar.html'),
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      logger.info('Sidebar aberto como popup (fallback final)');
      return;
    }

    // Se chegou até aqui, nenhuma opção funcionou
    throw new Error('Nenhuma API de sidebar/sidePanel disponível');

  } catch (error) {
    logger.error('Erro ao abrir sidebar/sidePanel:', {
      error: error.message,
      stack: error.stack,
      tabId: tab?.id,
      windowId: tab?.windowId,
      availableAPIs: {
        sidePanel: !!api.sidePanel,
        sidebarAction: !!api.sidebarAction,
        windows: !!api.windows
      }
    });

    // Tentar fallback final se ainda não tentou
    try {
      if (api.tabs && api.tabs.create) {
        logger.warn('Tentando fallback final: abrir sidebar como nova aba');
        await api.tabs.create({
          url: api.runtime.getURL('sidebar.html'),
          active: true
        });
        logger.info('Sidebar aberto como nova aba (fallback de emergência)');
      }
    } catch (fallbackError) {
      logger.error('Fallback final também falhou:', fallbackError);
    }
  }
}

// Listener para clique na ação da extensão
api.action.onClicked.addListener(openSidebar);

// Listener para startup
api.runtime.onStartup.addListener(async () => {
  logger.info('Service worker reiniciado - reinicializando');
  await initializeExtension();
});

// Listener para instalação
api.runtime.onInstalled.addListener(async (details) => {
  logger.info('Extensão instalada/atualizada', { reason: details.reason });

  // Aguardar inicialização
  await initializeExtension();

  // Configurar sidePanel se disponível
  if (api.sidePanel) {
    try {
      await api.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } catch (e) {
      logger.error('Falha ao definir o comportamento do sidePanel:', e);
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
    logger.error('Erro ao criar menu de contexto:', error);
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
      logger.error('Erro ao abrir página de ajuda:', error);
    }
  }
});

// Função principal de inicialização
async function initializeExtension() {
  // Usar console.log aqui é aceitável, pois o logger pode não estar pronto.
  console.log('[Background] Iniciando extensão...');

  try {
    // Carregar módulos
    const modulesLoaded = await loadModules();

    if (modulesLoaded) {
      // Inicializar componentes
      initializeKeepAlive();
      await setupDataCleanup();

      logger.info('[Background] Inicialização completa');
    } else {
      const log = logger || console;
      log.error('Falha ao carregar módulos - extensão pode não funcionar corretamente');
    }
  } catch (error) {
    const log = logger || console;
    log.error('Erro na inicialização:', error);
  }
}

// A inicialização é tratada pelos listeners onInstalled e onStartup.
