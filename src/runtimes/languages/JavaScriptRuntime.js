import BaseRuntime from '../BaseRuntime.js';

/**
 * JavaScriptRuntime - Native JavaScript execution
 *
 * Executes JavaScript code using the browser's built-in JavaScript engine.
 * No WASM loading required - immediate execution.
 */
export default class JavaScriptRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('javascript', config);
    // JavaScript is always available in the browser
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for JavaScript since it's built-in)
   *
   * @returns {Promise<void>}
   */
  async load() {
    // JavaScript runtime is native to the browser
    this.loaded = true;
    this.log('JavaScript runtime ready', 'info');
  }

  /**
   * Execute JavaScript code
   *
   * @param {string} code - JavaScript code to execute
   * @param {Object} options - Execution options
   * @param {boolean} options.captureConsole - Capture console.log output (default: true)
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    const { captureConsole = true } = options;
    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Capture console output if requested
      let consoleOutput = [];

      if (captureConsole) {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        console.log = (...args) => {
          const message = args.map(arg => String(arg)).join(' ');
          consoleOutput.push({ type: 'stdout', message });
          this.log(message, 'stdout');
        };

        console.error = (...args) => {
          const message = args.map(arg => String(arg)).join(' ');
          consoleOutput.push({ type: 'stderr', message });
          this.logError(message);
        };

        console.warn = (...args) => {
          const message = args.map(arg => String(arg)).join(' ');
          consoleOutput.push({ type: 'stdout', message });
          this.log(`Warning: ${message}`, 'stdout');
        };

        console.info = (...args) => {
          const message = args.map(arg => String(arg)).join(' ');
          consoleOutput.push({ type: 'stdout', message });
          this.log(message, 'info');
        };

        try {
          // Execute the code
          // eslint-disable-next-line no-eval
          result.returnValue = eval(code);

          // If return value exists and is not undefined, log it
          if (result.returnValue !== undefined) {
            const returnStr = String(result.returnValue);
            consoleOutput.push({ type: 'stdout', message: returnStr });
            this.log(returnStr, 'success');
          }
        } finally {
          // Restore original console methods
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;
          console.info = originalInfo;
        }
      } else {
        // Execute without capturing console
        // eslint-disable-next-line no-eval
        result.returnValue = eval(code);
      }

      // Combine all console output
      result.output = consoleOutput
        .map(item => item.message)
        .join('\n');

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = this.formatError(error);
      this.logError(result.output);
    } finally {
      const endTime = performance.now();
      result.executionTime = endTime - startTime;
    }

    return result;
  }

  /**
   * Format error for display
   *
   * @private
   * @param {Error} error - JavaScript error object
   * @returns {string} Formatted error message
   */
  formatError(error) {
    let message = `${error.name}: ${error.message}`;

    // Extract line number from stack trace if available
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const errorLine = stackLines.find(line =>
        line.includes('<anonymous>') || line.includes('eval')
      );

      if (errorLine) {
        const match = errorLine.match(/:(\d+):(\d+)/);
        if (match) {
          const line = match[1];
          const col = match[2];
          message += `\n  at line ${line}, column ${col}`;
        }
      }
    }

    return message;
  }

  /**
   * Dispose runtime (no cleanup needed for JavaScript)
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    await super.dispose();
  }
}
