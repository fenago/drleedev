/**
 * MarkdownRuntime - Markdown rendering and processing
 *
 * Renders Markdown to HTML and displays formatted output.
 */
import BaseRuntime from '../BaseRuntime.js';
import { marked } from 'marked';

export default class MarkdownRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('markdown', {
      version: 'Marked.js 12.x',
      ...config,
    });

    // Markdown runtime is always loaded (uses marked.js library)
    this.loaded = true;
  }

  /**
   * Load runtime (no-op for Markdown since it's already loaded)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('Markdown runtime ready', 'info');
  }

  /**
   * Execute Markdown code (render to HTML)
   *
   * @param {string} code - Markdown code to render
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
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
      });

      // Parse markdown to HTML
      const html = marked.parse(code);

      // Get stats
      const lines = code.split('\n').length;
      const words = code.split(/\s+/).filter(w => w.length > 0).length;
      const chars = code.length;

      // Count markdown elements
      const headers = (code.match(/^#{1,6}\s/gm) || []).length;
      const links = (code.match(/\[.*?\]\(.*?\)/g) || []).length;
      const images = (code.match(/!\[.*?\]\(.*?\)/g) || []).length;
      const codeBlocks = (code.match(/```/g) || []).length / 2;
      const lists = (code.match(/^[\*\-\+]\s/gm) || []).length;

      // Build output with stats
      const stats = [
        '==================================================',
        'Markdown Stats:',
        '==================================================',
        `Lines: ${lines}`,
        `Words: ${words}`,
        `Characters: ${chars}`,
        '',
        'Elements:',
        `• Headers: ${headers}`,
        `• Links: ${links}`,
        `• Images: ${images}`,
        `• Code Blocks: ${codeBlocks}`,
        `• List Items: ${lists}`,
        '',
        '==================================================',
        'Rendered HTML Preview:',
        '==================================================',
        '',
        html,
        '',
        '==================================================',
        'TIP: Use the Preview button (👁️) to see formatted output',
        '==================================================',
      ].join('\n');

      result.output = stats;
      result.returnValue = {
        html,
        stats: {
          lines,
          words,
          chars,
          headers,
          links,
          images,
          codeBlocks,
          lists,
        },
      };
      result.success = true;

      this.log(`Rendered ${words} words to HTML`, 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Markdown Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of Markdown runtime
   */
  async dispose() {
    this.loaded = false;
    this.log('Markdown runtime disposed', 'info');
  }

  /**
   * Get information about Markdown runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Markdown (Marked.js)',
      version: '12.x',
      size: '~50KB',
      features: [
        'GitHub Flavored Markdown (GFM)',
        'Headers and formatting',
        'Lists (ordered and unordered)',
        'Links and images',
        'Code blocks with syntax highlighting',
        'Tables',
        'Blockquotes',
        'Horizontal rules',
        'Inline HTML',
      ],
      limitations: [
        'No real-time preview in output (use Preview button)',
        'Statistics only',
      ],
      documentation: 'https://marked.js.org',
    };
  }
}
