/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 239:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AQ: () => (/* binding */ setupTabs),
/* harmony export */   rG: () => (/* binding */ showMessage),
/* harmony export */   ui: () => (/* binding */ showDialog)
/* harmony export */ });
/* unused harmony exports debounce, toggleLoader, clearMessage, parseDate, getNestedValue, calculateRelativeDate, getContrastYIQ, normalizeString, normalizeTimelineData, filterTimelineEvents */
/**
 * Exibe um modal customizado de confirmação.
 * @param {Object} options
 * @param {string} options.message Mensagem a exibir
 * @param {Function} options.onConfirm Callback para confirmação
 * @param {Function} [options.onCancel] Callback para cancelamento
 */
function showDialog({
  message,
  onConfirm,
  onCancel
}) {
  let modal = document.getElementById('custom-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div class="mb-4 text-slate-800 text-base" id="custom-confirm-message"></div>
          <div class="flex justify-end gap-2">
            <button id="custom-confirm-cancel" class="px-4 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300">Cancelar</button>
            <button id="custom-confirm-ok" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  modal.querySelector('#custom-confirm-message').textContent = message;
  const okBtn = modal.querySelector('#custom-confirm-ok');
  const cancelBtn = modal.querySelector('#custom-confirm-cancel');
  const close = () => {
    modal.style.display = 'none';
  };
  okBtn.onclick = () => {
    close();
    onConfirm && onConfirm();
  };
  cancelBtn.onclick = () => {
    close();
    onCancel && onCancel();
  };
}
/**
 * @file Contém funções utilitárias compartilhadas em toda a extensão.
 */

/**
 * Atraso na execução de uma função após o utilizador parar de digitar.
 * @param {Function} func A função a ser executada.
 * @param {number} [delay=500] O tempo de espera em milissegundos.
 * @returns {Function} A função com debounce.
 */
function debounce(func, delay = 500) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Mostra ou esconde o loader principal.
 * @param {boolean} show - `true` para mostrar, `false` para esconder.
 */
function toggleLoader(show) {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

/**
 * Exibe uma mensagem na área de mensagens.
 * @param {string} text O texto da mensagem.
 * @param {'error' | 'success' | 'info'} [type='error'] O tipo de mensagem.
 */
function showMessage(text, type = 'error') {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.textContent = text;
    const typeClasses = {
      error: 'bg-red-100 text-red-700',
      success: 'bg-green-100 text-green-700',
      info: 'bg-blue-100 text-blue-700'
    };
    messageArea.className = `p-3 rounded-md text-sm ${typeClasses[type] || typeClasses.error}`;
    messageArea.style.display = 'block';
  }
}

/**
 * Limpa a área de mensagens.
 */
function clearMessage() {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.style.display = 'none';
  }
}

/**
 * Converte uma string de data em vários formatos para um objeto Date.
 * @param {string} dateString A data no formato "dd/MM/yyyy" ou "yyyy-MM-dd", podendo conter prefixos.
 * @returns {Date|null} O objeto Date ou null se a string for inválida.
 */
function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  // Tenta extrair o primeiro padrão de data válido da string.
  const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{2,4})/);
  if (!dateMatch) return null;
  const matchedDate = dateMatch[0];
  let year, month, day;

  // Tenta o formato YYYY-MM-DD
  if (matchedDate.includes('-')) {
    [year, month, day] = matchedDate.split('-').map(Number);
  } else if (matchedDate.includes('/')) {
    // Tenta o formato DD/MM/YYYY
    [day, month, year] = matchedDate.split('/').map(Number);
  }

  // Valida se os números são válidos e se a data é real
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Lida com anos de 2 dígitos (ex: '24' -> 2024)
  if (year >= 0 && year < 100) {
    year += 2000;
  }
  const date = new Date(Date.UTC(year, month - 1, day));

  // Confirma que a data não "rolou" para o mês seguinte (ex: 31 de Abril -> 1 de Maio)
  if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
    return date;
  }
  return null; // Retorna nulo se a data for inválida (ex: 31/02/2024)
}

/**
 * Obtém um valor aninhado de um objeto de forma segura.
 * @param {object} obj O objeto.
 * @param {string} path O caminho para a propriedade (ex: 'a.b.c').
 * @returns {*} O valor encontrado ou undefined.
 */
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Calcula uma data relativa à data atual com base num desvio em meses.
 * @param {number} offsetInMonths - O número de meses a adicionar ou subtrair.
 * @returns {Date} O objeto Date resultante.
 */
function calculateRelativeDate(offsetInMonths) {
  const date = new Date();
  // setMonth lida corretamente com transições de ano e dias do mês
  date.setMonth(date.getMonth() + offsetInMonths);
  return date;
}

/**
 * Retorna 'black' ou 'white' para o texto dependendo do contraste com a cor de fundo.
 * @param {string} hexcolor - A cor de fundo em formato hexadecimal (com ou sem #).
 * @returns {'black' | 'white'}
 */
function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
}

/**
 * Normaliza uma string removendo acentos, cedilha e convertendo para minúsculas.
 * @param {string} str - A string a ser normalizada.
 * @returns {string} A string normalizada.
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Configura um sistema de abas (tabs) dentro de um container.
 * @param {HTMLElement} container - O elemento que contém os botões e os painéis das abas.
 */
function setupTabs(container) {
  if (!container) return;
  const tabButtons = container.querySelectorAll('.tab-button');
  const tabContents = container.querySelectorAll('.tab-content');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      const activeContent = container.querySelector(`#${tabName}-tab`);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}

/**
 * Normalizes data from various sources into a single, sorted timeline event list.
 * @param {object} apiData - An object containing arrays of consultations, exams, etc.
 * @returns {Array<object>} A sorted array of timeline event objects.
 */
function normalizeTimelineData(apiData) {
  const events = [];

  // Normalize Consultations
  try {
    (apiData.consultations || []).forEach(c => {
      if (!c || !c.date) return;
      const searchText = normalizeString([c.specialty, c.professional, c.unit, ...c.details.map(d => d.value)].join(' '));
      events.push({
        type: 'consultation',
        date: parseDate(c.date.split('\n')[0]),
        sortableDate: c.sortableDate || parseDate(c.date),
        title: `Consulta: ${c.specialty || 'Especialidade não informada'}`,
        summary: `com ${c.professional || 'Profissional não informado'}`,
        details: c,
        subDetails: c.details || [],
        searchText
      });
    });
  } catch (e) {
    console.error('Failed to normalize consultation data for timeline:', e);
  }

  // Normalize Exams
  try {
    (apiData.exams || []).forEach(e => {
      const eventDate = parseDate(e.date);
      if (!e || !eventDate) return;
      const searchText = normalizeString([e.examName, e.professional, e.specialty].filter(Boolean).join(' '));
      events.push({
        type: 'exam',
        date: eventDate,
        sortableDate: eventDate,
        title: `Exame Solicitado: ${e.examName || 'Nome não informado'}`,
        summary: `Solicitado por ${e.professional || 'Não informado'}`,
        details: e,
        subDetails: [{
          label: 'Resultado',
          value: e.hasResult ? 'Disponível' : 'Pendente'
        }],
        searchText
      });
    });
  } catch (e) {
    console.error('Failed to normalize exam data for timeline:', e);
  }

  // Normalize Appointments
  try {
    (apiData.appointments || []).forEach(a => {
      if (!a || !a.date) return;
      const searchText = normalizeString([a.specialty, a.description, a.location, a.professional].join(' '));
      events.push({
        type: 'appointment',
        date: parseDate(a.date),
        sortableDate: parseDate(a.date),
        title: `Agendamento: ${a.specialty || a.description || 'Não descrito'}`,
        summary: a.location || 'Local não informado',
        details: a,
        subDetails: [{
          label: 'Status',
          value: a.status || 'N/A'
        }, {
          label: 'Hora',
          value: a.time || 'N/A'
        }],
        searchText
      });
    });
  } catch (e) {
    console.error('Failed to normalize appointment data for timeline:', e);
  }

  // Normalize Regulations
  try {
    (apiData.regulations || []).forEach(r => {
      if (!r || !r.date) return;
      const searchText = normalizeString([r.procedure, r.requester, r.provider, r.cid].join(' '));
      events.push({
        type: 'regulation',
        date: parseDate(r.date),
        sortableDate: parseDate(r.date),
        title: `Regulação: ${r.procedure || 'Procedimento não informado'}`,
        summary: `Solicitante: ${r.requester || 'Não informado'}`,
        details: r,
        subDetails: [{
          label: 'Status',
          value: r.status || 'N/A'
        }, {
          label: 'Prioridade',
          value: r.priority || 'N/A'
        }],
        searchText
      });
    });
  } catch (e) {
    console.error('Failed to normalize regulation data for timeline:', e);
  }

  // --- INÍCIO DA MODIFICAÇÃO ---
  // Normalize Documents
  try {
    (apiData.documents || []).forEach(doc => {
      if (!doc || !doc.date) return;
      const searchText = normalizeString(doc.description || '');
      events.push({
        type: 'document',
        date: parseDate(doc.date),
        sortableDate: parseDate(doc.date),
        title: `Documento: ${doc.description || 'Sem descrição'}`,
        summary: `Tipo: ${doc.fileType.toUpperCase()}`,
        details: doc,
        subDetails: [],
        searchText
      });
    });
  } catch (e) {
    console.error('Failed to normalize document data for timeline:', e);
  }
  // --- FIM DA MODIFICAÇÃO ---

  // Filter out events with invalid dates and sort all events by date, newest first.
  return events.filter(event => event.sortableDate instanceof Date && !isNaN(event.sortableDate)).sort((a, b) => b.sortableDate - a.sortableDate);
}

/**
 * Filters timeline events based on automation rule filters.
 * @param {Array<object>} events - The full array of timeline events.
 * @param {object} automationFilters - The filter settings from an automation rule.
 * @returns {Array<object>} A new array with the filtered events.
 */
function filterTimelineEvents(events, automationFilters) {
  if (!automationFilters) return events;
  const checkText = (text, filterValue) => {
    if (!filterValue) return true; // If filter is empty, it passes
    const terms = filterValue.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    if (terms.length === 0) return true;
    const normalizedText = normalizeString(text || '');
    return terms.some(term => normalizedText.includes(term));
  };
  return events.filter(event => {
    try {
      switch (event.type) {
        case 'consultation':
          {
            const consultFilters = automationFilters.consultations || {};
            // Procura por um campo rotulado como CID ou CIAP para uma busca precisa.
            const cidDetail = (event.details.details || []).find(d => normalizeString(d.label).includes('cid') || normalizeString(d.label).includes('ciap'));
            const cidText = cidDetail ? cidDetail.value : '';
            return checkText(event.details.specialty, consultFilters['consultation-filter-specialty']) && checkText(event.details.professional, consultFilters['consultation-filter-professional']) && checkText(cidText, consultFilters['consultation-filter-cid']);
          }
        case 'exam':
          {
            const examFilters = automationFilters.exams || {};
            return checkText(event.details.examName, examFilters['exam-filter-name']) && checkText(event.details.professional, examFilters['exam-filter-professional']) && checkText(event.details.specialty, examFilters['exam-filter-specialty']);
          }
        case 'appointment':
          {
            const apptFilters = automationFilters.appointments || {};
            const apptText = `${event.details.specialty} ${event.details.professional} ${event.details.location}`;
            return checkText(apptText, apptFilters['appointment-filter-term']);
          }
        case 'regulation':
          {
            const regFilters = automationFilters.regulations || {};
            return checkText(event.details.procedure, regFilters['regulation-filter-procedure']) && checkText(event.details.requester, regFilters['regulation-filter-requester']) && (regFilters['regulation-filter-status'] === 'todos' || !regFilters['regulation-filter-status'] || event.details.status.toUpperCase() === regFilters['regulation-filter-status'].toUpperCase()) && (regFilters['regulation-filter-priority'] === 'todas' || !regFilters['regulation-filter-priority'] || event.details.priority.toUpperCase() === regFilters['regulation-filter-priority'].toUpperCase());
          }
        default:
          return true;
      }
    } catch (e) {
      console.warn('Error filtering timeline event, it will be included by default:', event, e);
      return true;
    }
  });
}

/***/ }),

/***/ 640:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var bluebird__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(104);
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(574);
/* harmony import */ var _field_config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(869);
/* harmony import */ var _filter_config_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(733);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(239);

 // Importa a API para buscar prioridades





// --- Constantes ---
const CONFIG_VERSION = '1.3'; // Versão da estrutura de configuração

// --- Variáveis de Estado ---
let automationRules = [];
let currentlyEditingRuleId = null;
let draggedTab = null; // Variável para a aba arrastada

// --- Elementos do DOM ---
const saveButton = document.getElementById('saveButton');
const statusMessage = document.getElementById('statusMessage');
const closeButton = document.getElementById('closeButton');
const restoreDefaultsButton = document.getElementById('restoreDefaultsButton');
const exportButton = document.getElementById('exportButton');
const importFileInput = document.getElementById('import-file-input');

// Ficha do Paciente
const mainFieldsZone = document.getElementById('main-fields-zone');
const moreFieldsZone = document.getElementById('more-fields-zone');

// Abas e Zonas de Filtros Manuais
const allDropZones = document.querySelectorAll('.drop-zone');

// --- Elementos do DOM para o Gerenciador de Automação ---
const automationRulesList = document.getElementById('automation-rules-list');
const createNewRuleBtn = document.getElementById('create-new-rule-btn');
const ruleEditorModal = document.getElementById('rule-editor-modal');
const ruleEditorTitle = document.getElementById('rule-editor-title');
const ruleNameInput = document.getElementById('rule-name-input');
const ruleTriggersInput = document.getElementById('rule-triggers-input');
const cancelRuleBtn = document.getElementById('cancel-rule-btn');
const saveRuleBtn = document.getElementById('save-rule-btn');

/**
 * Cria um elemento de campo arrastável para a Ficha do Paciente.
 * @param {object} field - O objeto de configuração do campo.
 * @returns {HTMLElement} O elemento <div> do campo.
 */
function createDraggableField(field) {
  const div = document.createElement('div');
  div.className = 'draggable';
  div.dataset.fieldId = field.id;
  div.draggable = true;
  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <input type="checkbox" class="field-enabled-checkbox" ${field.enabled ? 'checked' : ''}>
    <input type="text" class="field-label-input" value="${field.label}">
  `;
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);
  return div;
}

/**
 * Cria um elemento de filtro arrastável com controlos para valor padrão.
 * @param {object} filter - O objeto de configuração do filtro.
 * @param {Array<object>} priorities - A lista de prioridades dinâmicas para a regulação.
 * @returns {HTMLElement} O elemento <div> do filtro.
 */
function createDraggableFilter(filter, priorities = []) {
  const div = document.createElement('div');
  div.className = 'draggable';
  div.dataset.filterId = filter.id;
  div.draggable = true;
  const displayType = filter.type === 'selectGroup' ? 'select' : filter.type;
  let defaultValueControl = '';
  if (filter.type !== 'component') {
    switch (filter.type) {
      case 'text':
        {
          defaultValueControl = '<input type="text" class="filter-default-value-input w-full" placeholder="Valor padrão...">';
          break;
        }
      case 'select':
      case 'selectGroup':
        {
          let optionsHtml = '';
          if (filter.id === 'regulation-filter-priority') {
            // Constrói o dropdown de prioridades dinamicamente
            optionsHtml = filter.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join(''); // Adiciona "Todas"
            priorities.forEach(prio => {
              optionsHtml += `<option value="${prio.coreDescricao}">${prio.coreDescricao}</option>`;
            });
          } else {
            // Lógica original para outros selects
            optionsHtml = (filter.options || []).map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
          }
          defaultValueControl = `<select class="filter-default-value-input w-full">${optionsHtml}</select>`;
          break;
        }
      case 'checkbox':
        {
          defaultValueControl = '<input type="checkbox" class="filter-default-value-input h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">';
          break;
        }
    }
  }
  div.innerHTML = `
    <span class="drag-handle">⠿</span>
    <div class="flex-grow flex flex-col gap-2">
        <div class="flex justify-between items-center">
            <span class="font-medium text-sm">${filter.label}</span>
            <span class="text-xs text-slate-400 p-1 bg-slate-100 rounded">${displayType}</span>
        </div>
        ${defaultValueControl ? `
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <label for="default-${filter.id}">Padrão:</label>
            ${defaultValueControl.replace('class="', `id="default-${filter.id}" class="`)}
        </div>` : ''}
    </div>
  `;
  if (filter.type === 'component') {
    div.classList.add('draggable-component');
  }
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);
  return div;
}

/**
 * Renderiza os campos da Ficha do Paciente nas zonas corretas.
 * @param {Array<object>} config - A configuração de campos.
 */
function renderPatientFields(config) {
  mainFieldsZone.innerHTML = '';
  moreFieldsZone.innerHTML = '';
  const sortedConfig = [...config].sort((a, b) => a.order - b.order);
  sortedConfig.forEach(field => {
    const fieldElement = createDraggableField(field);
    if (field.section === 'main') {
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
function renderFilterLayout(_x) {
  return _renderFilterLayout.apply(this, arguments);
}
/**
 * Reordena os botões das abas na página de opções com base na ordem salva.
 * @param {string[]} order - Array de IDs de abas na ordem correta.
 */
function _renderFilterLayout() {
  _renderFilterLayout = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (layout) {
    let priorities = [];
    try {
      const baseUrl = yield _api_js__WEBPACK_IMPORTED_MODULE_1__/* .getBaseUrl */ .$_();
      if (baseUrl) {
        priorities = yield _api_js__WEBPACK_IMPORTED_MODULE_1__/* .fetchRegulationPriorities */ .$4();
      }
    } catch (error) {
      console.error('Não foi possível carregar prioridades:', error);
    }
    Object.keys(_filter_config_js__WEBPACK_IMPORTED_MODULE_3__/* .filterConfig */ .J).forEach(section => {
      const mainZone = document.getElementById(`${section}-main-filters-zone`);
      const moreZone = document.getElementById(`${section}-more-filters-zone`);
      if (mainZone) mainZone.innerHTML = '';
      if (moreZone) moreZone.innerHTML = '';
    });
    Object.entries(_filter_config_js__WEBPACK_IMPORTED_MODULE_3__/* .filterConfig */ .J).forEach(([sectionKey, filters]) => {
      const sectionLayout = layout[sectionKey] || [];
      const layoutMap = new Map(sectionLayout.map(f => [f.id, f]));
      const sortedFilters = [...filters].sort((a, b) => {
        var _layoutMap$get$order, _layoutMap$get, _layoutMap$get$order2, _layoutMap$get2;
        const orderA = (_layoutMap$get$order = (_layoutMap$get = layoutMap.get(a.id)) === null || _layoutMap$get === void 0 ? void 0 : _layoutMap$get.order) !== null && _layoutMap$get$order !== void 0 ? _layoutMap$get$order : Infinity;
        const orderB = (_layoutMap$get$order2 = (_layoutMap$get2 = layoutMap.get(b.id)) === null || _layoutMap$get2 === void 0 ? void 0 : _layoutMap$get2.order) !== null && _layoutMap$get$order2 !== void 0 ? _layoutMap$get$order2 : Infinity;
        return orderA - orderB;
      });
      sortedFilters.forEach(filter => {
        const filterLayoutData = layoutMap.get(filter.id);
        const location = (filterLayoutData === null || filterLayoutData === void 0 ? void 0 : filterLayoutData.location) || filter.defaultLocation;
        if (sectionKey === 'patient-card') return;
        const zoneId = `${sectionKey}-${location}-filters-zone`;
        const zone = document.getElementById(zoneId);
        if (zone) {
          const filterElement = createDraggableFilter(filter, priorities);
          zone.appendChild(filterElement);
          if (filter.type !== 'component' && filterLayoutData && filterLayoutData.defaultValue !== undefined) {
            const defaultValueInput = filterElement.querySelector('.filter-default-value-input');
            if (defaultValueInput) {
              if (defaultValueInput.type === 'checkbox') {
                defaultValueInput.checked = filterLayoutData.defaultValue;
              } else {
                defaultValueInput.value = filterLayoutData.defaultValue;
              }
            }
          }
        }
      });
    });
  });
  return _renderFilterLayout.apply(this, arguments);
}
function applyTabOrder(order) {
  const tabsContainer = document.querySelector('#filter-tabs-container .tabs');
  if (!tabsContainer) return;
  const tabMap = new Map();
  tabsContainer.querySelectorAll('.tab-button').forEach(tab => {
    tabMap.set(tab.dataset.tab, tab);
  });

  // Anexa as abas na ordem salva. As não encontradas na ordem (novas) permanecem.
  order.forEach(tabId => {
    const tabElement = tabMap.get(tabId);
    if (tabElement) {
      tabsContainer.appendChild(tabElement);
    }
  });
}

/**
 * Carrega a configuração salva e renderiza a página.
 */
function restoreOptions() {
  return _restoreOptions.apply(this, arguments);
}
/**
 * Salva as configurações GERAIS (não as regras de automação).
 */
function _restoreOptions() {
  _restoreOptions = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    const syncItems = yield browser.storage.sync.get({
      baseUrl: '',
      autoLoadExams: false,
      autoLoadConsultations: false,
      autoLoadAppointments: false,
      autoLoadRegulations: false,
      autoLoadDocuments: false,
      enableAutomaticDetection: true,
      keepSessionAliveInterval: 10,
      patientFields: _field_config_js__WEBPACK_IMPORTED_MODULE_2__/* .defaultFieldConfig */ .Q,
      filterLayout: {},
      dateRangeDefaults: {},
      sidebarSectionOrder: null,
      sectionHeaderStyles: {}
    });
    const localItems = yield browser.storage.local.get({
      automationRules: []
    });
    document.getElementById('baseUrlInput').value = syncItems.baseUrl || '';
    document.getElementById('enableAutomaticDetection').checked = syncItems.enableAutomaticDetection;
    document.getElementById('keepSessionAliveInterval').value = syncItems.keepSessionAliveInterval;
    document.getElementById('autoLoadExamsCheckbox').checked = syncItems.autoLoadExams;
    document.getElementById('autoLoadConsultationsCheckbox').checked = syncItems.autoLoadConsultations;
    document.getElementById('autoLoadAppointmentsCheckbox').checked = syncItems.autoLoadAppointments;
    document.getElementById('autoLoadRegulationsCheckbox').checked = syncItems.autoLoadRegulations;
    document.getElementById('autoLoadDocumentsCheckbox').checked = syncItems.autoLoadDocuments;
    if (syncItems.sidebarSectionOrder) {
      applyTabOrder(syncItems.sidebarSectionOrder);
    }
    const currentPatientFieldsConfig = _field_config_js__WEBPACK_IMPORTED_MODULE_2__/* .defaultFieldConfig */ .Q.map(defaultField => {
      const savedField = syncItems.patientFields.find(f => f.id === defaultField.id);
      return savedField ? {
        ...defaultField,
        ...savedField
      } : defaultField;
    });
    renderPatientFields(currentPatientFieldsConfig);
    try {
      yield renderFilterLayout(syncItems.filterLayout);
    } catch (error) {
      console.error('Erro ao renderizar filtros:', error);
    }
    const sections = ['patient-details', 'timeline', 'consultations', 'exams', 'appointments', 'regulations', 'documents'];
    const defaultRanges = {
      consultations: {
        start: -6,
        end: 0
      },
      exams: {
        start: -6,
        end: 0
      },
      appointments: {
        start: -1,
        end: 3
      },
      regulations: {
        start: -12,
        end: 0
      },
      documents: {
        start: -24,
        end: 0
      }
    };

    // CORREÇÃO 2: Define os estilos padrão aqui.
    const defaultStyles = {
      backgroundColor: '#ffffff',
      color: '#1e293b',
      iconColor: '#1e293b',
      fontSize: '16px'
    };
    sections.forEach(section => {
      if (defaultRanges[section]) {
        const range = syncItems.dateRangeDefaults[section] || defaultRanges[section];
        const startOffsetEl = document.getElementById(`${section}-start-offset`);
        const endOffsetEl = document.getElementById(`${section}-end-offset`);
        if (startOffsetEl) startOffsetEl.value = Math.abs(range.start);
        if (endOffsetEl) endOffsetEl.value = range.end;
      }

      // Restaura estilos, usando os padrões como base.
      const savedStyle = syncItems.sectionHeaderStyles[section] || {};
      const style = {
        ...defaultStyles,
        ...savedStyle
      };
      const bgColorEl = document.getElementById(`style-${section}-bg-color`);
      const fontColorEl = document.getElementById(`style-${section}-font-color`);
      const iconColorEl = document.getElementById(`style-${section}-icon-color`);
      const fontSizeEl = document.getElementById(`style-${section}-font-size`);
      if (bgColorEl) bgColorEl.value = style.backgroundColor;
      if (fontColorEl) fontColorEl.value = style.color;
      if (iconColorEl) iconColorEl.value = style.iconColor;
      if (fontSizeEl) fontSizeEl.value = style.fontSize;
    });
    automationRules = localItems.automationRules || [];
    renderAutomationRules();
  });
  return _restoreOptions.apply(this, arguments);
}
function saveOptions() {
  return _saveOptions.apply(this, arguments);
} // --- Lógica de Arrastar e Soltar (Drag and Drop) ---
function _saveOptions() {
  _saveOptions = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    const baseUrl = document.getElementById('baseUrlInput').value;
    const enableAutomaticDetection = document.getElementById('enableAutomaticDetection').checked;
    const keepSessionAliveInterval = parseInt(document.getElementById('keepSessionAliveInterval').value, 10) || 0;
    const autoLoadExams = document.getElementById('autoLoadExamsCheckbox').checked;
    const autoLoadConsultations = document.getElementById('autoLoadConsultationsCheckbox').checked;
    const autoLoadAppointments = document.getElementById('autoLoadAppointmentsCheckbox').checked;
    const autoLoadRegulations = document.getElementById('autoLoadRegulationsCheckbox').checked;
    const autoLoadDocuments = document.getElementById('autoLoadDocumentsCheckbox').checked;
    const patientFields = [];
    mainFieldsZone.querySelectorAll('.draggable').forEach((div, index) => {
      const fieldId = div.dataset.fieldId;
      const label = div.querySelector('.field-label-input').value;
      const enabled = div.querySelector('.field-enabled-checkbox').checked;
      patientFields.push({
        id: fieldId,
        label,
        enabled,
        section: 'main',
        order: index + 1
      });
    });
    moreFieldsZone.querySelectorAll('.draggable').forEach((div, index) => {
      const fieldId = div.dataset.fieldId;
      const label = div.querySelector('.field-label-input').value;
      const enabled = div.querySelector('.field-enabled-checkbox').checked;
      patientFields.push({
        id: fieldId,
        label,
        enabled,
        section: 'more',
        order: index + 1
      });
    });
    const filterLayout = {};
    document.querySelectorAll('#layout-config-section .drop-zone').forEach(zone => {
      if (!zone.dataset.section) return;
      const section = zone.dataset.section;
      if (!filterLayout[section]) filterLayout[section] = [];
      const location = zone.id.includes('-main-') ? 'main' : 'more';
      zone.querySelectorAll('.draggable').forEach((div, index) => {
        const filterId = div.dataset.filterId;
        const originalFilter = _filter_config_js__WEBPACK_IMPORTED_MODULE_3__/* .filterConfig */ .J[section].find(f => f.id === filterId);
        const newFilterData = {
          id: filterId,
          location: location,
          order: index + 1
        };
        if (originalFilter.type !== 'component') {
          const defaultValueInput = div.querySelector('.filter-default-value-input');
          if (defaultValueInput) {
            newFilterData.defaultValue = defaultValueInput.type === 'checkbox' ? defaultValueInput.checked : defaultValueInput.value;
          }
        }
        filterLayout[section].push(newFilterData);
      });
    });
    const dateRangeDefaults = {};
    const sectionsForDate = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
    sectionsForDate.forEach(section => {
      const startEl = document.getElementById(`${section}-start-offset`);
      const endEl = document.getElementById(`${section}-end-offset`);
      if (startEl && endEl) {
        const start = -parseInt(startEl.value, 10) || 0;
        const end = parseInt(endEl.value, 10) || 0;
        dateRangeDefaults[section] = {
          start,
          end
        };
      }
    });
    const sectionHeaderStyles = {};
    const sectionsForStyle = ['patient-details', 'timeline', 'consultations', 'exams', 'appointments', 'regulations', 'documents'];
    sectionsForStyle.forEach(section => {
      const bgColorEl = document.getElementById(`style-${section}-bg-color`);
      if (bgColorEl) {
        // Check if the element exists before accessing properties
        sectionHeaderStyles[section] = {
          backgroundColor: bgColorEl.value,
          color: document.getElementById(`style-${section}-font-color`).value,
          iconColor: document.getElementById(`style-${section}-icon-color`).value,
          fontSize: document.getElementById(`style-${section}-font-size`).value
        };
      }
    });
    const sidebarSectionOrder = [...document.querySelectorAll('.tabs .tab-button')].map(btn => btn.dataset.tab);
    yield browser.storage.sync.set({
      baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
      enableAutomaticDetection,
      keepSessionAliveInterval,
      autoLoadExams,
      autoLoadConsultations,
      autoLoadAppointments,
      autoLoadRegulations,
      autoLoadDocuments,
      patientFields,
      filterLayout,
      dateRangeDefaults,
      sidebarSectionOrder,
      sectionHeaderStyles
    });
    _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Configurações salvas! As alterações serão aplicadas ao recarregar o assistente.', 'success');
    setTimeout(() => {
      const statusMsg = document.getElementById('statusMessage');
      if (statusMsg) {
        statusMsg.textContent = '';
        statusMsg.className = 'text-sm font-medium';
      }
    }, 4000);
  });
  return _saveOptions.apply(this, arguments);
}
let draggedElement = null;
function handleDragStart(e) {
  draggedElement = e.target.closest('.draggable, .rule-item');
  if (!draggedElement) return;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => draggedElement.classList.add('dragging'), 0);
}
function handleDragEnd() {
  if (!draggedElement) return;
  draggedElement.classList.remove('dragging');
  draggedElement = null;
}
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function handleDrop(e) {
  e.preventDefault();
  if (!draggedElement) return;
  const dropZone = e.target.closest('.drop-zone, #automation-rules-list');
  if (dropZone) {
    const afterElement = getDragAfterElement(dropZone, e.clientY);
    if (afterElement == null) {
      dropZone.appendChild(draggedElement);
    } else {
      dropZone.insertBefore(draggedElement, afterElement);
    }
    if (dropZone.id === 'automation-rules-list') {
      reorderAutomationRules();
    }
  }
}
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging), .rule-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return {
        offset: offset,
        element: child
      };
    } else {
      return closest;
    }
  }, {
    offset: Number.NEGATIVE_INFINITY
  }).element;
}

// --- Lógica de Arrastar e Soltar para Abas ---
function getDragAfterTab(container, x) {
  const draggableElements = [...container.querySelectorAll('.tab-button:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset && child.draggable) {
      return {
        offset: offset,
        element: child
      };
    } else {
      return closest;
    }
  }, {
    offset: Number.NEGATIVE_INFINITY
  }).element;
}
function setupTabDnD(container) {
  if (!container) return;
  const tabs = container.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    if (tab.dataset.tab !== 'patient-card') {
      tab.draggable = true;
    }
  });
  container.addEventListener('dragstart', e => {
    if (e.target.classList.contains('tab-button') && e.target.draggable) {
      draggedTab = e.target;
      setTimeout(() => e.target.classList.add('dragging'), 0);
    }
  });
  container.addEventListener('dragend', () => {
    if (draggedTab) {
      draggedTab.classList.remove('dragging');
      draggedTab = null;
    }
  });
  container.addEventListener('dragover', e => {
    e.preventDefault();
    if (!draggedTab) return;
    const afterElement = getDragAfterTab(container, e.clientX);
    if (afterElement) {
      container.insertBefore(draggedTab, afterElement);
    } else {
      container.appendChild(draggedTab);
    }
  });
}

// --- Lógica para Restaurar Padrões ---
function handleRestoreDefaults() {
  return _handleRestoreDefaults.apply(this, arguments);
} // --- Lógica de Exportação e Importação ---
function _handleRestoreDefaults() {
  _handleRestoreDefaults = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showDialog */ .ui({
      message: 'Tem certeza de que deseja restaurar todas as configurações de layout e valores padrão? Isto também restaurará a ordem das seções e os estilos dos cabeçalhos. Esta ação não pode ser desfeita.',
      onConfirm: function () {
        var _ref4 = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
          yield browser.storage.sync.remove(['patientFields', 'filterLayout', 'dateRangeDefaults', 'enableAutomaticDetection', 'sidebarSectionOrder', 'sectionHeaderStyles']);
          mainFieldsZone.innerHTML = '';
          moreFieldsZone.innerHTML = '';
          window.location.reload();
        });
        return function onConfirm() {
          return _ref4.apply(this, arguments);
        };
      }()
    });
  });
  return _handleRestoreDefaults.apply(this, arguments);
}
function handleExport() {
  return _handleExport.apply(this, arguments);
}
function _handleExport() {
  _handleExport = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    try {
      const settingsToExport = yield browser.storage.sync.get(null);
      settingsToExport.configVersion = CONFIG_VERSION;
      const settingsString = JSON.stringify(settingsToExport, null, 2);
      const blob = new Blob([settingsString], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `assistente-regulacao-config-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Configurações exportadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Erro ao exportar configurações.', 'error');
    } finally {
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  });
  return _handleExport.apply(this, arguments);
}
function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = /*#__PURE__*/function () {
    var _ref = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (e) {
      try {
        const importedSettings = JSON.parse(e.target.result);
        if (!importedSettings.configVersion || !importedSettings.filterLayout) {
          throw new Error('Ficheiro de configuração inválido ou corrompido.');
        }
        if (importedSettings.configVersion.split('.')[0] !== CONFIG_VERSION.split('.')[0]) {
          _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showDialog */ .ui({
            message: 'A versão do ficheiro de configuração é muito diferente da versão da extensão. A importação pode causar erros. Deseja continuar mesmo assim?',
            onConfirm: function () {
              var _ref2 = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
                yield browser.storage.sync.clear();
                yield browser.storage.sync.set(importedSettings);
                restoreOptions();
                _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Configurações importadas e aplicadas com sucesso!', 'success');
              });
              return function onConfirm() {
                return _ref2.apply(this, arguments);
              };
            }()
          });
          return;
        }
        yield browser.storage.sync.clear();
        yield browser.storage.sync.set(importedSettings);
        restoreOptions();
        _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Configurações importadas e aplicadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao importar configurações:', error);
        _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG(`Erro ao importar: ${error.message}`, 'error');
      } finally {
        importFileInput.value = '';
        setTimeout(() => {
          statusMessage.textContent = '';
        }, 5000);
      }
    });
    return function (_x2) {
      return _ref.apply(this, arguments);
    };
  }();
  reader.readAsText(file);
}

// --- LÓGICA PARA O GERENCIADOR DE AUTOMAÇÃO ---

/**
 * Renderiza a lista de regras de automação na UI.
 */
function renderAutomationRules() {
  automationRulesList.innerHTML = '';
  automationRules.forEach(rule => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'rule-item border rounded-lg bg-white p-3';
    ruleElement.dataset.ruleId = rule.id;
    ruleElement.draggable = true;
    const keywords = rule.triggerKeywords.join(', ');
    const checked = rule.isActive ? 'checked' : '';
    ruleElement.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="drag-handle cursor-grab text-slate-400">⠿</span>
                <div>
                  <p class="font-semibold text-slate-800">${rule.name}</p>
                  <p class="text-xs text-slate-500" title="${keywords}">Gatilhos: ${keywords.length > 50 ? keywords.substring(0, 50) + '...' : keywords}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <label class="relative inline-flex items-center cursor-pointer" title="${rule.isActive ? 'Regra Ativa' : 'Regra Inativa'}">
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
  document.querySelectorAll('.rule-item').forEach(item => {
    const ruleId = item.dataset.ruleId;
    item.querySelector('.rule-edit-btn').addEventListener('click', () => handleEditRule(ruleId));
    item.querySelector('.rule-delete-btn').addEventListener('click', () => handleDeleteRule(ruleId));
    item.querySelector('.rule-duplicate-btn').addEventListener('click', () => handleDuplicateRule(ruleId));
    item.querySelector('.rule-toggle-active').addEventListener('change', e => handleToggleRuleActive(ruleId, e.target.checked));
  });
}

/**
 * Salva o array de regras de automação no storage local.
 */
function saveAutomationRules() {
  return _saveAutomationRules.apply(this, arguments);
}
/**
 * Abre o modal do editor de regras, preenchendo-o se uma regra for fornecida.
 * @param {string|null} ruleId - O ID da regra a ser editada, ou null para criar uma nova.
 */
function _saveAutomationRules() {
  _saveAutomationRules = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    yield browser.storage.local.set({
      automationRules
    });
    _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('Regras de automação salvas.', 'success');
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 2000);
  });
  return _saveAutomationRules.apply(this, arguments);
}
function openRuleEditor() {
  return _openRuleEditor.apply(this, arguments);
}
/**
 * Fecha o modal do editor de regras.
 */
function _openRuleEditor() {
  _openRuleEditor = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (ruleId = null) {
    currentlyEditingRuleId = ruleId;
    yield populateRuleEditorFilters();
    if (ruleId) {
      const rule = automationRules.find(r => r.id === ruleId);
      if (!rule) return;
      ruleEditorTitle.textContent = 'Editar Regra de Automação';
      ruleNameInput.value = rule.name;
      ruleTriggersInput.value = rule.triggerKeywords.join(', ');
      Object.entries(rule.filterSettings).forEach(([sectionKey, filters]) => {
        // --- INÍCIO DA CORREÇÃO ---
        // Preenche os filtros de data
        if (filters && filters.dateRange) {
          const {
            start,
            end
          } = filters.dateRange;
          const startOffsetEl = document.getElementById(`rule-${sectionKey}-start-offset`);
          const endOffsetEl = document.getElementById(`rule-${sectionKey}-end-offset`);
          if (startOffsetEl && start !== null && !isNaN(start)) {
            startOffsetEl.value = Math.abs(start);
          } else if (startOffsetEl) {
            startOffsetEl.value = '';
          }
          if (endOffsetEl && end !== null && !isNaN(end)) {
            endOffsetEl.value = end;
          } else if (endOffsetEl) {
            endOffsetEl.value = '';
          }
        }
        // --- FIM DA CORREÇÃO ---

        // Preenche outros filtros
        Object.entries(filters).forEach(([filterId, value]) => {
          if (filterId === 'dateRange') return;
          const element = document.getElementById(`rule-${sectionKey}-${filterId}`);
          if (element) {
            if (element.type === 'checkbox') {
              element.checked = value;
            } else {
              element.value = value;
            }
          }
        });
      });
    } else {
      ruleEditorTitle.textContent = 'Criar Nova Regra de Automação';
      ruleNameInput.value = '';
      ruleTriggersInput.value = '';

      // Limpa todos os campos, incluindo os de data
      const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
      sections.forEach(sectionKey => {
        const startEl = document.getElementById(`rule-${sectionKey}-start-offset`);
        const endEl = document.getElementById(`rule-${sectionKey}-end-offset`);
        if (startEl) startEl.value = '';
        if (endEl) endEl.value = '';
      });
      document.querySelectorAll('#rule-editor-modal input[type="text"]:not(.rule-date-range-input), #rule-editor-modal input[type="search"]:not(.rule-date-range-input)').forEach(el => el.value = '');
      document.querySelectorAll('#rule-editor-modal input[type="checkbox"]').forEach(el => el.checked = false);
      document.querySelectorAll('#rule-editor-modal select').forEach(el => {
        if (el.options.length > 0) {
          el.value = el.options[0].value;
        }
      });
    }
    ruleEditorModal.classList.remove('hidden');
  });
  return _openRuleEditor.apply(this, arguments);
}
function closeRuleEditor() {
  ruleEditorModal.classList.add('hidden');
  currentlyEditingRuleId = null;
}

/**
 * Salva a regra (nova ou editada) do modal.
 */
function handleSaveRule() {
  const name = ruleNameInput.value.trim();
  if (!name) {
    _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showMessage */ .rG('O nome da regra é obrigatório.', 'error');
    return;
  }
  const triggerKeywords = ruleTriggersInput.value.split(',').map(k => k.trim()).filter(Boolean);
  const filterSettings = {};
  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
  sections.forEach(sectionKey => {
    filterSettings[sectionKey] = {};

    // --- INÍCIO DA CORREÇÃO ---
    // Salva as configurações de data
    const startOffsetEl = document.getElementById(`rule-${sectionKey}-start-offset`);
    const endOffsetEl = document.getElementById(`rule-${sectionKey}-end-offset`);
    const startVal = startOffsetEl.value;
    const endVal = endOffsetEl.value;
    const startNum = parseInt(startVal, 10);
    const endNum = parseInt(endVal, 10);
    if (!isNaN(startNum) || !isNaN(endNum)) {
      filterSettings[sectionKey].dateRange = {
        start: !isNaN(startNum) ? -startNum : null,
        end: !isNaN(endNum) ? endNum : null
      };
    }
    // --- FIM DA CORREÇÃO ---

    // Salva as configurações dos outros filtros
    const sectionFilters = _filter_config_js__WEBPACK_IMPORTED_MODULE_3__/* .filterConfig */ .J[sectionKey] || [];
    sectionFilters.forEach(filter => {
      if (filter.type === 'component') return;
      const element = document.getElementById(`rule-${sectionKey}-${filter.id}`);
      if (element) {
        const value = element.type === 'checkbox' ? element.checked : element.value;
        filterSettings[sectionKey][filter.id] = value;
      }
    });
  });
  if (currentlyEditingRuleId) {
    const ruleIndex = automationRules.findIndex(r => r.id === currentlyEditingRuleId);
    if (ruleIndex > -1) {
      automationRules[ruleIndex].name = name;
      automationRules[ruleIndex].triggerKeywords = triggerKeywords;
      automationRules[ruleIndex].filterSettings = filterSettings;
    }
  } else {
    const newRule = {
      id: Date.now().toString(),
      name,
      triggerKeywords,
      isActive: true,
      filterSettings
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
  _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .showDialog */ .ui({
    message: 'Tem certeza que deseja excluir esta regra?',
    onConfirm: () => {
      automationRules = automationRules.filter(r => r.id !== ruleId);
      saveAutomationRules();
      renderAutomationRules();
    }
  });
}
function handleDuplicateRule(ruleId) {
  const originalRule = automationRules.find(r => r.id === ruleId);
  if (!originalRule) return;
  const newRule = JSON.parse(JSON.stringify(originalRule));
  newRule.id = Date.now().toString();
  newRule.name = `${originalRule.name} (Cópia)`;
  newRule.isActive = false;
  const originalIndex = automationRules.findIndex(r => r.id === ruleId);
  automationRules.splice(originalIndex + 1, 0, newRule);
  saveAutomationRules();
  renderAutomationRules();
}
function handleToggleRuleActive(ruleId, isActive) {
  const ruleIndex = automationRules.findIndex(r => r.id === ruleId);
  if (ruleIndex > -1) {
    automationRules[ruleIndex].isActive = isActive;
    saveAutomationRules();
  }
}
function reorderAutomationRules() {
  const newOrderedIds = [...automationRulesList.querySelectorAll('.rule-item')].map(item => item.dataset.ruleId);
  automationRules.sort((a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id));
  saveAutomationRules();
}

/**
 * Popula as abas do editor de regras com os controles de filtro apropriados.
 */
function populateRuleEditorFilters() {
  return _populateRuleEditorFilters.apply(this, arguments);
}
/**
 * Cria um único elemento de filtro para o modal do editor de regras.
 * @param {object} filter - O objeto de configuração do filtro.
 * @param {string} sectionKey - A chave da seção.
 * @param {Array<object>} priorities - A lista de prioridades dinâmicas.
 * @returns {HTMLElement} O elemento HTML do filtro.
 */
function _populateRuleEditorFilters() {
  _populateRuleEditorFilters = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    let priorities = [];
    try {
      const baseUrl = yield _api_js__WEBPACK_IMPORTED_MODULE_1__/* .getBaseUrl */ .$_();
      if (baseUrl) {
        priorities = yield _api_js__WEBPACK_IMPORTED_MODULE_1__/* .fetchRegulationPriorities */ .$4();
      }
    } catch (error) {
      console.error('Não foi possível carregar prioridades:', error);
    }
    const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
    sections.forEach(sectionKey => {
      const container = document.getElementById(`${sectionKey}-rule-editor-tab`);
      if (!container) return;
      container.innerHTML = ''; // Limpa o conteúdo anterior

      // Adiciona o componente de data
      const dateRangeElement = createDateRangeElementForRuleEditor(sectionKey);
      container.appendChild(dateRangeElement);
      const sectionFilters = _filter_config_js__WEBPACK_IMPORTED_MODULE_3__/* .filterConfig */ .J[sectionKey] || [];
      sectionFilters.forEach(filter => {
        if (filter.type === 'component') return;
        const filterElement = createFilterElementForRuleEditor(filter, sectionKey, priorities);
        container.appendChild(filterElement);
      });
    });
    const firstTabButton = document.querySelector('#rule-editor-filter-tabs .tab-button');
    if (firstTabButton) {
      firstTabButton.click();
    }
  });
  return _populateRuleEditorFilters.apply(this, arguments);
}
function createFilterElementForRuleEditor(filter, sectionKey, priorities) {
  const container = document.createElement('div');
  const elementId = `rule-${sectionKey}-${filter.id}`;
  let elementHtml = '';
  if (filter.type !== 'checkbox') {
    container.className = 'mb-3';
    elementHtml += `<label for="${elementId}" class="block font-medium mb-1 text-sm">${filter.label}</label>`;
  }
  switch (filter.type) {
    case 'text':
      elementHtml += `<input type="text" id="${elementId}" placeholder="${filter.placeholder || ''}" class="w-full px-2 py-1 border border-slate-300 rounded-md">`;
      break;
    case 'select':
    case 'selectGroup':
      elementHtml += `<select id="${elementId}" class="w-full px-2 py-1 border border-slate-300 rounded-md bg-white">`;
      if (filter.id === 'regulation-filter-priority') {
        elementHtml += '<option value="todas">Todas</option>';
        priorities.forEach(prio => {
          elementHtml += `<option value="${prio.coreDescricao}">${prio.coreDescricao}</option>`;
        });
      } else {
        (filter.options || []).forEach(opt => {
          elementHtml += `<option value="${opt.value}">${opt.text}</option>`;
        });
      }
      elementHtml += '</select>';
      break;
    case 'checkbox':
      container.className = 'flex items-center gap-2';
      elementHtml += `<input id="${elementId}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <label for="${elementId}" class="block text-sm text-slate-700">${filter.label}</label>`;
      break;
  }
  container.innerHTML = elementHtml;
  return container;
}

/**
 * Cria o componente de intervalo de datas para o editor de regras.
 * @param {string} sectionKey - A chave da seção.
 * @returns {HTMLElement} O elemento HTML do componente.
 */
function createDateRangeElementForRuleEditor(sectionKey) {
  const container = document.createElement('div');
  container.className = 'p-2 bg-slate-50 rounded-md border mb-4';
  container.innerHTML = `
    <h5 class="font-medium text-xs text-slate-500 mb-2">Período de Busca Automático</h5>
    <div class="flex items-center gap-4 text-sm">
        <div>
            <label for="rule-${sectionKey}-start-offset" class="text-xs">Início (meses antes):</label>
            <input type="number" id="rule-${sectionKey}-start-offset" class="w-20 p-1 border rounded-md rule-date-range-input" placeholder="Padrão" min="0">
        </div>
        <div>
            <label for="rule-${sectionKey}-end-offset" class="text-xs">Fim (meses depois):</label>
            <input type="number" id="rule-${sectionKey}-end-offset" class="w-20 p-1 border rounded-md rule-date-range-input" placeholder="Padrão" min="0">
        </div>
    </div>
    <p class="text-xs text-slate-400 mt-2">Deixe em branco para usar o padrão global da seção.</p>
  `;
  return container;
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', /*#__PURE__*/(0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
  yield restoreOptions();
  const mainTabsContainer = document.querySelector('#filter-tabs-container .tabs');
  _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .setupTabs */ .AQ(document.getElementById('filter-tabs-container'));
  if (mainTabsContainer) {
    setupTabDnD(mainTabsContainer);
  }
  _utils_js__WEBPACK_IMPORTED_MODULE_4__/* .setupTabs */ .AQ(document.getElementById('rule-editor-filter-tabs'));
  createNewRuleBtn.addEventListener('click', () => openRuleEditor(null));
  cancelRuleBtn.addEventListener('click', closeRuleEditor);
  saveRuleBtn.addEventListener('click', handleSaveRule);
  ruleEditorModal.addEventListener('click', e => {
    if (e.target === ruleEditorModal) {
      closeRuleEditor();
    }
  });
  automationRulesList.addEventListener('dragstart', handleDragStart);
  automationRulesList.addEventListener('dragend', handleDragEnd);
  automationRulesList.addEventListener('dragover', handleDragOver);
  automationRulesList.addEventListener('drop', handleDrop);
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.enableAutomaticDetection) {
      const toggle = document.getElementById('enableAutomaticDetection');
      if (toggle) {
        toggle.checked = changes.enableAutomaticDetection.newValue;
      }
    }
  });
}));
saveButton.addEventListener('click', saveOptions);
closeButton.addEventListener('click', () => {
  window.close();
});
restoreDefaultsButton.addEventListener('click', handleRestoreDefaults);
exportButton.addEventListener('click', handleExport);
importFileInput.addEventListener('change', handleImport);
allDropZones.forEach(zone => {
  zone.addEventListener('dragover', handleDragOver);
  zone.addEventListener('drop', handleDrop);
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 575;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			575: 0,
/******/ 			738: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkassistente_de_regulacao_medica"] = self["webpackChunkassistente_de_regulacao_medica"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,76], () => (__webpack_require__(640)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;