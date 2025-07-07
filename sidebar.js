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
    // A 'priority' aqui é o 'coreNome' (ex: "URGENCIA").
    // O 'item.priority' é o texto que vem na lista de regulações (que também é o coreNome).
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
    // Verifica se a URL base está configurada. Lança um erro se não estiver.
    await API.getBaseUrl();
  } catch (error) {
    // Se a URL não estiver configurada, mostra o aviso e para a inicialização.
    if (error.message.includes("URL base não está configurada")) {
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
      return; // Para a execução aqui.
    } else {
      // Lida com outros erros inesperados durante a inicialização.
      console.error("Initialization failed:", error);
      Utils.showMessage(
        "Ocorreu um erro inesperado ao iniciar a extensão.",
        "error"
      );
    }
  }

  // Se a verificação da URL passar, continua com a inicialização normal.
  const [globalSettings, regulationPriorities] = await Promise.all([
    loadConfigAndData(),
    API.fetchRegulationPriorities(),
  ]);

  globalSettings.regulationPriorities = regulationPriorities;

  // Aplica a ordem das seções antes de inicializar os componentes
  applySectionOrder(globalSettings.sidebarSectionOrder);

  Search.init({ onSelectPatient: selectPatient });
  PatientCard.init(globalSettings.fieldConfigLayout, {
    onForceRefresh: selectPatient,
  });
  initializeSections(globalSettings);
  applyUserPreferences(globalSettings);
  addGlobalEventListeners();
  setupAutoModeToggle();
}

async function loadConfigAndData() {
  const syncData = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    enableAutomaticDetection: true,
    dateRangeDefaults: {},
    sidebarSectionOrder: [], // Carrega a ordem das seções
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
      enableAutomaticDetection: syncData.enableAutomaticDetection,
      dateRangeDefaults: syncData.dateRangeDefaults,
    },
    sidebarSectionOrder: syncData.sidebarSectionOrder,
  };
}

/**
 * Reordena as seções na barra lateral com base na preferência do usuário.
 * @param {string[]} order - Um array de IDs de abas (ex: ['regulations', 'consultations']).
 */
function applySectionOrder(order) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  // Mapeia os data-tab das abas para os IDs das seções correspondentes
  const sectionMap = {
    "patient-card": "patient-details-section",
    regulations: "regulations-section",
    consultations: "consultations-section",
    exams: "exams-section",
    appointments: "appointments-section",
  };

  const allKnownOrderableIds = Object.keys(sectionMap);

  // Pega todas as seções do DOM que são reordenáveis
  const allOrderableSectionsInDOM = Array.from(
    mainContent.querySelectorAll("section")
  ).filter((s) => Object.values(sectionMap).includes(s.id));

  // Mapeia de volta para os IDs das abas para saber a ordem padrão do DOM
  const domTabOrder = allOrderableSectionsInDOM
    .map((section) => {
      return Object.keys(sectionMap).find(
        (key) => sectionMap[key] === section.id
      );
    })
    .filter(Boolean);

  let finalOrder = [];
  // Usa a ordem salva se for um array válido
  if (order && Array.isArray(order) && order.length > 0) {
    // Filtra a ordem salva para remover seções que não existem mais
    const validSavedOrder = order.filter((id) =>
      allKnownOrderableIds.includes(id)
    );
    finalOrder = [...validSavedOrder];
  } else {
    // Se não houver ordem salva, usa a ordem do DOM como padrão
    finalOrder = [...domTabOrder];
  }

  // Identifica seções novas (presentes no DOM/código mas não na ordem final)
  const currentSectionsInOrder = new Set(finalOrder);
  const newSections = domTabOrder.filter(
    (id) => !currentSectionsInOrder.has(id)
  );

  // Anexa as novas seções ao final para garantir que sempre apareçam
  finalOrder.push(...newSections);

  // Re-anexa os elementos ao DOM na ordem correta
  // As seções não-mapeadas (como a de busca) não são afetadas e permanecem no topo.
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

async function handleRegulationLoaded(payload) {
  Utils.toggleLoader(true);
  try {
    const regulationData = await API.fetchRegulationDetails(payload);
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

  // Listener removido, pois a recarga agora é manual.
  // browser.runtime.onMessage.addListener((message) => {
  //   if (message.type === "REGULATION_LOADED") {
  //     handleRegulationLoaded(message.payload);
  //   }
  // });
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
