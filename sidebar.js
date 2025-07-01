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
  getBaseUrl,
} from "./api.js";
// Importa a configuração de campos e a função de busca de valores
import { defaultFieldConfig, getNestedValue } from "./field-config.js";

// --- Seletores de Elementos do DOM ---
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
// Seletores de Consultas
const consultationsSection = document.getElementById("consultations-section");
const consultationsWrapper = document.getElementById("consultations-wrapper");
const toggleConsultationsListBtn = document.getElementById(
  "toggle-consultations-list-btn"
);
const dateInitialInput = document.getElementById("date-initial");
const dateFinalInput = document.getElementById("date-final");
const fetchTypeButtons = document.getElementById("fetch-type-buttons");
const hideNoShowCheckbox = document.getElementById("hide-no-show-checkbox");
const consultationsContent = document.getElementById("consultations-content");
const debugSection = document.getElementById("debug-section");
const toggleRawHtmlBtn = document.getElementById("toggle-raw-html-btn");
const rawHtmlContent = document.getElementById("raw-html-content");
// Seletores de Exames
const examsSection = document.getElementById("exams-section");
const examsWrapper = document.getElementById("exams-wrapper");
const toggleExamsListBtn = document.getElementById("toggle-exams-list-btn");
const examsContent = document.getElementById("exams-content");
const examDateInitialInput = document.getElementById("exam-date-initial");
const examDateFinalInput = document.getElementById("exam-date-final");
const examFetchTypeButtons = document.getElementById("exam-fetch-type-buttons");

// --- Variáveis de Estado ---
let currentPatient = null;
let recentPatients = [];
let currentFetchType = "all";
let allFetchedConsultations = [];
let currentExamFetchType = "all";
let fieldConfig = []; // Armazena a configuração da ficha

// --- Funções de Armazenamento ---
async function loadRecentPatients() {
  const data = await chrome.storage.local.get({ recentPatients: [] });
  recentPatients = data.recentPatients;
}

async function saveRecentPatient(patient) {
  const filtered = recentPatients.filter(
    (p) => p.idp !== patient.idp || p.ids !== patient.ids
  );
  const updatedList = [patient, ...filtered].slice(0, 5);
  recentPatients = updatedList;
  await chrome.storage.local.set({ recentPatients });
}

async function loadFieldConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ patientFields: defaultFieldConfig }, (data) => {
      const savedConfig = data.patientFields;
      fieldConfig = defaultFieldConfig.map((defaultField) => {
        const savedField = savedConfig.find((f) => f.id === defaultField.id);
        return savedField ? { ...defaultField, ...savedField } : defaultField;
      });
      resolve();
    });
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

    // CORRIGIDO: Converte explicitamente para String antes de usar .trim()
    const v1 = String(localValue || "").trim();
    const v2 = String(cadsusValue || "").trim();
    let icon = "";

    if (cadsusData && field.cadsusKey !== null) {
      const normalizePhone = (phone) =>
        (phone || "").replace(/\D/g, "").replace(/^55/, "");
      const compareV1 = field.id === "telefone" ? normalizePhone(v1) : v1;
      const compareV2 = field.id === "telefone" ? normalizePhone(v2) : v2;

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

    const rowHtml = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">${
      field.label
    }:</span><span class="${valueClass} text-right flex items-center">${
      v1 || "-"
    }${icon}</span></div>`;

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
  consultationsSection.style.display = "block";
  examsSection.style.display = "block";
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

function renderConsultations() {
  const hideNoShows = hideNoShowCheckbox.checked;
  const consultationsToRender = hideNoShows
    ? allFetchedConsultations.filter((c) => !c.isNoShow)
    : allFetchedConsultations;
  if (consultationsToRender.length === 0) {
    consultationsContent.innerHTML =
      '<p class="text-slate-500">Nenhuma consulta encontrada no período.</p>';
    return;
  }
  consultationsContent.innerHTML = consultationsToRender
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
                          )}</p>`
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
      '<p class="text-slate-500">Nenhum exame encontrado no período.</p>';
    return;
  }
  const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== "string") return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };
  exams.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (dateA && dateB) return dateB - dateA;
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
  examsContent.innerHTML = exams
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
            }</p>
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

// --- Preferências do Usuário ---
let userPreferences = {
  autoLoadExams: false,
  autoLoadConsultations: false,
  examWithResultDefault: true,
  examWithoutResultDefault: true,
  hideNoShowDefault: false,
  monthsBack: 6,
};

function applyUserPreferences() {
  if (
    userPreferences.examWithResultDefault &&
    userPreferences.examWithoutResultDefault
  ) {
    currentExamFetchType = "all";
  } else if (userPreferences.examWithResultDefault) {
    currentExamFetchType = "withResult";
  } else if (userPreferences.examWithoutResultDefault) {
    currentExamFetchType = "withoutResult";
  }

  examFetchTypeButtons
    .querySelectorAll(".exam-fetch-type-btn")
    .forEach((btn) => {
      btn.classList.remove("btn-active");
      if (btn.dataset.fetchType === currentExamFetchType) {
        btn.classList.add("btn-active");
      }
    });

  hideNoShowCheckbox.checked = userPreferences.hideNoShowDefault;
  const months = userPreferences.monthsBack || 6;
  const now = new Date();
  const initial = new Date();
  initial.setMonth(now.getMonth() - months);
  dateInitialInput.valueAsDate = initial;
  examDateInitialInput.valueAsDate = initial;
  dateFinalInput.valueAsDate = now;
  examDateFinalInput.valueAsDate = now;
}

async function loadUserPreferences() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        autoLoadExams: false,
        autoLoadConsultations: false,
        examWithResultDefault: true,
        examWithoutResultDefault: true,
        hideNoShowDefault: false,
        monthsBack: 6,
      },
      (prefs) => {
        userPreferences = prefs;
        applyUserPreferences();
        resolve();
      }
    );
  });
}

// --- Manipuladores de Eventos ---

async function handleResultClick(event) {
  const listItem = event.target.closest("li");
  if (!listItem || (!listItem.dataset.idp && !listItem.dataset.patient)) return;
  toggleLoader(true);
  clearMessage();
  consultationsContent.innerHTML = "";
  examsContent.innerHTML = "";
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
    showMessage("ID criptografado não encontrado.");
    return;
  }
  const dataInicial = dateInitialInput.value
    ? new Date(dateInitialInput.value).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = dateFinalInput.value
    ? new Date(dateFinalInput.value).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  toggleLoader(true);
  consultationsContent.innerHTML = "";
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
    jsonData.sort((a, b) => b.sortableDate - a.sortableDate);
    allFetchedConsultations = jsonData;
    renderConsultations();
    if (htmlData) {
      rawHtmlContent.textContent = htmlData;
      debugSection.style.display = "block";
    }
  } catch (error) {
    showMessage(error.message);
  } finally {
    toggleLoader(false);
  }
}

async function handleFetchExams() {
  if (!currentPatient?.fullPK) {
    showMessage("ID do paciente (isenPK) não encontrado.");
    return;
  }
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
  examsContent.innerHTML = "";
  try {
    const examsData = await fetchExamesSolicitados({
      isenPK: currentPatient.fullPK,
      dataInicial,
      dataFinal,
      comResultado,
      semResultado,
    });
    console.log("[DEBUG] Exames retornados:", examsData.length, examsData);
    renderExams(examsData);
  } catch (error) {
    showMessage(error.message);
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
  handleFetchExams();
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserPreferences();
  await loadFieldConfig();
  loadRecentPatients();
});
searchInput.addEventListener("input", debounce(handleSearchInput, 500));
searchInput.addEventListener("focus", handleSearchFocus);
searchResultsList.addEventListener("click", handleResultClick);
recentPatientsList.addEventListener("click", handleResultClick);
toggleDetailsBtn.addEventListener("click", handleToggleDetails);
fetchTypeButtons.addEventListener("click", handleFetchTypeChange);
hideNoShowCheckbox.addEventListener("change", () => renderConsultations());
toggleRawHtmlBtn.addEventListener("click", handleToggleRawHtml);
toggleConsultationsListBtn.addEventListener(
  "click",
  handleToggleConsultationsList
);
consultationsContent.addEventListener("click", handleConsultationClick);
toggleExamsListBtn.addEventListener("click", handleToggleExamsList);
examsContent.addEventListener("click", handleViewExamResult);
examFetchTypeButtons.addEventListener("click", handleExamFetchTypeChange);

dateFinalInput.valueAsDate = new Date();
const fiveYearsAgo = new Date();
fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
dateInitialInput.valueAsDate = fiveYearsAgo;
examDateFinalInput.valueAsDate = new Date();
examDateInitialInput.valueAsDate = fiveYearsAgo;
