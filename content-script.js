/**
 * @file Content Script para a extensão Assistente de Regulação (v16 - Detecção com Broker).
 * Este script observa a abertura da aba de manutenção e envia os IDs para o background script,
 * que atua como um intermediário para salvar os dados no storage.session.
 */

(function () {
  console.log('[Assistente de Regulação] Script de controle v16 (Detecção com Broker) ativo.');

  const api = browser;
  let lastProcessedReguId = null;

  const checkMaintenanceTab = () => {
    const maintenanceTabPanel = document.getElementById('tabs-manutencao');
    const isActive =
      maintenanceTabPanel && maintenanceTabPanel.getAttribute('aria-expanded') === 'true';

    if (isActive) {
      const idpElement = document.querySelector('#regu\\.reguPK\\.idp');
      const idsElement = document.querySelector('#regu\\.reguPK\\.ids');

      if (idpElement && idsElement && idpElement.value) {
        const reguIdp = idpElement.value;
        const reguIds = idsElement.value;
        const currentReguId = `${reguIdp}-${reguIds}`;

        if (currentReguId !== lastProcessedReguId) {
          lastProcessedReguId = currentReguId;
          const payload = { reguIdp, reguIds };

          console.log(
            '[Assistente] Aba Manutenção aberta. Enviando IDs para o background script:',
            payload
          );

          // Envia a mensagem para o background script, que tem acesso ao storage.session
          try {
            api.runtime.sendMessage({ type: 'SAVE_REGULATION_DATA', payload });
          } catch (e) {
            console.error('[Assistente] Falha ao enviar mensagem para o background script:', e);
          }
        }
      }
    } else {
      lastProcessedReguId = null;
    }
  };

  const observer = new MutationObserver(() => {
    clearTimeout(observer.debounceTimeout);
    observer.debounceTimeout = setTimeout(checkMaintenanceTab, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'aria-expanded', 'class'],
  });
})();
