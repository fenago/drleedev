/**
 * LuaRuntime.js
 *
 * Lua runtime implementation using Wasmoon (Lua 5.4 compiled to WASM)
 *
 * Features:
 * - Lua 5.4 standard library
 * - Lightweight (200KB WASM)
 * - Fast execution
 * - Standard input/output capture
 *
 * WASM Library: Wasmoon
 * Size: ~200KB
 * Documentation: https://github.com/ceifa/wasmoon
 */

import BaseRuntime from '../BaseRuntime.js';

export default class LuaRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('lua', {
      version: '5.4',
      cdnURL: 'https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/index.js',
      ...config,
    });

    this.engine = null;
    this.factory = null;
  }

  /**
   * Load Wasmoon library and initialize Lua engine
   */
  async load() {
    if (this.loaded) {
      return;
    }

    this.loading = true;
    this.log('Loading Lua runtime (Wasmoon)...', 'info');

    try {
      // Load Wasmoon script from CDN
      await this.loadWasmoonScript();

      // Create Lua factory and engine
      this.factory = new window.LuaFactory();
      this.engine = await this.factory.createEngine();

      // Set up Lua print function to capture output
      await this.setupLuaPrint();

      this.loaded = true;
      this.loading = false;
      this.log('✓ Lua runtime loaded successfully!', 'success');
    } catch (error) {
      this.loading = false;
      const errorMsg = `Failed to load Lua runtime: ${error.message}`;
      this.logError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Load Wasmoon library from CDN
   */
  async loadWasmoonScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.LuaFactory) {
        console.log('Wasmoon already loaded');
        resolve();
        return;
      }

      console.log(`Loading Wasmoon from: ${this.config.cdnURL}`);

      const script = document.createElement('script');
      script.src = this.config.cdnURL;
      script.type = 'text/javascript';
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        console.log('Wasmoon script loaded, checking for LuaFactory...');

        // Give the library time to initialize
        setTimeout(() => {
          if (window.LuaFactory) {
            console.log('LuaFactory found!');
            resolve();
          } else {
            console.error('LuaFactory not found. Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('lua')));
            reject(new Error('LuaFactory not found after script load. The Wasmoon library may not be compatible with this browser or the CDN URL is incorrect.'));
          }
        }, 200);
      };

      script.onerror = (error) => {
        console.error('Failed to load Wasmoon script:', error);
        console.error('CDN URL:', this.config.cdnURL);
        reject(new Error(`Failed to load Wasmoon script from CDN. URL: ${this.config.cdnURL}. This could be a CORS issue or incorrect CDN path.`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Set up custom Lua print function to capture output
   */
  async setupLuaPrint() {
    // Create a custom print function that captures output
    this.engine.global.set('print', (...args) => {
      const output = args.map(arg => String(arg)).join('\t');
      this.log(output, 'stdout');
    });

    // Create custom error handler
    this.engine.global.set('error', (message) => {
      this.logError(String(message));
    });
  }

  /**
   * Execute Lua code
   *
   * @param {string} code - Lua code to execute
   * @param {object} options - Execution options
   * @returns {object} Execution result with output and metadata
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Lua runtime not loaded. Call load() first.');
    }

    const startTime = performance.now();
    const result = {
      success: false,
      output: [],
      returnValue: null,
      executionTime: 0,
      error: null,
    };

    // Clear previous output
    this.clearOutput();

    try {
      // Execute Lua code
      const luaResult = await this.engine.doString(code);

      // Capture return value if present
      if (luaResult !== undefined && luaResult !== null) {
        result.returnValue = luaResult;
        this.log(`Return value: ${JSON.stringify(luaResult)}`, 'info');
      }

      result.success = true;
      result.executionTime = performance.now() - startTime;

    } catch (error) {
      result.success = false;
      result.error = error;
      result.executionTime = performance.now() - startTime;

      // Format Lua error for better readability
      const errorMessage = this.formatLuaError(error);
      this.logError(errorMessage);
    }

    return result;
  }

  /**
   * Format Lua error messages for better readability
   *
   * @param {Error} error - JavaScript Error object
   * @returns {string} Formatted error message
   */
  formatLuaError(error) {
    let message = error.message || String(error);

    // Extract Lua error details
    // Wasmoon errors typically include line numbers and context
    if (message.includes("[string ")) {
      // Remove WASM wrapper text
      message = message.replace(/\[string ".*?"\]:/g, 'Line ');
    }

    return `Lua Error:\n${message}`;
  }

  /**
   * Clear captured output
   */
  clearOutput() {
    this.outputBuffer = [];
  }

  /**
   * Dispose of Lua engine and free resources
   */
  async dispose() {
    if (this.engine) {
      await this.engine.global.close();
      this.engine = null;
    }

    if (this.factory) {
      this.factory = null;
    }

    this.loaded = false;
    this.log('Lua runtime disposed', 'info');
  }

  /**
   * Get information about available Lua libraries
   *
   * @returns {object} Library information
   */
  getLibraryInfo() {
    return {
      name: 'Wasmoon',
      luaVersion: '5.4',
      size: '~200KB',
      libraries: [
        'base',
        'coroutine',
        'table',
        'io',
        'os',
        'string',
        'math',
        'utf8',
        'debug',
      ],
      limitations: [
        'No file system access (browser environment)',
        'Limited os library functions',
        'No C module loading',
      ],
    };
  }
}
