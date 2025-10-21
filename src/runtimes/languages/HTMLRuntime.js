/**
 * HTMLRuntime - HTML validation and analysis
 *
 * Validates HTML syntax, provides structure analysis, and checks for common issues.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class HTMLRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('html', {
      version: 'HTML5',
      ...config,
    });

    // HTML runtime is always loaded (native browser support)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for HTML since it's native)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('HTML runtime ready', 'info');
  }

  /**
   * Execute HTML code (validate and analyze)
   *
   * @param {string} code - HTML code to process
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
      // Parse HTML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'text/html');

      // Check for parser errors
      const parserError = doc.querySelector('parsererror');

      if (parserError) {
        throw new Error('HTML parsing error: ' + parserError.textContent);
      }

      // Analyze HTML structure
      const stats = this.analyzeHTML(code, doc);

      // Format HTML nicely
      const formatted = this.formatHTML(code);

      // Check for common issues
      const issues = this.checkHTMLIssues(code, doc);

      // Build output
      const output = [
        '==================================================',
        'HTML Validation: ✓ VALID',
        '==================================================',
        '',
        'Document Structure:',
        `• Total Lines: ${stats.lines}`,
        `• Total Characters: ${stats.chars}`,
        `• Total Elements: ${stats.totalElements}`,
        `• Unique Tags: ${stats.uniqueTags}`,
        '',
        'Element Breakdown:',
        `• Div Elements: ${stats.divs}`,
        `• Span Elements: ${stats.spans}`,
        `• Paragraph Elements: ${stats.paragraphs}`,
        `• Headings (h1-h6): ${stats.headings}`,
        `• Links (a): ${stats.links}`,
        `• Images (img): ${stats.images}`,
        `• Forms: ${stats.forms}`,
        `• Input Fields: ${stats.inputs}`,
        `• Lists (ul/ol): ${stats.lists}`,
        `• List Items (li): ${stats.listItems}`,
        `• Tables: ${stats.tables}`,
        '',
        'Attributes:',
        `• ID Attributes: ${stats.ids}`,
        `• Class Attributes: ${stats.classes}`,
        `• Style Attributes: ${stats.inlineStyles}`,
        `• Data Attributes: ${stats.dataAttributes}`,
        '',
        'Semantic Elements:',
        `• Header: ${stats.semanticHeader}`,
        `• Nav: ${stats.semanticNav}`,
        `• Main: ${stats.semanticMain}`,
        `• Article: ${stats.semanticArticle}`,
        `• Section: ${stats.semanticSection}`,
        `• Aside: ${stats.semanticAside}`,
        `• Footer: ${stats.semanticFooter}`,
        '',
        '==================================================',
        'Best Practices & Issues:',
        '==================================================',
      ];

      // Add issues if any
      if (issues.length > 0) {
        issues.forEach(issue => {
          output.push(`${issue.severity === 'error' ? '❌' : '⚠️'}  ${issue.message}`);
        });
      } else {
        output.push('✓  No major issues detected');
      }

      output.push('');
      output.push('==================================================');
      output.push('Formatted HTML:');
      output.push('==================================================');
      output.push('');
      output.push(formatted);
      output.push('');
      output.push('==================================================');
      output.push('TIP: Copy formatted HTML to see proper indentation');
      output.push('==================================================');

      result.output = output.join('\n');
      result.returnValue = {
        stats,
        issues,
        formatted,
        valid: true,
      };
      result.success = true;

      this.log(`HTML validated (${stats.totalElements} elements)`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = [
        '==================================================',
        'HTML Validation: ✗ INVALID',
        '==================================================',
        '',
        'Error:',
        error.message,
        '',
        '==================================================',
        'Common HTML Errors:',
        '==================================================',
        '• Unclosed tags (e.g., <div> without </div>)',
        '• Misspelled tag names',
        '• Improperly nested elements',
        '• Missing required attributes',
        '• Invalid attribute values',
        '• Malformed HTML structure',
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
   * Analyze HTML structure
   *
   * @param {string} code - HTML code
   * @param {Document} doc - Parsed HTML document
   * @returns {object} Analysis statistics
   */
  analyzeHTML(code, doc) {
    const allElements = doc.getElementsByTagName('*');
    const tagNames = new Set();

    for (let i = 0; i < allElements.length; i++) {
      tagNames.add(allElements[i].tagName.toLowerCase());
    }

    return {
      lines: code.split('\n').length,
      chars: code.length,
      totalElements: allElements.length,
      uniqueTags: tagNames.size,
      divs: doc.getElementsByTagName('div').length,
      spans: doc.getElementsByTagName('span').length,
      paragraphs: doc.getElementsByTagName('p').length,
      headings: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      links: doc.getElementsByTagName('a').length,
      images: doc.getElementsByTagName('img').length,
      forms: doc.getElementsByTagName('form').length,
      inputs: doc.getElementsByTagName('input').length,
      lists: doc.querySelectorAll('ul, ol').length,
      listItems: doc.getElementsByTagName('li').length,
      tables: doc.getElementsByTagName('table').length,
      ids: doc.querySelectorAll('[id]').length,
      classes: doc.querySelectorAll('[class]').length,
      inlineStyles: doc.querySelectorAll('[style]').length,
      dataAttributes: Array.from(allElements).filter(el =>
        Array.from(el.attributes).some(attr => attr.name.startsWith('data-'))
      ).length,
      semanticHeader: doc.getElementsByTagName('header').length,
      semanticNav: doc.getElementsByTagName('nav').length,
      semanticMain: doc.getElementsByTagName('main').length,
      semanticArticle: doc.getElementsByTagName('article').length,
      semanticSection: doc.getElementsByTagName('section').length,
      semanticAside: doc.getElementsByTagName('aside').length,
      semanticFooter: doc.getElementsByTagName('footer').length,
    };
  }

  /**
   * Check for common HTML issues
   *
   * @param {string} code - HTML code
   * @param {Document} doc - Parsed HTML document
   * @returns {Array} List of issues found
   */
  checkHTMLIssues(code, doc) {
    const issues = [];

    // Check for images without alt attributes
    const imgsWithoutAlt = doc.querySelectorAll('img:not([alt])');
    if (imgsWithoutAlt.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${imgsWithoutAlt.length} image(s) missing alt attribute (accessibility issue)`,
      });
    }

    // Check for links without href
    const linksWithoutHref = doc.querySelectorAll('a:not([href])');
    if (linksWithoutHref.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${linksWithoutHref.length} link(s) missing href attribute`,
      });
    }

    // Check for inline styles
    const inlineStyles = doc.querySelectorAll('[style]');
    if (inlineStyles.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${inlineStyles.length} element(s) with inline styles (consider using CSS classes)`,
      });
    }

    // Check for deprecated tags
    const deprecatedTags = ['center', 'font', 'marquee', 'blink'];
    deprecatedTags.forEach(tag => {
      const found = doc.getElementsByTagName(tag).length;
      if (found > 0) {
        issues.push({
          severity: 'warning',
          message: `Deprecated <${tag}> tag found (${found} occurrence${found > 1 ? 's' : ''})`,
        });
      }
    });

    // Check for multiple h1 tags
    const h1Count = doc.getElementsByTagName('h1').length;
    if (h1Count > 1) {
      issues.push({
        severity: 'warning',
        message: `Multiple <h1> tags found (${h1Count}). Best practice: use only one per page`,
      });
    }

    // Check for forms without method
    const formsWithoutMethod = doc.querySelectorAll('form:not([method])');
    if (formsWithoutMethod.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${formsWithoutMethod.length} form(s) without method attribute`,
      });
    }

    // Check for inputs without labels
    const inputs = doc.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    let inputsWithoutLabels = 0;
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (!id || !doc.querySelector(`label[for="${id}"]`)) {
        inputsWithoutLabels++;
      }
    });
    if (inputsWithoutLabels > 0) {
      issues.push({
        severity: 'warning',
        message: `${inputsWithoutLabels} input(s) without associated label (accessibility issue)`,
      });
    }

    return issues;
  }

  /**
   * Format HTML code with proper indentation
   *
   * @param {string} code - HTML code
   * @returns {string} Formatted HTML
   */
  formatHTML(code) {
    // Basic HTML formatting with indentation
    let formatted = code;
    let indent = 0;
    const lines = [];

    // Remove extra whitespace
    formatted = formatted.replace(/>\s+</g, '><');

    // Split by tags
    const tags = formatted.split(/(<[^>]+>)/g).filter(s => s.trim());

    tags.forEach(tag => {
      if (tag.startsWith('</')) {
        // Closing tag - decrease indent before adding
        indent = Math.max(0, indent - 1);
        lines.push('  '.repeat(indent) + tag);
      } else if (tag.startsWith('<') && tag.endsWith('/>')) {
        // Self-closing tag
        lines.push('  '.repeat(indent) + tag);
      } else if (tag.startsWith('<')) {
        // Opening tag
        lines.push('  '.repeat(indent) + tag);
        // Don't indent for inline tags
        if (!/<(br|img|input|hr|meta|link)[\s>]/i.test(tag)) {
          indent++;
        }
      } else {
        // Text content
        const trimmed = tag.trim();
        if (trimmed) {
          lines.push('  '.repeat(indent) + trimmed);
        }
      }
    });

    return lines.join('\n');
  }

  /**
   * Dispose of HTML runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('HTML runtime disposed', 'info');
  }

  /**
   * Get information about HTML runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'HTML (Native)',
      version: 'HTML5',
      size: '0KB (native)',
      features: [
        'HTML5 syntax validation',
        'Structure analysis',
        'Element counting by type',
        'Attribute analysis',
        'Semantic HTML detection',
        'Accessibility checking',
        'Best practices validation',
        'Deprecated tag detection',
        'Automatic formatting',
      ],
      limitations: [
        'Basic formatting only',
        'No advanced linting',
        'No browser-specific feature checking',
        'Cannot validate external resources',
      ],
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    };
  }
}
