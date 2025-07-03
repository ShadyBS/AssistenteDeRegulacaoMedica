import * as API from "./api.js";
import { defaultFieldConfig } from "./field-config.js";
import { SectionManager } from "./SectionManager.js";
import * as Renderers from "./renderers.js";
import * as Utils from "./utils.js";
import * as Search from "./ui/search.js";
import * as PatientCard from "./ui/patient-card.js";
import { store } from "./store.js";

// --- LÓGICA DE FILTRAGEM ESPECÍFICA POR SECÇÃO ---

/**
 * Aplica os filtros para a secção de Consultas.
 * @param {Array<object>} data - Os dados brutos.
 * @param {object} filters - Os valores dos filtros atuais.
 * @returns {Array<object>} Os dados filtrados.
 */
const consultationFilterLogic = (data, filters) => {
  let filteredData = [...data];

  const keyword = (filters["consultation-filter-keyword"] || "")
    .toLowerCase()
    .trim();
  const hideNoShows = filters["hide-no-show-checkbox"];
  const cid = (filters["consultation-filter-cid"] || "").toLowerCase().trim();
  const specialty = (filters["consultation-filter-specialty"] || "")
    .toLowerCase()
    .trim();
  const professional = (filters["consultation-filter-professional"] || "")
    .toLowerCase()
    .trim();
  const unit = (filters["consultation-filter-unit"] || "").toLowerCase().trim();

  if (hideNoShows) {
    filteredData = filteredData.filter((c) => !c.isNoShow);
  }

  const applyTextFilter = (items, text, getFieldContent) => {
    const searchTerms = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (searchTerms.length === 0) return items;
    return items.filter((item) => {
      const content = getFieldContent(item).toLowerCase();
      return searchTerms.some((term) => content.includes(term));
    });
  };

  filteredData = applyTextFilter(filteredData, keyword, (c) =>
    [
      c.specialty,
      c.professional,
      c.unit,
      ...c.details.map((d) => `${d.label} ${d.value}`),
    ].join(" ")
  );
  filteredData = applyTextFilter(filteredData, cid, (c) =>
    c.details.map((d) => d.value).join(" ")
  );
  filteredData = applyTextFilter(
    filteredData,
    specialty,
    (c) => c.specialty || ""
  );
  filteredData = applyTextFilter(
    filteredData,
    professional,
    (c) => c.professional || ""
  );
  filteredData = applyTextFilter(filteredData, unit, (c) => c.unit || "");

  return filteredData;
};

/**
 * Aplica os filtros para a secção de Exames.
 * @param {Array<object>} data - Os dados brutos.
 * @param {object} filters - Os valores dos filtros atuais.
 * @returns {Array<object>} Os dados filtrados.
 */
const examFilterLogic = (data, filters) => {
  let filteredData = [...data];
  const name = (filters["exam-filter-name"] || "").toLowerCase().trim();
  const professional = (filters["exam-filter-professional"] || "")
    .toLowerCase()
    .trim();
  const specialty = (filters["exam-filter-specialty"] || "")
    .toLowerCase()
    .trim();

  const applyTextFilter = (items, text, field) => {
    const searchTerms = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (searchTerms.length === 0) return items;
    return items.filter((item) => {
      const content = (item[field] || "").toLowerCase();
      return searchTerms.some((term) => content.includes(term));
    });
  };

  filteredData = applyTextFilter(filteredData, name, "examName");
  filteredData = applyTextFilter(filteredData, professional, "professional");
  filteredData = applyTextFilter(filteredData, specialty, "specialty");

  return filteredData;
};

/**
 * Aplica os filtros para a secção de Agendamentos.
 * @param {Array<object>} data - Os dados brutos.
 * @param {object} filters - Os valores dos filtros atuais.
 * @param {string} fetchType - O tipo de busca ('all', 'consultas', 'exames').
 * @returns {Array<object>} Os dados filtrados.
 */
const appointmentFilterLogic = (data, filters, fetchType) => {
  let filteredData = [...data];
  const status = filters["appointment-filter-status"] || "todos";
  const term = (filters["appointment-filter-term"] || "").toLowerCase().trim();
  const location = (filters["appointment-filter-location"] || "")
    .toLowerCase()
    .trim();

  if (status !== "todos") {
    filteredData = filteredData.filter(
      (a) => (a.status || "").toUpperCase() === status.toUpperCase()
    );
  }
  if (fetchType === "consultas") {
    filteredData = filteredData.filter(
      (a) => !a.type.toUpperCase().includes("EXAME")
    );
  } else if (fetchType === "exames") {
    filteredData = filteredData.filter((a) =>
      a.type.toUpperCase().includes("EXAME")
    );
  }
  if (term) {
    const searchTerms = term
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    filteredData = filteredData.filter((a) => {
      const fullText = [a.professional, a.specialty, a.description]
        .join(" ")
        .toLowerCase();
      return searchTerms.some((t) => fullText.includes(t));
    });
  }
  if (location) {
    const searchTerms = location
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    filteredData = filteredData.filter((a) =>
      searchTerms.some((t) => (a.location || "").toLowerCase().includes(t))
    );
  }
  return filteredData;
};

/**
 * Aplica os filtros para a secção de Regulação.
 * @param {Array<object>} data - Os dados brutos.
 * @param {object} filters - Os valores dos filtros atuais.
 * @returns {Array<object>} Os dados filtrados.
 */
const regulationFilterLogic = (data, filters) => {
  let filteredData = [...data];
  const status = filters["regulation-filter-status"] || "todos";
  const priority = filters["regulation-filter-priority"] || "todas";
  const procedureTerms = (filters["regulation-filter-procedure"] || "")
    .toLowerCase()
    .trim();
  const requesterTerms = (filters["regulation-filter-requester"] || "")
    .toLowerCase()
    .trim();

  if (status !== "todos") {
    filteredData = filteredData.filter(
      (item) => (item.status || "").toUpperCase() === status.toUpperCase()
    );
  }
  if (priority !== "todas") {
    filteredData = filteredData.filter(
      (item) =>
        (item.priority || "").toUpperCase().replace(" ", "") ===
        priority.toUpperCase()
    );
  }
  if (procedureTerms) {
    const searchTerms = procedureTerms
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    filteredData = filteredData.filter((item) =>
      searchTerms.some((t) => (item.procedure || "").toLowerCase().includes(t))
    );
  }
  if (requesterTerms) {
    const searchTerms = requesterTerms
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    filteredData = filteredData.filter((item) =>
      searchTerms.some((t) => (item.requester || "").toLowerCase().includes(t))
    );
  }
  return filteredData;
};

// --- CONFIGURAÇÃO DAS SECÇÕES ---
const sectionConfigurations = {
  consultations: {
    fetchFunction: API.fetchAllConsultations,
    renderFunction: Renderers.renderConsultations,
    initialSortState: { key: "sortableDate", order: "desc" },
    filterLogic: consultationFilterLogic,
  },
  exams: {
    fetchFunction: API.fetchExamesSolicitados,
    renderFunction: Renderers.renderExams,
    initialSortState: { key: "date", order: "desc" },
    filterLogic: examFilterLogic,
  },
  appointments: {
    fetchFunction: API.fetchAppointments,
    renderFunction: Renderers.renderAppointments,
    initialSortState: { key: "date", order: "desc" },
    filterLogic: appointmentFilterLogic,
  },
  regulations: {
    fetchFunction: API.fetchAllRegulations,
    renderFunction: Renderers.renderRegulations,
    initialSortState: { key: "date", order: "desc" },
    filterLogic: regulationFilterLogic,
  },
};

// --- INICIALIZAÇÃO ---

/**
 * Função principal que inicializa a aplicação.
 */
async function init() {
  await loadConfigAndData();
  Search.init();
  PatientCard.init(window.fieldConfigLayout);
  initializeSections();
  applyUserPreferences();
  addGlobalEventListeners();
}

/**
 * Carrega todas as configurações e dados do storage.
 */
async function loadConfigAndData() {
  const syncData = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    hideNoShowDefault: false,
    monthsBack: 6,
  });

  window.fieldConfigLayout = defaultFieldConfig.map((defaultField) => {
    const savedField = syncData.patientFields.find(
      (f) => f.id === defaultField.id
    );
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });

  window.filterLayout = syncData.filterLayout;

  window.userPreferences = {
    autoLoadExams: syncData.autoLoadExams,
    autoLoadConsultations: syncData.autoLoadConsultations,
    autoLoadAppointments: syncData.autoLoadAppointments,
    autoLoadRegulations: syncData.autoLoadRegulations,
    hideNoShowDefault: syncData.hideNoShowDefault,
    monthsBack: syncData.monthsBack,
  };

  const localData = await browser.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
  });
  window.recentPatients = localData.recentPatients;
  window.savedFilterSets = localData.savedFilterSets;
}

/**
 * Cria uma instância de SectionManager para cada secção configurada.
 */
function initializeSections() {
  window.allSectionManagers = {};
  Object.keys(sectionConfigurations).forEach((key) => {
    const manager = new SectionManager(key, sectionConfigurations[key]);
    window.allSectionManagers[key] = manager;
  });
}

/**
 * Aplica as preferências de data e filtros padrão guardadas pelo utilizador.
 */
function applyUserPreferences() {
  const { hideNoShowDefault, monthsBack } = window.userPreferences;
  const hideCheckbox = document.getElementById("hide-no-show-checkbox");
  if (hideCheckbox) hideCheckbox.checked = hideNoShowDefault;

  const months = monthsBack || 6;
  const now = new Date();
  const initial = new Date();
  initial.setMonth(now.getMonth() - months);

  [
    "date-initial",
    "exam-date-initial",
    "appointment-date-initial",
    "regulation-date-initial",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.valueAsDate = initial;
  });
  [
    "date-final",
    "exam-date-final",
    "appointment-date-final",
    "regulation-date-final",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.valueAsDate = now;
  });
}

// --- MANIPULADORES DE EVENTOS GLOBAIS ---

/**
 * Adiciona event listeners que não pertencem a uma secção específica.
 */
function addGlobalEventListeners() {
  const mainContent = document.getElementById("main-content");
  const infoModal = document.getElementById("info-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  modalCloseBtn.addEventListener("click", () =>
    infoModal.classList.add("hidden")
  );
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.classList.add("hidden");
  });
  mainContent.addEventListener("click", handleGlobalActions);

  // Subscreve à mudança de paciente para atualizar a lista de recentes
  store.subscribe(async () => {
    const patient = store.getPatient();
    if (patient) {
      await updateRecentPatients(patient);
    }
  });
}

/**
 * Lida com cliques em ações globais como copiar texto ou abrir detalhes de itens.
 * @param {Event} event O evento de clique.
 */
async function handleGlobalActions(event) {
  const target = event.target;
  const copyBtn = target.closest(".copy-icon");
  if (copyBtn) {
    await copyToClipboard(copyBtn);
    return;
  }

  const examResultBtn = target.closest(".view-exam-result-btn");
  if (examResultBtn) await handleViewExamResult(examResultBtn);

  const appointmentDetailsBtn = target.closest(".view-appointment-details-btn");
  if (appointmentDetailsBtn)
    await handleViewAppointmentDetails(appointmentDetailsBtn);

  const regulationDetailsBtn = target.closest(".view-regulation-details-btn");
  if (regulationDetailsBtn)
    await handleViewRegulationDetails(regulationDetailsBtn);

  const appointmentInfoBtn = target.closest(".appointment-info-btn");
  if (appointmentInfoBtn) handleShowAppointmentInfo(appointmentInfoBtn);
}

async function copyToClipboard(button) {
  const textToCopy = button.dataset.copyText;
  if (!textToCopy) return;
  try {
    await navigator.clipboard.writeText(textToCopy);
    button.textContent = "✅";
  } catch (err) {
    console.error("Falha ao copiar texto: ", err);
    button.textContent = "❌";
  } finally {
    setTimeout(() => {
      button.textContent = "📄";
    }, 1000);
  }
}

// --- LÓGICA DE GESTÃO DE PACIENTE ---

async function updateRecentPatients(patientData) {
  const newRecent = {
    idp: patientData.isenPK.idp,
    ids: patientData.isenPK.ids,
    value: Utils.getNestedValue(
      patientData,
      "entidadeFisica.entidade.entiNome"
    ),
    cns: patientData.isenNumCadSus,
    dataNascimento: Utils.getNestedValue(
      patientData,
      "entidadeFisica.entfDtNasc"
    ),
    cpf: Utils.getNestedValue(patientData, "entidadeFisica.entfCPF"),
  };
  const filtered = (window.recentPatients || []).filter(
    (p) => p.idp !== newRecent.idp || p.ids !== newRecent.ids
  );
  window.recentPatients = [newRecent, ...filtered].slice(0, 5);
  await browser.storage.local.set({ recentPatients: window.recentPatients });
}

// --- HANDLERS PARA AÇÕES ESPECÍFICAS DE ITENS ---

async function handleViewExamResult(button) {
  const { idp, ids } = button.dataset;
  const newTab = window.open("", "_blank");
  newTab.document.write("Carregando resultado do exame...");
  try {
    const filePath = await API.fetchResultadoExame({ idp, ids });
    const baseUrl = await API.getBaseUrl();
    if (filePath) {
      const fullUrl = filePath.startsWith("http")
        ? filePath
        : `${baseUrl}${filePath}`;
      newTab.location.href = fullUrl;
    } else {
      newTab.document.body.innerHTML = "<p>Resultado não encontrado.</p>";
    }
  } catch (error) {
    newTab.document.body.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
}

async function handleViewAppointmentDetails(button) {
  const { idp, ids, type } = button.dataset;
  try {
    const baseUrl = await API.getBaseUrl();
    const url = type.toUpperCase().includes("EXAME")
      ? `${baseUrl}/sigss/agendamentoExame.jsp?id=${idp}`
      : `${baseUrl}/sigss/consultaRapida.jsp?agcoPK.idp=${idp}&agcoPK.ids=${ids}`;
    window.open(url, "_blank");
  } catch (error) {
    Utils.showMessage("Não foi possível construir a URL.");
  }
}

async function handleViewRegulationDetails(button) {
  const { idp, ids } = button.dataset;
  try {
    const baseUrl = await API.getBaseUrl();
    window.open(
      `${baseUrl}/sigss/regulacaoRegulador/visualiza?reguPK.idp=${idp}&reguPK.ids=${ids}`,
      "_blank"
    );
  } catch (error) {
    Utils.showMessage("Não foi possível construir a URL.");
  }
}

function handleShowAppointmentInfo(button) {
  const data = JSON.parse(button.dataset.appointment);
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const infoModal = document.getElementById("info-modal");

  modalTitle.textContent = "Detalhes do Agendamento";
  modalContent.innerHTML = `
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Tipo:</strong> ${
          data.isSpecialized
            ? "Especializada"
            : data.isOdonto
            ? "Odontológica"
            : data.type
        }</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Data:</strong> ${data.date} às ${data.time}</p>
        <p><strong>Local:</strong> ${data.location}</p>
        <p><strong>Profissional:</strong> ${data.professional}</p>
        <p><strong>Especialidade:</strong> ${data.specialty || "N/A"}</p>
        <p><strong>Procedimento:</strong> ${data.description}</p>
    `;
  infoModal.classList.remove("hidden");
}

// --- INICIA A APLICAÇÃO ---
document.addEventListener("DOMContentLoaded", init);
