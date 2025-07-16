import "./browser-polyfill.js";
import { CONFIG, getAPIConfig } from "./config.js";

const api = typeof browser !== "undefined" ? browser : chrome;

// Default configuration for batched API requests
const DEFAULT_BATCH_CONFIG = {
  ATTACHMENT_BATCH_SIZE: CONFIG.API.BATCH_SIZE, // Process 5 attachments at a time
  BATCH_DELAY_MS: CONFIG.API.BATCH_DELAY_MS, // 100ms delay between batches
};

/**
 * Gets the current batch configuration from storage or returns defaults.
 * @returns {Promise<object>} The batch configuration object
 */
async function getBatchConfig() {
  try {
    const stored = await api.storage.sync.get({
      batchAttachmentSize: DEFAULT_BATCH_CONFIG.ATTACHMENT_BATCH_SIZE,
      batchDelayMs: DEFAULT_BATCH_CONFIG.BATCH_DELAY_MS,
    });

    return {
      ATTACHMENT_BATCH_SIZE: Math.max(
        1,
        parseInt(stored.batchAttachmentSize, 10) ||
          DEFAULT_BATCH_CONFIG.ATTACHMENT_BATCH_SIZE
      ),
      BATCH_DELAY_MS: Math.max(
        0,
        parseInt(stored.batchDelayMs, 10) || DEFAULT_BATCH_CONFIG.BATCH_DELAY_MS
      ),
    };
  } catch (error) {
    console.warn("Failed to load batch configuration, using defaults:", error);
    return DEFAULT_BATCH_CONFIG;
  }
}

/**
 * Processes an array of items in batches to prevent overwhelming the server.
 * This utility function implements rate limiting for API requests by:
 * - Processing items in configurable batch sizes
 * - Adding delays between batches to reduce server load
 * - Handling individual item failures gracefully
 * 
 * Used to replace Promise.all() calls that could create too many concurrent requests.
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} batchSize - Number of items to process per batch
 * @param {number} delayMs - Delay in milliseconds between batches
 * @returns {Promise<Array>} Array of processed results
 */
async function processBatched(items, processor, batchSize = CONFIG.API.BATCH_SIZE, delayMs = CONFIG.API.BATCH_DELAY_MS) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process current batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        try {
          return await processor(item, i + index);
        } catch (error) {
          console.warn(`Batch processing error for item ${i + index}:`, error);
          return null; // Return null for failed items
        }
      })
    );

    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < items.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Obtém a URL base do sistema a partir das configurações salvas pelo usuário.
 * @returns {Promise<string>} A URL base salva.
 */
export async function getBaseUrl() {
  let data;
  try {
    data = await api.storage.sync.get("baseUrl");
  } catch (e) {
    console.error("Erro ao obter a URL base do storage:", e);
    throw e;
  }

  if (data && data.baseUrl) {
    return data.baseUrl;
  }

  console.error("URL base não configurada. Vá em 'Opções' para configurá-la.");
  throw new Error("URL_BASE_NOT_CONFIGURED");
}

/**
 * Lida com erros de fetch de forma centralizada.
 * @param {Response} response - O objeto de resposta do fetch.
 */
function handleFetchError(response) {
  console.error(
    `Erro na requisição: ${response.status} ${response.statusText}`
  );
  throw new Error("Falha na comunicação com o servidor.");
}

/**
 * Extrai o texto de uma string HTML.
 * @param {string} htmlString - A string HTML.
 * @returns {string} O texto extraído.
 */
function getTextFromHTML(htmlString) {
  if (!htmlString) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.textContent || "";
}

/**
 * Busca as configurações de prioridade de regulação do sistema.
 * @returns {Promise<Array<object>>} Uma lista de objetos de prioridade.
 */
export async function fetchRegulationPriorities() {
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/configuracaoGravidade/loadConfiguracaoRegra`
  );

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Não foi possível buscar as prioridades de regulação.");
      return [];
    }
    const data = await response.json();
    // Filtra apenas as ativas e ordena pela ordem de exibição definida no sistema
    return data
      .filter((p) => p.coreIsAtivo === "t")
      .sort((a, b) => a.coreOrdemExibicao - b.coreOrdemExibicao);
  } catch (error) {
    console.error("Erro de rede ao buscar prioridades:", error);
    return []; // Retorna lista vazia em caso de falha de rede
  }
}

/**
 * Busca os detalhes completos de uma regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @returns {Promise<object>} O objeto com os dados da regulação.
 */
export async function fetchRegulationDetails({ reguIdp, reguIds }) {
  if (!reguIdp || !reguIds) {
    throw new Error("IDs da regulação são necessários.");
  }
  const baseUrl = await getBaseUrl();
  // Este é o endpoint que vimos no arquivo HAR.
  const url = new URL(
    `${baseUrl}/sigss/regulacaoControleSolicitacao/visualiza`
  );
  url.search = new URLSearchParams({
    "reguPK.idp": reguIdp,
    "reguPK.ids": reguIds,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    handleFetchError(response);
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    // O objeto de dados está aninhado sob a chave "regulacao"
    return data.regulacao || null;
  } else {
    throw new Error(
      "A resposta do servidor não foi JSON. A sessão pode ter expirado."
    );
  }
}

function parseConsultasHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const rows = Array.from(doc.querySelectorAll("tbody > tr"));
  const consultations = [];
  const getFormattedText = (element) => {
    if (!element) return "";
    const clone = element.cloneNode(true);
    clone
      .querySelectorAll("br")
      .forEach((br) =>
        br.parentNode.replaceChild(document.createTextNode("\n"), br)
      );
    return clone.textContent || "";
  };
  const parseDateForSorting = (dateString) => {
    const datePart = (
      dateString.split("\n").find((p) => p.startsWith("At")) || dateString
    )
      .replace("At", "")
      .trim();
    const match = datePart.match(
      /(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?/
    );
    if (!match) return null;
    const [, day, month, year, hour = 0, minute = 0, second = 0] = match;
    return new Date(year, month - 1, day, hour, minute, second);
  };
  let i = 0;
  while (i < rows.length) {
    const mainRow = rows[i];
    const mainCells = mainRow.querySelectorAll("td");
    if (mainCells.length < 5 || !mainCells[0].className.includes("width10")) {
      i++;
      continue;
    }
    const dateText = mainCells[1].textContent.trim().replace(/\s+/g, " ");
    const consultation = {
      priority: mainCells[0].textContent.trim(),
      date: dateText.replace("At", "\nAt"),
      sortableDate: parseDateForSorting(dateText),
      unit: mainCells[2].textContent.trim(),
      specialty: mainCells[3].textContent.trim(),
      professional: mainCells[4].textContent
        .trim()
        .replace(/Insc\.: \d+/, "")
        .trim(),
      details: [],
      isNoShow: mainRow.textContent.includes("FALTOU A CONSULTA"),
    };
    let endIndex = rows.findIndex(
      (row, index) =>
        index > i &&
        row.querySelectorAll("td").length > 5 &&
        row.querySelectorAll("td")[0].className.includes("width10")
    );
    if (endIndex === -1) endIndex = rows.length;
    const blockRows = rows.slice(i + 1, endIndex);
    const isSoapNote = blockRows.some((row) =>
      row.textContent.includes("SOAP -")
    );
    if (isSoapNote) {
      const soapSections = ["SUBJETIVO", "OBJETIVO", "AVALIAÇÃO", "PLANO"];
      soapSections.forEach((sectionName) => {
        const headerRowIndex = blockRows.findIndex((row) =>
          row.textContent.includes(`SOAP - ${sectionName}`)
        );
        if (headerRowIndex === -1) return;
        let content = "",
          ciapCid = "",
          obsNota = "";
        const contentEndIndex = blockRows.findIndex(
          (row, index) =>
            index > headerRowIndex && row.textContent.includes("SOAP -")
        );
        const sectionRows = blockRows.slice(
          headerRowIndex + 1,
          contentEndIndex !== -1 ? contentEndIndex : blockRows.length
        );
        sectionRows.forEach((row) => {
          const diagCell = Array.from(row.querySelectorAll("td")).find(
            (cell) =>
              cell.textContent.includes("CID -") ||
              cell.textContent.includes("CIAP -")
          );
          if (diagCell) {
            ciapCid = diagCell.textContent.trim();
            if (diagCell.nextElementSibling)
              ciapCid += ` - ${diagCell.nextElementSibling.textContent.trim()}`;
          }
          const descDiv = row.querySelector(".divHpdnObs");
          if (descDiv) content += getFormattedText(descDiv);
          const obsCell = Array.from(row.querySelectorAll("td")).find((cell) =>
            cell.textContent.trim().startsWith("OBS./NOTA:")
          );
          if (obsCell)
            obsNota = obsCell.textContent.replace("OBS./NOTA:", "").trim();
        });
        let finalValue = "";
        if (ciapCid) finalValue += ciapCid.trim();
        if (obsNota)
          finalValue += (finalValue ? "\n" : "") + `Obs.: ${obsNota.trim()}`;
        if (content)
          finalValue +=
            (finalValue ? "\n" : "") + `Descrição: ${content.trim()}`;
        if (finalValue.trim())
          consultation.details.push({ label: sectionName, value: finalValue });
      });
    } else {
      blockRows.forEach((row) => {
        const cidCell = Array.from(row.querySelectorAll("td")).find((cell) =>
          cell.textContent.includes("CID -")
        );
        if (cidCell) {
          const descCell = cidCell.nextElementSibling;
          if (descCell)
            consultation.details.push({
              label: "Hipótese Diagnóstica",
              value: `${cidCell.textContent.trim()} - ${descCell.textContent.trim()}`,
            });
        }
        const rowText = row.textContent.trim();
        if (rowText.includes("DESCRIÇÃO DA CONSULTA")) {
          const nextRow = row.nextElementSibling;
          const descDiv = nextRow?.querySelector(".divHpdnObs");
          if (descDiv)
            consultation.details.push({
              label: "Descrição da Consulta",
              value: getFormattedText(descDiv).trim(),
            });
        }
        if (rowText.includes("OBSERVAÇÃO DE ENFERMAGEM:")) {
          const obsCell = row.querySelector("td[colspan]");
          if (obsCell)
            consultation.details.push({
              label: "Observação de Enfermagem",
              value: getFormattedText(obsCell)
                .replace("OBSERVAÇÃO DE ENFERMAGEM:", "")
                .trim(),
            });
        }
      });
    }
    consultations.push(consultation);
    i = endIndex;
  }
  return consultations;
}

export async function searchPatients(term) {
  // Import validation utilities
  const { validateSearchTerm, sanitizeSearchTerm } = await import('./validation.js');
  
  // Early exit for empty terms
  if (!term || term.length < 1) return [];
  
  // Validate and sanitize the search term
  const validation = validateSearchTerm(term);
  if (!validation.valid) {
    throw new Error(`Invalid search term: ${validation.message}`);
  }
  
  const sanitizedTerm = sanitizeSearchTerm(term);
  if (!sanitizedTerm) {
    throw new Error('Search term cannot be empty after sanitization');
  }
  
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/usuarioServico/busca`);
  url.search = new URLSearchParams({ searchString: sanitizedTerm });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return Array.isArray(data)
    ? data.map((p) => ({
        idp: p[0],
        ids: p[1],
        value: p[5],
        cns: p[6],
        dataNascimento: p[7],
        cpf: p[15],
      }))
    : [];
}

export async function fetchVisualizaUsuario({ idp, ids }) {
  if (!idp || !ids)
    throw new Error(`ID inválido. idp: '${idp}', ids: '${ids}'.`);
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/sigss/usuarioServico/visualiza`;
  const body = `isenPK.idp=${encodeURIComponent(
    idp
  )}&isenPK.ids=${encodeURIComponent(ids)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    body,
  });
  if (!response.ok) handleFetchError(response);

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const patientData = await response.json();
    return patientData?.usuarioServico || {};
  } else {
    console.error(
      "A resposta do servidor não foi JSON. Provável expiração de sessão."
    );
    throw new Error(
      "A sessão pode ter expirado. Por favor, faça login no sistema novamente."
    );
  }
}

export async function fetchProntuarioHash({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/sigss/common/queryStrToParamHash`;
  const rawParamString = `isenFullPKCrypto=${isenFullPKCrypto}&moip_idp=4&moip_ids=1&dataInicial=${dataInicial}&dataFinal=${dataFinal}&ppdc=t&consulta_basica=t&obs_enfermagem=t&encaminhamento=t&consulta_especializada=t&consulta_odonto=t&exame_solicitado=t&exame=t&triagem=t&procedimento=t&vacina=t&proc_odonto=t&medicamento_receitado=t&demais_orientacoes=t&medicamento_retirado=t&aih=t&acs=t&lista_espera=t&beneficio=f&internacao=t&apac=t&procedimento_coletivo=t&justificativa=&responsavelNome=&responsavelCPF=&isOdonto=t&isSoOdonto=f`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `paramString=${encodeURIComponent(rawParamString)}`,
  });
  if (!response.ok)
    throw new Error("Não foi possível gerar o passe de acesso.");
  const data = await response.json();
  if (data?.string) return data.string;
  throw new Error(data.mensagem || "Resposta não continha o hash.");
}

export async function fetchConsultasEspecializadas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  if (!isenFullPKCrypto) throw new Error("ID criptografado necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsultaEspecializadas_HTML`
  );
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal,
  });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: data?.tabela || "",
    jsonData: parseConsultasHTML(data?.tabela || ""),
  };
}

export async function fetchConsultasBasicas({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  if (!isenFullPKCrypto) throw new Error("ID criptografado necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/prontuarioAmbulatorial2/buscaDadosConsulta_HTML`
  );
  url.search = new URLSearchParams({
    isenFullPKCrypto,
    dataInicial,
    dataFinal,
  });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return {
    htmlData: data?.tabela || "",
    jsonData: parseConsultasHTML(data?.tabela || ""),
  };
}

export async function fetchAllConsultations({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  const [basicasResult, especializadasResult] = await Promise.all([
    fetchConsultasBasicas({ isenFullPKCrypto, dataInicial, dataFinal }),
    fetchConsultasEspecializadas({ isenFullPKCrypto, dataInicial, dataFinal }),
  ]);
  const combinedJsonData = [
    ...basicasResult.jsonData,
    ...especializadasResult.jsonData,
  ];
  const combinedHtmlData = `<h3>Consultas Básicas</h3>${basicasResult.htmlData}<h3>Consultas Especializadas</h3>${especializadasResult.htmlData}`;
  return { jsonData: combinedJsonData, htmlData: combinedHtmlData };
}

export async function fetchExamesSolicitados({
  isenPK,
  dataInicial,
  dataFinal,
  comResultado,
  semResultado,
}) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/exameRequisitado/findAllReex`);
  const params = {
    "filters[0]": `dataInicial:${dataInicial}`,
    "filters[1]": `dataFinal:${dataFinal}`,
    "filters[2]": `isenPK:${isenPK}`,
    exameSolicitadoMin: "true",
    exameSolicitadoOutro: "true",
    exameComResultado: comResultado,
    exameSemResultado: semResultado,
    tipoBusca: "reex",
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "reex.reexData",
    sord: "asc",
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      id: row.id || "",
      date: cell[2] || "",
      examName: (cell[5] || "").trim(),
      hasResult: (cell[6] || "") === "SIM",
      professional: cell[8] || "",
      specialty: cell[9] || "",
      resultIdp: cell[13] != null ? String(cell[13]) : "",
      resultIds: cell[14] != null ? String(cell[14]) : "",
    };
  });
}

export async function fetchResultadoExame({ idp, ids }) {
  if (!idp || !ids)
    throw new Error("IDs do resultado do exame são necessários.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resultadoExame/visualizaImagem`);
  url.search = new URLSearchParams({
    "iterPK.idp": idp,
    "iterPK.ids": ids,
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) handleFetchError(response);
  const data = await response.json();
  return data?.path || null;
}

export async function fetchCadsusData({ cpf, cns }) {
  // Import validation utilities
  const { validateCPF, validateCNS } = await import('./validation.js');
  
  if (!cpf && !cns) {
    return null;
  }
  
  // Validate CPF if provided
  if (cpf) {
    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
      throw new Error(`CPF inválido: ${cpfValidation.message}`);
    }
  }
  
  // Validate CNS if provided
  if (cns) {
    const cnsValidation = validateCNS(cns);
    if (!cnsValidation.valid) {
      throw new Error(`CNS inválido: ${cnsValidation.message}`);
    }
  }

  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}/sigss/usuarioServicoConsultaPDQ/consultarPaciente`
  );

  const params = new URLSearchParams({
    _search: "false",
    rows: "50",
    page: "1",
    sidx: "nome",
    sord: "asc",
    "pdq.cartaoNacionalSus": "",
    "pdq.cpf": "",
    "pdq.rg": "",
    "pdq.nome": "",
    "pdq.dataNascimento": "",
    "pdq.sexo": "",
    "pdq.nomeMae": "",
  });

  if (cpf) {
    const formattedCpf = String(cpf)
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    params.set("pdq.cpf", formattedCpf);
  } else if (cns) {
    params.set("pdq.cartaoNacionalSus", cns);
  }

  url.search = params.toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    console.warn(`A busca no CADSUS falhou com status ${response.status}.`);
    return null;
  }

  const data = await response.json();

  if (data && data.rows && data.rows.length > 0) {
    return data.rows[0].cell;
  }

  return null;
}

export async function fetchAppointmentDetails({ idp, ids }) {
  if (!idp || !ids) throw new Error("ID do agendamento é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoConsulta/visualiza`);
  url.search = new URLSearchParams({
    "agcoPK.idp": idp,
    "agcoPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    console.error(`Falha ao buscar detalhes do agendamento ${idp}-${ids}`);
    return null;
  }
  const data = await response.json();
  return data?.agendamentoConsulta || null;
}

/**
 * NEW: Busca os detalhes de um agendamento de exame.
 * @param {object} params
 * @param {string} params.idp - O IDP do agendamento de exame.
 * @param {string} params.ids - O IDS do agendamento de exame.
 * @returns {Promise<object>} O objeto com os dados do agendamento de exame.
 */
export async function fetchExamAppointmentDetails({ idp, ids }) {
  if (!idp || !ids) throw new Error("ID do agendamento de exame é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/agendamentoExame/visualizar`);
  url.search = new URLSearchParams({
    "examPK.idp": idp,
    "examPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    handleFetchError(response);
    return null;
  }
  const data = await response.json();
  return data?.agendamentoExame || null;
}

export async function fetchAppointments({ isenPK, dataInicial, dataFinal }) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/resumoCompromisso/lista`);
  const params = {
    isenPK,
    dataInicial,
    dataFinal,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "data",
    sord: "desc",
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  const basicAppointments = (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    let status = "AGENDADO";
    if (String(cell[10]).includes("red")) status = "FALTOU";
    else if (String(cell[7]).includes("blue")) status = "PRESENTE";
    else if (String(cell[8]).includes("red")) status = "CANCELADO";
    else if (String(cell[11]).includes("blue")) status = "ATENDIDO";

    return {
      id: row.id || "",
      type: cell[1] || "N/A",
      date: cell[2] || "",
      time: cell[3] || "",
      location: cell[4] || "",
      professional: cell[5] || "",
      description: (cell[6] || "").trim(),
      status: status,
    };
  });

  // Get current batch configuration for appointments
  const batchConfig = await getBatchConfig();

  // Process appointment enrichment in batches to prevent overwhelming the server
  const enrichedAppointments = await processBatched(
    basicAppointments,
    async (appt) => {
      if (appt.type.toUpperCase().includes("EXAME")) {
        return {
          ...appt,
          specialty: appt.description || "Exame sem descrição",
        };
      }

      const [idp, ids] = appt.id.split("-");
      if (!idp || !ids) return appt;

      try {
        const details = await fetchAppointmentDetails({ idp, ids });
        if (details) {
          let specialtyString = "Sem especialidade";
          const apcn = details.atividadeProfissionalCnes;

          if (apcn && apcn.apcnNome) {
            specialtyString = apcn.apcnCod
              ? `${apcn.apcnNome} (${apcn.apcnCod})`
              : apcn.apcnNome;
          }

          return {
            ...appt,
            isSpecialized: details.agcoIsEspecializada === "t",
            isOdonto: details.agcoIsOdonto === "t",
            specialty: specialtyString,
          };
        }
      } catch (error) {
        console.warn(
          `Falha ao buscar detalhes para o agendamento ${appt.id}`,
          error
        );
      }
      return appt;
    },
    batchConfig.ATTACHMENT_BATCH_SIZE,
    batchConfig.BATCH_DELAY_MS
  );

  return enrichedAppointments;
}

async function fetchRegulations({
  isenPK,
  modalidade,
  dataInicial,
  dataFinal,
}) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/regulacaoRegulador/lista`);

  const params = {
    "filters[0]": `isFiltrarData:${!!dataInicial}`,
    "filters[1]": `dataInicial:${dataInicial || ""}`,
    "filters[2]": `dataFinal:${dataFinal || ""}`,
    "filters[3]": `modalidade:${modalidade}`,
    "filters[4]": "solicitante:undefined",
    "filters[5]": `usuarioServico:${isenPK}`,
    "filters[6]": "autorizado:true",
    "filters[7]": "pendente:true",
    "filters[8]": "devolvido:true",
    "filters[9]": "negado:true",
    "filters[10]": "emAnalise:true",
    "filters[11]": "cancelados:true",
    "filters[12]": "cboFiltro:",
    "filters[13]": "procedimentoFiltro:",
    "filters[14]": "reguGravidade:",
    "filters[15]": "reguIsRetorno:...",
    "filters[16]": "codBarProtocolo:",
    "filters[17]": "reguIsAgendadoFiltro:todos",
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS),
    page: "1",
    sidx: "regu.reguDataPrevista",
    sord: "desc",
  };

  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    let idp = null,
      ids = null;
    const idMatch = (row.id || "").match(/reguPK(\d+)-(\d+)/);
    if (idMatch && idMatch.length === 3) {
      idp = idMatch[1];
      ids = idMatch[2];
    }

    const descriptionHtml = cell[6] || "";
    const [procedure, cid] = descriptionHtml.split("<br/>");

    return {
      id: row.id,
      idp,
      ids,
      type: cell[2] || "N/A",
      priority: getTextFromHTML(cell[3]),
      date: cell[4] || "",
      status: getTextFromHTML(cell[5]),
      procedure: getTextFromHTML(procedure),
      cid: cid ? cid.trim() : "",
      requester: cell[7] || "",
      provider: cell[8] || "",
      isenFullPKCrypto: cell[9] || "",
    };
  });
}

export async function fetchAllRegulations({
  isenPK,
  dataInicial,
  dataFinal,
  type = "all",
}) {
  let regulationsToFetch = [];

  if (type === "all") {
    regulationsToFetch = await Promise.all([
      fetchRegulations({ isenPK, modalidade: "ENC", dataInicial, dataFinal }),
      fetchRegulations({ isenPK, modalidade: "EXA", dataInicial, dataFinal }),
    ]);
  } else if (type === "ENC") {
    regulationsToFetch = [
      await fetchRegulations({
        isenPK,
        modalidade: "ENC",
        dataInicial,
        dataFinal,
      }),
    ];
  } else if (type === "EXA") {
    regulationsToFetch = [
      await fetchRegulations({
        isenPK,
        modalidade: "EXA",
        dataInicial,
        dataFinal,
      }),
    ];
  }

  const allRegulations = regulationsToFetch.flat();

  // Get current batch configuration
  const batchConfig = await getBatchConfig();

  // Process attachment fetching in batches to prevent overwhelming the server
  const regulationsWithAttachments = await processBatched(
    allRegulations,
    async (regulation) => {
      if (regulation.idp && regulation.ids) {
        try {
          // CORREÇÃO: Usa o ID da própria regulação como o isenPK para esta chamada específica.
          const attachmentIsenPk = `${regulation.idp}-${regulation.ids}`;
          const attachments = await fetchRegulationAttachments({
            reguIdp: regulation.idp,
            reguIds: regulation.ids,
            isenPK: attachmentIsenPk,
          });
          return { ...regulation, attachments };
        } catch (error) {
          console.warn(
            `Falha ao buscar anexos para regulação ${regulation.id}:`,
            error
          );
          return { ...regulation, attachments: [] };
        }
      }
      return { ...regulation, attachments: [] };
    },
    batchConfig.ATTACHMENT_BATCH_SIZE,
    batchConfig.BATCH_DELAY_MS
  );

  regulationsWithAttachments.sort((a, b) => {
    const dateA = a.date.split("/").reverse().join("-");
    const dateB = b.date.split("/").reverse().join("-");
    return new Date(dateB) - new Date(dateA);
  });

  return regulationsWithAttachments;
}

/**
 * Busca a lista de documentos anexados ao cadastro de um paciente.
 * @param {object} params
 * @param {string} params.isenPK - O PK do paciente no formato "idp-ids".
 * @returns {Promise<Array<object>>} Uma lista de objetos de documento.
 */
export async function fetchDocuments({ isenPK }) {
  if (!isenPK) throw new Error("ID (isenPK) do paciente é necessário.");
  const [idp, ids] = isenPK.split("-");
  if (!idp || !ids)
    throw new Error("ID (isenPK) do paciente em formato inválido.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/buscaGrid`);
  const params = {
    "isenPK.idp": idp,
    "isenPK.ids": ids,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS_REGULATIONS),
    page: "1",
    sidx: "isar.isarData desc, isar.isarPK.idp",
    sord: "desc",
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || "",
      description: (cell[3] || "").trim(),
      fileType: (cell[4] || "").toLowerCase(),
    };
  });
}

/**
 * Obtém a URL de visualização para um documento específico.
 * @param {object} params
 * @param {string} params.idp - O IDP do documento.
 * @param {string} params.ids - O IDS do documento.
 * @returns {Promise<string|null>} A URL completa para visualização do arquivo.
 */
export async function fetchDocumentUrl({ idp, ids }) {
  if (!idp || !ids) throw new Error("IDs do documento são necessários.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/isar/getHashArquivo`);
  url.search = new URLSearchParams({
    "isarPK.idp": idp,
    "isarPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  if (data?.isenArquivo?.img) {
    const filePath = data.isenArquivo.img;
    return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`;
  }

  return null;
}

/**
 * Busca a lista de arquivos anexados a uma solicitação de regulação específica.
 * @param {object} params
 * @param {string} params.reguIdp - O IDP da regulação.
 * @param {string} params.reguIds - O IDS da regulação.
 * @param {string} params.isenPK - O PK do paciente no formato "idp-ids".
 * @returns {Promise<Array<object>>} Uma lista de objetos de anexo.
 */
export async function fetchRegulationAttachments({ reguIdp, reguIds, isenPK }) {
  if (!reguIdp || !reguIds) throw new Error("ID da regulação é necessário.");
  if (!isenPK) throw new Error("ID do paciente (isenPK) é necessário.");

  const [isenIdp, isenIds] = isenPK.split("-");
  if (!isenIdp || !isenIds)
    throw new Error("ID do paciente (isenPK) em formato inválido.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/buscaGrid`);
  const params = {
    "isenPK.idp": isenIdp,
    "isenPK.ids": isenIds,
    "reguPK.idp": reguIdp,
    "reguPK.ids": reguIds,
    _search: "false",
    nd: Date.now(),
    rows: String(CONFIG.API.MAX_ROWS_REGULATIONS),
    page: "1",
    sidx: "", // Corrigido para corresponder à requisição da aplicação
    sord: "asc", // Corrigido para corresponder à requisição da aplicação
  };
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  return (data?.rows || []).map((row) => {
    const cell = row.cell || [];
    return {
      idp: cell[0],
      ids: cell[1],
      date: cell[2] || "",
      description: (cell[3] || "").trim(),
      fileType: (cell[4] || "").toLowerCase(),
    };
  });
}

/**
 * Obtém a URL de visualização para um anexo de regulação específico.
 * @param {object} params
 * @param {string} params.idp - O IDP do anexo (rearPK.idp).
 * @param {string} params.ids - O IDS do anexo (rearPK.ids).
 * @returns {Promise<string|null>} A URL completa para visualização do arquivo.
 */
export async function fetchRegulationAttachmentUrl({ idp, ids }) {
  if (!idp || !ids) throw new Error("IDs do anexo são necessários.");

  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/rear/getHashArquivo`);
  url.search = new URLSearchParams({
    "rearPK.idp": idp,
    "rearPK.ids": ids,
  }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) handleFetchError(response);
  const data = await response.json();

  if (data?.regulacaoArquivo?.img) {
    const filePath = data.regulacaoArquivo.img;
    return filePath.startsWith("http") ? filePath : `${baseUrl}${filePath}`;
  }

  return null;
}

/**
 * Fetches all data sources for the patient timeline concurrently.
 * @param {object} params - The parameters for the API calls.
 * @returns {Promise<object>} An object containing the data from all sources.
 */
export async function fetchAllTimelineData({
  isenPK,
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  // Usando um objeto de promessas para tornar a extração de resultados mais robusta.
  const dataPromises = {
    consultations: fetchAllConsultations({
      isenFullPKCrypto,
      dataInicial,
      dataFinal,
    }),
    exams: fetchExamesSolicitados({
      isenPK,
      dataInicial,
      dataFinal,
      comResultado: true,
      semResultado: true,
    }),
    appointments: fetchAppointments({ isenPK, dataInicial, dataFinal }),
    regulations: fetchAllRegulations({
      isenPK,
      dataInicial,
      dataFinal,
      type: "all",
    }),
    documents: fetchDocuments({ isenPK }),
  };

  const results = await Promise.allSettled(Object.values(dataPromises));
  const dataKeys = Object.keys(dataPromises);

  const getValueOrDefault = (result, defaultValue = []) => {
    if (result.status === "fulfilled") {
      if (result.value && typeof result.value.jsonData !== "undefined") {
        return result.value.jsonData; // For consultations
      }
      return result.value; // For others
    }
    console.warn("Falha em chamada de API para a timeline:", result.reason);
    return defaultValue;
  };

  const timelineData = {};
  dataKeys.forEach((key, index) => {
    timelineData[key] = getValueOrDefault(results[index]);
  });

  return timelineData;
}

/**
 * Envia uma requisição para manter a sessão ativa no sistema.
 * @returns {Promise<boolean>} True se a requisição foi bem-sucedida, false caso contrário.
 */
export async function keepSessionAlive() {
  try {
    const baseUrl = await getBaseUrl();
    const url = new URL(`${baseUrl}/sigss/common/dataHora`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      console.warn(
        `Keep-alive falhou com status ${response.status} - ${response.statusText}`
      );

      // Se for erro 401 ou 403, provavelmente a sessão expirou
      if (response.status === 401 || response.status === 403) {
        console.error(
          "Sessão expirou - keep-alive não pode manter a sessão ativa"
        );
      }

      return false;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(
        "Keep-alive: resposta não é JSON, possível redirecionamento para login"
      );
      return false;
    }

    const data = await response.json();

    // Verifica se a resposta contém dados válidos
    if (data && (data.dataHora || data.data || data.hora)) {
      console.log(
        `Sessão mantida ativa: ${data.dataHora || data.data || "OK"}`
      );
      return true;
    } else {
      console.warn("Keep-alive: resposta JSON inválida ou vazia");
      return false;
    }
  } catch (error) {
    console.error("Erro ao manter sessão ativa:", error);

    // Se for erro de rede, pode ser problema de conectividade
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("Erro de rede no keep-alive - verifique a conectividade");
    }

    return false;
  }
}
