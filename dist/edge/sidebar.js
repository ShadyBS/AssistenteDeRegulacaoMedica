/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./sidebar.js":
/*!********************!*\
  !*** ./sidebar.js ***!
  \********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var bluebird__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bluebird */ "./node_modules/bluebird/js/browser/bluebird.js");
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api.js */ "./api.js");
/* harmony import */ var _browser_polyfill_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./browser-polyfill.js */ "./browser-polyfill.js");
/* harmony import */ var _field_config_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./field-config.js */ "./field-config.js");
/* harmony import */ var _renderers_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./renderers.js */ "./renderers.js");
/* harmony import */ var _SectionManager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./SectionManager.js */ "./SectionManager.js");
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./store.js */ "./store.js");
/* harmony import */ var _TimelineManager_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./TimelineManager.js */ "./TimelineManager.js");
/* harmony import */ var _ui_patient_card_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./ui/patient-card.js */ "./ui/patient-card.js");
/* harmony import */ var _ui_search_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./ui/search.js */ "./ui/search.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./utils.js */ "./utils.js");







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

// --- FUNÇÃO AUXILIAR DE FILTRAGEM ---
/**
 * Aplica um filtro de texto normalizado a um array de dados.
 * @param {Array} items - O array de itens a ser filtrado.
 * @param {string} text - O texto de busca (pode conter múltiplos termos separados por vírgula).
 * @param {Function} getFieldContent - Uma função que recebe um item e retorna a string a ser pesquisada.
 * @returns {Array} O array de itens filtrado.
 */
const applyNormalizedTextFilter = (items, text, getFieldContent) => {
  const searchTerms = _utils_js__WEBPACK_IMPORTED_MODULE_10__.normalizeString(text).split(',').map(t => t.trim()).filter(Boolean);
  if (searchTerms.length === 0) return items;
  return items.filter(item => {
    const content = _utils_js__WEBPACK_IMPORTED_MODULE_10__.normalizeString(getFieldContent(item));
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
    const start = _utils_js__WEBPACK_IMPORTED_MODULE_10__.parseDate(startDateValue);
    if (start) {
      filteredData = filteredData.filter(doc => {
        const docDate = _utils_js__WEBPACK_IMPORTED_MODULE_10__.parseDate(doc.date.split(' ')[0]);
        return docDate && docDate >= start;
      });
    }
  }
  if (endDateValue) {
    const end = _utils_js__WEBPACK_IMPORTED_MODULE_10__.parseDate(endDateValue);
    if (end) {
      filteredData = filteredData.filter(doc => {
        const docDate = _utils_js__WEBPACK_IMPORTED_MODULE_10__.parseDate(doc.date.split(' ')[0]);
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
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchAllConsultations,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_4__.renderConsultations,
    initialSortState: {
      key: 'sortableDate',
      order: 'desc'
    },
    filterLogic: consultationFilterLogic
  },
  exams: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchExamesSolicitados,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_4__.renderExams,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: examFilterLogic
  },
  appointments: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchAppointments,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_4__.renderAppointments,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: appointmentFilterLogic
  },
  regulations: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchAllRegulations,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_4__.renderRegulations,
    initialSortState: {
      key: 'date',
      order: 'desc'
    },
    filterLogic: regulationFilterLogic
  },
  documents: {
    fetchFunction: _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchDocuments,
    renderFunction: _renderers_js__WEBPACK_IMPORTED_MODULE_4__.renderDocuments,
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
function selectPatient(_x) {
  return _selectPatient.apply(this, arguments);
}
function _selectPatient() {
  _selectPatient = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (patientInfo, forceRefresh = false) {
    const currentPatient = _store_js__WEBPACK_IMPORTED_MODULE_6__.store.getPatient();
    if (currentPatient && currentPatient.ficha.isenPK.idp === patientInfo.idp && !forceRefresh) {
      return;
    }
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.toggleLoader(true);
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.clearMessage();
    _store_js__WEBPACK_IMPORTED_MODULE_6__.store.setPatientUpdating();
    try {
      const ficha = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchVisualizaUsuario(patientInfo);
      const cadsus = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchCadsusData({
        cpf: _utils_js__WEBPACK_IMPORTED_MODULE_10__.getNestedValue(ficha, 'entidadeFisica.entfCPF'),
        cns: ficha.isenNumCadSus
      });
      Object.values(sectionManagers).forEach(manager => {
        if (typeof manager.clearAutomationFeedbackAndFilters === 'function') {
          manager.clearAutomationFeedbackAndFilters(false);
        } else if (typeof manager.clearAutomation === 'function') {
          manager.clearAutomation();
        }
      });
      _store_js__WEBPACK_IMPORTED_MODULE_6__.store.setPatient(ficha, cadsus);
      yield updateRecentPatients(_store_js__WEBPACK_IMPORTED_MODULE_6__.store.getPatient());
    } catch (error) {
      _utils_js__WEBPACK_IMPORTED_MODULE_10__.showMessage(error.message, 'error');
      console.error(error);
      _store_js__WEBPACK_IMPORTED_MODULE_6__.store.clearPatient();
    } finally {
      _utils_js__WEBPACK_IMPORTED_MODULE_10__.toggleLoader(false);
    }
  });
  return _selectPatient.apply(this, arguments);
}
function init() {
  return _init.apply(this, arguments);
}
function _init() {
  _init = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    let baseUrlConfigured = true;
    try {
      yield _api_js__WEBPACK_IMPORTED_MODULE_1__.getBaseUrl();
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
          openOptions.addEventListener('click', () => browser.runtime.openOptionsPage());
        }
        if (reloadSidebar) {
          reloadSidebar.addEventListener('click', () => window.location.reload());
        }

        // **não retornamos mais aqui**, apenas marcamos que deu “fallback”
      } else {
        console.error('Initialization failed:', error);
        _utils_js__WEBPACK_IMPORTED_MODULE_10__.showMessage('Ocorreu um erro inesperado ao iniciar a extensão.', 'error');
        // nesse caso você pode querer return ou throw de verdade
        return;
      }
    }

    // === setup das abas: sempre rodar, mesmo sem baseURL ===
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.setupTabs(document.getElementById('layout-tabs-container'));
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.setupTabs(document.getElementById('patterns-tabs-container'));
    // (adicione aqui quaisquer outros containers de aba que tenha)

    // === só o resto do fluxo principal depende de baseUrlConfigured ===
    if (!baseUrlConfigured) {
      // já mostramos o formulário de URL, não temos mais nada a fazer
      return;
    }

    // agora vem tudo o que precisa de baseURL
    const [globalSettings, regulationPriorities] = yield Promise.all([loadConfigAndData(), _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchRegulationPriorities()]);
    globalSettings.regulationPriorities = regulationPriorities;
    applySectionIcons();
    applyCustomHeaderStyles(globalSettings.sectionHeaderStyles);
    applySectionOrder(globalSettings.sidebarSectionOrder);
    _ui_search_js__WEBPACK_IMPORTED_MODULE_9__.init({
      onSelectPatient: selectPatient
    });
    _ui_patient_card_js__WEBPACK_IMPORTED_MODULE_8__.init(globalSettings.fieldConfigLayout, {
      onForceRefresh: selectPatient
    });
    initializeSections(globalSettings);
    applyUserPreferences(globalSettings);
    addGlobalEventListeners();
    setupAutoModeToggle();
    yield checkForPendingRegulation();
  });
  return _init.apply(this, arguments);
}
function loadConfigAndData() {
  return _loadConfigAndData.apply(this, arguments);
}
function _loadConfigAndData() {
  _loadConfigAndData = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    const syncData = yield browser.storage.sync.get({
      patientFields: _field_config_js__WEBPACK_IMPORTED_MODULE_3__.defaultFieldConfig,
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
    const localData = yield browser.storage.local.get({
      recentPatients: [],
      savedFilterSets: {},
      automationRules: []
    });
    _store_js__WEBPACK_IMPORTED_MODULE_6__.store.setRecentPatients(localData.recentPatients);
    _store_js__WEBPACK_IMPORTED_MODULE_6__.store.setSavedFilterSets(localData.savedFilterSets);
    return {
      fieldConfigLayout: _field_config_js__WEBPACK_IMPORTED_MODULE_3__.defaultFieldConfig.map(defaultField => {
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
  });
  return _loadConfigAndData.apply(this, arguments);
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
      sectionManagers[key] = new _TimelineManager_js__WEBPACK_IMPORTED_MODULE_7__.TimelineManager(key, sectionConfigurations[key], globalSettings);
      return;
    }
    sectionManagers[key] = new _SectionManager_js__WEBPACK_IMPORTED_MODULE_5__.SectionManager(key, sectionConfigurations[key], globalSettings);
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
    if (initialEl) initialEl.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_10__.calculateRelativeDate(range.start);
    if (finalEl) finalEl.valueAsDate = _utils_js__WEBPACK_IMPORTED_MODULE_10__.calculateRelativeDate(range.end);
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
  browser.storage.sync.get({
    enableAutomaticDetection: true
  }).then(settings => {
    toggle.checked = settings.enableAutomaticDetection;
    label.textContent = settings.enableAutomaticDetection ? 'Auto' : 'Manual';
  });
  toggle.addEventListener('change', event => {
    const isEnabled = event.target.checked;
    browser.storage.sync.set({
      enableAutomaticDetection: isEnabled
    });
    label.textContent = isEnabled ? 'Auto' : 'Manual';
  });
}
function handleRegulationLoaded(_x2) {
  return _handleRegulationLoaded.apply(this, arguments);
}
function _handleRegulationLoaded() {
  _handleRegulationLoaded = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (regulationData) {
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.toggleLoader(true);
    try {
      currentRegulationData = regulationData;
      if (regulationData && regulationData.isenPKIdp && regulationData.isenPKIds) {
        const patientInfo = {
          idp: regulationData.isenPKIdp,
          ids: regulationData.isenPKIds
        };
        yield selectPatient(patientInfo);
        const contextName = regulationData.apcnNome || regulationData.prciNome || 'Contexto';
        const infoBtn = document.getElementById('context-info-btn');
        infoBtn.title = `Contexto: ${contextName.trim()}`;
        infoBtn.classList.remove('hidden');
        yield applyAutomationRules(regulationData);
      } else {
        currentRegulationData = null;
        _utils_js__WEBPACK_IMPORTED_MODULE_10__.showMessage('Não foi possível extrair os dados do paciente da regulação.', 'error');
      }
    } catch (error) {
      currentRegulationData = null;
      _utils_js__WEBPACK_IMPORTED_MODULE_10__.showMessage(`Erro ao processar a regulação: ${error.message}`, 'error');
      console.error('Erro ao processar a regulação:', error);
    } finally {
      _utils_js__WEBPACK_IMPORTED_MODULE_10__.toggleLoader(false);
    }
  });
  return _handleRegulationLoaded.apply(this, arguments);
}
function applyAutomationRules(_x3) {
  return _applyAutomationRules.apply(this, arguments);
}
function _applyAutomationRules() {
  _applyAutomationRules = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (regulationData) {
    const {
      automationRules
    } = yield browser.storage.local.get({
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
  });
  return _applyAutomationRules.apply(this, arguments);
}
function handleShowRegulationInfo() {
  if (!currentRegulationData) {
    _utils_js__WEBPACK_IMPORTED_MODULE_10__.showMessage('Nenhuma informação de regulação carregada.', 'info');
    return;
  }
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const infoModal = document.getElementById('info-modal');
  modalTitle.textContent = 'Dados da Regulação (JSON)';
  const formattedJson = JSON.stringify(currentRegulationData, null, 2);
  modalContent.innerHTML = `<pre class="bg-slate-100 p-2 rounded-md text-xs whitespace-pre-wrap break-all">${formattedJson}</pre>`;
  infoModal.classList.remove('hidden');
}
function addGlobalEventListeners() {
  const mainContent = document.getElementById('main-content');
  const infoModal = document.getElementById('info-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const infoBtn = document.getElementById('context-info-btn');
  const reloadBtn = document.getElementById('reload-sidebar-btn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      const patient = _store_js__WEBPACK_IMPORTED_MODULE_6__.store.getPatient();
      if (patient && patient.ficha) {
        const confirmation = window.confirm('Um paciente está selecionado e o estado atual será perdido. Deseja realmente recarregar o assistente?');
        if (confirmation) {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    });
  }
  modalCloseBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
  infoModal.addEventListener('click', e => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });
  mainContent.addEventListener('click', handleGlobalActions);
  infoBtn.addEventListener('click', handleShowRegulationInfo);
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.pendingRegulation) {
      // Apenas processa se a detecção automática estiver LIGADA
      browser.storage.sync.get({
        enableAutomaticDetection: true
      }).then(settings => {
        if (settings.enableAutomaticDetection) {
          const {
            newValue
          } = changes.pendingRegulation;
          if (newValue && newValue.isenPKIdp) {
            console.log('[Assistente Sidebar] Nova regulação detectada via storage.onChanged:', newValue);
            handleRegulationLoaded(newValue);
            browser.storage.local.remove('pendingRegulation');
          }
        }
      });
    }
    if (areaName === 'sync' && changes.sectionHeaderStyles) {
      window.location.reload();
    }
    if (areaName === 'sync' && changes.enableAutomaticDetection) {
      // Mantém o botão da sidebar sincronizado com a configuração
      setupAutoModeToggle();
    }
  });
}
function handleGlobalActions(_x4) {
  return _handleGlobalActions.apply(this, arguments);
}
function _handleGlobalActions() {
  _handleGlobalActions = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (event) {
    const target = event.target;
    const copyBtn = target.closest('.copy-icon');
    if (copyBtn) {
      yield copyToClipboard(copyBtn);
      return;
    }
    const examResultBtn = target.closest('.view-exam-result-btn');
    if (examResultBtn) {
      yield handleViewExamResult(examResultBtn);
      return;
    }
    const appointmentDetailsBtn = target.closest('.view-appointment-details-btn');
    if (appointmentDetailsBtn) {
      yield handleShowAppointmentDetailsModal(appointmentDetailsBtn);
      return;
    }
    const regulationDetailsBtn = target.closest('.view-regulation-details-btn');
    if (regulationDetailsBtn) {
      yield handleShowRegulationDetailsModal(regulationDetailsBtn);
      return;
    }
    const appointmentInfoBtn = target.closest('.appointment-info-btn');
    if (appointmentInfoBtn) {
      handleShowAppointmentInfo(appointmentInfoBtn);
      return;
    }
    const documentBtn = target.closest('.view-document-btn');
    if (documentBtn) {
      yield handleViewDocument(documentBtn);
      return;
    }
    const regulationAttachmentBtn = target.closest('.view-regulation-attachment-btn');
    if (regulationAttachmentBtn) {
      yield handleViewRegulationAttachment(regulationAttachmentBtn);
      return;
    }
  });
  return _handleGlobalActions.apply(this, arguments);
}
function copyToClipboard(_x5) {
  return _copyToClipboard.apply(this, arguments);
}
function _copyToClipboard() {
  _copyToClipboard = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
    if (button.dataset.inProgress === 'true') return;
    const textToCopy = button.dataset.copyText;
    if (!textToCopy) return;
    button.dataset.inProgress = 'true';
    try {
      yield navigator.clipboard.writeText(textToCopy);
      button.textContent = '✅';
    } catch (err) {
      console.error('Falha ao copiar texto: ', err);
      button.textContent = '❌';
    } finally {
      setTimeout(() => {
        button.textContent = '📄';
        button.dataset.inProgress = 'false';
      }, 1200);
    }
  });
  return _copyToClipboard.apply(this, arguments);
}
function updateRecentPatients(_x6) {
  return _updateRecentPatients.apply(this, arguments);
}
function _updateRecentPatients() {
  _updateRecentPatients = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (patientData) {
    if (!patientData || !patientData.ficha) return;
    const newRecent = {
      ...patientData
    };
    const currentRecents = _store_js__WEBPACK_IMPORTED_MODULE_6__.store.getRecentPatients();
    const filtered = (currentRecents || []).filter(p => p.ficha.isenPK.idp !== newRecent.ficha.isenPK.idp);
    const updatedRecents = [newRecent, ...filtered].slice(0, 5);
    yield browser.storage.local.set({
      recentPatients: updatedRecents
    });
    _store_js__WEBPACK_IMPORTED_MODULE_6__.store.setRecentPatients(updatedRecents);
  });
  return _updateRecentPatients.apply(this, arguments);
}
function handleViewExamResult(_x7) {
  return _handleViewExamResult.apply(this, arguments);
}
function _handleViewExamResult() {
  _handleViewExamResult = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
    const {
      idp,
      ids
    } = button.dataset;
    const newTab = window.open('', '_blank');
    newTab.document.write('Carregando resultado do exame...');
    try {
      const filePath = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchResultadoExame({
        idp,
        ids
      });
      const baseUrl = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.getBaseUrl();
      if (filePath) {
        const fullUrl = filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
        newTab.location.href = fullUrl;
      } else {
        newTab.document.body.innerHTML = '<p>Resultado não encontrado.</p>';
      }
    } catch (error) {
      newTab.document.body.innerHTML = `<p>Erro: ${error.message}</p>`;
    }
  });
  return _handleViewExamResult.apply(this, arguments);
}
function handleViewDocument(_x8) {
  return _handleViewDocument.apply(this, arguments);
}
function _handleViewDocument() {
  _handleViewDocument = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
    const {
      idp,
      ids
    } = button.dataset;
    const newTab = window.open('', '_blank');
    newTab.document.write('Carregando documento...');
    try {
      const docUrl = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchDocumentUrl({
        idp,
        ids
      });
      if (docUrl) {
        newTab.location.href = docUrl;
      } else {
        newTab.document.body.innerHTML = '<p>URL do documento não encontrada.</p>';
      }
    } catch (error) {
      newTab.document.body.innerHTML = `<p>Erro ao carregar documento: ${error.message}</p>`;
      console.error('Falha ao visualizar documento:', error);
    }
  });
  return _handleViewDocument.apply(this, arguments);
}
function handleViewRegulationAttachment(_x9) {
  return _handleViewRegulationAttachment.apply(this, arguments);
}
function _handleViewRegulationAttachment() {
  _handleViewRegulationAttachment = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
    const {
      idp,
      ids
    } = button.dataset;
    try {
      const fileUrl = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchRegulationAttachmentUrl({
        idp,
        ids
      });
      if (fileUrl) {
        // Use browser extension API instead of window.open
        const api = browser || chrome;
        yield api.tabs.create({
          url: fileUrl
        });
      } else {
        console.warn('⚠️ URL do anexo não encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar anexo da regulação:', error);
    }
  });
  return _handleViewRegulationAttachment.apply(this, arguments);
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
function handleShowRegulationDetailsModal(_x0) {
  return _handleShowRegulationDetailsModal.apply(this, arguments);
}
function _handleShowRegulationDetailsModal() {
  _handleShowRegulationDetailsModal = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
    const {
      idp,
      ids
    } = button.dataset;
    showModal('Detalhes da Regulação', '<p>Carregando...</p>');
    try {
      const data = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchRegulationDetails({
        reguIdp: idp,
        reguIds: ids
      });
      const content = formatRegulationDetailsForModal(data);
      showModal('Detalhes da Regulação', content);
    } catch (error) {
      showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
    }
  });
  return _handleShowRegulationDetailsModal.apply(this, arguments);
}
function handleShowAppointmentDetailsModal(_x1) {
  return _handleShowAppointmentDetailsModal.apply(this, arguments);
}
function _handleShowAppointmentDetailsModal() {
  _handleShowAppointmentDetailsModal = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* (button) {
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
        data = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchExamAppointmentDetails({
          idp,
          ids
        });
        content = formatExamAppointmentDetailsForModal(data);
      } else {
        data = yield _api_js__WEBPACK_IMPORTED_MODULE_1__.fetchAppointmentDetails({
          idp,
          ids
        });
        content = formatAppointmentDetailsForModal(data);
      }
      showModal(title, content);
    } catch (error) {
      showModal('Erro', `<p>Não foi possível carregar os detalhes: ${error.message}</p>`);
    }
  });
  return _handleShowAppointmentDetailsModal.apply(this, arguments);
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
function checkForPendingRegulation() {
  return _checkForPendingRegulation.apply(this, arguments);
}
function _checkForPendingRegulation() {
  _checkForPendingRegulation = (0,bluebird__WEBPACK_IMPORTED_MODULE_0__.coroutine)(function* () {
    try {
      const {
        pendingRegulation
      } = yield browser.storage.local.get('pendingRegulation');
      if (pendingRegulation && pendingRegulation.isenPKIdp) {
        yield handleRegulationLoaded(pendingRegulation);
        yield browser.storage.local.remove('pendingRegulation');
      }
    } catch (e) {
      console.error('Erro ao verificar regulação pendente:', e);
    }
  });
  return _checkForPendingRegulation.apply(this, arguments);
}
document.addEventListener('DOMContentLoaded', init);

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
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
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
/******/ 			"sidebar": 0
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
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors","common"], () => (__webpack_require__("./sidebar.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=sidebar.js.map