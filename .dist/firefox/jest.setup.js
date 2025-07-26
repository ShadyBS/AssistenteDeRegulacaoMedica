/**
 * Jest Setup - Assistente de Regulação Médica
 * 
 * Configurações e mocks globais para testes
 */

// === BROWSER EXTENSION MOCKS ===

// Mock chrome/browser APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Assistente de Regulação Médica'
    })),
    id: 'test-extension-id'
  },
  
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    session: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn()
  },
  
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn(),
    removeCSS: jest.fn()
  }
};

// Browser API (Firefox)
global.browser = global.chrome;

// GlobalThis polyfill
global.globalThis = global.globalThis || global;
global.globalThis.chrome = global.chrome;
global.globalThis.browser = global.browser;

// === DOM MOCKS ===

// Mock fetch API
global.fetch = jest.fn();

// Mock console methods para testes mais limpos
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// === EXTENSION SPECIFIC MOCKS ===

// Mock BrowserAPI class
global.BrowserAPI = class MockBrowserAPI {
  static getInstance() {
    return new MockBrowserAPI();
  }
  
  async sendMessage(message) {
    return Promise.resolve({ success: true });
  }
  
  async getStorage(key) {
    return Promise.resolve({});
  }
  
  async setStorage(data) {
    return Promise.resolve();
  }
};

// Mock Managers
global.MemoryManager = class MockMemoryManager {
  constructor() {
    this.listeners = [];
    this.timeouts = [];
  }
  
  addEventListener(element, event, handler) {
    this.listeners.push({ element, event, handler });
    if (element && element.addEventListener) {
      element.addEventListener(event, handler);
    }
  }
  
  setTimeout(callback, delay) {
    const id = setTimeout(callback, delay);
    this.timeouts.push(id);
    return id;
  }
  
  cleanup() {
    this.listeners.forEach(({ element, event, handler }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler);
      }
    });
    
    this.timeouts.forEach(id => clearTimeout(id));
    
    this.listeners = [];
    this.timeouts = [];
  }
};

global.SectionManager = class MockSectionManager {
  constructor() {
    this.sections = new Map();
  }
  
  addSection(id, config) {
    this.sections.set(id, config);
  }
  
  getSection(id) {
    return this.sections.get(id);
  }
  
  removeSection(id) {
    return this.sections.delete(id);
  }
};

global.TimelineManager = class MockTimelineManager {
  constructor() {
    this.events = [];
  }
  
  addEvent(event) {
    this.events.push(event);
  }
  
  getEvents() {
    return [...this.events];
  }
  
  clearEvents() {
    this.events = [];
  }
};

global.KeepAliveManager = class MockKeepAliveManager {
  constructor() {
    this.isActive = false;
  }
  
  start() {
    this.isActive = true;
  }
  
  stop() {
    this.isActive = false;
  }
  
  isRunning() {
    return this.isActive;
  }
};

// === UTILITY FUNCTIONS ===

// Helper para criar elementos DOM mock
global.createMockElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  
  // Mock methods comuns
  element.click = jest.fn();
  element.focus = jest.fn();
  element.blur = jest.fn();
  
  return element;
};

// Helper para criar eventos mock
global.createMockEvent = (type, properties = {}) => {
  const event = new Event(type);
  
  Object.keys(properties).forEach(key => {
    Object.defineProperty(event, key, {
      value: properties[key],
      writable: true
    });
  });
  
  return event;
};

// Helper para mock de requisições
global.mockFetch = (response, options = {}) => {
  const mockResponse = {
    ok: options.ok !== false,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(options.headers || {})
  };
  
  global.fetch.mockResolvedValue(mockResponse);
  return mockResponse;
};

// Helper para mock de storage
global.mockStorage = (data = {}) => {
  global.chrome.storage.local.get.mockImplementation((keys) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    }
    
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (data.hasOwnProperty(key)) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    }
    
    return Promise.resolve(data);
  });
  
  global.chrome.storage.local.set.mockImplementation((newData) => {
    Object.assign(data, newData);
    return Promise.resolve();
  });
};

// === CLEANUP ===

// Cleanup após cada teste
afterEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch.mockReset) {
    global.fetch.mockReset();
  }
  
  // Clear DOM
  document.body.innerHTML = '';
  
  // Reset console
  global.console.log.mockClear();
  global.console.warn.mockClear();
  global.console.error.mockClear();
  global.console.info.mockClear();
});

// Setup antes de cada teste
beforeEach(() => {
  // Reset storage mock
  global.mockStorage({});
  
  // Reset fetch mock
  global.fetch = jest.fn();
});

// === CUSTOM MATCHERS ===

// Matcher para verificar se elemento tem classe
expect.extend({
  toHaveClass(received, className) {
    const pass = received.classList && received.classList.contains(className);
    
    if (pass) {
      return {
        message: () => `expected element not to have class "${className}"`,
        pass: true
      };
    } else {
      return {
        message: () => `expected element to have class "${className}"`,
        pass: false
      };
    }
  },
  
  // Matcher para verificar chamadas de storage
  toHaveBeenCalledWithStorage(received, expectedData) {
    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const callData = call[0];
      return JSON.stringify(callData) === JSON.stringify(expectedData);
    });
    
    if (pass) {
      return {
        message: () => `expected storage not to have been called with ${JSON.stringify(expectedData)}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected storage to have been called with ${JSON.stringify(expectedData)}`,
        pass: false
      };
    }
  }
});

// === GLOBAL TEST UTILITIES ===

// Utilitário para aguardar próximo tick
global.nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Utilitário para aguardar elemento aparecer
global.waitForElement = async (selector, timeout = 1000) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error(`Element "${selector}" not found within ${timeout}ms`);
};

// Utilitário para simular delay
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));