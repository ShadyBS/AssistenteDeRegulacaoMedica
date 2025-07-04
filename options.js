import { defaultFieldConfig } from "./field-config.js";
import { filterConfig } from "./filter-config.js";
import * as Utils from "./utils.js";

// --- Constantes ---
const CONFIG_VERSION = "1.2"; // Versão da estrutura de configuração

// --- Variáveis de Estado ---
let automationRules = [];
let currentlyEditingRuleId = null;

// --- Elementos do DOM ---
const saveButton = document.getElementById("saveButton");
const statusMessage = document.getElementById("statusMessage");
const closeButton = document.getElementById("closeButton");
const restoreDefaultsButton = document.getElementById("restoreDefaultsButton");
const exportButton = document.getElementById("exportButton");
const importFileInput = document.getElementById("import-file-input");

// Ficha do Paciente
const mainFieldsZone = document.getElementById("main-fields-zone");
const moreFieldsZone = document.getElementById("more-fields-zone");

// Abas e Zonas de Filtros Manuais
const filterTabsContainer = document.getElementById("filter-tabs-container");
const allDropZones = document.querySelectorAll(".drop-zone");

// --- NOVOS Elementos do DOM para o Gerenciador de Automação ---
const automationRulesList = document.getElementById("automation-rules-list");
const createNewRuleBtn = document.getElementById("create-new-rule-btn");
const ruleEditorModal = document.getElementById("rule-editor-modal");
const ruleEditorTitle = document.getElementById("rule-editor-title");
const ruleNameInput = document.getElementById("rule-name-input");
const ruleTriggersInput = document.getElementById("rule-triggers-input");
const cancelRuleBtn = document.getElementById("cancel-rule-btn");
const saveRuleBtn = document.getElementById("save-rule-btn");
const ruleEditorFilterTabs = document.getElementById("rule-editor-filter-tabs");

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

  const displayType = filter.type === "selectGroup" ? "select" : filter.type;

  let defaultValueControl = "";
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
  Object.keys(filterConfig).forEach((section) => {
    const mainZone = document.getElementById(`${section}-main-filters-zone`);
    const moreZone = document.getElementById(`${section}-more-filters-zone`);
    if (mainZone) mainZone.innerHTML = "";
    if (moreZone) moreZone.innerHTML = "";
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
 * Carrega a configuração salva e renderiza a página.
 */
async function restoreOptions() {
  // Carrega configurações do storage.sync
  const syncItems = await browser.storage.sync.get({
    baseUrl: "",
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    enableAutomaticDetection: true,
    patientFields: defaultFieldConfig,
    filterLayout: {},
    dateRangeDefaults: {},
  });

  // Carrega configurações do storage.local
  const localItems = await browser.storage.local.get({
    automationRules: [],
  });

  // Aplica configurações gerais
  document.getElementById("baseUrlInput").value = syncItems.baseUrl;
  document.getElementById("enableAutomaticDetection").checked =
    syncItems.enableAutomaticDetection;
  document.getElementById("autoLoadExamsCheckbox").checked =
    syncItems.autoLoadExams;
  document.getElementById("autoLoadConsultationsCheckbox").checked =
    syncItems.autoLoadConsultations;
  document.getElementById("autoLoadAppointmentsCheckbox").checked =
    syncItems.autoLoadAppointments;
  document.getElementById("autoLoadRegulationsCheckbox").checked =
    syncItems.autoLoadRegulations;

  // Renderiza layouts e padrões manuais
  const currentPatientFieldsConfig = defaultFieldConfig.map((defaultField) => {
    const savedField = syncItems.patientFields.find(
      (f) => f.id === defaultField.id
    );
    return savedField ? { ...defaultField, ...savedField } : defaultField;
  });
  renderPatientFields(currentPatientFieldsConfig);
  renderFilterLayout(syncItems.filterLayout);

  const sections = ["consultations", "exams", "appointments", "regulations"];
  const defaultRanges = {
    consultations: { start: -6, end: 0 },
    exams: { start: -6, end: 0 },
    appointments: { start: -1, end: 3 },
    regulations: { start: -12, end: 0 },
  };
  sections.forEach((section) => {
    const range =
      syncItems.dateRangeDefaults[section] || defaultRanges[section];
    document.getElementById(`${section}-start-offset`).value = Math.abs(
      range.start
    );
    document.getElementById(`${section}-end-offset`).value = range.end;
  });

  // Renderiza regras de automação
  automationRules = localItems.automationRules;
  renderAutomationRules();
}

/**
 * Salva as configurações GERAIS (não as regras de automação).
 */
async function saveOptions() {
  const baseUrl = document.getElementById("baseUrlInput").value;
  const enableAutomaticDetection = document.getElementById(
    "enableAutomaticDetection"
  ).checked;
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
      if (!filterLayout[section]) filterLayout[section] = [];
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
          newFilterData.defaultValue =
            defaultValueInput.type === "checkbox"
              ? defaultValueInput.checked
              : defaultValueInput.value;
        }
        filterLayout[section].push(newFilterData);
      });
    });

  const dateRangeDefaults = {};
  const sections = ["consultations", "exams", "appointments", "regulations"];
  sections.forEach((section) => {
    const start =
      -parseInt(document.getElementById(`${section}-start-offset`).value, 10) ||
      0;
    const end =
      parseInt(document.getElementById(`${section}-end-offset`).value, 10) || 0;
    dateRangeDefaults[section] = { start, end };
  });

  await browser.storage.sync.set({
    baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
    enableAutomaticDetection,
    autoLoadExams,
    autoLoadConsultations,
    autoLoadAppointments,
    autoLoadRegulations,
    patientFields,
    filterLayout,
    dateRangeDefaults,
  });

  Utils.showMessage("Configurações gerais salvas com sucesso!", "success");
  setTimeout(() => {
    statusMessage.textContent = "";
  }, 2000);
}

// --- Lógica de Arrastar e Soltar (Drag and Drop) ---
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target.closest(".draggable, .rule-item");
  if (!draggedElement) return;
  e.dataTransfer.effectAllowed = "move";
  setTimeout(() => draggedElement.classList.add("dragging"), 0);
}

function handleDragEnd(e) {
  if (!draggedElement) return;
  draggedElement.classList.remove("dragging");
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();
  if (!draggedElement) return;

  const dropZone = e.target.closest(".drop-zone, #automation-rules-list");
  if (dropZone) {
    const afterElement = getDragAfterElement(dropZone, e.clientY);
    if (afterElement == null) {
      dropZone.appendChild(draggedElement);
    } else {
      dropZone.insertBefore(draggedElement, afterElement);
    }

    // Se a zona de drop for a lista de regras, reordena e salva
    if (dropZone.id === "automation-rules-list") {
      reorderAutomationRules();
    }
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(
      ".draggable:not(.dragging), .rule-item:not(.dragging)"
    ),
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
function setupTabs(container) {
  const tabButtons = container.querySelectorAll(".tab-button");
  const tabContents = container.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      button.classList.add("active");
      const activeContent = container.querySelector(`#${tabName}-tab`);
      if (activeContent) {
        activeContent.classList.add("active");
      }
    });
  });
}

// --- Lógica para Restaurar Padrões ---
async function handleRestoreDefaults() {
  const confirmation = window.confirm(
    "Tem certeza de que deseja restaurar todas as configurações de layout e valores padrão? Esta ação não pode ser desfeita."
  );
  if (confirmation) {
    await browser.storage.sync.remove([
      "patientFields",
      "filterLayout",
      "dateRangeDefaults",
      "enableAutomaticDetection",
    ]);
    mainFieldsZone.innerHTML = "";
    moreFieldsZone.innerHTML = "";
    restoreOptions();
    Utils.showMessage("Configurações restauradas para o padrão.", "info");
    setTimeout(() => {
      statusMessage.textContent = "";
    }, 3000);
  }
}

// --- Lógica de Exportação e Importação ---
async function handleExport() {
  try {
    const settingsToExport = await browser.storage.sync.get(null);
    settingsToExport.configVersion = CONFIG_VERSION;
    const settingsString = JSON.stringify(settingsToExport, null, 2);
    const blob = new Blob([settingsString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `assistente-regulacao-config-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Utils.showMessage("Configurações exportadas com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao exportar configurações:", error);
    Utils.showMessage("Erro ao exportar configurações.", "error");
  } finally {
    setTimeout(() => {
      statusMessage.textContent = "";
    }, 3000);
  }
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedSettings = JSON.parse(e.target.result);
      if (!importedSettings.configVersion || !importedSettings.filterLayout) {
        throw new Error("Ficheiro de configuração inválido ou corrompido.");
      }
      if (
        importedSettings.configVersion.split(".")[0] !==
        CONFIG_VERSION.split(".")[0]
      ) {
        const goOn = window.confirm(
          "A versão do ficheiro de configuração é muito diferente da versão da extensão. A importação pode causar erros. Deseja continuar mesmo assim?"
        );
        if (!goOn) return;
      }
      await browser.storage.sync.clear();
      await browser.storage.sync.set(importedSettings);
      restoreOptions();
      Utils.showMessage(
        "Configurações importadas e aplicadas com sucesso!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao importar configurações:", error);
      Utils.showMessage(`Erro ao importar: ${error.message}`, "error");
    } finally {
      importFileInput.value = "";
      setTimeout(() => {
        statusMessage.textContent = "";
      }, 5000);
    }
  };
  reader.readAsText(file);
}

// --- LÓGICA PARA O GERENCIADOR DE AUTOMAÇÃO ---

/**
 * Renderiza a lista de regras de automação na UI.
 */
function renderAutomationRules() {
  automationRulesList.innerHTML = "";
  automationRules.forEach((rule) => {
    const ruleElement = document.createElement("div");
    ruleElement.className = "rule-item border rounded-lg bg-white p-3";
    ruleElement.dataset.ruleId = rule.id;
    ruleElement.draggable = true;

    const keywords = rule.triggerKeywords.join(", ");
    const checked = rule.isActive ? "checked" : "";

    ruleElement.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="drag-handle cursor-grab text-slate-400">⠿</span>
                <div>
                  <p class="font-semibold text-slate-800">${rule.name}</p>
                  <p class="text-xs text-slate-500" title="${keywords}">Gatilhos: ${
      keywords.length > 50 ? keywords.substring(0, 50) + "..." : keywords
    }</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <label class="relative inline-flex items-center cursor-pointer" title="${
                  rule.isActive ? "Regra Ativa" : "Regra Inativa"
                }">
                  <input type="checkbox" class="sr-only peer rule-toggle-active" ${checked}>
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <button class="text-sm font-medium text-blue-600 hover:underline rule-edit-btn">Editar</button>
                <button class="text-sm font-medium text-slate-500 hover:underline rule-duplicate-btn">Duplicar</button>
                <button class="text-sm font-medium text-red-600 hover:underline rule-delete-btn">Excluir</button>
              </div>
            </div>
        `;
    automationRulesList.appendChild(ruleElement);
  });

  // Adiciona event listeners para os botões de cada regra
  document.querySelectorAll(".rule-item").forEach((item) => {
    const ruleId = item.dataset.ruleId;
    item
      .querySelector(".rule-edit-btn")
      .addEventListener("click", () => handleEditRule(ruleId));
    item
      .querySelector(".rule-delete-btn")
      .addEventListener("click", () => handleDeleteRule(ruleId));
    item
      .querySelector(".rule-duplicate-btn")
      .addEventListener("click", () => handleDuplicateRule(ruleId));
    item
      .querySelector(".rule-toggle-active")
      .addEventListener("change", (e) =>
        handleToggleRuleActive(ruleId, e.target.checked)
      );
  });
}

/**
 * Salva o array de regras de automação no storage local.
 */
async function saveAutomationRules() {
  await browser.storage.local.set({ automationRules });
  Utils.showMessage("Regras de automação salvas.", "success");
  setTimeout(() => {
    statusMessage.textContent = "";
  }, 2000);
}

/**
 * Abre o modal do editor de regras, preenchendo-o se uma regra for fornecida.
 * @param {string|null} ruleId - O ID da regra a ser editada, ou null para criar uma nova.
 */
function openRuleEditor(ruleId = null) {
  currentlyEditingRuleId = ruleId;
  populateRuleEditorFilters(); // Popula com a estrutura de filtros

  if (ruleId) {
    const rule = automationRules.find((r) => r.id === ruleId);
    if (!rule) return;
    ruleEditorTitle.textContent = "Editar Regra de Automação";
    ruleNameInput.value = rule.name;
    ruleTriggersInput.value = rule.triggerKeywords.join(", ");

    // Preenche os filtros no modal com os valores da regra
    Object.entries(rule.filterSettings).forEach(([sectionKey, filters]) => {
      Object.entries(filters).forEach(([filterId, value]) => {
        const element = document.getElementById(
          `rule-${sectionKey}-${filterId}`
        );
        if (element) {
          if (element.type === "checkbox") {
            element.checked = value;
          } else {
            element.value = value;
          }
        }
      });
    });
  } else {
    ruleEditorTitle.textContent = "Criar Nova Regra de Automação";
    ruleNameInput.value = "";
    ruleTriggersInput.value = "";
    // Limpa todos os campos de filtro no modal
    document
      .querySelectorAll(
        '#rule-editor-modal input[type="text"], #rule-editor-modal select'
      )
      .forEach((el) => (el.value = ""));
    document
      .querySelectorAll('#rule-editor-modal input[type="checkbox"]')
      .forEach((el) => (el.checked = false));
  }

  ruleEditorModal.classList.remove("hidden");
}

/**
 * Fecha o modal do editor de regras.
 */
function closeRuleEditor() {
  ruleEditorModal.classList.add("hidden");
  currentlyEditingRuleId = null;
}

/**
 * Salva a regra (nova ou editada) do modal.
 */
function handleSaveRule() {
  const name = ruleNameInput.value.trim();
  if (!name) {
    alert("O nome da regra é obrigatório.");
    return;
  }

  const triggerKeywords = ruleTriggersInput.value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const filterSettings = {};
  const sections = ["consultations", "exams", "appointments", "regulations"];

  sections.forEach((sectionKey) => {
    filterSettings[sectionKey] = {};
    const sectionFilters = filterConfig[sectionKey] || [];
    sectionFilters.forEach((filter) => {
      if (filter.type === "component") return;
      const element = document.getElementById(
        `rule-${sectionKey}-${filter.id}`
      );
      if (element) {
        const value =
          element.type === "checkbox" ? element.checked : element.value;
        filterSettings[sectionKey][filter.id] = value;
      }
    });
  });

  if (currentlyEditingRuleId) {
    // Editando regra existente
    const ruleIndex = automationRules.findIndex(
      (r) => r.id === currentlyEditingRuleId
    );
    if (ruleIndex > -1) {
      automationRules[ruleIndex].name = name;
      automationRules[ruleIndex].triggerKeywords = triggerKeywords;
      automationRules[ruleIndex].filterSettings = filterSettings;
    }
  } else {
    // Criando nova regra
    const newRule = {
      id: Date.now().toString(),
      name,
      triggerKeywords,
      isActive: true,
      filterSettings,
    };
    automationRules.push(newRule);
  }

  saveAutomationRules();
  renderAutomationRules();
  closeRuleEditor();
}

function handleEditRule(ruleId) {
  openRuleEditor(ruleId);
}

function handleDeleteRule(ruleId) {
  if (confirm("Tem certeza que deseja excluir esta regra?")) {
    automationRules = automationRules.filter((r) => r.id !== ruleId);
    saveAutomationRules();
    renderAutomationRules();
  }
}

function handleDuplicateRule(ruleId) {
  const originalRule = automationRules.find((r) => r.id === ruleId);
  if (!originalRule) return;

  const newRule = JSON.parse(JSON.stringify(originalRule)); // Deep copy
  newRule.id = Date.now().toString();
  newRule.name = `${originalRule.name} (Cópia)`;
  newRule.isActive = false;

  const originalIndex = automationRules.findIndex((r) => r.id === ruleId);
  automationRules.splice(originalIndex + 1, 0, newRule); // Insere a cópia logo após o original

  saveAutomationRules();
  renderAutomationRules();
}

function handleToggleRuleActive(ruleId, isActive) {
  const ruleIndex = automationRules.findIndex((r) => r.id === ruleId);
  if (ruleIndex > -1) {
    automationRules[ruleIndex].isActive = isActive;
    saveAutomationRules();
  }
}

function reorderAutomationRules() {
  const newOrderedIds = [
    ...automationRulesList.querySelectorAll(".rule-item"),
  ].map((item) => item.dataset.ruleId);
  automationRules.sort(
    (a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id)
  );
  saveAutomationRules();
}

/**
 * Popula as abas do editor de regras com os controles de filtro apropriados.
 */
function populateRuleEditorFilters() {
  const sections = ["consultations", "exams", "appointments", "regulations"];
  sections.forEach((sectionKey) => {
    const container = document.getElementById(`${sectionKey}-rule-editor-tab`);
    if (!container) return;
    container.innerHTML = ""; // Limpa antes de popular
    const sectionFilters = filterConfig[sectionKey] || [];

    sectionFilters.forEach((filter) => {
      if (filter.type === "component") return;
      const filterElement = createFilterElementForRuleEditor(
        filter,
        sectionKey
      );
      container.appendChild(filterElement);
    });
  });
  // Garante que a primeira aba esteja visível
  const firstTabButton = document.querySelector(
    "#rule-editor-filter-tabs .tab-button"
  );
  if (firstTabButton) {
    firstTabButton.click();
  }
}

/**
 * Cria um único elemento de filtro para o modal do editor de regras.
 * @param {object} filter - O objeto de configuração do filtro de filter-config.js.
 * @param {string} sectionKey - A chave da seção (ex: "consultations").
 * @returns {HTMLElement} O elemento HTML do filtro.
 */
function createFilterElementForRuleEditor(filter, sectionKey) {
  const container = document.createElement("div");
  const elementId = `rule-${sectionKey}-${filter.id}`;
  let elementHtml = "";

  if (filter.type !== "checkbox") {
    container.className = "mb-3";
    elementHtml += `<label for="${elementId}" class="block font-medium mb-1 text-sm">${filter.label}</label>`;
  }

  switch (filter.type) {
    case "text":
      elementHtml += `<input type="text" id="${elementId}" placeholder="${
        filter.placeholder || ""
      }" class="w-full px-2 py-1 border border-slate-300 rounded-md">`;
      break;
    case "select":
    case "selectGroup":
      elementHtml += `<select id="${elementId}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;
      filter.options.forEach((opt) => {
        elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
      });
      elementHtml += `</select>`;
      break;
    case "checkbox":
      container.className = "flex items-center gap-2";
      elementHtml += `<input id="${elementId}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <label for="${elementId}" class="block text-sm text-slate-700">${filter.label}</label>`;
      break;
  }
  container.innerHTML = elementHtml;
  return container;
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  setupTabs(document.getElementById("filter-tabs-container"));
  setupTabs(document.getElementById("rule-editor-filter-tabs"));

  // Listeners para a funcionalidade de automação
  createNewRuleBtn.addEventListener("click", () => openRuleEditor(null));
  cancelRuleBtn.addEventListener("click", closeRuleEditor);
  saveRuleBtn.addEventListener("click", handleSaveRule);

  ruleEditorModal.addEventListener("click", (e) => {
    if (e.target === ruleEditorModal) {
      closeRuleEditor();
    }
  });

  // Listeners para drag and drop das regras
  automationRulesList.addEventListener("dragstart", handleDragStart);
  automationRulesList.addEventListener("dragend", handleDragEnd);
  automationRulesList.addEventListener("dragover", handleDragOver);
  automationRulesList.addEventListener("drop", handleDrop);
});

saveButton.addEventListener("click", saveOptions);
closeButton.addEventListener("click", () => {
  window.close();
});
restoreDefaultsButton.addEventListener("click", handleRestoreDefaults);
exportButton.addEventListener("click", handleExport);
importFileInput.addEventListener("change", handleImport);

allDropZones.forEach((zone) => {
  zone.addEventListener("dragover", handleDragOver);
  zone.addEventListener("drop", handleDrop);
});
