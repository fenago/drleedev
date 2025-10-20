# API Reference Documentation
## DrLee IDE - Public APIs and Interfaces

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Developer Reference

---

## Table of Contents

1. [Core APIs](#1-core-apis)
2. [Runtime Manager API](#2-runtime-manager-api)
3. [Database Manager API](#3-database-manager-api)
4. [File Manager API](#4-file-manager-api)
5. [Storage Manager API](#5-storage-manager-api)
6. [Monaco Editor API](#6-monaco-editor-api)
7. [Events and Callbacks](#7-events-and-callbacks)

---

## 1. Core APIs

### 1.1 DrLeeIDE Application

Main application class that initializes and manages the IDE.

```typescript
class DrLeeIDE {
  constructor(config?: IDEConfig);

  /**
   * Initialize the IDE application
   */
  async init(): Promise<void>;

  /**
   * Run code in the selected language
   */
  async runCode(code: string, language: string, options?: RunOptions): Promise<any>;

  /**
   * Get the current editor instance
   */
  getEditor(): monaco.editor.IStandaloneCodeEditor;

  /**
   * Get the runtime manager
   */
  getRuntimeManager(): RuntimeManager;

  /**
   * Get the database manager
   */
  getDatabaseManager(): DatabaseManager;

  /**
   * Get the file manager
   */
  getFileManager(): FileManager;

  /**
   * Dispose and cleanup
   */
  async dispose(): Promise<void>;
}
```

**Types:**

```typescript
interface IDEConfig {
  container: HTMLElement;
  theme?: 'dark' | 'light';
  defaultLanguage?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  apiUrl?: string; // For premium features
  getAuthToken?: () => Promise<string>;
}

interface RunOptions {
  packages?: string[]; // Python packages to install
  timeout?: number; // Execution timeout (ms)
  stdin?: string; // Standard input
  env?: Record<string, string>; // Environment variables
}
```

**Usage Example:**

```javascript
import { DrLeeIDE } from './drlee-ide';

const ide = new DrLeeIDE({
  container: document.getElementById('app'),
  theme: 'dark',
  defaultLanguage: 'python',
  autoSave: true,
  autoSaveInterval: 30000 // 30 seconds
});

await ide.init();

// Run code
const result = await ide.runCode('print("Hello, World!")', 'python');
console.log(result);
```

---

## 2. Runtime Manager API

Manages all language runtimes and code execution.

### 2.1 Class Definition

```typescript
class RuntimeManager {
  /**
   * Get or create a runtime instance
   */
  async getRuntime(languageId: string): Promise<BaseRuntime>;

  /**
   * Execute code in specified language
   */
  async execute(
    languageId: string,
    code: string,
    options?: ExecuteOptions
  ): Promise<any>;

  /**
   * Set output callback for all runtimes
   */
  setOutputCallback(callback: OutputCallback): void;

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): LanguageInfo[];

  /**
   * Get list of supported databases
   */
  getSupportedDatabases(): DatabaseInfo[];

  /**
   * Preload specific runtimes
   */
  async preload(languageIds: string[]): Promise<void>;

  /**
   * Check if runtime is loaded
   */
  isLoaded(languageId: string): boolean;

  /**
   * Get memory usage information
   */
  getMemoryUsage(): MemoryInfo | null;

  /**
   * Cleanup all runtimes
   */
  async dispose(): Promise<void>;
}
```

**Types:**

```typescript
interface ExecuteOptions {
  packages?: string[];
  timeout?: number;
  stdin?: string;
  env?: Record<string, string>;
}

interface LanguageInfo {
  id: string;
  label: string;
  category: 'language' | 'database';
  tier: number;
  loaded: boolean;
  size?: string;
  version?: string;
}

interface DatabaseInfo {
  id: string;
  label: string;
  loaded: boolean;
  size?: string;
  features?: string[];
}

interface MemoryInfo {
  used: string; // "123.45 MB"
  total: string;
  limit: string;
  percentage: number;
}

type OutputCallback = (output: OutputMessage) => void;

interface OutputMessage {
  message: string;
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'error';
  timestamp: number;
}
```

**Usage Example:**

```javascript
const runtimeManager = new RuntimeManager();

// Set output callback
runtimeManager.setOutputCallback((output) => {
  console.log(`[${output.type}] ${output.message}`);
});

// Execute Python code
const result = await runtimeManager.execute('python', `
import numpy as np
print(np.array([1, 2, 3]).mean())
`);

// Get supported languages
const languages = runtimeManager.getSupportedLanguages();
console.log(languages);

// Preload languages
await runtimeManager.preload(['python', 'javascript', 'lua']);

// Check memory
const memory = runtimeManager.getMemoryUsage();
console.log(`Memory: ${memory.used} / ${memory.limit}`);
```

---

## 3. Database Manager API

Manages database connections and query execution.

### 3.1 Class Definition

```typescript
class DatabaseManager {
  /**
   * Get or create a database instance
   */
  async getDatabase(databaseId: string): Promise<BaseDatabase>;

  /**
   * Execute SQL query
   */
  async query(
    databaseId: string,
    sql: string,
    params?: any[]
  ): Promise<QueryResult>;

  /**
   * Import data from file
   */
  async importData(
    databaseId: string,
    file: File,
    tableName: string,
    options?: ImportOptions
  ): Promise<void>;

  /**
   * Export query results
   */
  async exportResults(
    query: string,
    format: 'csv' | 'json' | 'sql',
    filename: string
  ): Promise<void>;

  /**
   * List tables in database
   */
  async listTables(databaseId: string): Promise<TableInfo[]>;

  /**
   * Get table schema
   */
  async getTableSchema(
    databaseId: string,
    tableName: string
  ): Promise<ColumnInfo[]>;

  /**
   * Save database to storage
   */
  async saveDatabase(
    databaseId: string,
    name: string
  ): Promise<void>;

  /**
   * Load database from storage
   */
  async loadDatabase(
    databaseId: string,
    name: string
  ): Promise<void>;

  /**
   * Cleanup database instance
   */
  async dispose(databaseId: string): Promise<void>;
}
```

**Types:**

```typescript
interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  duration: number; // milliseconds
}

interface ImportOptions {
  delimiter?: string;
  hasHeader?: boolean;
  encoding?: string;
}

interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  primaryKey: boolean;
}
```

**Usage Example:**

```javascript
const dbManager = new DatabaseManager();

// Execute query
const result = await dbManager.query('duckdb', `
  SELECT * FROM read_csv_auto('data.csv')
  WHERE amount > 100
`);

console.log(`Found ${result.rowCount} rows in ${result.duration}ms`);

// Import CSV
const file = document.getElementById('fileInput').files[0];
await dbManager.importData('sqlite', file, 'sales_data');

// List tables
const tables = await dbManager.listTables('sqlite');
console.log('Tables:', tables);

// Get schema
const schema = await dbManager.getTableSchema('sqlite', 'sales_data');
console.log('Columns:', schema);

// Export results
await dbManager.exportResults(
  'SELECT * FROM sales_data',
  'csv',
  'export.csv'
);
```

---

## 4. File Manager API

Manages file operations and persistence.

### 4.1 Class Definition

```typescript
class FileManager {
  /**
   * Create a new file
   */
  async createFile(path: string, content: string, language: string): Promise<void>;

  /**
   * Save file
   */
  async saveFile(path: string, content: string): Promise<void>;

  /**
   * Load file
   */
  async loadFile(path: string): Promise<FileData | null>;

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void>;

  /**
   * Rename file
   */
  async renameFile(oldPath: string, newPath: string): Promise<void>;

  /**
   * List all files
   */
  async listFiles(filter?: FileFilter): Promise<FileInfo[]>;

  /**
   * Import file from local filesystem
   */
  async importFile(file: File): Promise<string>; // Returns path

  /**
   * Export file to local filesystem
   */
  async exportFile(path: string): Promise<void>;

  /**
   * Get file info
   */
  async getFileInfo(path: string): Promise<FileInfo | null>;

  /**
   * Get total storage usage
   */
  async getStorageUsage(): Promise<StorageInfo>;
}
```

**Types:**

```typescript
interface FileData {
  path: string;
  content: string;
  language: string;
  createdAt: number;
  modifiedAt: number;
  size: number;
}

interface FileInfo {
  path: string;
  language: string;
  modifiedAt: number;
  size: number;
}

interface FileFilter {
  language?: string;
  pattern?: string; // Regex pattern for path
  modifiedAfter?: number; // Timestamp
}

interface StorageInfo {
  used: number; // bytes
  available: number;
  quota: number;
  percentage: number;
}
```

**Usage Example:**

```javascript
const fileManager = new FileManager();

// Create file
await fileManager.createFile(
  '/projects/hello.py',
  'print("Hello, World!")',
  'python'
);

// Load file
const file = await fileManager.loadFile('/projects/hello.py');
console.log(file.content);

// List files
const files = await fileManager.listFiles({
  language: 'python'
});

// Import from local
const input = document.getElementById('fileInput');
const path = await fileManager.importFile(input.files[0]);
console.log(`Imported to ${path}`);

// Get storage usage
const storage = await fileManager.getStorageUsage();
console.log(`Using ${storage.percentage}% of quota`);
```

---

## 5. Storage Manager API

Low-level IndexedDB operations.

### 5.1 Class Definition

```typescript
class StorageManager {
  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void>;

  /**
   * Save file to storage
   */
  async saveFile(path: string, content: string, language: string): Promise<void>;

  /**
   * Load file from storage
   */
  async loadFile(path: string): Promise<FileData | null>;

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<void>;

  /**
   * List all files
   */
  async listFiles(language?: string): Promise<FileData[]>;

  /**
   * Save setting
   */
  async saveSetting(key: string, value: any): Promise<void>;

  /**
   * Load setting
   */
  async loadSetting(key: string): Promise<any>;

  /**
   * Save database
   */
  async saveDatabase(name: string, type: string, data: Uint8Array): Promise<void>;

  /**
   * Load database
   */
  async loadDatabase(name: string): Promise<DatabaseData | null>;

  /**
   * Get quota information
   */
  async getQuota(): Promise<QuotaInfo>;

  /**
   * Clear all data
   */
  async clearAll(): Promise<void>;
}
```

**Types:**

```typescript
interface DatabaseData {
  name: string;
  type: 'sqlite' | 'duckdb' | 'postgres';
  data: Uint8Array;
  createdAt: number;
  modifiedAt: number;
  size: number;
}

interface QuotaInfo {
  usage: number; // bytes
  quota: number; // bytes
  available: number; // bytes
  percentage: number;
}
```

---

## 6. Monaco Editor API

Monaco Editor integration and configuration.

### 6.1 Editor Creation

```typescript
interface EditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
  value?: string;
  language?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize?: number;
  minimap?: {
    enabled: boolean;
  };
  automaticLayout?: boolean;
  wordWrap?: 'on' | 'off';
  lineNumbers?: 'on' | 'off' | 'relative';
}

function createEditor(
  container: HTMLElement,
  options: EditorOptions
): monaco.editor.IStandaloneCodeEditor;
```

**Usage:**

```javascript
import * as monaco from 'monaco-editor';

const editor = monaco.editor.create(document.getElementById('editor'), {
  value: 'print("Hello, World!")',
  language: 'python',
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: true },
  automaticLayout: true,
  wordWrap: 'on'
});

// Get value
const code = editor.getValue();

// Set value
editor.setValue('console.log("Hello!");');

// Set language
monaco.editor.setModelLanguage(editor.getModel(), 'javascript');

// Listen to changes
editor.onDidChangeModelContent((event) => {
  console.log('Content changed:', editor.getValue());
});

// Dispose
editor.dispose();
```

---

## 7. Events and Callbacks

### 7.1 Output Events

```typescript
interface OutputEvent {
  message: string;
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'error';
  timestamp: number;
  languageId?: string;
}

// Subscribe to output
runtimeManager.setOutputCallback((event: OutputEvent) => {
  console.log(`[${event.type}] ${event.message}`);
});
```

### 7.2 Editor Events

```typescript
// Content changed
editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent) => {
  console.log('Content changed');
});

// Cursor position changed
editor.onDidChangeCursorPosition((e: monaco.editor.ICursorPositionChangedEvent) => {
  console.log(`Cursor at line ${e.position.lineNumber}`);
});

// Language changed
editor.getModel().onDidChangeLanguage((e: monaco.editor.IModelLanguageChangedEvent) => {
  console.log(`Language changed to ${e.newLanguage}`);
});
```

### 7.3 File Events

```typescript
interface FileEvent {
  type: 'created' | 'updated' | 'deleted';
  path: string;
  timestamp: number;
}

// Subscribe to file events
fileManager.on('file', (event: FileEvent) => {
  console.log(`File ${event.type}: ${event.path}`);
});
```

---

## 8. Error Handling

### 8.1 Error Types

```typescript
class RuntimeError extends Error {
  constructor(
    public languageId: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'RuntimeError';
  }
}

class PaywallError extends Error {
  constructor(
    public languageId: string,
    public requiredTier: 'pro' | 'enterprise',
    message: string
  ) {
    super(message);
    this.name = 'PaywallError';
  }
}

class StorageQuotaError extends Error {
  constructor(
    public usage: number,
    public quota: number,
    message: string
  ) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}
```

### 8.2 Error Handling Example

```javascript
try {
  await runtimeManager.execute('python', code);
} catch (error) {
  if (error instanceof PaywallError) {
    // Show upgrade prompt
    showUpgradeModal(error.languageId, error.requiredTier);
  } else if (error instanceof RuntimeError) {
    // Show error in output panel
    outputPanel.showError(error.message);
  } else if (error instanceof StorageQuotaError) {
    // Show storage cleanup UI
    showStorageCleanup(error.usage, error.quota);
  } else {
    // Generic error
    console.error(error);
  }
}
```

---

## 9. Extending DrLee IDE

### 9.1 Adding a Custom Language Runtime

```typescript
import { BaseRuntime } from './runtimes/BaseRuntime';

class MyLanguageRuntime extends BaseRuntime {
  constructor() {
    super('mylang', { version: '1.0' });
  }

  async load() {
    // Load your WASM runtime
    this.runtime = await loadMyRuntime();
    this.loaded = true;
  }

  async execute(code: string, options?: any) {
    await this.ensureLoaded();

    try {
      const result = await this.runtime.run(code);
      this.log(result);
      return result;
    } catch (error) {
      this.log(error.message, 'stderr');
      throw error;
    }
  }
}

// Register with RuntimeManager
runtimeManager.registerRuntime('mylang', MyLanguageRuntime);
```

### 9.2 Adding Custom Database Engine

```typescript
import { BaseDatabase } from './databases/BaseDatabase';

class MyDatabaseRuntime extends BaseDatabase {
  constructor() {
    super('mydb', { version: '1.0' });
  }

  async load() {
    // Load database engine
    this.db = await loadMyDatabase();
    this.loaded = true;
  }

  async query(sql: string, params?: any[]) {
    await this.ensureLoaded();

    const result = await this.db.execute(sql, params);
    return {
      rows: result.rows,
      columns: result.columns,
      rowCount: result.rowCount
    };
  }
}

// Register with DatabaseManager
databaseManager.registerDatabase('mydb', MyDatabaseRuntime);
```

---

**Document End**
