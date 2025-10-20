/**
 * PreviewPanel - Preview panel for markdown and HTML files
 *
 * Displays rendered previews of markdown and HTML content.
 */
import { marked } from 'marked';

export default class PreviewPanel {
  /**
   * @param {HTMLElement} container - DOM container for the preview panel
   */
  constructor(container) {
    this.container = container;
    this.previewContainer = null;
    this.currentMode = null; // 'markdown' | 'html' | null
    this.isVisible = false;
  }

  /**
   * Initialize the preview panel
   */
  init() {
    // Create preview container
    this.previewContainer = document.createElement('div');
    this.previewContainer.id = 'preview-panel';
    this.previewContainer.className = 'preview-panel';
    this.previewContainer.style.display = 'none';

    // Create preview content area
    const previewContent = document.createElement('div');
    previewContent.id = 'preview-content';
    previewContent.className = 'preview-content';

    this.previewContainer.appendChild(previewContent);
    this.container.appendChild(this.previewContainer);

    console.log('Preview panel initialized');
  }

  /**
   * Show markdown preview
   *
   * @param {string} markdownContent - Markdown content to render
   */
  showMarkdown(markdownContent) {
    this.currentMode = 'markdown';

    try {
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
      });

      // Parse markdown to HTML
      const html = marked.parse(markdownContent);

      // Display rendered HTML
      const previewContent = document.getElementById('preview-content');
      if (previewContent) {
        previewContent.innerHTML = html;
        previewContent.className = 'preview-content markdown-preview';
      }

      this.show();
    } catch (error) {
      console.error('Failed to render markdown:', error);
      this.showError('Failed to render markdown preview');
    }
  }

  /**
   * Show HTML preview
   *
   * @param {string} htmlContent - HTML content to render
   */
  showHTML(htmlContent) {
    this.currentMode = 'html';

    try {
      // Create an iframe for safe HTML rendering
      const previewContent = document.getElementById('preview-content');
      if (previewContent) {
        previewContent.innerHTML = '';
        previewContent.className = 'preview-content html-preview';

        const iframe = document.createElement('iframe');
        iframe.className = 'html-preview-iframe';
        iframe.sandbox = 'allow-scripts allow-same-origin';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        previewContent.appendChild(iframe);

        // Write HTML content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }

      this.show();
    } catch (error) {
      console.error('Failed to render HTML:', error);
      this.showError('Failed to render HTML preview');
    }
  }

  /**
   * Show the preview panel
   */
  show() {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide the preview panel
   */
  hide() {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'none';
      this.isVisible = false;
      this.currentMode = null;
    }
  }

  /**
   * Toggle preview visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Clear preview content
   */
  clear() {
    const previewContent = document.getElementById('preview-content');
    if (previewContent) {
      previewContent.innerHTML = '';
    }
  }

  /**
   * Show error message in preview
   *
   * @param {string} message - Error message
   */
  showError(message) {
    const previewContent = document.getElementById('preview-content');
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="preview-error">
          <h3>Preview Error</h3>
          <p>${message}</p>
        </div>
      `;
      previewContent.className = 'preview-content';
    }
    this.show();
  }

  /**
   * Check if file should have preview
   *
   * @param {string} fileName - File name
   * @returns {boolean} True if file can be previewed
   */
  static canPreview(fileName) {
    if (!fileName) return false;

    const extension = fileName.split('.').pop().toLowerCase();
    return ['md', 'markdown', 'html', 'htm'].includes(extension);
  }

  /**
   * Get preview mode for file
   *
   * @param {string} fileName - File name
   * @returns {string|null} Preview mode ('markdown', 'html', or null)
   */
  static getPreviewMode(fileName) {
    if (!fileName) return null;

    const extension = fileName.split('.').pop().toLowerCase();

    if (['md', 'markdown'].includes(extension)) {
      return 'markdown';
    } else if (['html', 'htm'].includes(extension)) {
      return 'html';
    }

    return null;
  }
}
