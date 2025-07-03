import { defaultFieldConfig } from "./field-config.js";
import { filterConfig } from "./filter-config.js"; // NOVO

// --- Elementos do DOM ---
const saveButton = document.getElementById("saveButton");
const statusMessage = document.getElementById("statusMessage");
const closeButton = document.getElementById("closeButton");

// Ficha do Paciente
const mainFieldsZone = document.getElementById("main-fields-zone");
const moreFieldsZone = document.getElementById("more-fields-zone");

// Abas e Zonas de Filtros (NOVO)
const filterTabsContainer = document.getElementById("filter-tabs-container");
const allDropZones = document.querySelectorAll(".drop-zone");

/**
 * Cria um elemento de campo arrastável para a Ficha do Paciente.
 * @param {object} field - O objeto de configuração do campo.
 * @returns {HTMLElement} O elemento <div> do campo.
 */
function createDraggableField(field) {
  const div = document.createElement("div");
  div.className = "draggable";
  div.dataset.fieldId = field.id;
  div.draggable = true;

  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <input type="checkbox" class="field-enabled-checkbox" ${
      field.enabled ? "checked" : ""
    }>
    <input type="text" class="field-label-input" value="${field.label}">
  `;

  div.addEventListener("dragstart", handleDragStart);
  div.addEventListener("dragend", handleDragEnd);

  return div;
}

/**
 * Cria um elemento de filtro arrastável para as Configurações de Filtro.
 * @param {object} filter - O objeto de configuração do filtro.
 * @returns {HTMLElement} O elemento <div> do filtro.
 */
function createDraggableFilter(filter) {
  const div = document.createElement("div");
  div.className = "draggable";
  div.dataset.filterId = filter.id;
  div.draggable = true;

  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <span class="flex-grow font-medium text-sm">${filter.label}</span>
    <span class="text-xs text-slate-400 p-1 bg-slate-100 rounded">${filter.type}</span>
  `;

  div.addEventListener("dragstart", handleDragStart);
  div.addEventListener("dragend", handleDragEnd);

  return div;
}

/**
 * Renderiza os campos da Ficha do Paciente nas zonas corretas.
 * @param {Array<object>} config - A configuração de campos.
 */
function renderPatientFields(config) {
  mainFieldsZone.innerHTML = "";
  moreFieldsZone.innerHTML = "";

  const sortedConfig = [...config].sort((a, b) => a.order - b.order);

  sortedConfig.forEach((field) => {
    const fieldElement = createDraggableField(field);
    if (field.section === "main") {
      mainFieldsZone.appendChild(fieldElement);
    } else {
      moreFieldsZone.appendChild(fieldElement);
    }
  });
}

/**
 * Renderiza os filtros de seção nas zonas corretas. (NOVO)
 * @param {object} layout - A configuração de layout dos filtros.
 */
function renderFilterLayout(layout) {
  // Limpa todas as zonas de drop de filtros
  Object.keys(filterConfig).forEach((section) => {
    document.getElementById(`${section}-main-filters-zone`).innerHTML = "";
    document.getElementById(`${section}-more-filters-zone`).innerHTML = "";
  });

  // Itera sobre cada seção definida em filterConfig
  Object.entries(filterConfig).forEach(([sectionKey, filters]) => {
    const sectionLayout = layout[sectionKey] || [];

    // Cria um mapa para acesso rápido ao layout de cada filtro
    const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

    // Ordena os filtros com base na ordem salva, tratando filtros novos
    const sortedFilters = [...filters].sort((a, b) => {
      const orderA = layoutMap.get(a.id)?.order ?? Infinity;
      const orderB = layoutMap.get(b.id)?.order ?? Infinity;
      return orderA - orderB;
    });

    // Renderiza cada filtro na sua zona
    sortedFilters.forEach((filter) => {
      const filterLayout = layoutMap.get(filter.id);
      const location = filterLayout?.location || filter.defaultLocation;
      const zoneId = `${sectionKey}-${location}-filters-zone`;
      const zone = document.getElementById(zoneId);
      if (zone) {
        const filterElement = createDraggableFilter(filter);
        zone.appendChild(filterElement);
      }
    });
  });
}

/**
 * Carrega a configuração salva ou usa a padrão.
 */
async function restoreOptions() {
  const items = await browser.storage.sync.get({
    baseUrl: "",
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    hideNoShowDefault: false,
    monthsBack: 6,
    patientFields: defaultFieldConfig,
    filterLayout: {}, // NOVO
  });

  // Restaura configurações gerais
  document.getElementById("baseUrlInput").value = items.baseUrl;
  document.getElementById("autoLoadExamsCheckbox").checked =
    items.autoLoadExams;
  document.getElementById("autoLoadConsultationsCheckbox").checked =
    items.autoLoadConsultations;
  document.getElementById("autoLoadAppointmentsCheckbox").checked =
    items.autoLoadAppointments;
  document.getElementById("autoLoadRegulationsCheckbox").checked =
    items.autoLoadRegulations;
  document.getElementById("hideNoShowDefaultCheckbox").checked =
    items.hideNoShowDefault;
  document.getElementById("monthsBackInput").value = items.monthsBack;

  // Restaura configuração da ficha do paciente
  const currentPatientFieldsConfig = defaultFieldConfig.map((defaultField) => {
    const savedField = items.patientFields.find(
      (f) => f.id === defaultField.id
    );
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });
  renderPatientFields(currentPatientFieldsConfig);

  // Restaura configuração de layout dos filtros (NOVO)
  renderFilterLayout(items.filterLayout);
}

/**
 * Salva todas as configurações.
 */
async function saveOptions() {
  // Coleta as configurações gerais
  const baseUrl = document.getElementById("baseUrlInput").value;
  const autoLoadExams = document.getElementById(
    "autoLoadExamsCheckbox"
  ).checked;
  const autoLoadConsultations = document.getElementById(
    "autoLoadConsultationsCheckbox"
  ).checked;
  const autoLoadAppointments = document.getElementById(
    "autoLoadAppointmentsCheckbox"
  ).checked;
  const autoLoadRegulations = document.getElementById(
    "autoLoadRegulationsCheckbox"
  ).checked;
  const hideNoShowDefault = document.getElementById(
    "hideNoShowDefaultCheckbox"
  ).checked;
  const monthsBack =
    parseInt(document.getElementById("monthsBackInput").value, 10) || 6;

  // Coleta a configuração da ficha do paciente
  const patientFields = [];
  mainFieldsZone.querySelectorAll(".draggable").forEach((div, index) => {
    const fieldId = div.dataset.fieldId;
    const label = div.querySelector(".field-label-input").value;
    const enabled = div.querySelector(".field-enabled-checkbox").checked;
    patientFields.push({
      id: fieldId,
      label,
      enabled,
      section: "main",
      order: index + 1,
    });
  });
  moreFieldsZone.querySelectorAll(".draggable").forEach((div, index) => {
    const fieldId = div.dataset.fieldId;
    const label = div.querySelector(".field-label-input").value;
    const enabled = div.querySelector(".field-enabled-checkbox").checked;
    patientFields.push({
      id: fieldId,
      label,
      enabled,
      section: "more",
      order: index + 1,
    });
  });

  // Coleta a configuração de layout dos filtros (NOVO)
  const filterLayout = {};
  document
    .querySelectorAll("#filter-config-section .drop-zone")
    .forEach((zone) => {
      const section = zone.dataset.section;
      if (!filterLayout[section]) {
        filterLayout[section] = [];
      }
      const location = zone.id.includes("-main-") ? "main" : "more";
      zone.querySelectorAll(".draggable").forEach((div, index) => {
        const filterId = div.dataset.filterId;
        filterLayout[section].push({
          id: filterId,
          location: location,
          order: index + 1,
        });
      });
    });

  await browser.storage.sync.set({
    baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
    autoLoadExams,
    autoLoadConsultations,
    autoLoadAppointments,
    autoLoadRegulations,
    hideNoShowDefault,
    monthsBack,
    patientFields,
    filterLayout, // NOVO
  });

  statusMessage.textContent = "Configurações salvas com sucesso!";
  statusMessage.className = "mt-4 text-sm font-medium text-green-600";
  setTimeout(() => {
    statusMessage.textContent = "";
  }, 2000);
}

// --- Lógica de Arrastar e Soltar (Drag and Drop) ---
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => e.target.classList.add("dragging"), 0);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();
  const dropZone = e.target.closest(".drop-zone");
  if (dropZone && draggedElement) {
    const afterElement = getDragAfterElement(dropZone, e.clientY);
    if (afterElement == null) {
      dropZone.appendChild(draggedElement);
    } else {
      dropZone.insertBefore(draggedElement, afterElement);
    }
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".draggable:not(.dragging)"),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// --- Lógica das Abas (Tabs) --- (NOVO)
function setupTabs() {
  const tabButtons = filterTabsContainer.querySelectorAll(".tab-button");
  const tabContents = filterTabsContainer.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document
        .getElementById(`${button.dataset.tab}-tab`)
        .classList.add("active");
    });
  });
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  setupTabs();
});
saveButton.addEventListener("click", saveOptions);
closeButton.addEventListener("click", () => {
  window.close();
});

allDropZones.forEach((zone) => {
  zone.addEventListener("dragover", handleDragOver);
  zone.addEventListener("drop", handleDrop);
});
