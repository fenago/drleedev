import BaseRuntime from '../BaseRuntime.js';

/**
 * AssemblyScriptRuntime - AssemblyScript to WebAssembly compiler
 *
 * AssemblyScript is a TypeScript-like language that compiles to WebAssembly.
 * This runtime compiles AssemblyScript code to WASM and optionally executes it.
 */
export default class AssemblyScriptRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('assemblyscript', {
      version: 'AssemblyScript 0.28.x',
      ...config,
    });

    this.asc = null;
  }

  /**
   * Load AssemblyScript compiler
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading AssemblyScript compiler...', 'info');

      // Dynamically import AssemblyScript
      const ascModule = await import('assemblyscript/asc');
      this.asc = ascModule;

      this.loaded = true;
      this.loading = false;
      this.log('AssemblyScript compiler loaded successfully!', 'success');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load AssemblyScript: ${error.message}`);
    }
  }

  /**
   * Execute AssemblyScript code
   *
   * @param {string} code - AssemblyScript code to compile and execute
   * @param {Object} options - Execution options
   * @param {boolean} options.optimize - Optimize WASM output (default: false)
   * @param {boolean} options.execute - Execute compiled WASM (default: true)
   * @param {string} options.exportName - Function to call when executing (default: 'main')
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('AssemblyScript runtime not loaded. Call load() first.');
    }

    const {
      optimize = false,
      execute = true,
      exportName = 'main',
    } = options;

    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
      compiledWasm: null,
      wasmStats: null,
    };

    try {
      // Prepare compiler options
      const compilerOptions = {
        stdout: this.asc.createMemoryStream(),
        stderr: this.asc.createMemoryStream(),
        readFile: (filename, baseDir) => {
          // For the entry file, return the user's code
          if (filename === 'module.ts' || filename === 'assembly/index.ts') {
            return code;
          }
          // Return null for other files (would normally read from file system)
          return null;
        },
        writeFile: (filename, contents, baseDir) => {
          // Capture the output WASM file
          if (filename.endsWith('.wasm')) {
            result.compiledWasm = contents;
          }
        },
        listFiles: (dirname, baseDir) => {
          return [];
        },
      };

      // Compilation arguments
      const args = [
        'module.ts',
        '--outFile', 'output.wasm',
        '--textFile', 'output.wat',
        '--sourceMap',
        '--runtime', 'stub',
      ];

      if (optimize) {
        args.push('-O3');
      }

      // Compile AssemblyScript to WASM
      this.log('Compiling AssemblyScript to WebAssembly...', 'info');

      const { error: compileError, stdout, stderr } = await this.asc.main(
        args,
        compilerOptions
      );

      // Get compiler output
      const stdoutText = stdout.toString();
      const stderrText = stderr.toString();

      // Check for compilation errors
      if (compileError) {
        throw new Error(`Compilation failed:\n${stderrText || 'Unknown error'}`);
      }

      if (stderrText) {
        this.log(`Compiler warnings:\n${stderrText}`, 'warning');
      }

      if (!result.compiledWasm) {
        throw new Error('Compilation produced no output');
      }

      // Get WASM stats
      const wasmSize = result.compiledWasm.byteLength;
      result.wasmStats = {
        size: wasmSize,
        sizeFormatted: this.formatBytes(wasmSize),
        optimized: optimize,
      };

      this.log(`Compilation successful!`, 'success');
      this.log(`WASM size: ${result.wasmStats.sizeFormatted}`, 'info');

      let outputLines = [
        '=== Compilation Results ===',
        `Status: Success`,
        `WASM Size: ${result.wasmStats.sizeFormatted} (${wasmSize} bytes)`,
        `Optimized: ${optimize ? 'Yes' : 'No'}`,
      ];

      // Execute the compiled WASM if requested
      if (execute) {
        this.log('\nExecuting compiled WebAssembly...', 'info');

        try {
          const wasmModule = await WebAssembly.instantiate(result.compiledWasm, {
            env: {
              abort: (msg, file, line, col) => {
                throw new Error(`Abort: ${msg} at ${file}:${line}:${col}`);
              },
              // Seed for random number generation
              seed: () => Date.now(),
            },
          });

          const exports = wasmModule.instance.exports;

          // List available exports
          const exportedFunctions = Object.keys(exports).filter(
            key => typeof exports[key] === 'function'
          );

          outputLines.push('', '=== Exported Functions ===');
          if (exportedFunctions.length > 0) {
            outputLines.push(exportedFunctions.join(', '));
          } else {
            outputLines.push('(none)');
          }

          // Try to call the specified export
          if (exports[exportName]) {
            if (typeof exports[exportName] === 'function') {
              this.log(`Calling export: ${exportName}()`, 'info');
              result.returnValue = exports[exportName]();

              outputLines.push('', '=== Execution Results ===');
              outputLines.push(`Called: ${exportName}()`);
              outputLines.push(`Return value: ${result.returnValue}`);

              this.log(`Return value: ${result.returnValue}`, 'success');
            } else {
              outputLines.push('', `Note: '${exportName}' exists but is not a function`);
            }
          } else if (exportedFunctions.length > 0) {
            outputLines.push('', `Note: '${exportName}' not found. Available functions: ${exportedFunctions.join(', ')}`);
          } else {
            outputLines.push('', 'Note: No exported functions found to execute');
          }
        } catch (execError) {
          outputLines.push('', '=== Execution Error ===');
          outputLines.push(execError.message);
          this.logError(`Execution error: ${execError.message}`);
        }
      } else {
        outputLines.push('', 'Execution skipped (execute option is false)');
      }

      result.output = outputLines.join('\n');
      this.log(result.output, 'stdout');
      result.success = true;

    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `AssemblyScript Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Format bytes to human readable format
   *
   * @private
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Dispose of AssemblyScript runtime
   */
  async dispose() {
    this.asc = null;
    await super.dispose();
    this.log('AssemblyScript runtime disposed', 'info');
  }

  /**
   * Get information about AssemblyScript runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'AssemblyScript',
      version: '0.28.x',
      description: 'TypeScript-like language that compiles to WebAssembly',
      features: [
        'TypeScript-like syntax',
        'Compiles to WebAssembly',
        'Static typing',
        'High performance',
        'Low-level memory control',
        'No garbage collection overhead',
        'Direct WASM output',
        'Optimization support',
      ],
      types: [
        'i32, i64 (integers)',
        'f32, f64 (floats)',
        'bool',
        'Arrays and typed arrays',
        'Classes and interfaces',
        'Generics',
      ],
      limitations: [
        'No dynamic typing',
        'Limited standard library',
        'Requires explicit types',
        'No JavaScript interop in WASM',
        'Learning curve for WASM concepts',
      ],
      useCases: [
        'Performance-critical code',
        'Game engines',
        'Cryptography',
        'Image/video processing',
        'Scientific computing',
        'Embedded systems',
      ],
      documentation: 'https://www.assemblyscript.org',
      example: `export function add(a: i32, b: i32): i32 {
  return a + b;
}

export function main(): i32 {
  return add(5, 10);
}`,
    };
  }

  /**
   * Get version information
   *
   * @returns {string} Version string
   */
  getVersion() {
    return this.config.version || 'AssemblyScript 0.28.x';
  }
}
