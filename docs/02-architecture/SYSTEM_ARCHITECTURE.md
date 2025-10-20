# System Architecture Documentation
## DrLee IDE - Browser-Based Multi-Language Development Environment

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Technical Specification

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Components](#2-system-components)
3. [Technology Stack](#3-technology-stack)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Runtime System](#5-runtime-system)
6. [Storage Architecture](#6-storage-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Performance Architecture](#8-performance-architecture)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

DrLee IDE follows a **client-side, monolithic architecture** where all computation, storage, and execution occur within the user's browser. This eliminates the need for backend servers and ensures complete data privacy.

```
┌───────────────────────────────────────────────────────────────────┐
│                         Browser Environment                        │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Application Layer                          │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │   React    │  │   State      │  │   Event Manager      │ │ │
│  │  │   App      │  │   Manager    │  │                      │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Presentation Layer                         │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │   Monaco   │  │   UI         │  │   Output Panel       │ │ │
│  │  │   Editor   │  │   Components │  │                      │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Business Logic Layer                       │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │  Runtime   │  │   Database   │  │   File System        │ │ │
│  │  │  Manager   │  │   Manager    │  │   Manager            │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Execution Layer (WebAssembly)              │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │  Language  │  │   Database   │  │   Web Workers        │ │ │
│  │  │  Runtimes  │  │   Engines    │  │                      │ │ │
│  │  │  (WASM)    │  │   (WASM)     │  │                      │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↕                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Storage Layer                              │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ IndexedDB  │  │ LocalStorage │  │   Cache API          │ │ │
│  │  │            │  │              │  │                      │ │ │
│  │  └────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
                              ↕
┌───────────────────────────────────────────────────────────────────┐
│                         External Resources                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │    CDN     │  │   WASM       │  │   Static Assets          │  │
│  │  (Monaco)  │  │   Binaries   │  │   (CSS, Fonts)           │  │
│  └────────────┘  └──────────────┘  └──────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Principles

1. **Client-Side First**: All processing occurs in the browser - no backend servers
2. **Privacy by Design**: User code never leaves the browser
3. **Progressive Enhancement**: Core features work with gradual enhancement
4. **Lazy Loading**: Load resources only when needed
5. **Modular Design**: Independent, pluggable components
6. **Performance Optimized**: Minimize bundle size, maximize execution speed
7. **Sandboxed Execution**: All code runs in isolated WebAssembly environments

### 1.3 Design Patterns

- **Singleton Pattern**: RuntimeManager, DatabaseManager (single instances)
- **Factory Pattern**: Runtime creation based on language type
- **Observer Pattern**: Output callbacks, state change notifications
- **Strategy Pattern**: Different execution strategies per language
- **Plugin Architecture**: Extensible language and database support

---

## 2. System Components

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        DrLee IDE                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ UI Layer                                              │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Toolbar   │  │    Editor    │  │   Output    │ │ │
│  │  │  Component  │  │   Component  │  │   Panel     │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Language   │  │     File     │  │  Settings   │ │ │
│  │  │  Selector   │  │   Explorer   │  │   Panel     │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Core Managers                                         │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Runtime    │  │   Database   │  │    File     │ │ │
│  │  │  Manager    │  │   Manager    │  │   Manager   │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   State     │  │    Storage   │  │   Worker    │ │ │
│  │  │  Manager    │  │   Manager    │  │   Pool      │ │ │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Runtime Layer (Pluggable)                             │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │  BaseRuntime (Abstract)                       │   │ │
│  │  │  - load()                                      │   │ │
│  │  │  - execute()                                   │   │ │
│  │  │  - dispose()                                   │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  │           ↑              ↑              ↑             │ │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  Python     │  │   Ruby   │  │     Lua      │   │ │
│  │  │  Runtime    │  │ Runtime  │  │   Runtime    │   │ │
│  │  └─────────────┘  └──────────┘  └──────────────┘   │ │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  SQLite     │  │  DuckDB  │  │   PGlite     │   │ │
│  │  │  Runtime    │  │ Runtime  │  │   Runtime    │   │ │
│  │  └─────────────┘  └──────────┘  └──────────────┘   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

#### 2.2.1 UI Components

**MonacoEditor Component**
- Renders code editor
- Handles syntax highlighting
- Manages editor state (cursor, selection)
- Provides IntelliSense/auto-completion
- Emits code change events

**Toolbar Component**
- Displays application controls
- Handles user actions (Run, Save, Clear)
- Shows status indicators
- Manages settings menu

**OutputPanel Component**
- Displays execution output
- Formats output by type (stdout, stderr, info)
- Manages scrolling and overflow
- Shows performance metrics

**LanguageSelector Component**
- Displays available languages
- Handles language switching
- Shows runtime loading status
- Categorizes languages (by type, tier)

**FileExplorer Component**
- Lists saved files
- Handles file operations (open, delete, rename)
- Organizes files into folders
- Shows file metadata

#### 2.2.2 Manager Components

**RuntimeManager**
- Maintains registry of all language runtimes
- Lazy-loads runtimes on demand
- Routes code execution to appropriate runtime
- Manages runtime lifecycle
- Handles runtime errors
- Provides runtime metadata

**DatabaseManager**
- Manages database connections
- Routes queries to appropriate database engine
- Handles result formatting
- Manages transactions
- Provides database metadata

**FileManager**
- Handles file CRUD operations
- Manages file storage in IndexedDB
- Implements auto-save logic
- Handles file import/export
- Manages file versioning

**StateManager**
- Maintains application state
- Handles state persistence
- Manages state synchronization
- Provides state change notifications

**StorageManager**
- Abstracts IndexedDB operations
- Manages storage quotas
- Handles data migration
- Implements cleanup logic

**WorkerPool**
- Manages Web Worker instances
- Distributes heavy tasks to workers
- Handles worker communication
- Implements worker recycling

---

## 3. Technology Stack

### 3.1 Frontend Technologies

**Core Framework**
```javascript
{
  "framework": "Vanilla JavaScript (ES6+) or React 18",
  "language": "TypeScript 5.3+",
  "buildTool": "Vite 5.0+",
  "packageManager": "npm or pnpm"
}
```

**Editor**
```javascript
{
  "editor": "Monaco Editor",
  "version": "0.45.0+",
  "features": [
    "syntax highlighting",
    "IntelliSense",
    "multi-cursor",
    "code folding",
    "find/replace"
  ]
}
```

**UI Libraries**
```javascript
{
  "styling": "CSS3 with CSS Variables",
  "icons": "Lucide Icons or Heroicons",
  "fonts": "JetBrains Mono (monospace), Inter (UI)"
}
```

### 3.2 WebAssembly Runtimes

**Language Runtimes**
```javascript
{
  "python": {
    "runtime": "Pyodide",
    "version": "0.24.1+",
    "size": "6.5MB",
    "package": "pyodide"
  },
  "ruby": {
    "runtime": "ruby.wasm",
    "version": "2.5.0+",
    "size": "15MB",
    "package": "@ruby/wasm-wasi"
  },
  "lua": {
    "runtime": "Wasmoon",
    "version": "1.16.0+",
    "size": "200KB",
    "package": "wasmoon"
  },
  "php": {
    "runtime": "php-wasm",
    "version": "0.0.9+",
    "size": "5MB",
    "package": "php-wasm"
  },
  "scheme": {
    "runtime": "BiwaScheme",
    "version": "0.8.0+",
    "size": "300KB",
    "package": "biwascheme"
  },
  "r": {
    "runtime": "webR",
    "version": "0.2.2+",
    "size": "20MB",
    "package": "webr"
  }
}
```

**Database Engines**
```javascript
{
  "sqlite": {
    "engine": "sql.js",
    "version": "1.8.0+",
    "size": "2MB",
    "package": "sql.js"
  },
  "duckdb": {
    "engine": "DuckDB-WASM",
    "version": "1.28.0+",
    "size": "5MB",
    "package": "@duckdb/duckdb-wasm"
  },
  "postgres": {
    "engine": "PGlite",
    "version": "0.1.0+",
    "size": "3MB",
    "package": "@electric-sql/pglite"
  }
}
```

### 3.3 Storage Technologies

```javascript
{
  "primary": "IndexedDB",
  "secondary": "LocalStorage",
  "cache": "Cache API (Service Worker)",
  "libraries": {
    "indexedDB": "Native API or Dexie.js",
    "pouchDB": "8.0.1+ (for sync capabilities)"
  }
}
```

### 3.4 Build & Development Tools

```javascript
{
  "bundler": "Vite 5.0+",
  "transpiler": "TypeScript 5.3+",
  "linter": "ESLint 8.0+",
  "formatter": "Prettier 3.0+",
  "testing": {
    "unit": "Vitest",
    "e2e": "Playwright",
    "coverage": "c8"
  },
  "ci/cd": "GitHub Actions",
  "versionControl": "Git"
}
```

### 3.5 Deployment Stack

```javascript
{
  "hosting": "Netlify or Vercel",
  "cdn": "Cloudflare CDN",
  "ssl": "Let's Encrypt (auto)",
  "dns": "Cloudflare DNS",
  "monitoring": {
    "analytics": "Plausible Analytics",
    "errors": "Sentry",
    "performance": "Web Vitals"
  }
}
```

---

## 4. Data Flow Architecture

### 4.1 Code Execution Flow

```
┌──────────────┐
│   User       │
│   Types      │
│   Code       │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Monaco Editor       │
│  - Syntax highlight  │
│  - Auto-save (30s)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  User Clicks "Run"   │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────────┐
│  Application Layer             │
│  - Validate code               │
│  - Get selected language       │
│  - Prepare execution context   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│  RuntimeManager                │
│  - Get or create runtime       │
│  - Ensure runtime loaded       │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│  Language Runtime (e.g. Python)│
│  - Initialize if needed        │
│  - Execute code in WASM        │
│  - Capture output              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│  Output Callback               │
│  - Format output               │
│  - Display in Output Panel     │
│  - Log execution time          │
└────────────────────────────────┘
```

### 4.2 Runtime Loading Flow

```
┌─────────────────────┐
│  User Selects       │
│  Language           │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────────────┐
│  RuntimeManager             │
│  - Check if runtime exists  │
└─────┬───────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  Runtime Exists?            │
└─────┬───────────────────────┘
      │
      ├─ Yes ──────────────────┐
      │                        │
      └─ No ───┐               │
               │               │
               ▼               │
    ┌────────────────────┐    │
    │  Create Runtime    │    │
    │  Instance          │    │
    └────────┬───────────┘    │
             │                │
             ▼                │
    ┌────────────────────┐    │
    │  Load WASM Binary  │    │
    │  from CDN          │    │
    └────────┬───────────┘    │
             │                │
             ▼                │
    ┌────────────────────┐    │
    │  Initialize        │    │
    │  Runtime           │    │
    │  (3-10 seconds)    │    │
    └────────┬───────────┘    │
             │                │
             ▼                │
    ┌────────────────────┐    │
    │  Cache Runtime     │    │
    │  Instance          │    │
    └────────┬───────────┘    │
             │                │
             └────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Runtime Ready │
            └────────────────┘
```

### 4.3 File Persistence Flow

```
┌──────────────────┐
│  User Types Code │
└────┬─────────────┘
     │
     ▼
┌──────────────────────┐
│  Monaco Editor       │
│  onChange Event      │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Debounce (500ms)    │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  FileManager         │
│  - Get file metadata │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  StorageManager      │
│  - Prepare data      │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  IndexedDB           │
│  - Save file object  │
│  {                   │
│    path,             │
│    content,          │
│    language,         │
│    timestamp         │
│  }                   │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Success Callback    │
│  - Update UI         │
│  - Show save icon    │
└──────────────────────┘
```

### 4.4 Database Query Flow

```
┌──────────────────┐
│  User Writes SQL │
└────┬─────────────┘
     │
     ▼
┌──────────────────────┐
│  User Clicks Run     │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  DatabaseManager     │
│  - Parse SQL         │
│  - Get DB type       │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Database Runtime    │
│  (e.g., DuckDB)      │
│  - Execute query     │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Format Results      │
│  - Convert to JSON   │
│  - Create table view │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Output Panel        │
│  - Display table     │
│  - Show row count    │
│  - Show exec time    │
└──────────────────────┘
```

---

## 5. Runtime System

### 5.1 Runtime Architecture

```javascript
/**
 * BaseRuntime - Abstract base class for all language runtimes
 */
class BaseRuntime {
  constructor(name, config) {
    this.name = name;           // Language name
    this.loaded = false;        // Load status
    this.runtime = null;        // WASM runtime instance
    this.config = config;       // Configuration
    this.outputCallback = null; // Output handler
  }

  // Must be implemented by subclasses
  async load() { throw new Error('Not implemented'); }
  async execute(code, options) { throw new Error('Not implemented'); }

  // Common utilities
  setOutputCallback(callback) { this.outputCallback = callback; }
  log(message, type = 'stdout') { /* ... */ }
  async ensureLoaded() { /* ... */ }
  async dispose() { /* ... */ }
  getInfo() { /* ... */ }
}
```

### 5.2 Runtime Manager

```javascript
/**
 * RuntimeManager - Manages all language runtimes
 */
class RuntimeManager {
  constructor() {
    this.runtimes = new Map();       // Language ID → Runtime instance
    this.registry = this.buildRegistry(); // Language configurations
    this.outputCallback = null;
  }

  /**
   * Registry of all supported languages
   */
  buildRegistry() {
    return {
      python: {
        class: PythonRuntime,
        category: 'language',
        tier: 1,
        label: 'Python 3.11',
        fileExtension: '.py'
      },
      javascript: {
        class: JavaScriptRuntime,
        category: 'language',
        tier: 1,
        label: 'JavaScript',
        fileExtension: '.js'
      },
      // ... more languages
    };
  }

  /**
   * Get or create a runtime instance
   */
  async getRuntime(languageId) {
    if (!this.runtimes.has(languageId)) {
      const config = this.registry[languageId];
      if (!config) throw new Error(`Unsupported language: ${languageId}`);

      const runtime = new config.class();
      runtime.setOutputCallback(this.outputCallback);
      this.runtimes.set(languageId, runtime);
    }
    return this.runtimes.get(languageId);
  }

  /**
   * Execute code in specified language
   */
  async execute(languageId, code, options = {}) {
    const runtime = await this.getRuntime(languageId);
    await runtime.ensureLoaded();
    return await runtime.execute(code, options);
  }
}
```

### 5.3 Example Runtime Implementation

```javascript
/**
 * PythonRuntime - Pyodide implementation
 */
class PythonRuntime extends BaseRuntime {
  constructor() {
    super('python', {
      version: '3.11',
      cdn: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
    });
  }

  async load() {
    if (this.loaded) return;

    // Load Pyodide from CDN
    await this.loadScript(this.config.cdn);

    // Initialize Pyodide
    this.runtime = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      stdout: (text) => this.log(text),
      stderr: (text) => this.log(text, 'stderr')
    });

    this.loaded = true;
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    // Install packages if specified
    if (options.packages?.length > 0) {
      await this.runtime.loadPackagesFromImports(code);
    }

    // Execute Python code
    const result = await this.runtime.runPythonAsync(code);

    if (result !== undefined) {
      this.log(String(result));
    }

    return result;
  }
}
```

### 5.4 Runtime Loading Strategy

**Lazy Loading Pattern**
- Runtimes are NOT loaded on page load
- Runtimes are loaded when:
  1. User selects a language
  2. User clicks "Run" for the first time
  3. Code is automatically executed on page load (future feature)

**Loading Sequence**
1. User selects Python
2. RuntimeManager checks if PythonRuntime exists
3. If not, creates new PythonRuntime instance
4. PythonRuntime downloads Pyodide from CDN (6.5MB)
5. PythonRuntime initializes Pyodide (~3 seconds)
6. Runtime is cached in Map for future use
7. Subsequent executions are instant

**Performance Optimization**
- Use Web Workers for runtime initialization (non-blocking)
- Preload popular languages (Python, JavaScript) on idle
- Cache WASM binaries in Cache API for offline use

---

## 6. Storage Architecture

### 6.1 Storage Schema

**IndexedDB Schema**

```javascript
/**
 * Database: drlee-ide
 * Version: 1
 */

// Object Store: files
{
  keyPath: 'path',
  indexes: [
    { name: 'language', keyPath: 'language' },
    { name: 'modifiedAt', keyPath: 'modifiedAt' }
  ],
  structure: {
    path: String,        // "/python/hello.py"
    content: String,     // File content
    language: String,    // "python"
    createdAt: Number,   // Timestamp
    modifiedAt: Number,  // Timestamp
    size: Number         // Bytes
  }
}

// Object Store: settings
{
  keyPath: 'key',
  structure: {
    key: String,         // "theme", "fontSize", etc.
    value: Any,          // Setting value
    modifiedAt: Number   // Timestamp
  }
}

// Object Store: databases
{
  keyPath: 'name',
  structure: {
    name: String,        // Database name
    type: String,        // "sqlite", "duckdb", "postgres"
    data: ArrayBuffer,   // Serialized database
    createdAt: Number,
    modifiedAt: Number,
    size: Number
  }
}
```

### 6.2 Storage Manager

```javascript
/**
 * StorageManager - Abstracts IndexedDB operations
 */
class StorageManager {
  constructor(dbName = 'drlee-ide', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'path' });
          fileStore.createIndex('language', 'language', { unique: false });
          fileStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('databases')) {
          db.createObjectStore('databases', { keyPath: 'name' });
        }
      };
    });
  }

  // File operations
  async saveFile(path, content, language) { /* ... */ }
  async loadFile(path) { /* ... */ }
  async deleteFile(path) { /* ... */ }
  async listFiles(language = null) { /* ... */ }

  // Settings operations
  async saveSetting(key, value) { /* ... */ }
  async loadSetting(key) { /* ... */ }

  // Database operations
  async saveDatabase(name, type, data) { /* ... */ }
  async loadDatabase(name) { /* ... */ }
}
```

### 6.3 Storage Quota Management

**Quota Detection**
```javascript
async function getStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: (estimate.usage / estimate.quota) * 100
    };
  }
  return null;
}
```

**Quota Warning**
- Warning at 80% usage
- Block new saves at 95% usage
- Suggest file cleanup or export

---

## 7. Security Architecture

### 7.1 Security Principles

1. **Client-Side Execution Only**: No code sent to servers
2. **WebAssembly Sandboxing**: All code runs in isolated WASM environments
3. **No Eval**: Never use `eval()` for JavaScript execution
4. **Content Security Policy**: Strict CSP headers
5. **CORS Configuration**: Proper cross-origin resource sharing
6. **Input Sanitization**: Sanitize all user inputs before rendering

### 7.2 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://cdn.jsdelivr.net;
  worker-src 'self' blob:;
  child-src 'self' blob:;
">
```

### 7.3 Sandboxing Strategy

**WebAssembly Sandboxing**
- All code execution occurs within WASM virtual machines
- No direct access to host system resources
- No file system access (beyond IndexedDB)
- No network access (except CDN for loading)

**Web Worker Isolation**
- Heavy computations run in Web Workers
- Workers have separate global scope
- No DOM access from workers
- Message passing for communication

### 7.4 XSS Prevention

```javascript
/**
 * Sanitize output before rendering
 */
function sanitizeOutput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safe rendering of output
 */
function renderOutput(output) {
  const line = document.createElement('div');
  line.className = `output-line output-${output.type}`;
  line.textContent = output.message; // Use textContent, not innerHTML
  outputPanel.appendChild(line);
}
```

---

## 8. Performance Architecture

### 8.1 Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Initial Load (FCP) | < 1.5s | < 3s |
| Time to Interactive (TTI) | < 3s | < 5s |
| Runtime Initialization | < 5s | < 10s |
| Code Execution Start | < 100ms | < 500ms |
| Keystroke Latency | < 50ms | < 100ms |
| Memory Usage | < 300MB | < 500MB |

### 8.2 Performance Optimization Strategies

**Bundle Optimization**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco': ['monaco-editor'],
          'vendor': ['react', 'react-dom']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
};
```

**Code Splitting**
- Monaco Editor: Separate chunk (~2MB)
- Each runtime: Lazy-loaded on demand
- UI components: Dynamic imports
- Database engines: Lazy-loaded

**CDN Strategy**
```javascript
// Use CDN for large dependencies
const CDN_URLS = {
  pyodide: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js',
  monaco: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
};
```

**Caching Strategy**
```javascript
// Service Worker for caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('drlee-ide-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
      ]);
    })
  );
});
```

### 8.3 Memory Management

**Runtime Cleanup**
```javascript
/**
 * Dispose unused runtimes to free memory
 */
async function cleanupRuntimes() {
  for (const [id, runtime] of this.runtimes.entries()) {
    const lastUsed = runtime.lastUsedTimestamp;
    const now = Date.now();

    // Dispose if unused for 5 minutes
    if (now - lastUsed > 5 * 60 * 1000) {
      await runtime.dispose();
      this.runtimes.delete(id);
    }
  }
}
```

**Memory Monitoring**
```javascript
function getMemoryUsage() {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}
```

---

## 9. Deployment Architecture

### 9.1 Deployment Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  main branch                                      │  │
│  │  - Source code                                    │  │
│  │  - Configuration                                  │  │
│  │  - Tests                                          │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Push to main
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions (CI/CD)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  1. Checkout code                                 │  │
│  │  2. Install dependencies                          │  │
│  │  3. Run tests                                     │  │
│  │  4. Build production bundle                       │  │
│  │  5. Deploy to Netlify                             │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Deploy
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Netlify Edge Network                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Global CDN                                       │  │
│  │  - 100+ edge locations                            │  │
│  │  - Automatic SSL                                  │  │
│  │  - HTTP/2 + Brotli compression                    │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Serve
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  DrLee IDE Application                            │  │
│  │  - Static assets from CDN                         │  │
│  │  - WASM runtimes from CDN                         │  │
│  │  - Local execution in browser                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Build Process

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build for production
npm run build
# Output: dist/ folder

# Preview production build
npm run preview

# Deploy to Netlify
netlify deploy --prod
```

### 9.3 Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 9.4 Environment Configuration

```javascript
// .env.production
VITE_APP_NAME=DrLee IDE
VITE_APP_VERSION=1.0.0
VITE_PYODIDE_CDN=https://cdn.jsdelivr.net/pyodide/v0.24.1/full/
VITE_ANALYTICS_ID=your-analytics-id
VITE_SENTRY_DSN=your-sentry-dsn
```

### 9.5 Monitoring & Observability

**Performance Monitoring**
- Web Vitals (LCP, FID, CLS)
- Custom performance marks
- Runtime initialization time
- Code execution time

**Error Tracking**
- Sentry for error reporting
- Custom error boundaries
- Runtime error logging

**Analytics**
- Plausible Analytics (privacy-focused)
- Custom event tracking
- User flow analysis

---

## Appendices

### Appendix A: File Structure

```
DrLeeIDE/
├── src/
│   ├── main.js                 # Entry point
│   ├── App.jsx                 # Main app component
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── MonacoEditor.jsx
│   │   │   └── EditorConfig.js
│   │   ├── UI/
│   │   │   ├── Toolbar.jsx
│   │   │   ├── OutputPanel.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   └── FileExplorer.jsx
│   │   └── Settings/
│   │       └── SettingsPanel.jsx
│   ├── managers/
│   │   ├── RuntimeManager.js
│   │   ├── DatabaseManager.js
│   │   ├── FileManager.js
│   │   ├── StateManager.js
│   │   └── StorageManager.js
│   ├── runtimes/
│   │   ├── BaseRuntime.js
│   │   ├── languages/
│   │   │   ├── PythonRuntime.js
│   │   │   ├── JavaScriptRuntime.js
│   │   │   ├── RubyRuntime.js
│   │   │   ├── LuaRuntime.js
│   │   │   └── ... (more languages)
│   │   └── databases/
│   │       ├── SQLiteRuntime.js
│   │       ├── DuckDBRuntime.js
│   │       └── PGliteRuntime.js
│   ├── utils/
│   │   ├── workerPool.js
│   │   ├── storage.js
│   │   ├── cdn-loader.js
│   │   └── performance.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── editor.css
│   │   └── themes/
│   │       ├── dark.css
│   │       └── light.css
│   └── workers/
│       └── runtime-worker.js
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── fonts/
│       └── images/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── 01-prd/
│   ├── 02-architecture/
│   ├── 03-languages/
│   ├── 04-databases/
│   ├── 05-api/
│   ├── 06-research/
│   └── 07-deployment/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
├── vite.config.js
├── tsconfig.json
├── netlify.toml
└── README.md
```

### Appendix B: Technology References

- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **Pyodide**: https://pyodide.org/
- **DuckDB-WASM**: https://duckdb.org/docs/api/wasm
- **PGlite**: https://pglite.dev/
- **WebAssembly**: https://webassembly.org/
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Vite**: https://vitejs.dev/
- **Netlify**: https://docs.netlify.com/

---

**Document End**
