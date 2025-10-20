/**
 * DuckDBRuntime.js
 *
 * DuckDB database runtime implementation using duckdb-wasm
 *
 * Features:
 * - Modern SQL analytics database
 * - OLAP-optimized for analytical queries
 * - Columnar storage
 * - Full SQL support with advanced analytics
 * - Fast aggregations and joins
 * - Parquet, CSV, JSON import/export
 *
 * WASM Library: @duckdb/duckdb-wasm
 * Size: ~5MB
 * Documentation: https://duckdb.org/docs/api/wasm
 */

import BaseRuntime from '../BaseRuntime.js';

export default class DuckDBRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('duckdb', {
      version: '1.28.0',
      cdnURL: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/',
      ...config,
    });

    this.db = null;
    this.conn = null;
    this.duckdb = null;
  }

  /**
   * Load DuckDB WASM library and initialize database
   */
  async load() {
    if (this.loaded) {
      return;
    }

    this.loading = true;
    this.log('Loading DuckDB runtime (duckdb-wasm)...', 'info');
    this.log('This may take 5-10 seconds on first load...', 'info');

    try {
      // Dynamically import duckdb-wasm
      const duckdbModule = await import('@duckdb/duckdb-wasm');

      const JSDELIVR_BUNDLES = duckdbModule.getJsDelivrBundles();

      // Select a bundle based on browser capabilities
      const bundle = await duckdbModule.selectBundle(JSDELIVR_BUNDLES);

      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: 'text/javascript',
        })
      );

      const worker = new Worker(worker_url);
      const logger = new duckdbModule.ConsoleLogger();
      this.db = new duckdbModule.AsyncDuckDB(logger, worker);

      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(worker_url);

      // Create connection
      this.conn = await this.db.connect();

      this.duckdb = duckdbModule;
      this.loaded = true;
      this.loading = false;

      this.log('✓ DuckDB runtime loaded successfully!', 'success');
      this.log('  DuckDB version: 1.28.0', 'info');
      this.log('  Database created in memory', 'info');
    } catch (error) {
      this.loading = false;
      const errorMsg = `Failed to load DuckDB runtime: ${error.message}`;
      this.logError(errorMsg);
      throw new Error(errorMsg);
    }
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
      throw new Error('DuckDB runtime not loaded. Call load() first.');
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
          const queryResult = await this.conn.query(sql);
          const resultData = {
            sql: sql.trim(),
            columns: [],
            values: [],
            rowCount: 0,
          };

          // Get column names
          if (queryResult.schema && queryResult.schema.fields) {
            resultData.columns = queryResult.schema.fields.map((field) => field.name);
          }

          // Get rows
          const rows = queryResult.toArray();
          resultData.values = rows.map((row) => {
            return resultData.columns.map((col) => row[col]);
          });
          resultData.rowCount = rows.length;

          // Display results
          this.displayQueryResult(resultData);
          result.results.push(resultData);
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
      if (sql.toUpperCase().includes('SELECT')) {
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

    // Data rows (limit to 100 rows for display)
    const displayRows = values.slice(0, 100);
    displayRows.forEach((row) => {
      const dataRow = row
        .map((val, i) => String(val ?? 'NULL').padEnd(colWidths[i]))
        .join(' | ');
      this.log(`  ${dataRow}`, 'stdout');
    });

    if (values.length > 100) {
      this.log('  ...', 'stdout');
      this.log(`  (showing first 100 of ${values.length} rows)`, 'info');
    }

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

    return `DuckDB Error:\n${message}`;
  }

  /**
   * Get list of tables in database
   *
   * @returns {Promise<string[]>} Array of table names
   */
  async getTables() {
    if (!this.conn) {
      return [];
    }

    try {
      const result = await this.conn.query('SHOW TABLES;');
      const rows = result.toArray();
      return rows.map((row) => row.name);
    } catch (error) {
      this.logError(`Error getting tables: ${error.message}`);
      return [];
    }
  }

  /**
   * Get schema for a table
   *
   * @param {string} tableName - Name of the table
   * @returns {Promise<object>} Table schema information
   */
  async getTableSchema(tableName) {
    if (!this.conn) {
      return null;
    }

    try {
      const result = await this.conn.query(`DESCRIBE ${tableName};`);
      return result.toArray();
    } catch (error) {
      this.logError(`Error getting schema: ${error.message}`);
      return null;
    }
  }

  /**
   * Insert CSV data into a table
   *
   * @param {string} csvData - CSV data as string
   * @param {string} tableName - Name of table to create
   * @returns {Promise<void>}
   */
  async insertCSV(csvData, tableName) {
    if (!this.conn) {
      throw new Error('No database connection');
    }

    try {
      // Register CSV data as a table
      await this.db.registerFileText(`${tableName}.csv`, csvData);
      await this.conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM '${tableName}.csv';`);
      this.log(`✓ Created table ${tableName} from CSV`, 'success');
    } catch (error) {
      throw new Error(`Failed to insert CSV: ${error.message}`);
    }
  }

  /**
   * Export table to CSV
   *
   * @param {string} tableName - Name of table to export
   * @returns {Promise<string>} CSV data
   */
  async exportToCSV(tableName) {
    if (!this.conn) {
      throw new Error('No database connection');
    }

    try {
      const result = await this.conn.query(`COPY ${tableName} TO '${tableName}.csv';`);
      return result.toString();
    } catch (error) {
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  /**
   * Dispose of database and free resources
   */
  async dispose() {
    try {
      if (this.conn) {
        await this.conn.close();
        this.conn = null;
      }

      if (this.db) {
        await this.db.terminate();
        this.db = null;
      }

      this.duckdb = null;
      this.loaded = false;
      this.log('DuckDB runtime disposed', 'info');
    } catch (error) {
      this.logError(`Error disposing DuckDB: ${error.message}`);
    }
  }

  /**
   * Get information about DuckDB runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'duckdb-wasm',
      version: '1.28.0',
      size: '~5MB',
      features: [
        'Modern SQL analytics database',
        'OLAP-optimized queries',
        'Columnar storage',
        'Fast aggregations',
        'Window functions',
        'CTEs and subqueries',
        'JSON support',
        'CSV/Parquet import/export',
        'Advanced analytics functions',
      ],
      limitations: [
        'In-memory only (no persistent storage by default)',
        'Limited to browser memory',
        'Larger bundle size than SQLite',
      ],
    };
  }
}
