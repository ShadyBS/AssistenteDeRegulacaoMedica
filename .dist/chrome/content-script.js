/**
 * @file Content Script para a extensão Assistente de Regulação (v16 - Detecção com Broker).
 * Este script observa a abertura da aba de manutenção e envia os IDs para o background script,
 * que atua como um intermediário para salvar os dados no storage.session.
 */

(function () {
  console.log(
    "[Assistente de Regulação] Script de controle v16 (Detecção com Broker) ativo."
  );

  const api = browser;
  let lastProcessedReguId = null;
  let observer = null;
  let debounceTimeout = null;

  const checkMaintenanceTab = () => {
    const maintenanceTabPanel = document.getElementById("tabs-manutencao");
    const isActive =
      maintenanceTabPanel &&
      maintenanceTabPanel.getAttribute("aria-expanded") === "true";

    if (isActive) {
      const idpElement = document.querySelector("#regu\\.reguPK\\.idp");
      const idsElement = document.querySelector("#regu\\.reguPK\\.ids");

      if (idpElement && idsElement && idpElement.value) {
        const reguIdp = idpElement.value;
        const reguIds = idsElement.value;
        const currentReguId = `${reguIdp}-${reguIds}`;

        if (currentReguId !== lastProcessedReguId) {
          lastProcessedReguId = currentReguId;
          const payload = { reguIdp, reguIds };

          console.log(
            "[Assistente] Aba Manutenção aberta. Enviando IDs para o background script:",
            payload
          );

          // Envia a mensagem para o background script, que tem acesso ao storage.session
          try {
            api.runtime.sendMessage({ type: "SAVE_REGULATION_DATA", payload });
          } catch (e) {
            console.error(
              "[Assistente] Falha ao enviar mensagem para o background script:",
              e
            );
          }
        }
      }
    } else {
      lastProcessedReguId = null;
    }
  };

  // Função para limpar recursos e desconectar o observer
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    lastProcessedReguId = null;
    console.log("[Assistente] Recursos limpos e observer desconectado.");
  };

  // Inicializa o MutationObserver
  const initObserver = () => {
    if (observer) {
      cleanup();
    }

    observer = new MutationObserver(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(checkMaintenanceTab, 250);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"], // Apenas o atributo necessário para detectar abertura da aba
    });
  };

  // Listener para limpeza quando a extensão é desabilitada ou a página é recarregada
  window.addEventListener("beforeunload", cleanup);
  
  // Listener para detectar desconexão da extensão
  api.runtime.onMessage.addListener((message) => {
    if (message.type === "EXTENSION_DISABLED" || message.type === "CLEANUP") {
      cleanup();
    }
  });

  // Detecta quando a extensão é desabilitada
  api.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      cleanup();
    });
  });

  // Inicializa o observer
  initObserver();

  // Cleanup automático após 30 minutos de inatividade para prevenir vazamentos de memória
  let inactivityTimer = null;
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      console.log("[Assistente] Limpeza automática por inatividade.");
      cleanup();
    }, 30 * 60 * 1000); // 30 minutos
  };

  // Reseta o timer de inatividade a cada verificação
  const originalCheck = checkMaintenanceTab;
  checkMaintenanceTab = () => {
    originalCheck();
    resetInactivityTimer();
  };

  // Inicia o timer de inatividade
  resetInactivityTimer();
})();
