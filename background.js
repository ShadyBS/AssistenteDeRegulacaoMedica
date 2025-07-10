import "./browser-polyfill.js";
import { fetchRegulationDetails } from "./api.js";

const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "SAVE_REGULATION_DATA") {
    console.log(
      "[Assistente Background] Recebido pedido para salvar dados da regulação:",
      message.payload
    );
    try {
      const regulationDetails = await fetchRegulationDetails(message.payload);

      if (regulationDetails) {
        // CORREÇÃO: Usando storage.local em vez de storage.session para maior compatibilidade.
        await api.storage.local.set({ pendingRegulation: regulationDetails });
        console.log(
          "[Assistente Background] Detalhes completos da regulação salvos no storage local:",
          regulationDetails
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
});

async function openSidebar(tab) {
  if (api.sidePanel) {
    await api.sidePanel.open({ windowId: tab.windowId });
  } else if (api.sidebarAction) {
    await api.sidebarAction.toggle();
  }
}

api.action.onClicked.addListener(openSidebar);

api.runtime.onInstalled.addListener((details) => {
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
