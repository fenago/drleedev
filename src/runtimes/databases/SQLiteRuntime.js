/**
 * SQLiteRuntime.js
 *
 * SQLite database runtime implementation using sql.js
 *
 * Features:
 * - Full SQLite 3.x support
 * - In-browser SQL query execution
 * - Table creation and management
 * - Data persistence (via export/import)
 * - Lightweight (2MB WASM)
 *
 * WASM Library: sql.js
 * Size: ~2MB
 * Documentation: https://sql.js.org/
 */

import BaseRuntime from '../BaseRuntime.js';

export default class SQLiteRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('sqlite', {
      version: '3.x',
      cdnURL: 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/',
      ...config,
    });

    this.SQL = null;
    this.db = null;
  }

  /**
   * Load sql.js library and initialize database
   */
  async load() {
    if (this.loaded) {
      return;
    }

    this.loading = true;
    this.log('Loading SQLite runtime (sql.js)...', 'info');

    try {
      // Load sql.js library
      await this.loadSqlJs();

      // Create new database
      this.db = new this.SQL.Database();

      this.loaded = true;
      this.loading = false;
      this.log('✓ SQLite runtime loaded successfully!', 'success');
      this.log('  SQLite version: 3.x', 'info');
      this.log('  Database created in memory', 'info');
    } catch (error) {
      this.loading = false;
      const errorMsg = `Failed to load SQLite runtime: ${error.message}`;
      this.logError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Load sql.js from CDN
   */
  async loadSqlJs() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.initSqlJs) {
        window
          .initSqlJs({
            locateFile: (file) => `${this.config.cdnURL}${file}`,
          })
          .then((SQL) => {
            this.SQL = SQL;
            resolve();
          })
          .catch(reject);
        return;
      }

      // Load sql.js script
      const script = document.createElement('script');
      script.src = `${this.config.cdnURL}sql-wasm.js`;
      script.type = 'text/javascript';

      script.onload = async () => {
        try {
          this.SQL = await window.initSqlJs({
            locateFile: (file) => `${this.config.cdnURL}${file}`,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load sql.js script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Execute SQL statements
   *
   * @param {string} code - SQL code to execute
   * @param {object} options - Execution options
   * @returns {object} Execution result with data and metadata
   */
  async execute(code, options = {}) {
    if (!this.loaded) {
      throw new Error('SQLite runtime not loaded. Call load() first.');
    }

    const startTime = performance.now();
    const result = {
      success: false,
      output: [],
      results: [],
      executionTime: 0,
      error: null,
    };

    try {
      // Split SQL into individual statements
      const statements = this.parseSQLStatements(code);

      this.log(`Executing ${statements.length} SQL statement(s)...`, 'info');
      this.log('', 'stdout');

      // Execute each statement
      for (const sql of statements) {
        if (!sql.trim()) continue;

        try {
          const stmt = this.db.prepare(sql);
          const queryResult = {
            sql: sql.trim(),
            columns: [],
            values: [],
          };

          // Execute and collect results
          while (stmt.step()) {
            if (queryResult.columns.length === 0) {
              queryResult.columns = stmt.getColumnNames();
            }
            queryResult.values.push(stmt.get());
          }

          stmt.free();

          // Display results
          this.displayQueryResult(queryResult);
          result.results.push(queryResult);
        } catch (stmtError) {
          // Statement error - log but continue
          this.logError(`Error in statement: ${stmtError.message}`);
          this.log(`  SQL: ${sql}`, 'error');
        }
      }

      result.success = true;
      result.executionTime = performance.now() - startTime;

      this.log('', 'stdout');
      this.log(
        `✓ Executed ${statements.length} statement(s) in ${result.executionTime.toFixed(2)}ms`,
        'success'
      );
    } catch (error) {
      result.success = false;
      result.error = error;
      result.executionTime = performance.now() - startTime;

      const errorMessage = this.formatSQLError(error);
      this.logError(errorMessage);
    }

    return result;
  }

  /**
   * Parse SQL code into individual statements
   *
   * @param {string} code - SQL code
   * @returns {string[]} Array of SQL statements
   */
  parseSQLStatements(code) {
    // Split on semicolons and filter out comments and empty statements
    return code
      .split(';')
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length === 0) return false;

        // Filter out statements that are only comments or whitespace
        const lines = s.split('\n');
        const hasNonCommentContent = lines.some(line => {
          const trimmedLine = line.trim();
          // Check if line has content and doesn't start with --
          return trimmedLine.length > 0 && !trimmedLine.startsWith('--');
        });

        return hasNonCommentContent;
      })
      .map((s) => s + ';');
  }

  /**
   * Display query results in a formatted table
   *
   * @param {object} queryResult - Query result object
   */
  displayQueryResult(queryResult) {
    const { sql, columns, values } = queryResult;

    // Show SQL statement
    this.log(`SQL: ${sql}`, 'info');

    // If no results, show affected rows or success message
    if (values.length === 0) {
      if (sql.toUpperCase().startsWith('SELECT')) {
        this.log('  (0 rows returned)', 'stdout');
      } else {
        this.log('  ✓ OK', 'success');
      }
      this.log('', 'stdout');
      return;
    }

    // Display results as a table
    this.log('', 'stdout');

    // Calculate column widths
    const colWidths = columns.map((col, i) => {
      const maxValWidth = Math.max(
        ...values.map((row) => String(row[i] ?? '').length)
      );
      return Math.max(col.length, maxValWidth, 10);
    });

    // Header row
    const headerRow = columns
      .map((col, i) => col.padEnd(colWidths[i]))
      .join(' | ');
    this.log(`  ${headerRow}`, 'stdout');

    // Separator
    const separator = colWidths.map((w) => '-'.repeat(w)).join('-+-');
    this.log(`  ${separator}`, 'stdout');

    // Data rows
    values.forEach((row) => {
      const dataRow = row
        .map((val, i) => String(val ?? 'NULL').padEnd(colWidths[i]))
        .join(' | ');
      this.log(`  ${dataRow}`, 'stdout');
    });

    this.log('', 'stdout');
    this.log(`  (${values.length} row${values.length === 1 ? '' : 's'})`, 'info');
    this.log('', 'stdout');
  }

  /**
   * Format SQL error messages
   *
   * @param {Error} error - Error object
   * @returns {string} Formatted error message
   */
  formatSQLError(error) {
    let message = error.message || String(error);

    return `SQLite Error:\n${message}`;
  }

  /**
   * Export database to binary array
   *
   * @returns {Uint8Array} Database binary data
   */
  exportDatabase() {
    if (!this.db) {
      throw new Error('No database loaded');
    }

    return this.db.export();
  }

  /**
   * Import database from binary array
   *
   * @param {Uint8Array} data - Database binary data
   */
  importDatabase(data) {
    if (this.db) {
      this.db.close();
    }

    this.db = new this.SQL.Database(data);
    this.log('✓ Database imported successfully', 'success');
  }

  /**
   * Close current database and create new empty one
   */
  resetDatabase() {
    if (this.db) {
      this.db.close();
    }

    this.db = new this.SQL.Database();
    this.log('✓ Database reset successfully', 'success');
  }

  /**
   * Get list of tables in database
   *
   * @returns {string[]} Array of table names
   */
  getTables() {
    if (!this.db) {
      return [];
    }

    const stmt = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tables = [];

    while (stmt.step()) {
      tables.push(stmt.get()[0]);
    }

    stmt.free();
    return tables;
  }

  /**
   * Get schema for a table
   *
   * @param {string} tableName - Name of the table
   * @returns {string} CREATE TABLE statement
   */
  getTableSchema(tableName) {
    if (!this.db) {
      return '';
    }

    const stmt = this.db.prepare(
      'SELECT sql FROM sqlite_master WHERE type="table" AND name=?'
    );
    stmt.bind([tableName]);

    let schema = '';
    if (stmt.step()) {
      schema = stmt.get()[0];
    }

    stmt.free();
    return schema;
  }

  /**
   * Dispose of database and free resources
   */
  async dispose() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.SQL = null;
    this.loaded = false;
    this.log('SQLite runtime disposed', 'info');
  }

  /**
   * Get information about SQLite runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'sql.js',
      sqliteVersion: '3.x',
      size: '~2MB',
      features: [
        'Full SQLite 3 support',
        'In-memory database',
        'Import/export support',
        'All standard SQL operations',
        'Transactions',
        'Indexes',
        'Views',
        'Triggers',
      ],
      limitations: [
        'No persistent storage by default (memory only)',
        'Single database per runtime',
        'No concurrent access',
        'Limited to browser memory',
      ],
    };
  }
}
