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
// Seletores de Agendamentos
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
const appointmentsContent = document.getElementById("appointments-content");
// Seletores do Modal de Informações
const infoModal = document.getElementById("info-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

// --- Variáveis de Estado ---
let currentPatient = null;
let recentPatients = [];
let currentFetchType = "all";
let allFetchedConsultations = [];
let currentExamFetchType = "all";
let fieldConfig = [];

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

function renderAppointments(appointments) {
  if (appointments.length === 0) {
    appointmentsContent.innerHTML =
      '<p class="text-slate-500">Nenhum agendamento encontrado no período.</p>';
    return;
  }

  const statusStyles = {
    AGENDADO: "bg-blue-100 text-blue-800",
    PRESENTE: "bg-green-100 text-green-800",
    FALTOU: "bg-red-100 text-red-800",
    CANCELADO: "bg-yellow-100 text-yellow-800",
    ATENDIDO: "bg-purple-100 text-purple-800",
  };

  appointmentsContent.innerHTML = appointments
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

      // --- CORREÇÃO FINAL APLICADA AQUI ---
      // Extrai idp e ids corretamente com base no formato do 'item.id'.
      let idp, ids;
      const idParts = item.id.split("-");

      if (idParts[0].toLowerCase() === "exam") {
        // Se o ID começa com "exam", o formato é "exam-idp-ids".
        idp = idParts[1];
        ids = idParts[2];
      } else {
        // Para todos os outros casos (consultas), o formato é "idp-ids".
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
// --- Preferências do Usuário ---
let userPreferences = {
  autoLoadExams: false,
  autoLoadConsultations: false,
  hideNoShowDefault: false,
  monthsBack: 6,
};

async function loadUserPreferences() {
  userPreferences = await browser.storage.sync.get({
    autoLoadExams: false,
    autoLoadConsultations: false,
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
  dateFinalInput.valueAsDate = now;
  examDateFinalInput.valueAsDate = now;
  appointmentDateFinalInput.valueAsDate = now;
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

    await handleFetchAppointments();
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
    renderExams(examsData);
  } catch (error) {
    showMessage(error.message);
  } finally {
    toggleLoader(false);
  }
}

async function handleFetchAppointments() {
  if (!currentPatient?.fullPK) {
    showMessage("ID do paciente (isenPK) não encontrado.");
    return;
  }
  const dataInicial = appointmentDateInitialInput.value
    ? new Date(appointmentDateInitialInput.value).toLocaleDateString("pt-BR")
    : "01/01/1900";
  const dataFinal = appointmentDateFinalInput.value
    ? new Date(appointmentDateFinalInput.value).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  toggleLoader(true);
  appointmentsContent.innerHTML = "";
  try {
    const appointmentsData = await fetchAppointments({
      isenPK: currentPatient.fullPK,
      dataInicial,
      dataFinal,
    });
    renderAppointments(appointmentsData);
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

async function handleViewAppointmentDetails(event) {
  const button = event.target.closest(".view-appointment-details-btn");
  if (!button) return;

  // Extrai o idp, ids e o tipo do botão
  const { idp, ids, type } = button.dataset;

  try {
    const baseUrl = await getBaseUrl();
    let finalUrl;

    // Constrói a URL correta com base no tipo
    if (type && type.toUpperCase().includes("EXAME")) {
      // --- CORREÇÃO APLICADA AQUI ---
      // Para exames, abre a página de agendamento passando o IDP do exame.
      finalUrl = `${baseUrl}/sigss/agendamentoExame.jsp?id=${idp}`;
    } else {
      // Para consultas, mantém o comportamento de abrir a consulta rápida.
      finalUrl = `${baseUrl}/sigss/consultaRapida.jsp?agcoPK.idp=${idp}&agcoPK.ids=${ids}`;
    }

    window.open(finalUrl, "_blank");
  } catch (error) {
    showMessage("Não foi possível construir a URL para o agendamento.");
    console.error(error);
  }
}

function handleShowAppointmentInfo(event) {
  const button = event.target.closest(".appointment-info-btn");
  if (!button) return;

  const appointmentData = JSON.parse(button.dataset.appointment);

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

toggleAppointmentsListBtn.addEventListener(
  "click",
  handleToggleAppointmentsList
);
appointmentDateInitialInput.addEventListener("change", handleFetchAppointments);
appointmentDateFinalInput.addEventListener("change", handleFetchAppointments);

// ATUALIZADO: Listener unificado para os botões da seção de agendamentos
appointmentsContent.addEventListener("click", (event) => {
  const openBtn = event.target.closest(".view-appointment-details-btn");
  const infoBtn = event.target.closest(".appointment-info-btn");

  if (openBtn) {
    handleViewAppointmentDetails(event);
  } else if (infoBtn) {
    handleShowAppointmentInfo(event);
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
