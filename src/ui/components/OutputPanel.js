/**
 * OutputPanel - Manages code execution output display
 *
 * Displays stdout, stderr, and other execution results with syntax highlighting
 * and filtering capabilities.
 */
export default class OutputPanel {
  /**
   * @param {HTMLElement} container - DOM container for output
   */
  constructor(container) {
    this.container = container;
    this.lines = [];
    this.maxLines = 10000; // Prevent memory issues with very long output
  }

  /**
   * Add output line to the panel
   *
   * @param {string} text - Output text
   * @param {string} type - Output type ('stdout', 'stderr', 'info', 'success', 'error')
   */
  addLine(text, type = 'stdout') {
    // Split multi-line text into separate lines
    const lines = text.split('\n');

    lines.forEach(line => {
      // Create line element
      const lineElement = document.createElement('div');
      lineElement.className = `output-line output-${type}`;
      lineElement.textContent = line;

      // Add to container
      this.container.appendChild(lineElement);

      // Track lines
      this.lines.push({ text: line, type, element: lineElement });

      // Enforce max lines limit
      if (this.lines.length > this.maxLines) {
        const removed = this.lines.shift();
        if (removed.element && removed.element.parentNode) {
          removed.element.parentNode.removeChild(removed.element);
        }
      }
    });

    // Auto-scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Add error block (formatted error display)
   *
   * @param {string} errorMessage - Error message
   */
  addError(errorMessage) {
    const errorElement = document.createElement('div');
    errorElement.className = 'output-error';
    errorElement.textContent = errorMessage;

    this.container.appendChild(errorElement);
    this.scrollToBottom();
  }

  /**
   * Add execution metadata (time, memory, etc.)
   *
   * @param {Object} metadata - Execution metadata
   * @param {number} metadata.executionTime - Execution time in ms
   * @param {number} metadata.memoryUsage - Memory usage in MB (optional)
   */
  addMetadata(metadata) {
    const { executionTime, memoryUsage } = metadata;

    // Update execution time display
    const executionTimeElement = document.getElementById('execution-time');
    if (executionTimeElement && executionTime !== undefined) {
      executionTimeElement.textContent = `⏱️ ${executionTime.toFixed(2)}ms`;
    }

    // Update memory usage display
    const memoryUsageElement = document.getElementById('memory-usage');
    if (memoryUsageElement && memoryUsage !== undefined) {
      memoryUsageElement.textContent = `🧠 ${memoryUsage.toFixed(2)}MB`;
    }

    // Add metadata line to output
    const metadataLine = [];
    if (executionTime !== undefined) {
      metadataLine.push(`Execution time: ${executionTime.toFixed(2)}ms`);
    }
    if (memoryUsage !== undefined) {
      metadataLine.push(`Memory: ${memoryUsage.toFixed(2)}MB`);
    }

    if (metadataLine.length > 0) {
      this.addLine('', 'stdout'); // Empty line
      this.addLine(`[${metadataLine.join(' | ')}]`, 'info');
    }
  }

  /**
   * Clear all output
   */
  clear() {
    this.container.innerHTML = '';
    this.lines = [];

    // Clear metadata displays
    const executionTimeElement = document.getElementById('execution-time');
    const memoryUsageElement = document.getElementById('memory-usage');

    if (executionTimeElement) executionTimeElement.textContent = '';
    if (memoryUsageElement) memoryUsageElement.textContent = '';
  }

  /**
   * Scroll output to bottom
   */
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Get all output as text
   *
   * @returns {string}
   */
  getAllOutput() {
    return this.lines
      .map(line => line.text)
      .join('\n');
  }

  /**
   * Filter output by type
   *
   * @param {string|null} filterType - Type to filter by, or null to show all
   */
  filterByType(filterType) {
    this.lines.forEach(line => {
      if (filterType === null || line.type === filterType) {
        line.element.style.display = '';
      } else {
        line.element.style.display = 'none';
      }
    });
  }

  /**
   * Show welcome message
   */
  showWelcome() {
    this.clear();
    const welcomeElement = document.createElement('div');
    welcomeElement.className = 'output-welcome';
    welcomeElement.innerHTML = `
      👋 Welcome to DrLee IDE!<br>
      Write code in the editor and click <strong>Run</strong> or press <strong>Ctrl+Enter</strong> to execute.
    `;
    this.container.appendChild(welcomeElement);
  }

  /**
   * Show loading message
   *
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading runtime...') {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'output-line output-info';
    loadingElement.textContent = `⏳ ${message}`;
    this.container.appendChild(loadingElement);
    this.scrollToBottom();
  }
}
