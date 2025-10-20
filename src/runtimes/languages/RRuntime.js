import BaseRuntime from '../BaseRuntime.js';

/**
 * RRuntime - R execution using webR
 *
 * webR is R compiled to WebAssembly, providing full R language support
 * in the browser including base R packages and statistical functions.
 */
export default class RRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('r', {
      version: '4.3.0',
      baseUrl: 'https://webr.r-wasm.org/latest/',
      ...config,
    });

    this.webR = null;
    this.shelter = null;
  }

  /**
   * Load webR runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading R runtime (webR)...', 'info');
      this.log('This may take 10-15 seconds on first load...', 'info');

      // Load webR script if not already loaded
      if (!window.WebR) {
        await this.loadWebRScript();
      }

      // Initialize webR
      const { WebR } = window;
      this.webR = new WebR({
        baseUrl: this.config.baseUrl,
        interactive: false,
      });

      await this.webR.init();

      // Capture output
      this.webR.writeConsole = (line) => {
        this.log(line, 'stdout');
      };

      // Capture errors
      this.webR.captureR = (output) => {
        if (output.type === 'stderr') {
          this.logError(output.data);
        } else if (output.type === 'stdout') {
          this.log(output.data, 'stdout');
        }
      };

      this.loaded = true;
      this.loading = false;
      this.log('✓ R runtime loaded successfully!', 'success');
      this.log('R version 4.3.0', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load webR: ${error.message}`);
    }
  }

  /**
   * Load webR script from CDN
   *
   * @private
   * @returns {Promise<void>}
   */
  async loadWebRScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://webr.r-wasm.org/latest/webr.mjs';
      script.type = 'module';
      script.async = true;

      // Since this is a module script, we need to handle it differently
      script.onload = () => {
        // Give it a moment to initialize
        setTimeout(() => resolve(), 100);
      };
      script.onerror = () => reject(new Error('Failed to load webR script'));

      document.head.appendChild(script);
    });
  }

  /**
   * Execute R code
   *
   * @param {string} code - R code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('R runtime not loaded. Call load() first.');
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
      // Create a shelter for memory management
      const shelter = await new this.webR.Shelter();

      // Execute R code
      const output = await this.webR.evalR(code);

      // Get the result as a string
      const resultValue = await output.toJs();

      // If return value exists, display it
      if (resultValue !== undefined && resultValue !== null) {
        let outputStr;

        // Handle different R object types
        if (Array.isArray(resultValue.values)) {
          // Vector/array
          outputStr = `[${resultValue.values.join(', ')}]`;
        } else if (typeof resultValue === 'object' && resultValue.values) {
          outputStr = JSON.stringify(resultValue.values);
        } else {
          outputStr = String(resultValue);
        }

        if (outputStr !== 'undefined' && outputStr !== 'NULL') {
          this.log(outputStr, 'success');
          result.output = outputStr;
        }
      }

      result.success = true;
      result.returnValue = resultValue;

      // Clean up
      await shelter.purge();
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = this.formatRError(error);
      this.logError(result.output);
    } finally {
      const endTime = performance.now();
      result.executionTime = endTime - startTime;
    }

    return result;
  }

  /**
   * Format R error for display
   *
   * @private
   * @param {Error} error - R error object
   * @returns {string} Formatted error message
   */
  formatRError(error) {
    let message = error.message;

    // Clean up R error messages
    if (message.includes('Error in')) {
      // R errors are usually well-formatted
      return message;
    }

    return `Error: ${message}`;
  }

  /**
   * Install an R package using webR
   *
   * @param {string} packageName - Package name (e.g., 'ggplot2', 'dplyr')
   * @returns {Promise<void>}
   */
  async installPackage(packageName) {
    if (!this.loaded) {
      throw new Error('R runtime not loaded');
    }

    try {
      this.log(`Installing ${packageName}...`, 'info');
      await this.webR.installPackages([packageName]);
      this.log(`✓ ${packageName} installed`, 'success');
    } catch (error) {
      throw new Error(`Failed to install ${packageName}: ${error.message}`);
    }
  }

  /**
   * Evaluate R expression and return result
   *
   * @param {string} expression - R expression
   * @returns {Promise<any>} Result value
   */
  async evaluateExpression(expression) {
    if (!this.loaded) {
      throw new Error('R runtime not loaded');
    }

    const output = await this.webR.evalR(expression);
    return await output.toJs();
  }

  /**
   * Dispose R runtime
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    if (this.webR) {
      try {
        await this.webR.close();
      } catch (error) {
        // Ignore errors on close
      }
      this.webR = null;
    }

    await super.dispose();
  }

  /**
   * Get webR version
   *
   * @returns {string}
   */
  getVersion() {
    return this.config.version;
  }
}
