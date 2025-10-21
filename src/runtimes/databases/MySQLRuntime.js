/**
 * MySQLRuntime - MySQL-compatible database
 *
 * Uses SQL.js (SQLite) with MySQL compatibility mode for basic MySQL queries.
 * Note: This is NOT a full MySQL implementation - it's SQLite with MySQL-like syntax support.
 */
import BaseRuntime from '../BaseRuntime.js';

export default class MySQLRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('mysql', {
      version: 'MySQL-compatible (via SQL.js)',
      ...config,
    });

    this.SQL = null;
    this.db = null;
  }

  /**
   * Load SQL.js library
   *
   * @returns {Promise<void>}
   */
  async load() {
    if (this.loaded) return;

    try {
      this.log('Loading MySQL-compatible database...', 'info');

      // Import SQL.js
      const initSqlJs = await import('sql.js');
      this.SQL = await initSqlJs.default({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Create new database instance
      this.db = new this.SQL.Database();

      // Enable MySQL compatibility features
      this.setupMySQLCompatibility();

      this.loaded = true;
      this.log('MySQL-compatible database ready', 'success');
    } catch (error) {
      this.logError(`Failed to load MySQL runtime: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup MySQL compatibility layer
   */
  setupMySQLCompatibility() {
    // Create common MySQL functions that SQLite doesn't have
    try {
      // NOW() function
      this.db.create_function('NOW', () => {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
      });

      // CURDATE() function
      this.db.create_function('CURDATE', () => {
        return new Date().toISOString().slice(0, 10);
      });

      // CONCAT_WS function (concat with separator)
      this.db.create_function('CONCAT_WS', (separator, ...args) => {
        return args.filter(a => a !== null).join(separator);
      });
    } catch (error) {
      // Functions might already exist
      this.log('MySQL compatibility functions setup', 'info');
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
      // MySQL to SQLite syntax translations
      let processedCode = code
        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
        .replace(/ENGINE\s*=\s*\w+/gi, '')
        .replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
        .replace(/UNSIGNED/gi, '')
        .replace(/TINYINT/gi, 'INTEGER')
        .replace(/MEDIUMINT/gi, 'INTEGER')
        .replace(/BIGINT/gi, 'INTEGER')
        .replace(/DOUBLE/gi, 'REAL')
        .replace(/DATETIME/gi, 'TEXT')
        .replace(/TIMESTAMP/gi, 'TEXT')
        .replace(/ENUM\([^)]+\)/gi, 'TEXT')
        .replace(/SET\([^)]+\)/gi, 'TEXT');

      // Execute the query
      const results = this.db.exec(processedCode);

      // Format output
      let output = [];

      if (results.length === 0) {
        // Query executed but returned no results (INSERT, UPDATE, DELETE, CREATE, etc.)
        const changes = this.db.getRowsModified();

        output.push('==================================================');
        output.push('Query Executed Successfully');
        output.push('==================================================');
        output.push('');

        if (changes > 0) {
          output.push(`Rows affected: ${changes}`);
        } else {
          output.push('Query completed (DDL statement or no rows affected)');
        }

        output.push('');
        output.push('==================================================');
        output.push('MySQL Compatibility Note:');
        output.push('==================================================');
        output.push('This runtime uses SQLite with MySQL-like syntax.');
        output.push('Some MySQL-specific features may not be supported.');
        output.push('');
      } else {
        // Query returned results (SELECT)
        results.forEach((resultSet, idx) => {
          const { columns, values } = resultSet;

          output.push('==================================================');
          output.push(`Result Set ${idx + 1}`);
          output.push('==================================================');
          output.push('');

          if (values.length === 0) {
            output.push('Empty result set (no rows returned)');
          } else {
            // Calculate column widths
            const colWidths = columns.map((col, colIdx) => {
              const maxValueWidth = Math.max(
                ...values.map(row => String(row[colIdx] || '').length)
              );
              return Math.max(col.length, maxValueWidth, 3);
            });

            // Header
            const headerRow = columns.map((col, idx) =>
              col.padEnd(colWidths[idx])
            ).join(' | ');

            const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

            output.push(headerRow);
            output.push(separator);

            // Data rows
            values.forEach(row => {
              const dataRow = row.map((cell, idx) =>
                String(cell === null ? 'NULL' : cell).padEnd(colWidths[idx])
              ).join(' | ');
              output.push(dataRow);
            });

            output.push('');
            output.push(`${values.length} row(s) returned`);
          }
          output.push('');
        });
      }

      result.output = output.join('\n');
      result.returnValue = results;
      result.success = true;

      this.log('MySQL query executed successfully', 'info');
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Error: ${error.message}\n\nMySQL query failed.\nCheck syntax and compatibility notes.`;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Dispose of MySQL runtime
   */
  async dispose() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.SQL = null;
    this.loaded = false;
    this.log('MySQL runtime disposed', 'info');
  }

  /**
   * Get information about MySQL runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'MySQL-compatible (SQL.js)',
      version: 'MySQL-like syntax',
      size: '~2MB',
      features: [
        'Basic MySQL syntax support',
        'CREATE, INSERT, UPDATE, DELETE',
        'SELECT with JOIN operations',
        'MySQL function compatibility (limited)',
        'In-memory database',
        'No server required',
      ],
      limitations: [
        'NOT a real MySQL database - uses SQLite backend',
        'No stored procedures',
        'No triggers',
        'Limited MySQL-specific functions',
        'No transaction isolation levels',
        'Some data types auto-converted',
        'Best for testing/learning, not production',
      ],
      documentation: 'https://sql.js.org/',
    };
  }
}
