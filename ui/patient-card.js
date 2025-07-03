/**
 * @file Módulo para gerir o card de "Dados do Paciente".
 */
import { getNestedValue } from "../utils.js";
import { store } from "../store.js";
import * as API from "../api.js";

// --- Elementos do DOM ---
let patientDetailsSection;
let patientMainInfoDiv;
let patientAdditionalInfoDiv;
let toggleDetailsBtn;
let fieldConfigLayout = [];

/**
 * Renderiza os detalhes do paciente no card.
 * @param {object} patientData - Os dados da ficha do paciente.
 */
async function render(patientData) {
  if (!patientDetailsSection || !patientData) {
    hide();
    return;
  }

  // Busca os dados do CADSUS apenas quando for renderizar
  const cadsusData = await API.fetchCadsusData({
    cpf: getNestedValue(patientData, "entidadeFisica.entfCPF"),
    cns: patientData.isenNumCadSus,
  });

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

    let localValue = getLocalValue(field, patientData);
    if (field.formatter) localValue = field.formatter(localValue);

    const cadsusValue = getCadsusValue(field, cadsusData);

    const v1 = String(localValue || "").trim();
    const v2 = String(cadsusValue || "").trim();
    let icon = "";

    if (cadsusData && field.cadsusKey !== null) {
      let compareV1 = v1,
        compareV2 = v2;
      if (field.id === "telefone") {
        compareV1 = v1.replace(/\D/g, "").replace(/^55/, "");
        compareV2 = v2.replace(/\D/g, "").replace(/^55/, "");
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

  toggleDetailsBtn.style.display = sortedFields.some(
    (f) => f.enabled && f.section === "more"
  )
    ? "block"
    : "none";
  patientDetailsSection.style.display = "block";
}

/**
 * Esconde o card de detalhes do paciente.
 */
export function hide() {
  if (patientDetailsSection) patientDetailsSection.style.display = "none";
}

/**
 * Manipula o clique no botão "Mostrar mais/menos".
 */
function handleToggleDetails() {
  patientAdditionalInfoDiv.classList.toggle("show");
  toggleDetailsBtn.textContent = patientAdditionalInfoDiv.classList.contains(
    "show"
  )
    ? "Mostrar menos"
    : "Mostrar mais";
}

/**
 * Função chamada quando o estado global muda.
 */
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
 */
export function init(config) {
  patientDetailsSection = document.getElementById("patient-details-section");
  patientMainInfoDiv = document.getElementById("patient-main-info");
  patientAdditionalInfoDiv = document.getElementById("patient-additional-info");
  toggleDetailsBtn = document.getElementById("toggle-details-btn");

  fieldConfigLayout = config;

  toggleDetailsBtn.addEventListener("click", handleToggleDetails);

  // Subscreve às mudanças do store
  store.subscribe(onStateChange);
}
