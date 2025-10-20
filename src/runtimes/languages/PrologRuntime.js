/**
 * PrologRuntime - Prolog execution using Tau Prolog
 *
 * Tau Prolog is a Prolog interpreter written entirely in JavaScript.
 * It supports ISO Prolog standard and includes module system.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class PrologRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('prolog', {
      version: 'ISO Prolog',
      ...config,
    });

    this.pl = null;
    this.session = null;
  }

  /**
   * Load Prolog runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading Prolog (Tau Prolog)...', 'info');

      // Dynamically import Tau Prolog
      const tauProlog = await import('tau-prolog');
      this.pl = tauProlog.default || tauProlog;

      // Create a new session
      this.session = this.pl.create();

      this.loaded = true;
      this.loading = false;
      this.log('✓ Prolog runtime loaded successfully!', 'success');
      this.log('Tau Prolog (ISO Prolog) ready', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load Prolog: ${error.message}`);
    }
  }

  /**
   * Execute Prolog code
   *
   * @param {string} code - Prolog code to execute (program + query)
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('Prolog runtime not loaded. Call load() first.');
    }

    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: [],
      error: null,
      executionTime: 0,
    };

    try {
      // Split code into program and query
      // Look for ?- to identify query
      const lines = code.split('\n');
      let programLines = [];
      let queryLine = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('?-')) {
          queryLine = trimmed;
        } else if (trimmed) {
          programLines.push(trimmed);
        }
      }

      const program = programLines.join('\n');
      const query = queryLine || '?- true.'; // Default query

      // Consult (load) the program
      if (program) {
        this.session.consult(program);
      }

      // Parse and execute query
      const queryText = query.replace(/^\?-\s*/, '').replace(/\.$/, '');
      this.session.query(queryText);

      // Collect all answers
      const answers = [];
      let limit = 100; // Limit number of solutions to prevent infinite loops

      const getAnswer = () => {
        return new Promise((resolve) => {
          this.session.answer((answer) => {
            if (answer === false) {
              resolve(false); // No more answers
            } else if (answer === null) {
              resolve(null); // Error
            } else {
              answers.push(answer);
              resolve(true); // Got an answer
            }
          });
        });
      };

      // Get all answers
      while (limit-- > 0) {
        const hasMore = await getAnswer();
        if (hasMore === false) break;
        if (hasMore === null) {
          throw new Error('Query failed');
        }
      }

      // Format output
      if (answers.length === 0) {
        result.output = 'false.';
      } else if (answers.length === 1 && this.isTrivialTrue(answers[0])) {
        result.output = 'true.';
      } else {
        result.output = answers.map((answer, i) => {
          return `Solution ${i + 1}:\n${this.formatAnswer(answer)}`;
        }).join('\n\n');
      }

      result.returnValue = answers;
      result.success = true;
      this.log(result.output, 'stdout');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Prolog Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Check if answer is trivial 'true'
   *
   * @private
   * @param {object} answer - Tau Prolog answer
   * @returns {boolean}
   */
  isTrivialTrue(answer) {
    // Check if answer has no bindings (just 'true')
    if (!answer || !answer.links) {
      return true;
    }
    return Object.keys(answer.links).length === 0;
  }

  /**
   * Format Prolog answer for display
   *
   * @private
   * @param {object} answer - Tau Prolog answer
   * @returns {string} Formatted answer
   */
  formatAnswer(answer) {
    if (!answer || !answer.links) {
      return 'true';
    }

    const bindings = [];
    for (const varName in answer.links) {
      const value = answer.links[varName];
      bindings.push(`${varName} = ${this.formatTerm(value)}`);
    }

    return bindings.length > 0 ? bindings.join(',\n') : 'true';
  }

  /**
   * Format Prolog term for display
   *
   * @private
   * @param {object} term - Tau Prolog term
   * @returns {string} Formatted term
   */
  formatTerm(term) {
    if (!term) return 'null';

    if (typeof term === 'string' || typeof term === 'number') {
      return String(term);
    }

    if (term.toString && typeof term.toString === 'function') {
      return term.toString();
    }

    return JSON.stringify(term);
  }

  /**
   * Dispose of Prolog runtime
   */
  async dispose() {
    if (this.session) {
      this.session = null;
    }
    if (this.pl) {
      this.pl = null;
    }
    this.loaded = false;
    this.log('Prolog runtime disposed', 'info');
  }

  /**
   * Get information about Prolog runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Prolog (Tau Prolog)',
      version: 'ISO Prolog',
      size: '~400KB',
      features: [
        'ISO Prolog standard',
        'Logic programming',
        'Unification and backtracking',
        'Built-in predicates',
        'Module system',
        'Definite clause grammars (DCG)',
        'Constraint solving',
        'Meta-predicates',
      ],
      limitations: [
        'No file I/O in browser',
        'Limited debugging features',
        'Performance constraints',
        'Solution limit to prevent infinite loops',
      ],
      documentation: 'http://tau-prolog.org/',
    };
  }
}
