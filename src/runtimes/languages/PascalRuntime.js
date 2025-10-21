/**
 * PascalRuntime - Pascal programming language
 *
 * Provides a simple Pascal interpreter for educational purposes.
 * Supports basic Pascal syntax and control structures.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class PascalRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('pascal', {
      version: 'Pascal (Educational)',
      ...config,
    });

    this.variables = {};
  }

  /**
   * Load Pascal runtime (no external dependencies)
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    this.log('Loading Pascal runtime...', 'info');
    this.loaded = true;
    this.log('Pascal runtime ready', 'success');
  }

  /**
   * Execute Pascal code
   *
   * @param {string} code - Pascal code to execute
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

      // Simple Pascal interpreter
      // Extract program name
      const programMatch = code.match(/program\s+(\w+);/i);
      const programName = programMatch ? programMatch[1] : 'Unknown';

      // Extract variable declarations
      const varMatch = code.match(/var\s+([\s\S]+?)begin/i);
      if (varMatch) {
        const varDecls = varMatch[1].split(';').filter(v => v.trim());
        varDecls.forEach(decl => {
          const parts = decl.split(':');
          if (parts.length === 2) {
            const vars = parts[0].split(',').map(v => v.trim());
            vars.forEach(v => {
              this.variables[v] = null;
            });
          }
        });
      }

      // Extract and execute begin...end block
      const beginMatch = code.match(/begin([\s\S]+?)end\./i);
      if (beginMatch) {
        const mainCode = beginMatch[1];

        // Process statements
        const statements = mainCode.split(';').filter(s => s.trim());

        statements.forEach(stmt => {
          stmt = stmt.trim();

          // WriteLn statement
          if (stmt.match(/writeln/i)) {
            const writeMatch = stmt.match(/writeln\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
            if (writeMatch) {
              output.push(writeMatch[1]);
            } else {
              // Variable output
              const varMatch = stmt.match(/writeln\s*\(\s*(\w+)\s*\)/i);
              if (varMatch && this.variables.hasOwnProperty(varMatch[1])) {
                output.push(String(this.variables[varMatch[1]]));
              }
            }
          }

          // Write statement (without newline)
          else if (stmt.match(/^write/i)) {
            const writeMatch = stmt.match(/write\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
            if (writeMatch) {
              output.push(writeMatch[1]);
            }
          }

          // Assignment statement
          else if (stmt.includes(':=')) {
            const [varName, expression] = stmt.split(':=').map(s => s.trim());
            // Simple evaluation - just handle numbers for now
            const numValue = parseFloat(expression);
            if (!isNaN(numValue)) {
              this.variables[varName] = numValue;
            } else if (expression.startsWith("'") || expression.startsWith('"')) {
              this.variables[varName] = expression.slice(1, -1);
            }
          }
        });
      }

      result.output = [
        '==================================================',
        `Pascal Program: ${programName}`,
        '==================================================',
        '',
        'Output:',
        output.join('\n') || '(no output)',
        '',
        '==================================================',
        'Note: Educational Pascal Interpreter',
        '==================================================',
        'Supports:',
        '• Program structure',
        '• Variable declarations',
        '• WriteLn/Write statements',
        '• Basic assignments',
        '',
        'Limitations:',
        '• No functions/procedures',
        '• No loops',
        '• No conditionals',
        '• Basic syntax only',
        '',
        'For full Pascal, use Free Pascal or Delphi.',
      ].join('\n');

      result.returnValue = output.join('\n');
      result.success = true;

      this.log('Pascal code executed', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nPascal execution failed.\nCheck syntax.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of Pascal runtime
   */
  async dispose() {
    this.variables = {};
    this.loaded = false;
    this.log('Pascal runtime disposed', 'info');
  }

  /**
   * Get information about Pascal runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Pascal (Educational)',
      version: 'Basic interpreter',
      size: '0KB (native)',
      features: [
        'Program structure',
        'Variable declarations',
        'WriteLn/Write output',
        'Basic assignments',
        'Educational purposes',
      ],
      limitations: [
        'Very limited functionality',
        'No functions or procedures',
        'No loops or conditionals',
        'No arrays or records',
        'Basic syntax only',
        'For learning purposes only',
      ],
      documentation: 'https://www.freepascal.org/docs.html',
    };
  }
}
