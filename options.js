import { defaultFieldConfig } from "./field-config.js";

// --- Elementos do DOM ---
const saveButton = document.getElementById("saveButton");
const statusMessage = document.getElementById("statusMessage");
const mainFieldsZone = document.getElementById("main-fields-zone");
const moreFieldsZone = document.getElementById("more-fields-zone");
const closeButton = document.getElementById("closeButton");

/**
 * Cria um elemento de campo arrastável.
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
 * Renderiza os campos nas zonas corretas (principal e 'mais').
 * @param {Array<object>} config - A configuração de campos.
 */
function renderFields(config) {
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
 * Carrega a configuração salva ou usa a padrão.
 */
function restoreOptions() {
  // ATUALIZADO: Remove as chaves obsoletas dos filtros de exame
  chrome.storage.sync.get(
    {
      baseUrl: "",
      autoLoadExams: false,
      autoLoadConsultations: false,
      hideNoShowDefault: false,
      monthsBack: 6,
      patientFields: defaultFieldConfig,
    },
    (items) => {
      // Restaura configurações gerais
      document.getElementById("baseUrlInput").value = items.baseUrl;
      document.getElementById("autoLoadExamsCheckbox").checked =
        items.autoLoadExams;
      document.getElementById("autoLoadConsultationsCheckbox").checked =
        items.autoLoadConsultations;
      document.getElementById("hideNoShowDefaultCheckbox").checked =
        items.hideNoShowDefault;
      document.getElementById("monthsBackInput").value = items.monthsBack;

      // Restaura configuração da ficha do paciente
      const currentConfig = defaultFieldConfig.map((defaultField) => {
        const savedField = items.patientFields.find(
          (f) => f.id === defaultField.id
        );
        return savedField ? { ...defaultField, ...savedField } : defaultField;
      });
      renderFields(currentConfig);
    }
  );
}

/**
 * Salva todas as configurações.
 */
function saveOptions() {
  // Coleta as configurações gerais
  const baseUrl = document.getElementById("baseUrlInput").value;
  const autoLoadExams = document.getElementById(
    "autoLoadExamsCheckbox"
  ).checked;
  const autoLoadConsultations = document.getElementById(
    "autoLoadConsultationsCheckbox"
  ).checked;
  const hideNoShowDefault = document.getElementById(
    "hideNoShowDefaultCheckbox"
  ).checked;
  const monthsBack =
    parseInt(document.getElementById("monthsBackInput").value, 10) || 6;

  // Coleta a configuração da ficha do paciente
  const patientFields = [];
  document.querySelectorAll(".draggable").forEach((div) => {
    const fieldId = div.dataset.fieldId;
    const label = div.querySelector(".field-label-input").value;
    const enabled = div.querySelector(".field-enabled-checkbox").checked;
    const section =
      div.closest(".drop-zone").id === "main-fields-zone" ? "main" : "more";
    const order = Array.from(div.parentNode.children).indexOf(div) + 1;

    patientFields.push({ id: fieldId, label, enabled, section, order });
  });

  // ATUALIZADO: Remove as chaves obsoletas dos filtros de exame
  chrome.storage.sync.set(
    {
      baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
      autoLoadExams,
      autoLoadConsultations,
      hideNoShowDefault,
      monthsBack,
      patientFields,
    },
    () => {
      statusMessage.textContent = "Configurações salvas com sucesso!";
      statusMessage.className = "mt-4 text-sm font-medium text-green-600";
      setTimeout(() => {
        statusMessage.textContent = "";
      }, 2000);
    }
  );
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

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener("click", saveOptions);
mainFieldsZone.addEventListener("dragover", handleDragOver);
moreFieldsZone.addEventListener("dragover", handleDragOver);
mainFieldsZone.addEventListener("drop", handleDrop);
moreFieldsZone.addEventListener("drop", handleDrop);

// ATUALIZADO: Corrige a lógica para fechar a aba de opções
closeButton.addEventListener("click", () => {
  window.close();
});
