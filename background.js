// Background script compatível com Firefox
// Usa API básica do browser para máxima compatibilidade

// ✅ TASK-A-004: API compatível com verificação robusta de funcionalidades
const api = globalThis.browser || globalThis.chrome;

// ✅ TASK-A-004: Detecção de browser e capacidades
const browserInfo = {
  isFirefox: typeof globalThis.browser !== 'undefined' && !globalThis.chrome,
  isChrome: typeof globalThis.chrome !== 'undefined' && typeof globalThis.browser === 'undefined',
  isEdge: typeof globalThis.chrome !== 'undefined' && navigator.userAgent.includes('Edg'),
  
  // Verificação de APIs específicas
  capabilities: {
    sidePanel: !!(api.sidePanel && typeof api.sidePanel.open === 'function'),
    sidebarAction: !!(api.sidebarAction),
    storageSession: !!(api.storage && api.storage.session),
    alarms: !!(api.alarms),
    contextMenus: !!(api.contextMenus),
    action: !!(api.action),
    tabs: !!(api.tabs),
    windows: !!(api.windows),
    runtime: !!(api.runtime)
  }
};

// ✅ TASK-A-004: Log de informações do browser na inicialização
function logBrowserInfo() {
  const browserName = browserInfo.isFirefox ? 'Firefox' : 
                     browserInfo.isEdge ? 'Edge' : 
                     browserInfo.isChrome ? 'Chrome' : 'Unknown';
  
  console.log(`[Background] Browser detectado: ${browserName}`, {
    userAgent: navigator.userAgent,
    capabilities: browserInfo.capabilities
  });
}

// Variáveis globais para módulos carregados dinamicamente
let fetchRegulationDetails, KeepAliveManager, getBrowserAPIInstance;
let encryptForStorage, decryptFromStorage, cleanupExpiredData, MEDICAL_DATA_CONFIG;
let createComponentLogger, logger;
let keepAliveManager = null;

// Rate limiting para mensagens
const messageRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 100; // máximo 100 mensagens por minuto por origem

// Função para carregar módulos dinamicamente com retry logic e validação
async function loadModules(retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 segundo
  
  // Logger ainda não está disponível, então o console.log é aceitável aqui.
  console.log(`[Background] Carregando módulos... (tentativa ${retryCount + 1}/${MAX_RETRIES + 1})`);

  const moduleLoadResults = {
    api: { loaded: false, error: null, functions: [] },
    keepAlive: { loaded: false, error: null, functions: [] },
    browserAPI: { loaded: false, error: null, functions: [] },
    crypto: { loaded: false, error: null, functions: [] },
    logger: { loaded: false, error: null, functions: [] }
  };

  try {
    // Carregar módulo API
    try {
      const apiModule = await import("./api.js");
      if (apiModule.fetchRegulationDetails && typeof apiModule.fetchRegulationDetails === 'function') {
        fetchRegulationDetails = apiModule.fetchRegulationDetails;
        moduleLoadResults.api.loaded = true;
        moduleLoadResults.api.functions.push('fetchRegulationDetails');
      } else {
        throw new Error('fetchRegulationDetails não encontrada ou não é uma função');
      }
    } catch (error) {
      moduleLoadResults.api.error = error.message;
      console.error('[Background] Falha ao carregar módulo API:', error);
    }

    // Carregar módulo KeepAlive
    try {
      const keepAliveModule = await import("./KeepAliveManager.js");
      if (keepAliveModule.KeepAliveManager && typeof keepAliveModule.KeepAliveManager === 'function') {
        KeepAliveManager = keepAliveModule.KeepAliveManager;
        moduleLoadResults.keepAlive.loaded = true;
        moduleLoadResults.keepAlive.functions.push('KeepAliveManager');
      } else {
        throw new Error('KeepAliveManager não encontrada ou não é uma função');
      }
    } catch (error) {
      moduleLoadResults.keepAlive.error = error.message;
      console.error('[Background] Falha ao carregar módulo KeepAlive:', error);
    }

    // Carregar módulo BrowserAPI
    try {
      const browserAPIModule = await import("./BrowserAPI.js");
      if (browserAPIModule.getBrowserAPIInstance && typeof browserAPIModule.getBrowserAPIInstance === 'function') {
        getBrowserAPIInstance = browserAPIModule.getBrowserAPIInstance;
        moduleLoadResults.browserAPI.loaded = true;
        moduleLoadResults.browserAPI.functions.push('getBrowserAPIInstance');
      } else {
        throw new Error('getBrowserAPIInstance não encontrada ou não é uma função');
      }
    } catch (error) {
      moduleLoadResults.browserAPI.error = error.message;
      console.error('[Background] Falha ao carregar módulo BrowserAPI:', error);
    }

    // Carregar módulo Crypto
    try {
      const cryptoModule = await import("./crypto-utils.js");
      const requiredCryptoFunctions = ['encryptForStorage', 'decryptFromStorage', 'cleanupExpiredData', 'MEDICAL_DATA_CONFIG'];
      let cryptoFunctionsLoaded = 0;

      if (cryptoModule.encryptForStorage && typeof cryptoModule.encryptForStorage === 'function') {
        encryptForStorage = cryptoModule.encryptForStorage;
        moduleLoadResults.crypto.functions.push('encryptForStorage');
        cryptoFunctionsLoaded++;
      }

      if (cryptoModule.decryptFromStorage && typeof cryptoModule.decryptFromStorage === 'function') {
        decryptFromStorage = cryptoModule.decryptFromStorage;
        moduleLoadResults.crypto.functions.push('decryptFromStorage');
        cryptoFunctionsLoaded++;
      }

      if (cryptoModule.cleanupExpiredData && typeof cryptoModule.cleanupExpiredData === 'function') {
        cleanupExpiredData = cryptoModule.cleanupExpiredData;
        moduleLoadResults.crypto.functions.push('cleanupExpiredData');
        cryptoFunctionsLoaded++;
      }

      if (cryptoModule.MEDICAL_DATA_CONFIG && typeof cryptoModule.MEDICAL_DATA_CONFIG === 'object') {
        MEDICAL_DATA_CONFIG = cryptoModule.MEDICAL_DATA_CONFIG;
        moduleLoadResults.crypto.functions.push('MEDICAL_DATA_CONFIG');
        cryptoFunctionsLoaded++;
      }

      if (cryptoFunctionsLoaded === requiredCryptoFunctions.length) {
        moduleLoadResults.crypto.loaded = true;
      } else {
        throw new Error(`Apenas ${cryptoFunctionsLoaded}/${requiredCryptoFunctions.length} funções crypto carregadas`);
      }
    } catch (error) {
      moduleLoadResults.crypto.error = error.message;
      console.error('[Background] Falha ao carregar módulo Crypto:', error);
    }

    // Carregar módulo Logger (crítico)
    try {
      const loggerModule = await import("./logger.js");
      if (loggerModule.createComponentLogger && typeof loggerModule.createComponentLogger === 'function') {
        createComponentLogger = loggerModule.createComponentLogger;
        moduleLoadResults.logger.loaded = true;
        moduleLoadResults.logger.functions.push('createComponentLogger');

        // Inicializar logger após carregamento bem-sucedido
        logger = createComponentLogger('Background');
      } else {
        throw new Error('createComponentLogger não encontrada ou não é uma função');
      }
    } catch (error) {
      moduleLoadResults.logger.error = error.message;
      console.error('[Background] Falha ao carregar módulo Logger:', error);
    }

    // Verificar módulos críticos
    const criticalModules = ['api', 'logger'];
    const failedCriticalModules = criticalModules.filter(module => !moduleLoadResults[module].loaded);

    if (failedCriticalModules.length > 0) {
      const errorMessage = `Módulos críticos falharam: ${failedCriticalModules.join(', ')}`;
      
      if (retryCount < MAX_RETRIES) {
        console.warn(`[Background] ${errorMessage}. Tentando novamente em ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return await loadModules(retryCount + 1);
      } else {
        console.error(`[Background] ${errorMessage}. Máximo de tentativas excedido.`);
        return false;
      }
    }

    // Log de sucesso com detalhes
    const loadedModules = Object.keys(moduleLoadResults).filter(module => moduleLoadResults[module].loaded);
    const failedModules = Object.keys(moduleLoadResults).filter(module => !moduleLoadResults[module].loaded);

    if (logger) {
      logger.info('Módulos carregados com sucesso', {
        operation: 'loadModules',
        loadedModules,
        failedModules,
        retryCount,
        moduleDetails: moduleLoadResults
      });
    } else {
      console.log('[Background] Módulos carregados:', { loadedModules, failedModules });
    }

    // Configurar fallbacks para módulos não críticos que falharam
    if (failedModules.length > 0) {
      setupModuleFallbacks(failedModules, moduleLoadResults);
    }

    return true;

  } catch (error) {
    const errorMessage = `Erro geral no carregamento de módulos: ${error.message}`;
    
    if (retryCount < MAX_RETRIES) {
      console.warn(`[Background] ${errorMessage}. Tentando novamente em ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return await loadModules(retryCount + 1);
    } else {
      console.error(`[Background] ${errorMessage}. Máximo de tentativas excedido.`);
      const log = logger || console;
      log.error('Falha completa no carregamento de módulos:', {
        error: error.message,
        stack: error.stack,
        retryCount,
        moduleResults: moduleLoadResults
      });
      return false;
    }
  }
}

// Configurar fallbacks para módulos não críticos
function setupModuleFallbacks(failedModules, moduleLoadResults) {
  const log = logger || console;

  failedModules.forEach(moduleName => {
    const moduleResult = moduleLoadResults[moduleName];
    
    switch (moduleName) {
      case 'keepAlive':
        // Fallback: KeepAlive não é crítico, pode funcionar sem ele
        log.warn('KeepAlive não disponível - funcionalidade de keep-alive desabilitada', {
          error: moduleResult.error,
          operation: 'setupModuleFallbacks'
        });
        break;

      case 'browserAPI':
        // Fallback: usar API nativa diretamente
        getBrowserAPIInstance = () => api;
        log.warn('BrowserAPI não disponível - usando API nativa como fallback', {
          error: moduleResult.error,
          operation: 'setupModuleFallbacks'
        });
        break;

      case 'crypto':
        // Fallback: desabilitar criptografia (dados não criptografados)
        encryptForStorage = async (data) => data;
        decryptFromStorage = async (data) => data;
        cleanupExpiredData = async () => {};
        MEDICAL_DATA_CONFIG = { SENSITIVE_TTL_MINUTES: 30 };
        log.warn('Crypto não disponível - dados médicos não serão criptografados', {
          error: moduleResult.error,
          operation: 'setupModuleFallbacks'
        });
        break;

      default:
        log.warn(`Módulo ${moduleName} falhou - sem fallback disponível`, {
          error: moduleResult.error,
          operation: 'setupModuleFallbacks'
        });
    }
  });
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

// ✅ TASK-A-004: Função para abrir sidebar com detecção robusta de browser e fallbacks múltiplos
async function openSidebar(tab) {
  const log = logger || console;
  
  try {
    // ✅ TASK-A-004: Usar informações de browser detectadas
    const browserName = browserInfo.isFirefox ? 'Firefox' : 
                       browserInfo.isEdge ? 'Edge' : 
                       browserInfo.isChrome ? 'Chrome' : 'Unknown';

    log.info('Tentando abrir sidebar/sidePanel', {
      operation: 'openSidebar',
      browser: browserName,
      capabilities: browserInfo.capabilities,
      tabId: tab?.id,
      windowId: tab?.windowId
    });

    // ✅ TASK-A-004: Estratégia 1 - Chrome/Edge sidePanel API
    if (browserInfo.capabilities.sidePanel && tab?.windowId) {
      try {
        log.debug('Tentativa 1: Chrome sidePanel API');
        await api.sidePanel.open({ windowId: tab.windowId });
        log.info('SidePanel aberto com sucesso no Chrome/Edge');
        return;
      } catch (sidePanelError) {
        log.warn('Falha no sidePanel API:', sidePanelError.message);
      }
    }

    // ✅ TASK-A-004: Estratégia 2 - Firefox sidebarAction.open API
    if (browserInfo.capabilities.sidebarAction && api.sidebarAction.open) {
      try {
        log.debug('Tentativa 2: Firefox sidebarAction.open API');
        await api.sidebarAction.open();
        log.info('Sidebar aberto com sucesso no Firefox (open)');
        return;
      } catch (sidebarOpenError) {
        log.warn('Falha no sidebarAction.open:', sidebarOpenError.message);
      }
    }

    // ✅ TASK-A-004: Estratégia 3 - Firefox sidebarAction.toggle API
    if (browserInfo.capabilities.sidebarAction && api.sidebarAction.toggle) {
      try {
        log.debug('Tentativa 3: Firefox sidebarAction.toggle API');
        await api.sidebarAction.toggle();
        log.info('Sidebar alternado com sucesso no Firefox (toggle)');
        return;
      } catch (sidebarToggleError) {
        log.warn('Falha no sidebarAction.toggle:', sidebarToggleError.message);
      }
    }

    // ✅ TASK-A-004: Estratégia 4 - Popup window
    if (browserInfo.capabilities.windows) {
      try {
        log.debug('Tentativa 4: Abrindo como popup window');
        await api.windows.create({
          url: api.runtime.getURL('sidebar.html'),
          type: 'popup',
          width: 400,
          height: 600,
          focused: true
        });
        log.info('Sidebar aberto como popup window');
        return;
      } catch (windowError) {
        log.warn('Falha ao abrir popup window:', windowError.message);
      }
    }

    // ✅ TASK-A-004: Estratégia 5 - Nova aba (fallback final)
    if (browserInfo.capabilities.tabs) {
      try {
        log.debug('Tentativa 5: Abrindo como nova aba (fallback final)');
        await api.tabs.create({
          url: api.runtime.getURL('sidebar.html'),
          active: true
        });
        log.info('Sidebar aberto como nova aba (fallback de emergência)');
        return;
      } catch (tabError) {
        log.warn('Falha ao abrir nova aba:', tabError.message);
      }
    }

    // ✅ TASK-A-004: Se chegou até aqui, nenhuma estratégia funcionou
    throw new Error('Todas as estratégias de abertura de sidebar falharam');

  } catch (error) {
    log.error('Erro crítico ao abrir sidebar/sidePanel:', {
      error: error.message,
      stack: error.stack,
      tabId: tab?.id,
      windowId: tab?.windowId,
      browserInfo,
      availableAPIs: {
        sidePanel: !!api.sidePanel,
        sidebarAction: !!api.sidebarAction,
        windows: !!api.windows,
        tabs: !!api.tabs
      }
    });

    // ✅ TASK-A-004: Notificar usuário sobre falha
    try {
      if (api.notifications && api.notifications.create) {
        await api.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Assistente de Regulação',
          message: 'Não foi possível abrir o assistente. Tente recarregar a página.'
        });
      }
    } catch (notificationError) {
      log.warn('Falha ao mostrar notificação:', notificationError.message);
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

  // ✅ TASK-A-004: Log de informações do browser na inicialização
  logBrowserInfo();

  try {
    // Carregar módulos
    const modulesLoaded = await loadModules();

    if (modulesLoaded) {
      // Inicializar componentes
      initializeKeepAlive();
      await setupDataCleanup();

      // ✅ TASK-A-004: Log detalhado após inicialização completa
      logger.info('[Background] Inicialização completa', {
        operation: 'initializeExtension',
        browserInfo,
        modulesLoaded: true
      });
    } else {
      const log = logger || console;
      log.error('Falha ao carregar módulos - extensão pode não funcionar corretamente', {
        operation: 'initializeExtension',
        browserInfo,
        modulesLoaded: false
      });
    }
  } catch (error) {
    const log = logger || console;
    log.error('Erro na inicialização:', {
      error: error.message,
      stack: error.stack,
      operation: 'initializeExtension',
      browserInfo
    });
  }
}

// A inicialização é tratada pelos listeners onInstalled e onStartup.
