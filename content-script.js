/**
 * @file Content Script para a extensão Assistente de Regulação.
 * Este script é injetado na página de regulação para extrair dados contextuais.
 */

(function () {
  /**
   * Extrai os dados da página e envia para a sidebar.
   * A função só é executada se a deteção automática estiver ativa.
   */
  const extractAndSendData = (settings) => {
    if (!settings.enableAutomaticDetection) {
      return; // Deteção automática desativada pelo utilizador.
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idp = urlParams.get("reguPK.idp");
    const ids = urlParams.get("reguPK.ids");

    // Se não encontrar os IDs do paciente no URL, não faz nada.
    if (!idp || !ids) {
      return;
    }

    let contextName = null;

    // Tenta encontrar o rótulo "Especialidade" para identificar se é uma consulta.
    // Usa `Array.from` para converter o NodeList em um array e usar o método `find`.
    const specialtyLabelElement = Array.from(
      document.querySelectorAll("#dadosSolicitacao table td")
    ).find((td) => td.textContent.trim() === "Especialidade:");

    if (specialtyLabelElement && specialtyLabelElement.nextElementSibling) {
      // É uma CONSULTA. Pega o valor da célula seguinte.
      contextName = specialtyLabelElement.nextElementSibling.textContent.trim();
    } else {
      // Se não encontrou, assume que é um EXAME e pega o valor do procedimento.
      const procedureElement = document.querySelector(
        "#dadosSolicitacao table tbody tr:nth-child(2) td:nth-child(2)"
      );
      if (procedureElement) {
        contextName = procedureElement.textContent.trim();
      }
    }

    // Envia os dados para a sidebar através de uma mensagem.
    browser.runtime.sendMessage({
      type: "CONTEXT_DETECTED",
      payload: {
        idp: idp,
        ids: ids,
        context: contextName,
      },
    });
  };

  // Lê a configuração do storage para verificar se a funcionalidade está ativa.
  browser.storage.sync
    .get({ enableAutomaticDetection: true })
    .then(extractAndSendData);
})();
