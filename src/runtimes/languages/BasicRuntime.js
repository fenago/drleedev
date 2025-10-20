/**
 * BasicRuntime - BASIC execution using wwwbasic
 *
 * wwwbasic is a BASIC interpreter written in JavaScript that supports
 * classic BASIC syntax with modern enhancements.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class BasicRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('basic', {
      version: 'Classic BASIC',
      ...config,
    });

    this.Basic = null;
  }

  /**
   * Load BASIC runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading BASIC interpreter...', 'info');

      // Dynamically import wwwbasic
      const basicModule = await import('wwwbasic');
      this.Basic = basicModule.default || basicModule.Basic;

      this.loaded = true;
      this.loading = false;
      this.log('✓ BASIC runtime loaded successfully!', 'success');
      this.log('Classic BASIC interpreter ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load BASIC: ${error.message}`);
    }
  }

  /**
   * Execute BASIC code
   *
   * @param {string} code - BASIC code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('BASIC runtime not loaded. Call load() first.');
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

      // Create a custom console for capturing output
      const customConsole = {
        log: (...args) => {
          const text = args.join(' ');
          outputBuffer.push(text);
          this.log(text, 'stdout');
        },
      };

      // Save original console
      const originalConsole = console.log;

      // Replace console.log temporarily
      console.log = customConsole.log;

      try {
        // Execute BASIC code using the Basic function
        // wwwbasic.Basic() is a function, not a constructor
        await this.Basic(code);
      } finally {
        // Restore original console
        console.log = originalConsole;
      }

      // Build output
      if (outputBuffer.length > 0) {
        result.output = outputBuffer.join('\n');
      } else {
        result.output = 'Program executed successfully';
      }

      result.returnValue = outputBuffer;
      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `BASIC Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of BASIC runtime
   */
  async dispose() {
    if (this.Basic) {
      this.Basic = null;
    }
    this.loaded = false;
    this.log('BASIC runtime disposed', 'info');
  }

  /**
   * Get information about BASIC runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'BASIC (wwwbasic)',
      version: 'Classic BASIC',
      size: '~200KB',
      features: [
        'Classic BASIC syntax',
        'Line numbers',
        'GOTO, GOSUB statements',
        'FOR/NEXT loops',
        'IF/THEN conditionals',
        'Arrays and variables',
        'String manipulation',
        'Math functions',
        'PRINT statements',
      ],
      limitations: [
        'No graphics commands (yet)',
        'Limited INPUT support',
        'No file I/O',
        'Single program at a time',
      ],
      documentation: 'https://github.com/google/wwwbasic',
    };
  }
}
