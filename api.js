/**
 * Obtém a URL base do sistema a partir das configurações salvas pelo usuário.
 * @returns {Promise<string>} A URL base salva.
 */
export async function getBaseUrl() {
  try {
    const data = await browser.storage.sync.get("baseUrl");
    if (data.baseUrl) return data.baseUrl;
    console.error(
      "URL base não configurada. Vá em 'Opções' para configurá-la."
    );
    throw new Error("URL base não está configurada.");
  } catch (e) {
    console.error("Erro ao obter a URL base:", e);
    throw e;
  }
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
  if (!term || term.length < 1) return [];
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}/sigss/usuarioServico/busca`);
  url.search = new URLSearchParams({ searchString: term });
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
  const patientData = await response.json();
  return patientData?.usuarioServico || {};
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
    rows: "1000",
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
      // PASSO 3.3: Tornar a conversão de ID mais segura para não falhar com o valor 0.
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

/**
 * Busca dados no CADSUS. A busca prioriza o CPF se ambos forem fornecidos.
 * @param {object} options
 * @param {string} [options.cpf] - CPF do paciente.
 * @param {string} [options.cns] - CNS do paciente.
 * @returns {Promise<object|null>}
 */
export async function fetchCadsusData({ cpf, cns }) {
  if (!cpf && !cns) {
    return null;
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
    rows: "1000",
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

  const enrichedAppointments = [];
  const batchSize = 10;

  for (let i = 0; i < basicAppointments.length; i += batchSize) {
    const batch = basicAppointments.slice(i, i + batchSize);

    const promises = batch.map(async (appt) => {
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
    });

    const settledBatch = await Promise.all(promises);
    enrichedAppointments.push(...settledBatch);
  }

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
    rows: "1000",
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
    // PASSO 3.3: Tornar a extração de ID mais robusta com regex.
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

  allRegulations.sort((a, b) => {
    const dateA = a.date.split("/").reverse().join("-");
    const dateB = b.date.split("/").reverse().join("-");
    return new Date(dateB) - new Date(dateA);
  });

  return allRegulations;
}
