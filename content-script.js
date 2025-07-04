/**
 * @file Content Script para a extensão Assistente de Regulação (v12 - Detecção de Contexto Aprimorada para Exames).
 */

(function () {
  console.log(
    "[Assistente de Regulação] Script de controle v12 (Contexto Aprimorado) ativo."
  );

  let lastSentPatientId = null;

  const extractAndSendData = () => {
    const maintenanceTab = document.querySelector(
      'a[href="#tabs-manutencao"]'
    )?.parentElement;
    if (
      !maintenanceTab ||
      !maintenanceTab.classList.contains("ui-tabs-active")
    ) {
      if (lastSentPatientId !== null) {
        lastSentPatientId = null;
      }
      return;
    }

    const patientSelectElement = document.querySelector(
      "#regu\\.usuarioServico\\.isenPK"
    );

    if (patientSelectElement && patientSelectElement.value) {
      const idString = patientSelectElement.value;

      if (idString.includes("-")) {
        const parts = idString.split("-");
        const idp = parts[0];
        const ids = parts[1];
        const patientId = `${idp}-${ids}`;

        if (patientId !== lastSentPatientId) {
          lastSentPatientId = patientId;
          sendContextData(document, idp, ids);
        }
      }
    }
  };

  const sendContextData = (doc, idp, ids) => {
    let contextName = null;

    // **INÍCIO DA ALTERAÇÃO**
    // Tenta primeiro pegar a Especialidade (CBO)
    const specialtyElement = doc.querySelector(
      "#regu_atividadeProfissionalCnes_apcnId_chzn span"
    );
    if (specialtyElement && specialtyElement.textContent.trim() !== "...") {
      contextName = specialtyElement.textContent.trim();
    }

    // Se não encontrou uma especialidade válida, tenta pegar o Procedimento (Exame)
    if (!contextName || contextName === "...") {
      const procedureElement = doc.querySelector(
        "#regu_procedimento_prciPK_chzn span"
      );
      if (procedureElement && procedureElement.textContent.trim() !== "...") {
        contextName = procedureElement.textContent.trim();
      }
    }
    // **FIM DA ALTERAÇÃO**

    const payload = { idp, ids, context: contextName };
    console.log(
      "[Assistente de Regulação] ENVIANDO MENSAGEM PARA SIDEBAR:",
      payload
    );
    browser.runtime.sendMessage({ type: "CONTEXT_DETECTED", payload });
  };

  const observer = new MutationObserver(() => {
    clearTimeout(observer.debounceTimeout);
    observer.debounceTimeout = setTimeout(extractAndSendData, 250);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  extractAndSendData();
})();
