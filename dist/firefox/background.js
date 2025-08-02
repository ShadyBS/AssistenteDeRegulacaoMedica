/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 40:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/* harmony import */ var _KeepAliveManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(657);
/* harmony import */ var _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(322);




const api = typeof browser !== 'undefined' ? browser : chrome;
api.runtime.onMessage.addListener(async message => {
  if (message.type === 'SAVE_REGULATION_DATA') {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Recebido pedido para salvar dados da regulação', {
      payloadType: typeof message.payload,
      hasPayload: !!message.payload
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    try {
      const regulationDetails = await (0,_api_js__WEBPACK_IMPORTED_MODULE_0__/* .fetchRegulationDetails */ .hr)(message.payload);
      if (regulationDetails) {
        // CORREÇÃO: Usando storage.local em vez de storage.session para maior compatibilidade.
        await api.storage.local.set({
          pendingRegulation: regulationDetails
        });
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Detalhes da regulação salvos no storage local com sucesso', {
          regulationId: regulationDetails.id || 'unknown',
          hasDetails: !!regulationDetails
        }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
      } else {
        (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logWarning */ .FF)('Não foram encontrados detalhes para a regulação', {
          payloadType: typeof message.payload
        }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
      }
    } catch (e) {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logError */ .vV)('Falha ao buscar ou salvar dados da regulação', {
        errorMessage: e.message,
        errorType: e.constructor.name
      }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    }
    return true;
  }
});
async function openSidebar(tab) {
  try {
    if (api.sidePanel) {
      await api.sidePanel.open({
        windowId: tab.windowId
      });
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Sidebar aberto via sidePanel API', {
        windowId: tab.windowId
      }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    } else if (api.sidebarAction) {
      await api.sidebarAction.toggle();
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Sidebar alternado via sidebarAction API', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    } else {
      (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logWarning */ .FF)('Nenhuma API de sidebar disponível', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
    }
  } catch (error) {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logError */ .vV)('Falha ao abrir sidebar', {
      errorMessage: error.message,
      tabId: tab.id,
      windowId: tab.windowId
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT);
  }
}
api.action.onClicked.addListener(openSidebar);
new _KeepAliveManager_js__WEBPACK_IMPORTED_MODULE_1__/* .KeepAliveManager */ .E();
api.runtime.onInstalled.addListener(details => {
  (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Extensão instalada/atualizada', {
    reason: details.reason,
    version: api.runtime.getManifest().version
  }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.EXTENSION_LIFECYCLE);
  if (api.sidePanel) {
    api.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false
    }).catch(e => (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logError */ .vV)('Falha ao definir o comportamento do sidePanel', {
      errorMessage: e.message
    }, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.BACKGROUND_SCRIPT));
  }
  api.contextMenus.create({
    id: 'openSidePanel',
    title: 'Alternar Assistente de Regulação',
    contexts: ['all']
  });
  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
      openSidebar(tab);
    }
  });
  if (details.reason === 'install') {
    (0,_ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .logInfo */ .fH)('Primeira instalação detectada, abrindo página de ajuda', {}, _ErrorHandler_js__WEBPACK_IMPORTED_MODULE_2__/* .ERROR_CATEGORIES */ .Uu.EXTENSION_LIFECYCLE);
    api.tabs.create({
      url: api.runtime.getURL('help.html')
    });
  }
});

/***/ }),

/***/ 657:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ KeepAliveManager)
/* harmony export */ });
/* harmony import */ var _api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(574);
/**
 * @file Gerenciador de Keep-Alive para manter a sessão ativa
 */

class KeepAliveManager {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
    this.intervalMinutes = 10; // Padrão: 10 minutos

    this.init();
  }
  async init() {
    // Carrega as configurações salvas
    await this.loadSettings();

    // Escuta mudanças nas configurações
    if (typeof browser !== 'undefined') {
      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.keepSessionAliveInterval) {
          this.updateInterval(changes.keepSessionAliveInterval.newValue);
        }
      });
    }
  }
  async loadSettings() {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const result = await api.storage.sync.get({
        keepSessionAliveInterval: 10
      });
      this.updateInterval(result.keepSessionAliveInterval);
    } catch (error) {
      console.error('Erro ao carregar configurações do keep-alive:', error);
    }
  }
  updateInterval(minutes) {
    const newMinutes = parseInt(minutes, 10) || 0;
    this.intervalMinutes = newMinutes;

    // Para o timer atual
    this.stop();

    // Inicia novo timer se o valor for maior que 0
    if (this.intervalMinutes > 0) {
      this.start();
    }
  }
  start() {
    if (this.intervalMinutes <= 0) {
      console.log('Keep-alive desativado (intervalo = 0)');
      return;
    }
    if (this.isActive) {
      console.log('Keep-alive já está ativo');
      return;
    }
    const intervalMs = this.intervalMinutes * 60 * 1000; // Converte minutos para milissegundos

    this.intervalId = setInterval(async () => {
      try {
        const success = await _api_js__WEBPACK_IMPORTED_MODULE_0__/* .keepSessionAlive */ .JA();
        if (success) {
          console.log(`Keep-alive executado com sucesso (${new Date().toLocaleTimeString()})`);
        } else {
          console.warn(`Keep-alive falhou (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error('Erro no keep-alive:', error);
      }
    }, intervalMs);
    this.isActive = true;
    console.log(`Keep-alive iniciado: ${this.intervalMinutes} minutos (${intervalMs}ms)`);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    console.log('Keep-alive parado');
  }
  getStatus() {
    return {
      isActive: this.isActive,
      intervalMinutes: this.intervalMinutes,
      nextExecution: this.isActive ? new Date(Date.now() + this.intervalMinutes * 60 * 1000) : null
    };
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
/******/ 		__webpack_require__.j = 471;
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
/******/ 			424: 0,
/******/ 			471: 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [76], () => (__webpack_require__(40)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;