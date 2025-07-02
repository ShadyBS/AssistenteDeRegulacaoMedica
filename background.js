// Função para alternar a barra lateral (sidebar/sidePanel)
async function toggleSidebar() {
  // Para Chrome e navegadores baseados em Chromium
  if (browser.sidePanel) {
    await browser.sidePanel.toggle();
  }
  // Para Firefox
  else if (browser.sidebarAction) {
    await browser.sidebarAction.toggle();
  }
}

// Listener para o clique no ícone da extensão
browser.action.onClicked.addListener(toggleSidebar);

// ----- Código do Menu de Contexto (clique com o botão direito) -----

// Cria o item no menu de contexto quando a extensão é instalada.
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "openSidePanel",
    title: "Alternar Assistente de Regulação",
    contexts: ["all"],
  });
});

// Listener para o clique na opção do menu de contexto.
browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "openSidePanel") {
    toggleSidebar();
  }
});
