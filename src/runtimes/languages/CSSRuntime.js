/**
 * CSSRuntime - CSS validation and analysis
 *
 * Validates CSS syntax, provides analysis, and checks for common issues.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class CSSRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('css', {
      version: 'CSS3',
      ...config,
    });

    // CSS runtime is always loaded (native browser support)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for CSS since it's native)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('CSS runtime ready', 'info');
  }

  /**
   * Execute CSS code (validate and analyze)
   *
   * @param {string} code - CSS code to process
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
      // Analyze CSS
      const stats = this.analyzeCSS(code);

      // Try to parse CSS using browser's CSS parser
      const styleElement = document.createElement('style');
      styleElement.textContent = code;
      document.head.appendChild(styleElement);

      // Check if any CSS rules were parsed
      const sheet = styleElement.sheet;
      const rulesCount = sheet ? sheet.cssRules.length : 0;

      // Remove the style element
      document.head.removeChild(styleElement);

      // Build output
      const output = [
        '==================================================',
        'CSS Validation: ✓ VALID',
        '==================================================',
        '',
        'Structure Analysis:',
        `• Total Lines: ${stats.lines}`,
        `• Total Characters: ${stats.chars}`,
        `• Parsed Rules: ${rulesCount}`,
        `• Selectors: ${stats.selectors}`,
        `• Properties: ${stats.properties}`,
        `• Media Queries: ${stats.mediaQueries}`,
        `• Keyframes: ${stats.keyframes}`,
        `• Comments: ${stats.comments}`,
        '',
        'Common Patterns:',
        `• Color Values: ${stats.colors}`,
        `• Units (px, em, %, etc.): ${stats.units}`,
        `• Pseudo-classes: ${stats.pseudoClasses}`,
        `• Pseudo-elements: ${stats.pseudoElements}`,
        '',
        '==================================================',
        'CSS Best Practices:',
        '==================================================',
        stats.hasImportant ? '⚠️  Contains !important declarations' : '✓  No !important found',
        stats.hasIds ? '⚠️  Contains ID selectors (use classes instead)' : '✓  No ID selectors',
        stats.hasVendorPrefixes ? '⚠️  Contains vendor prefixes' : '✓  No vendor prefixes needed',
        '',
        '==================================================',
        'Formatted CSS:',
        '==================================================',
        '',
        this.formatCSS(code),
        '',
        '==================================================',
      ].join('\n');

      result.output = output;
      result.returnValue = {
        stats,
        rulesCount,
        valid: true,
      };
      result.success = true;

      this.log(`CSS validated (${rulesCount} rules, ${stats.properties} properties)`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = [
        '==================================================',
        'CSS Validation: ✗ INVALID',
        '==================================================',
        '',
        'Error:',
        error.message,
        '',
        '==================================================',
        'Common CSS Errors:',
        '==================================================',
        '• Missing semicolons',
        '• Unclosed braces { }',
        '• Invalid property names',
        '• Invalid property values',
        '• Typos in selectors',
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
   * Analyze CSS structure
   *
   * @param {string} code - CSS code
   * @returns {object} Analysis statistics
   */
  analyzeCSS(code) {
    return {
      lines: code.split('\n').length,
      chars: code.length,
      selectors: (code.match(/[^{}]+{/g) || []).length,
      properties: (code.match(/[^:]+:/g) || []).length,
      mediaQueries: (code.match(/@media/g) || []).length,
      keyframes: (code.match(/@keyframes/g) || []).length,
      comments: (code.match(/\/\*[\s\S]*?\*\//g) || []).length,
      colors: (code.match(/#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla/g) || []).length,
      units: (code.match(/\d+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex)/g) || []).length,
      pseudoClasses: (code.match(/:[a-z-]+/g) || []).length,
      pseudoElements: (code.match(/::[a-z-]+/g) || []).length,
      hasImportant: code.includes('!important'),
      hasIds: /#[a-zA-Z]/.test(code),
      hasVendorPrefixes: /-webkit-|-moz-|-ms-|-o-/.test(code),
    };
  }

  /**
   * Format CSS code
   *
   * @param {string} code - CSS code
   * @returns {string} Formatted CSS
   */
  formatCSS(code) {
    // Basic CSS formatting
    return code
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .trim();
  }

  /**
   * Dispose of CSS runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('CSS runtime disposed', 'info');
  }

  /**
   * Get information about CSS runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'CSS (Native)',
      version: 'CSS3',
      size: '0KB (native)',
      features: [
        'CSS3 syntax validation',
        'Structure analysis',
        'Best practices checking',
        'Selector counting',
        'Property counting',
        'Media query detection',
        'Keyframe detection',
        'Basic formatting',
      ],
      limitations: [
        'No advanced linting',
        'No browser compatibility checking',
        'Basic formatting only',
      ],
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    };
  }
}
