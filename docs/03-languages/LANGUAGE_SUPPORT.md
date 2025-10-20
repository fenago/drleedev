# Language Support Documentation
## DrLee IDE - Comprehensive Programming Language Coverage

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Implementation Guide

---

## Table of Contents

1. [Overview](#1-overview)
2. [Language Tiers](#2-language-tiers)
3. [Tier 1 Languages (Launch Priority)](#3-tier-1-languages-launch-priority)
4. [Tier 2 Languages (Post-Launch)](#4-tier-2-languages-post-launch)
5. [Tier 3 Languages (Experimental)](#5-tier-3-languages-experimental)
6. [Implementation Patterns](#6-implementation-patterns)
7. [Package Management](#7-package-management)
8. [Language-Specific Features](#8-language-specific-features)

---

## 1. Overview

DrLee IDE supports 40+ programming languages through WebAssembly runtimes. This document provides detailed implementation guides for each supported language.

### 1.1 Language Classification

Languages are classified into three tiers based on:
- **Maturity**: Stability of WASM runtime
- **Demand**: User interest and use cases
- **Implementation Complexity**: Difficulty of integration
- **Runtime Size**: Download size and memory footprint

### 1.2 Supported Language Matrix

| Tier | Count | Status | Monetization |
|------|-------|--------|--------------|
| Tier 1 | 5 languages | Production-ready | Free (3) + Pro (2) |
| Tier 2 | 15 languages | Post-launch | Pro tier |
| Tier 3 | 20+ languages | Experimental | Enterprise |

---

## 2. Language Tiers

### 2.1 Tier Classification Criteria

**Tier 1: Must Have (Launch)**
- ✅ Stable WASM runtime available
- ✅ Under 20MB runtime size
- ✅ Initialize in <10 seconds
- ✅ High user demand
- ✅ Production use cases

**Tier 2: Should Have (0-6 months post-launch)**
- ✅ WASM runtime available (may be experimental)
- ✅ Under 30MB runtime size
- ✅ Initialize in <15 seconds
- ✅ Medium user demand
- ✅ Educational or niche use cases

**Tier 3: Nice to Have (6+ months post-launch)**
- ⚠️ Experimental WASM support
- ⚠️ May require custom compilation
- ⚠️ Larger runtime size acceptable
- ⚠️ Niche or legacy use cases

---

## 3. Tier 1 Languages (Launch Priority)

### 3.1 Python

**Runtime:** Pyodide
**Version:** 3.11
**Package:** `pyodide@0.24.1`
**Size:** 6.5MB
**Load Time:** 2-3 seconds
**Monetization:** Pro tier
**Priority:** P0

#### Overview
Python is the most popular language for education, data science, and scripting. Pyodide is a mature WebAssembly port of CPython with extensive package support.

#### Implementation

```javascript
// src/runtimes/languages/PythonRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class PythonRuntime extends BaseRuntime {
  constructor() {
    super('python', {
      version: '3.11',
      cdn: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js',
      packagesURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading Python runtime (6.5MB)...', 'info');

    // Load Pyodide script from CDN
    if (!window.loadPyodide) {
      await this.loadScript(this.config.cdn);
    }

    // Initialize Pyodide
    this.runtime = await window.loadPyodide({
      indexURL: this.config.packagesURL,
      stdout: (text) => this.log(text),
      stderr: (text) => this.log(text, 'stderr')
    });

    this.loaded = true;
    this.log('Python 3.11 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      // Auto-install packages from imports
      if (options.autoInstallPackages !== false) {
        await this.runtime.loadPackagesFromImports(code);
      }

      // Execute Python code
      const result = await this.runtime.runPythonAsync(code);

      if (result !== undefined) {
        this.log(String(result));
      }

      return result;
    } catch (error) {
      this.log(error.message, 'stderr');
      throw error;
    }
  }

  async installPackage(packageName) {
    await this.ensureLoaded();
    await this.runtime.loadPackage('micropip');
    const micropip = this.runtime.pyimport('micropip');
    await micropip.install(packageName);
    this.log(`Installed ${packageName}`, 'success');
  }

  async listInstalledPackages() {
    await this.ensureLoaded();
    await this.runtime.loadPackage('micropip');
    const micropip = this.runtime.pyimport('micropip');
    return await micropip.list();
  }
}
```

#### Supported Packages

**Built-in packages (no installation needed):**
- numpy, pandas, scipy, matplotlib
- scikit-learn, statsmodels
- regex, pillow, lxml
- micropip (package installer)

**Install any pure-Python package:**
```python
import micropip
await micropip.install('requests')
import requests
```

#### Example Code

```python
# Hello World
print("Hello from Python!")

# Data Science
import numpy as np
import pandas as pd

data = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
})

print(data.describe())

# Async support
import asyncio

async def fetch_data():
    await asyncio.sleep(1)
    return "Data fetched!"

result = await fetch_data()
print(result)
```

#### Monaco Editor Configuration

```javascript
monaco.languages.register({ id: 'python' });
monaco.languages.setLanguageConfiguration('python', {
  indentationRules: {
    increaseIndentPattern: /^(\s*)(def|class|if|elif|else|for|while|try|except|finally|with)\b.*:$/,
    decreaseIndentPattern: /^(\s*)(return|pass|break|continue|raise)\b.*$/
  }
});
```

---

### 3.2 JavaScript

**Runtime:** Native (V8/SpiderMonkey/JavaScriptCore)
**Version:** ES2023+
**Package:** None (built-in)
**Size:** 0MB
**Load Time:** Instant
**Monetization:** Free tier
**Priority:** P0

#### Implementation

```javascript
// src/runtimes/languages/JavaScriptRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class JavaScriptRuntime extends BaseRuntime {
  constructor() {
    super('javascript', { version: 'ES2023' });
    this.globalContext = {};
  }

  async load() {
    // No loading needed - JavaScript is native
    this.loaded = true;
  }

  async execute(code, options = {}) {
    try {
      // Create isolated context
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

      // Custom console that pipes to output
      const customConsole = {
        log: (...args) => this.log(args.map(String).join(' ')),
        error: (...args) => this.log(args.map(String).join(' '), 'stderr'),
        warn: (...args) => this.log(args.map(String).join(' '), 'info'),
        info: (...args) => this.log(args.map(String).join(' '), 'info')
      };

      // Execute in isolated scope
      const fn = new AsyncFunction('console', 'context', code);
      const result = await fn(customConsole, this.globalContext);

      if (result !== undefined) {
        this.log(String(result));
      }

      return result;
    } catch (error) {
      this.log(error.toString(), 'stderr');
      throw error;
    }
  }

  // Reset execution context
  reset() {
    this.globalContext = {};
  }
}
```

#### Example Code

```javascript
// Hello World
console.log("Hello from JavaScript!");

// Async/await
async function fetchData() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "Data fetched!";
}

const data = await fetchData();
console.log(data);

// ES6+ Features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);

// Classes
class Person {
  constructor(name) {
    this.name = name;
  }
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
}

const alice = new Person('Alice');
alice.greet();
```

---

### 3.3 TypeScript

**Runtime:** Native (transpiled to JavaScript)
**Version:** 5.3+
**Package:** `typescript@5.3.0`
**Size:** 15MB (compiler)
**Load Time:** 1-2 seconds
**Monetization:** Free tier
**Priority:** P0

#### Implementation

```javascript
// src/runtimes/languages/TypeScriptRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class TypeScriptRuntime extends BaseRuntime {
  constructor() {
    super('typescript', { version: '5.3' });
    this.ts = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading TypeScript compiler...', 'info');

    // Load TypeScript compiler from CDN
    const { default: ts } = await import('https://cdn.jsdelivr.net/npm/typescript@5.3.3/+esm');
    this.ts = ts;

    this.loaded = true;
    this.log('TypeScript 5.3 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      // Transpile TypeScript to JavaScript
      const compilerOptions = {
        target: this.ts.ScriptTarget.ES2020,
        module: this.ts.ModuleKind.ESNext,
        strict: true,
        ...options.compilerOptions
      };

      const result = this.ts.transpileModule(code, {
        compilerOptions
      });

      // Check for errors
      if (result.diagnostics && result.diagnostics.length > 0) {
        const errors = result.diagnostics.map(d =>
          this.ts.flattenDiagnosticMessageText(d.messageText, '\n')
        );
        this.log(errors.join('\n'), 'stderr');
      }

      // Execute transpiled JavaScript
      const jsCode = result.outputText;
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

      const customConsole = {
        log: (...args) => this.log(args.map(String).join(' ')),
        error: (...args) => this.log(args.map(String).join(' '), 'stderr')
      };

      const fn = new AsyncFunction('console', jsCode);
      return await fn(customConsole);
    } catch (error) {
      this.log(error.toString(), 'stderr');
      throw error;
    }
  }
}
```

#### Example Code

```typescript
// Hello World with types
const message: string = "Hello from TypeScript!";
console.log(message);

// Interfaces
interface User {
  name: string;
  age: number;
  email?: string;
}

const user: User = {
  name: "Alice",
  age: 30
};

console.log(`User: ${user.name}, Age: ${user.age}`);

// Generic functions
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<number>(42);
console.log(result);

// Type guards
type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
  }
}

console.log(getArea({ kind: "circle", radius: 5 }));
```

---

### 3.4 Lua

**Runtime:** Wasmoon
**Version:** 5.4
**Package:** `wasmoon@1.16.0`
**Size:** 200KB
**Load Time:** <1 second
**Monetization:** Free tier
**Priority:** P0

#### Implementation

```javascript
// src/runtimes/languages/LuaRuntime.js
import BaseRuntime from '../BaseRuntime.js';
import { LuaFactory } from 'wasmoon';

export default class LuaRuntime extends BaseRuntime {
  constructor() {
    super('lua', { version: '5.4' });
    this.factory = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading Lua runtime...', 'info');

    this.factory = new LuaFactory();
    this.runtime = await this.factory.createEngine();

    // Override print function
    this.runtime.global.set('print', (...args) => {
      this.log(args.join('\t'));
    });

    this.loaded = true;
    this.log('Lua 5.4 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      await this.runtime.doString(code);
    } catch (error) {
      this.log(error.message, 'stderr');
      throw error;
    }
  }

  async dispose() {
    if (this.runtime) {
      this.runtime.global.close();
    }
    if (this.factory) {
      this.factory.close();
    }
    await super.dispose();
  }
}
```

#### Example Code

```lua
-- Hello World
print("Hello from Lua!")

-- Functions
function factorial(n)
  if n <= 1 then
    return 1
  else
    return n * factorial(n - 1)
  end
end

print("5! =", factorial(5))

-- Tables
local person = {
  name = "Alice",
  age = 30,
  greet = function(self)
    print("Hello, I'm " .. self.name)
  end
}

person:greet()

-- Metatables
local mt = {
  __add = function(a, b)
    return {x = a.x + b.x, y = a.y + b.y}
  end
}

local v1 = {x = 1, y = 2}
local v2 = {x = 3, y = 4}
setmetatable(v1, mt)
setmetatable(v2, mt)

local v3 = v1 + v2
print("Vector sum:", v3.x, v3.y)
```

---

### 3.5 SQLite

**Runtime:** sql.js
**Version:** SQLite 3.40+
**Package:** `sql.js@1.8.0`
**Size:** 2MB
**Load Time:** 1-2 seconds
**Monetization:** Free tier
**Priority:** P0

#### Implementation

```javascript
// src/runtimes/databases/SQLiteRuntime.js
import BaseRuntime from '../BaseRuntime.js';
import initSqlJs from 'sql.js';

export default class SQLiteRuntime extends BaseRuntime {
  constructor() {
    super('sqlite', { version: '3.40' });
    this.db = null;
  }

  async load() {
    if (this.loaded) return;

    this.log('Loading SQLite runtime...', 'info');

    const SQL = await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
    });

    this.db = new SQL.Database();
    this.loaded = true;
    this.log('SQLite 3.40 ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      // Split into individual statements
      const statements = code
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        const result = this.db.exec(stmt);

        if (result.length > 0) {
          // Display results in table format
          this.displayResults(result[0]);
        } else {
          this.log('Query executed successfully');
        }
      }
    } catch (error) {
      this.log(error.message, 'stderr');
      throw error;
    }
  }

  displayResults(result) {
    const { columns, values } = result;

    if (values.length === 0) {
      this.log('(No rows returned)');
      return;
    }

    // Header
    this.log(columns.join(' | '));
    this.log('-'.repeat(columns.join(' | ').length));

    // Rows
    for (const row of values) {
      this.log(row.join(' | '));
    }

    this.log(`\n(${values.length} rows)`);
  }

  exportDatabase() {
    return this.db.export();
  }

  importDatabase(data) {
    this.db = new this.SQL.Database(data);
  }
}
```

#### Example Code

```sql
-- Create table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com'),
  ('Charlie', 'charlie@example.com');

-- Query data
SELECT * FROM users;

-- Joins
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  amount DECIMAL(10, 2),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO orders (user_id, amount) VALUES
  (1, 99.99),
  (2, 149.50),
  (1, 49.99);

SELECT u.name, SUM(o.amount) as total
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY total DESC;
```

---

## 4. Tier 2 Languages (Post-Launch)

### 4.1 Ruby

**Runtime:** ruby.wasm
**Package:** `@ruby/wasm-wasi@2.5.0`
**Size:** 15MB
**Load Time:** 3-5 seconds
**Monetization:** Pro tier

[Detailed implementation similar to above pattern]

### 4.2 PHP

**Runtime:** php-wasm
**Package:** `php-wasm@0.0.9`
**Size:** 5MB
**Load Time:** 2 seconds
**Monetization:** Pro tier

### 4.3 R

**Runtime:** webR
**Package:** `webr@0.2.2`
**Size:** 20MB
**Load Time:** 5-8 seconds
**Monetization:** Pro tier

### 4.4 Perl

**Runtime:** WebPerl
**Size:** 8MB
**Load Time:** 3-4 seconds
**Monetization:** Pro tier

### 4.5 Scheme

**Runtime:** BiwaScheme
**Package:** `biwascheme@0.8.0`
**Size:** 300KB
**Load Time:** <1 second
**Monetization:** Pro tier

### 4.6-4.15 Additional Tier 2 Languages

- Go (TinyGo WASM)
- Rust (wasm-pack)
- C/C++ (Emscripten)
- Java (CheerpJ)
- C# (Blazor WASM)
- Clojure (ClojureScript)
- Scala (Scala.js)
- F# (Fable)
- Kotlin (Kotlin/WASM)
- Swift (SwiftWasm)

---

## 5. Tier 3 Languages (Experimental)

### 5.1 Legacy Languages

- COBOL (GnuCOBOL + Emscripten)
- Fortran (f2c + Emscripten)
- Pascal (Free Pascal + Emscripten)
- BASIC (JS implementations)

### 5.2 Esoteric Languages

- Brainfuck
- Whitespace
- Befunge

### 5.3 Experimental Modern Languages

- Julia (experimental WASM)
- Nim (WASM backend)
- Crystal (early WASM support)
- Zig (native WASM)
- V (WASM backend)

---

## 6. Implementation Patterns

### 6.1 Runtime Template

```javascript
// src/runtimes/languages/TemplateRuntime.js
import BaseRuntime from '../BaseRuntime.js';

export default class TemplateRuntime extends BaseRuntime {
  constructor() {
    super('languageName', {
      version: '1.0',
      cdn: 'https://cdn.example.com/runtime.js'
    });
  }

  async load() {
    if (this.loaded) return;
    this.log('Loading [Language] runtime...', 'info');

    // 1. Load WASM binary or JavaScript runtime
    // 2. Initialize runtime
    // 3. Set up output redirection
    // 4. Configure runtime options

    this.loaded = true;
    this.log('[Language] ready!\n', 'success');
  }

  async execute(code, options = {}) {
    await this.ensureLoaded();

    try {
      // 1. Execute code in runtime
      // 2. Capture output
      // 3. Return result
    } catch (error) {
      this.log(error.message, 'stderr');
      throw error;
    }
  }

  async dispose() {
    // Clean up resources
    await super.dispose();
  }
}
```

### 6.2 Output Redirection Pattern

**Console Override:**
```javascript
const customConsole = {
  log: (...args) => this.log(args.join(' ')),
  error: (...args) => this.log(args.join(' '), 'stderr'),
  warn: (...args) => this.log(args.join(' '), 'info')
};
```

**WASM stdout/stderr:**
```javascript
this.runtime = await loadRuntime({
  stdout: (text) => this.log(text),
  stderr: (text) => this.log(text, 'stderr')
});
```

---

## 7. Package Management

### 7.1 Python - micropip

```python
import micropip
await micropip.install('package-name')
```

### 7.2 JavaScript/TypeScript - Dynamic Import

```javascript
const module = await import('https://cdn.skypack.dev/lodash');
```

### 7.3 Ruby - Bundled Gems

Ruby.wasm includes select gems. Custom gems require server-side compilation.

---

## 8. Language-Specific Features

### 8.1 Code Templates

Each language includes starter templates:

```javascript
const templates = {
  python: `# Python starter\nprint("Hello, World!")`,
  javascript: `// JavaScript starter\nconsole.log("Hello, World!");`,
  typescript: `// TypeScript starter\nconst msg: string = "Hello, World!";\nconsole.log(msg);`,
  lua: `-- Lua starter\nprint("Hello, World!")`,
  sql: `-- SQLite starter\nSELECT 'Hello, World!' as message;`
};
```

### 8.2 Syntax Highlighting

Monaco Editor provides built-in syntax highlighting for all major languages.

### 8.3 IntelliSense Support

Languages with LSP support:
- TypeScript (full IntelliSense)
- Python (Pyright via LSP)
- JavaScript (full IntelliSense)

---

**Document End**
