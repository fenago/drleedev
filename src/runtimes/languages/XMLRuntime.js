/**
 * XMLRuntime - XML validation and analysis
 *
 * Validates XML syntax, checks for well-formedness, and provides structure analysis.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class XMLRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('xml', {
      version: 'XML 1.0',
      ...config,
    });

    // XML runtime is always loaded (native browser support)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for XML since it's native)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('XML runtime ready', 'info');
  }

  /**
   * Execute XML code (validate and analyze)
   *
   * @param {string} code - XML code to process
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
      // Parse XML using DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(code, 'text/xml');

      // Check for parser errors
      const parserError = xmlDoc.querySelector('parsererror');

      if (parserError) {
        // Extract error message
        const errorText = parserError.textContent || parserError.innerText;
        throw new Error(errorText);
      }

      // Analyze XML structure
      const stats = this.analyzeXML(code, xmlDoc);

      // Format XML nicely
      const formatted = this.formatXML(code);

      // Check for well-formedness issues
      const issues = this.checkXMLIssues(code, xmlDoc);

      // Build output
      const output = [
        '==================================================',
        'XML Validation: ✓ WELL-FORMED',
        '==================================================',
        '',
        'Document Structure:',
        `• Total Lines: ${stats.lines}`,
        `• Total Characters: ${stats.chars}`,
        `• Root Element: ${stats.rootElement}`,
        `• Total Elements: ${stats.totalElements}`,
        `• Unique Tags: ${stats.uniqueTags}`,
        `• Max Depth: ${stats.maxDepth}`,
        '',
        'Components:',
        `• Elements: ${stats.elements}`,
        `• Attributes: ${stats.attributes}`,
        `• Text Nodes: ${stats.textNodes}`,
        `• Comments: ${stats.comments}`,
        `• CDATA Sections: ${stats.cdataSections}`,
        `• Processing Instructions: ${stats.processingInstructions}`,
        '',
        'Namespaces:',
        `• Namespace Declarations: ${stats.namespaces}`,
        `• Prefixed Elements: ${stats.prefixedElements}`,
        '',
        '==================================================',
        'Well-formedness Check:',
        '==================================================',
      ];

      // Add issues if any
      if (issues.length > 0) {
        issues.forEach(issue => {
          output.push(`${issue.severity === 'error' ? '❌' : '⚠️'}  ${issue.message}`);
        });
      } else {
        output.push('✓  Document is well-formed with no issues');
      }

      output.push('');
      output.push('==================================================');
      output.push('Formatted XML:');
      output.push('==================================================');
      output.push('');
      output.push(formatted);
      output.push('');
      output.push('==================================================');

      result.output = output.join('\n');
      result.returnValue = {
        stats,
        issues,
        formatted,
        valid: true,
        wellFormed: true,
      };
      result.success = true;

      this.log(`XML validated (${stats.totalElements} elements)`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;

      // Try to extract line and column information from error message
      let errorMessage = error.message;
      const lineMatch = errorMessage.match(/line (\d+)/i);
      const colMatch = errorMessage.match(/column (\d+)/i);

      let lineInfo = '';
      if (lineMatch || colMatch) {
        const line = lineMatch ? lineMatch[1] : '?';
        const col = colMatch ? colMatch[1] : '?';
        lineInfo = `At line ${line}, column ${col}`;

        // Show context if we have a line number
        if (lineMatch) {
          const lineNum = parseInt(lineMatch[1]);
          const lines = code.split('\n');
          if (lineNum > 0 && lineNum <= lines.length) {
            lineInfo += '\n\nContext:';
            if (lineNum > 1) {
              lineInfo += `\n${lineNum - 1}: ${lines[lineNum - 2]}`;
            }
            lineInfo += `\n${lineNum}: ${lines[lineNum - 1]}`;
            if (colMatch) {
              const colNum = parseInt(colMatch[1]);
              lineInfo += `\n${' '.repeat(String(lineNum).length)}  ${' '.repeat(colNum - 1)}^`;
            }
            if (lineNum < lines.length) {
              lineInfo += `\n${lineNum + 1}: ${lines[lineNum]}`;
            }
          }
        }
      }

      result.output = [
        '==================================================',
        'XML Validation: ✗ NOT WELL-FORMED',
        '==================================================',
        '',
        'Error:',
        errorMessage,
        lineInfo ? `\n${lineInfo}` : '',
        '',
        '==================================================',
        'Common XML Errors:',
        '==================================================',
        '• Unclosed tags (e.g., <element> without </element>)',
        '• Mismatched opening and closing tags',
        '• Missing XML declaration',
        '• Invalid characters in tag names',
        '• Unescaped special characters (&, <, >, ", \')',
        '• Missing quotes around attribute values',
        '• Multiple root elements',
        '• Improperly nested elements',
        '',
        '==================================================',
        'XML Requirements:',
        '==================================================',
        '• Must have exactly one root element',
        '• All tags must be properly closed',
        '• Tags are case-sensitive',
        '• Attribute values must be quoted',
        '• Elements must be properly nested',
        '• Special characters must be escaped',
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
   * Analyze XML structure
   *
   * @param {string} code - XML code
   * @param {Document} xmlDoc - Parsed XML document
   * @returns {object} Analysis statistics
   */
  analyzeXML(code, xmlDoc) {
    const stats = {
      lines: code.split('\n').length,
      chars: code.length,
      rootElement: xmlDoc.documentElement ? xmlDoc.documentElement.nodeName : 'none',
      totalElements: 0,
      uniqueTags: new Set(),
      maxDepth: 0,
      elements: 0,
      attributes: 0,
      textNodes: 0,
      comments: 0,
      cdataSections: 0,
      processingInstructions: 0,
      namespaces: (code.match(/xmlns[:\w]*/g) || []).length,
      prefixedElements: (code.match(/<\w+:\w+/g) || []).length,
    };

    const analyzeNode = (node, depth = 0) => {
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (node.nodeType === 1) { // Element node
        stats.totalElements++;
        stats.elements++;
        stats.uniqueTags.add(node.nodeName);
        stats.attributes += node.attributes.length;
      } else if (node.nodeType === 3) { // Text node
        if (node.nodeValue.trim()) {
          stats.textNodes++;
        }
      } else if (node.nodeType === 8) { // Comment node
        stats.comments++;
      } else if (node.nodeType === 4) { // CDATA section
        stats.cdataSections++;
      } else if (node.nodeType === 7) { // Processing instruction
        stats.processingInstructions++;
      }

      // Recursively analyze child nodes
      for (let i = 0; i < node.childNodes.length; i++) {
        analyzeNode(node.childNodes[i], depth + 1);
      }
    };

    analyzeNode(xmlDoc);

    stats.uniqueTags = stats.uniqueTags.size;

    return stats;
  }

  /**
   * Check for XML well-formedness issues
   *
   * @param {string} code - XML code
   * @param {Document} xmlDoc - Parsed XML document
   * @returns {Array} List of issues found
   */
  checkXMLIssues(code, xmlDoc) {
    const issues = [];

    // Check for XML declaration
    if (!code.trim().startsWith('<?xml')) {
      issues.push({
        severity: 'warning',
        message: 'Missing XML declaration (<?xml version="1.0"?>)',
      });
    }

    // Check for encoding declaration
    if (!code.includes('encoding=')) {
      issues.push({
        severity: 'info',
        message: 'No encoding specified in XML declaration',
      });
    }

    // Check for empty elements
    const emptyElements = (code.match(/<(\w+)>\s*<\/\1>/g) || []).length;
    if (emptyElements > 0) {
      issues.push({
        severity: 'info',
        message: `${emptyElements} empty element(s) found (could use self-closing syntax)`,
      });
    }

    // Check for mixed content patterns
    const allElements = xmlDoc.getElementsByTagName('*');
    let mixedContentCount = 0;

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      let hasElementChild = false;
      let hasTextChild = false;

      for (let j = 0; j < element.childNodes.length; j++) {
        const child = element.childNodes[j];
        if (child.nodeType === 1) hasElementChild = true;
        if (child.nodeType === 3 && child.nodeValue.trim()) hasTextChild = true;
      }

      if (hasElementChild && hasTextChild) {
        mixedContentCount++;
      }
    }

    if (mixedContentCount > 0) {
      issues.push({
        severity: 'info',
        message: `${mixedContentCount} element(s) with mixed content (text and elements)`,
      });
    }

    // Check for redundant whitespace
    if (/>\s{3,}</g.test(code)) {
      issues.push({
        severity: 'info',
        message: 'Excessive whitespace detected between elements',
      });
    }

    return issues;
  }

  /**
   * Format XML code with proper indentation
   *
   * @param {string} code - XML code
   * @returns {string} Formatted XML
   */
  formatXML(code) {
    // Basic XML formatting with indentation
    let formatted = code;
    let indent = 0;
    const lines = [];

    // Remove extra whitespace between tags
    formatted = formatted.replace(/>\s+</g, '><');

    // Split by tags
    const parts = formatted.split(/(<[^>]+>)/g).filter(s => s.trim());

    parts.forEach(part => {
      if (part.startsWith('<?')) {
        // XML declaration or processing instruction
        lines.push(part);
      } else if (part.startsWith('<!--')) {
        // Comment
        lines.push('  '.repeat(indent) + part);
      } else if (part.startsWith('</')) {
        // Closing tag - decrease indent before adding
        indent = Math.max(0, indent - 1);
        lines.push('  '.repeat(indent) + part);
      } else if (part.startsWith('<') && part.endsWith('/>')) {
        // Self-closing tag
        lines.push('  '.repeat(indent) + part);
      } else if (part.startsWith('<')) {
        // Opening tag
        lines.push('  '.repeat(indent) + part);
        indent++;
      } else {
        // Text content
        const trimmed = part.trim();
        if (trimmed) {
          lines.push('  '.repeat(indent) + trimmed);
        }
      }
    });

    return lines.join('\n');
  }

  /**
   * Dispose of XML runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('XML runtime disposed', 'info');
  }

  /**
   * Get information about XML runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'XML (Native)',
      version: 'XML 1.0',
      size: '0KB (native)',
      features: [
        'XML syntax validation',
        'Well-formedness checking',
        'Structure analysis',
        'Element and attribute counting',
        'Namespace detection',
        'CDATA and comment detection',
        'Processing instruction support',
        'Automatic formatting',
        'Detailed error messages with line numbers',
      ],
      limitations: [
        'No DTD validation',
        'No XSD schema validation',
        'No XPath support in this runtime',
        'Basic formatting only',
        'Cannot validate against external schemas',
      ],
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/API/DOMParser',
    };
  }
}
