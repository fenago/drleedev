/**
 * ClojureRuntime - Clojure execution using ClojureScript
 *
 * ClojureScript compiles Clojure code to JavaScript, allowing
 * functional programming with Clojure syntax in the browser.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class ClojureRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('clojure', {
      version: 'ClojureScript',
      ...config,
    });

    this.cljs = null;
  }

  /**
   * Load Clojure runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading ClojureScript...', 'info');
      this.log('This may take a few seconds...', 'info');

      // For now, we'll use a JavaScript-based evaluator approach
      // ClojureScript expressions will be transpiled to JavaScript
      this.cljs = {
        core: {
          println: (...args) => {
            this.log(args.join(' '), 'stdout');
            return null;
          },
          print: (...args) => {
            this.log(args.join(' '), 'stdout');
            return null;
          },
          str: (...args) => args.join(''),
          inc: (x) => x + 1,
          dec: (x) => x - 1,
          first: (coll) => Array.isArray(coll) ? coll[0] : coll,
          rest: (coll) => Array.isArray(coll) ? coll.slice(1) : [],
          cons: (x, coll) => [x, ...(Array.isArray(coll) ? coll : [coll])],
          conj: (coll, ...xs) => [...(Array.isArray(coll) ? coll : []), ...xs],
          count: (coll) => Array.isArray(coll) ? coll.length : 0,
          map: (f, coll) => Array.isArray(coll) ? coll.map(f) : [],
          filter: (f, coll) => Array.isArray(coll) ? coll.filter(f) : [],
          reduce: (f, init, coll) => Array.isArray(coll) ? coll.reduce(f, init) : init,
        }
      };

      this.loaded = true;
      this.loading = false;
      this.log('✓ ClojureScript runtime loaded successfully!', 'success');
      this.log('ClojureScript REPL ready', 'info');
      this.log('Note: Limited subset of Clojure core functions available', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load ClojureScript: ${error.message}`);
    }
  }

  /**
   * Execute ClojureScript code
   *
   * @param {string} code - ClojureScript code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('ClojureScript runtime not loaded. Call load() first.');
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
      // Basic transpilation of simple Clojure expressions to JavaScript
      const jsCode = this.transpileSimpleClojure(code);

      // Capture output
      let outputBuffer = [];
      const originalLog = this.log.bind(this);

      this.log = (text, type) => {
        if (type === 'stdout') {
          outputBuffer.push(text);
        }
        originalLog(text, type);
      };

      // Execute transpiled code
      const returnValue = eval(jsCode);

      // Restore original log function
      this.log = originalLog;

      // Build output
      if (outputBuffer.length > 0) {
        result.output = outputBuffer.join('\n');
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
      result.output = `ClojureScript Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Basic transpilation of simple Clojure expressions
   * This is a simplified version - full ClojureScript compilation is complex
   *
   * @private
   * @param {string} code - Clojure code
   * @returns {string} JavaScript code
   */
  transpileSimpleClojure(code) {
    let js = code.trim();

    // Convert (println ...) to console.log
    js = js.replace(/\(println\s+([^)]+)\)/g, 'this.cljs.core.println($1)');
    js = js.replace(/\(print\s+([^)]+)\)/g, 'this.cljs.core.print($1)');

    // Convert (+ a b c) to (a + b + c)
    js = js.replace(/\(\+\s+([^)]+)\)/g, (match, args) => {
      const parts = args.trim().split(/\s+/);
      return parts.join(' + ');
    });

    // Convert (- a b) to (a - b)
    js = js.replace(/\(-\s+([^)]+)\)/g, (match, args) => {
      const parts = args.trim().split(/\s+/);
      return parts.join(' - ');
    });

    // Convert (* a b c) to (a * b * c)
    js = js.replace(/\(\*\s+([^)]+)\)/g, (match, args) => {
      const parts = args.trim().split(/\s+/);
      return parts.join(' * ');
    });

    // Convert (/ a b) to (a / b)
    js = js.replace(/\(\/\s+([^)]+)\)/g, (match, args) => {
      const parts = args.trim().split(/\s+/);
      return parts.join(' / ');
    });

    // If still starts with (, try to eval as array
    if (js.startsWith('(') && js.endsWith(')')) {
      js = `[${js.substring(1, js.length - 1)}]`;
    }

    return js;
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
      return `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `(${value.map(v => this.formatValue(v)).join(' ')})`;
    }
    if (value === null || value === undefined) {
      return 'nil';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Dispose of ClojureScript runtime
   */
  async dispose() {
    if (this.cljs) {
      this.cljs = null;
    }
    this.loaded = false;
    this.log('ClojureScript runtime disposed', 'info');
  }

  /**
   * Get information about ClojureScript runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'ClojureScript',
      version: 'Simplified REPL',
      size: '~100KB',
      features: [
        'Lisp syntax',
        'Functional programming',
        'Immutable data structures',
        'REPL-driven development',
        'Basic arithmetic operations',
        'Simple list operations',
        'JavaScript interop',
      ],
      limitations: [
        'Simplified subset of ClojureScript',
        'No macro support',
        'Limited core library',
        'Basic transpilation only',
        'For full ClojureScript, use external compiler',
      ],
      documentation: 'https://clojurescript.org/',
    };
  }
}
