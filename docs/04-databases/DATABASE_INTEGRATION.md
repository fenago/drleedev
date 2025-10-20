# Database Integration Documentation
## DrLee IDE - Browser-Based Database Engines

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Implementation Guide

---

## Table of Contents

1. [Overview](#1-overview)
2. [SQL Databases](#2-sql-databases)
3. [NoSQL Databases](#3-nosql-databases)
4. [Data Import/Export](#4-data-importexport)
5. [Performance Considerations](#5-performance-considerations)
6. [Database Persistence](#6-database-persistence)

---

## 1. Overview

DrLee IDE supports multiple database engines running entirely in the browser via WebAssembly, enabling users to learn SQL, test queries, and analyze data without server infrastructure.

### 1.1 Supported Database Matrix

**SQL Databases:**
| Database | Engine | Size | Speed | Features |
|----------|--------|------|-------|----------|
| SQLite | sql.js | 2MB | Baseline | Full SQL, ACID |
| DuckDB | duckdb-wasm | 5MB | 10x faster | Analytics, Parquet, Arrow |
| PostgreSQL | PGlite | 3MB | 2-3x faster | Full Postgres compatibility |

**NoSQL Databases:**
| Database | Type | Use Case |
|----------|------|----------|
| IndexedDB | Key-value | Browser storage |
| PouchDB | Document | CouchDB protocol, sync |
| Dexie.js | IndexedDB wrapper | Easier API |

---

## 2. SQL Databases

### 2.1 SQLite (sql.js)

**Overview:**
SQLite is the world's most widely deployed database. sql.js is an Emscripten port of SQLite to WebAssembly, providing full SQL capabilities in the browser.

**Specifications:**
- **Engine:** sql.js (SQLite 3.40+)
- **Package:** `sql.js@1.8.0`
- **Size:** 2MB
- **Load Time:** 1-2 seconds
- **Monetization:** Free tier
- **Use Cases:** Learning SQL, small datasets, prototyping

#### Implementation

```javascript
// src/runtimes/databases/SQLiteRuntime.js
import BaseRuntime from '../BaseRuntime.js';
import initSqlJs from 'sql.js';

export default class SQLiteRuntime extends BaseRuntime {
  constructor() {
    super('sqlite', { version: '3.40' });
    this.SQL = null;
    this.db = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading SQLite runtime (2MB)...', 'info');

    // Initialize sql.js
    this.SQL = await initSqlJs({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
    });

    // Create in-memory database
    this.db = new this.SQL.Database();

    this.loaded = true;
    this.log('SQLite 3.40 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      // Split SQL statements (separated by semicolons)
      const statements = this.parseStatements(code);

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        const startTime = performance.now();
        const results = this.db.exec(trimmed);
        const duration = performance.now() - startTime;

        if (results.length > 0) {
          // SELECT query - display results
          for (const result of results) {
            this.displayTable(result);
          }
        } else {
          // DDL/DML query - show success message
          this.log(`Query executed successfully (${duration.toFixed(2)}ms)`, 'success');
        }
      }
    } catch (error) {
      this.log(`SQL Error: ${error.message}`, 'stderr');
      throw error;
    }
  }

  parseStatements(sql) {
    // Simple parser - split by semicolon
    // TODO: Handle semicolons in strings
    return sql.split(';').filter(s => s.trim().length > 0);
  }

  displayTable(result) {
    const { columns, values } = result;

    if (values.length === 0) {
      this.log('(0 rows returned)\n');
      return;
    }

    // Calculate column widths
    const widths = columns.map((col, i) => {
      const maxValueLength = Math.max(
        ...values.map(row => String(row[i] ?? '').length)
      );
      return Math.max(col.length, maxValueLength);
    });

    // Header
    const header = columns
      .map((col, i) => col.padEnd(widths[i]))
      .join(' | ');
    this.log(header);
    this.log('-'.repeat(header.length));

    // Rows
    for (const row of values) {
      const rowStr = row
        .map((val, i) => String(val ?? 'NULL').padEnd(widths[i]))
        .join(' | ');
      this.log(rowStr);
    }

    this.log(`\n(${values.length} rows)\n`);
  }

  // Export database as binary
  exportDatabase() {
    const data = this.db.export();
    return data;
  }

  // Import database from binary
  importDatabase(data) {
    if (this.db) {
      this.db.close();
    }
    this.db = new this.SQL.Database(data);
  }

  // Save to IndexedDB for persistence
  async saveToStorage(name = 'default') {
    const data = this.exportDatabase();
    // Store in IndexedDB (implementation in StorageManager)
    await window.storageManager.saveDatabase(name, 'sqlite', data);
    this.log(`Database saved as '${name}'`, 'success');
  }

  // Load from IndexedDB
  async loadFromStorage(name = 'default') {
    const dbData = await window.storageManager.loadDatabase(name);
    if (dbData && dbData.type === 'sqlite') {
      this.importDatabase(dbData.data);
      this.log(`Database '${name}' loaded`, 'success');
    }
  }

  async dispose() {
    if (this.db) {
      this.db.close();
    }
    await super.dispose();
  }
}
```

#### SQLite Features

**Supported SQL:**
- DDL: CREATE, ALTER, DROP
- DML: INSERT, UPDATE, DELETE
- DQL: SELECT with JOIN, GROUP BY, HAVING, ORDER BY
- Indexes, Views, Triggers
- Transactions (BEGIN, COMMIT, ROLLBACK)
- Window functions
- Common Table Expressions (WITH)
- JSON functions (json_extract, json_array, etc.)

**Example Queries:**

```sql
-- Create table with constraints
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT,
    salary DECIMAL(10, 2),
    hire_date DATE DEFAULT CURRENT_DATE
);

-- Insert sample data
INSERT INTO employees (name, department, salary) VALUES
    ('Alice Johnson', 'Engineering', 120000),
    ('Bob Smith', 'Sales', 80000),
    ('Carol White', 'Engineering', 110000),
    ('David Brown', 'HR', 70000);

-- Complex query with aggregation
SELECT
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary,
    MAX(salary) as max_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 1
ORDER BY avg_salary DESC;

-- Window function
SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) as dept_avg,
    salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees;

-- JSON support
CREATE TABLE api_responses (
    id INTEGER PRIMARY KEY,
    data JSON
);

INSERT INTO api_responses (data) VALUES
    ('{"user": "alice", "score": 95}'),
    ('{"user": "bob", "score": 87}');

SELECT
    json_extract(data, '$.user') as username,
    json_extract(data, '$.score') as score
FROM api_responses;
```

---

### 2.2 DuckDB (duckdb-wasm)

**Overview:**
DuckDB is an in-process analytical database (OLAP) optimized for analytics queries. It's 10-100x faster than SQLite for analytical workloads and supports reading Parquet, CSV, and JSON files directly.

**Specifications:**
- **Engine:** duckdb-wasm
- **Package:** `@duckdb/duckdb-wasm@1.28.0`
- **Size:** 5MB
- **Load Time:** 2-3 seconds
- **Monetization:** Pro tier
- **Use Cases:** Data analytics, large CSV/Parquet files, data science

#### Implementation

```javascript
// src/runtimes/databases/DuckDBRuntime.js
import BaseRuntime from '../BaseRuntime.js';
import * as duckdb from '@duckdb/duckdb-wasm';

export default class DuckDBRuntime extends BaseRuntime {
  constructor() {
    super('duckdb', { version: '0.9.2' });
    this.db = null;
    this.conn = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading DuckDB runtime (5MB)...', 'info');

    // Get DuckDB bundles from CDN
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // Create Web Worker for DuckDB
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: 'text/javascript'
      })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();

    // Initialize DuckDB
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // Create connection
    this.conn = await this.db.connect();

    this.loaded = true;
    this.log('DuckDB ready for analytics!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      const statements = this.parseStatements(code);

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        const startTime = performance.now();
        const result = await this.conn.query(trimmed);
        const duration = performance.now() - startTime;

        if (result.numRows > 0) {
          // Convert to array for display
          const rows = result.toArray();
          this.displayTable(rows, duration);
        } else {
          this.log(`Query executed successfully (${duration.toFixed(2)}ms)`, 'success');
        }
      }
    } catch (error) {
      this.log(`DuckDB Error: ${error.message}`, 'stderr');
      throw error;
    }
  }

  displayTable(rows, duration) {
    if (rows.length === 0) {
      this.log('(0 rows returned)\n');
      return;
    }

    const columns = Object.keys(rows[0]);

    // Calculate column widths
    const widths = columns.map(col => {
      const maxValueLength = Math.max(
        ...rows.map(row => String(row[col] ?? '').length)
      );
      return Math.max(col.length, maxValueLength);
    });

    // Header
    const header = columns
      .map((col, i) => col.padEnd(widths[i]))
      .join(' | ');
    this.log(header);
    this.log('-'.repeat(header.length));

    // Rows (limit display to 100 rows)
    const displayRows = rows.slice(0, 100);
    for (const row of displayRows) {
      const rowStr = columns
        .map((col, i) => String(row[col] ?? 'NULL').padEnd(widths[i]))
        .join(' | ');
      this.log(rowStr);
    }

    if (rows.length > 100) {
      this.log(`... (${rows.length - 100} more rows)`);
    }

    this.log(`\n(${rows.length} rows in ${duration.toFixed(2)}ms)\n`);
  }

  // Load CSV from URL or file
  async loadCSV(url, tableName) {
    await this.ensureLoaded();

    this.log(`Loading CSV from ${url}...`, 'info');

    await this.conn.query(`
      CREATE TABLE ${tableName} AS
      SELECT * FROM read_csv_auto('${url}')
    `);

    this.log(`Table '${tableName}' created from CSV`, 'success');
  }

  // Load Parquet file
  async loadParquet(url, tableName) {
    await this.ensureLoaded();

    this.log(`Loading Parquet from ${url}...`, 'info');

    await this.conn.query(`
      CREATE TABLE ${tableName} AS
      SELECT * FROM read_parquet('${url}')
    `);

    this.log(`Table '${tableName}' created from Parquet`, 'success');
  }

  // Export results to CSV
  async exportToCSV(query, filename = 'export.csv') {
    const result = await this.conn.query(query);
    const rows = result.toArray();

    // Convert to CSV string
    const columns = Object.keys(rows[0]);
    const csv = [
      columns.join(','),
      ...rows.map(row =>
        columns.map(col =>
          JSON.stringify(row[col] ?? '')
        ).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    this.log(`Exported to ${filename}`, 'success');
  }

  async dispose() {
    if (this.conn) await this.conn.close();
    if (this.db) await this.db.terminate();
    await super.dispose();
  }
}
```

#### DuckDB Features

**Advanced Analytics:**
- 10-100x faster than SQLite for OLAP queries
- Vectorized execution engine
- Columnar storage format
- Advanced aggregations and window functions
- Full SQL:2003 support

**File Format Support:**
- CSV (with automatic schema detection)
- Parquet (columnar format)
- JSON (nested data)
- Apache Arrow (zero-copy)

**Example Queries:**

```sql
-- Read CSV directly from URL
SELECT * FROM read_csv_auto('https://example.com/data.csv')
LIMIT 10;

-- Analytics query with window functions
SELECT
    product,
    month,
    sales,
    SUM(sales) OVER (
        PARTITION BY product
        ORDER BY month
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as rolling_3month_sales
FROM sales_data
ORDER BY product, month;

-- Complex aggregations
SELECT
    category,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY price) as p90_price,
    STDDEV(price) as price_stddev
FROM products
GROUP BY category;

-- Nested data with JSON
SELECT
    json_extract(data, '$.user.name') as name,
    json_extract(data, '$.purchases[*].amount') as purchase_amounts
FROM api_data;

-- Time series analysis
SELECT
    DATE_TRUNC('month', timestamp) as month,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
FROM events
WHERE timestamp >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', timestamp)
ORDER BY month;
```

---

### 2.3 PostgreSQL (PGlite)

**Overview:**
PGlite is a WASM build of PostgreSQL that runs in the browser, providing full Postgres compatibility including extensions like pgvector.

**Specifications:**
- **Engine:** PGlite
- **Package:** `@electric-sql/pglite@0.1.0`
- **Size:** 3MB
- **Load Time:** 2-3 seconds
- **Monetization:** Pro tier
- **Use Cases:** Learning Postgres, testing queries, migration development

#### Implementation

```javascript
// src/runtimes/databases/PGliteRuntime.js
import BaseRuntime from '../BaseRuntime.js';
import { PGlite } from '@electric-sql/pglite';

export default class PGliteRuntime extends BaseRuntime {
  constructor() {
    super('pglite', { version: '16.0' });
    this.db = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading PostgreSQL runtime (3MB)...', 'info');

    // Initialize PGlite (in-memory by default)
    this.db = new PGlite();

    this.loaded = true;
    this.log('PostgreSQL 16 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      const statements = this.parseStatements(code);

      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;

        const startTime = performance.now();
        const result = await this.db.query(trimmed);
        const duration = performance.now() - startTime;

        if (result.rows && result.rows.length > 0) {
          this.displayTable(result.rows, result.fields, duration);
        } else {
          this.log(
            `${result.command} (${result.rowCount} rows, ${duration.toFixed(2)}ms)`,
            'success'
          );
        }
      }
    } catch (error) {
      this.log(`PostgreSQL Error: ${error.message}`, 'stderr');
      throw error;
    }
  }

  displayTable(rows, fields, duration) {
    if (rows.length === 0) {
      this.log('(0 rows returned)\n');
      return;
    }

    const columns = fields.map(f => f.name);

    // Calculate column widths
    const widths = columns.map((col, i) => {
      const maxValueLength = Math.max(
        ...rows.map(row => String(row[col] ?? '').length)
      );
      return Math.max(col.length, maxValueLength);
    });

    // Header
    const header = columns
      .map((col, i) => col.padEnd(widths[i]))
      .join(' | ');
    this.log(header);
    this.log('-'.repeat(header.length));

    // Rows
    for (const row of rows) {
      const rowStr = columns
        .map((col, i) => String(row[col] ?? 'NULL').padEnd(widths[i]))
        .join(' | ');
      this.log(rowStr);
    }

    this.log(`\n(${rows.length} rows in ${duration.toFixed(2)}ms)\n`);
  }

  async dispose() {
    if (this.db) {
      await this.db.close();
    }
    await super.dispose();
  }
}
```

#### PostgreSQL Features

**Full Postgres SQL:**
- Advanced data types (arrays, JSON, JSONB, UUID)
- Window functions and CTEs
- Full-text search
- Recursive queries
- Lateral joins
- Extensions (limited in WASM)

**Example Queries:**

```sql
-- Array data type
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name TEXT,
    grades INTEGER[]
);

INSERT INTO students (name, grades) VALUES
    ('Alice', ARRAY[95, 87, 92]),
    ('Bob', ARRAY[78, 85, 90]);

SELECT name, grades[1] as first_grade FROM students;

-- JSON/JSONB
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    data JSONB
);

INSERT INTO api_logs (data) VALUES
    ('{"method": "GET", "path": "/api/users", "status": 200}'::jsonb),
    ('{"method": "POST", "path": "/api/orders", "status": 201}'::jsonb);

SELECT
    data->>'method' as method,
    data->>'path' as path,
    data->>'status' as status
FROM api_logs
WHERE data->>'method' = 'GET';

-- Recursive CTE
WITH RECURSIVE countdown(n) AS (
    VALUES (10)
    UNION ALL
    SELECT n-1 FROM countdown WHERE n > 1
)
SELECT n FROM countdown;

-- Full-text search
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    tsv TSVECTOR
);

-- Update tsv column with text search vector
UPDATE articles SET tsv =
    to_tsvector('english', title || ' ' || content);

-- Search
SELECT title FROM articles
WHERE tsv @@ to_tsquery('english', 'postgres & database');
```

---

## 3. NoSQL Databases

### 3.1 IndexedDB (Native)

**Overview:**
IndexedDB is the browser's native key-value/document store, perfect for storing user data, files, and application state.

```javascript
// Direct IndexedDB usage example
const request = indexedDB.open('MyDatabase', 1);

request.onsuccess = (event) => {
  const db = event.target.result;
  const transaction = db.transaction(['files'], 'readwrite');
  const store = transaction.objectStore('files');

  store.put({ path: '/hello.py', content: 'print("Hello")' });
};
```

### 3.2 PouchDB

**Overview:**
PouchDB is a browser-based database that syncs with CouchDB, enabling offline-first applications.

```javascript
import PouchDB from 'pouchdb';

const db = new PouchDB('mydatabase');

// Insert document
await db.put({
  _id: 'user_1',
  name: 'Alice',
  email: 'alice@example.com'
});

// Query
const doc = await db.get('user_1');
console.log(doc);

// Sync with remote CouchDB
const remoteDB = new PouchDB('https://example.com/db');
db.sync(remoteDB);
```

---

## 4. Data Import/Export

### 4.1 CSV Import

```javascript
// DuckDB CSV import
await duckdb.loadCSV('https://example.com/data.csv', 'my_table');

// SQLite CSV import (via INSERT)
const csvData = await fetch('data.csv').then(r => r.text());
const rows = csvData.split('\n').slice(1); // Skip header

for (const row of rows) {
  const values = row.split(',');
  await sqlite.execute(
    `INSERT INTO my_table VALUES (${values.map(v => `'${v}'`).join(',')})`
  );
}
```

### 4.2 JSON Import

```javascript
// PostgreSQL JSONB import
const jsonData = await fetch('data.json').then(r => r.json());

for (const item of jsonData) {
  await pglite.execute(
    `INSERT INTO my_table (data) VALUES ($1)`,
    [JSON.stringify(item)]
  );
}
```

### 4.3 Export to CSV

```javascript
// Export query results to CSV
async function exportToCSV(query, filename) {
  const result = await db.query(query);
  const rows = result.toArray();

  const csv = [
    Object.keys(rows[0]).join(','),
    ...rows.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

---

## 5. Performance Considerations

### 5.1 Database Benchmarks

| Query Type | SQLite | DuckDB | PostgreSQL |
|-----------|--------|--------|------------|
| Simple SELECT | 1x | 1x | 1x |
| Aggregation (100k rows) | 1x | 10x | 2x |
| JOIN (2 tables, 10k rows) | 1x | 8x | 2x |
| Window functions | 1x | 15x | 2x |
| Full table scan (1M rows) | 1x | 20x | 3x |

**Recommendations:**
- **Small datasets (<10k rows)**: SQLite is sufficient
- **Analytics queries**: DuckDB is 10-100x faster
- **Postgres-specific features**: PGlite for compatibility
- **Learning SQL**: Start with SQLite, graduate to DuckDB

---

## 6. Database Persistence

### 6.1 Save to IndexedDB

```javascript
// Save database state
const dbData = sqliteRuntime.exportDatabase(); // Uint8Array

await storageManager.saveDatabase('my_database', 'sqlite', dbData);
```

### 6.2 Load from IndexedDB

```javascript
// Restore database state
const saved = await storageManager.loadDatabase('my_database');

if (saved) {
  sqliteRuntime.importDatabase(saved.data);
}
```

### 6.3 Auto-Save

```javascript
// Auto-save every 5 minutes
setInterval(async () => {
  await sqliteRuntime.saveToStorage('autosave');
}, 5 * 60 * 1000);
```

---

**Document End**
