/**
 * JSONRuntime - JSON formatting, validation, and processing
 *
 * Validates JSON syntax, formats output, and provides analysis.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class JSONRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('json', {
      version: 'Native JSON',
      ...config,
    });

    // JSON runtime is always loaded (native browser support)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for JSON since it's native)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('JSON runtime ready', 'info');
  }

  /**
   * Execute JSON code (parse, validate, and format)
   *
   * @param {string} code - JSON code to process
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Parse JSON
      const parsed = JSON.parse(code);

      // Analyze JSON structure
      const stats = this.analyzeJSON(parsed, code);

      // Format JSON nicely
      const formatted = JSON.stringify(parsed, null, 2);

      // Build output
      const output = [
        '==================================================',
        'JSON Validation: ✓ VALID',
        '==================================================',
        '',
        'Structure Analysis:',
        `• Type: ${stats.type}`,
        `• Keys: ${stats.keys}`,
        `• Arrays: ${stats.arrays}`,
        `• Objects: ${stats.objects}`,
        `• Strings: ${stats.strings}`,
        `• Numbers: ${stats.numbers}`,
        `• Booleans: ${stats.booleans}`,
        `• Nulls: ${stats.nulls}`,
        `• Total Values: ${stats.total}`,
        `• Max Depth: ${stats.maxDepth}`,
        '',
        'Size:',
        `• Original: ${code.length} bytes`,
        `• Formatted: ${formatted.length} bytes`,
        `• Difference: ${formatted.length - code.length > 0 ? '+' : ''}${formatted.length - code.length} bytes`,
        '',
        '==================================================',
        'Formatted JSON:',
        '==================================================',
        '',
        formatted,
        '',
        '==================================================',
      ].join('\n');

      result.output = output;
      result.returnValue = {
        parsed,
        formatted,
        stats,
        valid: true,
      };
      result.success = true;

      this.log(`JSON validated and formatted (${stats.total} values)`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;

      // Try to provide helpful error message with line/column
      let errorMessage = error.message;
      const match = errorMessage.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const lines = code.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        errorMessage = `${errorMessage}\nAt line ${line}, column ${column}`;

        // Show context
        const codeLines = code.split('\n');
        if (line > 0 && line <= codeLines.length) {
          errorMessage += `\n\n${line - 1}: ${codeLines[line - 2] || ''}`;
          errorMessage += `\n${line}: ${codeLines[line - 1]}`;
          errorMessage += `\n${' '.repeat(String(line).length)}  ${' '.repeat(column - 1)}^`;
          errorMessage += `\n${line + 1}: ${codeLines[line] || ''}`;
        }
      }

      result.output = [
        '==================================================',
        'JSON Validation: ✗ INVALID',
        '==================================================',
        '',
        'Error:',
        errorMessage,
        '',
        '==================================================',
        'Common JSON Errors:',
        '==================================================',
        '• Trailing commas in arrays or objects',
        '• Unquoted property names',
        '• Single quotes instead of double quotes',
        '• Missing closing brackets or braces',
        '• Extra commas',
        '• Comments (not allowed in JSON)',
        '',
        '==================================================',
      ].join('\n');

      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Analyze JSON structure
   *
   * @param {any} data - Parsed JSON data
   * @param {string} code - Original JSON string
   * @returns {object} Analysis statistics
   */
  analyzeJSON(data, code) {
    const stats = {
      type: Array.isArray(data) ? 'array' : typeof data,
      keys: 0,
      arrays: 0,
      objects: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      total: 0,
      maxDepth: 0,
    };

    const analyze = (value, depth = 0) => {
      stats.total++;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (value === null) {
        stats.nulls++;
      } else if (Array.isArray(value)) {
        stats.arrays++;
        value.forEach(item => analyze(item, depth + 1));
      } else if (typeof value === 'object') {
        stats.objects++;
        const keys = Object.keys(value);
        stats.keys += keys.length;
        keys.forEach(key => analyze(value[key], depth + 1));
      } else if (typeof value === 'string') {
        stats.strings++;
      } else if (typeof value === 'number') {
        stats.numbers++;
      } else if (typeof value === 'boolean') {
        stats.booleans++;
      }
    };

    analyze(data);

    return stats;
  }

  /**
   * Dispose of JSON runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('JSON runtime disposed', 'info');
  }

  /**
   * Get information about JSON runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'JSON (Native)',
      version: 'ES2015+',
      size: '0KB (native)',
      features: [
        'JSON parsing and validation',
        'Automatic formatting',
        'Structure analysis',
        'Depth calculation',
        'Type counting',
        'Size comparison',
        'Detailed error messages',
        'Line/column error reporting',
      ],
      limitations: [
        'Standard JSON only (no comments)',
        'No JSON5 or extended syntax',
        'No circular reference support',
      ],
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON',
    };
  }
}
