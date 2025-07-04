/**
 * @file Content Script para a extensão Assistente de Regulação (v14 - Detecção pela Aba Manutenção).
 * Este script observa a abertura da aba de manutenção para obter os IDs da regulação.
 */

(function () {
  console.log(
    "[Assistente de Regulação] Script de controle v14 (Detecção de Aba) ativo."
  );

  let lastProcessedReguId = null;

  // Função para verificar se a aba de manutenção está aberta e processar os dados
  const checkMaintenanceTab = () => {
    // Encontra o painel da aba 'Manutenção'
    const maintenanceTabPanel = document.getElementById("tabs-manutencao");

    // A aba está ativa se o atributo 'aria-expanded' for 'true'
    const isActive =
      maintenanceTabPanel &&
      maintenanceTabPanel.getAttribute("aria-expanded") === "true";

    if (isActive) {
      // Se a aba estiver ativa, procura os IDs da regulação nos campos hidden
      const idpElement = document.querySelector("#regu\\.reguPK\\.idp");
      const idsElement = document.querySelector("#regu\\.reguPK\\.ids");

      if (idpElement && idsElement && idpElement.value) {
        const reguIdp = idpElement.value;
        const reguIds = idsElement.value;
        const currentReguId = `${reguIdp}-${reguIds}`;

        // Envia a mensagem apenas se for uma regulação diferente da última processada
        if (currentReguId !== lastProcessedReguId) {
          lastProcessedReguId = currentReguId;
          const payload = { reguIdp, reguIds };
          console.log(
            "[Assistente] Aba Manutenção aberta. Enviando IDs da regulação:",
            payload
          );
          browser.runtime.sendMessage({ type: "REGULATION_LOADED", payload });
        }
      }
    } else {
      // Se a aba não estiver ativa, limpa o cache para permitir uma nova detecção futura
      lastProcessedReguId = null;
    }
  };

  // O MutationObserver observa a página por mudanças que possam indicar a abertura da aba
  const observer = new MutationObserver(() => {
    // Usa um debounce para evitar múltiplas chamadas em sequência rápida
    clearTimeout(observer.debounceTimeout);
    observer.debounceTimeout = setTimeout(checkMaintenanceTab, 250);
  });

  // Inicia a observação no corpo do documento
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    // Foca em atributos que mudam quando a aba é trocada
    attributeFilter: ["style", "aria-expanded", "class"],
  });
})();
