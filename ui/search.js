/**
 * @file Módulo para gerir a funcionalidade de busca de pacientes.
 */
import * as API from "../api.js";
import * as Utils from "../utils.js";
import { store } from "../store.js"; // Importa o store

// --- Elementos do DOM ---
let searchInput;
let searchResultsList;
let recentPatientsList;

// --- Estado do Módulo ---
let recentPatients = [];

/**
 * Renderiza a lista de resultados da busca.
 * @param {Array<object>} patients - Lista de pacientes encontrados.
 */
function renderSearchResults(patients) {
  if (!searchResultsList) return;
  if (patients.length === 0) {
    searchResultsList.innerHTML =
      '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>';
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
 * Renderiza a lista de pacientes recentes.
 */
function renderRecentPatients() {
  if (!recentPatientsList) return;
  const recents = recentPatients || [];
  recentPatientsList.innerHTML =
    '<li class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400">PACIENTES RECENTES</li>' +
    (recents.length === 0
      ? '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente recente.</li>'
      : recents
          .map(
            (p) =>
              `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition recent-patient-item" data-patient='${JSON.stringify(
                p
              )}'>${renderPatientListItem(p)}</li>`
          )
          .join(""));
}

/**
 * Gera o HTML para um item da lista de pacientes.
 * @param {object} patient - O objeto do paciente.
 * @returns {string} O HTML do item.
 */
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

/**
 * Manipulador para o input de busca.
 */
async function handleSearchInput() {
  const searchTerm = searchInput.value.trim();
  store.setPatient(null); // Limpa o paciente atual ao iniciar uma nova busca

  recentPatientsList.classList.add("hidden");
  searchResultsList.classList.remove("hidden");

  if (searchTerm.length < 1) {
    searchResultsList.innerHTML = "";
    return;
  }

  Utils.toggleLoader(true);
  try {
    const patients = await API.searchPatients(searchTerm);
    renderSearchResults(patients);
  } catch (error) {
    Utils.showMessage("Erro ao buscar pacientes.");
  } finally {
    Utils.toggleLoader(false);
  }
}

/**
 * Manipulador para o foco no input de busca, mostra os recentes.
 */
function handleSearchFocus() {
  if (searchInput.value.length > 0) return;
  renderRecentPatients();
  searchResultsList.classList.add("hidden");
  recentPatientsList.classList.remove("hidden");
}

/**
 * Manipulador para o clique num resultado de busca ou paciente recente.
 * @param {Event} event - O evento de clique.
 */
async function handleResultClick(event) {
  const listItem = event.target.closest("li");
  if (!listItem || (!listItem.dataset.idp && !listItem.dataset.patient)) return;

  Utils.toggleLoader(true);
  Utils.clearMessage();

  try {
    const patientData = listItem.dataset.patient
      ? JSON.parse(listItem.dataset.patient)
      : { idp: listItem.dataset.idp, ids: listItem.dataset.ids };

    const fullPatientData = await API.fetchVisualizaUsuario(patientData);
    store.setPatient(fullPatientData); // Define o paciente no store global
  } catch (error) {
    Utils.showMessage("Erro ao carregar os dados do paciente.");
    console.error(error);
    store.setPatient(null); // Garante que o estado seja limpo em caso de erro
  } finally {
    Utils.toggleLoader(false);
    searchInput.value = "";
    searchResultsList.classList.add("hidden");
    recentPatientsList.classList.add("hidden");
  }
}

/**
 * Inicializa o módulo de busca.
 * @param {object} config - Configuração com as dependências do módulo.
 * @param {Array} config.recentPatients - A lista de pacientes recentes.
 */
export function init(config) {
  searchInput = document.getElementById("patient-search-input");
  searchResultsList = document.getElementById("search-results");
  recentPatientsList = document.getElementById("recent-patients-list");

  recentPatients = config.recentPatients || [];

  searchInput.addEventListener("input", Utils.debounce(handleSearchInput, 500));
  searchInput.addEventListener("focus", handleSearchFocus);
  searchResultsList.addEventListener("click", handleResultClick);
  recentPatientsList.addEventListener("click", handleResultClick);
}
