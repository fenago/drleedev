import JavaScriptRuntime from './languages/JavaScriptRuntime.js';
import TypeScriptRuntime from './languages/TypeScriptRuntime.js';
import CoffeeScriptRuntime from './languages/CoffeeScriptRuntime.js';
import MarkdownRuntime from './languages/MarkdownRuntime.js';
import JSONRuntime from './languages/JSONRuntime.js';
import CSSRuntime from './languages/CSSRuntime.js';
import HTMLRuntime from './languages/HTMLRuntime.js';
import XMLRuntime from './languages/XMLRuntime.js';
import YAMLRuntime from './languages/YAMLRuntime.js';
import ShellRuntime from './languages/ShellRuntime.js';
// import AssemblyScriptRuntime from './languages/AssemblyScriptRuntime.js'; // TODO: Requires top-level await support
import PythonRuntime from './languages/PythonRuntime.js';
import LuaRuntime from './languages/LuaRuntime.js';
import RRuntime from './languages/RRuntime.js';
import RubyRuntime from './languages/RubyRuntime.js';
import PHPRuntime from './languages/PHPRuntime.js';
import SchemeRuntime from './languages/SchemeRuntime.js';
import CommonLispRuntime from './languages/CommonLispRuntime.js';
import BasicRuntime from './languages/BasicRuntime.js';
import PrologRuntime from './languages/PrologRuntime.js';
import ClojureRuntime from './languages/ClojureRuntime.js';
import SQLiteRuntime from './databases/SQLiteRuntime.js';
import DuckDBRuntime from './databases/DuckDBRuntime.js';
import PostgreSQLRuntime from './databases/PostgreSQLRuntime.js';
import MySQLRuntime from './databases/MySQLRuntime.js';
import JupyterLiteRuntime from './notebooks/JupyterLiteRuntime.js';
// import PerlRuntime from './languages/PerlRuntime.js'; // Disabled - no browser support
import BlocklyRuntime from './languages/BlocklyRuntime.js';
import P5Runtime from './languages/P5Runtime.js';
import RacketRuntime from './languages/RacketRuntime.js';
import PascalRuntime from './languages/PascalRuntime.js';
import TclRuntime from './languages/TclRuntime.js';

/**
 * RuntimeManager - Manages all programming language runtimes
 *
 * Handles lazy loading, execution, and lifecycle management of language runtimes.
 */
export default class RuntimeManager {
  constructor() {
    this.runtimes = new Map();
    this.currentRuntime = null;
    this.currentLanguage = 'javascript';

    // Registry of available runtimes
    this.registry = {
      javascript: {
        class: JavaScriptRuntime,
        displayName: 'JavaScript',
        tier: 'free',
        lazy: false, // JavaScript is always loaded
      },
      typescript: {
        class: TypeScriptRuntime, // TypeScript with compilation
        displayName: 'TypeScript',
        tier: 'free',
        lazy: true, // Load TypeScript compiler on demand (4MB)
      },
      coffeescript: {
        class: CoffeeScriptRuntime,
        displayName: 'CoffeeScript',
        tier: 'free',
        lazy: true, // Load CoffeeScript compiler on demand (200KB)
      },
      markdown: {
        class: MarkdownRuntime,
        displayName: 'Markdown',
        tier: 'free',
        lazy: false, // Markdown is always loaded (uses marked.js)
      },
      json: {
        class: JSONRuntime,
        displayName: 'JSON',
        tier: 'free',
        lazy: false, // JSON is native (no loading needed)
      },
      css: {
        class: CSSRuntime,
        displayName: 'CSS',
        tier: 'free',
        lazy: false, // CSS validation is native
      },
      html: {
        class: HTMLRuntime,
        displayName: 'HTML',
        tier: 'free',
        lazy: false, // HTML validation is native (DOMParser)
      },
      xml: {
        class: XMLRuntime,
        displayName: 'XML',
        tier: 'free',
        lazy: false, // XML validation is native (DOMParser)
      },
      yaml: {
        class: YAMLRuntime,
        displayName: 'YAML',
        tier: 'free',
        lazy: true, // Load js-yaml library on demand
      },
      shell: {
        class: ShellRuntime,
        displayName: 'Shell',
        tier: 'free',
        lazy: false, // Shell simulator is lightweight
      },
      // assemblyscript: {
      //   class: AssemblyScriptRuntime,
      //   displayName: 'AssemblyScript',
      //   tier: 'free',
      //   lazy: true, // Load AssemblyScript compiler on demand
      // },
      python: {
        class: PythonRuntime,
        displayName: 'Python',
        tier: 'free', // Free for now, will be 'pro' when monetization is added
        lazy: true, // Load on demand (6.5MB WASM)
      },
      lua: {
        class: LuaRuntime,
        displayName: 'Lua',
        tier: 'free',
        lazy: true, // Load on demand (200KB WASM)
      },
      r: {
        class: RRuntime,
        displayName: 'R',
        tier: 'pro', // Pro tier for data science
        lazy: true, // Load on demand (10MB WASM)
      },
      sqlite: {
        class: SQLiteRuntime,
        displayName: 'SQLite',
        tier: 'free',
        lazy: true, // Load on demand (2MB WASM)
      },
      duckdb: {
        class: DuckDBRuntime,
        displayName: 'DuckDB',
        tier: 'pro', // Pro tier for analytics
        lazy: true, // Load on demand (5MB WASM)
      },
      ruby: {
        class: RubyRuntime,
        displayName: 'Ruby',
        tier: 'pro',
        lazy: true, // Load on demand (15MB WASM)
      },
      jupyterlite: {
        class: JupyterLiteRuntime,
        displayName: 'JupyterLite',
        tier: 'pro',
        lazy: true, // Load on demand (iframe-based)
      },
      php: {
        class: PHPRuntime,
        displayName: 'PHP',
        tier: 'pro',
        lazy: true, // Load on demand (5MB WASM)
      },
      postgresql: {
        class: PostgreSQLRuntime,
        displayName: 'PostgreSQL',
        tier: 'pro',
        lazy: true, // Load on demand (3MB WASM)
      },
      scheme: {
        class: SchemeRuntime,
        displayName: 'Scheme',
        tier: 'pro',
        lazy: true, // Load on demand (500KB)
      },
      commonlisp: {
        class: CommonLispRuntime,
        displayName: 'Common Lisp',
        tier: 'pro',
        lazy: true, // Load on demand (1MB)
      },
      basic: {
        class: BasicRuntime,
        displayName: 'BASIC',
        tier: 'free',
        lazy: true, // Load on demand (200KB)
      },
      prolog: {
        class: PrologRuntime,
        displayName: 'Prolog',
        tier: 'pro',
        lazy: true, // Load on demand (400KB)
      },
      clojure: {
        class: ClojureRuntime,
        displayName: 'Clojure',
        tier: 'pro',
        lazy: true, // Load on demand (100KB)
      },
      // perl: {  // Disabled - no browser implementation available
      //   class: PerlRuntime,
      //   displayName: 'Perl',
      //   tier: 'pro',
      //   lazy: true, // Load on demand (500KB)
      // },
      blockly: {
        class: BlocklyRuntime,
        displayName: 'Blockly',
        tier: 'free',
        lazy: true, // Load on demand (800KB)
      },
      p5js: {
        class: P5Runtime,
        displayName: 'p5.js',
        tier: 'free',
        lazy: true, // Load on demand (1MB)
      },
      mysql: {
        class: MySQLRuntime,
        displayName: 'MySQL',
        tier: 'free',
        lazy: true, // Load on demand (2MB)
      },
      racket: {
        class: RacketRuntime,
        displayName: 'Racket',
        tier: 'pro',
        lazy: true, // Load on demand (500KB)
      },
      pascal: {
        class: PascalRuntime,
        displayName: 'Pascal',
        tier: 'free',
        lazy: false, // Native implementation
      },
      tcl: {
        class: TclRuntime,
        displayName: 'Tcl',
        tier: 'pro',
        lazy: false, // Native implementation
      },
    };
  }

  /**
   * Initialize runtime manager
   *
   * @returns {Promise<void>}
   */
  async init() {
    // Pre-load JavaScript runtime (always available)
    const runtime = await this.loadRuntime('javascript');
    this.currentRuntime = runtime;
    this.currentLanguage = 'javascript';
  }

  /**
   * Load a runtime if not already loaded
   *
   * @param {string} language - Language identifier
   * @returns {Promise<BaseRuntime>}
   */
  async loadRuntime(language) {
    // Check if runtime is already loaded
    if (this.runtimes.has(language)) {
      return this.runtimes.get(language);
    }

    // Check if language is supported
    const config = this.registry[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Create runtime instance
    const runtime = new config.class();

    // Set up output callbacks
    runtime.onOutput((text, type) => {
      this.handleOutput(text, type);
    });

    runtime.onError((text, type) => {
      this.handleError(text, type);
    });

    // Load the runtime
    if (!runtime.isLoaded()) {
      await runtime.load();
    }

    // Store runtime
    this.runtimes.set(language, runtime);

    return runtime;
  }

  /**
   * Switch to a different language runtime
   *
   * @param {string} language - Language to switch to
   * @returns {Promise<void>}
   */
  async switchLanguage(language) {
    if (this.currentLanguage === language) {
      return; // Already on this language
    }

    // Load runtime if needed
    const runtime = await this.loadRuntime(language);

    this.currentRuntime = runtime;
    this.currentLanguage = language;
  }

  /**
   * Execute code in the current runtime
   *
   * @param {string} code - Code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async executeCode(code, options = {}) {
    if (!this.currentRuntime) {
      throw new Error('No runtime loaded');
    }

    return await this.currentRuntime.execute(code, options);
  }

  /**
   * Get current runtime
   *
   * @returns {BaseRuntime|null}
   */
  getCurrentRuntime() {
    return this.currentRuntime;
  }

  /**
   * Get current language
   *
   * @returns {string}
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get list of available languages
   *
   * @returns {Array<{id: string, name: string, tier: string}>}
   */
  getAvailableLanguages() {
    return Object.entries(this.registry).map(([id, config]) => ({
      id,
      name: config.displayName,
      tier: config.tier,
    }));
  }

  /**
   * Check if language is available
   *
   * @param {string} language - Language to check
   * @returns {boolean}
   */
  isLanguageAvailable(language) {
    return this.registry.hasOwnProperty(language);
  }

  /**
   * Handle output from runtime
   *
   * @private
   * @param {string} text - Output text
   * @param {string} type - Output type
   */
  handleOutput(text, type) {
    // This will be connected to OutputPanel via callbacks
    if (this.outputCallback) {
      this.outputCallback(text, type);
    }
  }

  /**
   * Handle errors from runtime
   *
   * @private
   * @param {string} text - Error text
   * @param {string} type - Error type
   */
  handleError(text, type) {
    // This will be connected to OutputPanel via callbacks
    if (this.errorCallback) {
      this.errorCallback(text, type);
    }
  }

  /**
   * Register output callback
   *
   * @param {Function} callback - Callback function(text, type)
   */
  onOutput(callback) {
    this.outputCallback = callback;
  }

  /**
   * Register error callback
   *
   * @param {Function} callback - Callback function(text, type)
   */
  onError(callback) {
    this.errorCallback = callback;
  }

  /**
   * Dispose all runtimes
   *
   * @returns {Promise<void>}
   */
  async dispose() {
    for (const [, runtime] of this.runtimes) {
      await runtime.dispose();
    }
    this.runtimes.clear();
    this.currentRuntime = null;
  }
}
