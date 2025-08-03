/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			312: 0
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