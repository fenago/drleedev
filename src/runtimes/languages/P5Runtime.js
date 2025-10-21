/**
 * P5Runtime - p5.js creative coding library
 *
 * Provides access to p5.js for creative coding, graphics, and interactive art.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class P5Runtime extends BaseRuntime {
  constructor(config = {}) {
    super('p5js', {
      version: 'p5.js 2.x',
      ...config,
    });

    this.p5 = null;
    this.canvas = null;
  }

  /**
   * Load p5.js library
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.log('Loading p5.js library...', 'info');

      // Import p5.js
      const p5Module = await import('p5');
      this.p5 = p5Module.default || p5Module;

      this.loaded = true;
      this.log('p5.js runtime ready', 'success');
    } catch (error) {
      this.logError(`Failed to load p5.js runtime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute p5.js sketch
   *
   * @param {string} code - p5.js code to execute
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
      // Capture console output
      let output = [];
      const originalLog = console.log;

      console.log = (...args) => {
        output.push(args.map(a => String(a)).join(' '));
      };

      // Create a container for the sketch (if in browser environment)
      let container = null;
      if (typeof document !== 'undefined') {
        container = document.createElement('div');
        container.id = 'p5-sketch-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '10000';
      }

      // Execute p5.js sketch
      const sketch = new Function('p5', `
        return new p5(function(p) {
          ${code}
        });
      `);

      const p5Instance = sketch(this.p5);

      // Restore console
      console.log = originalLog;

      // Wait a bit for setup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      result.output = [
        '==================================================',
        'p5.js Sketch Executed',
        '==================================================',
        '',
        'Status: ✓ Sketch is running',
        '',
        'Note: p5.js sketches create visual output.',
        'In a browser environment, check for a canvas element.',
        '',
        'Console Output:',
        output.join('\n') || '(no console output)',
        '',
        '==================================================',
        'p5.js Functions Available:',
        '==================================================',
        '• setup() - Called once at start',
        '• draw() - Called repeatedly',
        '• mousePressed() - Mouse interaction',
        '• keyPressed() - Keyboard interaction',
        '• createCanvas(w, h) - Create drawing area',
        '• background(color) - Set background',
        '• fill(color) - Set fill color',
        '• rect(), ellipse(), line() - Draw shapes',
        '• text() - Draw text',
        '',
        'Documentation: https://p5js.org/reference/',
      ].join('\n');

      result.returnValue = p5Instance;
      result.success = true;

      this.log('p5.js sketch executed successfully', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\np5.js sketch execution failed.\nCheck syntax and function usage.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of p5.js runtime
   */
  async dispose() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    this.p5 = null;
    this.loaded = false;
    this.log('p5.js runtime disposed', 'info');
  }

  /**
   * Get information about p5.js runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'p5.js',
      version: '2.x',
      size: '~1MB',
      features: [
        'Creative coding and generative art',
        'Canvas-based graphics',
        'Interactive animations',
        'Sound and media support',
        '2D and WebGL 3D rendering',
        'Mouse and keyboard interaction',
        'Mathematical functions',
        'Image processing',
      ],
      limitations: [
        'Requires browser environment for visual output',
        'No canvas in CLI mode',
        'Performance depends on sketch complexity',
      ],
      documentation: 'https://p5js.org/reference/',
    };
  }
}
