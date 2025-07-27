/**
 * @file Constantes centralizadas para endpoints, parâmetros e configurações da API
 * Este arquivo contém todas as URLs, parâmetros de consulta, cabeçalhos e configurações
 * utilizadas nas chamadas de API do sistema SIGSS.
 */

// Endpoints base do sistema SIGSS
export const API_ENDPOINTS = {
  // Configuração e sistema
  REGULATION_PRIORITIES: "/sigss/configuracaoGravidade/loadConfiguracaoRegra",
  REGULATION_DETAILS: "/sigss/regulacaoControleSolicitacao/visualiza",
  SYSTEM_DATETIME: "/sigss/common/dataHora",
  PARAM_HASH: "/sigss/common/queryStrToParamHash",

  // Usuários e pacientes
  PATIENT_SEARCH: "/sigss/usuarioServico/busca",
  PATIENT_DETAILS: "/sigss/usuarioServico/visualiza",
  CADSUS_SEARCH: "/sigss/usuarioServicoConsultaPDQ/consultarPaciente",

  // Prontuário e consultas
  PRONTUARIO_HASH: "/sigss/common/queryStrToParamHash",
  CONSULTATIONS_BASIC: "/sigss/prontuarioAmbulatorial2/buscaDadosConsulta_HTML",
  CONSULTATIONS_SPECIALIZED: "/sigss/prontuarioAmbulatorial2/buscaDadosConsultaEspecializadas_HTML",

  // Exames
  EXAMS_REQUESTED: "/sigss/exameRequisitado/findAllReex",
  EXAM_RESULT: "/sigss/resultadoExame/visualizaImagem",

  // Agendamentos
  APPOINTMENTS_LIST: "/sigss/resumoCompromisso/lista",
  APPOINTMENT_DETAILS: "/sigss/agendamentoConsulta/visualiza",
  EXAM_APPOINTMENT_DETAILS: "/sigss/agendamentoExame/visualizar",

  // Regulações
  REGULATIONS_LIST: "/sigss/regulacaoRegulador/lista",
  REGULATION_ATTACHMENTS: "/sigss/rear/buscaGrid",
  REGULATION_ATTACHMENT_URL: "/sigss/rear/getHashArquivo",

  // Documentos
  DOCUMENTS_LIST: "/sigss/isar/buscaGrid",
  DOCUMENT_URL: "/sigss/isar/getHashArquivo",
};

// Parâmetros de consulta padrão
export const API_PARAMS = {
  // Parâmetros comuns de paginação e busca
  COMMON: {
    _search: "false",
    nd: () => Date.now(),
    page: "1",
  },

  // Parâmetros para consultas de exames
  EXAMS: {
    exameSolicitadoMin: "true",
    exameSolicitadoOutro: "true",
    tipoBusca: "reex",
    sidx: "reex.reexData",
    sord: "asc",
  },

  // Parâmetros para agendamentos
  APPOINTMENTS: {
    sidx: "data",
    sord: "desc",
  },

  // Parâmetros para regulações
  REGULATIONS: {
    sidx: "regu.reguDataPrevista",
    sord: "desc",
  },

  // Parâmetros para documentos
  DOCUMENTS: {
    sidx: "isar.isarData desc, isar.isarPK.idp",
    sord: "desc",
  },

  // Parâmetros para anexos de regulação
  REGULATION_ATTACHMENTS: {
    sidx: "",
    sord: "asc",
  },

  // Parâmetros para busca no CADSUS
  CADSUS: {
    sidx: "nome",
    sord: "asc",
    rows: "50",
    "pdq.cartaoNacionalSus": "",
    "pdq.cpf": "",
    "pdq.rg": "",
    "pdq.nome": "",
    "pdq.dataNascimento": "",
    "pdq.sexo": "",
    "pdq.nomeMae": "",
  },
};

// Cabeçalhos HTTP padrão
export const API_HEADERS = {
  // Cabeçalhos para requisições AJAX
  AJAX: {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  },

  // Cabeçalhos para formulários
  FORM: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json, text/javascript, */*; q=0.01",
  },

  // Cabeçalhos para keep-alive
  KEEP_ALIVE: {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
};

// Filtros padrão para regulações
export const REGULATION_FILTERS = {
  // Filtros base para consultas de regulação
  BASE: [
    "isFiltrarData",
    "dataInicial",
    "dataFinal",
    "modalidade",
    "solicitante:undefined",
    "usuarioServico",
    "autorizado:true",
    "pendente:true",
    "devolvido:true",
    "negado:true",
    "emAnalise:true",
    "cancelados:true",
    "cboFiltro:",
    "procedimentoFiltro:",
    "reguGravidade:",
    "reguIsRetorno:...",
    "codBarProtocolo:",
    "reguIsAgendadoFiltro:todos",
  ],

  // Modalidades de regulação
  MODALITIES: {
    CONSULTATION: "ENC",
    EXAM: "EXA",
  },
};

// Parâmetros para prontuário completo
export const PRONTUARIO_PARAMS = {
  // Parâmetros fixos para geração de hash do prontuário
  FIXED: {
    "moip_idp": "4",
    "moip_ids": "1",
    "ppdc": "t",
    "consulta_basica": "t",
    "obs_enfermagem": "t",
    "encaminhamento": "t",
    "consulta_especializada": "t",
    "consulta_odonto": "t",
    "exame_solicitado": "t",
    "exame": "t",
    "triagem": "t",
    "procedimento": "t",
    "vacina": "t",
    "proc_odonto": "t",
    "medicamento_receitado": "t",
    "demais_orientacoes": "t",
    "medicamento_retirado": "t",
    "aih": "t",
    "acs": "t",
    "lista_espera": "t",
    "beneficio": "f",
    "internacao": "t",
    "apac": "t",
    "procedimento_coletivo": "t",
    "justificativa": "",
    "responsavelNome": "",
    "responsavelCPF": "",
    "isOdonto": "t",
    "isSoOdonto": "f",
  },
};

// Mensagens de erro padrão
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: "Falha na comunicação com o servidor.",
  SESSION_EXPIRED: "A sessão pode ter expirado. Por favor, faça login no sistema novamente.",
  INVALID_RESPONSE: "A resposta do servidor não foi JSON. A sessão pode ter expirado.",
  MISSING_PATIENT_ID: "ID do paciente é necessário.",
  MISSING_REGULATION_ID: "IDs da regulação são necessários.",
  MISSING_EXAM_ID: "IDs do resultado do exame são necessários.",
  MISSING_APPOINTMENT_ID: "ID do agendamento é necessário.",
  MISSING_DOCUMENT_ID: "IDs do documento são necessários.",
  MISSING_ATTACHMENT_ID: "IDs do anexo são necessários.",
  INVALID_PATIENT_ID: "ID (isenPK) do paciente em formato inválido.",
  INVALID_SEARCH_TERM: "Termo de busca inválido.",
  HASH_GENERATION_FAILED: "Não foi possível gerar o passe de acesso.",
  PRIORITIES_FETCH_FAILED: "Não foi possível buscar as prioridades de regulação.",
  APPOINTMENT_DETAILS_FAILED: "Falha ao buscar detalhes do agendamento",
  EXAM_APPOINTMENT_DETAILS_FAILED: "ID do agendamento de exame é necessário.",
  CADSUS_SEARCH_FAILED: "A busca no CADSUS falhou",
  DOCUMENT_URL_NOT_FOUND: "URL do documento não encontrada.",
  ATTACHMENT_URL_NOT_FOUND: "URL do anexo não encontrada.",
  INVALID_CONFIG_FILE: "Ficheiro de configuração inválido ou corrompido.",
  KEEP_ALIVE_FAILED: "Keep-alive falhou",
  KEEP_ALIVE_INVALID_RESPONSE: "Keep-alive: resposta JSON inválida ou vazia",
  KEEP_ALIVE_NOT_JSON: "Keep-alive: resposta não é JSON, possível redirecionamento para login",
};

// Códigos de status HTTP relevantes
export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Configurações de formatação de dados
export const DATA_FORMATS = {
  // Formatos de data
  DATE: {
    BRAZILIAN: "DD/MM/YYYY",
    ISO: "YYYY-MM-DD",
    DEFAULT_START: "01/01/1900",
  },

  // Formatos de CPF
  CPF: {
    PATTERN: /(\d{3})(\d{3})(\d{3})(\d{2})/,
    FORMAT: "$1.$2.$3-$4",
  },
};

// Configurações específicas por tipo de consulta
export const QUERY_CONFIGS = {
  // Configuração para exames
  EXAMS: {
    WITH_RESULT: true,
    WITHOUT_RESULT: true,
  },

  // Configuração para regulações
  REGULATIONS: {
    INCLUDE_AUTHORIZED: true,
    INCLUDE_PENDING: true,
    INCLUDE_RETURNED: true,
    INCLUDE_DENIED: true,
    INCLUDE_IN_ANALYSIS: true,
    INCLUDE_CANCELLED: true,
  },
};

// Utilitários para construção de URLs e parâmetros
export const API_UTILS = {
  /**
   * Constrói uma URL completa com base URL e endpoint
   * @param {string} baseUrl - URL base do sistema
   * @param {string} endpoint - Endpoint da API
   * @returns {string} URL completa
   * @throws {Error} Se a URL não estiver em domínio autorizado
   */
  buildUrl: (baseUrl, endpoint) => {
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const fullUrl = `${cleanBaseUrl}${endpoint}`;
    
    // ✅ SEGURANÇA: Validar domínio antes de retornar URL
    if (!SECURITY_CONFIG.validateURL(fullUrl)) {
      throw new Error(`URL não autorizada para requisições: ${fullUrl}`);
    }
    
    return fullUrl;
  },

  /**
   * Constrói parâmetros de consulta para regulações
   * @param {object} params - Parâmetros específicos
   * @returns {URLSearchParams} Parâmetros formatados
   */
  buildRegulationParams: (params) => {
    const searchParams = new URLSearchParams();
    
    // Adiciona filtros base
    REGULATION_FILTERS.BASE.forEach((filter, index) => {
      const key = `filters[${index}]`;
      if (filter.includes(":")) {
        searchParams.set(key, filter);
      } else {
        const value = params[filter] || "";
        searchParams.set(key, `${filter}:${value}`);
      }
    });

    // Adiciona parâmetros comuns
    Object.entries(API_PARAMS.COMMON).forEach(([key, value]) => {
      searchParams.set(key, typeof value === "function" ? value() : value);
    });

    // Adiciona parâmetros específicos de regulação
    Object.entries(API_PARAMS.REGULATIONS).forEach(([key, value]) => {
      searchParams.set(key, value);
    });

    // Adiciona parâmetros customizados
    Object.entries(params).forEach(([key, value]) => {
      if (!REGULATION_FILTERS.BASE.includes(key)) {
        searchParams.set(key, value);
      }
    });

    return searchParams;
  },

  /**
   * Constrói parâmetros para busca no CADSUS
   * @param {object} searchData - Dados de busca (cpf, cns, etc.)
   * @returns {URLSearchParams} Parâmetros formatados
   */
  buildCadsusParams: (searchData = {}) => {
    const params = new URLSearchParams();
    
    // Adiciona parâmetros base do CADSUS
    Object.entries(API_PARAMS.CADSUS).forEach(([key, value]) => {
      params.set(key, value);
    });

    // Adiciona parâmetros comuns
    Object.entries(API_PARAMS.COMMON).forEach(([key, value]) => {
      params.set(key, typeof value === "function" ? value() : value);
    });

    // Sobrescreve com dados de busca específicos
    if (searchData.cpf) {
      const formattedCpf = String(searchData.cpf)
        .replace(/\D/g, "")
        .replace(DATA_FORMATS.CPF.PATTERN, DATA_FORMATS.CPF.FORMAT);
      params.set("pdq.cpf", formattedCpf);
    }

    if (searchData.cns) {
      params.set("pdq.cartaoNacionalSus", searchData.cns);
    }

    return params;
  },

  /**
   * Constrói string de parâmetros para prontuário
   * @param {object} params - Parâmetros do prontuário
   * @returns {string} String de parâmetros codificada
   */
  buildProntuarioParamString: (params) => {
    const allParams = { ...PRONTUARIO_PARAMS.FIXED, ...params };
    const paramString = Object.entries(allParams)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return encodeURIComponent(paramString);
  },
};

// Configuração de segurança para validação de domínios
export const SECURITY_CONFIG = {
  ALLOWED_DOMAINS: [
    'gov.br',
    'mv.com.br',
    'cloudmv.com.br',
    'localhost',
    '127.0.0.1'
  ],
  
  /**
   * Valida se uma URL está em domínio autorizado
   * @param {string} url - URL a ser validada
   * @returns {boolean} True se autorizada
   */
  validateURL: (url) => {
    try {
      const urlObj = new URL(url);
      return SECURITY_CONFIG.ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }
};

// Validações específicas da API
export const API_VALIDATIONS = {
  /**
   * Valida se um ID de paciente está no formato correto
   * @param {string} isenPK - ID do paciente no formato "idp-ids"
   * @returns {boolean} True se válido
   */
  isValidPatientId: (isenPK) => {
    if (!isenPK || typeof isenPK !== "string") return false;
    const parts = isenPK.split("-");
    return parts.length === 2 && parts[0] && parts[1];
  },

  /**
   * Valida se IDs de regulação estão presentes
   * @param {string} reguIdp - IDP da regulação
   * @param {string} reguIds - IDS da regulação
   * @returns {boolean} True se válidos
   */
  isValidRegulationId: (reguIdp, reguIds) => {
    return !!(reguIdp && reguIds);
  },

  /**
   * Valida se uma resposta é JSON válida
   * @param {Response} response - Resposta do fetch
   * @returns {boolean} True se for JSON
   */
  isJsonResponse: (response) => {
    const contentType = response.headers.get("content-type");
    return contentType && contentType.includes("application/json");
  },
};