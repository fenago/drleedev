# Building the Ultimate WASM Multi-Language IDE

Let's build this! Here's the complete architecture for supporting ALL languages and databases.

---

## 🎯 Complete Language Support Matrix

### **Tier 1: Fully Production Ready**

| Language | Runtime | Size | NPM Package | Difficulty |
|----------|---------|------|-------------|------------|
| **Python** | Pyodide | 6.5MB | `pyodide` | ⭐ Easy |
| **JavaScript** | Native | 0 | - | ⭐ Easy |
| **TypeScript** | Native (transpile) | 0 | `typescript` | ⭐ Easy |
| **Ruby** | ruby.wasm | 15MB | `@ruby/wasm-wasi` | ⭐⭐ Medium |
| **PHP** | php-wasm | 5MB | `php-wasm` | ⭐⭐ Medium |
| **Lua** | Wasmoon | 200KB | `wasmoon` | ⭐ Easy |
| **Rust** | wasm-pack | varies | `@wasm-tool/wasm-pack-plugin` | ⭐⭐⭐ Hard |
| **C/C++** | Emscripten | varies | Custom build | ⭐⭐⭐ Hard |
| **Go** | TinyGo | varies | Custom build | ⭐⭐⭐ Hard |
| **C#** | Blazor | 2MB | Custom .NET | ⭐⭐⭐ Hard |
| **AssemblyScript** | Native WASM | varies | `assemblyscript` | ⭐⭐ Medium |
| **Java** | CheerpJ | 10MB | CheerpJ (commercial) | ⭐⭐⭐ Hard |
| **Kotlin** | Kotlin/Wasm | varies | Custom build | ⭐⭐⭐ Hard |

### **Tier 2: Good Support**

| Language | Runtime | Size | Package | Notes |
|----------|---------|------|---------|-------|
| **Scheme** | BiwaScheme | 300KB | `biwascheme` | Excellent for LISP |
| **Clojure** | ClojureScript | 1MB | `clojurescript` | Via JS compilation |
| **Perl** | WebPerl | 8MB | Custom | Full Perl 5 |
| **R** | webR | 20MB | `webr` | Data science |
| **Scala** | Scala.js | varies | Custom build | JVM on JS |
| **F#** | Fable | varies | `fable-compiler` | .NET functional |
| **Haskell** | Asterius | 5MB | Custom build | Experimental |
| **OCaml** | js_of_ocaml | varies | Custom build | Mature |
| **Elm** | Native | varies | `elm` | Compiles to JS |
| **Forth** | Multiple impls | 50KB | Various | Lightweight |
| **Zig** | Native WASM | varies | Custom build | Modern systems |
| **Swift** | SwiftWasm | varies | Custom build | Apple's language |
| **D** | LDC | varies | Custom build | Systems programming |

### **Tier 3: Experimental/Fun**

| Language | Notes |
|----------|-------|
| **COBOL** | GnuCOBOL via Emscripten |
| **Fortran** | Via f2c + Emscripten |
| **Pascal** | Free Pascal + Emscripten |
| **BASIC** | Various JS implementations |
| **Brainfuck** | Trivial to implement |
| **Lisp** | Multiple dialects available |
| **Prolog** | Tau Prolog (JS) |
| **Smalltalk** | SqueakJS |
| **Julia** | Experimental WASM |
| **Nim** | Can target WASM |
| **Crystal** | Early WASM support |
| **V** | WASM backend available |

---

## 💾 Database Support Matrix

### **SQL Databases**

| Database | Runtime | Size | Package | Features |
|----------|---------|------|---------|----------|
| **SQLite** | sql.js | 2MB | `sql.js` | Full SQL, transactions |
| **DuckDB** | DuckDB-WASM | 5MB | `@duckdb/duckdb-wasm` | Analytics, Parquet, 10x faster |
| **PostgreSQL** | PGlite | 3MB | `@electric-sql/pglite` | Postgres in browser! |
| **MySQL** | MySQL.js (limited) | varies | Custom | Limited support |
| **HSQLDB** | Via CheerpJ | large | Commercial | Java-based |

### **NoSQL/Document Databases**

| Database | Package | Notes |
|----------|---------|-------|
| **IndexedDB** | Native API | Browser built-in, async key-value |
| **LevelDB** | `level-js` | Key-value store |
| **PouchDB** | `pouchdb` | CouchDB protocol, sync capable |
| **RxDB** | `rxdb` | Reactive, multi-tab sync |
| **Dexie.js** | `dexie` | IndexedDB wrapper |
| **LocalForage** | `localforage` | Unified storage API |

### **Graph Databases**

| Database | Package | Notes |
|----------|---------|-------|
| **Memgraph** | WASM port | In development |
| **TypeDB** | Client-side | Query via API |

### **Time Series**

| Database | Package | Notes |
|----------|---------|-------|
| **DuckDB** | `@duckdb/duckdb-wasm` | Excellent for time series |
| **Custom** | Build with SQLite | Roll your own |

### **Vector Databases**

| Database | Package | Notes |
|----------|---------|-------|
| **DuckDB + VSS** | `duckdb-wasm` | Vector similarity search extension |
| **Custom HNSW** | Build in WASM | Roll your own vector search |

---

## 🏗️ Scalable Architecture

### Directory Structure

```
wasm-ide/
├── src/
│   ├── main.js                 # Entry point
│   ├── editor/
│   │   ├── MonacoEditor.js     # Editor component
│   │   └── themes/             # Custom themes
│   ├── runtimes/
│   │   ├── RuntimeManager.js   # Core manager
│   │   ├── BaseRuntime.js      # Abstract base class
│   │   ├── languages/
│   │   │   ├── PythonRuntime.js
│   │   │   ├── RubyRuntime.js
│   │   │   ├── PHPRuntime.js
│   │   │   ├── LuaRuntime.js
│   │   │   ├── RustRuntime.js
│   │   │   ├── GoRuntime.js
│   │   │   ├── SchemeRuntime.js
│   │   │   ├── PerlRuntime.js
│   │   │   ├── RRuntime.js
│   │   │   ├── JavaRuntime.js
│   │   │   └── ... (30+ more)
│   │   └── databases/
│   │       ├── SQLiteRuntime.js
│   │       ├── DuckDBRuntime.js
│   │       ├── PostgresRuntime.js
│   │       └── PouchDBRuntime.js
│   ├── ui/
│   │   ├── LanguageSelector.js
│   │   ├── OutputPanel.js
│   │   ├── FileExplorer.js
│   │   └── SettingsPanel.js
│   └── utils/
│       ├── storage.js          # Persistent storage
│       ├── worker-pool.js      # Web worker management
│       └── cdn-loader.js       # Dynamic CDN loading
├── public/
│   └── workers/
│       └── runtime-worker.js   # Offload heavy runtimes
└── package.json
```

---

## 🎨 Core Architecture Code

### 1. **BaseRuntime.js** - Abstract Base Class

```javascript
// src/runtimes/BaseRuntime.js

export default class BaseRuntime {
  constructor(name, config = {}) {
    this.name = name;
    this.loaded = false;
    this.runtime = null;
    this.config = config;
    this.outputCallback = null;
  }

  // Override in subclasses
  async load() {
    throw new Error('load() must be implemented');
  }

  // Override in subclasses
  async execute(code, options = {}) {
    throw new Error('execute() must be implemented');
  }

  // Common utilities
  setOutputCallback(callback) {
    this.outputCallback = callback;
  }

  log(message, type = 'stdout') {
    if (this.outputCallback) {
      this.outputCallback({ message, type, timestamp: Date.now() });
    }
  }

  logError(error) {
    this.log(error, 'stderr');
  }

  async ensureLoaded() {
    if (!this.loaded) {
      await this.load();
    }
  }

  // Cleanup
  async dispose() {
    this.runtime = null;
    this.loaded = false;
  }

  // Metadata
  getInfo() {
    return {
      name: this.name,
      loaded: this.loaded,
      version: this.config.version || 'unknown'
    };
  }
}
```

### 2. **RuntimeManager.js** - Plugin System

```javascript
// src/runtimes/RuntimeManager.js

import PythonRuntime from './languages/PythonRuntime.js';
import RubyRuntime from './languages/RubyRuntime.js';
import PHPRuntime from './languages/PHPRuntime.js';
import LuaRuntime from './languages/LuaRuntime.js';
import JavaScriptRuntime from './languages/JavaScriptRuntime.js';
import RustRuntime from './languages/RustRuntime.js';
import GoRuntime from './languages/GoRuntime.js';
import SchemeRuntime from './languages/SchemeRuntime.js';
import PerlRuntime from './languages/PerlRuntime.js';
import RRuntime from './languages/RRuntime.js';
// ... import all other runtimes

import SQLiteRuntime from './databases/SQLiteRuntime.js';
import DuckDBRuntime from './databases/DuckDBRuntime.js';
import PostgresRuntime from './databases/PostgresRuntime.js';

export default class RuntimeManager {
  constructor() {
    this.runtimes = new Map();
    this.activeRuntime = null;
    this.outputCallback = null;
    this.registry = this.buildRegistry();
  }

  buildRegistry() {
    return {
      // Languages
      python: { class: PythonRuntime, category: 'language', label: 'Python' },
      ruby: { class: RubyRuntime, category: 'language', label: 'Ruby' },
      php: { class: PHPRuntime, category: 'language', label: 'PHP' },
      lua: { class: LuaRuntime, category: 'language', label: 'Lua' },
      javascript: { class: JavaScriptRuntime, category: 'language', label: 'JavaScript' },
      rust: { class: RustRuntime, category: 'language', label: 'Rust' },
      go: { class: GoRuntime, category: 'language', label: 'Go' },
      scheme: { class: SchemeRuntime, category: 'language', label: 'Scheme' },
      perl: { class: PerlRuntime, category: 'language', label: 'Perl' },
      r: { class: RRuntime, category: 'language', label: 'R' },
      
      // Databases
      sqlite: { class: SQLiteRuntime, category: 'database', label: 'SQLite' },
      duckdb: { class: DuckDBRuntime, category: 'database', label: 'DuckDB' },
      postgres: { class: PostgresRuntime, category: 'database', label: 'PostgreSQL' },
    };
  }

  // Get or create runtime
  async getRuntime(languageId) {
    if (!this.runtimes.has(languageId)) {
      const config = this.registry[languageId];
      if (!config) {
        throw new Error(`Language '${languageId}' not supported`);
      }
      
      const runtime = new config.class();
      runtime.setOutputCallback(this.outputCallback);
      this.runtimes.set(languageId, runtime);
    }
    
    return this.runtimes.get(languageId);
  }

  // Execute code
  async execute(languageId, code, options = {}) {
    this.log(`\n=== Executing ${languageId} ===\n`, 'info');
    
    const runtime = await this.getRuntime(languageId);
    await runtime.ensureLoaded();
    
    const startTime = performance.now();
    
    try {
      const result = await runtime.execute(code, options);
      const duration = (performance.now() - startTime).toFixed(2);
      this.log(`\n✓ Completed in ${duration}ms`, 'success');
      return result;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      this.log(`\n✗ Failed after ${duration}ms`, 'error');
      throw error;
    }
  }

  // Set output handler for all runtimes
  setOutputCallback(callback) {
    this.outputCallback = callback;
    this.runtimes.forEach(runtime => {
      runtime.setOutputCallback(callback);
    });
  }

  log(message, type = 'stdout') {
    if (this.outputCallback) {
      this.outputCallback({ message, type, timestamp: Date.now() });
    }
  }

  // Get list of supported languages
  getSupportedLanguages() {
    return Object.entries(this.registry)
      .filter(([_, config]) => config.category === 'language')
      .map(([id, config]) => ({
        id,
        label: config.label,
        loaded: this.runtimes.has(id)
      }));
  }

  // Get list of supported databases
  getSupportedDatabases() {
    return Object.entries(this.registry)
      .filter(([_, config]) => config.category === 'database')
      .map(([id, config]) => ({
        id,
        label: config.label,
        loaded: this.runtimes.has(id)
      }));
  }

  // Preload specific runtimes
  async preload(languageIds) {
    const promises = languageIds.map(id => this.getRuntime(id));
    await Promise.all(promises);
  }

  // Cleanup
  async dispose() {
    for (const runtime of this.runtimes.values()) {
      await runtime.dispose();
    }
    this.runtimes.clear();
  }

  // Memory usage info
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
      };
    }
    return null;
  }
}
```

### 3. **Example Language Runtime - PythonRuntime.js**

```javascript
// src/runtimes/languages/PythonRuntime.js

import BaseRuntime from '../BaseRuntime.js';

export default class PythonRuntime extends BaseRuntime {
  constructor() {
    super('python', {
      version: '3.11',
      cdn: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
    });
  }

  async load() {
    if (this.loaded) return;
    
    this.log('Loading Python runtime...', 'info');
    
    // Load Pyodide
    if (!window.loadPyodide) {
      await this.loadScript(this.config.cdn);
    }
    
    this.runtime = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      stdout: (text) => this.log(text),
      stderr: (text) => this.logError(text)
    });
    
    this.loaded = true;
    this.log('Python runtime ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();
    
    try {
      // Install packages if requested
      if (options.packages && options.packages.length > 0) {
        this.log(`Installing packages: ${options.packages.join(', ')}...`, 'info');
        await this.runtime.loadPackagesFromImports(code);
      }
      
      // Execute code
      const result = await this.runtime.runPythonAsync(code);
      
      // Return result if exists
      if (result !== undefined) {
        this.log(String(result));
      }
      
      return result;
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }

  async installPackage(packageName) {
    await this.ensureLoaded();
    this.log(`Installing ${packageName}...`, 'info');
    await this.runtime.loadPackage(packageName);
    this.log(`${packageName} installed!`, 'success');
  }

  async loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
```

### 4. **Example Language Runtime - RubyRuntime.js**

```javascript
// src/runtimes/languages/RubyRuntime.js

import BaseRuntime from '../BaseRuntime.js';

export default class RubyRuntime extends BaseRuntime {
  constructor() {
    super('ruby', { version: '3.2' });
  }

  async load() {
    if (this.loaded) return;
    
    this.log('Loading Ruby runtime...', 'info');
    
    const { DefaultRubyVM } = await import('@ruby/wasm-wasi/dist/browser.esm');
    
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@latest/dist/ruby.wasm'
    );
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    
    const { vm } = await DefaultRubyVM(module);
    
    // Capture output
    window._rubyOutput = (text) => this.log(text);
    
    vm.eval(`
      class WASMConsole
        def write(str)
          JS.global.call(:_rubyOutput, str.to_s)
          str.length
        end
        
        def puts(*args)
          args.each { |arg| write(arg.to_s + "\\n") }
        end
      end
      
      $stdout = WASMConsole.new
      $stderr = WASMConsole.new
      
      def puts(*args)
        $stdout.puts(*args)
      end
      
      def print(*args)
        args.each { |arg| $stdout.write(arg.to_s) }
      end
    `);
    
    this.runtime = vm;
    this.loaded = true;
    this.log('Ruby runtime ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();
    
    try {
      const result = this.runtime.eval(code);
      return result;
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }
}
```

### 5. **Example Database Runtime - DuckDBRuntime.js**

```javascript
// src/runtimes/databases/DuckDBRuntime.js

import BaseRuntime from '../BaseRuntime.js';

export default class DuckDBRuntime extends BaseRuntime {
  constructor() {
    super('duckdb', { version: '0.9.2' });
    this.db = null;
    this.conn = null;
  }

  async load() {
    if (this.loaded) return;
    
    this.log('Loading DuckDB runtime...', 'info');
    
    const duckdb = await import('@duckdb/duckdb-wasm');
    
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    this.conn = await this.db.connect();
    
    this.loaded = true;
    this.log('DuckDB runtime ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();
    
    try {
      const statements = code.split(';').filter(s => s.trim());
      
      for (const stmt of statements) {
        if (!stmt.trim()) continue;
        
        const result = await this.conn.query(stmt);
        
        // Format and display results
        if (result.numRows > 0) {
          const table = result.toArray();
          this.displayTable(table);
        } else {
          this.log('Query executed successfully');
        }
      }
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }

  displayTable(rows) {
    if (rows.length === 0) return;
    
    const columns = Object.keys(rows[0]);
    
    // Header
    this.log(columns.join(' | '));
    this.log('-'.repeat(columns.join(' | ').length));
    
    // Rows
    rows.forEach(row => {
      const values = columns.map(col => String(row[col]));
      this.log(values.join(' | '));
    });
    
    this.log('');
  }

  async loadCSV(filename, data) {
    await this.ensureLoaded();
    await this.conn.insertCSVFromPath(filename, { data });
  }

  async loadParquet(filename, data) {
    await this.ensureLoaded();
    await this.conn.insertParquetFromPath(filename, { data });
  }

  async dispose() {
    if (this.conn) await this.conn.close();
    if (this.db) await this.db.terminate();
    await super.dispose();
  }
}
```

### 6. **More Language Runtimes** (Quick Implementations)

```javascript
// src/runtimes/languages/LuaRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class LuaRuntime extends BaseRuntime {
  constructor() {
    super('lua', { version: '5.4' });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading Lua runtime...', 'info');
    
    const { LuaFactory } = await import('wasmoon');
    const factory = new LuaFactory();
    this.runtime = await factory.createEngine();
    
    this.runtime.global.set('print', (...args) => {
      this.log(args.join('\t'));
    });
    
    this.loaded = true;
    this.log('Lua runtime ready!\n', 'success');
  }

  async execute(code) {
    await this.ensureLoaded();
    try {
      await this.runtime.doString(code);
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }
}

// src/runtimes/languages/PHPRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class PHPRuntime extends BaseRuntime {
  constructor() {
    super('php', { version: '8.2' });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading PHP runtime...', 'info');
    
    const { PhpWeb } = await import('php-wasm/PhpWeb.mjs');
    this.runtime = await PhpWeb.load('8.2', {
      stdout: (text) => this.log(text),
      stderr: (text) => this.logError(text)
    });
    
    this.loaded = true;
    this.log('PHP runtime ready!\n', 'success');
  }

  async execute(code) {
    await this.ensureLoaded();
    try {
      await this.runtime.run(code);
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }
}

// src/runtimes/languages/SchemeRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class SchemeRuntime extends BaseRuntime {
  constructor() {
    super('scheme', { version: 'R7RS' });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading Scheme runtime...', 'info');
    
    const BiwaScheme = await import('biwascheme');
    this.runtime = new BiwaScheme.Interpreter((e) => {
      this.log(BiwaScheme.to_write(e));
    });
    
    this.loaded = true;
    this.log('Scheme runtime ready!\n', 'success');
  }

  async execute(code) {
    await this.ensureLoaded();
    try {
      this.runtime.evaluate(code);
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }
}

// src/runtimes/languages/PerlRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class PerlRuntime extends BaseRuntime {
  constructor() {
    super('perl', { version: '5.32' });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading Perl runtime...', 'info');
    
    // Load WebPerl
    if (!window.Perl) {
      await this.loadScript('https://webperl.zero-g.net/WebPerl/webperl.js');
    }
    
    this.runtime = await window.Perl.init();
    
    // Capture output
    this.runtime.stdout = (text) => this.log(text);
    this.runtime.stderr = (text) => this.logError(text);
    
    this.loaded = true;
    this.log('Perl runtime ready!\n', 'success');
  }

  async execute(code) {
    await this.ensureLoaded();
    try {
      await this.runtime.eval(code);
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// src/runtimes/languages/RRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class RRuntime extends BaseRuntime {
  constructor() {
    super('r', { version: '4.3' });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading R runtime (this may take a moment)...', 'info');
    
    const { WebR } = await import('webr');
    this.runtime = new WebR({
      WEBR_URL: 'https://webr.r-wasm.org/latest/'
    });
    
    await this.runtime.init();
    
    // Set up output capture
    this.runtime.evalRVoid('options(width = 120)');
    
    this.loaded = true;
    this.log('R runtime ready!\n', 'success');
  }

  async execute(code) {
    await this.ensureLoaded();
    try {
      const result = await this.runtime.evalR(code);
      const output = await result.toJs();
      
      if (output !== null && output !== undefined) {
        this.log(JSON.stringify(output, null, 2));
      }
    } catch (error) {
      this.logError(error.message);
      throw error;
    }
  }
}
```

---

## 🚀 Advanced Features

### 1. **Web Worker Support for Heavy Runtimes**

```javascript
// src/utils/worker-pool.js

export class WorkerPool {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.queue = [];
  }

  async execute(runtimeName, code) {
    return new Promise((resolve, reject) => {
      const task = { runtimeName, code, resolve, reject };
      
      if (this.workers.length < this.maxWorkers) {
        this.createWorker(task);
      } else {
        this.queue.push(task);
      }
    });
  }

  createWorker(task) {
    const worker = new Worker('/workers/runtime-worker.js');
    
    worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        task.resolve(e.data.result);
      } else if (e.data.type === 'error') {
        task.reject(new Error(e.data.error));
      }
      
      this.workers = this.workers.filter(w => w !== worker);
      worker.terminate();
      
      // Process queue
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        this.createWorker(nextTask);
      }
    };
    
    worker.postMessage({
      runtime: task.runtimeName,
      code: task.code
    });
    
    this.workers.push(worker);
  }
}
```

### 2. **Persistent Storage**

```javascript
// src/utils/storage.js

export class Storage {
  constructor(dbName = 'wasm-ide') {
    this.dbName = dbName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveFile(path, content, language) {
    const tx = this.db.transaction(['files'], 'readwrite');
    const store = tx.objectStore('files');
    
    await store.put({
      path,
      content,
      language,
      modifiedAt: Date.now()
    });
  }

  async loadFile(path) {
    const tx = this.db.transaction(['files'], 'readonly');
    const store = tx.objectStore('files');
    
    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listFiles() {
    const tx = this.db.transaction(['files'], 'readonly');
    const store = tx.objectStore('files');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 3. **Package Manager**

```javascript
// src/utils/package-manager.js

export class PackageManager {
  constructor(runtime) {
    this.runtime = runtime;
  }

  async install(packageName) {
    const runtimeName = this.runtime.name;
    
    switch(runtimeName) {
      case 'python':
        return await this.installPython(packageName);
      case 'ruby':
        return await this.installRuby(packageName);
      case 'r':
        return await this.installR(packageName);
      default:
        throw new Error(`Package installation not supported for ${runtimeName}`);
    }
  }

  async installPython(packageName) {
    await this.runtime.runtime.loadPackage('micropip');
    const micropip = this.runtime.runtime.pyimport('micropip');
    await micropip.install(packageName);
  }

  async installRuby(packageName) {
    // Ruby gems would need server-side compilation
    throw new Error('Ruby gems not yet supported in WASM');
  }

  async installR(packageName) {
    await this.runtime.runtime.evalR(`install.packages("${packageName}")`);
  }
}
```

---

## 📦 Complete package.json

```json
{
  "name": "ultimate-wasm-ide",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "monaco-editor": "^0.45.0",
    
    "pyodide": "^0.24.1",
    "@ruby/wasm-wasi": "^2.5.0",
    "php-wasm": "^0.0.9",
    "wasmoon": "^1.16.0",
    "biwascheme": "^0.8.0",
    "webr": "^0.2.2",
    
    "sql.js": "^1.8.0",
    "@duckdb/duckdb-wasm": "^1.28.0",
    "@electric-sql/pglite": "^0.1.0",
    
    "assemblyscript": "^0.27.0",
    "typescript": "^5.3.0",
    
    "pouchdb": "^8.0.1",
    "dexie": "^3.2.4",
    "localforage": "^1.10.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-wasm": "^3.3.0"
  }
}
```

---

## 🎯 UI Component - Language Selector

```javascript
// src/ui/LanguageSelector.js

export default class LanguageSelector {
  constructor(runtimeManager, onLanguageChange) {
    this.runtimeManager = runtimeManager;
    this.onLanguageChange = onLanguageChange;
    this.element = null;
  }

  render() {
    const languages = this.runtimeManager.getSupportedLanguages();
    const databases = this.runtimeManager.getSupportedDatabases();
    
    this.element = document.createElement('select');
    this.element.id = 'language-selector';
    this.element.className = 'language-selector';
    
    // Languages group
    const langGroup = document.createElement('optgroup');
    langGroup.label = 'Programming Languages';
    
    languages
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.id;
        option.textContent = lang.label + (lang.loaded ? ' ✓' : '');
        langGroup.appendChild(option);
      });
    
    this.element.appendChild(langGroup);
    
    // Databases group
    const dbGroup = document.createElement('optgroup');
    dbGroup.label = 'Databases';
    
    databases.forEach(db => {
      const option = document.createElement('option');
      option.value = db.id;
      option.textContent = db.label + (db.loaded ? ' ✓' : '');
      dbGroup.appendChild(option);
    });
    
    this.element.appendChild(dbGroup);
    
    // Event listener
    this.element.addEventListener('change', (e) => {
      this.onLanguageChange(e.target.value);
    });
    
    return this.element;
  }

  getValue() {
    return this.element?.value;
  }

  setValue(value) {
    if (this.element) {
      this.element.value = value;
    }
  }
}
```

---

## 🎨 Main Application

```javascript
// src/main.js

import * as monaco from 'monaco-editor';
import RuntimeManager from './runtimes/RuntimeManager.js';
import LanguageSelector from './ui/LanguageSelector.js';
import { Storage } from './utils/storage.js';

class WASMIDEApp {
  constructor() {
    this.runtimeManager = new RuntimeManager();
    this.storage = new Storage();
    this.editor = null;
    this.currentLanguage = 'python';
    
    this.templates = {
      python: '# Python Example\nimport sys\nprint("Hello from Python!")\nprint(f"Version: {sys.version}")',
      javascript: '// JavaScript Example\nconsole.log("Hello from JavaScript!");',
      ruby: '# Ruby Example\nputs "Hello from Ruby!"\nputs "Version: #{RUBY_VERSION}"',
      php: '<?php\necho "Hello from PHP!\\n";\necho "Version: " . phpversion();',
      lua: '-- Lua Example\nprint("Hello from Lua!")\nprint("Version: " .. _VERSION)',
      scheme: '; Scheme Example\n(display "Hello from Scheme!")\n(newline)',
      perl: '# Perl Example\nprint "Hello from Perl!\\n";\nprint "Version: $]\\n";',
      r: '# R Example\nprint("Hello from R!")\nR.version.string',
      sqlite: '-- SQLite Example\nCREATE TABLE users (id INT, name TEXT);\nINSERT INTO users VALUES (1, \'Alice\'), (2, \'Bob\');\nSELECT * FROM users;',
      duckdb: '-- DuckDB Example\nCREATE TABLE sales (date DATE, amount DECIMAL);\nINSERT INTO sales VALUES (\'2024-01-01\', 100), (\'2024-01-02\', 150);\nSELECT * FROM sales;',
    };
  }

  async init() {
    await this.storage.init();
    this.setupUI();
    this.setupEditor();
    this.setupEventListeners();
    this.loadLastSession();
  }

  setupUI() {
    // Create main container
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="ide-container">
        <div class="toolbar">
          <div class="toolbar-left">
            <h1>🚀 Ultimate WASM IDE</h1>
            <div id="language-selector-container"></div>
          </div>
          <div class="toolbar-right">
            <button id="run-btn" class="btn btn-primary">▶ Run</button>
            <button id="clear-btn" class="btn">Clear Output</button>
            <button id="save-btn" class="btn">💾 Save</button>
            <span id="status" class="status"></span>
          </div>
        </div>
        <div class="main-content">
          <div id="editor-container" class="editor-panel"></div>
          <div id="output-container" class="output-panel">
            <div class="output-header">
              <span>Output</span>
              <span id="memory-info" class="memory-info"></span>
            </div>
            <div id="output" class="output-content"></div>
          </div>
        </div>
      </div>
    `;

    // Language selector
    const languageSelector = new LanguageSelector(
      this.runtimeManager,
      (lang) => this.changeLanguage(lang)
    );
    
    document.getElementById('language-selector-container')
      .appendChild(languageSelector.render());
  }

  setupEditor() {
    this.editor = monaco.editor.create(
      document.getElementById('editor-container'),
      {
        value: this.templates[this.currentLanguage],
        language: this.currentLanguage,
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on'
      }
    );
  }

  setupEventListeners() {
    // Run button
    document.getElementById('run-btn').addEventListener('click', () => {
      this.runCode();
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      document.getElementById('output').innerHTML = '';
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
      this.saveCurrentFile();
    });

    // Runtime output
    this.runtimeManager.setOutputCallback((output) => {
      this.appendOutput(output);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrentFile();
      }
    });

    // Update memory info periodically
    setInterval(() => this.updateMemoryInfo(), 2000);
  }

  async runCode() {
    const code = this.editor.getValue();
    const runBtn = document.getElementById('run-btn');
    
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running...';
    
    try {
      await this.runtimeManager.execute(this.currentLanguage, code);
    } catch (error) {
      console.error(error);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = '▶ Run';
    }
  }

  changeLanguage(newLanguage) {
    this.currentLanguage = newLanguage;
    
    // Update Monaco language
    const monacoLang = this.getMonacoLanguage(newLanguage);
    monaco.editor.setModelLanguage(this.editor.getModel(), monacoLang);
    
    // Load template
    const savedFile = this.storage.loadFile(newLanguage);
    if (savedFile) {
      this.editor.setValue(savedFile.content);
    } else {
      this.editor.setValue(this.templates[newLanguage] || '// Start coding!');
    }
  }

  getMonacoLanguage(lang) {
    const mapping = {
      python: 'python',
      javascript: 'javascript',
      ruby: 'ruby',
      php: 'php',
      lua: 'lua',
      scheme: 'scheme',
      perl: 'perl',
      r: 'r',
      sqlite: 'sql',
      duckdb: 'sql',
      postgres: 'sql'
    };
    
    return mapping[lang] || 'plaintext';
  }

  appendOutput(output) {
    const outputEl = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `output-line output-${output.type}`;
    line.textContent = output.message;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  async saveCurrentFile() {
    const code = this.editor.getValue();
    await this.storage.saveFile(
      this.currentLanguage,
      code,
      this.currentLanguage
    );
    
    this.showStatus('💾 Saved!');
  }

  async loadLastSession() {
    const files = await this.storage.listFiles();
    if (files.length > 0) {
      const lastFile = files[files.length - 1];
      this.currentLanguage = lastFile.language;
      this.editor.setValue(lastFile.content);
    }
  }

  showStatus(message, duration = 2000) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    setTimeout(() => {
      statusEl.textContent = '';
    }, duration);
  }

  updateMemoryInfo() {
    const memory = this.runtimeManager.getMemoryUsage();
    if (memory) {
      document.getElementById('memory-info').textContent = 
        `Memory: ${memory.used} / ${memory.limit}`;
    }
  }
}

// Initialize app
const app = new WASMIDEApp();
app.init();
```

---

## 🎨 CSS Styling

```css
/* styles.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #1e1e1e;
  color: #d4d4d4;
}

.ide-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-left h1 {
  font-size: 18px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

#language-selector {
  padding: 8px 12px;
  background: #3c3c3c;
  color: #d4d4d4;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn {
  padding: 8px 16px;
  background: #3c3c3c;
  color: #d4d4d4;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn:hover {
  background: #505050;
}

.btn-primary {
  background: #0e639c;
  color: white;
}

.btn-primary:hover {
  background: #1177bb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  font-size: 13px;
  color: #4ec9b0;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-panel {
  flex: 1;
  min-width: 0;
}

.output-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-left: 1px solid #3c3c3c;
}

.output-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
  font-size: 13px;
}

.memory-info {
  color: #858585;
  font-size: 11px;
}

.output-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.output-line {
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-stdout {
  color: #d4d4d4;
}

.output-stderr {
  color: #f48771;
}

.output-info {
  color: #4fc1ff;
}

.output-success {
  color: #73c991;
}

.output-error {
  color: #f48771;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}
```

---

## 🚀 Deployment

### Vite Config

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [wasm()],
  optimizeDeps: {
    exclude: ['pyodide', '@ruby/wasm-wasi', 'php-wasm', 'webr']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
});
```

---

## 🎯 Next Steps

1. **Start with Core 5**: Python, JavaScript, Ruby, Lua, SQLite
2. **Add  databases**: DuckDB, PostgreSQL
3. **Expand gradually**: Add 2-3 languages per week
4. **Advanced features**:
   - Syntax checking/linting
   - Auto-completion
   - Multi-file support
   - Git integration
   - Collaborative editing
   - Theme customization
   - Extension marketplace

This architecture scales to **50+ languages** easily! Each new language is just a new Runtime class. Want me to implement specific languages or features next?