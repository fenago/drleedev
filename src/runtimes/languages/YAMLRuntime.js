/**
 * YAMLRuntime - YAML parsing and validation
 *
 * Parses YAML files, validates syntax, and converts to JSON for display.
 */
import BaseRuntime from '../BaseRuntime.js';
import jsyaml from 'js-yaml';

export default class YAMLRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('yaml', {
      version: 'js-yaml 4.x',
      ...config,
    });

    // YAML runtime is always loaded (uses js-yaml library)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for YAML since it's already loaded)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('YAML runtime ready', 'info');
  }

  /**
   * Execute YAML code (parse and validate)
   *
   * @param {string} code - YAML code to process
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
      // Parse YAML
      const parsed = jsyaml.load(code, {
        schema: jsyaml.DEFAULT_SCHEMA,
        json: false
      });

      // Analyze YAML structure
      const stats = this.analyzeYAML(code, parsed);

      // Convert to JSON for display
      const json = JSON.stringify(parsed, null, 2);

      // Build output
      const output = [
        '==================================================',
        'YAML Validation: ✓ VALID',
        '==================================================',
        '',
        'Document Analysis:',
        `• Type: ${stats.type}`,
        `• Lines: ${stats.lines}`,
        `• Characters: ${stats.chars}`,
        '',
        'Structure:',
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
        'YAML Features:',
        `• Comments: ${stats.comments}`,
        `• Anchors/Aliases: ${stats.anchors}`,
        `• Multi-line Strings: ${stats.multilineStrings}`,
        '',
        '==================================================',
        'Converted to JSON:',
        '==================================================',
        '',
        json,
        '',
        '==================================================',
        'Size Comparison:',
        '==================================================',
        `• YAML: ${code.length} bytes`,
        `• JSON: ${json.length} bytes`,
        `• Difference: ${json.length - code.length > 0 ? '+' : ''}${json.length - code.length} bytes`,
        '',
        '==================================================',
      ].join('\n');

      result.output = output;
      result.returnValue = {
        parsed,
        json,
        stats,
        valid: true,
      };
      result.success = true;

      this.log(`YAML validated and parsed (${stats.total} values)`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;

      // Extract line and column information from error
      let errorMessage = error.message;
      let lineInfo = '';

      if (error.mark) {
        const { line, column, snippet } = error.mark;
        lineInfo = `At line ${line + 1}, column ${column + 1}`;

        if (snippet) {
          errorMessage += `\n\n${snippet}`;
        }
      }

      result.output = [
        '==================================================',
        'YAML Validation: ✗ INVALID',
        '==================================================',
        '',
        'Error:',
        errorMessage,
        lineInfo ? `\n${lineInfo}` : '',
        '',
        '==================================================',
        'Common YAML Errors:',
        '==================================================',
        '• Incorrect indentation (use spaces, not tabs)',
        '• Missing space after colon in key-value pairs',
        '• Unquoted strings containing special characters',
        '• Inconsistent indentation levels',
        '• Invalid anchor or alias references',
        '• Mixing tabs and spaces',
        '• Missing document separator (---)',
        '',
        '==================================================',
        'YAML Tips:',
        '==================================================',
        '• Use 2 spaces for indentation',
        '• Always put a space after colons',
        '• Quote strings with special characters',
        '• Use | or > for multi-line strings',
        '• Comments start with #',
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
   * Analyze YAML structure
   *
   * @param {string} code - YAML code
   * @param {any} data - Parsed YAML data
   * @returns {object} Analysis statistics
   */
  analyzeYAML(code, data) {
    const stats = {
      type: Array.isArray(data) ? 'array' : typeof data,
      lines: code.split('\n').length,
      chars: code.length,
      keys: 0,
      arrays: 0,
      objects: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      total: 0,
      maxDepth: 0,
      comments: (code.match(/^\s*#/gm) || []).length,
      anchors: (code.match(/&\w+/g) || []).length + (code.match(/\*\w+/g) || []).length,
      multilineStrings: (code.match(/[|>][-+]?/g) || []).length,
    };

    const analyze = (value, depth = 0) => {
      stats.total++;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (value === null || value === undefined) {
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
   * Dispose of YAML runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('YAML runtime disposed', 'info');
  }

  /**
   * Get information about YAML runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'YAML (js-yaml)',
      version: '4.x',
      size: '~50KB',
      features: [
        'YAML 1.2 parsing and validation',
        'Automatic type detection',
        'Support for anchors and aliases',
        'Multi-line string support',
        'Comment preservation in analysis',
        'JSON conversion',
        'Structure analysis',
        'Depth calculation',
        'Detailed error messages with line numbers',
      ],
      limitations: [
        'Cannot preserve comments in output',
        'No custom tag support by default',
        'No YAML schema customization in this runtime',
      ],
      documentation: 'https://github.com/nodeca/js-yaml',
    };
  }
}
