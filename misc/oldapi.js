/**
 * @file Módulo da API.
 * Contém todas as funções para interagir com os endpoints do SIGSS.
 * Todas as funções são exportadas para serem usadas em outros módulos.
 */

/**
 * Buscar usuários/serviços usando filtros
 * @endpoint GET /sigss/usuarioServico/listar
 * @param {Object} params - Parâmetros de busca.
 * @returns {Promise<Object>}
 */
export async function buscarUsuarioServico(params) {
  const urlBase =
    "http://saudehml.farroupilha.rs.gov.br/sigss/usuarioServico/listar";
  const query = new URLSearchParams(params).toString();
  const url = `${urlBase}?${query}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/json; charset=iso-8859-1",
      "x-requested-with": "XMLHttpRequest",
    },
    credentials: "include",
  });
  if (!response.ok) {
    if (response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("Sessão expirada. Faça login no portal SIGSS novamente.");
    }
    throw new Error("Erro ao buscar dados: " + response.status);
  }
  return response.json();
}

/**
 * Buscar usuários por termo genérico (nome, CPF, CNS, etc)
 * @endpoint GET /sigss/usuarioServico/busca
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchBuscarUsuarioGenerico({ searchString }) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/usuarioServico/busca?searchString=${encodeURIComponent(
    searchString
  )}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "x-requested-with": "XMLHttpRequest",
    },
    credentials: "include",
  });
  if (!response.ok) {
    if (response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("Sessão expirada. Faça login no portal SIGSS novamente.");
    }
    throw new Error("Erro ao buscar dados: " + response.status);
  }
  return response.json();
}

/**
 * Buscar detalhes completos do usuário
 * @endpoint POST /sigss/usuarioServico/visualiza
 * @param {Object} options
 * @returns {Promise<Object>}
 */

/**
 * Buscar foto do usuário por código da pessoa (retorna base64)
 * @endpoint GET /sigss/usuarioServico/visualizaFoto
 * @param {Object} options
 * @param {string} options.codigoPessoa - Código da pessoa
 * @returns {Promise<string>} Base64 da imagem
 */
export async function fetchFotoUsuario({ codigoPessoa }) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/usuarioServico/visualizaFoto?codigoPessoa=${encodeURIComponent(
    codigoPessoa
  )}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Erro ao buscar foto: " + response.status);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Busca dados do CADSUS pelo CPF, compara com a ficha local e retorna HTML com o resultado.
 * @param {Object} options - Opções com a ficha e o CPF.
 * @returns {Promise<string>} O HTML da tabela de comparação.
 */
export async function fetchAndCompareFichaCadsus({ ficha, cpf }) {
  try {
    const urlCadsus = `${BASE_URL}/sigss/usuarioServicoConsultaPDQ/consultarPaciente?_search=false&rows=50&page=1&sidx=nome&sord=asc&pdq.cpf=${encodeURIComponent(
      cpf
    )}`;
    const respCadsus = await fetch(urlCadsus, {
      method: "GET",
      credentials: "include",
    });

    if (!respCadsus.ok) {
      handleFetchError(respCadsus);
    }
    const cadsusData = await respCadsus.json();
    if (!cadsusData.rows || cadsusData.rows.length === 0) {
      return `<div style='color:#F90000;font-weight:bold;'>Usuário não encontrado no CADSUS pelo CPF.</div>`;
    }
    const cell = cadsusData.rows[0].cell;

    const normalizarTelefone = (tel) =>
      (tel || "").replace(/\D/g, "").slice(-11);

    const campos = [
      {
        nome: "Nome",
        valor1: ficha.entidadeFisica?.entidade?.entiNome,
        valor2: cell[2],
      },
      {
        nome: "Nome da Mãe",
        valor1: ficha.entidadeFisica?.entfNomeMae,
        valor2: cell[7],
      },
      {
        nome: "Data de Nascimento",
        valor1: ficha.entidadeFisica?.entfDtNasc,
        valor2: cell[3],
      },
      { nome: "CNS", valor1: ficha.isenNumCadSus, valor2: cell[65] },
      { nome: "CPF", valor1: ficha.entidadeFisica?.entfCPF, valor2: cell[50] },
    ];
    let html = `<table class='resposta-tabela'><tr><th>Campo</th><th>Ficha</th><th>CADSUS</th></tr>`;
    let diferentes = 0;
    campos.forEach((c) => {
      const v1 = (c.valor1 || "").trim();
      const v2 = (c.valor2 || "").trim();
      const diff = v1 !== v2;
      if (diff) diferentes++;
      html += `<tr${diff ? " style='background:#ffeaea;'" : ""}><td>${
        c.nome
      }</td><td>${v1 || "-"}</td><td>${v2 || "-"}</td></tr>`;
    });
    html += `</table>`;

    if (diferentes === 0) {
      html =
        `<div style='color:#278B77;font-weight:bold;margin-bottom:8px;'>Todos os dados conferem! ✔️</div>` +
        html;
    } else {
      html =
        `<div style='color:#F90000;font-weight:bold;margin-bottom:8px;'>Atenção: Existem ${diferentes} campos com dados diferentes!</div>` +
        html;
    }
    return html;
  } catch (e) {
    throw new Error(`Erro ao consultar CADSUS: ${e.message}`);
  }
}

/**
 * Interpreta a resposta da comparação CADSUS
 * @param {string} resposta - HTML ou JSON retornado
 * @returns {{ erro: boolean, mensagem: string, html: string }}
 */
export function parseCadsusComparacaoResponse(resposta) {
  if (
    typeof resposta === "string" &&
    (resposta.includes("Erro ao consultar ficha") ||
      resposta.includes("Usuário não encontrado no CADSUS"))
  ) {
    return {
      erro: true,
      mensagem: resposta,
      html: `<div style='color:#c00;font-size:13px;'>${resposta}</div>`,
    };
  }
  try {
    const parsed = JSON.parse(resposta);
    if (parsed && parsed.mensagem && parsed.categoria === "error") {
      return {
        erro: true,
        mensagem: parsed.mensagem,
        html: `<div style='color:#c00;font-size:13px;'>${parsed.mensagem}</div>`,
      };
    }
  } catch {}
  return { erro: false, mensagem: "", html: resposta };
}

/**
 * Busca detalhes de uma regulação pelo idp e ids
 * @endpoint GET /sigss/regulacaoControleSolicitacao/visualiza
 * @param {object} param0
 * @returns {Promise<object>}
 */
export async function fetchDetalhesRegulacao({ idp, ids }) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/regulacaoControleSolicitacao/visualiza?reguPK.idp=${idp}&reguPK.ids=${ids}`;
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok) throw new Error("Erro ao buscar detalhes da regulação");
  return await response.json();
}

/**
 * Buscar compromissos do usuário por isenPK e período
 * @endpoint GET /sigss/resumoCompromisso/lista
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchCompromissosUsuario({
  isenPK,
  dataInicial,
  dataFinal,
  page = 1,
  rows = 15,
  sidx = "data",
  sord = "desc",
}) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/resumoCompromisso/lista?isenPK=${encodeURIComponent(
    isenPK
  )}&dataInicial=${encodeURIComponent(
    dataInicial
  )}&dataFinal=${encodeURIComponent(
    dataFinal
  )}&_search=false&nd=${Date.now()}&rows=${rows}&page=${page}&sidx=${encodeURIComponent(
    sidx
  )}&sord=${encodeURIComponent(sord)}`;
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok)
    throw new Error("Erro ao buscar compromissos: " + response.status);
  return response.json();
}

/**
 * Buscar lista de espera do SIGSS por isenPK (fullPK)
 * @endpoint GET /sigss/listaEspera/listar
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchListaEsperaPorIsenPK({
  isenPK,
  page = 1,
  rows = 15,
  sidx = "lies.liesData",
  sord = "desc",
}) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/listaEspera/listar?filters%5B0%5D=isFiltrarData%3Afalse&filters%5B1%5D=dataInicial%3A&filters%5B2%5D=dataFinal%3A&filters%5B3%5D=limoPK%3A&filters%5B4%5D=liesTipo%3A&filters%5B5%5D=liesSituacao%3ATOD&filters%5B6%5D=isenPK%3A${isenPK}&_search=false&nd=${Date.now()}&rows=${rows}&page=${page}&sidx=${encodeURIComponent(
    sidx
  )}&sord=${encodeURIComponent(sord)}`;
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok) throw new Error("Erro ao buscar lista de espera");
  const data = await response.json();
  return {
    total: data.total || 1,
    page: data.page || 1,
    records: data.records || 0,
    rows: (data.rows || []).map((row) => {
      const c = row.cell;
      return {
        id: row.id,
        cell: c,
        situacao: c[2],
        tipo: c[3],
        gravidade: c[4],
        codigo: c[5],
        nome: c[6],
        idade: c[7],
        dataEntrada: c[8],
        especialidade: c[10]?.replace(/<br\s*\/?>(?!$)/gi, " / "),
      };
    }),
  };
}

/**
 * Utilitário para obter o fullPK do usuário a partir de diferentes estruturas
 * @param {Object} usuario
 * @returns {string|null}
 */
export function getUsuarioFullPK(usuario) {
  if (!usuario) return null;
  if (usuario.fullPK) return usuario.fullPK;
  if (usuario.isenPK) return usuario.isenPK;
  if (usuario.isenPK?.idp && usuario.isenPK?.ids)
    return `${usuario.isenPK.idp}-${usuario.isenPK.ids}`;
  return null;
}

/**
 * Buscar regulações do usuário (RegulaçãoRegulador)
 * @endpoint GET /sigss/regulacaoRegulador/lista
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchRegulacaoRegulador({
  usuario,
  filtros,
  page = 1,
  rows = 15,
  sidx = "regu.reguDataPrevista",
  sord = "desc",
}) {
  const usuarioPK = getUsuarioFullPK(usuario);
  const defaultFilters = {
    isFiltrarData: "false",
    dataInicial: "",
    dataFinal: "",
    modalidade: "",
    solicitante: "undefined",
    usuarioServico: usuarioPK,
    autorizado: "false",
    pendente: "false",
    devolvido: "false",
    negado: "false",
    emAnalise: "false",
    cancelados: "false",
    cboFiltro: "",
    procedimentoFiltro: "",
    reguGravidade: "",
    reguIsRetorno: "",
    codBarProtocolo: "",
    reguIsAgendadoFiltro: "todos",
  };
  const mergedFilters = { ...defaultFilters, ...(filtros || {}) };
  const filterParams = Object.entries(mergedFilters)
    .map(
      ([key, value], idx) =>
        `filters%5B${idx}%5D=${encodeURIComponent(key)}%3A${encodeURIComponent(
          value
        )}`
    )
    .join("&");
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/regulacaoRegulador/lista?${filterParams}&_search=false&nd=${Date.now()}&rows=${rows}&page=${page}&sidx=${encodeURIComponent(
    sidx
  )}&sord=${encodeURIComponent(sord)}`;
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok)
    throw new Error("Erro ao buscar regulações: " + response.status);
  return response.json();
}

/**
 * Buscar agendamentos de exame no SIGSS
 * @endpoint GET /sigss/agendamentoExame/listar
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchAgendamentosExame({
  searchField = "isen.isenCod",
  isExameTipo = "ambos",
  searchString = "",
  searchStringBuscaUsuServico = "",
  filters = {},
  page = 1,
  rows = 15,
  sidx = "itex.itexDataPrevista",
  sord = "desc",
} = {}) {
  const defaultFilters = {
    isFiltrarData: "false",
    dataInicial: "",
    dataFinal: "",
    isFiltrarDataNasc: "false",
    dataNascInicial: "",
    dataNascFinal: "",
    isFiltrarIdade: "false",
    idadeInicial: "",
    idadeFinal: "",
  };
  const allFilters = { ...defaultFilters, ...filters };
  const filtersParams = Object.entries(allFilters)
    .map(([k, v], i) => `filters%5B${i}%5D=${encodeURIComponent(k + ":" + v)}`)
    .join("&");
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/agendamentoExame/listar?searchField=${encodeURIComponent(
    searchField
  )}&isExameTipo=${encodeURIComponent(
    isExameTipo
  )}&searchString=${encodeURIComponent(
    searchString
  )}&searchStringBuscaUsuServico=${encodeURIComponent(
    searchStringBuscaUsuServico
  )}&${filtersParams}&_search=false&nd=${Date.now()}&rows=${rows}&page=${page}&sidx=${encodeURIComponent(
    sidx
  )}&sord=${encodeURIComponent(sord)}`;
  const response = await fetch(url, { method: "GET", credentials: "include" });
  if (!response.ok)
    throw new Error("Erro ao buscar agendamentos de exame: " + response.status);
  return response.json();
}

/**
 * Imprimir guia de exame agendado
 * @endpoint POST /sigss/itemExame/imprimirGuia
 * @param {string} idp
 * @param {string} ids
 */
export async function fetchImprimirGuiaExame(idp, ids) {
  const params = new URLSearchParams();
  params.append("filters[0]", `examIdp:${idp}`);
  params.append("filters[1]", `examIds:${ids}`);
  const response = await fetch(
    "http://saudehml.farroupilha.rs.gov.br/sigss/itemExame/imprimirGuia",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: params.toString(),
      credentials: "include",
    }
  );
  const data = await response.json();
  if (data && data.report) {
    window.open(
      "http://saudehml.farroupilha.rs.gov.br" + data.report,
      "_blank"
    );
  } else {
    throw new Error("Não foi possível gerar a guia do exame.");
  }
}

/**
 * Imprimir requisição de exame não laboratorial da lista de espera
 * @endpoint POST /sigss/requerimentoExame/imprimirRequerimentoExameNaoLabByLies
 * @param {string} idp
 * @param {string} ids
 */
export async function fetchImprimirRequisicaoExameNaoLab(idp, ids) {
  const params = new URLSearchParams();
  params.append("lies.liesPK.idp", idp);
  params.append("lies.liesPK.ids", ids);
  const response = await fetch(
    "http://saudehml.farroupilha.rs.gov.br/sigss/requerimentoExame/imprimirRequerimentoExameNaoLabByLies",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: params.toString(),
      credentials: "include",
    }
  );
  const data = await response.json();
  if (data && data.report) {
    window.open(
      "http://saudehml.farroupilha.rs.gov.br" + data.report,
      "_blank"
    );
  } else {
    throw new Error("Não foi possível gerar a requisição.");
  }
}

/**
 * Buscar requisições laboratoriais do SIGSS
 * @endpoint GET /sigss/requerimentoExame/buscaGridReex
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchRequisicoesLaboratoriais({
  idp,
  ids,
  page = 1,
  rows = 15,
  sidx = "reex.reexPK.idp",
  sord = "desc",
}) {
  const url = `http://saudehml.farroupilha.rs.gov.br/sigss/requerimentoExame/buscaGridReex?atcoPK.idp=${encodeURIComponent(
    idp
  )}&atcoPK.ids=${encodeURIComponent(
    ids
  )}&_search=false&nd=${Date.now()}&rows=${rows}&page=${page}&sidx=${encodeURIComponent(
    sidx
  )}&sord=${encodeURIComponent(sord)}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(
      "Erro ao buscar requisições laboratoriais: " + response.status
    );
  }
  return response.json();
}

/**
 * Gera o hash de acesso para o prontuário de um paciente.
 * @endpoint POST /sigss/common/queryStrToParamHash
 * @param {object} options
 * @param {string} options.isenFullPKCrypto - O ID criptografado do paciente.
 * @param {string} options.dataInicial - A data inicial no formato DD/MM/YYYY.
 * @param {string} options.dataFinal - A data final no formato DD/MM/YYYY.
 * @returns {Promise<string>} O paramHash para aceder ao prontuário.
 */
export async function fetchProntuarioHash({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  const url =
    "http://saudehml.farroupilha.rs.gov.br/sigss/common/queryStrToParamHash";

  // 1. Constrói a string de parâmetros RAW, sem codificar nada ainda.
  const rawParamString = `isenFullPKCrypto=${isenFullPKCrypto}&moip_idp=4&moip_ids=1&dataInicial=${dataInicial}&dataFinal=${dataFinal}&ppdc=t&consulta_basica=t&obs_enfermagem=t&encaminhamento=t&consulta_especializada=t&consulta_odonto=t&exame_solicitado=t&exame=t&triagem=t&procedimento=t&vacina=t&proc_odonto=t&medicamento_receitado=t&demais_orientacoes=t&medicamento_retirado=t&aih=t&acs=t&lista_espera=t&beneficio=f&internacao=t&apac=t&procedimento_coletivo=t&justificativa=&responsavelNome=&responsavelCPF=&isOdonto=t&isSoOdonto=f`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    // 2. O corpo da requisição é a chave 'paramString' seguida pelo VALOR TOTALMENTE CODIFICADO.
    body: `paramString=${encodeURIComponent(rawParamString)}`,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Não foi possível gerar o passe de acesso ao prontuário.");
  }

  const data = await response.json();

  if (data && data.string) {
    return data.string;
  } else {
    const errorMessage =
      data.mensagem || "A resposta do servidor não continha o hash de acesso.";
    throw new Error(errorMessage);
  }
}

/**
 * Abre o prontuário numa aba de fundo, extrai o seu texto e fecha a aba.
 * A lógica foi melhorada para evitar erros de "tab not found".
 * @param {object} options
 * @returns {Promise<string>} O texto extraído do corpo do prontuário.
 */
export function fetchProntuarioText({
  isenFullPKCrypto,
  dataInicial,
  dataFinal,
}) {
  return new Promise(async (resolve, reject) => {
    let newTabId = null;
    let timeoutId = null;
    let isClosed = false;

    // Função centralizada para limpar tudo (remover listener, fechar aba)
    const cleanup = () => {
      if (isClosed) return;
      isClosed = true;

      // Remove o listener para não ficar "órfão"
      chrome.runtime.onMessage.removeListener(listener);

      // Limpa o timeout para não executar desnecessariamente
      if (timeoutId) clearTimeout(timeoutId);

      // Fecha a aba se ela ainda existir, ignorando erros se já foi fechada
      if (newTabId) {
        chrome.tabs.remove(newTabId).catch((error) => {
          console.log(
            `Não foi preciso remover a aba ${newTabId}, já estava fechada.`
          );
        });
      }
    };

    // Listener de mensagens do script injetado no prontuário
    const listener = (message, sender) => {
      if (sender.tab && sender.tab.id === newTabId) {
        if (message.type === "PRONTUARIO_TEXT") {
          resolve(message.text);
        } else if (message.type === "PRONTUARIO_ERROR") {
          reject(new Error(`Erro no scraper do prontuário: ${message.error}`));
        }
        cleanup(); // Limpa tudo após receber a mensagem
      }
    };

    try {
      const paramHash = await fetchProntuarioHash({
        isenFullPKCrypto,
        dataInicial,
        dataFinal,
      });
      const url = `http://saudehml.farroupilha.rs.gov.br/sigss/prontuarioAmbulatorial2.jsp?paramHash=${paramHash}`;

      chrome.runtime.onMessage.addListener(listener);

      const newTab = await chrome.tabs.create({ url, active: false });
      newTabId = newTab.id;

      // Injeta o script na aba criada
      try {
        await chrome.scripting.executeScript({
          target: { tabId: newTabId },
          files: ["sidebar/prontuario-scraper.js"],
        });
        console.log(
          "[MVRegulador] Script de prontuário injetado via scripting.executeScript"
        );
      } catch (e) {
        console.error(
          "[MVRegulador] Falha ao injetar prontuario-scraper.js:",
          e
        );
      }

      // Timeout para garantir que o processo não fica preso
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            "Timeout: Não foi possível extrair o texto do prontuário em 20 segundos."
          )
        );
        cleanup(); // Limpa tudo se o timeout for atingido
      }, 20000);
    } catch (error) {
      reject(error);
      cleanup(); // Limpa tudo em caso de erro na criação da aba
    }
  });
}

const BASE_URL = "http://saudehml.farroupilha.rs.gov.br";

function handleFetchError(response) {
  if (response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Sessão expirada. Faça login no portal SIGSS novamente.");
  }
  throw new Error("Erro na comunicação com o servidor: " + response.status);
}

/**
 * Busca sugestões de pacientes pelo termo de busca.
 * @param {string} term - O termo a ser buscado.
 * @returns {Promise<Array>} Uma lista de pacientes.
 */
export async function searchPatients(term) {
  if (term.length < 3) return [];
  const url = new URL(`${BASE_URL}/sigss/atendimento/isen/busca`);
  url.search = new URLSearchParams({ q: term }).toString();
  const response = await fetch(url);
  if (!response.ok) {
    handleFetchError(response);
  }
  return response.json();
}

export async function fetchVisualizaUsuario({ idp, ids }) {
  const url = `${BASE_URL}/sigss/usuarioServico/visualiza`;
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
    credentials: "include",
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Resposta inesperada do servidor:", text);
    throw new Error(
      "Resposta inesperada do servidor. Veja o console para detalhes."
    );
  }
}
/**
 * NOVA FUNÇÃO
 * Envia uma mensagem para o background script para iniciar a busca
 * e o parsing de todos os dados clínicos do prontuário.
 * @param {string} token - O isenFullPKCrypto do paciente.
 * @returns {Promise<Object>} A resposta do background script.
 */
export async function triggerClinicalDataPipeline(token) {
  console.log("API: Disparando pipeline de dados clínicos com o token:", token);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchClinicalData", token },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response && response.status === "success") {
          resolve(response.data);
        } else {
          reject(
            new Error(
              response?.message || "Erro desconhecido no pipeline de dados."
            )
          );
        }
      }
    );
  });
}

// Exporta as funções se estiver a usar módulos, ou anexa ao 'window' se não estiver.
const api = {
  searchPatients,
  fetchVisualizaUsuario,
  triggerClinicalDataPipeline, // Nova função exportada
};
