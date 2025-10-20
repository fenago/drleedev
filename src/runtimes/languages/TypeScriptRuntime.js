/**
 * TypeScriptRuntime - TypeScript execution with compilation
 *
 * TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class TypeScriptRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('typescript', {
      version: 'TypeScript 5.x',
      ...config,
    });

    this.ts = null;
  }

  /**
   * Load TypeScript compiler
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading TypeScript compiler...', 'info');

      // Dynamically import TypeScript
      const tsModule = await import('typescript');
      this.ts = tsModule.default || tsModule;

      this.loaded = true;
      this.loading = false;
      this.log('✓ TypeScript runtime loaded successfully!', 'success');
      this.log(`TypeScript ${this.ts.version} ready`, 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load TypeScript: ${error.message}`);
    }
  }

  /**
   * Execute TypeScript code
   *
   * @param {string} code - TypeScript code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('TypeScript runtime not loaded. Call load() first.');
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
      // Compile TypeScript to JavaScript
      const compilerOptions = {
        target: this.ts.ScriptTarget.ES2020,
        module: this.ts.ModuleKind.None,
        strict: false,
        esModuleInterop: true,
        skipLibCheck: true,
        lib: ['es2020'],
      };

      const compiledResult = this.ts.transpileModule(code, {
        compilerOptions,
        reportDiagnostics: true,
      });

      // Check for compilation errors
      if (compiledResult.diagnostics && compiledResult.diagnostics.length > 0) {
        const errors = compiledResult.diagnostics.map(diagnostic => {
          const message = this.ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            '\n'
          );
          if (diagnostic.file && diagnostic.start !== undefined) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            return `Line ${line + 1}, Col ${character + 1}: ${message}`;
          }
          return message;
        }).join('\n');

        throw new Error(`TypeScript compilation errors:\n${errors}`);
      }

      const compiledJS = compiledResult.outputText;

      this.log('Compiled to JavaScript:', 'info');
      this.log(compiledJS, 'debug');

      // Capture console output
      let consoleOutput = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(text);
        this.log(text, 'stdout');
      };

      console.error = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`Error: ${text}`);
        this.logError(text);
      };

      console.warn = (...args) => {
        const text = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        consoleOutput.push(`Warning: ${text}`);
        this.log(text, 'warning');
      };

      try {
        // Execute compiled JavaScript
        const returnValue = eval(compiledJS);

        result.returnValue = returnValue;

        // Build output
        if (consoleOutput.length > 0) {
          result.output = consoleOutput.join('\n');
        } else if (returnValue !== undefined) {
          result.output = String(returnValue);
        } else {
          result.output = 'Execution completed';
        }

        result.success = true;
      } finally {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `TypeScript Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of TypeScript runtime
   */
  async dispose() {
    this.ts = null;
    this.loaded = false;
    this.log('TypeScript runtime disposed', 'info');
  }

  /**
   * Get information about TypeScript runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'TypeScript',
      version: this.ts ? this.ts.version : '5.x',
      size: '~4MB',
      features: [
        'Static type checking',
        'Interfaces and types',
        'Generics',
        'Enums',
        'Decorators',
        'Namespaces',
        'JSX support',
        'Advanced type inference',
        'Union and intersection types',
      ],
      limitations: [
        'Type checking at compile time only',
        'Larger compiler size',
        'Debugging shows compiled JS',
      ],
      documentation: 'https://www.typescriptlang.org',
    };
  }
}
