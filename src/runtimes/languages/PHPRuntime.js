/**
 * PHPRuntime - PHP execution using php-wasm
 *
 * PHP-WASM is PHP compiled to WebAssembly, allowing PHP code
 * to run directly in the browser.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class PHPRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('php', {
      version: '8.2',
      ...config,
    });

    this.phpModule = null;
  }

  /**
   * Load PHP runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading PHP runtime...', 'info');
      this.log('This may take a few seconds on first load...', 'info');

      // Dynamically import php-wasm
      const { PhpWeb } = await import('php-wasm/PhpWeb.mjs');

      this.phpModule = new PhpWeb();

      this.loaded = true;
      this.loading = false;
      this.log('✓ PHP runtime loaded successfully!', 'success');
      this.log('PHP 8.2 ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load PHP: ${error.message}`);
    }
  }

  /**
   * Execute PHP code
   *
   * @param {string} code - PHP code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('PHP runtime not loaded. Call load() first.');
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
      // Ensure code starts with <?php if not present
      let phpCode = code.trim();
      if (!phpCode.startsWith('<?php') && !phpCode.startsWith('<?=')) {
        phpCode = `<?php\n${phpCode}`;
      }

      // Execute PHP code
      const output = await this.phpModule.run(phpCode);

      result.output = output;
      result.returnValue = output;

      this.log(output, 'stdout');
      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      this.logError(`PHP Error: ${error.message}`);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of PHP runtime
   */
  async dispose() {
    if (this.phpModule) {
      this.phpModule = null;
    }
    this.loaded = false;
    this.log('PHP runtime disposed', 'info');
  }

  /**
   * Get information about PHP runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'PHP',
      version: '8.2',
      size: '~5MB',
      features: [
        'PHP 8.2 syntax support',
        'Standard library functions',
        'String manipulation',
        'Array operations',
        'File I/O (virtual filesystem)',
        'JSON encoding/decoding',
        'Regular expressions',
      ],
      limitations: [
        'No network access',
        'No database extensions',
        'Limited extensions available',
        'Virtual filesystem only',
      ],
      documentation: 'https://github.com/oraoto/pib',
    };
  }
}
