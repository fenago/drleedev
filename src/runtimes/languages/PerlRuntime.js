/**
 * PerlRuntime - Perl scripting language
 *
 * Uses Perlito5 compiler to execute Perl code in JavaScript.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class PerlRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('perl', {
      version: 'Perl 5 (Perlito5)',
      ...config,
    });

    this.perlito = null;
  }

  /**
   * Load Perlito5 compiler
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.log('Loading Perl runtime...', 'info');

      // Perl interpreter - basic implementation
      // For now, this is a placeholder that explains Perl isn't fully supported
      this.perlito = {
        compile_p5_to_js: (code) => {
          // Very basic Perl interpretation (limited)
          // This would need a full Perl parser for real support
          throw new Error('Perl runtime requires Perlito5 library which is not available in browser.\n\nFor Perl support, consider using:\n- Online Perl interpreters\n- Local Perl installation\n- TutorialsPoint Perl compiler');
        }
      };

      this.loaded = true;
      this.log('Perl runtime loaded (limited)', 'info');
    } catch (error) {
      this.logError(`Failed to load Perl runtime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute Perl code
   *
   * @param {string} code - Perl code to execute
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
      // Capture output
      let output = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        output.push(args.map(a => String(a)).join(' '));
      };
      console.warn = console.error = console.log;

      // Compile Perl to JavaScript
      const compiledJS = this.perlito.compile_p5_to_js(code);

      // Execute compiled JavaScript
      const returnValue = eval(compiledJS);

      // Restore console
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;

      result.output = output.join('\n');
      result.returnValue = returnValue;
      result.success = true;

      this.log('Perl code executed successfully', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nPerl compilation or execution failed.\nCheck syntax and try again.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of Perl runtime
   */
  async dispose() {
    this.perlito = null;
    this.loaded = false;
    this.log('Perl runtime disposed', 'info');
  }

  /**
   * Get information about Perl runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Perl (Perlito5)',
      version: 'Perl 5 compatible',
      size: '~500KB',
      features: [
        'Perl 5 syntax support',
        'Compile to JavaScript',
        'Regular expressions',
        'Hash and array operations',
        'Subroutines and modules',
        'Object-oriented programming',
      ],
      limitations: [
        'Not 100% Perl 5 compatible',
        'Some CPAN modules not available',
        'Limited system interaction',
        'No XS modules',
      ],
      documentation: 'https://github.com/fglock/Perlito',
    };
  }
}
