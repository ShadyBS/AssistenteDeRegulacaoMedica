/**
 * @file Content Script para a extensÃ£o Assistente de RegulaÃ§Ã£o (v18 - Performance Otimizada).
 * Este script observa a abertura da aba de manutenÃ§Ã£o e envia os IDs para o background script,
 * com proteÃ§Ãµes contra DoS, throttling de mutaÃ§Ãµes e otimizaÃ§Ãµes de performance.
 *
 * âœ… TASK-A-001 Implementado:
 * - Debouncing mais agressivo (500ms)
 * - IntersectionObserver para elementos visÃ­veis
 * - Lazy loading para verificaÃ§Ãµes
 * - Seletores DOM otimizados com cache
 * - MÃ©tricas de performance
 */

(function () {
  logger.info(
    "[Assistente de RegulaÃ§Ã£o] Script de controle v18 (Performance Otimizada) ativo."
  );

  // âœ… SEGURO: Compatibilidade cross-browser com fallback
  const api = globalThis.browser || globalThis.chrome;

  if (!api) {
    logger.error('[Assistente] API de extensÃ£o nÃ£o disponÃ­vel');
    return;
  }

  let lastProcessedReguId = null;
  let observer = null;
  let intersectionObserver = null;
  let debounceTimeout = null;

  // âœ… SEGURANÃ‡A: Controle de throttling para prevenir DoS
  let mutationCount = 0;
  const MAX_MUTATIONS_PER_SECOND = 100;
  let mutationResetInterval = null;

  // âœ… TASK-A-001: MÃ©tricas de performance
  let performanceMetrics = {
    checkCount: 0,
    totalTime: 0,
    averageTime: 0,
    lastCheckTime: 0
  };

  // âœ… TASK-A-001: Cache de seletores DOM otimizados
  const domCache = new Map();
  const CACHE_TTL = 5000; // 5 segundos

  // âœ… TASK-A-001: FunÃ§Ã£o para verificar visibilidade de elementos
  const isElementVisible = (element) => {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      rect.top < window.innerHeight &&
      rect.bottom > 0
    );
  };

  // âœ… TASK-A-001: Seletor DOM otimizado com cache
  const getCachedElement = (selector) => {
    const now = Date.now();
    const cached = domCache.get(selector);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.element;
    }

    const element = document.querySelector(selector);
    domCache.set(selector, {
      element,
      timestamp: now
    });

    return element;
  };

  // âœ… TASK-A-001: FunÃ§Ã£o para medir performance
  const measurePerformance = (fn, name) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    performanceMetrics.checkCount++;
    performanceMetrics.totalTime += duration;
    performanceMetrics.averageTime = performanceMetrics.totalTime / performanceMetrics.checkCount;
    performanceMetrics.lastCheckTime = duration;

    if (duration > 50) { // Log se demorar mais que 50ms
      logger.warn(`[Assistente Performance] ${name} demorou ${duration.toFixed(2)}ms`);
    }

    return result;
  };

  // âœ… TASK-A-001: FunÃ§Ã£o otimizada com cache e mÃ©tricas de performance
  const checkMaintenanceTab = () => {
    return measurePerformance(() => {
      // âœ… TASK-A-001: Usar cache para elemento principal
      const maintenanceTabPanel = getCachedElement("#tabs-manutencao");
      const isActive =
        maintenanceTabPanel &&
        maintenanceTabPanel.getAttribute("aria-expanded") === "true";

      if (isActive) {
        // âœ… TASK-A-001: Seletores DOM otimizados com cache
        const idpElement = getCachedElement("#regu\\.reguPK\\.idp");
        const idsElement = getCachedElement("#regu\\.reguPK\\.ids");

        if (idpElement && idsElement && idpElement.value) {
          const reguIdp = idpElement.value;
          const reguIds = idsElement.value;
          const currentReguId = `${reguIdp}-${reguIds}`;

          if (currentReguId !== lastProcessedReguId) {
            lastProcessedReguId = currentReguId;
            const payload = { reguIdp, reguIds };

            logger.info(
              "[Assistente] Aba ManutenÃ§Ã£o aberta. Enviando IDs para o background script:",
              payload
            );

            // Envia a mensagem para o background script, que tem acesso ao storage.session
            try {
              api.runtime.sendMessage({ type: "SAVE_REGULATION_DATA", payload });
            } catch (e) {
              logger.error(
                "[Assistente] Falha ao enviar mensagem para o background script:",
                e
              );
            }
          }
        }
      } else {
        lastProcessedReguId = null;
      }
    }, 'checkMaintenanceTab');
  };

  // âœ… PERFORMANCE: FunÃ§Ã£o com debouncing mais agressivo e lazy loading
  const throttledCheckMaintenanceTab = () => {
    // Verifica se nÃ£o excedeu o limite de mutaÃ§Ãµes por segundo
    if (mutationCount >= MAX_MUTATIONS_PER_SECOND) {
      logger.warn('[Assistente] Limite de mutaÃ§Ãµes atingido, ignorando verificaÃ§Ã£o');
      return;
    }

    mutationCount++;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // âœ… TASK-A-001: Debouncing mais agressivo (500ms)
    debounceTimeout = setTimeout(() => {
      // âœ… TASK-A-001: Lazy loading - sÃ³ verifica se elementos estÃ£o visÃ­veis
      const maintenanceTabPanel = document.getElementById("tabs-manutencao");
      if (maintenanceTabPanel && isElementVisible(maintenanceTabPanel)) {
        checkMaintenanceTab();
      }
    }, 500);
  };

  // âœ… TASK-A-001: IntersectionObserver para elementos visÃ­veis
  const initIntersectionObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }

    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === "tabs-manutencao") {
          // Elemento estÃ¡ visÃ­vel, pode verificar
          measurePerformance(() => {
            checkMaintenanceTab();
          }, 'intersectionCheck');
        }
      });
    }, {
      threshold: 0.1, // Trigger quando 10% do elemento estiver visÃ­vel
      rootMargin: '50px' // Margem adicional para trigger antecipado
    });

    // Observar o elemento principal
    const maintenanceTab = document.getElementById("tabs-manutencao");
    if (maintenanceTab) {
      intersectionObserver.observe(maintenanceTab);
    }
  };

  // âœ… TASK-A-001: FunÃ§Ã£o para limpar cache DOM expirado
  const cleanupDomCache = () => {
    const now = Date.now();
    for (const [selector, cached] of domCache.entries()) {
      if ((now - cached.timestamp) > CACHE_TTL) {
        domCache.delete(selector);
      }
    }
  };

  // âœ… TASK-A-001: FunÃ§Ã£o para reportar mÃ©tricas de performance
  const reportPerformanceMetrics = () => {
    if (performanceMetrics.checkCount > 0) {
      logger.info('[Assistente Performance]', {
        totalChecks: performanceMetrics.checkCount,
        averageTime: performanceMetrics.averageTime.toFixed(2) + 'ms',
        lastCheckTime: performanceMetrics.lastCheckTime.toFixed(2) + 'ms',
        cacheSize: domCache.size
      });
    }
  };

  // âœ… TASK-A-001: FunÃ§Ã£o para limpar recursos e desconectar observers
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    if (mutationResetInterval) {
      clearInterval(mutationResetInterval);
      mutationResetInterval = null;
    }

    // âœ… TASK-A-001: Limpar cache e reportar mÃ©tricas
    domCache.clear();
    reportPerformanceMetrics();

    lastProcessedReguId = null;
    mutationCount = 0;
    logger.info("[Assistente] Recursos limpos e observers desconectados.");
  };

  // Inicializa o MutationObserver
  const initObserver = () => {
    if (observer) {
      cleanup();
    }

    // âœ… SEGURANÃ‡A: Inicializar contador de mutaÃ§Ãµes
    mutationCount = 0;

    // Reset do contador a cada segundo
    if (mutationResetInterval) {
      clearInterval(mutationResetInterval);
    }
    mutationResetInterval = setInterval(() => {
      mutationCount = 0;
    }, 1000);

    observer = new MutationObserver(throttledCheckMaintenanceTab);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"], // Apenas o atributo necessÃ¡rio para detectar abertura da aba
    });
  };

  // Listener para limpeza quando a extensÃ£o Ã© desabilitada ou a pÃ¡gina Ã© recarregada
  window.addEventListener("beforeunload", cleanup);

  // Listener para detectar desconexÃ£o da extensÃ£o
  api.runtime.onMessage.addListener((message) => {
    if (message.type === "EXTENSION_DISABLED" || message.type === "CLEANUP") {
      cleanup();
    }
  });

  // Detecta quando a extensÃ£o Ã© desabilitada
  api.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      cleanup();
    });
  });

  // âœ… TASK-A-001: Inicializa observers
  initObserver();
  initIntersectionObserver();

  // âœ… TASK-A-001: Limpeza periÃ³dica do cache DOM
  setInterval(cleanupDomCache, CACHE_TTL);

  // âœ… TASK-A-001: RelatÃ³rio de mÃ©tricas a cada 5 minutos
  setInterval(reportPerformanceMetrics, 5 * 60 * 1000);

  // Cleanup automÃ¡tico apÃ³s 30 minutos de inatividade para prevenir vazamentos de memÃ³ria
  let inactivityTimer = null;
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      logger.info("[Assistente] Limpeza automÃ¡tica por inatividade.");
      cleanup();
    }, 30 * 60 * 1000); // 30 minutos
  };

  // Reseta o timer de inatividade a cada verificaÃ§Ã£o
  const originalCheck = checkMaintenanceTab;
  checkMaintenanceTab = () => {
    originalCheck();
    resetInactivityTimer();
  };

  // Inicia o timer de inatividade
  resetInactivityTimer();
})();

