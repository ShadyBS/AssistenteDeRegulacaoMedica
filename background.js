// Detecta qual API de extensão está disponível (browser para Firefox, chrome para Chrome)
// e a atribui a uma constante 'api' para uso consistente em todo o script.
const api = typeof browser !== "undefined" ? browser : chrome;

/**
 * Abre a barra lateral (side panel no Chrome/Edge, sidebar no Firefox).
 * @param {object} tab - O objeto da aba ativa, fornecido pelo listener do evento.
 */
async function openSidebar(tab) {
  // Verifica a API sidePanel do Chrome/Edge.
  if (api.sidePanel) {
    // CORREÇÃO: Usa a função `open` para abrir o painel lateral.
    // A função `toggle` era incorreta para esta finalidade.
    await api.sidePanel.open({ windowId: tab.windowId });
  }
  // Verifica a API sidebarAction do Firefox.
  else if (api.sidebarAction) {
    // A função toggle aqui está correta para o Firefox.
    await api.sidebarAction.toggle();
  }
}

// Adiciona um listener para o clique no ícone da extensão na barra de ferramentas.
// O objeto 'tab' é passado automaticamente para o listener no Manifest V3.
api.action.onClicked.addListener(openSidebar);

// --- Lógica do Menu de Contexto (clique com o botão direito) ---

// É executado quando a extensão é instalada ou atualizada.
api.runtime.onInstalled.addListener((details) => {
  /*
   * INÍCIO DA CORREÇÃO PRINCIPAL
   * Esta secção garante que o clique no ícone funcione corretamente no Chrome/Edge.
   */
  if (api.sidePanel) {
    // Desativa o comportamento padrão do Chrome/Edge de abrir o painel ao clicar.
    // Ao definir `openPanelOnActionClick` como `false`, garantimos que o nosso
    // listener `api.action.onClicked` será sempre acionado, tornando o comportamento
    // consistente com o do Firefox.
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((e) =>
        console.error("Falha ao definir o comportamento do sidePanel:", e)
      );
  }
  /*
   * FIM DA CORREÇÃO PRINCIPAL
   */

  // Cria um item no menu de contexto do navegador.
  api.contextMenus.create({
    id: "openSidePanel",
    title: "Alternar Assistente de Regulação",
    contexts: ["all"], // O item aparecerá em qualquer contexto de clique.
  });

  // Adiciona um listener para cliques nos itens do menu de contexto.
  // Renomeado o segundo parâmetro para 'tab' para maior clareza.
  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel") {
      // Chama a nossa função unificada para abrir a barra lateral.
      openSidebar(tab);
    }
  });

  // Abre a página de ajuda automaticamente na primeira instalação.
  if (details.reason === "install") {
    api.tabs.create({ url: api.runtime.getURL("help.html") });
  }
});
