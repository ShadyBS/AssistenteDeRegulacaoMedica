import { defaultFieldConfig } from "./field-config.js";
import { filterConfig } from "./filter-config.js";

// --- Elementos do DOM ---
const saveButton = document.getElementById("saveButton");
const statusMessage = document.getElementById("statusMessage");
const closeButton = document.getElementById("closeButton");
const restoreDefaultsButton = document.getElementById("restoreDefaultsButton");

// Ficha do Paciente
const mainFieldsZone = document.getElementById("main-fields-zone");
const moreFieldsZone = document.getElementById("more-fields-zone");

// Abas e Zonas de Filtros
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
 * Cria um elemento de filtro arrastável com controlos para valor padrão.
 * @param {object} filter - O objeto de configuração do filtro.
 * @returns {HTMLElement} O elemento <div> do filtro.
 */
function createDraggableFilter(filter) {
  const div = document.createElement("div");
  div.className = "draggable";
  div.dataset.filterId = filter.id;
  div.draggable = true;

  // ALTERADO: Trata o novo tipo 'component'
  const displayType = filter.type === "selectGroup" ? "select" : filter.type;

  let defaultValueControl = "";
  // ALTERADO: Não cria controlo de valor padrão para componentes
  if (filter.type !== "component") {
    switch (filter.type) {
      case "text":
        defaultValueControl = `<input type="text" class="filter-default-value-input w-full" placeholder="Valor padrão...">`;
        break;
      case "select":
      case "selectGroup":
        const optionsHtml = filter.options
          .map((opt) => `<option value="${opt.value}">${opt.text}</option>`)
          .join("");
        defaultValueControl = `<select class="filter-default-value-input w-full">${optionsHtml}</select>`;
        break;
      case "checkbox":
        defaultValueControl = `<input type="checkbox" class="filter-default-value-input h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">`;
        break;
    }
  }

  // Layout principal do item arrastável
  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <div class="flex-grow flex flex-col gap-2">
        <div class="flex justify-between items-center">
            <span class="font-medium text-sm">${filter.label}</span>
            <span class="text-xs text-slate-400 p-1 bg-slate-100 rounded">${displayType}</span>
        </div>
        ${
          defaultValueControl
            ? `
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <label for="default-${filter.id}">Padrão:</label>
            ${defaultValueControl.replace(
              'class="',
              `id="default-${filter.id}" class="`
            )}
        </div>`
            : ""
        }
    </div>
  `;

  // Adiciona uma classe especial para componentes para estilização se necessário
  if (filter.type === "component") {
    div.classList.add("draggable-component");
  }

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
 * Renderiza os filtros de seção nas zonas corretas e define seus valores padrão.
 * @param {object} layout - A configuração de layout dos filtros.
 */
function renderFilterLayout(layout) {
  // Limpa todas as zonas de drop de filtros
  Object.keys(filterConfig).forEach((section) => {
    document.getElementById(`${section}-main-filters-zone`).innerHTML = "";
    document.getElementById(`${section}-more-filters-zone`).innerHTML = "";
  });

  Object.entries(filterConfig).forEach(([sectionKey, filters]) => {
    const sectionLayout = layout[sectionKey] || [];
    const layoutMap = new Map(sectionLayout.map((f) => [f.id, f]));

    const sortedFilters = [...filters].sort((a, b) => {
      const orderA = layoutMap.get(a.id)?.order ?? Infinity;
      const orderB = layoutMap.get(b.id)?.order ?? Infinity;
      return orderA - orderB;
    });

    sortedFilters.forEach((filter) => {
      const filterLayoutData = layoutMap.get(filter.id);
      const location = filterLayoutData?.location || filter.defaultLocation;

      if (sectionKey === "patient-card") return;
      const zoneId = `${sectionKey}-${location}-filters-zone`;
      const zone = document.getElementById(zoneId);

      if (zone) {
        const filterElement = createDraggableFilter(filter);
        zone.appendChild(filterElement);

        if (
          filter.type !== "component" &&
          filterLayoutData &&
          filterLayoutData.defaultValue !== undefined
        ) {
          const defaultValueInput = filterElement.querySelector(
            ".filter-default-value-input"
          );
          if (defaultValueInput) {
            if (defaultValueInput.type === "checkbox") {
              defaultValueInput.checked = filterLayoutData.defaultValue;
            } else {
              defaultValueInput.value = filterLayoutData.defaultValue;
            }
          }
        }
      }
    });
  });
}

/**
 * Carrega a configuração salva, migra se necessário, e renderiza.
 */
async function restoreOptions() {
  const items = await browser.storage.sync.get({
    baseUrl: "",
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    monthsBack: 6,
    patientFields: defaultFieldConfig,
    filterLayout: {},
  });

  document.getElementById("baseUrlInput").value = items.baseUrl;
  document.getElementById("autoLoadExamsCheckbox").checked =
    items.autoLoadExams;
  document.getElementById("autoLoadConsultationsCheckbox").checked =
    items.autoLoadConsultations;
  document.getElementById("autoLoadAppointmentsCheckbox").checked =
    items.autoLoadAppointments;
  document.getElementById("autoLoadRegulationsCheckbox").checked =
    items.autoLoadRegulations;
  document.getElementById("monthsBackInput").value = items.monthsBack;

  const currentPatientFieldsConfig = defaultFieldConfig.map((defaultField) => {
    const savedField = items.patientFields.find(
      (f) => f.id === defaultField.id
    );
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });
  renderPatientFields(currentPatientFieldsConfig);

  const migratedFilterLayout = items.filterLayout || {};
  let needsSave = false;
  Object.entries(filterConfig).forEach(([sectionKey, filtersInSection]) => {
    if (!migratedFilterLayout[sectionKey]) {
      migratedFilterLayout[sectionKey] = [];
    }
    const savedLayout = migratedFilterLayout[sectionKey];
    filtersInSection.forEach((filter) => {
      let savedFilter = savedLayout.find((f) => f.id === filter.id);
      if (savedFilter) {
        if (
          filter.type !== "component" &&
          savedFilter.defaultValue === undefined
        ) {
          needsSave = true;
          savedFilter.defaultValue =
            filter.defaultChecked ??
            (filter.options ? filter.options[0].value : "");
        }
      } else {
        needsSave = true;
        const newFilterData = {
          id: filter.id,
          location: filter.defaultLocation,
          order: Infinity,
        };
        if (filter.type !== "component") {
          newFilterData.defaultValue =
            filter.defaultChecked ??
            (filter.options ? filter.options[0].value : "");
        }
        savedLayout.push(newFilterData);
      }
    });
  });

  if (needsSave) {
    await browser.storage.sync.set({ filterLayout: migratedFilterLayout });
  }

  renderFilterLayout(migratedFilterLayout);
}

/**
 * Salva todas as configurações.
 */
async function saveOptions() {
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
  const monthsBack =
    parseInt(document.getElementById("monthsBackInput").value, 10) || 6;

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

  const filterLayout = {};
  document
    .querySelectorAll("#layout-config-section .drop-zone")
    .forEach((zone) => {
      if (!zone.dataset.section) return;
      const section = zone.dataset.section;
      if (!filterLayout[section]) {
        filterLayout[section] = [];
      }
      const location = zone.id.includes("-main-") ? "main" : "more";
      zone.querySelectorAll(".draggable").forEach((div, index) => {
        const filterId = div.dataset.filterId;
        const originalFilter = filterConfig[section].find(
          (f) => f.id === filterId
        );

        const newFilterData = {
          id: filterId,
          location: location,
          order: index + 1,
        };

        if (originalFilter.type !== "component") {
          const defaultValueInput = div.querySelector(
            ".filter-default-value-input"
          );
          let defaultValue = null;
          if (defaultValueInput) {
            defaultValue =
              defaultValueInput.type === "checkbox"
                ? defaultValueInput.checked
                : defaultValueInput.value;
          }
          newFilterData.defaultValue = defaultValue;
        }
        filterLayout[section].push(newFilterData);
      });
    });

  await browser.storage.sync.set({
    baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
    autoLoadExams,
    autoLoadConsultations,
    autoLoadAppointments,
    autoLoadRegulations,
    monthsBack,
    patientFields,
    filterLayout,
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

// --- Lógica das Abas (Tabs) ---
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

// --- Lógica para Restaurar Padrões ---
async function handleRestoreDefaults() {
  const confirmation = window.confirm(
    "Tem certeza de que deseja restaurar todas as configurações de layout e valores padrão? Esta ação não pode ser desfeita."
  );
  if (confirmation) {
    await browser.storage.sync.remove(["patientFields", "filterLayout"]);
    mainFieldsZone.innerHTML = "";
    moreFieldsZone.innerHTML = "";
    restoreOptions();
    statusMessage.textContent = "Configurações restauradas para o padrão.";
    statusMessage.className = "mt-4 text-sm font-medium text-blue-600";
    setTimeout(() => {
      statusMessage.textContent = "";
    }, 3000);
  }
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
restoreDefaultsButton.addEventListener("click", handleRestoreDefaults);

allDropZones.forEach((zone) => {
  zone.addEventListener("dragover", handleDragOver);
  zone.addEventListener("drop", handleDrop);
});
