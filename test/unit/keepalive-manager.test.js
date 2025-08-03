/**
 * Unit Tests for KeepAliveManager
 * Tests the hybrid alarms/setInterval implementation for service worker compatibility
 */

import { jest } from '@jest/globals';

// Mock browser APIs
const mockBrowser = {
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
  },
};

// Mock chrome for compatibility
global.chrome = mockBrowser;
global.browser = mockBrowser;

// Mock service worker detection
Object.defineProperty(global, 'importScripts', {
  value: undefined,
  writable: true,
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('KeepAliveManager', () => {
  let KeepAliveManager;
  let keepAliveManager;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset service worker detection
    delete global.importScripts;

    // Mock timers
    jest.useFakeTimers();

    // Dynamic import to ensure fresh instance
    const module = await import('../../KeepAliveManager.js');
    KeepAliveManager = module.KeepAliveManager;
    keepAliveManager = new KeepAliveManager();
  });

  afterEach(() => {
    jest.useRealTimers();
    keepAliveManager?.stop();
  });

  describe('Service Worker Detection', () => {
    test('should detect service worker environment when importScripts is undefined', () => {
      delete global.importScripts;
      expect(keepAliveManager.detectServiceWorkerEnvironment()).toBe(true);
    });

    test('should detect background script environment when importScripts exists', () => {
      global.importScripts = jest.fn();
      expect(keepAliveManager.detectServiceWorkerEnvironment()).toBe(false);
    });
  });

  describe('Alarms API Implementation', () => {
    beforeEach(() => {
      // Mock service worker environment
      delete global.importScripts;
    });

    test('should create alarm when starting in service worker environment', async () => {
      await keepAliveManager.start();

      expect(mockBrowser.alarms.create).toHaveBeenCalledWith('keepAlive', { periodInMinutes: 1 });
    });

    test('should setup alarm listener when starting in service worker environment', async () => {
      await keepAliveManager.start();

      expect(mockBrowser.alarms.onAlarm.addListener).toHaveBeenCalled();
    });

    test('should clear existing alarm before creating new one', async () => {
      await keepAliveManager.start();

      expect(mockBrowser.alarms.clear).toHaveBeenCalledWith('keepAlive');
      expect(mockBrowser.alarms.create).toHaveBeenCalledAfter(mockBrowser.alarms.clear);
    });

    test('should handle alarm events correctly', async () => {
      await keepAliveManager.start();

      const alarmListener = mockBrowser.alarms.onAlarm.addListener.mock.calls[0][0];

      // Mock successful ping response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      await alarmListener({ name: 'keepAlive' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/sigss/keep-alive',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    test('should ignore non-keepAlive alarms', async () => {
      await keepAliveManager.start();

      const alarmListener = mockBrowser.alarms.onAlarm.addListener.mock.calls[0][0];

      global.fetch = jest.fn();

      await alarmListener({ name: 'otherAlarm' });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('SetInterval Implementation', () => {
    beforeEach(() => {
      // Mock background script environment
      global.importScripts = jest.fn();
    });

    test('should use setInterval in background script environment', async () => {
      await keepAliveManager.start();

      expect(keepAliveManager.intervalId).toBeDefined();
      expect(keepAliveManager.intervalId).not.toBeNull();
    });

    test('should not create alarm in background script environment', async () => {
      await keepAliveManager.start();

      expect(mockBrowser.alarms.create).not.toHaveBeenCalled();
    });

    test('should execute ping via setInterval', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      await keepAliveManager.start();

      // Fast-forward timer
      jest.advanceTimersByTime(60000);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/sigss/keep-alive',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  describe('Stop Functionality', () => {
    test('should clear alarm when stopping in service worker environment', async () => {
      delete global.importScripts;

      await keepAliveManager.start();
      keepAliveManager.stop();

      expect(mockBrowser.alarms.clear).toHaveBeenCalledWith('keepAlive');
    });

    test('should clear interval when stopping in background script environment', async () => {
      global.importScripts = jest.fn();

      await keepAliveManager.start();
      expect(keepAliveManager.intervalId).toBeDefined();

      keepAliveManager.stop();

      expect(keepAliveManager.intervalId).toBeNull();
    });

    test('should remove alarm listener when stopping', () => {
      keepAliveManager.stop();

      expect(mockBrowser.alarms.onAlarm.removeListener).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully in alarm context', async () => {
      delete global.importScripts;

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await keepAliveManager.start();

      const alarmListener = mockBrowser.alarms.onAlarm.addListener.mock.calls[0][0];

      // Should not throw
      await expect(alarmListener({ name: 'keepAlive' })).resolves.toBeUndefined();
    });

    test('should handle fetch errors gracefully in setInterval context', async () => {
      global.importScripts = jest.fn();

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await keepAliveManager.start();

      // Fast-forward timer - should not throw
      expect(() => jest.advanceTimersByTime(60000)).not.toThrow();
    });

    test('should handle missing alarms API gracefully', async () => {
      delete global.importScripts;
      delete mockBrowser.alarms;

      // Should not throw when alarms API is unavailable
      await expect(keepAliveManager.start()).resolves.toBeUndefined();
    });
  });

  describe('State Management', () => {
    test('should track running state correctly', async () => {
      expect(keepAliveManager.isRunning).toBe(false);

      await keepAliveManager.start();
      expect(keepAliveManager.isRunning).toBe(true);

      keepAliveManager.stop();
      expect(keepAliveManager.isRunning).toBe(false);
    });

    test('should prevent multiple starts', async () => {
      await keepAliveManager.start();
      await keepAliveManager.start();

      // Should only create one alarm/interval
      if (keepAliveManager.detectServiceWorkerEnvironment()) {
        expect(mockBrowser.alarms.create).toHaveBeenCalledTimes(1);
      } else {
        expect(keepAliveManager.intervalId).toBeDefined();
      }
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with chrome API', async () => {
      delete global.browser;

      await keepAliveManager.start();

      expect(mockBrowser.alarms.clear).toHaveBeenCalled();
    });

    test('should work with browser API', async () => {
      delete global.chrome;
      global.browser = mockBrowser;

      // Re-import to get fresh instance with new global state
      const module = await import('../../KeepAliveManager.js');
      const freshManager = new module.KeepAliveManager();

      await freshManager.start();

      expect(mockBrowser.alarms.clear).toHaveBeenCalled();
    });
  });
});
