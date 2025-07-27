/**
 * @file Content Script para a extensão Assistente de Regulação (v17 - Segurança Aprimorada).
 * Este script observa a abertura da aba de manutenção e envia os IDs para o background script,
 * com proteções contra DoS e throttling de mutações.
 */

(function () {
  console.log(
    "[Assistente de Regulação] Script de controle v17 (Segurança Aprimorada) ativo."
  );

  // ✅ SEGURO: Compatibilidade cross-browser com fallback
  const api = globalThis.browser || globalThis.chrome;
  
  if (!api) {
    console.error('[Assistente] API de extensão não disponível');
    return;
  }
  
  let lastProcessedReguId = null;
  let observer = null;
  let debounceTimeout = null;
  
  // ✅ SEGURANÇA: Controle de throttling para prevenir DoS
  let mutationCount = 0;
  const MAX_MUTATIONS_PER_SECOND = 100;
  let mutationResetInterval = null;

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

  // ✅ SEGURANÇA: Função throttled para prevenir sobrecarga
  const throttledCheckMaintenanceTab = () => {
    // Verifica se não excedeu o limite de mutações por segundo
    if (mutationCount >= MAX_MUTATIONS_PER_SECOND) {
      console.warn('[Assistente] Limite de mutações atingido, ignorando verificação');
      return;
    }
    
    mutationCount++;
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(checkMaintenanceTab, 250);
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
    if (mutationResetInterval) {
      clearInterval(mutationResetInterval);
      mutationResetInterval = null;
    }
    lastProcessedReguId = null;
    mutationCount = 0;
    console.log("[Assistente] Recursos limpos e observer desconectado.");
  };

  // Inicializa o MutationObserver
  const initObserver = () => {
    if (observer) {
      cleanup();
    }

    // ✅ SEGURANÇA: Inicializar contador de mutações
    mutationCount = 0;
    
    // Reset do contador a cada segundo
    if (mutationResetInterval) {
      clearInterval(mutationResetInterval);
    }
    mutationResetInterval = setInterval(() => {
      mutationCount = 0;
    }, 1000);

    observer = new MutationObserver(throttledCheckMaintenanceTab);

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