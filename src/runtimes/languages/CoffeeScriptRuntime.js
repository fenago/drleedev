/**
 * CoffeeScriptRuntime - CoffeeScript execution
 *
 * CoffeeScript is a language that compiles to JavaScript.
 * It adds syntactic sugar inspired by Ruby, Python and Haskell.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class CoffeeScriptRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('coffeescript', {
      version: 'CoffeeScript 2.x',
      ...config,
    });

    this.CoffeeScript = null;
  }

  /**
   * Load CoffeeScript compiler
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading CoffeeScript compiler...', 'info');

      // Dynamically import CoffeeScript
      const coffeeModule = await import('coffeescript');
      this.CoffeeScript = coffeeModule.default || coffeeModule;

      this.loaded = true;
      this.loading = false;
      this.log('✓ CoffeeScript runtime loaded successfully!', 'success');
      this.log('CoffeeScript 2.x ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load CoffeeScript: ${error.message}`);
    }
  }

  /**
   * Execute CoffeeScript code
   *
   * @param {string} code - CoffeeScript code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('CoffeeScript runtime not loaded. Call load() first.');
    }

    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Compile CoffeeScript to JavaScript
      const compiledJS = this.CoffeeScript.compile(code, {
        bare: true,
        header: false,
      });

      this.log('Compiled to JavaScript:', 'info');
      this.log(compiledJS, 'debug');

      // Capture console output
      let consoleOutput = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(text);
        this.log(text, 'stdout');
      };

      console.error = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`Error: ${text}`);
        this.logError(text);
      };

      console.warn = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`Warning: ${text}`);
        this.log(text, 'warning');
      };

      try {
        // Execute compiled JavaScript
        const returnValue = eval(compiledJS);

        result.returnValue = returnValue;

        // Build output
        if (consoleOutput.length > 0) {
          result.output = consoleOutput.join('\n');
        } else if (returnValue !== undefined) {
          result.output = String(returnValue);
        } else {
          result.output = 'Execution completed';
        }

        result.success = true;
      } finally {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `CoffeeScript Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of CoffeeScript runtime
   */
  async dispose() {
    this.CoffeeScript = null;
    this.loaded = false;
    this.log('CoffeeScript runtime disposed', 'info');
  }

  /**
   * Get information about CoffeeScript runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'CoffeeScript',
      version: '2.x',
      size: '~200KB',
      features: [
        'Python-inspired syntax',
        'Class syntax sugar',
        'Destructuring',
        'String interpolation',
        'Array comprehensions',
        'Splats (...args)',
        'Default parameters',
        'Arrow functions',
        'Existential operator (?)',
      ],
      limitations: [
        'Compiles to JavaScript (adds overhead)',
        'Debugging shows compiled JS',
      ],
      documentation: 'https://coffeescript.org',
    };
  }
}
