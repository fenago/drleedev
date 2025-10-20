import { describe, it, expect, beforeEach, vi } from 'vitest';
import BaseRuntime from '../../src/runtimes/BaseRuntime.js';

// Create a concrete implementation for testing
class TestRuntime extends BaseRuntime {
  constructor() {
    super('test', { version: '1.0' });
  }

  async load() {
    this.loaded = true;
    this.log('Test runtime loaded', 'info');
  }

  async execute(code, options = {}) {
    return {
      success: true,
      output: `Executed: ${code}`,
      returnValue: code.length,
      error: null,
      executionTime: 10,
    };
  }
}

describe('BaseRuntime', () => {
  let runtime;

  beforeEach(() => {
    runtime = new TestRuntime();
  });

  describe('constructor', () => {
    it('should create a runtime instance', () => {
      expect(runtime.name).toBe('test');
      expect(runtime.config.version).toBe('1.0');
      expect(runtime.loaded).toBe(false);
      expect(runtime.loading).toBe(false);
    });

    it('should not allow direct instantiation of BaseRuntime', () => {
      expect(() => new BaseRuntime('test')).toThrow();
    });
  });

  describe('load()', () => {
    it('should load the runtime', async () => {
      await runtime.load();
      expect(runtime.loaded).toBe(true);
    });

    it('should call log during load', async () => {
      const logSpy = vi.spyOn(runtime, 'log');
      await runtime.load();
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('execute()', () => {
    it('should execute code and return result', async () => {
      const result = await runtime.execute('test code');

      expect(result.success).toBe(true);
      expect(result.output).toBe('Executed: test code');
      expect(result.returnValue).toBe(9);
      expect(result.error).toBe(null);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    it('should register output callback', () => {
      const callback = vi.fn();
      runtime.onOutput(callback);
      expect(runtime.outputCallbacks).toContain(callback);
    });

    it('should register error callback', () => {
      const callback = vi.fn();
      runtime.onError(callback);
      expect(runtime.errorCallbacks).toContain(callback);
    });

    it('should call output callbacks when logging', () => {
      const callback = vi.fn();
      runtime.onOutput(callback);
      runtime.log('test output', 'stdout');
      expect(callback).toHaveBeenCalledWith('test output', 'stdout');
    });

    it('should call error callbacks when logging errors', () => {
      const callback = vi.fn();
      runtime.onError(callback);
      runtime.logError('test error');
      expect(callback).toHaveBeenCalledWith('test error', 'stderr');
    });
  });

  describe('state methods', () => {
    it('should return loaded state', () => {
      expect(runtime.isLoaded()).toBe(false);
      runtime.loaded = true;
      expect(runtime.isLoaded()).toBe(true);
    });

    it('should return loading state', () => {
      expect(runtime.isLoading()).toBe(false);
      runtime.loading = true;
      expect(runtime.isLoading()).toBe(true);
    });

    it('should return runtime name', () => {
      expect(runtime.getName()).toBe('test');
    });

    it('should return version', () => {
      expect(runtime.getVersion()).toBe('1.0');
    });
  });

  describe('dispose()', () => {
    it('should clean up runtime resources', async () => {
      runtime.loaded = true;
      runtime.onOutput(() => {});
      runtime.onError(() => {});

      await runtime.dispose();

      expect(runtime.runtime).toBe(null);
      expect(runtime.loaded).toBe(false);
      expect(runtime.outputCallbacks).toHaveLength(0);
      expect(runtime.errorCallbacks).toHaveLength(0);
    });
  });
});
