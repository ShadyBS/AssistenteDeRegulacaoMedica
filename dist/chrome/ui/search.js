/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 239:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LJ: () => (/* binding */ getNestedValue),
/* harmony export */   i1: () => (/* binding */ toggleLoader),
/* harmony export */   rG: () => (/* binding */ showMessage),
/* harmony export */   sg: () => (/* binding */ debounce)
/* harmony export */ });
/* unused harmony exports showDialog, clearMessage, parseDate, calculateRelativeDate, getContrastYIQ, normalizeString, setupTabs, normalizeTimelineData, filterTimelineEvents */
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

/***/ 889:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export init */
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
  const recents = store.getRecentPatients() || [];
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
    const recentPatient = store.getRecentPatients().find(p => {
      // CORREÇÃO: Lida com a estrutura de dados antiga e nova.
      const patientIdp = p.ficha ? p.ficha.isenPK.idp : p.idp;
      return patientIdp == idp;
    });

    // Se o paciente foi encontrado e tem a nova estrutura (com cache), usa os dados do cache.
    if (recentPatient && recentPatient.ficha) {
      store.setPatient(recentPatient.ficha, recentPatient.cadsus);
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
  store.subscribe(() => {
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
/******/ 		__webpack_require__.j = 312;
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
/******/ 			312: 0,
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [76], () => (__webpack_require__(889)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;