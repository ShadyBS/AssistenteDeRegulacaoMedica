import * as API from "./api.js";
import { defaultFieldConfig } from "./field-config.js";
import { filterConfig } from "./filter-config.js";
import { SectionManager } from "./SectionManager.js";
import * as Renderers from "./renderers.js";
import * as Utils from "./utils.js";
import * as Search from "./ui/search.js";
import * as PatientCard from "./ui/patient-card.js";
import { store } from "./store.js";

// --- LÓGICA DE FILTRAGEM (sem alterações) ---
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

// --- CONFIGURAÇÃO DAS SECÇÕES (sem alterações) ---
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

// --- LÓGICA DE SELEÇÃO E ATUALIZAÇÃO DE PACIENTE ---

async function selectPatient(patientInfo, forceRefresh = false) {
  const currentPatient = store.getPatient();
  if (
    currentPatient &&
    currentPatient.ficha.isenPK.idp === patientInfo.idp &&
    !forceRefresh
  ) {
    return;
  }
  Utils.toggleLoader(true);
  Utils.clearMessage();
  store.setPatientUpdating();
  try {
    const ficha = await API.fetchVisualizaUsuario(patientInfo);
    let cadsus = currentPatient?.cadsus;
    if (forceRefresh || !cadsus) {
      cadsus = await API.fetchCadsusData({
        cpf: Utils.getNestedValue(ficha, "entidadeFisica.entfCPF"),
        cns: ficha.isenNumCadSus,
      });
    }
    store.setPatient(ficha, cadsus);
  } catch (error) {
    Utils.showMessage("Erro ao carregar os dados do paciente.", "error");
    console.error(error);
    store.clearPatient();
  } finally {
    Utils.toggleLoader(false);
  }
}

// --- INICIALIZAÇÃO ---

async function init() {
  const globalSettings = await loadConfigAndData();
  Search.init({ onSelectPatient: selectPatient });
  PatientCard.init(globalSettings.fieldConfigLayout, {
    onForceRefresh: selectPatient,
  });
  initializeSections(globalSettings);
  applyUserPreferences(globalSettings);
  addGlobalEventListeners();
  setupAutoModeToggle(); // NOVO
}

async function loadConfigAndData() {
  const syncData = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    enableAutomaticDetection: true, // NOVO
    dateRangeDefaults: {},
  });
  const localData = await browser.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
  });
  store.setRecentPatients(localData.recentPatients);
  store.setSavedFilterSets(localData.savedFilterSets);

  return {
    fieldConfigLayout: defaultFieldConfig.map((defaultField) => {
      const savedField = syncData.patientFields.find(
        (f) => f.id === defaultField.id
      );
      return savedField ? { ...defaultField, ...savedField } : defaultField;
    }),
    filterLayout: syncData.filterLayout,
    userPreferences: {
      autoLoadExams: syncData.autoLoadExams,
      autoLoadConsultations: syncData.autoLoadConsultations,
      autoLoadAppointments: syncData.autoLoadAppointments,
      autoLoadRegulations: syncData.autoLoadRegulations,
      enableAutomaticDetection: syncData.enableAutomaticDetection, // NOVO
      dateRangeDefaults: syncData.dateRangeDefaults,
    },
    savedFilterSets: localData.savedFilterSets,
  };
}

function initializeSections(globalSettings) {
  const allSectionManagers = {};
  Object.keys(sectionConfigurations).forEach((key) => {
    allSectionManagers[key] = new SectionManager(
      key,
      sectionConfigurations[key],
      globalSettings
    );
  });
}

function applyUserPreferences(globalSettings) {
  const { userPreferences, filterLayout } = globalSettings;
  const { dateRangeDefaults } = userPreferences;

  const sections = ["consultations", "exams", "appointments", "regulations"];
  const defaultSystemRanges = {
    consultations: { start: -6, end: 0 },
    exams: { start: -6, end: 0 },
    appointments: { start: -1, end: 3 },
    regulations: { start: -12, end: 0 },
  };

  sections.forEach((section) => {
    const range = dateRangeDefaults[section] || defaultSystemRanges[section];
    const prefix = section.replace(/s$/, "");

    const initialEl = document.getElementById(`${prefix}-date-initial`);
    const finalEl = document.getElementById(`${prefix}-date-final`);

    if (initialEl)
      initialEl.valueAsDate = Utils.calculateRelativeDate(range.start);
    if (finalEl) finalEl.valueAsDate = Utils.calculateRelativeDate(range.end);
  });

  Object.values(filterLayout)
    .flat()
    .forEach((filterSetting) => {
      const el = document.getElementById(filterSetting.id);
      if (
        el &&
        filterSetting.defaultValue !== undefined &&
        filterSetting.defaultValue !== null
      ) {
        if (el.type === "checkbox") {
          el.checked = filterSetting.defaultValue;
        } else {
          el.value = filterSetting.defaultValue;
        }
      }
    });
}

// --- LÓGICA DE DETEÇÃO AUTOMÁTICA ---

function setupAutoModeToggle() {
  const toggle = document.getElementById("auto-mode-toggle");
  const label = document.getElementById("auto-mode-label");

  // Sincroniza o estado do toggle com o storage
  browser.storage.sync
    .get({ enableAutomaticDetection: true })
    .then((settings) => {
      toggle.checked = settings.enableAutomaticDetection;
      label.textContent = settings.enableAutomaticDetection ? "Auto" : "Manual";
    });

  // Ouve mudanças no toggle para atualizar o storage
  toggle.addEventListener("change", (event) => {
    const isEnabled = event.target.checked;
    browser.storage.sync.set({ enableAutomaticDetection: isEnabled });
    label.textContent = isEnabled ? "Auto" : "Manual";
  });
}

async function handleContextDetected(payload) {
  const { idp, ids, context } = payload;

  // Mostra o botão de informação de contexto e define o seu tooltip
  const infoBtn = document.getElementById("context-info-btn");
  if (context) {
    infoBtn.title = `Contexto detetado: ${context}`;
    infoBtn.classList.remove("hidden");
  } else {
    infoBtn.classList.add("hidden");
  }

  // Carrega o paciente automaticamente
  await selectPatient({ idp, ids });
}

// --- MANIPULADORES DE EVENTOS GLOBAIS ---

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
  store.subscribe(handlePatientChange);

  // NOVO: Listener para mensagens do content script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "CONTEXT_DETECTED") {
      handleContextDetected(message.payload);
    }
  });
}

async function handlePatientChange() {
  const patient = store.getPatient();
  if (patient && patient.ficha) {
    await updateRecentPatients(patient);
  } else {
    // Se o paciente for limpo, esconde o botão de contexto
    document.getElementById("context-info-btn").classList.add("hidden");
  }
}

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
  if (button.dataset.inProgress === "true") return;
  const textToCopy = button.dataset.copyText;
  if (!textToCopy) return;
  button.dataset.inProgress = "true";
  try {
    await navigator.clipboard.writeText(textToCopy);
    button.textContent = "✅";
  } catch (err) {
    console.error("Falha ao copiar texto: ", err);
    button.textContent = "❌";
  } finally {
    setTimeout(() => {
      button.textContent = "📄";
      button.dataset.inProgress = "false";
    }, 1200);
  }
}

async function updateRecentPatients(patientData) {
  const newRecent = { ...patientData };
  const currentRecents = store.getRecentPatients();
  const filtered = (currentRecents || []).filter(
    (p) => p.ficha.isenPK.idp !== newRecent.ficha.isenPK.idp
  );
  const updatedRecents = [newRecent, ...filtered].slice(0, 5);
  await browser.storage.local.set({ recentPatients: updatedRecents });
  store.setRecentPatients(updatedRecents);
}

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
    Utils.showMessage("Não foi possível construir a URL.", "error");
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
    Utils.showMessage("Não foi possível construir a URL.", "error");
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

document.addEventListener("DOMContentLoaded", init);
