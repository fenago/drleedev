/**
 * RacketRuntime - Racket (Scheme dialect)
 *
 * Uses BiwaScheme as a Racket-compatible Scheme implementation.
 * Note: This is Scheme R7RS, not full Racket, but provides similar functionality.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class RacketRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('racket', {
      version: 'Racket-compatible (Scheme R7RS)',
      ...config,
    });

    this.BiwaScheme = null;
  }

  /**
   * Load BiwaScheme as Racket runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.log('Loading Racket-compatible runtime (BiwaScheme)...', 'info');

      // Import BiwaScheme (we already have it for Scheme runtime)
      const BiwaScheme = await import('biwascheme');
      this.BiwaScheme = BiwaScheme.default || BiwaScheme;

      this.loaded = true;
      this.log('Racket runtime ready', 'success');
    } catch (error) {
      this.logError(`Failed to load Racket runtime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute Racket/Scheme code
   *
   * @param {string} code - Racket code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    const startTime = performance.now();

    // Ensure runtime is loaded
    if (!this.loaded) {
      await this.load();
    }

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Create new interpreter instance
      const interpreter = new this.BiwaScheme.Interpreter();

      // Capture output
      let output = [];

      // Override display function to capture output
      interpreter.define('display', (x) => {
        output.push(this.BiwaScheme.to_write(x));
        return this.BiwaScheme.undef;
      });

      // Translate common Racket syntax to Scheme
      let processedCode = code
        .replace(/#lang\s+racket/g, '; Racket compatibility mode')
        .replace(/\(displayln\s+/g, '(display ')
        .replace(/\(printf\s+"([^"]+)"\s+/g, (match, format) => {
          // Simple printf to display translation
          return '(display "' + format + '")';
        });

      // Execute the code
      const returnValue = interpreter.evaluate(processedCode);

      result.output = [
        '==================================================',
        'Racket-compatible Output (via Scheme R7RS):',
        '==================================================',
        '',
        output.join('\n') || '(no output)',
        '',
        'Return value: ' + this.BiwaScheme.to_write(returnValue),
        '',
        '==================================================',
        'Note: This is BiwaScheme (Scheme R7RS)',
        '==================================================',
        'Not all Racket features are supported.',
        'Compatible with basic Racket/Scheme syntax.',
        'For full Racket, use #lang racket syntax (limited).',
      ].join('\n');

      result.returnValue = returnValue;
      result.success = true;

      this.log('Racket code executed successfully', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nRacket/Scheme execution failed.\nCheck syntax and try again.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of Racket runtime
   */
  async dispose() {
    this.BiwaScheme = null;
    this.loaded = false;
    this.log('Racket runtime disposed', 'info');
  }

  /**
   * Get information about Racket runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Racket-compatible (BiwaScheme)',
      version: 'Scheme R7RS',
      size: '~500KB',
      features: [
        'Racket-like syntax (Scheme-based)',
        'Functional programming',
        'Lambda expressions',
        'List operations',
        'Recursion',
        'Higher-order functions',
        'Basic macros',
      ],
      limitations: [
        'Not full Racket - uses Scheme R7RS',
        'No Racket-specific libraries',
        'Limited macro system',
        'No structs or classes',
        'No module system',
      ],
      documentation: 'https://docs.racket-lang.org/',
    };
  }
}
