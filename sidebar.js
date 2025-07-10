import * as API from "./api.js";
import { defaultFieldConfig } from "./field-config.js";
import { filterConfig } from "./filter-config.js";
import { SectionManager } from "./SectionManager.js";
import * as Renderers from "./renderers.js";
import * as Utils from "./utils.js";
import * as Search from "./ui/search.js";
import * as PatientCard from "./ui/patient-card.js";
import { store } from "./store.js";

let currentRegulationData = null;
let sectionManagers = {}; // Objeto para armazenar instâncias de SectionManager

// --- LÓGICA DE FILTRAGEM ---
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
      (item) => (item.priority || "").toUpperCase() === priority.toUpperCase()
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

const documentFilterLogic = (data, filters) => {
  let filteredData = [...data];
  const keyword = (filters["document-filter-keyword"] || "")
    .toLowerCase()
    .trim();

  // Filtro por data (client-side)
  const startDateValue = document.getElementById(
    "document-date-initial"
  )?.value;
  const endDateValue = document.getElementById("document-date-final")?.value;

  if (startDateValue) {
    const start = Utils.parseDate(startDateValue);
    if (start) {
      filteredData = filteredData.filter((doc) => {
        const docDate = Utils.parseDate(doc.date.split(" ")[0]);
        return docDate && docDate >= start;
      });
    }
  }

  if (endDateValue) {
    const end = Utils.parseDate(endDateValue);
    if (end) {
      filteredData = filteredData.filter((doc) => {
        const docDate = Utils.parseDate(doc.date.split(" ")[0]);
        return docDate && docDate <= end;
      });
    }
  }

  // Filtro por palavra-chave
  if (keyword) {
    filteredData = filteredData.filter((doc) =>
      (doc.description || "").toLowerCase().includes(keyword)
    );
  }

  return filteredData;
};

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
  documents: {
    fetchFunction: API.fetchDocuments,
    renderFunction: Renderers.renderDocuments,
    initialSortState: { key: "date", order: "desc" },
    filterLogic: documentFilterLogic,
  },
};

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
    const cadsus = await API.fetchCadsusData({
      cpf: Utils.getNestedValue(ficha, "entidadeFisica.entfCPF"),
      cns: ficha.isenNumCadSus,
    });
    Object.values(sectionManagers).forEach((manager) =>
      manager.clearAutomationFeedbackAndFilters(false)
    );
    store.setPatient(ficha, cadsus);
    await updateRecentPatients(store.getPatient());
  } catch (error) {
    Utils.showMessage(error.message, "error");
    console.error(error);
    store.clearPatient();
  } finally {
    Utils.toggleLoader(false);
  }
}

async function init() {
  try {
    await API.getBaseUrl();
  } catch (error) {
    if (error && error.message === "URL_BASE_NOT_CONFIGURED") {
      const mainContent = document.getElementById("main-content");
      const urlWarning = document.getElementById("url-config-warning");

      if (mainContent) mainContent.classList.add("hidden");
      if (urlWarning) urlWarning.classList.remove("hidden");

      const openOptionsBtn = document.getElementById(
        "open-options-from-warning"
      );
      const reloadSidebarBtn = document.getElementById(
        "reload-sidebar-from-warning"
      );

      if (openOptionsBtn) {
        openOptionsBtn.addEventListener("click", () => {
          browser.runtime.openOptionsPage();
        });
      }

      if (reloadSidebarBtn) {
        reloadSidebarBtn.addEventListener("click", () => {
          window.location.reload();
        });
      }
      return;
    } else {
      console.error("Initialization failed:", error);
      Utils.showMessage(
        "Ocorreu um erro inesperado ao iniciar a extensão.",
        "error"
      );
    }
  }

  const [globalSettings, regulationPriorities] = await Promise.all([
    loadConfigAndData(),
    API.fetchRegulationPriorities(),
  ]);

  globalSettings.regulationPriorities = regulationPriorities;

  applySectionOrder(globalSettings.sidebarSectionOrder);

  Search.init({ onSelectPatient: selectPatient });
  PatientCard.init(globalSettings.fieldConfigLayout, {
    onForceRefresh: selectPatient,
  });
  initializeSections(globalSettings);
  applyUserPreferences(globalSettings);
  addGlobalEventListeners();
  setupAutoModeToggle();

  await checkForPendingRegulation();
}

async function loadConfigAndData() {
  const syncData = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    autoLoadDocuments: false,
    enableAutomaticDetection: true,
    dateRangeDefaults: {},
    sidebarSectionOrder: [],
  });
  const localData = await browser.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
    automationRules: [],
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
      autoLoadDocuments: syncData.autoLoadDocuments,
      enableAutomaticDetection: syncData.enableAutomaticDetection,
      dateRangeDefaults: syncData.dateRangeDefaults,
    },
    sidebarSectionOrder: syncData.sidebarSectionOrder,
  };
}

function applySectionOrder(order) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  const sectionMap = {
    "patient-card": "patient-details-section",
    regulations: "regulations-section",
    consultations: "consultations-section",
    exams: "exams-section",
    appointments: "appointments-section",
    documents: "documents-section",
  };

  const allKnownOrderableIds = Object.keys(sectionMap);

  const allOrderableSectionsInDOM = Array.from(
    mainContent.querySelectorAll("section")
  ).filter((s) => Object.values(sectionMap).includes(s.id));

  const domTabOrder = allOrderableSectionsInDOM
    .map((section) => {
      return Object.keys(sectionMap).find(
        (key) => sectionMap[key] === section.id
      );
    })
    .filter(Boolean);

  let finalOrder = [];
  if (order && Array.isArray(order) && order.length > 0) {
    const validSavedOrder = order.filter((id) =>
      allKnownOrderableIds.includes(id)
    );
    finalOrder = [...validSavedOrder];
  } else {
    finalOrder = [...domTabOrder];
  }

  const currentSectionsInOrder = new Set(finalOrder);
  const newSections = domTabOrder.filter(
    (id) => !currentSectionsInOrder.has(id)
  );

  finalOrder.push(...newSections);

  finalOrder.forEach((tabId) => {
    const sectionId = sectionMap[tabId];
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      mainContent.appendChild(sectionElement);
    }
  });
}

function initializeSections(globalSettings) {
  Object.keys(sectionConfigurations).forEach((key) => {
    sectionManagers[key] = new SectionManager(
      key,
      sectionConfigurations[key],
      globalSettings
    );
  });
}

function applyUserPreferences(globalSettings) {
  const { userPreferences, filterLayout } = globalSettings;
  const { dateRangeDefaults } = userPreferences;

  const sections = [
    "consultations",
    "exams",
    "appointments",
    "regulations",
    "documents",
  ];
  const defaultSystemRanges = {
    consultations: { start: -6, end: 0 },
    exams: { start: -6, end: 0 },
    appointments: { start: -1, end: 3 },
    regulations: { start: -12, end: 0 },
    documents: { start: -24, end: 0 },
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

function setupAutoModeToggle() {
  const toggle = document.getElementById("auto-mode-toggle");
  const label = document.getElementById("auto-mode-label");

  browser.storage.sync
    .get({ enableAutomaticDetection: true })
    .then((settings) => {
      toggle.checked = settings.enableAutomaticDetection;
      label.textContent = settings.enableAutomaticDetection ? "Auto" : "Manual";
    });

  toggle.addEventListener("change", (event) => {
    const isEnabled = event.target.checked;
    browser.storage.sync.set({ enableAutomaticDetection: isEnabled });
    label.textContent = isEnabled ? "Auto" : "Manual";
  });
}

async function handleRegulationLoaded(regulationData) {
  Utils.toggleLoader(true);
  try {
    currentRegulationData = regulationData;

    if (
      regulationData &&
      regulationData.isenPKIdp &&
      regulationData.isenPKIds
    ) {
      const patientInfo = {
        idp: regulationData.isenPKIdp,
        ids: regulationData.isenPKIds,
      };
      await selectPatient(patientInfo);

      const contextName =
        regulationData.apcnNome || regulationData.prciNome || "Contexto";
      const infoBtn = document.getElementById("context-info-btn");
      infoBtn.title = `Contexto: ${contextName.trim()}`;
      infoBtn.classList.remove("hidden");

      await applyAutomationRules(regulationData);
    } else {
      currentRegulationData = null;
      Utils.showMessage(
        "Não foi possível extrair os dados do paciente da regulação.",
        "error"
      );
    }
  } catch (error) {
    currentRegulationData = null;
    Utils.showMessage(
      `Erro ao processar a regulação: ${error.message}`,
      "error"
    );
    console.error("Erro ao processar a regulação:", error);
  } finally {
    Utils.toggleLoader(false);
  }
}

async function applyAutomationRules(regulationData) {
  const { automationRules } = await browser.storage.local.get({
    automationRules: [],
  });
  if (!automationRules || automationRules.length === 0) return;

  const contextString = [
    regulationData.prciNome || "",
    regulationData.prciCodigo || "",
    regulationData.apcnNome || "",
    regulationData.apcnCod || "",
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of automationRules) {
    if (rule.isActive) {
      const hasMatch = rule.triggerKeywords.some((keyword) =>
        contextString.includes(keyword.toLowerCase().trim())
      );

      if (hasMatch) {
        Object.entries(rule.filterSettings).forEach(([sectionKey, filters]) => {
          if (
            sectionManagers[sectionKey] &&
            typeof sectionManagers[sectionKey].applyAutomationFilters ===
              "function"
          ) {
            sectionManagers[sectionKey].applyAutomationFilters(
              filters,
              rule.name
            );
          }
        });
        return;
      }
    }
  }
}

function handleShowRegulationInfo() {
  if (!currentRegulationData) {
    Utils.showMessage("Nenhuma informação de regulação carregada.", "info");
    return;
  }
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const infoModal = document.getElementById("info-modal");

  modalTitle.textContent = "Dados da Regulação (JSON)";
  const formattedJson = JSON.stringify(currentRegulationData, null, 2);

  modalContent.innerHTML = `<pre class="bg-slate-100 p-2 rounded-md text-xs whitespace-pre-wrap break-all">${formattedJson}</pre>`;

  infoModal.classList.remove("hidden");
}

function addGlobalEventListeners() {
  const mainContent = document.getElementById("main-content");
  const infoModal = document.getElementById("info-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const infoBtn = document.getElementById("context-info-btn");
  const reloadBtn = document.getElementById("reload-sidebar-btn");

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      const patient = store.getPatient();
      if (patient && patient.ficha) {
        const confirmation = window.confirm(
          "Um paciente está selecionado e o estado atual será perdido. Deseja realmente recarregar o assistente?"
        );
        if (confirmation) {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    });
  }

  modalCloseBtn.addEventListener("click", () =>
    infoModal.classList.add("hidden")
  );
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.classList.add("hidden");
  });
  mainContent.addEventListener("click", handleGlobalActions);
  infoBtn.addEventListener("click", handleShowRegulationInfo);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.pendingRegulation) {
      const { newValue } = changes.pendingRegulation;
      if (newValue && newValue.isenPKIdp) {
        console.log(
          "[Assistente Sidebar] Nova regulação detectada via storage.onChanged:",
          newValue
        );
        handleRegulationLoaded(newValue);
        browser.storage.local.remove("pendingRegulation");
      }
    }
  });
}

async function handleGlobalActions(event) {
  const target = event.target;
  const copyBtn = target.closest(".copy-icon");
  if (copyBtn) {
    await copyToClipboard(copyBtn);
    return;
  }
  const examResultBtn = target.closest(".view-exam-result-btn");
  if (examResultBtn) {
    await handleViewExamResult(examResultBtn);
    return;
  }

  const appointmentDetailsBtn = target.closest(".view-appointment-details-btn");
  if (appointmentDetailsBtn) {
    await handleShowAppointmentDetailsModal(appointmentDetailsBtn);
    return;
  }
  const regulationDetailsBtn = target.closest(".view-regulation-details-btn");
  if (regulationDetailsBtn) {
    await handleShowRegulationDetailsModal(regulationDetailsBtn);
    return;
  }

  const appointmentInfoBtn = target.closest(".appointment-info-btn");
  if (appointmentInfoBtn) {
    handleShowAppointmentInfo(appointmentInfoBtn);
    return;
  }

  const documentBtn = target.closest(".view-document-btn");
  if (documentBtn) {
    await handleViewDocument(documentBtn);
    return;
  }

  const regulationAttachmentBtn = target.closest(
    ".view-regulation-attachment-btn"
  );
  if (regulationAttachmentBtn) {
    await handleViewRegulationAttachment(regulationAttachmentBtn);
    return;
  }
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
  if (!patientData || !patientData.ficha) return;
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

async function handleViewDocument(button) {
  const { idp, ids } = button.dataset;
  const newTab = window.open("", "_blank");
  newTab.document.write("Carregando documento...");

  try {
    const docUrl = await API.fetchDocumentUrl({ idp, ids });
    if (docUrl) {
      newTab.location.href = docUrl;
    } else {
      newTab.document.body.innerHTML =
        "<p>URL do documento não encontrada.</p>";
    }
  } catch (error) {
    newTab.document.body.innerHTML = `<p>Erro ao carregar documento: ${error.message}</p>`;
    console.error("Falha ao visualizar documento:", error);
  }
}

async function handleViewRegulationAttachment(button) {
  const { idp, ids } = button.dataset;
  const newTab = window.open("", "_blank");
  newTab.document.write("Carregando anexo da regulação...");

  try {
    const fileUrl = await API.fetchRegulationAttachmentUrl({ idp, ids });
    if (fileUrl) {
      newTab.location.href = fileUrl;
    } else {
      newTab.document.body.innerHTML = "<p>URL do anexo não encontrada.</p>";
    }
  } catch (error) {
    newTab.document.body.innerHTML = `<p>Erro ao carregar anexo: ${error.message}</p>`;
    console.error("Falha ao visualizar anexo da regulação:", error);
  }
}

function showModal(title, content) {
  const modal = document.getElementById("info-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");

  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modal.classList.remove("hidden");
}

function createDetailRow(label, value) {
  if (!value || String(value).trim() === "") return "";
  return `<div class="py-2 border-b border-slate-100 flex justify-between items-start gap-4">
            <span class="font-semibold text-slate-600 flex-shrink-0">${label}:</span>
            <span class="text-slate-800 text-right break-words">${value}</span>
          </div>`;
}

function formatRegulationDetailsForModal(data) {
  if (!data) return "<p>Dados da regulação não encontrados.</p>";
  let content = "";
  content += createDetailRow("Status", data.reguStatus);
  content += createDetailRow(
    "Tipo",
    data.reguTipo === "ENC" ? "Consulta" : "Exame"
  );
  content += createDetailRow("Data Solicitação", data.reguDataStr);
  content += createDetailRow("Procedimento", data.prciNome);
  content += createDetailRow("CID", `${data.tcidCod} - ${data.tcidDescricao}`);
  content += createDetailRow("Profissional Sol.", data.prsaEntiNome);
  content += createDetailRow("Unidade Sol.", data.limoSolicitanteNome);
  content += createDetailRow("Unidade Desejada", data.limoDesejadaNome);
  content += createDetailRow("Gravidade", data.reguGravidade);
  if (data.reguJustificativa && data.reguJustificativa !== "null") {
    content += `<div class="py-2">
                      <span class="font-semibold text-slate-600">Justificativa:</span>
                      <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.reguJustificativa.replace(
                        /\\n/g,
                        "\n"
                      )}</p>
                  </div>`;
  }
  return content;
}

function formatAppointmentDetailsForModal(data) {
  if (!data) return "<p>Dados do agendamento não encontrados.</p>";

  let status = "Agendado";
  if (data.agcoIsCancelado === "t") status = "Cancelado";
  else if (data.agcoIsFaltante === "t") status = "Faltou";
  else if (data.agcoIsAtendido === "t") status = "Atendido";

  let content = "";
  content += createDetailRow("Status", status);
  content += createDetailRow(
    "Data",
    `${data.agcoData} às ${data.agcoHoraPrevista}`
  );
  content += createDetailRow(
    "Local",
    data.unidadeSaudeDestino?.entidade?.entiNome
  );
  content += createDetailRow(
    "Profissional",
    data.profissionalDestino?.entidadeFisica?.entidade?.entiNome
  );
  content += createDetailRow(
    "Especialidade",
    data.atividadeProfissionalCnes?.apcnNome
  );
  content += createDetailRow("Procedimento", data.procedimento?.prciNome);
  content += createDetailRow("Convênio", data.convenio?.entidade?.entiNome);
  if (data.agcoObs) {
    content += `<div class="py-2">
                        <span class="font-semibold text-slate-600">Observação:</span>
                        <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.agcoObs}</p>
                    </div>`;
  }
  return content;
}

function formatExamAppointmentDetailsForModal(data) {
  if (!data) return "<p>Dados do agendamento de exame não encontrados.</p>";

  let content = "";
  content += createDetailRow("Data Agendamento", data.examDataCad);
  content += createDetailRow(
    "Unidade Origem",
    data.ligacaoModularOrigem?.limoNome
  );
  content += createDetailRow(
    "Unidade Destino",
    data.ligacaoModularDestino?.limoNome
  );
  content += createDetailRow(
    "Profissional Sol.",
    data.profissional?.entidadeFisica?.entidade?.entiNome
  );
  content += createDetailRow("Caráter", data.CaraterAtendimento?.caraDescri);
  content += createDetailRow("Critério", data.criterioExame?.critNome);

  return content;
}

async function handleShowRegulationDetailsModal(button) {
  const { idp, ids } = button.dataset;
  showModal("Detalhes da Regulação", "<p>Carregando...</p>");
  try {
    const data = await API.fetchRegulationDetails({
      reguIdp: idp,
      reguIds: ids,
    });
    const content = formatRegulationDetailsForModal(data);
    showModal("Detalhes da Regulação", content);
  } catch (error) {
    showModal(
      "Erro",
      `<p>Não foi possível carregar os detalhes: ${error.message}</p>`
    );
  }
}

async function handleShowAppointmentDetailsModal(button) {
  const { idp, ids, type } = button.dataset;
  const isExam = type.toUpperCase().includes("EXAME");
  const title = isExam
    ? "Detalhes do Agendamento de Exame"
    : "Detalhes da Consulta Agendada";

  showModal(title, "<p>Carregando...</p>");

  try {
    let data;
    let content;
    if (isExam) {
      data = await API.fetchExamAppointmentDetails({ idp, ids });
      content = formatExamAppointmentDetailsForModal(data);
    } else {
      data = await API.fetchAppointmentDetails({ idp, ids });
      content = formatAppointmentDetailsForModal(data);
    }
    showModal(title, content);
  } catch (error) {
    showModal(
      "Erro",
      `<p>Não foi possível carregar os detalhes: ${error.message}</p>`
    );
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

async function checkForPendingRegulation() {
  try {
    const { pendingRegulation } = await browser.storage.local.get(
      "pendingRegulation"
    );
    if (pendingRegulation && pendingRegulation.isenPKIdp) {
      await handleRegulationLoaded(pendingRegulation);
      await browser.storage.local.remove("pendingRegulation");
    }
  } catch (e) {
    console.error("Erro ao verificar regulação pendente:", e);
  }
}

document.addEventListener("DOMContentLoaded", init);
