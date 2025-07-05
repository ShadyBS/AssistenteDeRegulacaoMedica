/**
 * @file Módulo para gerir o card de "Dados do Paciente".
 */
import { getNestedValue } from "../utils.js";
import { store } from "../store.js";

let patientDetailsSection,
  patientMainInfoDiv,
  patientAdditionalInfoDiv,
  toggleDetailsBtn,
  patientCardFooter,
  cadsusTimestamp,
  refreshCadsusBtn;
let fieldConfigLayout = [];
let onForceRefresh; // Callback para forçar a atualização

/**
 * Renderiza os detalhes do paciente no card.
 * @param {object} patientData - O objeto completo do paciente vindo do store.
 */
function render(patientData) {
  if (!patientDetailsSection || !patientData || !patientData.ficha) {
    hide();
    return;
  }

  const { ficha, cadsus, lastCadsusCheck, isUpdating } = patientData;

  patientMainInfoDiv.innerHTML = "";
  patientAdditionalInfoDiv.innerHTML = "";

  const getLocalValue = (field, data) => {
    if (typeof field.key === "function") return field.key(data);
    return getNestedValue(data, field.key);
  };

  const getCadsusValue = (field, data) => {
    if (!data || field.cadsusKey === null) return null;
    if (typeof field.cadsusKey === "function") return field.cadsusKey(data);
    return data[field.cadsusKey];
  };

  const sortedFields = [...fieldConfigLayout].sort((a, b) => a.order - b.order);

  sortedFields.forEach((field) => {
    if (!field.enabled) return;

    let localValue = getLocalValue(field, ficha);
    if (field.formatter) localValue = field.formatter(localValue);

    let cadsusValue = getCadsusValue(field, cadsus);
    if (field.formatter) cadsusValue = field.formatter(cadsusValue);

    const v1 = String(localValue || "").trim();
    const v2 = String(cadsusValue || "").trim();
    let icon = "";

    // --- INÍCIO DA CORREÇÃO ---
    // A comparação só é feita se o CADSUS foi carregado E se o campo atual
    // tem uma chave de mapeamento para o CADSUS (cadsusKey não é nula).
    if (cadsus && field.cadsusKey !== null) {
      let compareV1 = v1,
        compareV2 = v2;
      if (field.id === "telefone") {
        compareV1 = v1.replace(/\D/g, "").replace(/^55/, "");
        compareV2 = v2.replace(/\D/g, "").replace(/^55/, "");
      }
      if (compareV1 && compareV1.toUpperCase() === compareV2.toUpperCase()) {
        icon = `<span class="comparison-icon" title="Dado confere com o CADSUS">✅</span>`;
      } else {
        const tooltipText = `Ficha: ${v1 || "Vazio"}\nCADSUS: ${v2 || "Vazio"}`;
        icon = `<span class="comparison-icon" data-tooltip="${tooltipText}">⚠️</span>`;
      }
    }
    // --- FIM DA CORREÇÃO ---

    const valueClass =
      field.id.toLowerCase().includes("alerg") && v1 && v1 !== "-"
        ? "text-red-600 font-bold"
        : "text-slate-900";
    const copyIcon = v1
      ? `<span class="copy-icon" title="Copiar" data-copy-text="${v1}">📄</span>`
      : "";
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

  // Atualiza o rodapé do card
  if (lastCadsusCheck) {
    cadsusTimestamp.textContent = `CADSUS verificado em: ${lastCadsusCheck.toLocaleString()}`;
    patientCardFooter.style.display = "flex";
  } else {
    cadsusTimestamp.textContent = "Não foi possível verificar dados do CADSUS.";
    patientCardFooter.style.display = "flex";
  }

  // Controla o estado do botão de refresh
  refreshCadsusBtn
    .querySelector(".refresh-icon")
    .classList.toggle("spinning", isUpdating);
  refreshCadsusBtn.disabled = isUpdating;

  toggleDetailsBtn.style.display = sortedFields.some(
    (f) => f.enabled && f.section === "more"
  )
    ? "block"
    : "none";
  patientDetailsSection.style.display = "block";
}

function hide() {
  if (patientDetailsSection) patientDetailsSection.style.display = "none";
}

function handleToggleDetails() {
  patientAdditionalInfoDiv.classList.toggle("show");
  toggleDetailsBtn.textContent = patientAdditionalInfoDiv.classList.contains(
    "show"
  )
    ? "Mostrar menos"
    : "Mostrar mais";
}

function handleForceRefresh() {
  const patient = store.getPatient();
  if (patient && patient.ficha && onForceRefresh) {
    onForceRefresh(
      { idp: patient.ficha.isenPK.idp, ids: patient.ficha.isenPK.ids },
      true
    );
  }
}

function onStateChange() {
  const patient = store.getPatient();
  if (patient) {
    render(patient);
  } else {
    hide();
  }
}

/**
 * Inicializa o módulo do card de paciente.
 * @param {Array<object>} config - A configuração dos campos da ficha.
 * @param {object} callbacks - Funções de callback.
 * @param {Function} callbacks.onForceRefresh - Função para forçar a atualização.
 */
export function init(config, callbacks) {
  patientDetailsSection = document.getElementById("patient-details-section");
  patientMainInfoDiv = document.getElementById("patient-main-info");
  patientAdditionalInfoDiv = document.getElementById("patient-additional-info");
  toggleDetailsBtn = document.getElementById("toggle-details-btn");
  patientCardFooter = document.getElementById("patient-card-footer");
  cadsusTimestamp = document.getElementById("cadsus-timestamp");
  refreshCadsusBtn = document.getElementById("refresh-cadsus-btn");

  fieldConfigLayout = config;
  onForceRefresh = callbacks.onForceRefresh;

  toggleDetailsBtn.addEventListener("click", handleToggleDetails);
  refreshCadsusBtn.addEventListener("click", handleForceRefresh);

  store.subscribe(onStateChange);
}
