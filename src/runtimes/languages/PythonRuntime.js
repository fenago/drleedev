import BaseRuntime from '../BaseRuntime.js';

/**
 * PythonRuntime - Python execution using Pyodide
 *
 * Pyodide is CPython compiled to WebAssembly, providing full Python 3.11+
 * support in the browser including NumPy, Pandas, Matplotlib, and more.
 */
export default class PythonRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('python', {
      version: '3.11',
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      ...config,
    });

    this.pyodide = null;
  }

  /**
   * Load Pyodide runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading Python runtime (Pyodide)...', 'info');
      this.log('This may take 10-15 seconds on first load...', 'info');

      // Load Pyodide script if not already loaded
      if (!window.loadPyodide) {
        await this.loadPyodideScript();
      }

      // Initialize Pyodide
      this.pyodide = await window.loadPyodide({
        indexURL: this.config.indexURL,
        stdout: (text) => this.log(text, 'stdout'),
        stderr: (text) => this.logError(text),
      });

      this.loaded = true;
      this.loading = false;
      this.log('✓ Python runtime loaded successfully!', 'success');
      this.log(`Python ${this.pyodide.version}`, 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load Pyodide: ${error.message}`);
    }
  }

  /**
   * Load Pyodide script from CDN
   *
   * @private
   * @returns {Promise<void>}
   */
  async loadPyodideScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));

      document.head.appendChild(script);
    });
  }

  /**
   * Execute Python code
   *
   * @param {string} code - Python code to execute
   * @param {Object} options - Execution options
   * @param {boolean} options.autoInstallPackages - Auto-install imported packages (default: true)
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Python runtime not loaded. Call load() first.');
    }

    const { autoInstallPackages = true } = options;
    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Auto-install packages from imports if enabled
      if (autoInstallPackages) {
        await this.autoInstallPackages(code);
      }

      // Execute Python code
      result.returnValue = await this.pyodide.runPythonAsync(code);

      // If return value exists and is not None, display it
      if (result.returnValue !== undefined && result.returnValue !== null) {
        const returnStr = String(result.returnValue);
        if (returnStr !== 'undefined') {
          this.log(returnStr, 'success');
          result.output = returnStr;
        }
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = this.formatPythonError(error);
      this.logError(result.output);
    } finally {
      const endTime = performance.now();
      result.executionTime = endTime - startTime;
    }

    return result;
  }

  /**
   * Auto-install packages from import statements
   *
   * @private
   * @param {string} code - Python code
   * @returns {Promise<void>}
   */
  async autoInstallPackages(code) {
    try {
      // Extract package names from import statements
      const packages = this.extractImports(code);

      if (packages.length > 0) {
        this.log(`Installing packages: ${packages.join(', ')}...`, 'info');

        // Load packages from imports
        await this.pyodide.loadPackagesFromImports(code);

        this.log('✓ Packages installed', 'success');
      }
    } catch (error) {
      // Non-fatal - just log the warning
      this.log(`Warning: Could not auto-install packages: ${error.message}`, 'stdout');
    }
  }

  /**
   * Extract import statements from Python code
   *
   * @private
   * @param {string} code - Python code
   * @returns {string[]} Array of package names
   */
  extractImports(code) {
    const packages = new Set();
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Match: import package
      const importMatch = trimmed.match(/^import\s+(\w+)/);
      if (importMatch) {
        packages.add(importMatch[1]);
      }

      // Match: from package import ...
      const fromMatch = trimmed.match(/^from\s+(\w+)/);
      if (fromMatch) {
        packages.add(fromMatch[1]);
      }
    }

    return Array.from(packages);
  }

  /**
   * Format Python error for display
   *
   * @private
   * @param {Error} error - Python error object
   * @returns {string} Formatted error message
   */
  formatPythonError(error) {
    let message = error.message;

    // Pyodide errors often include full traceback
    // Clean it up for better display
    if (message.includes('Traceback')) {
      // Extract just the important parts
      const lines = message.split('\n');
      const relevantLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Include traceback header, file lines, and error line
        if (
          line.includes('Traceback') ||
          line.includes('File') ||
          line.includes('Error:') ||
          line.includes('Exception:') ||
          (i > 0 && lines[i - 1].includes('File'))
        ) {
          relevantLines.push(line);
        }
      }

      message = relevantLines.join('\n');
    }

    return message;
  }

  /**
   * Install a Python package using micropip
   *
   * @param {string} packageName - Package name (e.g., 'numpy', 'matplotlib')
   * @returns {Promise<void>}
   */
  async installPackage(packageName) {
    if (!this.loaded) {
      throw new Error('Python runtime not loaded');
    }

    try {
      this.log(`Installing ${packageName}...`, 'info');
      await this.pyodide.loadPackage(packageName);
      this.log(`✓ ${packageName} installed`, 'success');
    } catch (error) {
      throw new Error(`Failed to install ${packageName}: ${error.message}`);
    }
  }

  /**
   * Get list of loaded packages
   *
   * @returns {string[]} Array of loaded package names
   */
  getLoadedPackages() {
    if (!this.loaded) {
      return [];
    }

    return this.pyodide.loadedPackages;
  }

  /**
   * Evaluate Python expression and return result
   *
   * @param {string} expression - Python expression
   * @returns {Promise<any>} Result value
   */
  async evaluateExpression(expression) {
    if (!this.loaded) {
      throw new Error('Python runtime not loaded');
    }

    return await this.pyodide.runPythonAsync(expression);
  }

  /**
   * Dispose Python runtime
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    if (this.pyodide) {
      // Pyodide doesn't have a dispose method, just clear reference
      this.pyodide = null;
    }

    await super.dispose();
  }

  /**
   * Get Pyodide version
   *
   * @returns {string|null}
   */
  getVersion() {
    return this.pyodide ? this.pyodide.version : this.config.version;
  }
}
