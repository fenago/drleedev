/**
 * SchemeRuntime - Scheme execution using BiwaScheme
 *
 * BiwaScheme is a Scheme interpreter written in JavaScript.
 * It supports R6RS and R7RS Scheme standards.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class SchemeRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('scheme', {
      version: 'R7RS',
      ...config,
    });

    this.interpreter = null;
  }

  /**
   * Load Scheme runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading Scheme (BiwaScheme)...', 'info');

      // Dynamically import BiwaScheme
      const BiwaScheme = await import('biwascheme');

      // Create interpreter instance
      this.interpreter = new BiwaScheme.Interpreter((output) => {
        // Capture console output
        this.log(output, 'stdout');
      });

      this.loaded = true;
      this.loading = false;
      this.log('✓ Scheme runtime loaded successfully!', 'success');
      this.log('BiwaScheme R7RS ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load Scheme: ${error.message}`);
    }
  }

  /**
   * Execute Scheme code
   *
   * @param {string} code - Scheme code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Scheme runtime not loaded. Call load() first.');
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
        outputBuffer.push(text);
        originalLog(text, type);
      };

      // Execute Scheme code
      const returnValue = this.interpreter.evaluate(code);

      // Restore original log function
      this.log = originalLog;

      // Convert Scheme value to JavaScript
      const jsValue = this.schemeToJS(returnValue);

      // Build output
      if (outputBuffer.length > 0) {
        result.output = outputBuffer.join('\n');
      }

      // Add return value to output if not undefined
      if (jsValue !== undefined && jsValue !== null) {
        const valueStr = this.formatValue(jsValue);
        if (result.output) {
          result.output += '\n' + valueStr;
        } else {
          result.output = valueStr;
        }
      }

      result.returnValue = jsValue;
      result.success = true;

      if (result.output) {
        this.log(result.output, 'stdout');
      }
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Scheme Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Convert Scheme value to JavaScript value
   *
   * @private
   * @param {any} value - Scheme value
   * @returns {any} JavaScript value
   */
  schemeToJS(value) {
    if (value === null || value === undefined) {
      return value;
    }

    // Check if it's a BiwaScheme object
    if (value && typeof value === 'object') {
      // Check for BiwaScheme specific types
      if (value.to_write) {
        return value.to_write();
      }
      if (value.to_display) {
        return value.to_display();
      }
    }

    return value;
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
    if (value === null) {
      return '()';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Dispose of Scheme runtime
   */
  async dispose() {
    if (this.interpreter) {
      this.interpreter = null;
    }
    this.loaded = false;
    this.log('Scheme runtime disposed', 'info');
  }

  /**
   * Get information about Scheme runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Scheme (BiwaScheme)',
      version: 'R7RS',
      size: '~500KB',
      features: [
        'R7RS Scheme standard',
        'R6RS library system',
        'Proper tail calls',
        'First-class continuations',
        'Hygienic macros',
        'Unicode support',
        'Full numeric tower',
        'Interactive REPL',
      ],
      limitations: [
        'No file I/O in browser',
        'Limited debugging tools',
        'Single-threaded execution',
      ],
      documentation: 'https://www.biwascheme.org/',
    };
  }
}
