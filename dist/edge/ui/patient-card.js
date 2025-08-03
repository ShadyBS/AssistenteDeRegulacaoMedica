/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 627:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export init */
/* harmony import */ var _store_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(335);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(239);
/**
 * @file Módulo para gerir o card de "Dados do Paciente".
 */


let patientDetailsSection, patientMainInfoDiv, patientAdditionalInfoDiv, toggleDetailsBtn, patientCardFooter, cadsusTimestamp, refreshCadsusBtn;
let fieldConfigLayout = (/* unused pure expression or super */ null && ([]));
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
    return Utils.getNestedValue(data, field.key);
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
        compareV1 = Utils.normalizeString(v1);
        compareV2 = Utils.normalizeString(v2);
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
  const patient = store.getPatient();
  if (patient && patient.ficha && onForceRefresh) {
    onForceRefresh({
      idp: patient.ficha.isenPK.idp,
      ids: patient.ficha.isenPK.ids
    }, true);
  }
}
function onStateChange() {
  const patient = store.getPatient();
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
  store.subscribe(onStateChange);
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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			434: 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,76], () => (__webpack_require__(627)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;