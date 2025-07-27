import "./browser-polyfill.js";
import { fetchRegulationDetails } from "./api.js";
import { KeepAliveManager } from "./KeepAliveManager.js";
import { getBrowserAPIInstance } from "./BrowserAPI.js";
import { encryptForStorage, decryptFromStorage, cleanupExpiredData, MEDICAL_DATA_CONFIG } from "./crypto-utils.js";

const api = getBrowserAPIInstance();

// Instância global do KeepAliveManager
let keepAliveManager = null;

// Inicializa o KeepAliveManager
function initializeKeepAlive() {
  if (!keepAliveManager) {
    keepAliveManager = new KeepAliveManager();
    console.log("[Assistente Background] KeepAliveManager inicializado");
  }
}

// ✅ SEGURANÇA: Limpeza automática de dados médicos expirados
async function setupDataCleanup() {
  // Limpa dados expirados na inicialização
  await cleanupExpiredData(api);
  
  // Configura limpeza periódica (a cada 30 minutos)
  api.alarms.create('cleanupExpiredData', { periodInMinutes: 30 });
  
  // Listener para o alarme de limpeza
  api.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cleanupExpiredData') {
      console.log('[Assistente Background] Executando limpeza automática de dados expirados');
      await cleanupExpiredData(api);
    }
  });
}

// ✅ SEGURANÇA: Rate limiting para mensagens
const messageRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 100; // máximo 100 mensagens por minuto por origem

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

// ✅ SEGURANÇA: Validação rigorosa de origem para message passing
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const timestamp = new Date().toISOString();
  
  // Rate limiting check
  const senderId = sender?.id || sender?.tab?.id || 'unknown';
  if (!checkRateLimit(senderId)) {
    console.warn(`[Assistente Background] ${timestamp} - Rate limit excedido para sender:`, senderId);
    return false;
  }

  // Validar origem da mensagem
  if (!sender || !sender.tab) {
    // Mensagens de outras partes da extensão (popup, sidebar, etc.)
    if (!sender.id || sender.id !== api.runtime.id) {
      console.warn(`[Assistente Background] ${timestamp} - Mensagem rejeitada - origem não confiável:`, {
        senderId: sender?.id,
        expectedId: api.runtime.id,
        url: sender?.url
      });
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
      console.warn(`[Assistente Background] ${timestamp} - Mensagem rejeitada - origem não autorizada:`, {
        senderUrl,
        senderOrigin,
        allowedOrigins,
        tabId: sender.tab.id
      });
      return false;
    }
  }

  // Validar estrutura da mensagem
  if (!message || typeof message !== 'object' || !message.type) {
    console.warn(`[Assistente Background] ${timestamp} - Mensagem rejeitada - estrutura inválida:`, {
      message,
      messageType: typeof message,
      hasType: message?.type,
      senderId
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
    console.warn(`[Assistente Background] ${timestamp} - Tipo de mensagem não permitido:`, {
      messageType: message.type,
      allowedTypes: allowedMessageTypes,
      senderId
    });
    return false;
  }

  // Log de mensagem autorizada
  console.log(`[Assistente Background] ${timestamp} - Mensagem autorizada:`, {
    type: message.type,
    senderId,
    origin: sender?.tab?.url || sender?.url || 'extension'
  });

  if (message.type === "SAVE_REGULATION_DATA") {
    console.log(
      "[Assistente Background] Recebido pedido para salvar dados da regulação:",
      message.payload
    );
    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        // ✅ SEGURANÇA: Criptografar dados médicos sensíveis antes do armazenamento
        const encryptedData = await encryptForStorage(
          regulationDetails, 
          MEDICAL_DATA_CONFIG.SENSITIVE_TTL_MINUTES
        );
        
        await api.storage.local.set({ 
          pendingRegulation: encryptedData,
          pendingRegulationTimestamp: Date.now()
        });
        
        console.log(
          "[Assistente Background] Detalhes da regulação salvos criptografados no storage local"
        );
      } else {
        console.warn(
          "[Assistente Background] Não foram encontrados detalhes para a regulação:",
          message.payload
        );
      }
    } catch (e) {
      console.error(
        "[Assistente Background] Falha ao buscar ou salvar dados da regulação:",
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
      sendResponse({ isActive: false, error: "KeepAliveManager não inicializado" });
    }
    return true;
  }

  // Mensagem não reconhecida
  console.warn("[Assistente Background] Tipo de mensagem não reconhecido:", message.type);
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

// Inicializa o KeepAliveManager e limpeza de dados na inicialização
initializeKeepAlive();
setupDataCleanup();

// Reinicializa o KeepAliveManager quando o service worker é reativado
api.runtime.onStartup.addListener(() => {
  console.log("[Assistente Background] Service worker reiniciado - reinicializando KeepAlive");
  initializeKeepAlive();
  setupDataCleanup();
});

api.runtime.onInstalled.addListener((details) => {
  console.log("[Assistente Background] Extensão instalada/atualizada - inicializando KeepAlive");
  initializeKeepAlive();
  setupDataCleanup();
  
  if (api.sidePanel) {
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((e) =>
        console.error("Falha ao definir o comportamento do sidePanel:", e)
      );
  }

  api.contextMenus.create({
    id: "openSidePanel",
    title: "Alternar Assistente de Regulação",
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
