/**
 * @jest-environment node
 */
/**
 * Unit Tests for KeepAliveManager
 * Tests the hybrid alarms/setInterval implementation for service worker compatibility
 */

import { jest } from '@jest/globals';

let mockBrowser;
let originalDocument;
let originalWindow;

beforeEach(() => {
  mockBrowser = {
    alarms: {
      create: jest.fn(),
      clear: jest.fn(),
      onAlarm: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
    storage: {
      local: {
        set: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({}),
      },
      sync: {
        get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 1 }),
      },
      onChanged: {
        addListener: jest.fn(),
      },
    },
  };
  global.chrome = mockBrowser;
  global.browser = mockBrowser;
  // Simula ambiente service worker removendo document/window
  originalDocument = global.document;
  originalWindow = global.window;
  delete global.document;
  delete global.window;
  Object.defineProperty(global, 'importScripts', {
    value: undefined,
    writable: true,
  });
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterEach(() => {
  // Restaura document/window
  if (originalDocument) global.document = originalDocument;
  if (originalWindow) global.window = originalWindow;
  jest.clearAllMocks();
});

describe('KeepAliveManager', () => {
  function setupServiceWorkerEnv() {
    global.mockBrowser = {
      alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        onAlarm: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          set: jest.fn().mockResolvedValue({}),
          get: jest.fn().mockResolvedValue({}),
        },
        sync: {
          get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 1 }),
        },
        onChanged: {
          addListener: jest.fn(),
        },
      },
    };
    global.chrome = global.mockBrowser;
    global.browser = global.mockBrowser;
    delete global.document;
    delete global.window;
    Object.defineProperty(global, 'importScripts', {
      value: undefined,
      writable: true,
    });
    global.console = {
      ...console,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }

  function setupBackgroundEnv() {
    global.mockBrowser = {
      alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        onAlarm: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          set: jest.fn().mockResolvedValue({}),
          get: jest.fn().mockResolvedValue({}),
        },
        sync: {
          get: jest.fn().mockResolvedValue({ keepSessionAliveInterval: 1 }),
        },
        onChanged: {
          addListener: jest.fn(),
        },
      },
    };
    global.chrome = global.mockBrowser;
    global.browser = global.mockBrowser;
    global.document = {};
    global.window = {};
    global.importScripts = jest.fn();
    global.console = {
      ...console,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }

  describe('Service Worker Detection', () => {
    test('should detect service worker environment when importScripts is undefined', () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(true);
    });

    test('should detect background script environment when importScripts exists', () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.detectServiceWorkerEnvironment()).toBe(false);
    });
  });

  describe('Alarms API Implementation', () => {
    test('should create alarm when starting in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.mockBrowser.alarms.create).toHaveBeenCalledWith(
        'keepalive-session',
        expect.objectContaining({ periodInMinutes: expect.any(Number) })
      );
    });

    test('should setup alarm listener when starting in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.mockBrowser.alarms.onAlarm.addListener).toHaveBeenCalled();
    });

    test('should clear existing alarm before creating new one', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.mockBrowser.alarms.clear).toHaveBeenCalledWith('keepalive-session');
      expect(global.mockBrowser.alarms.create).toHaveBeenCalled();
    });

    test('should handle alarm events correctly', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      const alarmListener = global.mockBrowser.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      if (alarmListener) {
        await alarmListener({ name: 'keepalive-session' });
        expect(global.fetch).toHaveBeenCalled();
      }
    });

    test('should ignore non-keepAlive alarms', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      const alarmListener = global.mockBrowser.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      global.fetch = jest.fn();
      if (alarmListener) {
        await alarmListener({ name: 'otherAlarm' });
        expect(global.fetch).not.toHaveBeenCalled();
      }
    });
  });

  describe('SetInterval Implementation', () => {
    test('should use setInterval in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(kam.intervalId).toBeDefined();
      expect(kam.intervalId).not.toBeNull();
    });

    test('should not create alarm in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.mockBrowser.alarms.create).not.toHaveBeenCalled();
    });

    test('should execute ping via setInterval', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      await kam.start();
      jest.advanceTimersByTime(60000);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Stop Functionality', () => {
    test('should clear alarm when stopping in service worker environment', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      kam.stop();
      expect(global.mockBrowser.alarms.clear).toHaveBeenCalledWith('keepalive-session');
    });

    test('should clear interval when stopping in background script environment', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(kam.intervalId).toBeDefined();
      kam.stop();
      expect(kam.intervalId).toBeNull();
    });

    test('should remove alarm listener when stopping', () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      kam.stop();
      expect(global.mockBrowser.alarms.onAlarm.removeListener).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully in alarm context', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await kam.start();
      const alarmListener = global.mockBrowser.alarms.onAlarm.addListener.mock.calls[0]?.[0];
      if (alarmListener) {
        await expect(alarmListener({ name: 'keepalive-session' })).resolves.toBeUndefined();
      }
    });

    test('should handle fetch errors gracefully in setInterval context', async () => {
      setupBackgroundEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await kam.start();
      // Fast-forward timer - should not throw
      expect(() => jest.advanceTimersByTime(60000)).not.toThrow();
    });

    test('should handle missing alarms API gracefully', async () => {
      setupServiceWorkerEnv();
      global.mockBrowser.alarms = undefined;
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(() => kam.start()).not.toThrow();
    });
  });

  describe('State Management', () => {
    test('should track running state correctly', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      expect(kam.isActive).toBe(false);
      await kam.start();
      expect(kam.isActive).toBe(true);
      kam.stop();
      expect(kam.isActive).toBe(false);
    });

    test('should prevent multiple starts', async () => {
      setupServiceWorkerEnv();
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      await kam.start();
      expect(global.mockBrowser.alarms.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with chrome API', async () => {
      setupServiceWorkerEnv();
      delete global.browser;
      jest.resetModules();
      const { KeepAliveManager } = require('../../KeepAliveManager.js');
      const kam = new KeepAliveManager();
      await kam.start();
      expect(global.mockBrowser.alarms.clear).toHaveBeenCalled();
    });

    test('should work with browser API', async () => {
      setupServiceWorkerEnv();
      delete global.chrome;
      global.browser = global.mockBrowser;
      jest.resetModules();
      const { KeepAliveManager: FreshManager } = require('../../KeepAliveManager.js');
      const freshManager = new FreshManager();
      await freshManager.start();
      expect(global.mockBrowser.alarms.clear).toHaveBeenCalled();
    });
  });
});
