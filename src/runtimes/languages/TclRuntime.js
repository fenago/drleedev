/**
 * TclRuntime - Tool Command Language
 *
 * Provides a basic TCL interpreter for scripting.
 * Supports fundamental TCL commands and syntax.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class TclRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('tcl', {
      version: 'TCL 8.x compatible',
      ...config,
    });

    this.variables = {};
  }

  /**
   * Load TCL runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    this.log('Loading TCL runtime...', 'info');
    this.loaded = true;
    this.log('TCL runtime ready', 'success');
  }

  /**
   * Execute TCL code
   *
   * @param {string} code - TCL code to execute
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
      let output = [];
      const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      for (const line of lines) {
        const trimmed = line.trim();

        // puts command (output)
        if (trimmed.startsWith('puts ')) {
          const text = trimmed.substring(5).trim();
          // Remove quotes if present
          const cleaned = text.replace(/^["']|["']$/g, '');

          // Variable substitution
          const substituted = cleaned.replace(/\$(\w+)/g, (match, varName) => {
            return this.variables[varName] !== undefined ? this.variables[varName] : match;
          });

          output.push(substituted);
        }

        // set command (variable assignment)
        else if (trimmed.startsWith('set ')) {
          const parts = trimmed.substring(4).trim().split(/\s+/);
          if (parts.length >= 2) {
            const varName = parts[0];
            let value = parts.slice(1).join(' ').replace(/^["']|["']$/g, '');

            // Try to parse as number
            const numValue = parseFloat(value);
            this.variables[varName] = isNaN(numValue) ? value : numValue;
          }
        }

        // expr command (mathematical expression)
        else if (trimmed.startsWith('expr ')) {
          const expression = trimmed.substring(5).trim().replace(/^{|}$/g, '');

          // Variable substitution
          const substituted = expression.replace(/\$(\w+)/g, (match, varName) => {
            return this.variables[varName] !== undefined ? this.variables[varName] : 0;
          });

          try {
            const evalResult = eval(substituted);
            output.push(String(evalResult));
          } catch (e) {
            output.push(`Error in expr: ${e.message}`);
          }
        }

        // incr command (increment)
        else if (trimmed.startsWith('incr ')) {
          const parts = trimmed.substring(5).trim().split(/\s+/);
          const varName = parts[0];
          const increment = parts.length > 1 ? parseInt(parts[1]) : 1;

          if (this.variables[varName] !== undefined) {
            this.variables[varName] += increment;
          } else {
            this.variables[varName] = increment;
          }
        }

        // append command
        else if (trimmed.startsWith('append ')) {
          const parts = trimmed.substring(7).trim().split(/\s+/);
          const varName = parts[0];
          const value = parts.slice(1).join(' ').replace(/^["']|["']$/g, '');

          if (this.variables[varName] !== undefined) {
            this.variables[varName] += value;
          } else {
            this.variables[varName] = value;
          }
        }

        // string command
        else if (trimmed.startsWith('string ')) {
          const parts = trimmed.substring(7).trim().split(/\s+/);
          const subcommand = parts[0];

          if (subcommand === 'length') {
            const str = parts.slice(1).join(' ').replace(/^["']|["']$/g, '');
            const len = str.replace(/\$(\w+)/g, (match, varName) => {
              return this.variables[varName] || '';
            }).length;
            output.push(String(len));
          }
        }
      }

      result.output = [
        '==================================================',
        'TCL Output:',
        '==================================================',
        '',
        output.join('\n') || '(no output)',
        '',
        '==================================================',
        'Variables:',
        '==================================================',
        Object.keys(this.variables).length > 0
          ? Object.entries(this.variables).map(([k, v]) => `${k} = ${v}`).join('\n')
          : '(no variables)',
        '',
        '==================================================',
        'Supported TCL Commands:',
        '==================================================',
        '• puts - Output text',
        '• set - Set variable',
        '• expr - Evaluate expression',
        '• incr - Increment variable',
        '• append - Append to variable',
        '• string - String operations',
        '',
        'Note: Basic TCL interpreter for educational use.',
      ].join('\n');

      result.returnValue = output.join('\n');
      result.success = true;

      this.log('TCL code executed', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nTCL execution failed.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of TCL runtime
   */
  async dispose() {
    this.variables = {};
    this.loaded = false;
    this.log('TCL runtime disposed', 'info');
  }

  /**
   * Get information about TCL runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'TCL',
      version: '8.x compatible (basic)',
      size: '0KB (native)',
      features: [
        'Variable management (set)',
        'Output (puts)',
        'Expressions (expr)',
        'Increment (incr)',
        'String operations',
        'Variable substitution',
      ],
      limitations: [
        'Basic interpreter only',
        'No procedures',
        'No control structures (if/while/for)',
        'No arrays or lists',
        'No file I/O',
        'Educational purposes',
      ],
      documentation: 'https://www.tcl.tk/man/',
    };
  }
}
