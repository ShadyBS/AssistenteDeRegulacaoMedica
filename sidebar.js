// Importa todas as funções de busca necessárias
import {
  searchPatients,
  fetchVisualizaUsuario,
  fetchCadsusData,
  fetchAllConsultations,
  fetchConsultasBasicas,
  fetchConsultasEspecializadas,
  fetchExamesSolicitados,
  fetchResultadoExame,
  fetchAppointments,
  fetchAllRegulations,
  getBaseUrl,
} from "./api.js";
// Importa as configurações
import { defaultFieldConfig, getNestedValue } from "./field-config.js";
import { filterConfig } from "./filter-config.js";

// --- Seletores de Elementos do DOM (Gerais) ---
const mainContent = document.getElementById("main-content");
const loader = document.getElementById("loader");
const messageArea = document.getElementById("message-area");

// --- Seletores de Busca e Paciente ---
const searchInput = document.getElementById("patient-search-input");
const searchResultsList = document.getElementById("search-results");
const recentPatientsList = document.getElementById("recent-patients-list");
const patientDetailsSection = document.getElementById(
  "patient-details-section"
);
const patientMainInfoDiv = document.getElementById("patient-main-info");
const patientAdditionalInfoDiv = document.getElementById(
  "patient-additional-info"
);
const toggleDetailsBtn = document.getElementById("toggle-details-btn");

// --- Seletores de Seções ---
const consultationsSection = document.getElementById("consultations-section");
const examsSection = document.getElementById("exams-section");
const appointmentsSection = document.getElementById("appointments-section");
const regulationsSection = document.getElementById("regulations-section");

// --- Seletores de Conteúdo ---
const consultationsContent = document.getElementById("consultations-content");
const examsContent = document.getElementById("exams-content");
const appointmentsContent = document.getElementById("appointments-content");
const regulationsContent = document.getElementById("regulations-content");

// --- Seletores do Modal ---
const infoModal = document.getElementById("info-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

// --- Variáveis de Estado ---
let currentPatient = null;
let recentPatients = [];
let fieldConfigLayout = [];
let filterLayout = {}; // Layout dos filtros (main/more, order)
let savedFilterSets = {}; // Conjuntos de filtros salvos pelo usuário

// Dados completos
let allFetchedConsultations = [];
let allFetchedExams = [];
let allFetchedAppointments = [];
let allFetchedRegulations = [];

// Tipos de busca (para botões de grupo)
let currentConsultationFetchType = "all";
let currentExamFetchType = "all";
let currentAppointmentFetchType = "all";
let currentRegulationFetchType = "all";

// Estados de ordenação
let consultationSortState = { key: "sortableDate", order: "desc" };
let examSortState = { key: "date", order: "desc" };
let appointmentSortState = { key: "date", order: "desc" };
let regulationSortState = { key: "date", order: "desc" };

// --- Mapas para Chamadas de Função Dinâmicas ---
const fetchHandlers = {
  consultations: handleFetchConsultations,
  exams: handleFetchExams,
  appointments: handleFetchAppointments,
  regulations: handleFetchRegulations,
};

const applyFilterHandlers = {
  consultations: applyConsultationFiltersAndRender,
  exams: applyExamFiltersAndRender,
  appointments: applyAppointmentFiltersAndRender,
  regulations: applyRegulationFiltersAndRender,
};

// CORREÇÃO: Mapa para lidar com inconsistências de ID (singular vs plural)
const idPrefixMap = {
  consultations: "consultation",
  exams: "exam",
  appointments: "appointment",
  regulations: "regulation",
};

// --- Funções de Armazenamento e Configuração ---

async function loadConfigAndData() {
  const data = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
    filterLayout: {},
    // Preferências de usuário
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    hideNoShowDefault: false,
    monthsBack: 6,
  });

  // Configuração da Ficha do Paciente
  fieldConfigLayout = defaultFieldConfig.map((defaultField) => {
    const savedField = data.patientFields.find((f) => f.id === defaultField.id);
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });

  // Configuração do Layout dos Filtros
  filterLayout = data.filterLayout;

  // Preferências do Usuário
  window.userPreferences = {
    autoLoadExams: data.autoLoadExams,
    autoLoadConsultations: data.autoLoadConsultations,
    autoLoadAppointments: data.autoLoadAppointments,
    autoLoadRegulations: data.autoLoadRegulations,
    hideNoShowDefault: data.hideNoShowDefault,
    monthsBack: data.monthsBack,
  };

  // Carregar Pacientes Recentes e Filtros Salvos (do storage.local)
  const localData = await browser.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
  });
  recentPatients = localData.recentPatients;
  savedFilterSets = localData.savedFilterSets;
}

async function saveRecentPatient(patient) {
  const filtered = recentPatients.filter(
    (p) => p.idp !== patient.idp || p.ids !== patient.ids
  );
  const updatedList = [patient, ...filtered].slice(0, 5);
  recentPatients = updatedList;
  await browser.storage.local.set({ recentPatients });
}

async function saveFilterSetsToStorage() {
  await browser.storage.local.set({ savedFilterSets });
}

// --- Funções Utilitárias ---
function debounce(func, delay = 500) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
function toggleLoader(show) {
  loader.style.display = show ? "block" : "none";
}
function showMessage(text, type = "error") {
  messageArea.textContent = text;
  messageArea.className = `p-3 rounded-md text-sm ${
    type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
  }`;
  messageArea.style.display = "block";
}
function clearMessage() {
  messageArea.style.display = "none";
}
const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

// --- Funções de Renderização Dinâmica (Fase 4) ---

/**
 * Cria e renderiza os controles de filtro para todas as seções dinamicamente.
 */
function renderAllFilterControls() {
  try {
    Object.keys(filterConfig).forEach((sectionKey) => {
      const sectionFilters = filterConfig[sectionKey];
      const sectionLayout = filterLayout[sectionKey] || [];
      const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

      const sortedFilters = [...sectionFilters].sort((a, b) => {
        const orderA = layoutMap.get(a.id)?.order ?? Infinity;
        const orderB = layoutMap.get(b.id)?.order ?? Infinity;
        return orderA - orderB;
      });

      // CORREÇÃO: Usa o mapa de prefixos para encontrar os containers
      const prefix = idPrefixMap[sectionKey];
      const mainContainer = document.getElementById(`${prefix}-main-filters`);
      const moreContainer = document.getElementById(`${prefix}-more-filters`);

      if (mainContainer) mainContainer.innerHTML = "";
      if (moreContainer) moreContainer.innerHTML = "";

      sortedFilters.forEach((filter) => {
        const location =
          layoutMap.get(filter.id)?.location || filter.defaultLocation;
        const container = location === "main" ? mainContainer : moreContainer;
        if (container) {
          container.appendChild(createFilterElement(filter));
        } else {
          console.warn(`Container para o filtro ${filter.id} não encontrado.`);
        }
      });

      renderSavedFiltersUI(sectionKey);
    });
  } catch (e) {
    console.error("Erro crítico ao renderizar os filtros:", e);
    showMessage("Falha ao criar interface de filtros.", "error");
  }
}

/**
 * Cria um único elemento de filtro (label, input, etc.) com base na sua configuração.
 * @param {object} filter - O objeto de configuração do filtro.
 * @returns {HTMLElement} O elemento container do filtro (ex: <div>).
 */
function createFilterElement(filter) {
  const container = document.createElement("div");
  let elementHtml = "";

  if (filter.type !== "checkbox") {
    elementHtml += `<label for="${filter.id}" class="block font-medium mb-1 text-sm">${filter.label}</label>`;
  }

  switch (filter.type) {
    case "text":
      elementHtml += `<input type="text" id="${filter.id}" placeholder="${
        filter.placeholder || ""
      }" class="w-full px-2 py-1 border border-slate-300 rounded-md">`;
      break;
    case "select":
      elementHtml += `<select id="${filter.id}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;
      filter.options.forEach((opt) => {
        elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
      });
      elementHtml += `</select>`;
      break;
    case "checkbox":
      container.className = "flex items-center";
      elementHtml += `<input id="${
        filter.id
      }" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" ${
        filter.defaultChecked ? "checked" : ""
      }>
            <label for="${
              filter.id
            }" class="ml-2 block text-sm text-slate-700">${
        filter.label
      }</label>`;
      break;
    case "buttonGroup":
      elementHtml += `<div id="${filter.id}" class="grid grid-cols-${filter.buttons.length} gap-1 p-1 bg-slate-100 rounded-lg">`;
      filter.buttons.forEach((btn, index) => {
        const isActive = index === 0;
        elementHtml += `<button data-fetch-type="${btn.value}"
                    class="${filter.id}-btn ${
          isActive ? "btn-active" : "text-slate-600 hover:bg-slate-200"
        } px-2 py-1 text-sm rounded-md transition-colors">
                    ${btn.text}
                </button>`;
      });
      elementHtml += `</div>`;
      break;
  }

  container.innerHTML = elementHtml;
  return container;
}

/**
 * Renderiza a UI para salvar, carregar e deletar conjuntos de filtros.
 * @param {string} sectionKey - A chave da seção (ex: 'consultations').
 */
function renderSavedFiltersUI(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const container = document.getElementById(
    `${prefix}-saved-filters-container`
  );
  if (!container) return;

  container.innerHTML = `
        <h3 class="text-sm font-semibold text-slate-600 mt-3 mb-2">Filtros Salvos</h3>
        <div class="flex items-center gap-2">
            <select id="${prefix}-saved-filters-select" class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md bg-white text-sm">
                <option value="">Carregar um filtro...</option>
            </select>
            <button id="${prefix}-delete-filter-btn" title="Deletar selecionado" class="p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
            </button>
        </div>
        <div class="flex items-center gap-2 mt-2">
            <input type="text" id="${prefix}-save-filter-name-input" placeholder="Nome para o novo filtro..." class="flex-grow w-full px-2 py-1 border border-slate-300 rounded-md text-sm">
            <button id="${prefix}-save-filter-btn" class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium">Salvar</button>
        </div>
    `;
  populateSavedFilterDropdown(sectionKey);
}

/**
 * Popula o dropdown de filtros salvos para uma seção específica.
 * @param {string} sectionKey
 */
function populateSavedFilterDropdown(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const select = document.getElementById(`${prefix}-saved-filters-select`);
  if (!select) return;

  const currentSelection = select.value;
  select.innerHTML = '<option value="">Carregar um filtro...</option>';

  const sets = savedFilterSets[sectionKey] || [];
  sets.forEach((set) => {
    const option = document.createElement("option");
    option.value = set.name;
    option.textContent = set.name;
    select.appendChild(option);
  });
  select.value = currentSelection;
}

// --- Funções de Renderização de Conteúdo (Resultados) ---

function renderPatientDetails(patientData, cadsusData) {
  currentPatient = patientData;
  patientMainInfoDiv.innerHTML = "";
  patientAdditionalInfoDiv.innerHTML = "";

  const getLocalValue = (field, data) => {
    if (typeof field.key === "function") {
      return field.key(data);
    }
    return getNestedValue(data, field.key);
  };

  const getCadsusValue = (field, data) => {
    if (!data || field.cadsusKey === null) return null;
    if (typeof field.cadsusKey === "function") {
      return field.cadsusKey(data);
    }
    return data[field.cadsusKey];
  };

  const sortedFields = [...fieldConfigLayout].sort((a, b) => a.order - b.order);

  sortedFields.forEach((field) => {
    if (!field.enabled) return;

    let localValue = getLocalValue(field, patientData);
    if (field.formatter) {
      localValue = field.formatter(localValue);
    }
    const cadsusValue = getCadsusValue(field, cadsusData);

    const v1 = String(localValue || "").trim();
    const v2 = String(cadsusValue || "").trim();
    let icon = "";

    if (cadsusData && field.cadsusKey !== null) {
      const normalizePhone = (phone) =>
        (phone || "").replace(/\D/g, "").replace(/^55/, "");
      let compareV1 = v1;
      let compareV2 = v2;

      if (field.id === "telefone") {
        compareV1 = normalizePhone(v1);
        compareV2 = normalizePhone(v2);
      } else if (field.id === "cpf" || field.id === "cep") {
        compareV1 = v1.replace(/\D/g, "");
        compareV2 = v2.replace(/\D/g, "");
      }

      if (compareV1.toUpperCase() === compareV2.toUpperCase()) {
        icon = `<span class="comparison-icon" title="Dado confere com o CADSUS">✅</span>`;
      } else {
        const tooltipText = `Ficha: ${v1 || "Vazio"}\nCADSUS: ${v2 || "Vazio"}`;
        icon = `<span class="comparison-icon" data-tooltip="${tooltipText}">⚠️</span>`;
      }
    }

    const valueClass =
      field.id.toLowerCase().includes("alerg") && v1 && v1 !== "-"
        ? "text-red-600 font-bold"
        : "text-slate-900";

    const copyIcon = `<span class="copy-icon" title="Copiar" data-copy-text="${v1}">📄</span>`;

    const rowHtml = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">${
      field.label
    }:</span><span class="${valueClass} text-right flex items-center">${
      v1 || "-"
    }${icon}${copyIcon}</span></div>`;

    if (field.section === "main") {
      patientMainInfoDiv.innerHTML += rowHtml;
    } else {
      patientAdditionalInfoDiv.innerHTML += rowHtml;
    }
  });

  const hasMoreFields = sortedFields.some(
    (f) => f.enabled && f.section === "more"
  );
  toggleDetailsBtn.style.display = hasMoreFields ? "block" : "none";
  if (!hasMoreFields) {
    patientAdditionalInfoDiv.classList.remove("show");
    toggleDetailsBtn.textContent = "Mostrar mais";
  }

  patientDetailsSection.style.display = "block";
  regulationsSection.style.display = "block";
  consultationsSection.style.display = "block";
  examsSection.style.display = "block";
  appointmentsSection.style.display = "block";
}

function renderPatientListItem(patient) {
  return `
      <div class="font-medium text-slate-800">${
        patient.value || "Nome não informado"
      }</div>
      <div class="grid grid-cols-2 gap-x-4 text-xs text-slate-500 mt-1">
        <span><strong class="font-semibold">Cód:</strong> ${patient.idp}-${
    patient.ids
  }</span>
        <span><strong class="font-semibold">Nasc:</strong> ${
          patient.dataNascimento || "-"
        }</span>
        <span><strong class="font-semibold">CPF:</strong> ${
          patient.cpf || "-"
        }</span>
        <span><strong class="font-semibold">CNS:</strong> ${
          patient.cns || "-"
        }</span>
      </div>
    `;
}

function renderSearchResults(patients) {
  searchResultsList.innerHTML = "";
  if (patients.length === 0) {
    searchResultsList.innerHTML =
      '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>';
    return;
  }
  patients.forEach((patient) => {
    const listItem = document.createElement("li");
    listItem.className =
      "px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition";
    listItem.innerHTML = renderPatientListItem(patient);
    listItem.dataset.idp = patient.idp;
    listItem.dataset.ids = patient.ids;
    searchResultsList.appendChild(listItem);
  });
}

function renderRecentPatients() {
  recentPatientsList.innerHTML =
    '<li class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400">PACIENTES RECENTES</li>';
  if (recentPatients.length === 0) {
    recentPatientsList.innerHTML +=
      '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente recente.</li>';
    return;
  }
  recentPatients.forEach((patient) => {
    const listItem = document.createElement("li");
    listItem.className =
      "px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition recent-patient-item";
    listItem.innerHTML = renderPatientListItem(patient);
    listItem.dataset.patient = JSON.stringify(patient);
    recentPatientsList.appendChild(listItem);
  });
}

function getSortIndicator(key, state) {
  if (state.key !== key) return "";
  return state.order === "asc" ? "▲" : "▼";
}

function renderConsultations(consultations) {
  if (consultations.length === 0) {
    consultationsContent.innerHTML =
      '<p class="text-slate-500">Nenhuma consulta encontrada para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="specialty">Especialidade/Profissional <span class="sort-indicator">${getSortIndicator(
          "specialty",
          consultationSortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="sortableDate">Data <span class="sort-indicator">${getSortIndicator(
          "sortableDate",
          consultationSortState
        )}</span></span>
    </div>
  `;
  consultationsContent.innerHTML =
    headers +
    consultations
      .map(
        (c) => `
        <div class="p-3 mb-3 border rounded-lg ${
          c.isNoShow ? "bg-red-50 border-red-200" : "bg-white"
        } consultation-item">
            <div class="flex justify-between items-start cursor-pointer consultation-header">
                <div>
                    <p class="font-bold text-blue-700 pointer-events-none">${
                      c.specialty
                    }</p>
                    <p class="text-sm text-slate-600 pointer-events-none">${
                      c.professional
                    }</p>
                </div>
                <p class="text-sm font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded whitespace-pre-wrap text-right pointer-events-none">${c.date.replace(
                  /\n/g,
                  "<br>"
                )}</p>
            </div>
            <div class="consultation-body collapse-section show">
                ${
                  c.isNoShow
                    ? '<p class="text-center font-bold text-red-600 mt-2">PACIENTE FALTOU</p>'
                    : `
                <p class="text-sm text-slate-500 mt-1">${c.unit}</p>
                <div class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    ${c.details
                      .map(
                        (d) =>
                          `<p class="text-xs font-semibold text-slate-500 uppercase">${
                            d.label
                          }</p><p class="text-sm text-slate-700 whitespace-pre-wrap">${d.value.replace(
                            /\n/g,
                            "<br>"
                          )} <span class="copy-icon" title="Copiar" data-copy-text="${
                            d.value
                          }">📄</span></p>`
                      )
                      .join("")}
                </div>`
                }
            </div>
        </div>
    `
      )
      .join("");
}

function renderExams(exams) {
  if (exams.length === 0) {
    examsContent.innerHTML =
      '<p class="text-slate-500">Nenhum exame encontrado para os filtros aplicados.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-2/3" data-sort-key="examName">Nome do Exame <span class="sort-indicator">${getSortIndicator(
          "examName",
          examSortState
        )}</span></span>
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          examSortState
        )}</span></span>
    </div>
  `;
  examsContent.innerHTML =
    headers +
    exams
      .map((exam) => {
        const idp = exam.resultIdp;
        const ids = exam.resultIds;
        const idpStr = idp !== null && idp !== undefined ? String(idp) : "";
        const idsStr = ids !== null && ids !== undefined ? String(ids) : "";
        const showBtn =
          exam.hasResult &&
          idp !== null &&
          idp !== undefined &&
          ids !== null &&
          ids !== undefined &&
          idpStr !== "" &&
          idsStr !== "";
        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <p class="font-semibold text-indigo-700">${
              exam.examName || "Nome do exame não informado"
            } <span class="copy-icon" title="Copiar" data-copy-text="${
          exam.examName
        }">📄</span></p>
            <div class="text-sm text-slate-500 mt-1">
                <p>Solicitado por: ${exam.professional || "Não informado"} (${
          exam.specialty || "N/A"
        })</p>
                <p>Data: ${exam.date || "Não informada"}</p>
            </div>
            ${
              showBtn
                ? `<button class="view-exam-result-btn mt-2 w-full text-sm bg-green-100 text-green-800 py-1 rounded hover:bg-green-200" data-idp="${idpStr}" data-ids="${idsStr}">Visualizar Resultado</button>`
                : ""
            }
        </div>
      `;
      })
      .join("");
}

const statusStyles = {
  AGENDADO: "bg-blue-100 text-blue-800",
  PRESENTE: "bg-green-100 text-green-800",
  FALTOU: "bg-red-100 text-red-800",
  CANCELADO: "bg-yellow-100 text-yellow-800",
  ATENDIDO: "bg-purple-100 text-purple-800",
};

function renderAppointments(appointments) {
  if (appointments.length === 0) {
    appointmentsContent.innerHTML =
      '<p class="text-slate-500">Nenhum agendamento encontrado para o filtro selecionado.</p>';
    return;
  }
  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="specialty">Especialidade <span class="sort-indicator">${getSortIndicator(
          "specialty",
          appointmentSortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          "status",
          appointmentSortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          appointmentSortState
        )}</span></span>
    </div>
  `;
  appointmentsContent.innerHTML =
    headers +
    appointments
      .map((item) => {
        const style = statusStyles[item.status] || "bg-gray-100 text-gray-800";
        let typeText = item.type;
        if (item.isSpecialized) {
          typeText = "CONSULTA ESPECIALIZADA";
        } else if (item.isOdonto) {
          typeText = "CONSULTA ODONTO";
        } else if (item.type.toUpperCase().includes("EXAME")) {
          typeText = "EXAME";
        }

        let idp, ids;
        const idParts = item.id.split("-");

        if (idParts[0].toLowerCase() === "exam") {
          idp = idParts[1];
          ids = idParts[2];
        } else {
          idp = idParts[0];
          ids = idParts[1];
        }

        const appointmentDataString = JSON.stringify(item);

        return `
        <div class="p-3 mb-3 border rounded-lg bg-white">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${typeText}</p>
                    <p class="text-sm text-indigo-600 font-medium">${
                      item.specialty || "Sem especialidade"
                    }</p>
                </div>
                <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
          item.status
        }</span>
            </div>
            <div class="text-sm text-slate-500 mt-2 border-t pt-2">
                <p><strong>Data:</strong> ${item.date} às ${item.time}</p>
                <p><strong>Local:</strong> ${item.location}</p>
                <p><strong>Profissional:</strong> ${item.professional}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t">
                 <button class="view-appointment-details-btn text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${
                   idp || ""
                 }" data-ids="${ids || ""}" data-type="${item.type}">
                    Abrir
                </button>
                <button class="appointment-info-btn text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" data-appointment='${appointmentDataString}'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>
        </div>
      `;
      })
      .join("");
}

function renderRegulations(regulations) {
  if (regulations.length === 0) {
    regulationsContent.innerHTML =
      '<p class="text-slate-500">Nenhum resultado encontrado para os filtros aplicados.</p>';
    return;
  }

  const priorityStyles = {
    EMERGENCIA: "bg-red-500 text-white",
    "MUITO ALTA": "bg-orange-500 text-white",
    ALTA: "bg-yellow-500 text-black",
    NORMAL: "bg-blue-500 text-white",
    BAIXA: "bg-green-500 text-white",
  };

  const statusStyles = {
    AUTORIZADO: "bg-green-100 text-green-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
    NEGADO: "bg-red-100 text-red-800",
    DEVOLVIDO: "bg-orange-100 text-orange-800",
    CANCELADA: "bg-gray-100 text-gray-800",
    "EM ANÁLISE": "bg-blue-100 text-blue-800",
  };

  const headers = `
    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 px-3">
        <span class="sort-header w-1/2" data-sort-key="procedure">Procedimento <span class="sort-indicator">${getSortIndicator(
          "procedure",
          regulationSortState
        )}</span></span>
        <span class="sort-header w-1/4 text-center" data-sort-key="status">Status <span class="sort-indicator">${getSortIndicator(
          "status",
          regulationSortState
        )}</span></span>
        <span class="sort-header w-1/4 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
          regulationSortState
        )}</span></span>
    </div>
  `;

  regulationsContent.innerHTML =
    headers +
    regulations
      .map((item) => {
        const statusKey = (item.status || "").toUpperCase();
        const style = statusStyles[statusKey] || "bg-gray-100 text-gray-800";

        const priorityKey = (item.priority || "").toUpperCase();
        const priorityStyle =
          priorityStyles[priorityKey] || "bg-gray-400 text-white";

        const typeText = (item.type || "").startsWith("CON")
          ? "CONSULTA"
          : "EXAME";
        const typeColor =
          typeText === "CONSULTA" ? "text-cyan-700" : "text-fuchsia-700";

        return `
            <div class="p-3 mb-3 border rounded-lg bg-white">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                           <p class="font-bold ${typeColor}">${typeText}</p>
                           <span class="text-xs font-bold px-2 py-0.5 rounded-full ${priorityStyle}">${
          item.priority
        }</span>
                        </div>
                        <p class="text-sm text-slate-800 font-medium">${
                          item.procedure
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
          item.procedure
        }">📄</span></p>
                        <p class="text-xs text-slate-500">${
                          item.cid
                        } <span class="copy-icon" title="Copiar" data-copy-text="${
          item.cid
        }">📄</span></p>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full ${style}">${
          item.status
        }</span>
                </div>
                <div class="text-sm text-slate-500 mt-2 border-t pt-2 space-y-1">
                    <p><strong>Data:</strong> ${item.date}</p>
                    <p><strong>Solicitante:</strong> ${item.requester}</p>
                    <p><strong>Executante:</strong> ${
                      item.provider || "Não definido"
                    }</p>
                </div>
                <div class="mt-2 pt-2 border-t">
                     <button class="view-regulation-details-btn w-full text-sm bg-gray-100 text-gray-800 py-1 px-3 rounded hover:bg-gray-200" data-idp="${
                       item.idp
                     }" data-ids="${item.ids}">
                        Visualizar Detalhes
                    </button>
                </div>
            </div>
      `;
      })
      .join("");
}

// --- Funções de Filtragem, Ordenação e Renderização ---

function sortData(data, state) {
  const { key, order } = state;
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    let valA, valB;

    if (key === "date" || key === "sortableDate") {
      valA = a.sortableDate || parseDate(a.date);
      valB = b.sortableDate || parseDate(b.date);
    } else {
      valA = (a[key] || "").toString().toLowerCase();
      valB = (b[key] || "").toString().toLowerCase();
    }

    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });
  return sortedData;
}

function updateActiveFiltersIndicator(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const moreFiltersDiv = document.getElementById(`${prefix}-more-filters`);
  const indicator = document.getElementById(
    `${prefix}-active-filters-indicator`
  );
  if (!moreFiltersDiv || !indicator) return;

  const isShown = moreFiltersDiv.classList.contains("show");
  let activeCount = 0;

  const filterElements = Array.from(
    moreFiltersDiv.querySelectorAll("input, select")
  );

  filterElements.forEach((el) => {
    if (
      el.type === "select-one" &&
      el.value !== "todos" &&
      el.value !== "todas" &&
      el.value !== ""
    ) {
      activeCount++;
    } else if (el.type === "text" && el.value.trim() !== "") {
      activeCount++;
    } else if (el.type === "checkbox" && el.checked) {
      activeCount++;
    }
  });

  if (activeCount > 0 && !isShown) {
    indicator.textContent = activeCount;
    indicator.classList.remove("hidden");
  } else {
    indicator.classList.add("hidden");
  }
}

function getFilterValues(sectionKey) {
  const values = {};
  const filters = filterConfig[sectionKey] || [];
  filters.forEach((filter) => {
    const el = document.getElementById(filter.id);
    if (!el) return;

    if (filter.type === "checkbox") {
      values[filter.id] = el.checked;
    } else if (filter.type === "buttonGroup") {
      // Este valor é tratado por uma variável de estado global
    } else {
      values[filter.id] = el.value;
    }
  });
  return values;
}

function applyConsultationFiltersAndRender() {
  let filteredData = [...allFetchedConsultations];
  const filters = getFilterValues("consultations");

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

  if (keyword) {
    const searchTerms = keyword
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((c) => {
        const fullText = [
          c.specialty,
          c.professional,
          c.unit,
          ...c.details.map((d) => `${d.label} ${d.value}`),
        ]
          .join(" ")
          .toLowerCase();
        return searchTerms.some((term) => fullText.includes(term));
      });
    }
  }

  if (cid) {
    const searchTerms = cid
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((c) => {
        const itemCids = c.details
          .map((d) => d.value)
          .join(" ")
          .toLowerCase();
        return searchTerms.some((term) => itemCids.includes(term));
      });
    }
  }

  if (specialty) {
    const searchTerms = specialty
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((c) => {
        const itemSpecialty = (c.specialty || "").toLowerCase();
        return searchTerms.some((term) => itemSpecialty.includes(term));
      });
    }
  }

  if (professional) {
    const searchTerms = professional
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((c) => {
        const itemProfessional = (c.professional || "").toLowerCase();
        return searchTerms.some((term) => itemProfessional.includes(term));
      });
    }
  }

  if (unit) {
    const searchTerms = unit
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((c) => {
        const itemUnit = (c.unit || "").toLowerCase();
        return searchTerms.some((term) => itemUnit.includes(term));
      });
    }
  }

  const sortedData = sortData(filteredData, consultationSortState);
  renderConsultations(sortedData);
  updateActiveFiltersIndicator("consultations");
}

function applyExamFiltersAndRender() {
  let filteredData = [...allFetchedExams];
  const filters = getFilterValues("exams");

  const name = (filters["exam-filter-name"] || "").toLowerCase().trim();
  const professional = (filters["exam-filter-professional"] || "")
    .toLowerCase()
    .trim();
  const specialty = (filters["exam-filter-specialty"] || "")
    .toLowerCase()
    .trim();

  if (currentExamFetchType === "withResult") {
    filteredData = filteredData.filter((e) => e.hasResult);
  } else if (currentExamFetchType === "withoutResult") {
    filteredData = filteredData.filter((e) => !e.hasResult);
  }

  if (name) {
    const searchTerms = name
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((e) => {
        const itemName = (e.examName || "").toLowerCase();
        return searchTerms.some((term) => itemName.includes(term));
      });
    }
  }

  if (professional) {
    const searchTerms = professional
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((e) => {
        const itemProfessional = (e.professional || "").toLowerCase();
        return searchTerms.some((term) => itemProfessional.includes(term));
      });
    }
  }

  if (specialty) {
    const searchTerms = specialty
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((e) => {
        const itemSpecialty = (e.specialty || "").toLowerCase();
        return searchTerms.some((term) => itemSpecialty.includes(term));
      });
    }
  }

  const sortedData = sortData(filteredData, examSortState);
  renderExams(sortedData);
  updateActiveFiltersIndicator("exams");
}

function applyAppointmentFiltersAndRender() {
  let filteredData = [...allFetchedAppointments];
  const filters = getFilterValues("appointments");

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

  if (currentAppointmentFetchType === "consultas") {
    filteredData = filteredData.filter(
      (a) => !a.type.toUpperCase().includes("EXAME")
    );
  } else if (currentAppointmentFetchType === "exames") {
    filteredData = filteredData.filter((a) =>
      a.type.toUpperCase().includes("EXAME")
    );
  }

  if (term) {
    const searchTerms = term
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((a) => {
        const fullText = [a.professional, a.specialty, a.description]
          .join(" ")
          .toLowerCase();
        return searchTerms.some((t) => fullText.includes(t));
      });
    }
  }

  if (location) {
    const searchTerms = location
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((a) => {
        const itemLocation = (a.location || "").toLowerCase();
        return searchTerms.some((t) => itemLocation.includes(t));
      });
    }
  }

  const sortedData = sortData(filteredData, appointmentSortState);
  renderAppointments(sortedData);
  updateActiveFiltersIndicator("appointments");
}

function applyRegulationFiltersAndRender() {
  let filteredData = [...allFetchedRegulations];
  const filters = getFilterValues("regulations");

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
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((item) => {
        const itemProcedure = (item.procedure || "").toLowerCase();
        return searchTerms.some((term) => itemProcedure.includes(term));
      });
    }
  }

  if (requesterTerms) {
    const searchTerms = requesterTerms
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (searchTerms.length > 0) {
      filteredData = filteredData.filter((item) => {
        const itemRequester = (item.requester || "").toLowerCase();
        return searchTerms.some((term) => itemRequester.includes(term));
      });
    }
  }

  const sortedData = sortData(filteredData, regulationSortState);
  renderRegulations(sortedData);
  updateActiveFiltersIndicator("regulations");
}

// --- Funções de Manipulação de Eventos (Handlers) ---

async function handleResultClick(event) {
  const listItem = event.target.closest("li");
  if (!listItem || (!listItem.dataset.idp && !listItem.dataset.patient)) return;
  toggleLoader(true);
  clearMessage();
  consultationsContent.innerHTML = "";
  examsContent.innerHTML = "";
  appointmentsContent.innerHTML = "";
  regulationsContent.innerHTML = "";

  try {
    let initialPatientData;
    if (listItem.dataset.patient) {
      initialPatientData = JSON.parse(listItem.dataset.patient);
    } else {
      initialPatientData = {
        idp: listItem.dataset.idp,
        ids: listItem.dataset.ids,
      };
    }

    const patientData = await fetchVisualizaUsuario(initialPatientData);

    const cpf = patientData.entidadeFisica?.entfCPF;
    const cns = patientData.isenNumCadSus;
    const cadsusData = await fetchCadsusData({ cpf, cns });

    renderPatientDetails(patientData, cadsusData);

    await saveRecentPatient({
      idp: patientData.isenPK.idp,
      ids: patientData.isenPK.ids,
      value: patientData.entidadeFisica?.entidade?.entiNome,
      cns: patientData.isenNumCadSus,
      dataNascimento: patientData.entidadeFisica?.entfDtNasc,
      cpf: patientData.entidadeFisica?.entfCPF,
    });

    searchInput.value = "";
    searchResultsList.classList.add("hidden");
    recentPatientsList.classList.add("hidden");

    if (window.userPreferences.autoLoadRegulations)
      await handleFetchRegulations();
    if (window.userPreferences.autoLoadAppointments)
      await handleFetchAppointments();
    if (window.userPreferences.autoLoadConsultations)
      await handleFetchConsultations();
    if (window.userPreferences.autoLoadExams) await handleFetchExams();
  } catch (error) {
    showMessage("Erro ao carregar os dados do paciente.");
    console.error(error);
  } finally {
    toggleLoader(false);
  }
}

async function handleSearchInput(event) {
  const searchTerm = event.target.value.trim();
  clearMessage();
  patientDetailsSection.style.display = "none";
  consultationsSection.style.display = "none";
  examsSection.style.display = "none";
  appointmentsSection.style.display = "none";
  regulationsSection.style.display = "none";
  currentPatient = null;
  recentPatientsList.classList.add("hidden");
  searchResultsList.classList.remove("hidden");
  if (searchTerm.length < 1) {
    searchResultsList.innerHTML = "";
    return;
  }
  toggleLoader(true);
  try {
    const patients = await searchPatients(searchTerm);
    renderSearchResults(patients);
  } catch (error) {
    showMessage("Erro ao buscar pacientes.");
  } finally {
    toggleLoader(false);
  }
}

function handleToggleDetails() {
  patientAdditionalInfoDiv.classList.toggle("show");
  toggleDetailsBtn.textContent = patientAdditionalInfoDiv.classList.contains(
    "show"
  )
    ? "Mostrar menos"
    : "Mostrar mais";
}

async function handleFetchConsultations() {
  if (!currentPatient?.isenFullPKCrypto) {
    if (consultationsSection.style.display !== "none")
      showMessage("ID criptografado não encontrado.");
    return;
  }
  const dataInicial = document.getElementById("date-initial").value
    ? new Date(
        document.getElementById("date-initial").value
      ).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = document.getElementById("date-final").value
    ? new Date(document.getElementById("date-final").value).toLocaleDateString(
        "pt-BR"
      )
    : new Date().toLocaleDateString("pt-BR");

  toggleLoader(true);
  consultationsContent.innerHTML = "Carregando...";
  document.getElementById("raw-html-content").textContent = "";
  document.getElementById("debug-section").style.display = "none";

  try {
    let fetchFunction;
    switch (currentConsultationFetchType) {
      case "basic":
        fetchFunction = fetchConsultasBasicas;
        break;
      case "specialized":
        fetchFunction = fetchConsultasEspecializadas;
        break;
      default:
        fetchFunction = fetchAllConsultations;
    }
    const { jsonData, htmlData } = await fetchFunction({
      isenFullPKCrypto: currentPatient.isenFullPKCrypto,
      dataInicial,
      dataFinal,
    });
    allFetchedConsultations = jsonData;
    applyConsultationFiltersAndRender();
    if (htmlData) {
      document.getElementById("raw-html-content").textContent = htmlData;
      document.getElementById("debug-section").style.display = "block";
    }
  } catch (error) {
    showMessage(error.message);
    allFetchedConsultations = [];
    applyConsultationFiltersAndRender();
  } finally {
    toggleLoader(false);
  }
}

async function handleFetchExams() {
  if (!currentPatient?.isenPK) {
    if (examsSection.style.display !== "none")
      showMessage("ID do paciente (isenPK) não encontrado.");
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = document.getElementById("exam-date-initial").value
    ? new Date(
        document.getElementById("exam-date-initial").value
      ).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = document.getElementById("exam-date-final").value
    ? new Date(
        document.getElementById("exam-date-final").value
      ).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  let comResultado =
    currentExamFetchType === "withResult" || currentExamFetchType === "all";
  let semResultado =
    currentExamFetchType === "withoutResult" || currentExamFetchType === "all";

  toggleLoader(true);
  examsContent.innerHTML = "Carregando...";
  try {
    const examsData = await fetchExamesSolicitados({
      isenPK,
      dataInicial,
      dataFinal,
      comResultado,
      semResultado,
    });
    allFetchedExams = examsData;
    applyExamFiltersAndRender();
  } catch (error) {
    showMessage(error.message);
    allFetchedExams = [];
    applyExamFiltersAndRender();
  } finally {
    toggleLoader(false);
  }
}

async function handleFetchAppointments() {
  if (!currentPatient?.isenPK) {
    if (appointmentsSection.style.display !== "none")
      showMessage("ID do paciente (isenPK) não encontrado.");
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = document.getElementById("appointment-date-initial").value
    ? new Date(
        document.getElementById("appointment-date-initial").value
      ).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = document.getElementById("appointment-date-final").value
    ? new Date(
        document.getElementById("appointment-date-final").value
      ).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  toggleLoader(true);
  appointmentsContent.innerHTML = "Carregando...";
  try {
    const appointmentsData = await fetchAppointments({
      isenPK,
      dataInicial,
      dataFinal,
    });
    allFetchedAppointments = appointmentsData;
    applyAppointmentFiltersAndRender();
  } catch (error) {
    showMessage(error.message);
    allFetchedAppointments = [];
    applyAppointmentFiltersAndRender();
  } finally {
    toggleLoader(false);
  }
}

async function handleFetchRegulations() {
  if (!currentPatient?.isenPK) {
    if (regulationsSection.style.display !== "none")
      showMessage(
        "ID do paciente (isenPK) não encontrado para buscar regulações."
      );
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = document.getElementById("regulation-date-initial").value
    ? new Date(
        document.getElementById("regulation-date-initial").value
      ).toLocaleDateString("pt-BR")
    : "";
  const dataFinal = document.getElementById("regulation-date-final").value
    ? new Date(
        document.getElementById("regulation-date-final").value
      ).toLocaleDateString("pt-BR")
    : "";

  toggleLoader(true);
  regulationsContent.innerHTML = "Carregando...";
  try {
    const regulationsData = await fetchAllRegulations({
      isenPK,
      dataInicial,
      dataFinal,
      type: currentRegulationFetchType,
    });
    allFetchedRegulations = regulationsData;
    applyRegulationFiltersAndRender();
  } catch (error) {
    showMessage(error.message);
    allFetchedRegulations = [];
    applyRegulationFiltersAndRender();
  } finally {
    toggleLoader(false);
  }
}

async function handleViewExamResult(event) {
  const button = event.target.closest(".view-exam-result-btn");
  if (!button) return;

  const newTab = window.open("", "_blank");
  newTab.document.write("Carregando resultado do exame...");

  const { idp, ids } = button.dataset;
  toggleLoader(true);
  try {
    const filePath = await fetchResultadoExame({ idp, ids });
    if (filePath) {
      const isAbsolute =
        filePath.startsWith("http://") || filePath.startsWith("https://");
      let pdfUrl = filePath;
      if (!isAbsolute) {
        const baseUrl = await getBaseUrl();
        pdfUrl =
          baseUrl.replace(/\/$/, "") +
          (filePath.startsWith("/") ? filePath : "/" + filePath);
      }
      newTab.location.href = pdfUrl;
    } else {
      newTab.document.body.innerHTML =
        '<div style="font-family:sans-serif;padding:2em;text-align:center;color:#b91c1c;">Nenhum arquivo de resultado encontrado.</div>';
    }
  } catch (error) {
    newTab.document.body.innerHTML = `<div style="font-family:sans-serif;padding:2em;text-align:center;color:#b91c1c;">Erro ao buscar resultado do exame:<br>${error.message}</div>`;
  } finally {
    toggleLoader(false);
  }
}

async function handleViewAppointmentDetails(event) {
  const button = event.target.closest(".view-appointment-details-btn");
  if (!button) return;

  const { idp, ids, type } = button.dataset;

  try {
    const baseUrl = await getBaseUrl();
    let finalUrl;

    if (type && type.toUpperCase().includes("EXAME")) {
      finalUrl = `${baseUrl}/sigss/agendamentoExame.jsp?id=${idp}`;
    } else {
      finalUrl = `${baseUrl}/sigss/consultaRapida.jsp?agcoPK.idp=${idp}&agcoPK.ids=${ids}`;
    }

    window.open(finalUrl, "_blank");
  } catch (error) {
    showMessage("Não foi possível construir a URL para o agendamento.");
    console.error(error);
  }
}

async function handleViewRegulationDetails(event) {
  const button = event.target.closest(".view-regulation-details-btn");
  if (!button) return;
  const { idp, ids } = button.dataset;
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/sigss/regulacaoRegulador/visualiza?reguPK.idp=${idp}&reguPK.ids=${ids}`;
    window.open(url, "_blank");
  } catch (error) {
    showMessage("Não foi possível construir a URL para a regulação.");
    console.error(error);
  }
}

function handleShowAppointmentInfo(event) {
  const button = event.target.closest(".appointment-info-btn");
  if (!button) return;

  const appointmentData = JSON.parse(button.dataset.appointment);
  modalTitle.textContent = "Detalhes do Agendamento";
  modalContent.innerHTML = `
        <p><strong>ID:</strong> ${appointmentData.id}</p>
        <p><strong>Tipo:</strong> ${
          appointmentData.isSpecialized
            ? "Especializada"
            : appointmentData.isOdonto
            ? "Odontológica"
            : appointmentData.type
        }</p>
        <p><strong>Status:</strong> ${appointmentData.status}</p>
        <p><strong>Data:</strong> ${appointmentData.date} às ${
    appointmentData.time
  }</p>
        <p><strong>Local:</strong> ${appointmentData.location}</p>
        <p><strong>Profissional:</strong> ${appointmentData.professional}</p>
        <p><strong>Especialidade:</strong> ${
          appointmentData.specialty || "N/A"
        }</p>
        <p><strong>Procedimento:</strong> ${appointmentData.description}</p>
    `;

  infoModal.classList.remove("hidden");
}

function handleSort(event, state, renderFunc) {
  const sortKey = event.target.closest("[data-sort-key]")?.dataset.sortKey;
  if (!sortKey) return;

  if (state.key === sortKey) {
    state.order = state.order === "asc" ? "desc" : "asc";
  } else {
    state.key = sortKey;
    state.order = "desc";
  }
  renderFunc();
}

function handleSaveFilterSet(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const nameInput = document.getElementById(`${prefix}-save-filter-name-input`);
  const name = nameInput.value.trim();
  if (!name) {
    showMessage("Por favor, insira um nome para o conjunto de filtros.");
    return;
  }

  if (!savedFilterSets[sectionKey]) {
    savedFilterSets[sectionKey] = [];
  }

  const existingIndex = savedFilterSets[sectionKey].findIndex(
    (set) => set.name === name
  );
  const filterValues = getFilterValues(sectionKey);

  const newSet = { name, values: filterValues };

  if (existingIndex > -1) {
    savedFilterSets[sectionKey][existingIndex] = newSet;
  } else {
    savedFilterSets[sectionKey].push(newSet);
  }

  saveFilterSetsToStorage();
  populateSavedFilterDropdown(sectionKey);
  document.getElementById(`${prefix}-saved-filters-select`).value = name;
  nameInput.value = "";
  showMessage(`Filtro "${name}" salvo com sucesso.`, "success");
}

function handleLoadFilterSet(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const select = document.getElementById(`${prefix}-saved-filters-select`);
  const name = select.value;
  if (!name) return;

  const set = (savedFilterSets[sectionKey] || []).find((s) => s.name === name);
  if (!set) return;

  Object.entries(set.values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === "checkbox") {
        el.checked = value;
      } else {
        el.value = value;
      }
    }
  });

  const renderFunc = applyFilterHandlers[sectionKey];
  if (typeof renderFunc === "function") {
    renderFunc();
  }
}

function handleDeleteFilterSet(sectionKey) {
  const prefix = idPrefixMap[sectionKey];
  const select = document.getElementById(`${prefix}-saved-filters-select`);
  const name = select.value;
  if (!name) {
    showMessage("Selecione um filtro para deletar.");
    return;
  }

  savedFilterSets[sectionKey] = (savedFilterSets[sectionKey] || []).filter(
    (set) => set.name !== name
  );
  saveFilterSetsToStorage();
  populateSavedFilterDropdown(sectionKey);
  showMessage(`Filtro "${name}" deletado.`, "success");
}

// --- Inicialização e Adição de Event Listeners ---

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

function addAllEventListeners() {
  // Busca
  searchInput.addEventListener("input", debounce(handleSearchInput, 500));
  searchInput.addEventListener("focus", async () => {
    if (searchInput.value.length > 0) return;
    renderRecentPatients();
    searchResultsList.classList.add("hidden");
    recentPatientsList.classList.remove("hidden");
  });
  searchResultsList.addEventListener("click", handleResultClick);
  recentPatientsList.addEventListener("click", handleResultClick);

  // Detalhes do Paciente
  toggleDetailsBtn.addEventListener("click", handleToggleDetails);

  // Eventos para cada seção usando delegação
  mainContent.addEventListener("click", (e) => {
    const target = e.target;
    const button = target.closest("button"); // Pega o botão mais próximo
    if (!button && !target.matches("button")) return; // Sai se não for um botão ou dentro de um

    const id = button ? button.id : target.id;

    // Botões de busca
    if (id.startsWith("fetch-")) {
      const sectionKey = id.split("-")[1];
      const fetchHandler = fetchHandlers[sectionKey];
      if (fetchHandler) fetchHandler();
      return;
    }

    // Botões de expandir/recolher
    if (id.startsWith("toggle-") && id.endsWith("-list-btn")) {
      const sectionKey = id.split("-")[1];
      const wrapper = document.getElementById(`${sectionKey}-wrapper`);
      if (wrapper) {
        wrapper.classList.toggle("show");
        target.textContent = wrapper.classList.contains("show")
          ? "Recolher"
          : "Expandir";
      }
      return;
    }

    // Botões de "Mais/Menos Filtros"
    if (id.startsWith("toggle-more-")) {
      const prefix = id.split("-")[2];
      const sectionKey = Object.keys(idPrefixMap).find(
        (key) => idPrefixMap[key] === prefix
      );
      const moreFiltersDiv = document.getElementById(`${prefix}-more-filters`);
      if (moreFiltersDiv && sectionKey) {
        moreFiltersDiv.classList.toggle("show");
        button.querySelector(".button-text").textContent =
          moreFiltersDiv.classList.contains("show")
            ? "Menos filtros"
            : "Mais filtros";
        const renderFunc = applyFilterHandlers[sectionKey];
        if (renderFunc) renderFunc();
      }
      return;
    }

    // Botões de Limpar Filtros
    if (id.startsWith("clear-")) {
      const prefix = id.split("-")[1];
      const sectionKey = Object.keys(idPrefixMap).find(
        (key) => idPrefixMap[key] === prefix
      );
      if (sectionKey) {
        (filterConfig[sectionKey] || []).forEach((filter) => {
          const el = document.getElementById(filter.id);
          if (el) {
            if (filter.type === "checkbox")
              el.checked = filter.defaultChecked || false;
            else if (filter.type === "select")
              el.value = filter.options[0].value;
            else el.value = "";
          }
        });
        const renderFunc = applyFilterHandlers[sectionKey];
        if (renderFunc) renderFunc();
      }
      return;
    }

    // Botões de Grupo (Tipo de busca, etc)
    if (target.matches("[class*='-btn']")) {
      const buttonGroup = target.parentElement;
      const filterId = buttonGroup.id;
      const sectionKey = Object.keys(filterConfig).find((key) =>
        filterConfig[key].some((f) => f.id === filterId)
      );

      if (sectionKey) {
        const fetchHandler = fetchHandlers[sectionKey];
        const renderFunc = applyFilterHandlers[sectionKey];

        if (filterId.includes("fetch-type")) {
          if (sectionKey === "consultations")
            currentConsultationFetchType = target.dataset.fetchType;
          if (sectionKey === "exams")
            currentExamFetchType = target.dataset.fetchType;
          if (sectionKey === "appointments")
            currentAppointmentFetchType = target.dataset.fetchType;
          if (sectionKey === "regulations")
            currentRegulationFetchType = target.dataset.fetchType;

          buttonGroup
            .querySelectorAll("button")
            .forEach((btn) => btn.classList.remove("btn-active"));
          target.classList.add("btn-active");

          if (fetchHandler) {
            fetchHandler();
          } else if (renderFunc) {
            // Se não houver fetch, apenas refiltra (ex: filtro de resultado de exames)
            renderFunc();
          }
        }
      }
      return;
    }

    // Listeners para salvar/deletar filtros
    if (id.endsWith("-save-filter-btn")) {
      const prefix = id.split("-")[0];
      const sectionKey = Object.keys(idPrefixMap).find(
        (key) => idPrefixMap[key] === prefix
      );
      if (sectionKey) handleSaveFilterSet(sectionKey);
    }
    if (id.endsWith("-delete-filter-btn")) {
      const prefix = id.split("-")[0];
      const sectionKey = Object.keys(idPrefixMap).find(
        (key) => idPrefixMap[key] === prefix
      );
      if (sectionKey) handleDeleteFilterSet(sectionKey);
    }
  });

  // Listeners para inputs e selects (com debounce)
  mainContent.addEventListener(
    "input",
    debounce((e) => {
      if (e.target.matches("input[type='text']")) {
        const prefix = e.target.id.split("-")[0];
        const sectionKey = Object.keys(idPrefixMap).find(
          (key) => idPrefixMap[key] === prefix
        );
        if (sectionKey) {
          const renderFunc = applyFilterHandlers[sectionKey];
          if (renderFunc) renderFunc();
        }
      }
    }, 300)
  );

  mainContent.addEventListener("change", (e) => {
    const target = e.target;
    const prefix = target.id.split("-")[0];
    const sectionKey = Object.keys(idPrefixMap).find(
      (key) => idPrefixMap[key] === prefix
    );

    if (sectionKey) {
      if (
        target.matches("select") ||
        target.matches("input[type='checkbox']")
      ) {
        const renderFunc = applyFilterHandlers[sectionKey];
        if (renderFunc) renderFunc();
      }
      if (target.id.endsWith("-saved-filters-select")) {
        handleLoadFilterSet(sectionKey);
      }
    }
  });

  // Listeners de conteúdo (ordenação e cliques em itens)
  consultationsContent.addEventListener("click", (e) => {
    const header = e.target.closest(".consultation-header");
    if (header) header.nextElementSibling.classList.toggle("show");
    handleSort(e, consultationSortState, applyConsultationFiltersAndRender);
  });
  examsContent.addEventListener("click", (e) => {
    handleViewExamResult(e);
    handleSort(e, examSortState, applyExamFiltersAndRender);
  });
  appointmentsContent.addEventListener("click", (e) => {
    if (e.target.closest(".view-appointment-details-btn"))
      handleViewAppointmentDetails(e);
    if (e.target.closest(".appointment-info-btn")) handleShowAppointmentInfo(e);
    handleSort(e, appointmentSortState, applyAppointmentFiltersAndRender);
  });
  regulationsContent.addEventListener("click", (e) => {
    handleViewRegulationDetails(e);
    handleSort(e, regulationSortState, applyRegulationFiltersAndRender);
  });

  // Listeners gerais
  document
    .getElementById("toggle-raw-html-btn")
    ?.addEventListener("click", () => {
      document.getElementById("raw-html-content").classList.toggle("show");
    });
  mainContent.addEventListener("click", async (event) => {
    const copyBtn = event.target.closest(".copy-icon");
    if (copyBtn) {
      const textToCopy = copyBtn.dataset.copyText;
      if (textToCopy) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyBtn.textContent = "✅";
          setTimeout(() => {
            copyBtn.textContent = "📄";
          }, 1000);
        } catch (err) {
          console.error("Falha ao copiar texto: ", err);
          copyBtn.textContent = "❌";
          setTimeout(() => {
            copyBtn.textContent = "📄";
          }, 1000);
        }
      }
    }
  });
  modalCloseBtn.addEventListener("click", () =>
    infoModal.classList.add("hidden")
  );
  infoModal.addEventListener("click", (event) => {
    if (event.target === infoModal) {
      infoModal.classList.add("hidden");
    }
  });
}

async function init() {
  await loadConfigAndData();
  renderAllFilterControls();
  applyUserPreferences();
  addAllEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
