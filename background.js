// Detecta qual API de extensão está disponível (browser para Firefox, chrome para Chrome)
// e a atribui a uma constante 'api' para uso consistente em todo o script.
const api = typeof browser !== "undefined" ? browser : chrome;

/**
 * Alterna a visibilidade da barra lateral (side panel no Chrome, sidebar no Firefox).
 * @param {object} tab - O objeto da aba ativa, fornecido pelo listener do evento.
 */
async function toggleSidebar(tab) {
  // Verifica a API sidePanel do Chrome.
  if (api.sidePanel) {
    // A API sidePanel requer um contexto (ID da janela) para funcionar corretamente.
    await api.sidePanel.toggle({ windowId: tab.windowId });
  }
  // Verifica a API sidebarAction do Firefox.
  else if (api.sidebarAction) {
    await api.sidebarAction.toggle();
  }
}

// Adiciona um listener para o clique no ícone da extensão na barra de ferramentas.
// O objeto 'tab' é passado automaticamente para o listener no Manifest V3.
api.action.onClicked.addListener(toggleSidebar);

// --- Lógica do Menu de Contexto (clique com o botão direito) ---

// É executado quando a extensão é instalada ou atualizada.
api.runtime.onInstalled.addListener((details) => {
  // Cria um item no menu de contexto do navegador.
  api.contextMenus.create({
    id: "openSidePanel",
    title: "Alternar Assistente de Regulação",
    contexts: ["all"], // O item aparecerá em qualquer contexto de clique.
  });

  // Abre a página de ajuda automaticamente na primeira instalação
  if (details.reason === "install") {
    api.tabs.create({ url: api.runtime.getURL("help.html") });
  }
});

// Adiciona um listener para cliques nos itens do menu de contexto criados pela extensão.
// O objeto 'tab' também é passado aqui.
api.contextMenus.onClicked.addListener((info, tab) => {
  // Verifica se o item de menu clicado é o que criamos.
  if (info.menuItemId === "openSidePanel") {
    toggleSidebar(tab);
  }
});
