import { describe, it, expect, beforeEach, vi } from 'vitest';
import RuntimeManager from '../../src/runtimes/RuntimeManager.js';

describe('RuntimeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new RuntimeManager();
  });

  describe('constructor', () => {
    it('should create runtime manager instance', () => {
      expect(manager.runtimes).toBeInstanceOf(Map);
      expect(manager.currentRuntime).toBe(null);
      expect(manager.currentLanguage).toBe('javascript');
    });

    it('should have language registry', () => {
      expect(manager.registry).toBeDefined();
      expect(manager.registry.javascript).toBeDefined();
      expect(manager.registry.typescript).toBeDefined();
      expect(manager.registry.python).toBeDefined();
    });
  });

  describe('init()', () => {
    it('should initialize with JavaScript runtime', async () => {
      await manager.init();

      expect(manager.currentRuntime).toBeTruthy();
      expect(manager.currentLanguage).toBe('javascript');
      expect(manager.runtimes.has('javascript')).toBe(true);
    });
  });

  describe('loadRuntime()', () => {
    it('should load JavaScript runtime', async () => {
      const runtime = await manager.loadRuntime('javascript');

      expect(runtime).toBeTruthy();
      expect(runtime.name).toBe('javascript');
      expect(runtime.isLoaded()).toBe(true);
    });

    it('should return cached runtime if already loaded', async () => {
      const runtime1 = await manager.loadRuntime('javascript');
      const runtime2 = await manager.loadRuntime('javascript');

      expect(runtime1).toBe(runtime2);
    });

    it('should throw error for unsupported language', async () => {
      await expect(manager.loadRuntime('unsupported')).rejects.toThrow(
        'Unsupported language: unsupported'
      );
    });

    it('should set up output callbacks', async () => {
      const outputCallback = vi.fn();
      const errorCallback = vi.fn();

      manager.onOutput(outputCallback);
      manager.onError(errorCallback);

      const runtime = await manager.loadRuntime('javascript');

      // Execute code to trigger callbacks
      await runtime.execute('console.log("test")');

      expect(outputCallback).toHaveBeenCalled();
    });
  });

  describe('switchLanguage()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should switch to different language', async () => {
      await manager.switchLanguage('typescript');

      expect(manager.currentLanguage).toBe('typescript');
      expect(manager.currentRuntime).toBeTruthy();
    });

    it('should not reload if switching to same language', async () => {
      const runtime1 = manager.currentRuntime;
      await manager.switchLanguage('javascript');
      const runtime2 = manager.currentRuntime;

      expect(runtime1).toBe(runtime2);
    });

    it('should load new runtime when switching', async () => {
      expect(manager.runtimes.has('typescript')).toBe(false);

      await manager.switchLanguage('typescript');

      expect(manager.runtimes.has('typescript')).toBe(true);
    });
  });

  describe('executeCode()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should execute code in current runtime', async () => {
      const result = await manager.executeCode('1 + 1');

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(2);
    });

    it('should throw error if no runtime loaded', async () => {
      manager.currentRuntime = null;

      await expect(manager.executeCode('test')).rejects.toThrow(
        'No runtime loaded'
      );
    });
  });

  describe('getAvailableLanguages()', () => {
    it('should return list of available languages', () => {
      const languages = manager.getAvailableLanguages();

      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0]).toHaveProperty('id');
      expect(languages[0]).toHaveProperty('name');
      expect(languages[0]).toHaveProperty('tier');
    });

    it('should include JavaScript, TypeScript, Python', () => {
      const languages = manager.getAvailableLanguages();
      const ids = languages.map((l) => l.id);

      expect(ids).toContain('javascript');
      expect(ids).toContain('typescript');
      expect(ids).toContain('python');
    });
  });

  describe('isLanguageAvailable()', () => {
    it('should return true for available languages', () => {
      expect(manager.isLanguageAvailable('javascript')).toBe(true);
      expect(manager.isLanguageAvailable('python')).toBe(true);
    });

    it('should return false for unavailable languages', () => {
      expect(manager.isLanguageAvailable('unsupported')).toBe(false);
      expect(manager.isLanguageAvailable('java')).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should register output callback', () => {
      const callback = vi.fn();
      manager.onOutput(callback);

      expect(manager.outputCallback).toBe(callback);
    });

    it('should register error callback', () => {
      const callback = vi.fn();
      manager.onError(callback);

      expect(manager.errorCallback).toBe(callback);
    });
  });

  describe('dispose()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should dispose all runtimes', async () => {
      await manager.dispose();

      expect(manager.runtimes.size).toBe(0);
      expect(manager.currentRuntime).toBe(null);
    });
  });

  describe('getCurrentRuntime()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should return current runtime', () => {
      const runtime = manager.getCurrentRuntime();
      expect(runtime).toBeTruthy();
      expect(runtime.name).toBe('javascript');
    });
  });

  describe('getCurrentLanguage()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should return current language', () => {
      expect(manager.getCurrentLanguage()).toBe('javascript');
    });

    it('should update after language switch', async () => {
      await manager.switchLanguage('typescript');
      expect(manager.getCurrentLanguage()).toBe('typescript');
    });
  });
});
