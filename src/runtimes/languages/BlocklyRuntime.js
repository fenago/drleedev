/**
 * BlocklyRuntime - Visual block-based programming
 *
 * Provides a visual programming interface using Google Blockly.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class BlocklyRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('blockly', {
      version: 'Blockly Core',
      ...config,
    });

    this.Blockly = null;
    this.workspace = null;
  }

  /**
   * Load Blockly library
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.log('Loading Blockly library...', 'info');

      // Import Blockly
      const Blockly = await import('blockly');
      this.Blockly = Blockly.default || Blockly;

      this.loaded = true;
      this.log('Blockly runtime ready', 'success');
    } catch (error) {
      this.logError(`Failed to load Blockly runtime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute Blockly code (parse XML and generate JavaScript)
   *
   * @param {string} code - Blockly XML code
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
      // Create a temporary workspace
      const workspace = new this.Blockly.Workspace();

      // Load blocks from XML
      const xml = this.Blockly.utils.xml.textToDom(code);
      this.Blockly.Xml.domToWorkspace(xml, workspace);

      // Generate JavaScript code
      const jsCode = this.Blockly.JavaScript.workspaceToCode(workspace);

      // Capture output
      let output = [];
      const originalLog = console.log;

      console.log = (...args) => {
        output.push(args.map(a => String(a)).join(' '));
      };

      // Execute generated JavaScript
      const returnValue = eval(jsCode);

      // Restore console
      console.log = originalLog;

      // Clean up workspace
      workspace.dispose();

      result.output = [
        '==================================================',
        'Generated JavaScript Code:',
        '==================================================',
        jsCode,
        '',
        '==================================================',
        'Execution Output:',
        '==================================================',
        output.join('\n') || '(no output)',
      ].join('\n');

      result.returnValue = returnValue;
      result.success = true;

      this.log('Blockly code executed successfully', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nBlockly XML parsing or execution failed.\nCheck XML format and try again.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of Blockly runtime
   */
  async dispose() {
    if (this.workspace) {
      this.workspace.dispose();
      this.workspace = null;
    }
    this.Blockly = null;
    this.loaded = false;
    this.log('Blockly runtime disposed', 'info');
  }

  /**
   * Get information about Blockly runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Blockly',
      version: 'Core Library',
      size: '~800KB',
      features: [
        'Visual block-based programming',
        'Drag-and-drop interface',
        'Code generation to JavaScript',
        'Educational programming tool',
        'Custom block creation',
        'XML workspace serialization',
      ],
      limitations: [
        'Requires XML workspace format',
        'Limited to JavaScript code generation in this runtime',
        'No visual editor in CLI mode',
        'Best used with GUI applications',
      ],
      documentation: 'https://developers.google.com/blockly',
    };
  }
}
