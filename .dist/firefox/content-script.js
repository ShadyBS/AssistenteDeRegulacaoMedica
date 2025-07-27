/**
 * @file Content Script para a extensão Assistente de Regulação (v18 - Performance Otimizada).
 * Este script observa a abertura da aba de manutenção e envia os IDs para o background script,
 * com proteções contra DoS, throttling de mutações e otimizações de performance.
 * 
 * ✅ TASK-A-001 Implementado:
 * - Debouncing mais agressivo (500ms)
 * - IntersectionObserver para elementos visíveis
 * - Lazy loading para verificações
 * - Seletores DOM otimizados com cache
 * - Métricas de performance
 */

(function () {
  console.log(
    "[Assistente de Regulação] Script de controle v18 (Performance Otimizada) ativo."
  );

  // ✅ SEGURO: Compatibilidade cross-browser com fallback
  const api = globalThis.browser || globalThis.chrome;
  
  if (!api) {
    console.error('[Assistente] API de extensão não disponível');
    return;
  }
  
  let lastProcessedReguId = null;
  let observer = null;
  let intersectionObserver = null;
  let debounceTimeout = null;
  
  // ✅ SEGURANÇA: Controle de throttling para prevenir DoS
  let mutationCount = 0;
  const MAX_MUTATIONS_PER_SECOND = 100;
  let mutationResetInterval = null;
  
  // ✅ TASK-A-001: Métricas de performance
  let performanceMetrics = {
    checkCount: 0,
    totalTime: 0,
    averageTime: 0,
    lastCheckTime: 0
  };
  
  // ✅ TASK-A-001: Cache de seletores DOM otimizados
  const domCache = new Map();
  const CACHE_TTL = 5000; // 5 segundos
  
  // ✅ TASK-A-001: Função para verificar visibilidade de elementos
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
  
  // ✅ TASK-A-001: Seletor DOM otimizado com cache
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
  
  // ✅ TASK-A-001: Função para medir performance
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
      console.warn(`[Assistente Performance] ${name} demorou ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };

  // ✅ TASK-A-001: Função otimizada com cache e métricas de performance
  const checkMaintenanceTab = () => {
    return measurePerformance(() => {
      // ✅ TASK-A-001: Usar cache para elemento principal
      const maintenanceTabPanel = getCachedElement("#tabs-manutencao");
      const isActive =
        maintenanceTabPanel &&
        maintenanceTabPanel.getAttribute("aria-expanded") === "true";

      if (isActive) {
        // ✅ TASK-A-001: Seletores DOM otimizados com cache
        const idpElement = getCachedElement("#regu\\.reguPK\\.idp");
        const idsElement = getCachedElement("#regu\\.reguPK\\.ids");

        if (idpElement && idsElement && idpElement.value) {
          const reguIdp = idpElement.value;
          const reguIds = idsElement.value;
          const currentReguId = `${reguIdp}-${reguIds}`;

          if (currentReguId !== lastProcessedReguId) {
            lastProcessedReguId = currentReguId;
            const payload = { reguIdp, reguIds };

            console.log(
              "[Assistente] Aba Manutenção aberta. Enviando IDs para o background script:",
              payload
            );

            // Envia a mensagem para o background script, que tem acesso ao storage.session
            try {
              api.runtime.sendMessage({ type: "SAVE_REGULATION_DATA", payload });
            } catch (e) {
              console.error(
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

  // ✅ PERFORMANCE: Função com debouncing mais agressivo e lazy loading
  const throttledCheckMaintenanceTab = () => {
    // Verifica se não excedeu o limite de mutações por segundo
    if (mutationCount >= MAX_MUTATIONS_PER_SECOND) {
      console.warn('[Assistente] Limite de mutações atingido, ignorando verificação');
      return;
    }
    
    mutationCount++;
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // ✅ TASK-A-001: Debouncing mais agressivo (500ms)
    debounceTimeout = setTimeout(() => {
      // ✅ TASK-A-001: Lazy loading - só verifica se elementos estão visíveis
      const maintenanceTabPanel = document.getElementById("tabs-manutencao");
      if (maintenanceTabPanel && isElementVisible(maintenanceTabPanel)) {
        checkMaintenanceTab();
      }
    }, 500);
  };

  // ✅ TASK-A-001: IntersectionObserver para elementos visíveis
  const initIntersectionObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === "tabs-manutencao") {
          // Elemento está visível, pode verificar
          measurePerformance(() => {
            checkMaintenanceTab();
          }, 'intersectionCheck');
        }
      });
    }, {
      threshold: 0.1, // Trigger quando 10% do elemento estiver visível
      rootMargin: '50px' // Margem adicional para trigger antecipado
    });
    
    // Observar o elemento principal
    const maintenanceTab = document.getElementById("tabs-manutencao");
    if (maintenanceTab) {
      intersectionObserver.observe(maintenanceTab);
    }
  };
  
  // ✅ TASK-A-001: Função para limpar cache DOM expirado
  const cleanupDomCache = () => {
    const now = Date.now();
    for (const [selector, cached] of domCache.entries()) {
      if ((now - cached.timestamp) > CACHE_TTL) {
        domCache.delete(selector);
      }
    }
  };
  
  // ✅ TASK-A-001: Função para reportar métricas de performance
  const reportPerformanceMetrics = () => {
    if (performanceMetrics.checkCount > 0) {
      console.log('[Assistente Performance]', {
        totalChecks: performanceMetrics.checkCount,
        averageTime: performanceMetrics.averageTime.toFixed(2) + 'ms',
        lastCheckTime: performanceMetrics.lastCheckTime.toFixed(2) + 'ms',
        cacheSize: domCache.size
      });
    }
  };

  // ✅ TASK-A-001: Função para limpar recursos e desconectar observers
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
    
    // ✅ TASK-A-001: Limpar cache e reportar métricas
    domCache.clear();
    reportPerformanceMetrics();
    
    lastProcessedReguId = null;
    mutationCount = 0;
    console.log("[Assistente] Recursos limpos e observers desconectados.");
  };

  // Inicializa o MutationObserver
  const initObserver = () => {
    if (observer) {
      cleanup();
    }

    // ✅ SEGURANÇA: Inicializar contador de mutações
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
      attributeFilter: ["aria-expanded"], // Apenas o atributo necessário para detectar abertura da aba
    });
  };

  // Listener para limpeza quando a extensão é desabilitada ou a página é recarregada
  window.addEventListener("beforeunload", cleanup);
  
  // Listener para detectar desconexão da extensão
  api.runtime.onMessage.addListener((message) => {
    if (message.type === "EXTENSION_DISABLED" || message.type === "CLEANUP") {
      cleanup();
    }
  });

  // Detecta quando a extensão é desabilitada
  api.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      cleanup();
    });
  });

  // ✅ TASK-A-001: Inicializa observers
  initObserver();
  initIntersectionObserver();

  // ✅ TASK-A-001: Limpeza periódica do cache DOM
  setInterval(cleanupDomCache, CACHE_TTL);

  // ✅ TASK-A-001: Relatório de métricas a cada 5 minutos
  setInterval(reportPerformanceMetrics, 5 * 60 * 1000);

  // Cleanup automático após 30 minutos de inatividade para prevenir vazamentos de memória
  let inactivityTimer = null;
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      console.log("[Assistente] Limpeza automática por inatividade.");
      cleanup();
    }, 30 * 60 * 1000); // 30 minutos
  };

  // Reseta o timer de inatividade a cada verificação
  const originalCheck = checkMaintenanceTab;
  checkMaintenanceTab = () => {
    originalCheck();
    resetInactivityTimer();
  };

  // Inicia o timer de inatividade
  resetInactivityTimer();
})();