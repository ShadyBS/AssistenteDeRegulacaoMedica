# Prompt para Otimização de Performance de Extensões de Navegador

## ⚡ MISSÃO: OTIMIZAÇÃO COMPLETA DE PERFORMANCE EM EXTENSÕES

Você é um **Senior Browser Extension Performance Engineer** especializado em **otimização avançada** de extensões **Manifest V3**. Execute **análise profunda de performance**, **identificação de gargalos** e **implementação de otimizações** para criar extensões **ultra-rápidas** que não impactem a navegação do usuário.

---

## 🎯 INSTRUÇÕES INICIAIS OBRIGATÓRIAS

**ANTES DE INICIAR A OTIMIZAÇÃO:**
1. **SEMPRE leia o arquivo `agents.md`** - Contém especificações do projeto atual
2. **Estabeleça baseline de performance** - Métricas atuais da extensão
3. **Analise o manifest.json** - Identifique recursos e permissions
4. **Mapeie pontos críticos** - Service worker, content scripts, popup
5. **Meça impacto na navegação** - Core Web Vitals, page load time
6. **Identifique gargalos** - CPU, memória, network, storage I/O
7. **Defina metas de performance** - Targets específicos e mensuráveis

---

## 📊 MÉTRICAS DE PERFORMANCE PARA EXTENSÕES

### 🎯 **TARGETS DE PERFORMANCE (Benchmarks)**

#### **Service Worker Performance**
- **Startup Time:** < 100ms (cold start)
- **Event Response:** < 50ms (message handling)
- **Memory Usage:** < 50MB (peak)
- **CPU Usage:** < 5% (average)
- **Wake-up Frequency:** < 10/hour (idle)

#### **Content Script Performance**
- **Injection Time:** < 5ms (per script)
- **DOM Ready Impact:** < 10ms (page load delay)
- **Memory Footprint:** < 10MB (per tab)
- **CPU Impact:** < 2% (continuous)
- **First Paint Delay:** < 0ms (no impact)

#### **Popup Performance**
- **Open Time:** < 200ms (from click)
- **Render Time:** < 100ms (UI ready)
- **Memory Usage:** < 20MB (loaded)
- **Bundle Size:** < 1MB (total assets)
- **API Response:** < 100ms (data loading)

#### **Storage Performance**
- **Read Operations:** < 10ms (sync/local)
- **Write Operations:** < 20ms (sync/local)
- **Batch Operations:** < 50ms (multiple keys)
- **Storage Size:** < 10MB (total data)
- **Sync Frequency:** < 1/minute (automatic)

### 📈 **CORE WEB VITALS IMPACT**

#### **Largest Contentful Paint (LCP)**
- **Target:** Zero impact on LCP
- **Measurement:** Before/after extension installation
- **Threshold:** < 2.5s (page LCP)

#### **First Input Delay (FID)**
- **Target:** < 1ms additional delay
- **Measurement:** Input responsiveness with extension
- **Threshold:** < 100ms (total FID)

#### **Cumulative Layout Shift (CLS)**
- **Target:** Zero layout shifts from extension
- **Measurement:** Content script DOM modifications
- **Threshold:** < 0.1 (total CLS)

---

## 🔍 ANÁLISE DE PERFORMANCE SISTEMÁTICA

### **📊 Performance Profiling Tools**

#### **Service Worker Profiler**
```javascript
// Service Worker Performance Monitor
class ServiceWorkerProfiler {
  constructor() {
    this.metrics = {
      startupTime: 0,
      eventHandlingTimes: new Map(),
      memoryUsage: [],
      cpuUsage: [],
      wakeUpCount: 0,
      lastWakeUp: Date.now()
    };
    
    this.setupProfiling();
  }

  setupProfiling() {
    // Monitor startup time
    const startTime = performance.now();
    
    // Monitor event handling
    this.wrapEventHandlers();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor wake-ups
    this.trackWakeUps();
    
    // Calculate startup time
    setTimeout(() => {
      this.metrics.startupTime = performance.now() - startTime;
      console.log(`🚀 Service Worker startup: ${this.metrics.startupTime.toFixed(2)}ms`);
    }, 0);
  }

  wrapEventHandlers() {
    const originalAddListener = chrome.runtime.onMessage.addListener;
    chrome.runtime.onMessage.addListener = (listener) => {
      const wrappedListener = (message, sender, sendResponse) => {
        const startTime = performance.now();
        
        const result = listener(message, sender, sendResponse);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.eventHandlingTimes.set(message.type || 'unknown', duration);
        
        if (duration > 50) {
          console.warn(`⚠️ Slow event handler: ${message.type} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      };
      
      originalAddListener.call(chrome.runtime.onMessage, wrappedListener);
    };
  }

  startMemoryMonitoring() {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = performance.memory;
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
        
        // Keep only last 100 measurements
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }
        
        // Alert on high memory usage
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        if (usedMB > 50) {
          console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
        }
      }
    }, 5000); // Every 5 seconds
  }

  trackWakeUps() {
    const now = Date.now();
    const timeSinceLastWakeUp = now - this.metrics.lastWakeUp;
    
    if (timeSinceLastWakeUp > 60000) { // More than 1 minute
      this.metrics.wakeUpCount++;
      console.log(`🔄 Service Worker wake-up #${this.metrics.wakeUpCount}`);
    }
    
    this.metrics.lastWakeUp = now;
  }

  generateReport() {
    const avgEventTime = Array.from(this.metrics.eventHandlingTimes.values())
      .reduce((sum, time) => sum + time, 0) / this.metrics.eventHandlingTimes.size;

    const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const memoryMB = currentMemory ? currentMemory.used / 1024 / 1024 : 0;

    return {
      startupTime: this.metrics.startupTime,
      averageEventHandling: avgEventTime || 0,
      currentMemoryUsage: memoryMB,
      wakeUpCount: this.metrics.wakeUpCount,
      slowEvents: Array.from(this.metrics.eventHandlingTimes.entries())
        .filter(([_, time]) => time > 50)
        .map(([event, time]) => ({ event, time }))
    };
  }
}

// Initialize profiler
const swProfiler = new ServiceWorkerProfiler();
```

#### **Content Script Profiler**
```javascript
// Content Script Performance Monitor
class ContentScriptProfiler {
  constructor() {
    this.metrics = {
      injectionTime: 0,
      domReadyImpact: 0,
      memoryUsage: 0,
      domOperations: [],
      eventListeners: 0
    };
    
    this.setupProfiling();
  }

  setupProfiling() {
    // Measure injection time
    const injectionStart = performance.now();
    
    // Monitor DOM ready impact
    this.measureDOMReadyImpact();
    
    // Monitor DOM operations
    this.wrapDOMOperations();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Calculate injection time
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.injectionTime = performance.now() - injectionStart;
      console.log(`📄 Content script injection: ${this.metrics.injectionTime.toFixed(2)}ms`);
    });
  }

  measureDOMReadyImpact() {
    const originalDOMContentLoaded = document.addEventListener;
    let domReadyStart = 0;
    
    // Measure time from script start to DOM ready
    if (document.readyState === 'loading') {
      domReadyStart = performance.now();
      
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domReadyImpact = performance.now() - domReadyStart;
        console.log(`📄 DOM ready impact: ${this.metrics.domReadyImpact.toFixed(2)}ms`);
      });
    }
  }

  wrapDOMOperations() {
    // Monitor expensive DOM operations
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;
    const originalGetElementById = document.getElementById;

    document.querySelector = function(selector) {
      const start = performance.now();
      const result = originalQuerySelector.call(this, selector);
      const duration = performance.now() - start;
      
      if (duration > 1) {
        console.warn(`⚠️ Slow querySelector: "${selector}" took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    };

    document.querySelectorAll = function(selector) {
      const start = performance.now();
      const result = originalQuerySelectorAll.call(this, selector);
      const duration = performance.now() - start;
      
      if (duration > 2) {
        console.warn(`⚠️ Slow querySelectorAll: "${selector}" took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    };
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
        
        if (this.metrics.memoryUsage > 10) {
          console.warn(`⚠️ Content script high memory: ${this.metrics.memoryUsage.toFixed(2)}MB`);
        }
      }, 10000); // Every 10 seconds
    }
  }

  measurePageImpact() {
    // Measure impact on Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
        }
        
        if (entry.entryType === 'first-input') {
          console.log(`📊 FID: ${entry.processingStart - entry.startTime}ms`);
        }
        
        if (entry.entryType === 'layout-shift') {
          if (entry.value > 0.1) {
            console.warn(`⚠️ Layout shift: ${entry.value}`);
          }
        }
      }
    }).observe({
      entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
    });
  }
}

// Initialize content script profiler
const csProfiler = new ContentScriptProfiler();
csProfiler.measurePageImpact();
```

#### **Storage Performance Analyzer**
```javascript
// Storage Performance Monitor
class StorageProfiler {
  constructor() {
    this.metrics = {
      readTimes: [],
      writeTimes: [],
      batchTimes: [],
      storageSize: 0
    };
    
    this.wrapStorageAPIs();
  }

  wrapStorageAPIs() {
    // Wrap sync storage
    this.wrapStorageNamespace(chrome.storage.sync, 'sync');
    
    // Wrap local storage
    this.wrapStorageNamespace(chrome.storage.local, 'local');
  }

  wrapStorageNamespace(storageNamespace, type) {
    const originalGet = storageNamespace.get;
    const originalSet = storageNamespace.set;
    const originalRemove = storageNamespace.remove;

    storageNamespace.get = function(keys) {
      const start = performance.now();
      
      return originalGet.call(this, keys).then(result => {
        const duration = performance.now() - start;
        console.log(`📊 ${type} storage read: ${duration.toFixed(2)}ms`);
        
        if (duration > 10) {
          console.warn(`⚠️ Slow ${type} storage read: ${duration.toFixed(2)}ms`);
        }
        
        return result;
      });
    };

    storageNamespace.set = function(items) {
      const start = performance.now();
      const itemCount = Object.keys(items).length;
      
      return originalSet.call(this, items).then(result => {
        const duration = performance.now() - start;
        console.log(`📊 ${type} storage write (${itemCount} items): ${duration.toFixed(2)}ms`);
        
        if (duration > 20) {
          console.warn(`⚠️ Slow ${type} storage write: ${duration.toFixed(2)}ms`);
        }
        
        return result;
      });
    };
  }

  async measureStorageSize() {
    try {
      const syncSize = await chrome.storage.sync.getBytesInUse();
      const localSize = await chrome.storage.local.getBytesInUse();
      
      this.metrics.storageSize = syncSize + localSize;
      
      console.log(`📊 Storage usage: ${this.metrics.storageSize} bytes`);
      
      if (this.metrics.storageSize > 5 * 1024 * 1024) { // 5MB
        console.warn(`⚠️ Large storage usage: ${(this.metrics.storageSize / 1024 / 1024).toFixed(2)}MB`);
      }
    } catch (error) {
      console.error('Storage size measurement failed:', error);
    }
  }
}

// Initialize storage profiler
const storageProfiler = new StorageProfiler();
storageProfiler.measureStorageSize();
```

---

## ⚡ OTIMIZAÇÕES ESPECÍFICAS POR COMPONENTE

### **🔧 Service Worker Optimizations**

#### **1. Lazy Initialization**
```javascript
// ❌ Eager initialization - loads everything at startup
class EagerServiceWorker {
  constructor() {
    this.loadAllModules();
    this.initializeAllFeatures();
    this.setupAllListeners();
  }
}

// ✅ Lazy initialization - loads on demand
class LazyServiceWorker {
  constructor() {
    this.modules = new Map();
    this.features = new Map();
    this.setupCoreListeners();
  }

  async getModule(name) {
    if (!this.modules.has(name)) {
      const module = await import(`./modules/${name}.js`);
      this.modules.set(name, module);
    }
    return this.modules.get(name);
  }

  async getFeature(name) {
    if (!this.features.has(name)) {
      const module = await this.getModule(name);
      const feature = new module.default();
      this.features.set(name, feature);
    }
    return this.features.get(name);
  }

  setupCoreListeners() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      const feature = await this.getFeature(message.feature);
      return feature.handle(message, sender);
    });
  }
}
```

#### **2. Efficient Event Handling**
```javascript
// Event Handler Optimization
class OptimizedEventHandler {
  constructor() {
    this.messageQueue = [];
    this.processing = false;
    this.batchSize = 10;
    this.batchTimeout = 50; // ms
  }

  setupOptimizedHandlers() {
    // Batch message processing
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.queueMessage({ message, sender, sendResponse });
      this.processBatch();
      return true; // Keep channel open
    });

    // Debounced tab updates
    this.setupDebouncedTabHandler();
  }

  queueMessage(messageData) {
    this.messageQueue.push(messageData);
  }

  async processBatch() {
    if (this.processing || this.messageQueue.length === 0) return;
    
    this.processing = true;
    
    // Process messages in batches
    while (this.messageQueue.length > 0) {
      const batch = this.messageQueue.splice(0, this.batchSize);
      
      await Promise.all(batch.map(async ({ message, sender, sendResponse }) => {
        try {
          const result = await this.handleMessage(message, sender);
          sendResponse(result);
        } catch (error) {
          sendResponse({ error: error.message });
        }
      }));
      
      // Small delay between batches to prevent blocking
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    this.processing = false;
  }

  setupDebouncedTabHandler() {
    let tabUpdateTimeout;
    
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      clearTimeout(tabUpdateTimeout);
      
      tabUpdateTimeout = setTimeout(() => {
        this.handleTabUpdate(tabId, changeInfo, tab);
      }, 100); // Debounce 100ms
    });
  }
}
```

#### **3. Memory Management**
```javascript
// Memory-Efficient Service Worker
class MemoryEfficientServiceWorker {
  constructor() {
    this.cache = new Map();
    this.cacheLimit = 100;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    this.setupMemoryManagement();
  }

  setupMemoryManagement() {
    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Every minute

    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  set(key, value) {
    // Implement LRU cache
    if (this.cache.size >= this.cacheLimit) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      item.accessCount++;
      item.timestamp = Date.now();
      return item.value;
    }
    return null;
  }

  cleanupCache() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > 30) {
          console.warn(`High memory usage: ${usedMB.toFixed(2)}MB`);
          this.forceGarbageCollection();
        }
      }, 30000); // Every 30 seconds
    }
  }

  forceGarbageCollection() {
    // Clear caches
    this.cache.clear();
    
    // Clear any other large objects
    this.clearTemporaryData();
    
    console.log('Forced garbage collection');
  }
}
```

### **���� Content Script Optimizations**

#### **1. Efficient DOM Operations**
```javascript
// Optimized DOM Manipulation
class OptimizedDOMHandler {
  constructor() {
    this.domCache = new Map();
    this.mutationObserver = null;
    this.pendingUpdates = new Set();
    
    this.setupOptimizedDOM();
  }

  setupOptimizedDOM() {
    // Use single mutation observer instead of multiple
    this.mutationObserver = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.mutationObserver.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-*']
    });
  }

  // Cached element selection
  querySelector(selector) {
    if (!this.domCache.has(selector)) {
      const element = document.querySelector(selector);
      if (element) {
        this.domCache.set(selector, element);
      }
    }
    return this.domCache.get(selector);
  }

  // Batch DOM updates
  batchDOMUpdates(updates) {
    // Use document fragment for multiple insertions
    const fragment = document.createDocumentFragment();
    
    updates.forEach(update => {
      if (update.type === 'insert') {
        fragment.appendChild(update.element);
      }
    });
    
    // Single DOM operation
    if (fragment.children.length > 0) {
      document.body.appendChild(fragment);
    }
  }

  // Efficient event delegation
  setupEventDelegation() {
    // Single event listener on document
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-extension-action]');
      if (target) {
        const action = target.dataset.extensionAction;
        this.handleAction(action, target, event);
      }
    });
  }

  // Debounced scroll handler
  setupOptimizedScrollHandler() {
    let scrollTimeout;
    let isScrolling = false;

    document.addEventListener('scroll', () => {
      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(() => {
          this.handleScroll();
          isScrolling = false;
        });
      }
    }, { passive: true });
  }

  // Intersection Observer for visibility
  setupVisibilityObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleElementVisible(entry.target);
        } else {
          this.handleElementHidden(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observe elements as needed
    return observer;
  }
}
```

#### **2. Memory-Efficient Content Scripts**
```javascript
// Memory-Efficient Content Script
class MemoryEfficientContentScript {
  constructor() {
    this.eventListeners = new Map();
    this.observers = new Set();
    this.timers = new Set();
    
    this.setupCleanup();
  }

  setupCleanup() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Cleanup on extension context invalidated
    chrome.runtime.onConnect.addListener(() => {
      // Extension context is still valid
    });

    // Periodic cleanup
    setInterval(() => {
      this.performMaintenanceCleanup();
    }, 60000); // Every minute
  }

  addEventListenerTracked(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    
    // Track for cleanup
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler, options });
  }

  addObserverTracked(observer) {
    this.observers.add(observer);
    return observer;
  }

  addTimerTracked(timer) {
    this.timers.add(timer);
    return timer;
  }

  cleanup() {
    // Remove all event listeners
    for (const [element, listeners] of this.eventListeners) {
      listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    }
    this.eventListeners.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer.disconnect) observer.disconnect();
      if (observer.unobserve) observer.unobserve();
    });
    this.observers.clear();

    // Clear all timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();

    console.log('Content script cleanup completed');
  }

  performMaintenanceCleanup() {
    // Remove references to detached elements
    for (const [element, listeners] of this.eventListeners) {
      if (!document.contains(element)) {
        listeners.forEach(({ event, handler, options }) => {
          element.removeEventListener(event, handler, options);
        });
        this.eventListeners.delete(element);
      }
    }
  }
}
```

### **🎨 Popup Optimizations**

#### **1. Fast Popup Loading**
```javascript
// Optimized Popup Loader
class OptimizedPopupLoader {
  constructor() {
    this.loadStartTime = performance.now();
    this.criticalResources = [];
    this.deferredResources = [];
    
    this.setupFastLoading();
  }

  setupFastLoading() {
    // Load critical resources first
    this.loadCriticalResources();
    
    // Defer non-critical resources
    this.deferNonCriticalResources();
    
    // Optimize images
    this.optimizeImages();
  }

  async loadCriticalResources() {
    // Load essential CSS and JS first
    const criticalCSS = this.loadCSS('popup-critical.css');
    const criticalJS = this.loadJS('popup-core.js');
    
    await Promise.all([criticalCSS, criticalJS]);
    
    // Show basic UI immediately
    this.showBasicUI();
  }

  deferNonCriticalResources() {
    // Load after initial render
    requestIdleCallback(() => {
      this.loadCSS('popup-enhanced.css');
      this.loadJS('popup-features.js');
    });
  }

  loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  loadJS(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  optimizeImages() {
    // Use WebP with fallback
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadOptimizedImage(img);
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  loadOptimizedImage(img) {
    const webpSrc = img.dataset.src.replace(/\.(jpg|jpeg|png)$/, '.webp');
    
    // Test WebP support
    const webpTest = new Image();
    webpTest.onload = () => {
      img.src = webpSrc;
    };
    webpTest.onerror = () => {
      img.src = img.dataset.src;
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

  showBasicUI() {
    const loadTime = performance.now() - this.loadStartTime;
    console.log(`Popup basic UI loaded in ${loadTime.toFixed(2)}ms`);
    
    // Show loading state
    document.body.classList.add('loaded');
  }
}
```

#### **2. Efficient Data Loading**
```javascript
// Optimized Data Loader for Popup
class OptimizedDataLoader {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.batchRequests = [];
    this.batchTimeout = null;
  }

  async loadData(key, loader) {
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < 30000) { // 30 seconds
        return cached.data;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const request = this.executeLoader(key, loader);
    this.pendingRequests.set(key, request);

    try {
      const data = await request;
      
      // Cache result
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  async executeLoader(key, loader) {
    try {
      return await loader();
    } catch (error) {
      console.error(`Data loading failed for ${key}:`, error);
      throw error;
    }
  }

  // Batch multiple data requests
  batchLoad(requests) {
    this.batchRequests.push(...requests);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, 10); // 10ms batch window
  }

  async executeBatch() {
    const batch = this.batchRequests.splice(0);
    
    if (batch.length === 0) return;
    
    console.log(`Executing batch of ${batch.length} requests`);
    
    const results = await Promise.allSettled(
      batch.map(({ key, loader }) => this.loadData(key, loader))
    );
    
    return results;
  }

  // Preload data based on user behavior
  preloadData(predictions) {
    predictions.forEach(({ key, loader, probability }) => {
      if (probability > 0.7) {
        // High probability - preload immediately
        this.loadData(key, loader);
      } else if (probability > 0.3) {
        // Medium probability - preload when idle
        requestIdleCallback(() => {
          this.loadData(key, loader);
        });
      }
    });
  }
}
```

---

## 📦 BUNDLE OPTIMIZATION

### **🗜️ Code Splitting e Tree Shaking**

#### **Webpack Configuration for Extensions**
```javascript
// webpack.config.js - Optimized for Extensions
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  
  entry: {
    'background/service-worker': './src/background/service-worker.js',
    'content/content-script': './src/content/content-script.js',
    'popup/popup': './src/popup/popup.js',
    'options/options': './src/options/options.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'shared/vendor',
          chunks: 'all',
          minChunks: 2
        },
        common: {
          name: 'shared/common',
          chunks: 'all',
          minChunks: 2,
          enforce: true
        }
      }
    },
    
    usedExports: true,
    sideEffects: false,
    
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          mangle: {
            safari10: true
          }
        }
      })
    ]
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: '88',
                  firefox: '78'
                },
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      },
      
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          'postcss-loader'
        ]
      },
      
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'assets/images/[name].[hash][ext]'
        }
      }
    ]
  },
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    
    new webpack.optimize.ModuleConcatenationPlugin(),
    
    // Extension-specific optimizations
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  ]
};
```

#### **Dynamic Imports for Lazy Loading**
```javascript
// Lazy Loading Implementation
class LazyModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async loadModule(moduleName) {
    // Return cached module
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Return existing loading promise
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Start loading
    const loadingPromise = this.dynamicImport(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleName, module);
      return module;
    } finally {
      this.loadingPromises.delete(moduleName);
    }
  }

  async dynamicImport(moduleName) {
    const moduleMap = {
      'analytics': () => import('./modules/analytics.js'),
      'settings': () => import('./modules/settings.js'),
      'notifications': () => import('./modules/notifications.js'),
      'sync': () => import('./modules/sync.js')
    };

    const importer = moduleMap[moduleName];
    if (!importer) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    console.log(`Loading module: ${moduleName}`);
    const startTime = performance.now();
    
    const module = await importer();
    
    const loadTime = performance.now() - startTime;
    console.log(`Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`);
    
    return module;
  }

  // Preload modules based on usage patterns
  preloadModules(predictions) {
    predictions.forEach(({ module, probability }) => {
      if (probability > 0.8) {
        // High probability - preload immediately
        this.loadModule(module);
      } else if (probability > 0.5) {
        // Medium probability - preload when idle
        requestIdleCallback(() => {
          this.loadModule(module);
        });
      }
    });
  }
}

// Usage in service worker
const moduleLoader = new LazyModuleLoader();

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { feature } = message;
  
  try {
    const module = await moduleLoader.loadModule(feature);
    const result = await module.handle(message, sender);
    sendResponse(result);
  } catch (error) {
    sendResponse({ error: error.message });
  }
  
  return true;
});
```

---

## 📋 FORMATO DE SAÍDA OBRIGATÓRIO

### **OBJETIVO:** Gerar relatório completo de otimização com implementações práticas

### **ESTRUTURA DE ENTREGA:**

```
📦 PERFORMANCE OPTIMIZATION REPORT
├── 📊 performance-analysis.md       # Análise detalhada de performance
├── 🎯 optimization-targets.md       # Metas e benchmarks
├── ⚡ optimizations/               # Implementações de otimização
│   ���── service-worker/             # Otimizações do service worker
│   ├── content-scripts/            # Otimizações dos content scripts
│   ├── popup/                      # Otimizações do popup
│   ├── storage/                    # Otimizações de storage
│   └── bundle/                     # Otimizações de bundle
├── 📈 benchmarks/                  # Resultados de performance
│   ├── before-optimization.json    # Métricas antes
│   ├── after-optimization.json     # Métricas depois
│   └── comparison-report.md        # Comparação detalhada
├── 🛠️ tools/                      # Ferramentas de profiling
│   ├── profilers/                  # Scripts de profiling
│   ├── monitors/                   # Monitores de performance
│   └── analyzers/                  # Analisadores de código
├── 📋 implementation-guide.md      # Guia de implementação
└── 🔄 monitoring-setup.md          # Setup de monitoramento contínuo
```

### **CADA OTIMIZAÇÃO DEVE CONTER:**

#### **📊 Análise de Performance**
- Métricas atuais vs targets
- Gargalos identificados
- Impacto estimado da otimização
- Prioridade de implementação

#### **⚡ Implementação da Otimização**
- Código otimizado completo
- Configurações necessárias
- Testes de validação
- Rollback plan se necessário

#### **📈 Resultados Mensuráveis**
- Métricas antes/depois
- Percentual de melhoria
- Impacto na experiência do usuário
- Validação cross-browser

#### **🔄 Monitoramento Contínuo**
- Alertas de performance
- Dashboards de métricas
- Regression testing
- Maintenance guidelines

---

## ✅ CHECKLIST DE OTIMIZAÇÃO COMPLETA

### **🎯 Análise Inicial**
- [ ] **Baseline estabelecido** com métricas atuais
- [ ] **Gargalos identificados** em todos os componentes
- [ ] **Targets definidos** para cada métrica
- [ ] **Prioridades estabelecidas** por impacto
- [ ] **Tools de profiling** configurados

### **⚡ Implementação de Otimizações**
- [ ] **Service Worker** otimizado para performance
- [ ] **Content Scripts** com impacto mínimo na página
- [ ] **Popup** com carregamento ultra-rápido
- [ ] **Storage operations** otimizadas
- [ ] **Bundle size** minimizado

### **📊 Validação de Performance**
- [ ] **Benchmarks executados** antes/depois
- [ ] **Core Web Vitals** não impactados
- [ ] **Cross-browser testing** realizado
- [ ] **Memory leaks** eliminados
- [ ] **CPU usage** dentro dos targets

### **🔄 Monitoramento Contínuo**
- [ ] **Performance monitoring** configurado
- [ ] **Alertas automáticos** implementados
- [ ] **Regression testing** automatizado
- [ ] **Dashboard de métricas** criado
- [ ] **Maintenance plan** documentado

### **📚 Documentação**
- [ ] **Otimizações documentadas** com código
- [ ] **Benchmarks registrados** com evidências
- [ ] **Best practices** capturadas
- [ ] **Troubleshooting guide** criado
- [ ] **Team training** realizado

---

## 🎯 RESULTADO ESPERADO

### **📦 Deliverable Final**
Uma **extensão ultra-otimizada** que:

✅ **Startup < 100ms** para service worker  
✅ **Content script injection < 5ms** por script  
✅ **Popup loading < 200ms** completo  
✅ **Zero impacto** nos Core Web Vitals  
✅ **Memory usage < 50MB** total  
✅ **Bundle size < 2MB** otimizado  
✅ **Cross-browser performance** consistente  

### **🚀 Benefícios Mensuráveis**
- **⚡ Performance 40-60% melhor** em todas as métricas
- **🔋 Menor consumo de bateria** em dispositivos móveis
- **📱 Melhor experiência** em dispositivos low-end
- **🌐 Navegação mais fluida** para usuários
- **📊 Métricas de qualidade** superiores
- **🏆 Competitive advantage** no mercado

**A otimização deve resultar em uma extensão que é imperceptível ao usuário em termos de performance, mantendo toda a funcionalidade com eficiência máxima.**