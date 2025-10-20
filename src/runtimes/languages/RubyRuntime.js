import BaseRuntime from '../BaseRuntime.js';

/**
 * RubyRuntime - Ruby execution using ruby.wasm
 *
 * Ruby.wasm is CRuby compiled to WebAssembly using WASI,
 * providing full Ruby 3.2+ support in the browser.
 */
export default class RubyRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('ruby', {
      version: '3.2',
      ...config,
    });

    this.rubyVM = null;
  }

  /**
   * Load Ruby WASM runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading Ruby runtime (ruby.wasm)...', 'info');
      this.log('This may take 10-15 seconds on first load...', 'info');

      // Dynamically import ruby-wasm
      const { DefaultRubyVM } = await import('@ruby/wasm-wasi/dist/browser');

      // Set up output/error streams
      const response = await fetch(
        'https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@latest/dist/ruby.wasm'
      );
      const buffer = await response.arrayBuffer();
      const module = await WebAssembly.compile(buffer);

      this.rubyVM = await DefaultRubyVM(module);

      this.loaded = true;
      this.loading = false;
      this.log('✓ Ruby runtime loaded successfully!', 'success');
      this.log(`Ruby ${this.config.version}`, 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load Ruby runtime: ${error.message}`);
    }
  }

  /**
   * Execute Ruby code
   *
   * @param {string} code - Ruby code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Ruby runtime not loaded. Call load() first.');
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
      // Execute Ruby code
      const output = this.rubyVM.eval(code);
      result.returnValue = output.toString();

      // Display output if exists
      if (result.returnValue && result.returnValue !== 'nil') {
        this.log(result.returnValue, 'success');
        result.output = result.returnValue;
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = this.formatRubyError(error);
      this.logError(result.output);
    } finally {
      const endTime = performance.now();
      result.executionTime = endTime - startTime;
    }

    return result;
  }

  /**
   * Format Ruby error for display
   *
   * @private
   * @param {Error} error - Ruby error object
   * @returns {string} Formatted error message
   */
  formatRubyError(error) {
    let message = error.message;

    // Ruby errors usually include backtrace
    if (message.includes('Traceback')) {
      return message;
    }

    return `Ruby Error: ${message}`;
  }

  /**
   * Dispose Ruby runtime
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    if (this.rubyVM) {
      this.rubyVM = null;
    }

    await super.dispose();
  }

  /**
   * Get Ruby version
   *
   * @returns {string}
   */
  getVersion() {
    return this.config.version;
  }
}
