/**
 * LuaRuntime Unit Tests
 *
 * Tests for Lua runtime implementation using Wasmoon
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import LuaRuntime from '../../src/runtimes/languages/LuaRuntime.js';

// Mock global objects
global.performance = {
  now: () => Date.now(),
};

describe('LuaRuntime', () => {
  let runtime;

  beforeEach(() => {
    runtime = new LuaRuntime();
  });

  afterEach(async () => {
    if (runtime) {
      await runtime.dispose();
    }
  });

  describe('Constructor', () => {
    it('should create a LuaRuntime instance', () => {
      expect(runtime).toBeInstanceOf(LuaRuntime);
      expect(runtime.name).toBe('lua');
    });

    it('should have correct default configuration', () => {
      expect(runtime.config.version).toBe('5.4');
      expect(runtime.config.indexURL).toContain('wasmoon');
    });

    it('should start as not loaded', () => {
      expect(runtime.loaded).toBe(false);
      expect(runtime.loading).toBe(false);
    });
  });

  describe('Output Handling', () => {
    it('should register output callbacks', () => {
      const callback = vi.fn();
      runtime.onOutput(callback);
      runtime.log('test message', 'stdout');

      expect(callback).toHaveBeenCalledWith('test message', 'stdout');
    });

    it('should register error callbacks', () => {
      const callback = vi.fn();
      runtime.onError(callback);
      runtime.logError('error message');

      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toContain('error message');
    });

    it('should support multiple output callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      runtime.onOutput(callback1);
      runtime.onOutput(callback2);
      runtime.log('test', 'stdout');

      expect(callback1).toHaveBeenCalledWith('test', 'stdout');
      expect(callback2).toHaveBeenCalledWith('test', 'stdout');
    });
  });

  describe('Error Formatting', () => {
    it('should format Lua errors correctly', () => {
      const error = new Error('[string "test"]:5: attempt to call a nil value');
      const formatted = runtime.formatLuaError(error);

      expect(formatted).toContain('Lua Error:');
      expect(formatted).toContain('Line 5');
    });

    it('should handle errors without line numbers', () => {
      const error = new Error('syntax error near \'end\'');
      const formatted = runtime.formatLuaError(error);

      expect(formatted).toContain('Lua Error:');
      expect(formatted).toContain('syntax error');
    });

    it('should handle plain string errors', () => {
      const error = 'simple error message';
      const formatted = runtime.formatLuaError(error);

      expect(formatted).toContain('Lua Error:');
    });
  });

  describe('Library Information', () => {
    it('should return correct library info', () => {
      const info = runtime.getLibraryInfo();

      expect(info.name).toBe('Wasmoon');
      expect(info.luaVersion).toBe('5.4');
      expect(info.size).toBe('~200KB');
      expect(info.libraries).toContain('base');
      expect(info.libraries).toContain('math');
      expect(info.libraries).toContain('string');
      expect(info.limitations).toBeInstanceOf(Array);
    });

    it('should list all standard Lua libraries', () => {
      const info = runtime.getLibraryInfo();
      const expectedLibraries = [
        'base',
        'coroutine',
        'table',
        'io',
        'os',
        'string',
        'math',
        'utf8',
        'debug',
      ];

      expectedLibraries.forEach(lib => {
        expect(info.libraries).toContain(lib);
      });
    });
  });

  describe('Clear Output', () => {
    it('should clear output buffer', () => {
      runtime.clearOutput();
      expect(runtime.outputBuffer).toEqual([]);
    });
  });

  describe('Dispose', () => {
    it('should mark runtime as not loaded after dispose', async () => {
      runtime.loaded = true;
      await runtime.dispose();

      expect(runtime.loaded).toBe(false);
      expect(runtime.engine).toBeNull();
      expect(runtime.factory).toBeNull();
    });

    it('should be safe to call dispose multiple times', async () => {
      await runtime.dispose();
      await runtime.dispose(); // Should not throw
      expect(runtime.loaded).toBe(false);
    });
  });

  describe('isLoaded', () => {
    it('should return false when not loaded', () => {
      expect(runtime.isLoaded()).toBe(false);
    });

    it('should return true when loaded', () => {
      runtime.loaded = true;
      expect(runtime.isLoaded()).toBe(true);
    });
  });

  // Integration tests would require actual Wasmoon library
  // These are skipped in unit tests but would run in E2E tests
  describe.skip('Execute (Integration)', () => {
    beforeEach(async () => {
      // This would require loading actual Wasmoon in a browser environment
      await runtime.load();
    });

    it('should execute simple Lua code', async () => {
      const code = 'return 1 + 1';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(2);
    });

    it('should capture print output', async () => {
      const callback = vi.fn();
      runtime.onOutput(callback);

      const code = 'print("Hello, Lua!")';
      await runtime.execute(code);

      expect(callback).toHaveBeenCalledWith('Hello, Lua!', 'stdout');
    });

    it('should handle Lua errors', async () => {
      const code = 'error("This is an error")';
      const result = await runtime.execute(code);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should execute Lua math operations', async () => {
      const code = 'return math.sqrt(16)';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(4);
    });

    it('should execute Lua string operations', async () => {
      const code = 'return string.upper("hello")';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe('HELLO');
    });

    it('should handle multi-line Lua code', async () => {
      const code = `
        local x = 10
        local y = 20
        return x + y
      `;
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(30);
    });

    it('should measure execution time', async () => {
      const code = 'return 1 + 1';
      const result = await runtime.execute(code);

      expect(result.executionTime).toBeGreaterThan(0);
    });
  });
});
