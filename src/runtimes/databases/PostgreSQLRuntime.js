/**
 * PostgreSQLRuntime - PostgreSQL execution using PGLite
 *
 * PGLite is a WASM Postgres build packaged into a TypeScript client library
 * that enables you to run Postgres in the browser, Node.js and Bun, with no
 * need to install any other dependencies.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class PostgreSQLRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('postgresql', {
      version: '16',
      ...config,
    });

    this.db = null;
  }

  /**
   * Load PostgreSQL runtime
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.loading = true;
      this.log('Loading PostgreSQL (PGLite)...', 'info');
      this.log('This may take a few seconds on first load...', 'info');

      // Dynamically import PGLite
      const { PGlite } = await import('@electric-sql/pglite');

      // Initialize in-memory database
      this.db = new PGlite();

      this.loaded = true;
      this.loading = false;
      this.log('✓ PostgreSQL runtime loaded successfully!', 'success');
      this.log('PostgreSQL 16 ready (PGLite)', 'info');
    } catch (error) {
      this.loading = false;
      this.loaded = false;
      throw new Error(`Failed to load PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Execute SQL query
   *
   * @param {string} code - SQL query to execute
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('PostgreSQL runtime not loaded. Call load() first.');
    }

    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: undefined,
      error: null,
      executionTime: 0,
    };

    try {
      // Execute SQL query
      const queryResult = await this.db.query(code);

      // Format output
      if (queryResult.rows && queryResult.rows.length > 0) {
        // Query returned rows - format as table
        result.output = this.formatTable(queryResult.rows, queryResult.fields);
        result.returnValue = queryResult.rows;
      } else if (queryResult.affectedRows !== undefined) {
        // DML query (INSERT, UPDATE, DELETE)
        result.output = `Query OK, ${queryResult.affectedRows} row(s) affected`;
        result.returnValue = { affectedRows: queryResult.affectedRows };
      } else {
        // DDL query (CREATE, ALTER, DROP)
        result.output = 'Query executed successfully';
        result.returnValue = { success: true };
      }

      this.log(result.output, 'stdout');
      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `PostgreSQL Error: ${error.message}`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Format query results as ASCII table
   *
   * @private
   * @param {Array} rows - Result rows
   * @param {Array} fields - Field metadata
   * @returns {string} Formatted table
   */
  formatTable(rows, fields) {
    if (!rows || rows.length === 0) {
      return 'Empty result set';
    }

    // Get column names
    const columns = fields ? fields.map(f => f.name) : Object.keys(rows[0]);

    // Calculate column widths
    const widths = {};
    columns.forEach(col => {
      widths[col] = col.length;
    });

    rows.forEach(row => {
      columns.forEach(col => {
        const value = String(row[col] ?? 'NULL');
        widths[col] = Math.max(widths[col], value.length);
      });
    });

    // Build table
    let output = '';

    // Header separator
    const separator = '+' + columns.map(col => '-'.repeat(widths[col] + 2)).join('+') + '+\n';

    output += separator;

    // Header row
    output += '|' + columns.map(col => ` ${col.padEnd(widths[col])} `).join('|') + '|\n';
    output += separator;

    // Data rows
    rows.forEach(row => {
      output += '|' + columns.map(col => {
        const value = String(row[col] ?? 'NULL');
        return ` ${value.padEnd(widths[col])} `;
      }).join('|') + '|\n';
    });

    output += separator;
    output += `\n${rows.length} row(s) in set\n`;

    return output;
  }

  /**
   * Dispose of PostgreSQL runtime
   */
  async dispose() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    this.loaded = false;
    this.log('PostgreSQL runtime disposed', 'info');
  }

  /**
   * Get information about PostgreSQL runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'PostgreSQL (PGLite)',
      version: '16',
      size: '~3MB',
      features: [
        'PostgreSQL 16 compatible',
        'Full SQL support',
        'ACID transactions',
        'Indexes and constraints',
        'Common table expressions (CTEs)',
        'Window functions',
        'JSON/JSONB support',
        'Full-text search',
      ],
      limitations: [
        'In-memory only (no persistence)',
        'Single connection',
        'No extensions support yet',
        'Limited to browser memory',
      ],
      documentation: 'https://pglite.dev/',
    };
  }
}
