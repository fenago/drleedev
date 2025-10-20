/**
 * JupyterLiteRuntime.js
 *
 * JupyterLite notebook integration
 *
 * Features:
 * - Full Jupyter notebook environment in browser
 * - Python kernel via Pyodide
 * - Interactive notebooks with rich output
 * - Markdown cells, code cells
 *
 * Implementation:
 * - Uses iframe to embed JupyterLite
 * - CDN-hosted JupyterLite deployment
 * - Message passing for file sync
 *
 * Documentation: https://jupyterlite.readthedocs.io/
 */

import BaseRuntime from '../BaseRuntime.js';

export default class JupyterLiteRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('jupyterlite', {
      version: '0.6.4',
      localURL: '/jupyterlite/lab/index.html',
      ...config,
    });

    this.iframe = null;
    this.notebookWindow = null;
    this.messageHandlers = new Map();
  }

  /**
   * Load JupyterLite runtime and auto-navigate to it
   */
  async load() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    // Automatically navigate to JupyterLite
    this.log('Opening JupyterLite...', 'info');

    // Navigate to the local JupyterLite installation
    window.location.href = this.config.localURL;
  }

  /**
   * Create and configure JupyterLite iframe
   *
   * @returns {HTMLIFrameElement} Iframe element
   */
  createJupyterIframe() {
    // Find or create iframe container
    let container = document.getElementById('jupyterlite-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'jupyterlite-container';
      container.style.cssText = `
        position: fixed;
        top: 50px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        background: white;
        display: none;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;
      document.body.appendChild(container);
    }

    // Always ensure container is hidden when created
    container.style.display = 'none';
    container.style.visibility = 'hidden';
    container.style.opacity = '0';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'jupyterlite-iframe';
    // Open directly to notebooks interface with a new notebook
    iframe.src = `${this.config.cdnURL}notebooks/index.html?path=Untitled.ipynb`;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    iframe.allow = 'cross-origin-isolated';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-downloads allow-modals';

    container.innerHTML = '';
    container.appendChild(iframe);

    return iframe;
  }

  /**
   * Wait for iframe to finish loading
   *
   * @returns {Promise<void>}
   */
  waitForIframeLoad() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('JupyterLite iframe load timeout'));
      }, 60000); // 60 second timeout

      this.iframe.addEventListener('load', () => {
        clearTimeout(timeout);
        this.notebookWindow = this.iframe.contentWindow;
        resolve();
      }, { once: true });

      this.iframe.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      }, { once: true });
    });
  }

  /**
   * Execute code (not applicable for JupyterLite, opens notebook instead)
   *
   * @param {string} code - Code to execute (will be loaded as notebook)
   * @param {object} options - Execution options
   * @returns {object} Execution result
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('JupyterLite not loaded. Call load() first.');
    }

    const result = {
      success: true,
      output: [],
      executionTime: 0,
      error: null,
    };

    try {
      this.log('', 'stdout');
      this.log('🚀 Opening JupyterLite in a new tab...', 'info');
      this.log('', 'stdout');

      // Open JupyterLite in a new window/tab
      const jupyterURL = `${this.config.cdnURL}lab/index.html`;
      const newWindow = window.open(jupyterURL, '_blank', 'noopener,noreferrer');

      if (!newWindow) {
        throw new Error('Failed to open JupyterLite. Please allow pop-ups for this site.');
      }

      this.notebookWindow = newWindow;

      this.log('✓ JupyterLite opened in new tab!', 'success');
      this.log('', 'stdout');
      this.log('Features:', 'info');
      this.log('  • Full Jupyter notebook environment', 'stdout');
      this.log('  • Python 3.11 kernel (Pyodide)', 'stdout');
      this.log('  • Rich interactive outputs', 'stdout');
      this.log('  • Markdown and code cells', 'stdout');
      this.log('  • Scientific computing libraries (NumPy, Pandas, Matplotlib)', 'stdout');
      this.log('', 'stdout');
      this.log('💡 JupyterLite is running in a separate tab.', 'info');
      this.log('   Switch back to this tab to continue using DrLee IDE.', 'info');
      this.log('', 'stdout');

      // If code provided, show it in output
      if (code && code.trim()) {
        this.log('💡 Copy this code into a JupyterLite notebook cell:', 'info');
        this.log('', 'stdout');
        this.log(code, 'stdout');
        this.log('', 'stdout');
      }

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      this.logError(`Error opening JupyterLite: ${error.message}`);
    }

    return result;
  }

  /**
   * Show JupyterLite interface
   */
  showJupyter() {
    const container = document.getElementById('jupyterlite-container');
    if (container) {
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';

      // Add close button if it doesn't exist
      if (!container.querySelector('.jupyter-close-btn')) {
        this.addCloseButton(container);
      }

      // Add ESC key listener
      this.addEscapeListener();
    }
  }

  /**
   * Hide JupyterLite interface
   */
  hideJupyter() {
    const container = document.getElementById('jupyterlite-container');
    if (container) {
      container.style.display = 'none';
      container.style.visibility = 'hidden';
      container.style.opacity = '0';
    }
  }

  /**
   * Add close button to JupyterLite container
   *
   * @param {HTMLElement} container - Container element
   */
  addCloseButton(container) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'jupyter-close-btn';
    closeBtn.innerHTML = '× Close JupyterLite';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10001;
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: background 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#d32f2f';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#f44336';
    });

    closeBtn.addEventListener('click', () => {
      this.hideJupyter();
      this.log('JupyterLite closed', 'info');
    });

    container.appendChild(closeBtn);
  }

  /**
   * Add ESC key listener to close JupyterLite
   */
  addEscapeListener() {
    if (this.escapeHandler) return;

    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        const container = document.getElementById('jupyterlite-container');
        if (container && container.style.display === 'block') {
          this.hideJupyter();
          this.log('JupyterLite closed', 'info');
        }
      }
    };

    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Create a new notebook with content
   *
   * @param {string} content - Notebook content (Python code or JSON)
   * @param {string} name - Notebook name
   * @returns {Promise<void>}
   */
  async createNotebook(content, name = 'untitled.ipynb') {
    // This would require message passing to JupyterLite
    // For now, we just show the interface
    this.showJupyter();
    this.log(`Creating notebook: ${name}`, 'info');
  }

  /**
   * Dispose of JupyterLite runtime
   */
  async dispose() {
    if (this.iframe) {
      const container = this.iframe.parentElement;
      if (container) {
        container.remove();
      }
      this.iframe = null;
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    this.notebookWindow = null;
    this.loaded = false;
    this.log('JupyterLite runtime disposed', 'info');
  }

  /**
   * Get information about JupyterLite runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'JupyterLite',
      version: '0.2.0',
      size: '~15MB (first load)',
      features: [
        'Full Jupyter notebook environment',
        'Python 3.11 kernel via Pyodide',
        'NumPy, Pandas, Matplotlib support',
        'Interactive rich outputs',
        'Markdown cells',
        'Code cells with syntax highlighting',
        'Runs entirely in browser',
        'No server required',
      ],
      limitations: [
        'First load can be slow (~15 seconds)',
        'Limited to browser memory',
        'Some Python packages not available',
        'No persistent storage (use save/export)',
      ],
      documentation: 'https://jupyterlite.readthedocs.io/',
    };
  }
}
