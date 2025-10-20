/**
 * BaseRuntime - Abstract base class for all language runtimes
 *
 * All language-specific runtimes (Python, Ruby, PHP, etc.) must extend
 * this class and implement the required methods.
 *
 * @abstract
 */
export default class BaseRuntime {
  /**
   * @param {string} name - Language name (e.g., 'python', 'javascript')
   * @param {Object} config - Runtime configuration options
   */
  constructor(name, config = {}) {
    if (new.target === BaseRuntime) {
      throw new TypeError('Cannot instantiate abstract class BaseRuntime directly');
    }

    this.name = name;
    this.config = config;
    this.loaded = false;
    this.loading = false;
    this.runtime = null;
    this.outputCallbacks = [];
    this.errorCallbacks = [];
  }

  /**
   * Load the runtime (WASM, libraries, etc.)
   * Must be implemented by subclasses
   *
   * @abstract
   * @returns {Promise<void>}
   */
  async load() {
    throw new Error(`${this.name}: load() must be implemented by subclass`);
  }

  /**
   * Execute code in the runtime
   * Must be implemented by subclasses
   *
   * @abstract
   * @param {string} code - Code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    throw new Error(`${this.name}: execute() must be implemented by subclass`);
  }

  /**
   * Clean up runtime resources
   * Subclasses can override this for custom cleanup
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    this.runtime = null;
    this.loaded = false;
    this.outputCallbacks = [];
    this.errorCallbacks = [];
  }

  /**
   * Register callback for output (stdout)
   *
   * @param {Function} callback - Callback function(text, type)
   */
  onOutput(callback) {
    if (typeof callback === 'function') {
      this.outputCallbacks.push(callback);
    }
  }

  /**
   * Register callback for errors (stderr)
   *
   * @param {Function} callback - Callback function(text, type)
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }

  /**
   * Log output to all registered callbacks
   *
   * @protected
   * @param {string} text - Output text
   * @param {string} type - Output type ('stdout', 'stderr', 'info', 'success', 'error')
   */
  log(text, type = 'stdout') {
    const callbacks = type === 'stderr' || type === 'error'
      ? this.errorCallbacks
      : this.outputCallbacks;

    callbacks.forEach(callback => {
      try {
        callback(text, type);
      } catch (err) {
        console.error('Error in output callback:', err);
      }
    });
  }

  /**
   * Log error message
   *
   * @protected
   * @param {string} text - Error text
   */
  logError(text) {
    this.log(text, 'stderr');
  }

  /**
   * Check if runtime is loaded
   *
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Check if runtime is currently loading
   *
   * @returns {boolean}
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Get runtime name
   *
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get runtime version (if available)
   * Subclasses can override this
   *
   * @returns {string|null}
   */
  getVersion() {
    return this.config.version || null;
  }
}
