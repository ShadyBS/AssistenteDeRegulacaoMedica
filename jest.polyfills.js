/**
 * Jest Polyfills - Assistente de Regulação Médica
 *
 * Polyfills necessários para testes de extensões de navegador
 */

// === BROWSER APIS POLYFILLS ===

// TextEncoder/TextDecoder polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// URL polyfill
if (typeof URL === 'undefined') {
  global.URL = require('url').URL;
}

// URLSearchParams polyfill
if (typeof URLSearchParams === 'undefined') {
  global.URLSearchParams = require('url').URLSearchParams;
}

// === WEB APIS POLYFILLS ===

// MutationObserver polyfill
if (typeof MutationObserver === 'undefined') {
  global.MutationObserver = class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }

    observe(target, options) {
      this.observations.push({ target, options });
    }

    disconnect() {
      this.observations = [];
    }

    takeRecords() {
      return [];
    }
  };
}

// IntersectionObserver polyfill
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observations = [];
    }

    observe(target) {
      this.observations.push(target);
    }

    unobserve(target) {
      const index = this.observations.indexOf(target);
      if (index > -1) {
        this.observations.splice(index, 1);
      }
    }

    disconnect() {
      this.observations = [];
    }
  };
}

// ResizeObserver polyfill
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }

    observe(target) {
      this.observations.push(target);
    }

    unobserve(target) {
      const index = this.observations.indexOf(target);
      if (index > -1) {
        this.observations.splice(index, 1);
      }
    }

    disconnect() {
      this.observations = [];
    }
  };
}

// === STORAGE APIS ===

// localStorage polyfill
if (typeof localStorage === 'undefined') {
  const localStorageMock = {
    store: {},

    getItem(key) {
      return this.store[key] || null;
    },

    setItem(key, value) {
      this.store[key] = String(value);
    },

    removeItem(key) {
      delete this.store[key];
    },

    clear() {
      this.store = {};
    },

    get length() {
      return Object.keys(this.store).length;
    },

    key(index) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  };

  global.localStorage = localStorageMock;
}

// sessionStorage polyfill
if (typeof sessionStorage === 'undefined') {
  const sessionStorageMock = {
    store: {},

    getItem(key) {
      return this.store[key] || null;
    },

    setItem(key, value) {
      this.store[key] = String(value);
    },

    removeItem(key) {
      delete this.store[key];
    },

    clear() {
      this.store = {};
    },

    get length() {
      return Object.keys(this.store).length;
    },

    key(index) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  };

  global.sessionStorage = sessionStorageMock;
}

// === CRYPTO API ===

// crypto.randomUUID polyfill
if (typeof crypto === 'undefined') {
  global.crypto = {};
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

// crypto.getRandomValues polyfill
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// === PERFORMANCE API ===

// performance.now polyfill
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// === REQUEST ANIMATION FRAME ===

// requestAnimationFrame polyfill
if (typeof requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // ~60fps
  };
}

if (typeof cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// === CUSTOM EVENTS ===

// CustomEvent polyfill
if (typeof CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
}

// === FORM DATA ===

// FormData polyfill básico
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }

    append(name, value) {
      if (this.data.has(name)) {
        const existing = this.data.get(name);
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          this.data.set(name, [existing, value]);
        }
      } else {
        this.data.set(name, value);
      }
    }

    delete(name) {
      this.data.delete(name);
    }

    get(name) {
      const value = this.data.get(name);
      return Array.isArray(value) ? value[0] : value;
    }

    getAll(name) {
      const value = this.data.get(name);
      return Array.isArray(value) ? value : [value];
    }

    has(name) {
      return this.data.has(name);
    }

    set(name, value) {
      this.data.set(name, value);
    }

    entries() {
      return this.data.entries();
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return this.data.values();
    }
  };
}

// === BLOB AND FILE ===

// Blob polyfill básico
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.size = parts.reduce((size, part) => {
        return size + (typeof part === 'string' ? part.length : part.byteLength || 0);
      }, 0);
    }

    slice(start = 0, end = this.size, contentType = '') {
      return new Blob(this.parts.slice(start, end), { type: contentType });
    }

    text() {
      return Promise.resolve(this.parts.join(''));
    }

    arrayBuffer() {
      const text = this.parts.join('');
      const buffer = new ArrayBuffer(text.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < text.length; i++) {
        view[i] = text.charCodeAt(i);
      }
      return Promise.resolve(buffer);
    }
  };
}

// File polyfill básico
if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// === HEADERS ===

// Headers polyfill básico
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map();

      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => {
            this.append(key, value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.append(key, value);
          });
        } else {
          Object.keys(init).forEach(key => {
            this.append(key, init[key]);
          });
        }
      }
    }

    append(name, value) {
      const key = name.toLowerCase();
      const existing = this.map.get(key);
      this.map.set(key, existing ? `${existing}, ${value}` : value);
    }

    delete(name) {
      this.map.delete(name.toLowerCase());
    }

    get(name) {
      return this.map.get(name.toLowerCase()) || null;
    }

    has(name) {
      return this.map.has(name.toLowerCase());
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }

    forEach(callback, thisArg) {
      this.map.forEach((value, key) => {
        callback.call(thisArg, value, key, this);
      });
    }

    entries() {
      return this.map.entries();
    }

    keys() {
      return this.map.keys();
    }

    values() {
      return this.map.values();
    }
  };
}

// === CONSOLE POLYFILLS ===

// Garante que todos os métodos de console existem
if (typeof console !== 'undefined') {
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'group', 'groupEnd', 'time', 'timeEnd'];

  consoleMethods.forEach(method => {
    if (typeof console[method] !== 'function') {
      console[method] = () => {};
    }
  });
}
