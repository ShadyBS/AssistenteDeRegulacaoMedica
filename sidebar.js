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
// Importa a configuração de campos e a função de busca de valores
import { defaultFieldConfig, getNestedValue } from "./field-config.js";

// --- Seletores de Elementos do DOM ---
const mainContent = document.getElementById("main-content");
const searchInput = document.getElementById("patient-search-input");
const searchResultsList = document.getElementById("search-results");
const recentPatientsList = document.getElementById("recent-patients-list");
const loader = document.getElementById("loader");
const messageArea = document.getElementById("message-area");
const patientDetailsSection = document.getElementById(
  "patient-details-section"
);
const patientMainInfoDiv = document.getElementById("patient-main-info");
const patientAdditionalInfoDiv = document.getElementById(
  "patient-additional-info"
);
const toggleDetailsBtn = document.getElementById("toggle-details-btn");

// --- Seletores de Consultas ---
const consultationsSection = document.getElementById("consultations-section");
const consultationsWrapper = document.getElementById("consultations-wrapper");
const toggleConsultationsListBtn = document.getElementById(
  "toggle-consultations-list-btn"
);
const dateInitialInput = document.getElementById("date-initial");
const dateFinalInput = document.getElementById("date-final");
const fetchConsultationsBtn = document.getElementById(
  "fetch-consultations-btn"
);
const fetchTypeButtons = document.getElementById("fetch-type-buttons");
const consultationsContent = document.getElementById("consultations-content");
const debugSection = document.getElementById("debug-section");
const toggleRawHtmlBtn = document.getElementById("toggle-raw-html-btn");
const rawHtmlContent = document.getElementById("raw-html-content");
const toggleMoreConsultationFiltersBtn = document.getElementById(
  "toggle-more-consultation-filters-btn"
);
const consultationMoreFiltersDiv = document.getElementById(
  "consultation-more-filters"
);
const consultationFilterKeyword = document.getElementById(
  "consultation-filter-keyword"
);
const hideNoShowCheckbox = document.getElementById("hide-no-show-checkbox");
const consultationFilterCid = document.getElementById(
  "consultation-filter-cid"
);
const consultationFilterSpecialty = document.getElementById(
  "consultation-filter-specialty"
);
const consultationFilterProfessional = document.getElementById(
  "consultation-filter-professional"
);
const consultationFilterUnit = document.getElementById(
  "consultation-filter-unit"
);
const clearConsultationFiltersBtn = document.getElementById(
  "clear-consultation-filters-btn"
);
const consultationActiveFiltersIndicator = document.getElementById(
  "consultation-active-filters-indicator"
);

// --- Seletores de Exames ---
const examsSection = document.getElementById("exams-section");
const examsWrapper = document.getElementById("exams-wrapper");
const toggleExamsListBtn = document.getElementById("toggle-exams-list-btn");
const examsContent = document.getElementById("exams-content");
const examDateInitialInput = document.getElementById("exam-date-initial");
const examDateFinalInput = document.getElementById("exam-date-final");
const fetchExamsBtn = document.getElementById("fetch-exams-btn");
const examFetchTypeButtons = document.getElementById("exam-fetch-type-buttons");
const toggleMoreExamFiltersBtn = document.getElementById(
  "toggle-more-exam-filters-btn"
);
const examMoreFiltersDiv = document.getElementById("exam-more-filters");
const examFilterName = document.getElementById("exam-filter-name");
const examFilterProfessional = document.getElementById(
  "exam-filter-professional"
);
const examFilterSpecialty = document.getElementById("exam-filter-specialty");
const clearExamFiltersBtn = document.getElementById("clear-exam-filters-btn");
const examActiveFiltersIndicator = document.getElementById(
  "exam-active-filters-indicator"
);

// --- Seletores de Agendamentos ---
const appointmentsSection = document.getElementById("appointments-section");
const appointmentsWrapper = document.getElementById("appointments-wrapper");
const toggleAppointmentsListBtn = document.getElementById(
  "toggle-appointments-list-btn"
);
const appointmentDateInitialInput = document.getElementById(
  "appointment-date-initial"
);
const appointmentDateFinalInput = document.getElementById(
  "appointment-date-final"
);
const fetchAppointmentsBtn = document.getElementById("fetch-appointments-btn");
const appointmentsContent = document.getElementById("appointments-content");
const appointmentFetchTypeButtons = document.getElementById(
  "appointment-fetch-type-buttons"
);
const toggleMoreAppointmentFiltersBtn = document.getElementById(
  "toggle-more-appointment-filters-btn"
);
const appointmentMoreFiltersDiv = document.getElementById(
  "appointment-more-filters"
);
const appointmentFilterStatus = document.getElementById(
  "appointment-filter-status"
);
const appointmentFilterTerm = document.getElementById(
  "appointment-filter-term"
);
const appointmentFilterLocation = document.getElementById(
  "appointment-filter-location"
);
const clearAppointmentFiltersBtn = document.getElementById(
  "clear-appointment-filters-btn"
);
const appointmentActiveFiltersIndicator = document.getElementById(
  "appointment-active-filters-indicator"
);

// --- Seletores de Regulação ---
const regulationsSection = document.getElementById("regulations-section");
const regulationsWrapper = document.getElementById("regulations-wrapper");
const toggleRegulationsListBtn = document.getElementById(
  "toggle-regulations-list-btn"
);
const regulationDateInitialInput = document.getElementById(
  "regulation-date-initial"
);
const regulationDateFinalInput = document.getElementById(
  "regulation-date-final"
);
const fetchRegulationsBtn = document.getElementById("fetch-regulations-btn");
const regulationsContent = document.getElementById("regulations-content");
const regulationFetchTypeButtons = document.getElementById(
  "regulation-fetch-type-buttons"
);
const toggleMoreRegulationFiltersBtn = document.getElementById(
  "toggle-more-regulation-filters-btn"
);
const regulationMoreFiltersDiv = document.getElementById(
  "regulation-more-filters"
);
const regulationFilterStatus = document.getElementById(
  "regulation-filter-status"
);
const regulationFilterPriority = document.getElementById(
  "regulation-filter-priority"
);
const regulationFilterProcedure = document.getElementById(
  "regulation-filter-procedure"
);
const regulationFilterRequester = document.getElementById(
  "regulation-filter-requester"
);
const clearRegulationFiltersBtn = document.getElementById(
  "clear-regulation-filters-btn"
);
const regulationActiveFiltersIndicator = document.getElementById(
  "regulation-active-filters-indicator"
);

// --- Seletores do Modal ---
const infoModal = document.getElementById("info-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

// --- Variáveis de Estado ---
let currentPatient = null;
let recentPatients = [];
let fieldConfig = [];
// Dados completos
let allFetchedConsultations = [];
let allFetchedExams = [];
let allFetchedAppointments = [];
let allFetchedRegulations = [];
// Tipos de busca
let currentFetchType = "all";
let currentExamFetchType = "all";
let currentAppointmentFetchType = "all";
let currentRegulationFetchType = "all";
// Estados de ordenação
let consultationSortState = { key: "date", order: "desc" };
let examSortState = { key: "date", order: "desc" };
let appointmentSortState = { key: "date", order: "desc" };
let regulationSortState = { key: "date", order: "desc" };

// --- Funções de Armazenamento ---
async function loadRecentPatients() {
  const data = await browser.storage.local.get({ recentPatients: [] });
  recentPatients = data.recentPatients;
}

async function saveRecentPatient(patient) {
  const filtered = recentPatients.filter(
    (p) => p.idp !== patient.idp || p.ids !== patient.ids
  );
  const updatedList = [patient, ...filtered].slice(0, 5);
  recentPatients = updatedList;
  await browser.storage.local.set({ recentPatients });
}

async function loadFieldConfig() {
  const data = await browser.storage.sync.get({
    patientFields: defaultFieldConfig,
  });
  const savedConfig = data.patientFields;
  fieldConfig = defaultFieldConfig.map((defaultField) => {
    const savedField = savedConfig.find((f) => f.id === defaultField.id);
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });
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
  // Assume dd/MM/yyyy
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

// --- Funções de Renderização ---

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

  const sortedFields = [...fieldConfig].sort((a, b) => a.order - b.order);

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
        <span class="sort-header w-1/3 text-right" data-sort-key="date">Data <span class="sort-indicator">${getSortIndicator(
          "date",
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
    MUITOALTA: "bg-orange-500 text-white",
    ALTA: "bg-yellow-500 text-black",
    NORMAL: "bg-blue-500 text-white",
    BAIXA: "bg-green-500 text-white",
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
        const statusKey = item.status
          .toUpperCase()
          .replace("ANALISE", "ANÁLISE");
        const style = statusStyles[statusKey] || "bg-gray-100 text-gray-800";

        const priorityKey = (item.priority || "")
          .toUpperCase()
          .replace(" ", "");
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

    if (key === "date") {
      valA = parseDate(a.date);
      valB = parseDate(b.date);
    } else if (key === "specialty" && a.sortableDate) {
      // Specific for consultations
      valA = a.sortableDate;
      valB = b.sortableDate;
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

function updateActiveFiltersIndicator(
  moreFiltersDiv,
  indicator,
  filterElements
) {
  const isShown = moreFiltersDiv.classList.contains("show");
  let activeCount = 0;
  filterElements.forEach((el) => {
    if (
      el.type === "select-one" &&
      el.value !== "todos" &&
      el.value !== "todas"
    ) {
      activeCount++;
    } else if (el.type === "text" && el.value.trim() !== "") {
      activeCount++;
    } else if (el.type === "checkbox" && el.checked) {
      // Specific case for checkboxes if needed, not currently in "more filters"
    }
  });

  if (activeCount > 0 && !isShown) {
    indicator.textContent = activeCount;
    indicator.classList.remove("hidden");
  } else {
    indicator.classList.add("hidden");
  }
}

function applyConsultationFiltersAndRender() {
  let filteredData = [...allFetchedConsultations];

  const keyword = consultationFilterKeyword.value.toLowerCase().trim();
  const hideNoShows = hideNoShowCheckbox.checked;
  const cid = consultationFilterCid.value.toLowerCase().trim();
  const specialty = consultationFilterSpecialty.value.toLowerCase().trim();
  const professional = consultationFilterProfessional.value
    .toLowerCase()
    .trim();
  const unit = consultationFilterUnit.value.toLowerCase().trim();

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
  updateActiveFiltersIndicator(
    consultationMoreFiltersDiv,
    consultationActiveFiltersIndicator,
    [
      fetchTypeButtons,
      consultationFilterCid,
      consultationFilterSpecialty,
      consultationFilterProfessional,
      consultationFilterUnit,
    ]
  );
}

function applyExamFiltersAndRender() {
  let filteredData = [...allFetchedExams];

  const name = examFilterName.value.toLowerCase().trim();
  const professional = examFilterProfessional.value.toLowerCase().trim();
  const specialty = examFilterSpecialty.value.toLowerCase().trim();

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
  updateActiveFiltersIndicator(examMoreFiltersDiv, examActiveFiltersIndicator, [
    examFilterProfessional,
    examFilterSpecialty,
  ]);
}

function applyAppointmentFiltersAndRender() {
  let filteredData = [...allFetchedAppointments];

  const status = appointmentFilterStatus.value;
  const term = appointmentFilterTerm.value.toLowerCase().trim();
  const location = appointmentFilterLocation.value.toLowerCase().trim();

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
  updateActiveFiltersIndicator(
    appointmentMoreFiltersDiv,
    appointmentActiveFiltersIndicator,
    [appointmentFilterTerm, appointmentFilterLocation]
  );
}

function applyRegulationFiltersAndRender() {
  let filteredData = [...allFetchedRegulations];

  const status = regulationFilterStatus.value;
  const priority = regulationFilterPriority.value;
  const procedureTerms = regulationFilterProcedure.value.toLowerCase().trim();
  const requesterTerms = regulationFilterRequester.value.toLowerCase().trim();

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
  updateActiveFiltersIndicator(
    regulationMoreFiltersDiv,
    regulationActiveFiltersIndicator,
    [
      regulationFilterPriority,
      regulationFilterProcedure,
      regulationFilterRequester,
    ]
  );
}

// --- Preferências do Usuário ---
let userPreferences = {
  autoLoadExams: false,
  autoLoadConsultations: false,
  autoLoadAppointments: false,
  autoLoadRegulations: false,
  hideNoShowDefault: false,
  monthsBack: 6,
};

async function loadUserPreferences() {
  userPreferences = await browser.storage.sync.get({
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    hideNoShowDefault: false,
    monthsBack: 6,
  });
}

function applyUserPreferences() {
  hideNoShowCheckbox.checked = userPreferences.hideNoShowDefault;
  const months = userPreferences.monthsBack || 6;
  const now = new Date();
  const initial = new Date();
  initial.setMonth(now.getMonth() - months);
  dateInitialInput.valueAsDate = initial;
  examDateInitialInput.valueAsDate = initial;
  appointmentDateInitialInput.valueAsDate = initial;
  regulationDateInitialInput.valueAsDate = initial;
  dateFinalInput.valueAsDate = now;
  examDateFinalInput.valueAsDate = now;
  appointmentDateFinalInput.valueAsDate = now;
  regulationDateFinalInput.valueAsDate = now;
}

// --- Manipuladores de Eventos ---

async function handleResultClick(event) {
  const listItem = event.target.closest("li");
  if (!listItem || (!listItem.dataset.idp && !listItem.dataset.patient)) return;
  toggleLoader(true);
  clearMessage();
  consultationsContent.innerHTML = "";
  examsContent.innerHTML = "";
  appointmentsContent.innerHTML = "";
  regulationsContent.innerHTML = "";
  rawHtmlContent.textContent = "";
  debugSection.style.display = "none";
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

    if (userPreferences.autoLoadRegulations) {
      await handleFetchRegulations();
    }
    if (userPreferences.autoLoadAppointments) {
      await handleFetchAppointments();
    }
    if (userPreferences.autoLoadConsultations) {
      await handleFetchConsultations();
    }
    if (userPreferences.autoLoadExams) {
      await handleFetchExams();
    }
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
  debugSection.style.display = "none";
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
    if (consultationsSection.style.display !== "none") {
      showMessage("ID criptografado não encontrado.");
    }
    return;
  }
  const dataInicial = dateInitialInput.value
    ? new Date(dateInitialInput.value).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = dateFinalInput.value
    ? new Date(dateFinalInput.value).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  toggleLoader(true);
  consultationsContent.innerHTML = "Carregando...";
  rawHtmlContent.textContent = "";
  debugSection.style.display = "none";
  try {
    let fetchFunction;
    switch (currentFetchType) {
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
      rawHtmlContent.textContent = htmlData;
      debugSection.style.display = "block";
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
    if (examsSection.style.display !== "none") {
      showMessage("ID do paciente (isenPK) não encontrado.");
    }
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = examDateInitialInput.value
    ? new Date(examDateInitialInput.value).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = examDateFinalInput.value
    ? new Date(examDateFinalInput.value).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  let comResultado = false;
  let semResultado = false;

  switch (currentExamFetchType) {
    case "withResult":
      comResultado = true;
      semResultado = false;
      break;
    case "withoutResult":
      comResultado = false;
      semResultado = true;
      break;
    default: // 'all'
      comResultado = true;
      semResultado = true;
      break;
  }

  toggleLoader(true);
  examsContent.innerHTML = "Carregando...";
  try {
    const examsData = await fetchExamesSolicitados({
      isenPK: isenPK,
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
    if (appointmentsSection.style.display !== "none") {
      showMessage("ID do paciente (isenPK) não encontrado.");
    }
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = appointmentDateInitialInput.value
    ? new Date(appointmentDateInitialInput.value).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = appointmentDateFinalInput.value
    ? new Date(appointmentDateFinalInput.value).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  toggleLoader(true);
  appointmentsContent.innerHTML = "Carregando...";
  try {
    const appointmentsData = await fetchAppointments({
      isenPK: isenPK,
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
    if (regulationsSection.style.display !== "none") {
      showMessage(
        "ID do paciente (isenPK) não encontrado para buscar regulações."
      );
    }
    return;
  }
  const isenPK = `${currentPatient.isenPK.idp}-${currentPatient.isenPK.ids}`;
  const dataInicial = regulationDateInitialInput.value
    ? new Date(regulationDateInitialInput.value).toLocaleDateString("pt-BR")
    : "";
  const dataFinal = regulationDateFinalInput.value
    ? new Date(regulationDateFinalInput.value).toLocaleDateString("pt-BR")
    : "";

  toggleLoader(true);
  regulationsContent.innerHTML = "Carregando...";
  try {
    const regulationsData = await fetchAllRegulations({
      isenPK: isenPK,
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
    newTab.document.body.innerHTML = `<div style=\"font-family:sans-serif;padding:2em;text-align:center;color:#b91c1c;\">Erro ao buscar resultado do exame:<br>${error.message}</div>`;
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

function handleToggleRawHtml() {
  rawHtmlContent.classList.toggle("show");
}
function handleToggleConsultationsList() {
  consultationsWrapper.classList.toggle("show");
  toggleConsultationsListBtn.textContent =
    consultationsWrapper.classList.contains("show") ? "Recolher" : "Expandir";
}
function handleToggleExamsList() {
  examsWrapper.classList.toggle("show");
  toggleExamsListBtn.textContent = examsWrapper.classList.contains("show")
    ? "Recolher"
    : "Expandir";
}
function handleToggleAppointmentsList() {
  appointmentsWrapper.classList.toggle("show");
  toggleAppointmentsListBtn.textContent =
    appointmentsWrapper.classList.contains("show") ? "Recolher" : "Expandir";
}

function handleToggleRegulationsList() {
  regulationsWrapper.classList.toggle("show");
  toggleRegulationsListBtn.textContent = regulationsWrapper.classList.contains(
    "show"
  )
    ? "Recolher"
    : "Expandir";
}

function handleConsultationClick(event) {
  const header = event.target.closest(".consultation-header");
  if (!header) return;
  const body = header.nextElementSibling;
  body.classList.toggle("show");
}
async function handleSearchFocus() {
  if (searchInput.value.length > 0) return;
  await loadRecentPatients();
  renderRecentPatients();
  searchResultsList.classList.add("hidden");
  recentPatientsList.classList.remove("hidden");
}

function handleFetchTypeChange(event) {
  const button = event.target.closest(".fetch-type-btn");
  if (!button) return;
  fetchTypeButtons.querySelectorAll(".fetch-type-btn").forEach((btn) => {
    btn.classList.remove("btn-active", "text-white");
    btn.classList.add("text-slate-600", "hover:bg-slate-200");
  });
  button.classList.add("btn-active", "text-white");
  button.classList.remove("text-slate-600", "hover:bg-slate-200");
  currentFetchType = button.dataset.fetchType;
  handleFetchConsultations();
}

function handleExamFetchTypeChange(event) {
  const button = event.target.closest(".exam-fetch-type-btn");
  if (!button) return;
  examFetchTypeButtons
    .querySelectorAll(".exam-fetch-type-btn")
    .forEach((btn) => {
      btn.classList.remove("btn-active", "text-white");
      btn.classList.add("text-slate-600", "hover:bg-slate-200");
    });
  button.classList.add("btn-active", "text-white");
  button.classList.remove("text-slate-600", "hover:bg-slate-200");
  currentExamFetchType = button.dataset.fetchType;
  applyExamFiltersAndRender();
}

function handleRegulationFetchTypeChange(event) {
  const button = event.target.closest(".regulation-fetch-type-btn");
  if (!button) return;
  regulationFetchTypeButtons
    .querySelectorAll(".regulation-fetch-type-btn")
    .forEach((btn) => {
      btn.classList.remove("btn-active", "text-white");
      btn.classList.add("text-slate-600", "hover:bg-slate-200");
    });
  button.classList.add("btn-active", "text-white");
  button.classList.remove("text-slate-600", "hover:bg-slate-200");
  currentRegulationFetchType = button.dataset.fetchType;
  handleFetchRegulations();
}

function handleAppointmentFetchTypeChange(event) {
  const button = event.target.closest(".appointment-fetch-type-btn");
  if (!button) return;
  appointmentFetchTypeButtons
    .querySelectorAll(".appointment-fetch-type-btn")
    .forEach((btn) => {
      btn.classList.remove("btn-active", "text-white");
      btn.classList.add("text-slate-600", "hover:bg-slate-200");
    });
  button.classList.add("btn-active", "text-white");
  button.classList.remove("text-slate-600", "hover:bg-slate-200");
  currentAppointmentFetchType = button.dataset.fetchType;
  applyAppointmentFiltersAndRender();
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

// --- Inicialização ---
async function init() {
  await loadUserPreferences();
  applyUserPreferences();
  await loadFieldConfig();
  await loadRecentPatients();
}

document.addEventListener("DOMContentLoaded", init);
searchInput.addEventListener("input", debounce(handleSearchInput, 500));
searchInput.addEventListener("focus", handleSearchFocus);
searchResultsList.addEventListener("click", handleResultClick);
recentPatientsList.addEventListener("click", handleResultClick);
toggleDetailsBtn.addEventListener("click", handleToggleDetails);

// Event Listeners para Consultas
toggleConsultationsListBtn.addEventListener(
  "click",
  handleToggleConsultationsList
);
consultationsContent.addEventListener("click", (e) => {
  handleConsultationClick(e);
  handleSort(e, consultationSortState, applyConsultationFiltersAndRender);
});
toggleRawHtmlBtn.addEventListener("click", handleToggleRawHtml);
fetchConsultationsBtn.addEventListener("click", handleFetchConsultations);
fetchTypeButtons.addEventListener("click", handleFetchTypeChange);
consultationFilterKeyword.addEventListener(
  "input",
  debounce(applyConsultationFiltersAndRender, 500)
);
hideNoShowCheckbox.addEventListener(
  "change",
  applyConsultationFiltersAndRender
);
consultationFilterCid.addEventListener(
  "input",
  debounce(applyConsultationFiltersAndRender, 500)
);
consultationFilterSpecialty.addEventListener(
  "input",
  debounce(applyConsultationFiltersAndRender, 500)
);
consultationFilterProfessional.addEventListener(
  "input",
  debounce(applyConsultationFiltersAndRender, 500)
);
consultationFilterUnit.addEventListener(
  "input",
  debounce(applyConsultationFiltersAndRender, 500)
);
toggleMoreConsultationFiltersBtn.addEventListener("click", () => {
  consultationMoreFiltersDiv.classList.toggle("show");
  const buttonText =
    toggleMoreConsultationFiltersBtn.querySelector(".button-text");
  buttonText.textContent = consultationMoreFiltersDiv.classList.contains("show")
    ? "Menos filtros"
    : "Mais filtros";
  applyConsultationFiltersAndRender();
});
clearConsultationFiltersBtn.addEventListener("click", () => {
  consultationFilterKeyword.value = "";
  hideNoShowCheckbox.checked = false;
  consultationFilterCid.value = "";
  consultationFilterSpecialty.value = "";
  consultationFilterProfessional.value = "";
  consultationFilterUnit.value = "";
  applyConsultationFiltersAndRender();
});

// Event Listeners para Exames
toggleExamsListBtn.addEventListener("click", handleToggleExamsList);
examsContent.addEventListener("click", (e) => {
  handleViewExamResult(e);
  handleSort(e, examSortState, applyExamFiltersAndRender);
});
fetchExamsBtn.addEventListener("click", handleFetchExams);
examFetchTypeButtons.addEventListener("click", handleExamFetchTypeChange);
examFilterName.addEventListener(
  "input",
  debounce(applyExamFiltersAndRender, 500)
);
examFilterProfessional.addEventListener(
  "input",
  debounce(applyExamFiltersAndRender, 500)
);
examFilterSpecialty.addEventListener(
  "input",
  debounce(applyExamFiltersAndRender, 500)
);
toggleMoreExamFiltersBtn.addEventListener("click", () => {
  examMoreFiltersDiv.classList.toggle("show");
  const buttonText = toggleMoreExamFiltersBtn.querySelector(".button-text");
  buttonText.textContent = examMoreFiltersDiv.classList.contains("show")
    ? "Menos filtros"
    : "Mais filtros";
  applyExamFiltersAndRender();
});
clearExamFiltersBtn.addEventListener("click", () => {
  examFilterName.value = "";
  examFilterProfessional.value = "";
  examFilterSpecialty.value = "";
  applyExamFiltersAndRender();
});

// Event Listeners para Agendamentos
toggleAppointmentsListBtn.addEventListener(
  "click",
  handleToggleAppointmentsList
);
fetchAppointmentsBtn.addEventListener("click", handleFetchAppointments);
appointmentFetchTypeButtons.addEventListener(
  "click",
  handleAppointmentFetchTypeChange
);
appointmentFilterStatus.addEventListener(
  "change",
  applyAppointmentFiltersAndRender
);
appointmentFilterTerm.addEventListener(
  "input",
  debounce(applyAppointmentFiltersAndRender, 500)
);
appointmentFilterLocation.addEventListener(
  "input",
  debounce(applyAppointmentFiltersAndRender, 500)
);
toggleMoreAppointmentFiltersBtn.addEventListener("click", () => {
  appointmentMoreFiltersDiv.classList.toggle("show");
  const buttonText =
    toggleMoreAppointmentFiltersBtn.querySelector(".button-text");
  buttonText.textContent = appointmentMoreFiltersDiv.classList.contains("show")
    ? "Menos filtros"
    : "Mais filtros";
  applyAppointmentFiltersAndRender();
});
appointmentsContent.addEventListener("click", (event) => {
  const openBtn = event.target.closest(".view-appointment-details-btn");
  const infoBtn = event.target.closest(".appointment-info-btn");
  if (openBtn) {
    handleViewAppointmentDetails(event);
  } else if (infoBtn) {
    handleShowAppointmentInfo(event);
  }
  handleSort(event, appointmentSortState, applyAppointmentFiltersAndRender);
});
clearAppointmentFiltersBtn.addEventListener("click", () => {
  appointmentFilterStatus.value = "todos";
  appointmentFilterTerm.value = "";
  appointmentFilterLocation.value = "";
  applyAppointmentFiltersAndRender();
});

// Event Listeners para Regulação
toggleRegulationsListBtn.addEventListener("click", handleToggleRegulationsList);
fetchRegulationsBtn.addEventListener("click", handleFetchRegulations);
regulationFetchTypeButtons.addEventListener(
  "click",
  handleRegulationFetchTypeChange
);
regulationFilterStatus.addEventListener(
  "change",
  applyRegulationFiltersAndRender
);
regulationFilterPriority.addEventListener(
  "change",
  applyRegulationFiltersAndRender
);
regulationFilterProcedure.addEventListener(
  "input",
  debounce(applyRegulationFiltersAndRender, 500)
);
regulationFilterRequester.addEventListener(
  "input",
  debounce(applyRegulationFiltersAndRender, 500)
);
toggleMoreRegulationFiltersBtn.addEventListener("click", () => {
  regulationMoreFiltersDiv.classList.toggle("show");
  const buttonText =
    toggleMoreRegulationFiltersBtn.querySelector(".button-text");
  buttonText.textContent = regulationMoreFiltersDiv.classList.contains("show")
    ? "Menos filtros"
    : "Mais filtros";
  applyRegulationFiltersAndRender();
});
regulationsContent.addEventListener("click", (e) => {
  handleViewRegulationDetails(e);
  handleSort(e, regulationSortState, applyRegulationFiltersAndRender);
});
clearRegulationFiltersBtn.addEventListener("click", () => {
  regulationFilterStatus.value = "todos";
  regulationFilterPriority.value = "todas";
  regulationFilterProcedure.value = "";
  regulationFilterRequester.value = "";
  applyRegulationFiltersAndRender();
});

// Event Listeners Gerais
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
