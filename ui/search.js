/**
 * @file Módulo para gerir a funcionalidade de busca de pacientes.
 */
import * as API from "../api.js";
import * as Utils from "../utils.js";
import { store } from "../store.js";
// ✅ SEGURANÇA: Import estático para evitar dynamic imports inseguros
import { validateCPF, validateCNS, validateBrazilianDate, validateSearchTerm } from '../validation.js';

let searchInput;
let searchResultsList;
let recentPatientsList;
let onSelectPatient; // Callback para notificar o sidebar sobre a seleção

function renderSearchResults(patients) {
  if (!searchResultsList) return;
  if (patients.length === 0) {
    searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>`;
    return;
  }
  searchResultsList.innerHTML = patients
    .map(
      (p) =>
        `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition" data-idp="${
          p.idp
        }" data-ids="${p.ids}">${renderPatientListItem(p)}</li>`
    )
    .join("");
}

/**
 * Renderiza a lista de pacientes recentes a partir do store.
 */
function renderRecentPatients() {
  if (!recentPatientsList) return;
  const recents = store.getRecentPatients() || [];
  recentPatientsList.innerHTML =
    '<li class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400">PACIENTES RECENTES</li>' +
    (recents.length === 0
      ? `<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente recente.</li>`
      : recents
          .map((p) => {
            // CORREÇÃO: Lida com a estrutura de dados antiga e nova dos pacientes recentes.
            const fichaData = p.ficha || p; // Se p.ficha não existe, 'p' é o próprio objeto da ficha.
            const idp = fichaData.isenPK?.idp || fichaData.idp;
            const ids = fichaData.isenPK?.ids || fichaData.ids;

            if (!idp || !ids) return ""; // Pula a renderização se o item estiver malformado.

            return `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition recent-patient-item" data-idp="${idp}" data-ids="${ids}">${renderPatientListItem(
              fichaData
            )}</li>`;
          })
          .join(""));
}

function renderPatientListItem(patient) {
  const nome =
    patient.value ||
    Utils.getNestedValue(patient, "entidadeFisica.entidade.entiNome") ||
    "Nome não informado";
  const idp = patient.idp || patient.isenPK?.idp;
  const ids = patient.ids || patient.isenPK?.ids;
  const dataNascimento =
    patient.dataNascimento ||
    Utils.getNestedValue(patient, "entidadeFisica.entfDtNasc");
  const cpf =
    patient.cpf || Utils.getNestedValue(patient, "entidadeFisica.entfCPF");
  const cns = patient.cns || patient.isenNumCadSus;
  return `
      <div class="font-medium text-slate-800">${nome}</div>
      <div class="grid grid-cols-2 gap-x-4 text-xs text-slate-500 mt-1">
        <span><strong class="font-semibold">Cód:</strong> ${idp}-${ids}</span>
        <span><strong class="font-semibold">Nasc:</strong> ${
          dataNascimento || "-"
        }</span>
        <span><strong class="font-semibold">CPF:</strong> ${cpf || "-"}</span>
        <span><strong class="font-semibold">CNS:</strong> ${cns || "-"}</span>
      </div>
    `;
}

/**
 * Detecta o tipo de input baseado no padrão do valor
 * @param {string} value - Valor a ser analisado
 * @returns {string} Tipo detectado: 'cpf', 'cns', 'date', 'text'
 */
function detectInputType(value) {
  if (!value || typeof value !== 'string') return 'text';

  const cleanValue = value.trim();

  // Detecta CPF (xxx.xxx.xxx-xx ou 11 dígitos)
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cleanValue)) {
    return 'cpf';
  }

  // Detecta CNS (15 dígitos)
  if (/^\d{15}$/.test(cleanValue.replace(/\D/g, ''))) {
    return 'cns';
  }

  // Detecta data brasileira (dd/mm/yyyy ou dd/mm/yy)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cleanValue)) {
    return 'date';
  }

  // Detecta possível CPF parcial (para dar feedback antecipado)
  if (/^\d{3}\.?\d{0,3}\.?\d{0,3}-?\d{0,2}$/.test(cleanValue) && cleanValue.length >= 7) {
    return 'cpf';
  }

  // Detecta possível CNS parcial
  if (/^\d{10,14}$/.test(cleanValue.replace(/\D/g, ''))) {
    return 'cns';
  }

  return 'text';
}

const handleSearchInput = Utils.debounce(async () => {
  const searchTerm = searchInput.value.trim();

  store.clearPatient();
  recentPatientsList.classList.add("hidden");
  searchResultsList.classList.remove("hidden");

  if (searchTerm.length < 1) {
    searchResultsList.innerHTML = "";
    return;
  }

  // ✅ SEGURANÇA: Usando imports estáticos já disponíveis no topo do arquivo

  // Detect input type and apply specific validation
  const inputType = detectInputType(searchTerm);
  let validation = { valid: true };

  switch (inputType) {
    case 'cpf':
      validation = validateCPF(searchTerm);
      if (!validation.valid) {
        searchInput.classList.add('border-red-500', 'bg-red-50');
        searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-red-600">
          <div class="font-medium">CPF Inválido</div>
          <div class="text-xs mt-1">${validation.message}</div>
        </li>`;
        return;
      }
      break;

    case 'cns':
      validation = validateCNS(searchTerm);
      if (!validation.valid) {
        searchInput.classList.add('border-red-500', 'bg-red-50');
        searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-red-600">
          <div class="font-medium">CNS Inválido</div>
          <div class="text-xs mt-1">${validation.message}</div>
        </li>`;
        return;
      }
      break;

    case 'date':
      validation = validateBrazilianDate(searchTerm);
      if (!validation.valid) {
        searchInput.classList.add('border-red-500', 'bg-red-50');
        searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-red-600">
          <div class="font-medium">Data Inválida</div>
          <div class="text-xs mt-1">${validation.message}</div>
          <div class="text-xs mt-1 text-gray-500">Formato esperado: dd/mm/aaaa</div>
        </li>`;
        return;
      }
      break;

    case 'text':
    default:
      validation = validateSearchTerm(searchTerm);
      if (!validation.valid) {
        searchInput.classList.add('border-red-500', 'bg-red-50');
        searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-red-600">
          <div class="font-medium">Termo de Busca Inválido</div>
          <div class="text-xs mt-1">${validation.message}</div>
        </li>`;
        return;
      }
      break;
  }

  // Remove estilos de erro se a validação passou
  searchInput.classList.remove('border-red-500', 'bg-red-50');

  Utils.toggleLoader(true);
  try {
    // Use sanitized search term for API call
    const sanitizedTerm = validation.sanitized || searchTerm;
    const patients = await API.searchPatients(sanitizedTerm);
    renderSearchResults(patients);
  } catch (error) {
    // Handle validation errors from API
    if (error.message.includes('Invalid search term') ||
        error.message.includes('CPF inválido') ||
        error.message.includes('CNS inválido')) {
      searchResultsList.innerHTML = `<li class="px-4 py-3 text-sm text-red-600">
        <div class="font-medium">Erro de Validação</div>
        <div class="text-xs mt-1">${error.message}</div>
      </li>`;
    } else {
      Utils.showMessage("Erro ao buscar pacientes.");
    }
  } finally {
    Utils.toggleLoader(false);
  }
}, 500);

function handleSearchFocus() {
  // Remove estilos de erro ao focar
  if (searchInput) {
    searchInput.classList.remove('border-red-500', 'bg-red-50');
  }

  if (searchInput.value.length > 0) return;
  renderRecentPatients();
  searchResultsList.classList.add("hidden");
  recentPatientsList.classList.remove("hidden");
}

function handleSearchBlur() {
  setTimeout(() => {
    searchResultsList.classList.add("hidden");
    recentPatientsList.classList.add("hidden");
  }, 200);
}

async function handleResultClick(event) {
  const listItem = event.target.closest("li[data-idp]");
  if (!listItem) return;

  const { idp, ids } = listItem.dataset;

  if (listItem.classList.contains("recent-patient-item")) {
    const recentPatient = store.getRecentPatients().find((p) => {
      // CORREÇÃO: Lida com a estrutura de dados antiga e nova.
      const patientIdp = p.ficha ? p.ficha.isenPK.idp : p.idp;
      return patientIdp == idp;
    });

    // Se o paciente foi encontrado e tem a nova estrutura (com cache), usa os dados do cache.
    if (recentPatient && recentPatient.ficha) {
      store.setPatient(recentPatient.ficha, recentPatient.cadsus);
      searchInput.value = "";
      searchResultsList.classList.add("hidden");
      recentPatientsList.classList.add("hidden");
      return;
    }
  }

  // Para pacientes novos ou pacientes recentes com a estrutura antiga (que precisam ser re-buscados).
  if (onSelectPatient) {
    onSelectPatient({ idp, ids });
  }

  searchInput.value = "";
  searchResultsList.classList.add("hidden");
  recentPatientsList.classList.add("hidden");
}

export function init(config) {
  searchInput = document.getElementById("patient-search-input");
  searchResultsList = document.getElementById("search-results");
  recentPatientsList = document.getElementById("recent-patients-list");
  onSelectPatient = config.onSelectPatient;

  // Melhora o placeholder para ser mais informativo
  if (searchInput) {
    searchInput.setAttribute('placeholder', 'Digite nome, CPF (000.000.000-00), CNS ou data (dd/mm/aaaa)');
  }

  store.subscribe(() => {
    if (!recentPatientsList.classList.contains("hidden")) {
      renderRecentPatients();
    }
  });

  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("focus", handleSearchFocus);
  searchInput.addEventListener("blur", handleSearchBlur);
  searchResultsList.addEventListener("click", handleResultClick);
  recentPatientsList.addEventListener("click", handleResultClick);
}
