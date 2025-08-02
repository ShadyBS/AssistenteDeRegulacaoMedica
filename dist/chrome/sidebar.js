/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 239:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AQ: () => (/* binding */ setupTabs),
/* harmony export */   Eg: () => (/* binding */ getContrastYIQ),
/* harmony export */   J2: () => (/* binding */ normalizeString),
/* harmony export */   LJ: () => (/* binding */ getNestedValue),
/* harmony export */   Pr: () => (/* binding */ filterTimelineEvents),
/* harmony export */   Z9: () => (/* binding */ calculateRelativeDate),
/* harmony export */   _U: () => (/* binding */ parseDate),
/* harmony export */   de: () => (/* binding */ clearMessage),
/* harmony export */   i1: () => (/* binding */ toggleLoader),
/* harmony export */   rG: () => (/* binding */ showMessage),
/* harmony export */   sg: () => (/* binding */ debounce),
/* harmony export */   td: () => (/* binding */ normalizeTimelineData),
/* harmony export */   ui: () => (/* binding */ showDialog)
/* harmony export */ });
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

/***/ 627:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   T: () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(335);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(239);
/**
 * @file Módulo para gerir o card de "Dados do Paciente".
 */


let patientDetailsSection, patientMainInfoDiv, patientAdditionalInfoDiv, toggleDetailsBtn, patientCardFooter, cadsusTimestamp, refreshCadsusBtn;
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
  const {
    ficha,
    cadsus,
    lastCadsusCheck,
    isUpdating
  } = patientData;
  patientMainInfoDiv.innerHTML = '';
  patientAdditionalInfoDiv.innerHTML = '';
  const getLocalValue = (field, data) => {
    if (typeof field.key === 'function') return field.key(data);
    return _utils_js__WEBPACK_IMPORTED_MODULE_1__/* .getNestedValue */ .LJ(data, field.key);
  };
  const getCadsusValue = (field, data) => {
    if (!data || field.cadsusKey === null) return null;
    if (typeof field.cadsusKey === 'function') return field.cadsusKey(data);
    return data[field.cadsusKey];
  };
  const sortedFields = [...fieldConfigLayout].sort((a, b) => a.order - b.order);
  sortedFields.forEach(field => {
    if (!field.enabled) return;
    let localValue = getLocalValue(field, ficha);
    if (field.formatter) localValue = field.formatter(localValue);
    let cadsusValue = getCadsusValue(field, cadsus);
    if (field.formatter) cadsusValue = field.formatter(cadsusValue);
    const v1 = String(localValue || '').trim();
    const v2 = String(cadsusValue || '').trim();
    let icon = '';
    if (cadsus && field.cadsusKey !== null) {
      let compareV1 = v1;
      let compareV2 = v2;
      if (field.id === 'telefone') {
        compareV1 = v1.replace(/\D/g, '').replace(/^55/, '');
        compareV2 = v2.replace(/\D/g, '').replace(/^55/, '');
      } else {
        compareV1 = _utils_js__WEBPACK_IMPORTED_MODULE_1__/* .normalizeString */ .J2(v1);
        compareV2 = _utils_js__WEBPACK_IMPORTED_MODULE_1__/* .normalizeString */ .J2(v2);
      }
      if (compareV1 && compareV1 === compareV2) {
        icon = '<span class="comparison-icon" title="Dado confere com o CADSUS">✅</span>';
      } else {
        const tooltipText = `Ficha: ${v1 || 'Vazio'}\nCADSUS: ${v2 || 'Vazio'}`;
        icon = `<span class="comparison-icon" data-tooltip="${tooltipText}">⚠️</span>`;
      }
    }
    const valueClass = field.id.toLowerCase().includes('alerg') && v1 && v1 !== '-' ? 'text-red-600 font-bold' : 'text-slate-900';
    const copyIcon = v1 ? `<span class="copy-icon" title="Copiar" data-copy-text="${v1}">📄</span>` : '';
    const rowHtml = `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-600">${field.label}:</span><span class="${valueClass} text-right flex items-center">${v1 || '-'}${icon}${copyIcon}</span></div>`;
    if (field.section === 'main') {
      patientMainInfoDiv.innerHTML += rowHtml;
    } else {
      patientAdditionalInfoDiv.innerHTML += rowHtml;
    }
  });
  if (lastCadsusCheck) {
    cadsusTimestamp.textContent = `CADSUS verificado em: ${lastCadsusCheck.toLocaleString()}`;
    patientCardFooter.style.display = 'flex';
  } else {
    cadsusTimestamp.textContent = 'Não foi possível verificar dados do CADSUS.';
    patientCardFooter.style.display = 'flex';
  }
  refreshCadsusBtn.querySelector('.refresh-icon').classList.toggle('spinning', isUpdating);
  refreshCadsusBtn.disabled = isUpdating;
  toggleDetailsBtn.style.display = sortedFields.some(f => f.enabled && f.section === 'more') ? 'block' : 'none';
  patientDetailsSection.style.display = 'block';
}
function hide() {
  if (patientDetailsSection) patientDetailsSection.style.display = 'none';
}
function handleToggleDetails() {
  patientAdditionalInfoDiv.classList.toggle('show');
  toggleDetailsBtn.textContent = patientAdditionalInfoDiv.classList.contains('show') ? 'Mostrar menos' : 'Mostrar mais';
}
function handleForceRefresh() {
  const patient = _store_js__WEBPACK_IMPORTED_MODULE_0__/* .store */ .M.getPatient();
  if (patient && patient.ficha && onForceRefresh) {
    onForceRefresh({
      idp: patient.ficha.isenPK.idp,
      ids: patient.ficha.isenPK.ids
    }, true);
  }
}
function onStateChange() {
  const patient = _store_js__WEBPACK_IMPORTED_MODULE_0__/* .store */ .M.getPatient();
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
function init(config, callbacks) {
  patientDetailsSection = document.getElementById('patient-details-section');
  patientMainInfoDiv = document.getElementById('patient-main-info');
  patientAdditionalInfoDiv = document.getElementById('patient-additional-info');
  toggleDetailsBtn = document.getElementById('toggle-details-btn');
  patientCardFooter = document.getElementById('patient-card-footer');
  cadsusTimestamp = document.getElementById('cadsus-timestamp');
  refreshCadsusBtn = document.getElementById('refresh-cadsus-btn');
  fieldConfigLayout = config;
  onForceRefresh = callbacks.onForceRefresh;
  toggleDetailsBtn.addEventListener('click', handleToggleDetails);
  refreshCadsusBtn.addEventListener('click', handleForceRefresh);
  _store_js__WEBPACK_IMPORTED_MODULE_0__/* .store */ .M.subscribe(onStateChange);
}

/***/ }),

/***/ 778:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _field_config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(869);
/* harmony import */ var _renderers_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(690);
/* harmony import */ var _SectionManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(338);
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(335);
/* harmony import */ var _TimelineManager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(968);
/* harmony import */ var _ui_patient_card_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(627);
/* harmony import */ var _ui_search_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(889);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(239);
/**
 * 🏥 ASSISTENTE DE REGULAÇÃO MÉDICA - MAIN UI
 *
 * 🚨 ANTES DE MODIFICAR: Leia obrigatoriamente agents.md
 * 📋 Instruções IA: .github/instructions/agents.md.instructions.md
 * 🔒 Projeto médico - dados sensíveis - nunca logar CPF/CNS/dados pessoais
 */

// Cross-browser API alias (lint-safe)
const api = typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : {};






 // Importa o novo gestor




// --- ÍCONES ---
const sectionIcons = {
  'patient-details': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-check-icon lucide-user-round-check"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></svg>',
  timeline: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gantt-chart"><path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/></svg>',
  regulations: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check-icon lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  consultations: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope-icon lucide-stethoscope"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>',
  exams: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-microscope-icon lucide-microscope"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>',
  appointments: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>',
  documents: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-file-text" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>'
};
let currentRegulationData = null;
const sectionManagers = {}; // Objeto para armazenar instâncias de SectionManager

// Global listeners storage for memory leak prevention
const globalListeners = {
  onOpenOptionsClick: null,
  onReloadSidebarClick: null,
  onAutoModeToggleChange: null,
  onReloadBtnClick: null,
  onModalCloseBtnClick: null,
  onInfoModalClick: null,
  onMainContentClick: null,
  onInfoBtnClick: null,
  onDOMContentLoaded: null
};

// --- FUNÇÃO AUXILIAR DE FILTRAGEM ---
/**
 * Aplica um filtro de texto normalizado a um array de dados.
 * @param {Array} items - O array de itens a ser filtrado.
 * @param {string} text - O texto de busca (pode conter múltiplos termos separados por vírgula).
 * @param {Function} getFieldContent - Uma função que recebe um item e retorna a string a ser pesquisada.
 * @returns {Array} O array de itens filtrado.
 */
const applyNormalizedTextFilter = (items, text, getFieldContent) => {
  const searchTerms = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .normalizeString */ .J2(text).split(',').map(t => t.trim()).filter(Boolean);
  if (searchTerms.length === 0) return items;
  return items.filter(item => {
    const content = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .normalizeString */ .J2(getFieldContent(item));
    return searchTerms.some(term => content.includes(term));
  });
};

// --- LÓGICA DE FILTRAGEM ---
const consultationFilterLogic = (data, filters) => {
  let filteredData = [...data];
  if (filters['hide-no-show-checkbox']) {
    filteredData = filteredData.filter(c => !c.isNoShow);
  }
  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-keyword'], c => [c.specialty, c.professional, c.unit, ...c.details.map(d => `${d.label} ${d.value}`)].join(' '));
  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-cid'], c => c.details.map(d => d.value).join(' '));
  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-specialty'], c => c.specialty || '');
  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-professional'], c => c.professional || '');
  filteredData = applyNormalizedTextFilter(filteredData, filters['consultation-filter-unit'], c => c.unit || '');
  return filteredData;
};
const examFilterLogic = (data, filters) => {
  let filteredData = [...data];
  filteredData = applyNormalizedTextFilter(filteredData, filters['exam-filter-name'], item => item.examName);
  filteredData = applyNormalizedTextFilter(filteredData, filters['exam-filter-professional'], item => item.professional);
  filteredData = applyNormalizedTextFilter(filteredData, filters['exam-filter-specialty'], item => item.specialty);
  return filteredData;
};
const appointmentFilterLogic = (data, filters, fetchType) => {
  let filteredData = [...data];
  const status = filters['appointment-filter-status'] || 'todos';
  if (status !== 'todos') {
    filteredData = filteredData.filter(a => (a.status || '').toUpperCase() === status.toUpperCase());
  }
  if (fetchType === 'consultas') {
    filteredData = filteredData.filter(a => !a.type.toUpperCase().includes('EXAME'));
  } else if (fetchType === 'exames') {
    filteredData = filteredData.filter(a => a.type.toUpperCase().includes('EXAME'));
  }
  filteredData = applyNormalizedTextFilter(filteredData, filters['appointment-filter-term'], a => [a.professional, a.specialty, a.description].join(' '));
  filteredData = applyNormalizedTextFilter(filteredData, filters['appointment-filter-location'], a => a.location || '');
  return filteredData;
};
const regulationFilterLogic = (data, filters) => {
  let filteredData = [...data];
  const status = filters['regulation-filter-status'] || 'todos';
  const priority = filters['regulation-filter-priority'] || 'todas';
  if (status !== 'todos') {
    filteredData = filteredData.filter(item => (item.status || '').toUpperCase() === status.toUpperCase());
  }
  if (priority !== 'todas') {
    filteredData = filteredData.filter(item => (item.priority || '').toUpperCase() === priority.toUpperCase());
  }
  filteredData = applyNormalizedTextFilter(filteredData, filters['regulation-filter-procedure'], item => item.procedure || '');
  filteredData = applyNormalizedTextFilter(filteredData, filters['regulation-filter-requester'], item => item.requester || '');
  return filteredData;
};
const documentFilterLogic = (data, filters) => {
  var _document$getElementB, _document$getElementB2;
  let filteredData = [...data];

  // Filtro por data (client-side)
  const startDateValue = (_document$getElementB = document.getElementById('document-date-initial')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.value;
  const endDateValue = (_document$getElementB2 = document.getElementById('document-date-final')) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.value;
  if (startDateValue) {
    const start = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .parseDate */ ._U(startDateValue);
    if (start) {
      filteredData = filteredData.filter(doc => {
        const docDate = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .parseDate */ ._U(doc.date.split(' ')[0]);
        return docDate && docDate >= start;
      });
    }
  }
  if (endDateValue) {
    const end = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .parseDate */ ._U(endDateValue);
    if (end) {
      filteredData = filteredData.filter(doc => {
        const docDate = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .parseDate */ ._U(doc.date.split(' ')[0]);
        return docDate && docDate <= end;
      });
    }
  }

  // Filtro por palavra-chave normalizada
  filteredData = applyNormalizedTextFilter(filteredData, filters['document-filter-keyword'], doc => doc.description || '');
  return filteredData;
};
const sectionConfigurations = {
  'patient-details': {},
  // Seção especial sem fetch
  timeline: {},
  // Configuração da Timeline será tratada pelo seu próprio gestor
  consultations: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchAllConsultations */ .wF,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_2__/* .renderConsultations */ .rX,
    initialSortState: {
      key: 'sortableDate',
      order: 'desc'
    },
    filterLogic: consultationFilterLogic
  },
  exams: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchExamesSolicitados */ .K4,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_2__/* .renderExams */ .Rb,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: examFilterLogic
  },
  appointments: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchAppointments */ .Ns,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_2__/* .renderAppointments */ .lT,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: appointmentFilterLogic
  },
  regulations: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchAllRegulations */ .v0,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_2__/* .renderRegulations */ .IC,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: regulationFilterLogic
  },
  documents: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchDocuments */ .P_,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_2__/* .renderDocuments */ .zL,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: documentFilterLogic
  }
};

// --- FUNÇÕES DE ESTILO E ÍCONES ---

/**
 * Injeta os ícones SVG nos cabeçalhos das seções.
 */
function applySectionIcons() {
  for (const sectionKey in sectionIcons) {
    const iconContainer = document.getElementById(`${sectionKey}-section-icon`);
    if (iconContainer) {
      iconContainer.innerHTML = sectionIcons[sectionKey];
    }
  }
}

/**
 * Lê os estilos customizados do storage e os aplica aos cabeçalhos
 * usando Variáveis CSS (CSS Custom Properties) para melhor performance e manutenibilidade.
 * @param {object} styles - O objeto de estilos vindo do storage.
 */
function applyCustomHeaderStyles(styles) {
  // O CSS base com as variáveis e fallbacks já está definido em sidebar.html.
  // Esta função apenas define os valores das variáveis para cada seção.

  const defaultStyles = {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    iconColor: '#1e293b',
    fontSize: '16px'
  };
  for (const sectionKey in sectionIcons) {
    const sectionId = sectionKey === 'patient-details' ? 'patient-details-section' : `${sectionKey}-section`;
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) continue;

    // Pega o estilo salvo para a seção ou usa um objeto vazio.
    const savedStyle = styles[sectionKey] || {};
    // Combina com os padrões para garantir que todas as propriedades existam.
    const finalStyle = {
      ...defaultStyles,
      ...savedStyle
    };

    // Define as variáveis CSS no elemento da seção.
    sectionElement.style.setProperty('--section-bg-color', finalStyle.backgroundColor);
    sectionElement.style.setProperty('--section-font-color', finalStyle.color);
    sectionElement.style.setProperty('--section-icon-color', finalStyle.iconColor);
    sectionElement.style.setProperty('--section-font-size', finalStyle.fontSize);
  }
}
async function selectPatient(patientInfo, forceRefresh = false) {
  const currentPatient = _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.getPatient();
  if (currentPatient && currentPatient.ficha.isenPK.idp === patientInfo.idp && !forceRefresh) {
    return;
  }
  _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .toggleLoader */ .i1(true);
  _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .clearMessage */ .de();
  _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.setPatientUpdating();
  try {
    const ficha = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchVisualizaUsuario */ .Tp(patientInfo);
    const cadsus = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchCadsusData */ .GP({
      cpf: _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .getNestedValue */ .LJ(ficha, 'entidadeFisica.entfCPF'),
      cns: ficha.isenNumCadSus
    });
    Object.values(sectionManagers).forEach(manager => {
      if (typeof manager.clearAutomationFeedbackAndFilters === 'function') {
        manager.clearAutomationFeedbackAndFilters(false);
      } else if (typeof manager.clearAutomation === 'function') {
        manager.clearAutomation();
      }
    });
    _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.setPatient(ficha, cadsus);
    await updateRecentPatients(_store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.getPatient());
  } catch (error) {
    _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showMessage */ .rG(error.message, 'error');
    console.error(error);
    _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.clearPatient();
  } finally {
    _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .toggleLoader */ .i1(false);
  }
}
async function init() {
  let baseUrlConfigured = true;
  try {
    await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .getBaseUrl */ .$_();
  } catch (error) {
    if ((error === null || error === void 0 ? void 0 : error.message) === 'URL_BASE_NOT_CONFIGURED') {
      baseUrlConfigured = false;
      const mainContent = document.getElementById('main-content');
      const urlWarning = document.getElementById('url-config-warning');
      const openOptions = document.getElementById('open-options-from-warning');
      const reloadSidebar = document.getElementById('reload-sidebar-from-warning');
      if (mainContent) mainContent.classList.add('hidden');
      if (urlWarning) urlWarning.classList.remove('hidden');
      if (openOptions) {
        // Remove antes de adicionar
        if (globalListeners.onOpenOptionsClick) {
          openOptions.removeEventListener('click', globalListeners.onOpenOptionsClick);
        }
        globalListeners.onOpenOptionsClick = function () {
          api.runtime.openOptionsPage();
        };
        openOptions.addEventListener('click', globalListeners.onOpenOptionsClick);
      }
      if (reloadSidebar) {
        if (globalListeners.onReloadSidebarClick) {
          reloadSidebar.removeEventListener('click', globalListeners.onReloadSidebarClick);
        }
        globalListeners.onReloadSidebarClick = function () {
          location.reload();
        };
        reloadSidebar.addEventListener('click', globalListeners.onReloadSidebarClick);
      }

      // **não retornamos mais aqui**, apenas marcamos que deu “fallback”
    } else {
      console.error('Initialization failed:', error);
      _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showMessage */ .rG('Ocorreu um erro inesperado ao iniciar a extensão.', 'error');
      // nesse caso você pode querer return ou throw de verdade
      return;
    }
  }

  // === setup das abas: sempre rodar, mesmo sem baseURL ===
  _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .setupTabs */ .AQ(document.getElementById('layout-tabs-container'));
  _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .setupTabs */ .AQ(document.getElementById('patterns-tabs-container'));
  // (adicione aqui quaisquer outros containers de aba que tenha)

  // === só o resto do fluxo principal depende de baseUrlConfigured ===
  if (!baseUrlConfigured) {
    // já mostramos o formulário de URL, não temos mais nada a fazer
    return;
  }

  // agora vem tudo o que precisa de baseURL
  const [globalSettings, regulationPriorities] = await Promise.all([loadConfigAndData(), _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchRegulationPriorities */ .$4()]);
  globalSettings.regulationPriorities = regulationPriorities;
  applySectionIcons();
  applyCustomHeaderStyles(globalSettings.sectionHeaderStyles);
  applySectionOrder(globalSettings.sidebarSectionOrder);
  _ui_search_js__WEBPACK_IMPORTED_MODULE_7__/* .init */ .T({
    onSelectPatient: selectPatient
  });
  _ui_patient_card_js__WEBPACK_IMPORTED_MODULE_6__/* .init */ .T(globalSettings.fieldConfigLayout, {
    onForceRefresh: selectPatient
  });
  initializeSections(globalSettings);
  applyUserPreferences(globalSettings);
  addGlobalEventListeners();
  setupAutoModeToggle();
  await checkForPendingRegulation();
}
async function loadConfigAndData() {
  const syncData = await api.storage.sync.get({
    patientFields: _field_config_js__WEBPACK_IMPORTED_MODULE_1__/* .defaultFieldConfig */ .Q,
    filterLayout: {},
    autoLoadExams: false,
    autoLoadConsultations: false,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    autoLoadDocuments: false,
    enableAutomaticDetection: true,
    dateRangeDefaults: {},
    sidebarSectionOrder: [],
    sectionHeaderStyles: {} // Carrega a nova configuração de estilos
  });
  const localData = await api.storage.local.get({
    recentPatients: [],
    savedFilterSets: {},
    automationRules: []
  });
  _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.setRecentPatients(localData.recentPatients);
  _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.setSavedFilterSets(localData.savedFilterSets);
  return {
    fieldConfigLayout: _field_config_js__WEBPACK_IMPORTED_MODULE_1__/* .defaultFieldConfig */ .Q.map(defaultField => {
      const savedField = syncData.patientFields.find(f => f.id === defaultField.id);
      return savedField ? {
        ...defaultField,
        ...savedField
      } : defaultField;
    }),
    filterLayout: syncData.filterLayout,
    userPreferences: {
      autoLoadExams: syncData.autoLoadExams,
      autoLoadConsultations: syncData.autoLoadConsultations,
      autoLoadAppointments: syncData.autoLoadAppointments,
      autoLoadRegulations: syncData.autoLoadRegulations,
      autoLoadDocuments: syncData.autoLoadDocuments,
      enableAutomaticDetection: syncData.enableAutomaticDetection,
      dateRangeDefaults: syncData.dateRangeDefaults
    },
    sidebarSectionOrder: syncData.sidebarSectionOrder,
    sectionHeaderStyles: syncData.sectionHeaderStyles // Passa os estilos para frente
  };
}
function applySectionOrder(order) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  const sectionMap = {
    'patient-details': 'patient-details-section',
    timeline: 'timeline-section',
    regulations: 'regulations-section',
    consultations: 'consultations-section',
    exams: 'exams-section',
    appointments: 'appointments-section',
    documents: 'documents-section'
  };
  const patientCardId = 'patient-details';

  // Pega a ordem salva ou a ordem padrão do DOM
  const savedOrder = order && order.length > 0 ? order : Object.keys(sectionMap);

  // Garante que a ficha do paciente esteja sempre no topo
  // 1. Remove a ficha da ordem atual, não importa onde esteja.
  const finalOrder = savedOrder.filter(id => id !== patientCardId);
  // 2. Adiciona a ficha no início da lista.
  finalOrder.unshift(patientCardId);

  // Adiciona quaisquer novas seções (não presentes na ordem salva) ao final
  const knownIds = new Set(finalOrder);
  Object.keys(sectionMap).forEach(id => {
    if (!knownIds.has(id)) {
      finalOrder.push(id);
    }
  });

  // Reordena os elementos no DOM
  finalOrder.forEach(tabId => {
    const sectionId = sectionMap[tabId];
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      mainContent.appendChild(sectionElement);
    }
  });
}
function initializeSections(globalSettings) {
  Object.keys(sectionConfigurations).forEach(key => {
    if (key === 'patient-details') return;
    if (key === 'timeline') {
      sectionManagers[key] = new _TimelineManager_js__WEBPACK_IMPORTED_MODULE_5__/* .TimelineManager */ .l(key, sectionConfigurations[key], globalSettings);
      return;
    }
    sectionManagers[key] = new _SectionManager_js__WEBPACK_IMPORTED_MODULE_3__/* .SectionManager */ .N(key, sectionConfigurations[key], globalSettings);
  });
}
function applyUserPreferences(globalSettings) {
  const {
    userPreferences,
    filterLayout
  } = globalSettings;
  const {
    dateRangeDefaults
  } = userPreferences;
  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
  const defaultSystemRanges = {
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
  sections.forEach(section => {
    const range = dateRangeDefaults[section] || defaultSystemRanges[section];
    const prefix = section.replace(/s$/, '');
    const initialEl = document.getElementById(`${prefix}-date-initial`);
    const finalEl = document.getElementById(`${prefix}-date-final`);
    if (initialEl) initialEl.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .calculateRelativeDate */ .Z9(range.start);
    if (finalEl) finalEl.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .calculateRelativeDate */ .Z9(range.end);
  });
  Object.values(filterLayout).flat().forEach(filterSetting => {
    const el = document.getElementById(filterSetting.id);
    if (el && filterSetting.defaultValue !== undefined && filterSetting.defaultValue !== null) {
      if (el.type === 'checkbox') {
        el.checked = filterSetting.defaultValue;
      } else {
        el.value = filterSetting.defaultValue;
      }
    }
  });
}
function setupAutoModeToggle() {
  const toggle = document.getElementById('auto-mode-toggle');
  const label = document.getElementById('auto-mode-label');
  api.storage.sync.get({
    enableAutomaticDetection: true
  }).then(settings => {
    toggle.checked = settings.enableAutomaticDetection;
    label.textContent = settings.enableAutomaticDetection ? 'Auto' : 'Manual';
  });

  // Remove antes de adicionar
  if (globalListeners.onAutoModeToggleChange) {
    toggle.removeEventListener('change', globalListeners.onAutoModeToggleChange);
  }
  globalListeners.onAutoModeToggleChange = function (event) {
    const isEnabled = event.target.checked;
    api.storage.sync.set({
      enableAutomaticDetection: isEnabled
    });
    label.textContent = isEnabled ? 'Auto' : 'Manual';
  };
  toggle.addEventListener('change', globalListeners.onAutoModeToggleChange);
}
async function handleRegulationLoaded(regulationData) {
  _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .toggleLoader */ .i1(true);
  try {
    currentRegulationData = regulationData;
    if (regulationData && regulationData.isenPKIdp && regulationData.isenPKIds) {
      const patientInfo = {
        idp: regulationData.isenPKIdp,
        ids: regulationData.isenPKIds
      };
      await selectPatient(patientInfo);
      const contextName = regulationData.apcnNome || regulationData.prciNome || 'Contexto';
      const infoBtn = document.getElementById('context-info-btn');
      infoBtn.title = `Contexto: ${contextName.trim()}`;
      infoBtn.classList.remove('hidden');
      await applyAutomationRules(regulationData);
    } else {
      currentRegulationData = null;
      _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showMessage */ .rG('Não foi possível extrair os dados do paciente da regulação.', 'error');
    }
  } catch (error) {
    currentRegulationData = null;
    _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showMessage */ .rG(`Erro ao processar a regulação: ${error.message}`, 'error');
    console.error('Erro ao processar a regulação:', error);
  } finally {
    _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .toggleLoader */ .i1(false);
  }
}
async function applyAutomationRules(regulationData) {
  const {
    automationRules
  } = await api.storage.local.get({
    automationRules: []
  });
  if (!automationRules || automationRules.length === 0) return;
  const contextString = [regulationData.prciNome || '', regulationData.prciCodigo || '', regulationData.apcnNome || '', regulationData.apcnCod || ''].join(' ').toLowerCase();
  for (const rule of automationRules) {
    if (rule.isActive) {
      const hasMatch = rule.triggerKeywords.some(keyword => contextString.includes(keyword.toLowerCase().trim()));
      if (hasMatch) {
        // Aplicar filtros nas seções existentes E na nova timeline
        Object.entries(sectionManagers).forEach(([key, manager]) => {
          if (rule.filterSettings[key] && typeof manager.applyAutomationFilters === 'function') {
            manager.applyAutomationFilters(rule.filterSettings[key], rule.name);
          }
        });
        return; // Aplica apenas a primeira regra correspondente
      }
    }
  }
}

/**
 * Lida com mudanças no storage da extensão.
 * @param {object} changes - Objeto com as mudanças.
 * @param {string} areaName - A área do storage que mudou ('sync' ou 'local').
 */
function handleStorageChange(changes, areaName) {
  if (areaName === 'local' && changes.pendingRegulation) {
    // Apenas processa se a detecção automática estiver LIGADA
    api.storage.sync.get({
      enableAutomaticDetection: true
    }).then(settings => {
      if (settings.enableAutomaticDetection) {
        const {
          newValue
        } = changes.pendingRegulation;
        if (newValue && newValue.isenPKIdp) {
          console.log('[Assistente Sidebar] Nova regulação detectada via storage.onChanged:', newValue);
          handleRegulationLoaded(newValue);
          api.storage.local.remove('pendingRegulation');
        }
      }
    });
  }
  if (areaName === 'sync' && changes.sectionHeaderStyles) {
    api.runtime.reload();
  }
  if (areaName === 'sync' && changes.enableAutomaticDetection) {
    // Mantém o botão da sidebar sincronizado com a configuração
    setupAutoModeToggle();
  }
}
function addGlobalEventListeners() {
  const mainContent = document.getElementById('main-content');
  const infoModal = document.getElementById('info-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const infoBtn = document.getElementById('context-info-btn');
  const reloadBtn = document.getElementById('reload-sidebar-btn');

  // Create named functions for listeners to allow removal
  if (!globalListeners.onReloadBtnClick) {
    globalListeners.onReloadBtnClick = function () {
      const patient = _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.getPatient();
      if (patient && patient.ficha) {
        _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showDialog */ .ui({
          message: 'Um paciente está selecionado e o estado atual será perdido. Deseja realmente recarregar o assistente?',
          onConfirm: () => {
            location.reload();
          }
        });
      } else {
        location.reload();
      }
    };
  }
  if (!globalListeners.onModalCloseBtnClick) {
    globalListeners.onModalCloseBtnClick = function () {
      const modal = document.getElementById('info-modal');
      if (modal) modal.classList.add('hidden');
    };
  }
  if (!globalListeners.onInfoModalClick) {
    globalListeners.onInfoModalClick = function (e) {
      if (e.target === e.currentTarget) {
        e.currentTarget.classList.add('hidden');
      }
    };
  }
  if (!globalListeners.onMainContentClick) {
    globalListeners.onMainContentClick = async function (event) {
      await handleGlobalActions(event);
    };
  }
  if (!globalListeners.onInfoBtnClick) {
    globalListeners.onInfoBtnClick = function () {
      if (!currentRegulationData) {
        _utils_js__WEBPACK_IMPORTED_MODULE_8__/* .showMessage */ .rG('Nenhuma informação de regulação carregada.', 'info');
        return;
      }
      const modalTitle = document.getElementById('modal-title');
      const modalContent = document.getElementById('modal-content');
      const modal = document.getElementById('info-modal');
      modalTitle.textContent = 'Dados da Regulação (JSON)';
      const formattedJson = JSON.stringify(currentRegulationData, null, 2);
      modalContent.innerHTML = `<pre class="bg-slate-100 p-2 rounded-md text-xs whitespace-pre-wrap break-all">${formattedJson}</pre>`;
      modal.classList.remove('hidden');
    };
  }

  // Add listeners
  if (reloadBtn) reloadBtn.addEventListener('click', globalListeners.onReloadBtnClick);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', globalListeners.onModalCloseBtnClick);
  if (infoModal) infoModal.addEventListener('click', globalListeners.onInfoModalClick);
  if (mainContent) mainContent.addEventListener('click', globalListeners.onMainContentClick);
  if (infoBtn) infoBtn.addEventListener('click', globalListeners.onInfoBtnClick);

  // Add storage listener only once
  if (!addGlobalEventListeners.storageListenerAdded) {
    api.storage.onChanged.addListener(handleStorageChange);
    addGlobalEventListeners.storageListenerAdded = true;
  }
}
async function handleGlobalActions(event) {
  const target = event.target;
  const copyBtn = target.closest('.copy-icon');
  if (copyBtn) {
    await copyToClipboard(copyBtn);
    return;
  }
  const examResultBtn = target.closest('.view-exam-result-btn');
  if (examResultBtn) {
    await handleViewExamResult(examResultBtn);
    return;
  }
  const appointmentDetailsBtn = target.closest('.view-appointment-details-btn');
  if (appointmentDetailsBtn) {
    await handleShowAppointmentDetailsModal(appointmentDetailsBtn);
    return;
  }
  const regulationDetailsBtn = target.closest('.view-regulation-details-btn');
  if (regulationDetailsBtn) {
    await handleShowRegulationDetailsModal(regulationDetailsBtn);
    return;
  }
  const appointmentInfoBtn = target.closest('.appointment-info-btn');
  if (appointmentInfoBtn) {
    handleShowAppointmentInfo(appointmentInfoBtn);
    return;
  }
  const documentBtn = target.closest('.view-document-btn');
  if (documentBtn) {
    await handleViewDocument(documentBtn);
    return;
  }
  const regulationAttachmentBtn = target.closest('.view-regulation-attachment-btn');
  if (regulationAttachmentBtn) {
    await handleViewRegulationAttachment(regulationAttachmentBtn);
    return;
  }
}
async function copyToClipboard(button) {
  if (button.dataset.inProgress === 'true') return;
  const textToCopy = button.dataset.copyText;
  if (!textToCopy) return;
  button.dataset.inProgress = 'true';
  const original = button;
  try {
    await navigator.clipboard.writeText(textToCopy);
    if (document.body.contains(original)) original.textContent = '✅';
  } catch (err) {
    console.error('Falha ao copiar texto: ', err);
    if (document.body.contains(original)) original.textContent = '❌';
  } finally {
    setTimeout(() => {
      if (document.body.contains(original)) original.textContent = '📄';
      if (document.body.contains(original)) original.dataset.inProgress = 'false';
    }, 1200);
  }
}
async function updateRecentPatients(patientData) {
  if (!patientData || !patientData.ficha) return;
  const newRecent = {
    ...patientData
  };
  const currentRecents = _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.getRecentPatients();
  const filtered = (currentRecents || []).filter(p => p.ficha.isenPK.idp !== newRecent.ficha.isenPK.idp);
  const updatedRecents = [newRecent, ...filtered].slice(0, 5);
  await api.storage.local.set({
    recentPatients: updatedRecents
  });
  _store_js__WEBPACK_IMPORTED_MODULE_4__/* .store */ .M.setRecentPatients(updatedRecents);
}
async function handleViewExamResult(button) {
  const {
    idp,
    ids
  } = button.dataset;
  const filePath = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchResultadoExame */ .Sp({
    idp,
    ids
  });
  const baseUrl = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .getBaseUrl */ .$_();
  let url = 'about:blank';
  if (filePath) {
    url = filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
  }
  api.tabs.create({
    url
  });
}
async function handleViewDocument(button) {
  const {
    idp,
    ids
  } = button.dataset;
  try {
    const docUrl = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchDocumentUrl */ .pP({
      idp,
      ids
    });
    api.tabs.create({
      url: docUrl || 'about:blank'
    });
    if (!docUrl) {
      console.warn('URL do documento não encontrada.');
    }
  } catch (error) {
    console.error('Falha ao visualizar documento:', error);
  }
}
async function handleViewRegulationAttachment(button) {
  const {
    idp,
    ids
  } = button.dataset;
  try {
    const fileUrl = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchRegulationAttachmentUrl */ .DM({
      idp,
      ids
    });
    if (fileUrl) {
      // Use browser extension API instead of window.open
      await api.tabs.create({
        url: fileUrl
      });
    } else {
      console.warn('⚠️ URL do anexo não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar anexo da regulação:', error);
  }
}
function showModal(title, content) {
  const modal = document.getElementById('info-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  modal.classList.remove('hidden');
}
function createDetailRow(label, value) {
  if (!value || String(value).trim() === '') return '';
  return `<div class="py-2 border-b border-slate-100 flex justify-between items-start gap-4">
            <span class="font-semibold text-slate-600 flex-shrink-0">${label}:</span>
            <span class="text-slate-800 text-right break-words">${value}</span>
          </div>`;
}
function formatRegulationDetailsForModal(data) {
  if (!data) return '<p>Dados da regulação não encontrados.</p>';
  let content = '';
  content += createDetailRow('Status', data.reguStatus);
  content += createDetailRow('Tipo', data.reguTipo === 'ENC' ? 'Consulta' : 'Exame');
  content += createDetailRow('Data Solicitação', data.reguDataStr);
  content += createDetailRow('Procedimento', data.prciNome);
  content += createDetailRow('CID', `${data.tcidCod} - ${data.tcidDescricao}`);
  content += createDetailRow('Profissional Sol.', data.prsaEntiNome);
  content += createDetailRow('Unidade Sol.', data.limoSolicitanteNome);
  content += createDetailRow('Unidade Desejada', data.limoDesejadaNome);
  content += createDetailRow('Gravidade', data.reguGravidade);
  if (data.reguJustificativa && data.reguJustificativa !== 'null') {
    content += `<div class="py-2">
    <span class="font-semibold text-slate-600">Justificativa:</span>
    <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.reguJustificativa.replace(/\\n/g, '\n')}</p>
</div>`;
  }
  return content;
}
function formatAppointmentDetailsForModal(data) {
  var _data$unidadeSaudeDes, _data$unidadeSaudeDes2, _data$profissionalDes, _data$profissionalDes2, _data$profissionalDes3, _data$atividadeProfis, _data$procedimento, _data$convenio, _data$convenio$entida;
  if (!data) return '<p>Dados do agendamento não encontrados.</p>';
  let status = 'Agendado';
  if (data.agcoIsCancelado === 't') status = 'Cancelado';else if (data.agcoIsFaltante === 't') status = 'Faltou';else if (data.agcoIsAtendido === 't') status = 'Atendido';
  let content = '';
  content += createDetailRow('Status', status);
  content += createDetailRow('Data', `${data.agcoData} às ${data.agcoHoraPrevista}`);
  content += createDetailRow('Local', (_data$unidadeSaudeDes = data.unidadeSaudeDestino) === null || _data$unidadeSaudeDes === void 0 ? void 0 : (_data$unidadeSaudeDes2 = _data$unidadeSaudeDes.entidade) === null || _data$unidadeSaudeDes2 === void 0 ? void 0 : _data$unidadeSaudeDes2.entiNome);
  content += createDetailRow('Profissional', (_data$profissionalDes = data.profissionalDestino) === null || _data$profissionalDes === void 0 ? void 0 : (_data$profissionalDes2 = _data$profissionalDes.entidadeFisica) === null || _data$profissionalDes2 === void 0 ? void 0 : (_data$profissionalDes3 = _data$profissionalDes2.entidade) === null || _data$profissionalDes3 === void 0 ? void 0 : _data$profissionalDes3.entiNome);
  content += createDetailRow('Especialidade', (_data$atividadeProfis = data.atividadeProfissionalCnes) === null || _data$atividadeProfis === void 0 ? void 0 : _data$atividadeProfis.apcnNome);
  content += createDetailRow('Procedimento', (_data$procedimento = data.procedimento) === null || _data$procedimento === void 0 ? void 0 : _data$procedimento.prciNome);
  content += createDetailRow('Convênio', (_data$convenio = data.convenio) === null || _data$convenio === void 0 ? void 0 : (_data$convenio$entida = _data$convenio.entidade) === null || _data$convenio$entida === void 0 ? void 0 : _data$convenio$entida.entiNome);
  if (data.agcoObs) {
    content += `<div class="py-2">
                        <span class="font-semibold text-slate-600">Observação:</span>
                        <p class="text-slate-800 whitespace-pre-wrap mt-1 p-2 bg-slate-50 rounded">${data.agcoObs}</p>
                    </div>`;
  }
  return content;
}
function formatExamAppointmentDetailsForModal(data) {
  var _data$ligacaoModularO, _data$ligacaoModularD, _data$profissional, _data$profissional$en, _data$profissional$en2, _data$CaraterAtendime, _data$criterioExame;
  if (!data) return '<p>Dados do agendamento de exame não encontrados.</p>';
  let content = '';
  content += createDetailRow('Data Agendamento', data.examDataCad);
  content += createDetailRow('Unidade Origem', (_data$ligacaoModularO = data.ligacaoModularOrigem) === null || _data$ligacaoModularO === void 0 ? void 0 : _data$ligacaoModularO.limoNome);
  content += createDetailRow('Unidade Destino', (_data$ligacaoModularD = data.ligacaoModularDestino) === null || _data$ligacaoModularD === void 0 ? void 0 : _data$ligacaoModularD.limoNome);
  content += createDetailRow('Profissional Sol.', (_data$profissional = data.profissional) === null || _data$profissional === void 0 ? void 0 : (_data$profissional$en = _data$profissional.entidadeFisica) === null || _data$profissional$en === void 0 ? void 0 : (_data$profissional$en2 = _data$profissional$en.entidade) === null || _data$profissional$en2 === void 0 ? void 0 : _data$profissional$en2.entiNome);
  content += createDetailRow('Caráter', (_data$CaraterAtendime = data.CaraterAtendimento) === null || _data$CaraterAtendime === void 0 ? void 0 : _data$CaraterAtendime.caraDescri);
  content += createDetailRow('Critério', (_data$criterioExame = data.criterioExame) === null || _data$criterioExame === void 0 ? void 0 : _data$criterioExame.critNome);
  return content;
}
async function handleShowRegulationDetailsModal(button) {
  const {
    idp,
    ids
  } = button.dataset;
  showModal('Detalhes da Regulação', '<p>Carregando...</p>');
  try {
    const data = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchRegulationDetails */ .hr({
      reguIdp: idp,
      reguIds: ids
    });
    const content = formatRegulationDetailsForModal(data);
    showModal('Detalhes da Regulação', content);
  } catch (error) {
    showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
  }
}
async function handleShowAppointmentDetailsModal(button) {
  const {
    idp,
    ids,
    type
  } = button.dataset;
  const isExam = type.toUpperCase().includes('EXAME');
  const title = isExam ? 'Detalhes do Agendamento de Exame' : 'Detalhes da Consulta Agendada';
  showModal(title, '<p>Carregando...</p>');
  try {
    let data;
    let content;
    if (isExam) {
      data = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchExamAppointmentDetails */ .Pn({
        idp,
        ids
      });
      content = formatExamAppointmentDetailsForModal(data);
    } else {
      data = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchAppointmentDetails */ .EI({
        idp,
        ids
      });
      content = formatAppointmentDetailsForModal(data);
    }
    showModal(title, content);
  } catch (error) {
    showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
  }
}
function handleShowAppointmentInfo(button) {
  const data = JSON.parse(button.dataset.appointment);
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const infoModal = document.getElementById('info-modal');
  modalTitle.textContent = 'Detalhes do Agendamento';
  modalContent.innerHTML = `
    <p><strong>ID:</strong> ${data.id}</p>
    <p><strong>Tipo:</strong> ${data.isSpecialized ? 'Especializada' : data.isOdonto ? 'Odontológica' : data.type}</p>
    <p><strong>Status:</strong> ${data.status}</p>
    <p><strong>Data:</strong> ${data.date} às ${data.time}</p>
    <p><strong>Local:</strong> ${data.location}</p>
    <p><strong>Profissional:</strong> ${data.professional}</p>
    <p><strong>Especialidade:</strong> ${data.specialty || 'N/A'}</p>
    <p><strong>Procedimento:</strong> ${data.description}</p>
  `;
  infoModal.classList.remove('hidden');
}
async function checkForPendingRegulation() {
  try {
    const {
      pendingRegulation
    } = await api.storage.local.get('pendingRegulation');
    if (pendingRegulation && pendingRegulation.isenPKIdp) {
      await handleRegulationLoaded(pendingRegulation);
      await api.storage.local.remove('pendingRegulation');
    }
  } catch (e) {
    console.error('Erro ao verificar regulação pendente:', e);
  }
}

/**
 * Função de limpeza para remover todos os event listeners globais.
 * Previne memory leaks, especialmente em ambientes de desenvolvimento com hot-reloading.
 */
function cleanupEventListeners() {
  console.log('[Assistente] Removendo event listeners globais para limpeza.');
  const mainContent = document.getElementById('main-content');
  const infoModal = document.getElementById('info-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const infoBtn = document.getElementById('context-info-btn');
  const reloadBtn = document.getElementById('reload-sidebar-btn');
  const toggle = document.getElementById('auto-mode-toggle');
  const openOptions = document.getElementById('open-options-from-warning');
  const reloadSidebar = document.getElementById('reload-sidebar-from-warning');

  // Remover listeners de elementos DOM
  if (reloadBtn && globalListeners.onReloadBtnClick) reloadBtn.removeEventListener('click', globalListeners.onReloadBtnClick);
  if (modalCloseBtn && globalListeners.onModalCloseBtnClick) modalCloseBtn.removeEventListener('click', globalListeners.onModalCloseBtnClick);
  if (infoModal && globalListeners.onInfoModalClick) infoModal.removeEventListener('click', globalListeners.onInfoModalClick);
  if (mainContent && globalListeners.onMainContentClick) mainContent.removeEventListener('click', globalListeners.onMainContentClick);
  if (infoBtn && globalListeners.onInfoBtnClick) infoBtn.removeEventListener('click', globalListeners.onInfoBtnClick);
  if (toggle && globalListeners.onAutoModeToggleChange) toggle.removeEventListener('change', globalListeners.onAutoModeToggleChange);
  if (openOptions && globalListeners.onOpenOptionsClick) openOptions.removeEventListener('click', globalListeners.onOpenOptionsClick);
  if (reloadSidebar && globalListeners.onReloadSidebarClick) reloadSidebar.removeEventListener('click', globalListeners.onReloadSidebarClick);

  // Remover listener do documento
  if (globalListeners.onDOMContentLoaded) {
    document.removeEventListener('DOMContentLoaded', globalListeners.onDOMContentLoaded);
  }

  // Remover listener da API de storage
  if (api.storage.onChanged.hasListener(handleStorageChange)) {
    api.storage.onChanged.removeListener(handleStorageChange);
  }
}

// Initialize with removable listener
globalListeners.onDOMContentLoaded = init;
document.addEventListener('DOMContentLoaded', globalListeners.onDOMContentLoaded);

// Adiciona o listener de limpeza para quando a página da sidebar for descarregada
// eslint-disable-next-line no-restricted-globals
window.addEventListener('pagehide', cleanupEventListeners);

/***/ }),

/***/ 889:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   T: () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(335);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(239);
/**
 * @file Módulo para gerir a funcionalidade de busca de pacientes.
 */



let searchInput;
let searchResultsList;
let recentPatientsList;
let onSelectPatient; // Callback para notificar o sidebar sobre a seleção

function renderSearchResults(patients) {
  if (!searchResultsList) return;
  if (patients.length === 0) {
    searchResultsList.innerHTML = '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente encontrado.</li>';
    return;
  }
  searchResultsList.innerHTML = patients.map(p => `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition" data-idp="${p.idp}" data-ids="${p.ids}">${renderPatientListItem(p)}</li>`).join('');
}

/**
 * Renderiza a lista de pacientes recentes a partir do store.
 */
function renderRecentPatients() {
  if (!recentPatientsList) return;
  const recents = _store_js__WEBPACK_IMPORTED_MODULE_1__/* .store */ .M.getRecentPatients() || [];
  recentPatientsList.innerHTML = '<li class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400">PACIENTES RECENTES</li>' + (recents.length === 0 ? '<li class="px-4 py-3 text-sm text-slate-500">Nenhum paciente recente.</li>' : recents.map(p => {
    var _fichaData$isenPK, _fichaData$isenPK2;
    // CORREÇÃO: Lida com a estrutura de dados antiga e nova dos pacientes recentes.
    const fichaData = p.ficha || p; // Se p.ficha não existe, 'p' é o próprio objeto da ficha.
    const idp = ((_fichaData$isenPK = fichaData.isenPK) === null || _fichaData$isenPK === void 0 ? void 0 : _fichaData$isenPK.idp) || fichaData.idp;
    const ids = ((_fichaData$isenPK2 = fichaData.isenPK) === null || _fichaData$isenPK2 === void 0 ? void 0 : _fichaData$isenPK2.ids) || fichaData.ids;
    if (!idp || !ids) return ''; // Pula a renderização se o item estiver malformado.

    return `<li class="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition recent-patient-item" data-idp="${idp}" data-ids="${ids}">${renderPatientListItem(fichaData)}</li>`;
  }).join(''));
}
function renderPatientListItem(patient) {
  var _patient$isenPK, _patient$isenPK2;
  const nome = patient.value || _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getNestedValue */ .LJ(patient, 'entidadeFisica.entidade.entiNome') || 'Nome não informado';
  const idp = patient.idp || ((_patient$isenPK = patient.isenPK) === null || _patient$isenPK === void 0 ? void 0 : _patient$isenPK.idp);
  const ids = patient.ids || ((_patient$isenPK2 = patient.isenPK) === null || _patient$isenPK2 === void 0 ? void 0 : _patient$isenPK2.ids);
  const dataNascimento = patient.dataNascimento || _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getNestedValue */ .LJ(patient, 'entidadeFisica.entfDtNasc');
  const cpf = patient.cpf || _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .getNestedValue */ .LJ(patient, 'entidadeFisica.entfCPF');
  const cns = patient.cns || patient.isenNumCadSus;
  return `
      <div class="font-medium text-slate-800">${nome}</div>
      <div class="grid grid-cols-2 gap-x-4 text-xs text-slate-500 mt-1">
        <span><strong class="font-semibold">Cód:</strong> ${idp}-${ids}</span>
        <span><strong class="font-semibold">Nasc:</strong> ${dataNascimento || '-'}</span>
        <span><strong class="font-semibold">CPF:</strong> ${cpf || '-'}</span>
        <span><strong class="font-semibold">CNS:</strong> ${cns || '-'}</span>
      </div>
    `;
}
const handleSearchInput = _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .debounce */ .sg(async () => {
  const searchTerm = searchInput.value.trim();
  _store_js__WEBPACK_IMPORTED_MODULE_1__/* .store */ .M.clearPatient();
  recentPatientsList.classList.add('hidden');
  searchResultsList.classList.remove('hidden');
  if (searchTerm.length < 1) {
    searchResultsList.innerHTML = '';
    return;
  }
  _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .toggleLoader */ .i1(true);
  try {
    const patients = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .searchPatients */ .bW(searchTerm);
    renderSearchResults(patients);
  } catch {
    _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .showMessage */ .rG('Erro ao buscar pacientes.');
  } finally {
    _utils_js__WEBPACK_IMPORTED_MODULE_2__/* .toggleLoader */ .i1(false);
  }
}, 500);
function handleSearchFocus() {
  if (searchInput.value.length > 0) return;
  renderRecentPatients();
  searchResultsList.classList.add('hidden');
  recentPatientsList.classList.remove('hidden');
}
function handleSearchBlur() {
  setTimeout(() => {
    searchResultsList.classList.add('hidden');
    recentPatientsList.classList.add('hidden');
  }, 200);
}
async function handleResultClick(event) {
  const listItem = event.target.closest('li[data-idp]');
  if (!listItem) return;
  const {
    idp,
    ids
  } = listItem.dataset;
  if (listItem.classList.contains('recent-patient-item')) {
    const recentPatient = _store_js__WEBPACK_IMPORTED_MODULE_1__/* .store */ .M.getRecentPatients().find(p => {
      // CORREÇÃO: Lida com a estrutura de dados antiga e nova.
      const patientIdp = p.ficha ? p.ficha.isenPK.idp : p.idp;
      return patientIdp == idp;
    });

    // Se o paciente foi encontrado e tem a nova estrutura (com cache), usa os dados do cache.
    if (recentPatient && recentPatient.ficha) {
      _store_js__WEBPACK_IMPORTED_MODULE_1__/* .store */ .M.setPatient(recentPatient.ficha, recentPatient.cadsus);
      searchInput.value = '';
      searchResultsList.classList.add('hidden');
      recentPatientsList.classList.add('hidden');
      return;
    }
  }

  // Para pacientes novos ou pacientes recentes com a estrutura antiga (que precisam ser re-buscados).
  if (onSelectPatient) {
    onSelectPatient({
      idp,
      ids
    });
  }
  searchInput.value = '';
  searchResultsList.classList.add('hidden');
  recentPatientsList.classList.add('hidden');
}
function init(config) {
  searchInput = document.getElementById('patient-search-input');
  searchResultsList = document.getElementById('search-results');
  recentPatientsList = document.getElementById('recent-patients-list');
  onSelectPatient = config.onSelectPatient;
  _store_js__WEBPACK_IMPORTED_MODULE_1__/* .store */ .M.subscribe(() => {
    if (!recentPatientsList.classList.contains('hidden')) {
      renderRecentPatients();
    }
  });
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', handleSearchFocus);
  searchInput.addEventListener('blur', handleSearchBlur);
  searchResultsList.addEventListener('click', handleResultClick);
  recentPatientsList.addEventListener('click', handleResultClick);
}

/***/ }),

/***/ 968:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   l: () => (/* binding */ TimelineManager)
/* harmony export */ });
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _renderers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(690);
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(335);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(239);
/**
 * @file Módulo TimelineManager, responsável por gerir a secção da Linha do Tempo.
 */




class TimelineManager {
  constructor(sectionKey, config, globalSettings) {
    this.sectionKey = sectionKey;
    this.config = config;
    this.globalSettings = globalSettings;
    this.allData = [];
    this.currentPatient = null;
    this.isLoading = false;

    // State for automation filters
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;
    this.elements = {};
    this.init();
  }
  init() {
    this.cacheDomElements();
    this.addEventListeners();
    _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.subscribe(() => this.onStateChange());
  }
  cacheDomElements() {
    this.elements = {
      section: document.getElementById('timeline-section'),
      wrapper: document.getElementById('timeline-wrapper'),
      content: document.getElementById('timeline-content'),
      fetchBtn: document.getElementById('fetch-timeline-btn'),
      toggleBtn: document.getElementById('toggle-timeline-list-btn'),
      automationFeedback: document.getElementById('timeline-automation-feedback'),
      dateInitial: document.getElementById('timeline-date-initial'),
      dateFinal: document.getElementById('timeline-date-final'),
      searchKeyword: document.getElementById('timeline-search-keyword')
    };
  }
  addEventListeners() {
    var _el$fetchBtn, _el$toggleBtn, _el$searchKeyword, _el$dateInitial, _el$dateFinal, _el$section, _el$fetchBtn2, _el$toggleBtn2, _el$searchKeyword2, _el$dateInitial2, _el$dateFinal2, _el$section2;
    // Remove listeners antes de adicionar
    if (!this._listeners) this._listeners = {};
    const el = this.elements;
    // Remove
    (_el$fetchBtn = el.fetchBtn) === null || _el$fetchBtn === void 0 ? void 0 : _el$fetchBtn.removeEventListener('click', this._listeners.onFetchBtnClick);
    (_el$toggleBtn = el.toggleBtn) === null || _el$toggleBtn === void 0 ? void 0 : _el$toggleBtn.removeEventListener('click', this._listeners.onToggleBtnClick);
    (_el$searchKeyword = el.searchKeyword) === null || _el$searchKeyword === void 0 ? void 0 : _el$searchKeyword.removeEventListener('input', this._listeners.onSearchKeywordInput);
    (_el$dateInitial = el.dateInitial) === null || _el$dateInitial === void 0 ? void 0 : _el$dateInitial.removeEventListener('change', this._listeners.onDateInitialChange);
    (_el$dateFinal = el.dateFinal) === null || _el$dateFinal === void 0 ? void 0 : _el$dateFinal.removeEventListener('change', this._listeners.onDateFinalChange);
    (_el$section = el.section) === null || _el$section === void 0 ? void 0 : _el$section.removeEventListener('click', this._listeners.onSectionClick);

    // Funções nomeadas
    this._listeners.onFetchBtnClick = this.onFetchBtnClick.bind(this);
    this._listeners.onToggleBtnClick = this.onToggleBtnClick.bind(this);
    this._listeners.onSearchKeywordInput = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .debounce */ .sg(this.onSearchKeywordInput.bind(this), 300);
    this._listeners.onDateInitialChange = this.onDateInitialChange.bind(this);
    this._listeners.onDateFinalChange = this.onDateFinalChange.bind(this);
    this._listeners.onSectionClick = this.onSectionClick.bind(this);

    // Adiciona
    (_el$fetchBtn2 = el.fetchBtn) === null || _el$fetchBtn2 === void 0 ? void 0 : _el$fetchBtn2.addEventListener('click', this._listeners.onFetchBtnClick);
    (_el$toggleBtn2 = el.toggleBtn) === null || _el$toggleBtn2 === void 0 ? void 0 : _el$toggleBtn2.addEventListener('click', this._listeners.onToggleBtnClick);
    (_el$searchKeyword2 = el.searchKeyword) === null || _el$searchKeyword2 === void 0 ? void 0 : _el$searchKeyword2.addEventListener('input', this._listeners.onSearchKeywordInput);
    (_el$dateInitial2 = el.dateInitial) === null || _el$dateInitial2 === void 0 ? void 0 : _el$dateInitial2.addEventListener('change', this._listeners.onDateInitialChange);
    (_el$dateFinal2 = el.dateFinal) === null || _el$dateFinal2 === void 0 ? void 0 : _el$dateFinal2.addEventListener('change', this._listeners.onDateFinalChange);
    (_el$section2 = el.section) === null || _el$section2 === void 0 ? void 0 : _el$section2.addEventListener('click', this._listeners.onSectionClick);
  }
  onFetchBtnClick() {
    this.fetchData();
  }
  onToggleBtnClick() {
    this.toggleSection();
  }
  onSearchKeywordInput() {
    this.render();
  }
  onDateInitialChange() {
    this.render();
  }
  onDateFinalChange() {
    this.render();
  }
  onSectionClick(event) {
    const header = event.target.closest('.timeline-header');
    if (header) {
      const details = header.nextElementSibling;
      if (details && details.classList.contains('timeline-details-body')) {
        details.classList.toggle('show');
      }
      return;
    }
    const toggleDetailsBtn = event.target.closest('.timeline-toggle-details-btn');
    if (toggleDetailsBtn) {
      const timelineItem = toggleDetailsBtn.closest('.timeline-item');
      const details = timelineItem === null || timelineItem === void 0 ? void 0 : timelineItem.querySelector('.timeline-details-body');
      if (details) {
        details.classList.toggle('show');
      }
      return;
    }
    const toggleFilterBtn = event.target.closest('#timeline-toggle-filter-btn');
    if (toggleFilterBtn) {
      this.toggleFilteredView();
    }
  }
  onStateChange() {
    var _this$currentPatient, _this$currentPatient$, _newPatient$isenPK;
    const patientState = _store_js__WEBPACK_IMPORTED_MODULE_2__/* .store */ .M.getPatient();
    const newPatient = patientState ? patientState.ficha : null;
    if (((_this$currentPatient = this.currentPatient) === null || _this$currentPatient === void 0 ? void 0 : (_this$currentPatient$ = _this$currentPatient.isenPK) === null || _this$currentPatient$ === void 0 ? void 0 : _this$currentPatient$.idp) !== (newPatient === null || newPatient === void 0 ? void 0 : (_newPatient$isenPK = newPatient.isenPK) === null || _newPatient$isenPK === void 0 ? void 0 : _newPatient$isenPK.idp)) {
      this.setPatient(newPatient);
    }
  }
  setPatient(patient) {
    this.currentPatient = patient;
    this.allData = [];
    this.clearAutomation();
    this.elements.content.innerHTML = '';
    if (this.elements.searchKeyword) {
      this.elements.searchKeyword.value = '';
    }
    this.applyDefaultDateRange();
    if (this.elements.section) {
      this.elements.section.style.display = patient ? 'block' : 'none';
    }
  }
  applyDefaultDateRange() {
    const dateRangeDefaults = this.globalSettings.userPreferences.dateRangeDefaults;
    const range = dateRangeDefaults.timeline || {
      start: -12,
      end: 0
    };
    if (this.elements.dateInitial) this.elements.dateInitial.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(range.start);
    if (this.elements.dateFinal) this.elements.dateFinal.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .calculateRelativeDate */ .Z9(range.end);
  }
  async fetchData() {
    if (!this.currentPatient || this.isLoading) {
      return;
    }
    this.isLoading = true;
    _renderers_js__WEBPACK_IMPORTED_MODULE_1__/* .renderTimeline */ .s8([], 'loading');
    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: '01/01/1900',
        // Busca sempre o histórico completo
        dataFinal: new Date().toLocaleDateString('pt-BR')
      };
      const apiData = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchAllTimelineData */ .lQ(params);
      const normalizedData = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .normalizeTimelineData */ .td(apiData);
      this.allData = normalizedData;
      this.render();
    } catch (error) {
      console.error('Erro ao buscar dados para a Linha do Tempo:', error);
      _renderers_js__WEBPACK_IMPORTED_MODULE_1__/* .renderTimeline */ .s8([], 'error');
    } finally {
      this.isLoading = false;
    }
  }
  getFilterValues() {
    var _this$elements$dateIn, _this$elements$dateFi, _this$elements$search;
    return {
      startDate: (_this$elements$dateIn = this.elements.dateInitial) === null || _this$elements$dateIn === void 0 ? void 0 : _this$elements$dateIn.value,
      endDate: (_this$elements$dateFi = this.elements.dateFinal) === null || _this$elements$dateFi === void 0 ? void 0 : _this$elements$dateFi.value,
      keyword: _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .normalizeString */ .J2(((_this$elements$search = this.elements.searchKeyword) === null || _this$elements$search === void 0 ? void 0 : _this$elements$search.value) || '')
    };
  }
  render() {
    if (this.allData.length === 0 && !this.isLoading) {
      _renderers_js__WEBPACK_IMPORTED_MODULE_1__/* .renderTimeline */ .s8([], 'empty');
      return;
    }
    let dataToRender = this.allData;
    const filters = this.getFilterValues();

    // Client-side filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      dataToRender = dataToRender.filter(event => event.sortableDate >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Garante que o dia final seja incluído
      dataToRender = dataToRender.filter(event => event.sortableDate <= endDate);
    }
    if (filters.keyword) {
      dataToRender = dataToRender.filter(event => event.searchText.includes(filters.keyword));
    }

    // Automation rule filtering
    if (this.isFilteredView && this.activeRuleFilters) {
      dataToRender = _utils_js__WEBPACK_IMPORTED_MODULE_3__/* .filterTimelineEvents */ .Pr(dataToRender, this.activeRuleFilters);
    }
    _renderers_js__WEBPACK_IMPORTED_MODULE_1__/* .renderTimeline */ .s8(dataToRender, 'success');
  }
  toggleSection() {
    var _this$elements$wrappe;
    (_this$elements$wrappe = this.elements.wrapper) === null || _this$elements$wrappe === void 0 ? void 0 : _this$elements$wrappe.classList.toggle('show');
    this.elements.toggleBtn.textContent = this.elements.wrapper.classList.contains('show') ? 'Recolher' : 'Expandir';
  }
  applyAutomationFilters(filters, ruleName) {
    this.activeRuleFilters = filters;
    this.activeRuleName = ruleName;
    this.isFilteredView = false;
    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.innerHTML = `
            <div class="flex justify-between items-center text-sm">
                <span>Regra '<strong>${ruleName}</strong>' ativa.</span>
                <button id="timeline-toggle-filter-btn" class="font-semibold text-blue-600 hover:underline">
                    Ver timeline focada
                </button>
            </div>
        `;
      this.elements.automationFeedback.classList.remove('hidden');
    }
    if (this.allData.length > 0) {
      this.render();
    }
  }
  clearAutomation() {
    this.activeRuleFilters = null;
    this.activeRuleName = null;
    this.isFilteredView = false;
    if (this.elements.automationFeedback) {
      this.elements.automationFeedback.classList.add('hidden');
      this.elements.automationFeedback.innerHTML = '';
    }
    if (this.allData.length > 0) {
      this.render();
    }
  }
  toggleFilteredView() {
    this.isFilteredView = !this.isFilteredView;
    const button = document.getElementById('timeline-toggle-filter-btn');
    if (button) {
      button.textContent = this.isFilteredView ? 'Ver timeline completa' : 'Ver timeline focada';
    }
    this.render();
  }
}

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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 61;
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
/******/ 			61: 0,
/******/ 			312: 0,
/******/ 			434: 0,
/******/ 			583: 0,
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [76], () => (__webpack_require__(778)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;