import "./browser-polyfill.js";
import { fetchRegulationDetails } from "./api.js";
import { KeepAliveManager } from "./KeepAliveManager.js";
import { getBrowserAPIInstance } from "./BrowserAPI.js";
import { encryptForStorage, decryptFromStorage, cleanupExpiredData, MEDICAL_DATA_CONFIG } from "./crypto-utils.js";
import { createComponentLogger } from "./logger.js";

// Logger especÃ­fico para background script
const logger = createComponentLogger('Background');

const api = getBrowserAPIInstance();

// InstÃ¢ncia global do KeepAliveManager
let keepAliveManager = null;

// Inicializa o KeepAliveManager
function initializeKeepAlive() {
  if (!keepAliveManager) {
    keepAliveManager = new KeepAliveManager();
    logger.info("KeepAliveManager inicializado", { operation: 'initializeKeepAlive' });
  }
}

// âœ… SEGURANÃ‡A: Limpeza automÃ¡tica de dados mÃ©dicos expirados
async function setupDataCleanup() {
  // Limpa dados expirados na inicializaÃ§Ã£o
  await cleanupExpiredData(api);
  
  // Configura limpeza periÃ³dica (a cada 30 minutos)
  api.alarms.create('cleanupExpiredData', { periodInMinutes: 30 });
  
  // Listener para o alarme de limpeza
  api.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanupExpiredData') {
      logger.info('Executando limpeza automÃ¡tica de dados expirados', { 
        operation: 'setupDataCleanup',
        alarmName: alarm.name 
      });
      await cleanupExpiredData(api);
    }
  });
}

// âœ… SEGURANÃ‡A: Rate limiting para mensagens
const messageRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 100; // mÃ¡ximo 100 mensagens por minuto por origem

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

// âœ… SEGURANÃ‡A: ValidaÃ§Ã£o rigorosa de origem para message passing
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const timestamp = new Date().toISOString();
  
  // Rate limiting check
  const senderId = sender?.id || sender?.tab?.id || 'unknown';
  if (!checkRateLimit(senderId)) {
    logger.warn('Rate limit excedido para sender', { 
      operation: 'onMessage',
      senderId,
      timestamp 
    });
    return false;
  }

  // Validar origem da mensagem
  if (!sender || !sender.tab) {
    // Mensagens de outras partes da extensÃ£o (popup, sidebar, etc.)
    if (!sender.id || sender.id !== api.runtime.id) {
      logger.warn('Mensagem rejeitada - origem nÃ£o confiÃ¡vel', {
        operation: 'onMessage',
        senderId: sender?.id,
        expectedId: api.runtime.id,
        url: sender?.url,
        timestamp
      });
      return false;
    }
  } else {
    // Mensagens de content scripts devem vir de pÃ¡ginas SIGSS autorizadas
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
      logger.warn('Mensagem rejeitada - origem nÃ£o autorizada', {
        operation: 'onMessage',
        senderUrl,
        senderOrigin,
        allowedOrigins,
        tabId: sender.tab.id,
        timestamp
      });
      return false;
    }
  }

  // Validar estrutura da mensagem
  if (!message || typeof message !== 'object' || !message.type) {
    logger.warn('Mensagem rejeitada - estrutura invÃ¡lida', {
      operation: 'onMessage',
      message,
      messageType: typeof message,
      hasType: message?.type,
      senderId,
      timestamp
    });
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
    logger.warn(`[Assistente Background] ${timestamp} - Tipo de mensagem nÃ£o permitido:`, {
      messageType: message.type,
      allowedTypes: allowedMessageTypes,
      senderId
    });
    return false;
  }

  // Log de mensagem autorizada
  logger.info(`[Assistente Background] ${timestamp} - Mensagem autorizada:`, {
    type: message.type,
    senderId,
    origin: sender?.tab?.url || sender?.url || 'extension'
  });

  if (message.type === "SAVE_REGULATION_DATA") {
    logger.info(
      "[Assistente Background] Recebido pedido para salvar dados da regulaÃ§Ã£o:",
      message.payload
    );
    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        // âœ… SEGURANÃ‡A: Criptografar dados mÃ©dicos sensÃ­veis antes do armazenamento
        const encryptedData = await encryptForStorage(
          regulationDetails, 
          MEDICAL_DATA_CONFIG.SENSITIVE_TTL_MINUTES
        );
        
        await api.storage.local.set({ 
          pendingRegulation: encryptedData,
          pendingRegulationTimestamp: Date.now()
        });
        
        logger.info(
          "[Assistente Background] Detalhes da regulaÃ§Ã£o salvos criptografados no storage local"
        );
      } else {
        logger.warn(
          "[Assistente Background] NÃ£o foram encontrados detalhes para a regulaÃ§Ã£o:",
          message.payload
        );
      }
    } catch (e) {
      logger.error(
        "[Assistente Background] Falha ao buscar ou salvar dados da regulaÃ§Ã£o:",
        e
      );
    }
    return true;
  }
  
  // Comando para verificar status do KeepAlive
  if (message.type === "GET_KEEPALIVE_STATUS") {
    if (keepAliveManager) {
      const status = await keepAliveManager.getStatus();
      sendResponse(status);
    } else {
      sendResponse({ isActive: false, error: "KeepAliveManager nÃ£o inicializado" });
    }
    return true;
  }

  // Mensagem nÃ£o reconhecida
  logger.warn("[Assistente Background] Tipo de mensagem nÃ£o reconhecido:", message.type);
  return false;
});

async function openSidebar(tab) {
  if (api.sidePanel) {
    await api.sidePanel.open({ windowId: tab.windowId });
  } else if (api.sidebarAction) {
    await api.sidebarAction.toggle();
  }
}

api.action.onClicked.addListener(openSidebar);

// Inicializa o KeepAliveManager e limpeza de dados na inicializaÃ§Ã£o
initializeKeepAlive();
setupDataCleanup();

// Reinicializa o KeepAliveManager quando o service worker Ã© reativado
api.runtime.onStartup.addListener(() => {
  logger.info("[Assistente Background] Service worker reiniciado - reinicializando KeepAlive");
  initializeKeepAlive();
  setupDataCleanup();
});

api.runtime.onInstalled.addListener((details) => {
  logger.info("[Assistente Background] ExtensÃ£o instalada/atualizada - inicializando KeepAlive");
  initializeKeepAlive();
  setupDataCleanup();
  
  if (api.sidePanel) {
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((e) =>
        logger.error("Falha ao definir o comportamento do sidePanel:", e)
      );
  }

  api.contextMenus.create({
    id: "openSidePanel",
    title: "Alternar Assistente de RegulaÃ§Ã£o",
    contexts: ["all"],
  });

  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
      openSidebar(tab);
    }
  });

  if (details.reason === "install") {
    api.tabs.create({ url: api.runtime.getURL("help.html") });
  }
});

