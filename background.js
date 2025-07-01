/**
 * Este é o Service Worker da extensão.
 * Ele roda em segundo plano e gerencia eventos do navegador.
 */

// Função para abrir e fechar (alternar) a barra lateral.
function toggleSidebar() {
  // Usamos a API browser.sidebarAction, específica para o Firefox.
  browser.sidebarAction.toggle();
}

// Adiciona um listener que é acionado quando o usuário clica no ícone da extensão na barra de ferramentas.
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
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSidePanel") {
    toggleSidebar();
  }
});
