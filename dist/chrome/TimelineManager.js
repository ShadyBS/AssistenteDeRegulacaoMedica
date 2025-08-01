/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 968:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export TimelineManager */
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _renderers_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(690);
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(335);
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
    store.subscribe(() => this.onStateChange());
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
    var _this$elements$fetchB, _this$elements$toggle, _this$elements$search, _this$elements$dateIn, _this$elements$dateFi, _this$elements$sectio;
    (_this$elements$fetchB = this.elements.fetchBtn) === null || _this$elements$fetchB === void 0 ? void 0 : _this$elements$fetchB.addEventListener('click', () => this.fetchData());
    (_this$elements$toggle = this.elements.toggleBtn) === null || _this$elements$toggle === void 0 ? void 0 : _this$elements$toggle.addEventListener('click', () => this.toggleSection());
    (_this$elements$search = this.elements.searchKeyword) === null || _this$elements$search === void 0 ? void 0 : _this$elements$search.addEventListener('input', Utils.debounce(() => this.render(), 300));
    (_this$elements$dateIn = this.elements.dateInitial) === null || _this$elements$dateIn === void 0 ? void 0 : _this$elements$dateIn.addEventListener('change', () => this.render());
    (_this$elements$dateFi = this.elements.dateFinal) === null || _this$elements$dateFi === void 0 ? void 0 : _this$elements$dateFi.addEventListener('change', () => this.render());
    (_this$elements$sectio = this.elements.section) === null || _this$elements$sectio === void 0 ? void 0 : _this$elements$sectio.addEventListener('click', event => {
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
    });
  }
  onStateChange() {
    var _this$currentPatient, _this$currentPatient$, _newPatient$isenPK;
    const patientState = store.getPatient();
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
    if (this.elements.dateInitial) this.elements.dateInitial.valueAsDate = Utils.calculateRelativeDate(range.start);
    if (this.elements.dateFinal) this.elements.dateFinal.valueAsDate = Utils.calculateRelativeDate(range.end);
  }
  async fetchData() {
    if (!this.currentPatient || this.isLoading) {
      return;
    }
    this.isLoading = true;
    Renderers.renderTimeline([], 'loading');
    try {
      const params = {
        isenPK: `${this.currentPatient.isenPK.idp}-${this.currentPatient.isenPK.ids}`,
        isenFullPKCrypto: this.currentPatient.isenFullPKCrypto,
        dataInicial: '01/01/1900',
        // Busca sempre o histórico completo
        dataFinal: new Date().toLocaleDateString('pt-BR')
      };
      const apiData = await API.fetchAllTimelineData(params);
      const normalizedData = Utils.normalizeTimelineData(apiData);
      this.allData = normalizedData;
      this.render();
    } catch (error) {
      console.error('Erro ao buscar dados para a Linha do Tempo:', error);
      Renderers.renderTimeline([], 'error');
    } finally {
      this.isLoading = false;
    }
  }
  getFilterValues() {
    var _this$elements$dateIn2, _this$elements$dateFi2, _this$elements$search2;
    return {
      startDate: (_this$elements$dateIn2 = this.elements.dateInitial) === null || _this$elements$dateIn2 === void 0 ? void 0 : _this$elements$dateIn2.value,
      endDate: (_this$elements$dateFi2 = this.elements.dateFinal) === null || _this$elements$dateFi2 === void 0 ? void 0 : _this$elements$dateFi2.value,
      keyword: Utils.normalizeString(((_this$elements$search2 = this.elements.searchKeyword) === null || _this$elements$search2 === void 0 ? void 0 : _this$elements$search2.value) || '')
    };
  }
  render() {
    if (this.allData.length === 0 && !this.isLoading) {
      Renderers.renderTimeline([], 'empty');
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
      dataToRender = Utils.filterTimelineEvents(dataToRender, this.activeRuleFilters);
    }
    Renderers.renderTimeline(dataToRender, 'success');
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
/******/ 		__webpack_require__.j = 583;
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
/******/ 			583: 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [76], () => (__webpack_require__(968)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;