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

// ✅ SEGURANÇA: Validação de origem para message passing
api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Validar origem da mensagem
  if (!sender || !sender.tab) {
    // Mensagens de outras partes da extensão (popup, sidebar, etc.) são permitidas
    // mas verificamos se é realmente da nossa extensão
    if (!sender.id || sender.id !== api.runtime.id) {
      console.warn("[Assistente Background] Mensagem rejeitada - origem não confiável:", sender);
      return false;
    }
  } else {
    // Mensagens de content scripts devem vir de páginas SIGSS autorizadas
    const allowedOrigins = [
      'gov.br',
      'mv.com.br', 
      'cloudmv.com.br',
      'localhost',
      '127.0.0.1'
    ];
    
    const senderUrl = sender.tab.url || sender.url || '';
    const isAuthorized = allowedOrigins.some(domain => 
      senderUrl.includes(domain) || senderUrl.includes('sigss')
    );
    
    if (!isAuthorized) {
      console.warn("[Assistente Background] Mensagem rejeitada - origem não autorizada:", senderUrl);
      return false;
    }
  }

  // Validar estrutura da mensagem
  if (!message || typeof message !== 'object' || !message.type) {
    console.warn("[Assistente Background] Mensagem rejeitada - estrutura inválida:", message);
    return false;
  }

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
