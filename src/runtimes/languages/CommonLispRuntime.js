/**
 * CommonLispRuntime - Common Lisp execution using JSCL
 *
 * JSCL (JavaScript Common Lisp) is a Common Lisp to JavaScript compiler
 * that runs entirely in the browser.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class CommonLispRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('commonlisp', {
      version: 'ANSI CL',
      ...config,
    });

    this.jscl = null;
  }

  /**
   * Load Common Lisp runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading Common Lisp (JSCL)...', 'info');

      // Dynamically import JSCL
      const jsclModule = await import('jscl');
      this.jscl = jsclModule.default || jsclModule;

      // Set up standard output capture
      if (this.jscl && this.jscl.global) {
        // Capture *standard-output*
        const self = this;
        this.jscl.global['*standard-output*'] = {
          write: function(str) {
            self.log(str, 'stdout');
          }
        };
      }

      this.loaded = true;
      this.loading = false;
      this.log('✓ Common Lisp runtime loaded successfully!', 'success');
      this.log('JSCL (ANSI Common Lisp) ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load Common Lisp: ${error.message}`);
    }
  }

  /**
   * Execute Common Lisp code
   *
   * @param {string} code - Common Lisp code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Common Lisp runtime not loaded. Call load() first.');
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
      // Capture output
      let outputBuffer = [];
      const originalLog = this.log.bind(this);

      this.log = (text, type) => {
        if (type === 'stdout') {
          outputBuffer.push(text);
        }
        originalLog(text, type);
      };

      // Execute Common Lisp code
      let returnValue;
      if (this.jscl && typeof this.jscl.evaluate === 'function') {
        returnValue = this.jscl.evaluate(code);
      } else if (this.jscl && typeof this.jscl.eval === 'function') {
        returnValue = this.jscl.eval(code);
      } else {
        // Fallback - try to use global eval
        returnValue = eval(`(${code})`);
      }

      // Restore original log function
      this.log = originalLog;

      // Build output
      if (outputBuffer.length > 0) {
        result.output = outputBuffer.join('');
      }

      // Add return value to output if present
      if (returnValue !== undefined && returnValue !== null) {
        const valueStr = this.formatValue(returnValue);
        if (valueStr) {
          if (result.output) {
            result.output += '\n' + valueStr;
          } else {
            result.output = valueStr;
          }
        }
      }

      result.returnValue = returnValue;
      result.success = true;

      if (result.output) {
        this.log(result.output, 'stdout');
      }
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Common Lisp Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Format value for display
   *
   * @private
   * @param {any} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `(${value.map(v => this.formatValue(v)).join(' ')})`;
    }
    if (value === null || value === undefined) {
      return 'NIL';
    }
    if (typeof value === 'object') {
      // Check for JSCL-specific object types
      if (value.toString && typeof value.toString === 'function') {
        const str = value.toString();
        if (str !== '[object Object]') {
          return str;
        }
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Dispose of Common Lisp runtime
   */
  async dispose() {
    if (this.jscl) {
      this.jscl = null;
    }
    this.loaded = false;
    this.log('Common Lisp runtime disposed', 'info');
  }

  /**
   * Get information about Common Lisp runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Common Lisp (JSCL)',
      version: 'ANSI CL',
      size: '~1MB',
      features: [
        'ANSI Common Lisp compatible',
        'First-class functions',
        'Macros and metaprogramming',
        'Multiple dispatch (CLOS)',
        'Condition system',
        'Lexical and dynamic scope',
        'Rich data structures',
        'Interactive development',
      ],
      limitations: [
        'Subset of full ANSI CL',
        'No full CLOS implementation',
        'Limited standard library',
        'No file I/O in browser',
      ],
      documentation: 'https://github.com/jscl-project/jscl',
    };
  }
}
