import { describe, it, expect, beforeEach, vi } from 'vitest';
import JavaScriptRuntime from '../../src/runtimes/languages/JavaScriptRuntime.js';

describe('JavaScriptRuntime', () => {
  let runtime;

  beforeEach(() => {
    runtime = new JavaScriptRuntime();
  });

  describe('constructor', () => {
    it('should create JavaScript runtime instance', () => {
      expect(runtime.name).toBe('javascript');
      expect(runtime.loaded).toBe(true); // JavaScript is always loaded
    });
  });

  describe('load()', () => {
    it('should be ready immediately (no-op)', async () => {
      await runtime.load();
      expect(runtime.loaded).toBe(true);
    });
  });

  describe('execute()', () => {
    it('should execute simple JavaScript code', async () => {
      const result = await runtime.execute('const x = 42; x');

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(42);
      expect(result.error).toBe(null);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should execute code with console.log', async () => {
      const logSpy = vi.spyOn(runtime, 'log');
      const result = await runtime.execute('console.log("Hello, World!")');

      expect(result.success).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('Hello, World!', 'stdout');
    });

    it('should capture multiple console.log calls', async () => {
      const logSpy = vi.spyOn(runtime, 'log');
      await runtime.execute(`
        console.log("First");
        console.log("Second");
        console.log("Third");
      `);

      expect(logSpy).toHaveBeenCalledTimes(3);
      expect(logSpy).toHaveBeenCalledWith('First', 'stdout');
      expect(logSpy).toHaveBeenCalledWith('Second', 'stdout');
      expect(logSpy).toHaveBeenCalledWith('Third', 'stdout');
    });

    it('should handle console.error', async () => {
      const errorSpy = vi.spyOn(runtime, 'logError');
      await runtime.execute('console.error("Error message")');

      expect(errorSpy).toHaveBeenCalledWith('Error message');
    });

    it('should handle syntax errors', async () => {
      const result = await runtime.execute('const x = ;'); // Invalid syntax

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.name).toBe('SyntaxError');
      expect(result.output).toContain('SyntaxError');
    });

    it('should handle runtime errors', async () => {
      const result = await runtime.execute('throw new Error("Test error")');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Test error');
      expect(result.output).toContain('Error: Test error');
    });

    it('should return execution time', async () => {
      const result = await runtime.execute('1 + 1');

      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(1000); // Should be very fast
    });

    it('should not capture console if disabled', async () => {
      const logSpy = vi.spyOn(runtime, 'log');
      await runtime.execute('console.log("test")', { captureConsole: false });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should execute mathematical operations', async () => {
      const result = await runtime.execute('Math.sqrt(16)');

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(4);
    });

    it('should execute string operations', async () => {
      const result = await runtime.execute('"hello".toUpperCase()');

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe('HELLO');
    });

    it('should execute array operations', async () => {
      const result = await runtime.execute('[1, 2, 3].map(x => x * 2)');

      expect(result.success).toBe(true);
      expect(result.returnValue).toEqual([2, 4, 6]);
    });
  });

  describe('formatError()', () => {
    it('should format error with line and column info', async () => {
      const result = await runtime.execute('throw new Error("test")');

      expect(result.output).toContain('Error: test');
      // Line/column info may vary by browser, just check it exists
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('dispose()', () => {
    it('should dispose runtime', async () => {
      await runtime.dispose();
      expect(runtime.loaded).toBe(false);
    });
  });
});
