/**
 * SQLiteRuntime Unit Tests
 *
 * Tests for SQLite database runtime implementation using sql.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SQLiteRuntime from '../../src/runtimes/databases/SQLiteRuntime.js';

// Mock global objects
global.performance = {
  now: () => Date.now(),
};

describe('SQLiteRuntime', () => {
  let runtime;

  beforeEach(() => {
    runtime = new SQLiteRuntime();
  });

  afterEach(async () => {
    if (runtime) {
      await runtime.dispose();
    }
  });

  describe('Constructor', () => {
    it('should create a SQLiteRuntime instance', () => {
      expect(runtime).toBeInstanceOf(SQLiteRuntime);
      expect(runtime.name).toBe('sqlite');
    });

    it('should have correct default configuration', () => {
      expect(runtime.config.version).toBe('3.x');
      expect(runtime.config.cdnURL).toContain('sql.js');
    });

    it('should start as not loaded', () => {
      expect(runtime.loaded).toBe(false);
      expect(runtime.loading).toBe(false);
    });
  });

  describe('Output Handling', () => {
    it('should register output callbacks', () => {
      const callback = vi.fn();
      runtime.onOutput(callback);
      runtime.log('test message', 'stdout');

      expect(callback).toHaveBeenCalledWith('test message', 'stdout');
    });

    it('should register error callbacks', () => {
      const callback = vi.fn();
      runtime.onError(callback);
      runtime.logError('error message');

      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toContain('error message');
    });

    it('should support multiple output callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      runtime.onOutput(callback1);
      runtime.onOutput(callback2);
      runtime.log('test', 'stdout');

      expect(callback1).toHaveBeenCalledWith('test', 'stdout');
      expect(callback2).toHaveBeenCalledWith('test', 'stdout');
    });
  });

  describe('SQL Statement Parsing', () => {
    it('should parse single SQL statement', () => {
      const sql = 'SELECT * FROM users;';
      const statements = runtime.parseSQLStatements(sql);

      expect(statements).toHaveLength(1);
      expect(statements[0]).toBe('SELECT * FROM users;');
    });

    it('should parse multiple SQL statements', () => {
      const sql = 'CREATE TABLE users (id INT); INSERT INTO users VALUES (1);';
      const statements = runtime.parseSQLStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0]).toBe('CREATE TABLE users (id INT);');
      expect(statements[1]).toBe('INSERT INTO users VALUES (1);');
    });

    it('should handle statements with whitespace', () => {
      const sql = '  SELECT * FROM users;  \n  SELECT * FROM posts;  ';
      const statements = runtime.parseSQLStatements(sql);

      expect(statements).toHaveLength(2);
    });

    it('should filter out empty statements', () => {
      const sql = 'SELECT 1;; ;SELECT 2;';
      const statements = runtime.parseSQLStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0]).toBe('SELECT 1;');
      expect(statements[1]).toBe('SELECT 2;');
    });
  });

  describe('Error Formatting', () => {
    it('should format SQL errors correctly', () => {
      const error = new Error('near "SELECT": syntax error');
      const formatted = runtime.formatSQLError(error);

      expect(formatted).toContain('SQLite Error:');
      expect(formatted).toContain('syntax error');
    });

    it('should handle plain string errors', () => {
      const error = 'table users already exists';
      const formatted = runtime.formatSQLError(error);

      expect(formatted).toContain('SQLite Error:');
    });
  });

  describe('Library Information', () => {
    it('should return correct library info', () => {
      const info = runtime.getLibraryInfo();

      expect(info.name).toBe('sql.js');
      expect(info.sqliteVersion).toBe('3.x');
      expect(info.size).toBe('~2MB');
      expect(info.features).toBeInstanceOf(Array);
      expect(info.limitations).toBeInstanceOf(Array);
    });

    it('should list SQLite features', () => {
      const info = runtime.getLibraryInfo();
      const expectedFeatures = [
        'Full SQLite 3 support',
        'In-memory database',
        'Transactions',
      ];

      expectedFeatures.forEach(feature => {
        expect(info.features.some(f => f.includes(feature.split(' ')[0]))).toBe(true);
      });
    });
  });

  describe('Dispose', () => {
    it('should mark runtime as not loaded after dispose', async () => {
      runtime.loaded = true;
      await runtime.dispose();

      expect(runtime.loaded).toBe(false);
      expect(runtime.db).toBeNull();
      expect(runtime.SQL).toBeNull();
    });

    it('should be safe to call dispose multiple times', async () => {
      await runtime.dispose();
      await runtime.dispose(); // Should not throw
      expect(runtime.loaded).toBe(false);
    });
  });

  describe('isLoaded', () => {
    it('should return false when not loaded', () => {
      expect(runtime.isLoaded()).toBe(false);
    });

    it('should return true when loaded', () => {
      runtime.loaded = true;
      expect(runtime.isLoaded()).toBe(true);
    });
  });

  // Integration tests would require actual sql.js library
  // These are skipped in unit tests but would run in E2E tests
  describe.skip('Execute (Integration)', () => {
    beforeEach(async () => {
      // This would require loading actual sql.js in a browser environment
      await runtime.load();
    });

    it('should execute CREATE TABLE statement', async () => {
      const code = 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
    });

    it('should execute INSERT statement', async () => {
      await runtime.execute('CREATE TABLE users (id INTEGER, name TEXT);');

      const code = 'INSERT INTO users VALUES (1, "Alice");';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
    });

    it('should execute SELECT statement and return results', async () => {
      await runtime.execute('CREATE TABLE users (id INTEGER, name TEXT);');
      await runtime.execute('INSERT INTO users VALUES (1, "Alice");');

      const code = 'SELECT * FROM users;';
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].columns).toEqual(['id', 'name']);
      expect(result.results[0].values).toEqual([[1, 'Alice']]);
    });

    it('should handle SQL errors', async () => {
      const code = 'SELECT * FROM nonexistent_table;';
      const result = await runtime.execute(code);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should execute multiple statements', async () => {
      const code = `
        CREATE TABLE users (id INTEGER, name TEXT);
        INSERT INTO users VALUES (1, 'Alice');
        INSERT INTO users VALUES (2, 'Bob');
        SELECT * FROM users;
      `;
      const result = await runtime.execute(code);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4); // CREATE, INSERT, INSERT, SELECT
    });

    it('should measure execution time', async () => {
      const code = 'SELECT 1;';
      const result = await runtime.execute(code);

      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should get list of tables', async () => {
      await runtime.execute('CREATE TABLE users (id INTEGER);');
      await runtime.execute('CREATE TABLE posts (id INTEGER);');

      const tables = runtime.getTables();

      expect(tables).toContain('users');
      expect(tables).toContain('posts');
    });

    it('should get table schema', async () => {
      await runtime.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);');

      const schema = runtime.getTableSchema('users');

      expect(schema).toContain('CREATE TABLE users');
      expect(schema).toContain('id INTEGER PRIMARY KEY');
    });

    it('should export and import database', async () => {
      await runtime.execute('CREATE TABLE users (id INTEGER, name TEXT);');
      await runtime.execute('INSERT INTO users VALUES (1, "Alice");');

      const exported = runtime.exportDatabase();
      expect(exported).toBeInstanceOf(Uint8Array);

      runtime.resetDatabase();
      const tables = runtime.getTables();
      expect(tables).toHaveLength(0);

      runtime.importDatabase(exported);
      const restoredTables = runtime.getTables();
      expect(restoredTables).toContain('users');
    });
  });
});
