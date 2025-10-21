/**
 * Editor - Monaco Editor integration class
 *
 * Manages Monaco Editor initialization, configuration, and interactions.
 */
export default class Editor {
  /**
   * @param {HTMLElement} container - DOM container for the editor
   * @param {Object} options - Editor configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.editor = null;
    this.monaco = null;

    this.options = {
      value: options.value || this.getDefaultCode('javascript'),
      language: options.language || 'javascript',
      theme: options.theme || 'vs-dark',
      automaticLayout: true,
      fontSize: options.fontSize || 14,
      minimap: {
        enabled: options.minimap !== false,
      },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      ...options,
    };

    this.onRunCallback = null;
    this.onChangeCallback = null;
  }

  /**
   * Initialize Monaco Editor
   *
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Load Monaco from CDN
      await this.loadMonaco();

      // Create editor instance
      this.editor = this.monaco.editor.create(this.container, this.options);

      // Set up keybindings
      this.setupKeybindings();

      // Set up event listeners
      this.setupEventListeners();

      console.log('Monaco Editor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      throw error;
    }
  }

  /**
   * Load Monaco Editor from CDN
   *
   * @private
   * @returns {Promise<void>}
   */
  async loadMonaco() {
    return new Promise((resolve, reject) => {
      // Check if Monaco is already loaded
      if (window.monaco) {
        this.monaco = window.monaco;
        resolve();
        return;
      }

      // Monaco loader configuration
      window.require = {
        paths: {
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
        },
      };

      // Create script element for Monaco loader
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';

      script.onload = () => {
        // Monaco loader is ready, now load the editor
        window.require(['vs/editor/editor.main'], () => {
          this.monaco = window.monaco;
          resolve();
        });
      };

      script.onerror = () => {
        reject(new Error('Failed to load Monaco Editor from CDN'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Set up keyboard shortcuts
   *
   * @private
   */
  setupKeybindings() {
    // Ctrl/Cmd + Enter to run code
    this.editor.addCommand(
      this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.Enter,
      () => {
        if (this.onRunCallback) {
          this.onRunCallback();
        }
      }
    );

    // Ctrl/Cmd + S to save (prevent default browser save)
    this.editor.addCommand(
      this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
      () => {
        // Prevent default save behavior
        // Trigger save callback if registered
        console.log('Save shortcut triggered');
      }
    );
  }

  /**
   * Set up event listeners
   *
   * @private
   */
  setupEventListeners() {
    // Content change listener
    this.editor.onDidChangeModelContent(() => {
      if (this.onChangeCallback) {
        const code = this.getValue();
        this.onChangeCallback(code);
      }
    });

    // Cursor position change listener
    this.editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const positionElement = document.getElementById('cursor-position');
      if (positionElement) {
        positionElement.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
      }
    });
  }

  /**
   * Get current editor value (code)
   *
   * @returns {string}
   */
  getValue() {
    return this.editor ? this.editor.getValue() : '';
  }

  /**
   * Set editor value (code)
   *
   * @param {string} value - Code to set
   */
  setValue(value) {
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  /**
   * Get current language
   *
   * @returns {string}
   */
  getLanguage() {
    return this.editor
      ? this.editor.getModel().getLanguageId()
      : this.options.language;
  }

  /**
   * Set editor language
   *
   * @param {string} language - Language ID (e.g., 'python', 'javascript')
   */
  setLanguage(language) {
    if (this.editor) {
      // Map runtime languages to Monaco language IDs
      const monacoLanguage = this.getMonacoLanguageId(language);

      this.monaco.editor.setModelLanguage(this.editor.getModel(), monacoLanguage);
      this.options.language = language;

      // Update status bar
      const languageElement = document.getElementById('current-language');
      if (languageElement) {
        languageElement.textContent = this.formatLanguageName(language);
      }
    }
  }

  /**
   * Map runtime language to Monaco language ID
   *
   * @private
   * @param {string} language - Runtime language
   * @returns {string} Monaco language ID
   */
  getMonacoLanguageId(language) {
    const languageMap = {
      'sqlite': 'sql',
      'typescript': 'typescript',
      'javascript': 'javascript',
      'python': 'python',
      'lua': 'lua',
    };

    return languageMap[language] || language;
  }

  /**
   * Set editor theme
   *
   * @param {string} theme - Theme name ('vs-dark', 'vs-light', etc.)
   */
  setTheme(theme) {
    if (this.editor && this.monaco) {
      this.monaco.editor.setTheme(theme);
      this.options.theme = theme;
    }
  }

  /**
   * Register callback for Run action (Ctrl+Enter)
   *
   * @param {Function} callback - Function to call when Run is triggered
   */
  onRun(callback) {
    this.onRunCallback = callback;
  }

  /**
   * Register callback for content changes
   *
   * @param {Function} callback - Function to call when content changes
   */
  onChange(callback) {
    this.onChangeCallback = callback;
  }

  /**
   * Focus the editor
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Dispose editor instance
   */
  dispose() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }

  /**
   * Get default code for a language
   *
   * @param {string} language - Language ID
   * @returns {string} Default code snippet
   */
  getDefaultCode(language) {
    const defaults = {
      javascript: `// JavaScript - Press Ctrl+Enter to run

console.log("Hello from JavaScript!");
`,
      typescript: `// TypeScript - Press Ctrl+Enter to run

const message: string = "Hello from TypeScript!";
console.log(message);
`,
      coffeescript: `# CoffeeScript - Press Ctrl+Enter to run

message = "Hello from CoffeeScript!"
console.log message

# CoffeeScript features:
square = (x) -> x * x
console.log "5 squared is #{square 5}"
`,
      markdown: `# Markdown Example

Press Ctrl+Enter to analyze this markdown, or click the **Preview** button (👁️) to see it rendered!

## Features

Markdown supports:
- **Bold** and *italic* text
- [Links](https://marked.js.org)
- \`Code snippets\`
- And much more!

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello from code block!");
}
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

> Blockquotes work too!

---

Try the Preview button to see this rendered beautifully!
`,
      json: `{
  "message": "Hello from JSON!",
  "version": "1.0.0",
  "features": [
    "Validation",
    "Formatting",
    "Analysis"
  ],
  "stats": {
    "keys": 4,
    "nested": true
  },
  "active": true
}
`,
      python: `# ===================================================================
# Welcome to DrLee IDE - Python 3.11 in Your Browser!
# ===================================================================
#
# Press Ctrl+Enter (or Cmd+Enter) to run
# First load takes 10-15 seconds to download Pyodide (6.5MB)
#
# AVAILABLE PACKAGES (200+ packages via Pyodide):
# ===================================================================
#
# SCIENTIFIC COMPUTING & DATA SCIENCE:
#   • numpy - Arrays, matrices, mathematical functions
#   • scipy - Scientific computing, optimization, signal processing
#   • pandas - Data analysis, DataFrames, time series
#   • matplotlib - 2D plotting and visualization
#   • scikit-learn - Machine learning algorithms
#   • statsmodels - Statistical models and tests
#   • sympy - Symbolic mathematics
#
# WEB & APIs:
#   • requests - HTTP library (via pyodide-http)
#   • beautifulsoup4 - HTML/XML parsing
#   • lxml - XML/HTML processing
#   • urllib3 - HTTP client
#
# UTILITIES:
#   • regex - Advanced regular expressions
#   • pyyaml - YAML parser
#   • toml - TOML parser
#   • packaging - Version handling
#   • micropip - Package installer (for Pyodide)
#
# IMAGING:
#   • pillow (PIL) - Image processing
#
# CRYPTOGRAPHY:
#   • cryptography - Cryptographic recipes
#
# TESTING:
#   • pytest - Testing framework
#
# DATE/TIME:
#   • python-dateutil - Date parsing
#   • pytz - Timezone definitions
#
# ===================================================================
# HOW TO INSTALL ADDITIONAL PACKAGES:
# ===================================================================
#
# import micropip
# await micropip.install('package-name')
#
# Example:
# import micropip
# await micropip.install(['numpy', 'pandas', 'matplotlib'])
#
# ===================================================================
# DOCUMENTATION:
# ===================================================================
#
# • Python Docs: https://docs.python.org/3.11/
# • Pyodide Docs: https://pyodide.org/en/stable/
# • Package List: https://pyodide.org/en/stable/usage/packages-in-pyodide.html
# • Micropip: https://micropip.pyodide.org/en/stable/
#
# ===================================================================
# QUICK START EXAMPLE:
# ===================================================================

print("🐍 Python 3.11 running in your browser!")
print("=" * 50)

# System info
import sys
print(f"Python version: {sys.version}")
print(f"Platform: {sys.platform}")

# Basic Python
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"Sum of {numbers} = {total}")

# Try numpy (pre-installed)
try:
    import numpy as np
    arr = np.array([1, 2, 3, 4, 5])
    print(f"NumPy array: {arr}")
    print(f"Mean: {arr.mean()}, Std: {arr.std():.2f}")
except ImportError:
    print("NumPy not loaded yet. Install with:")
    print("import micropip; await micropip.install('numpy')")

print("✨ Ready to code! Press Ctrl+Enter to run.")
`,
      lua: `-- Lua - Press Ctrl+Enter to run

print("Hello from Lua!")
`,
      ruby: `# Ruby - Press Ctrl+Enter to run

puts "Hello from Ruby!"
`,
      php: `<?php
// PHP - Press Ctrl+Enter to run

echo "Hello from PHP!\\n";
`,
      r: `# R - Press Ctrl+Enter to run

print("Hello from R!")
`,
      postgresql: `-- PostgreSQL - Press Ctrl+Enter to run

SELECT 'Hello from PostgreSQL!' as message;
`,
      duckdb: `-- DuckDB - Press Ctrl+Enter to run

SELECT 'Hello from DuckDB!' as message;
`,
      scheme: `; Scheme - Press Ctrl+Enter to run

(display "Hello from Scheme!")
(newline)
`,
      commonlisp: `; Common Lisp - Press Ctrl+Enter to run

(format t "Hello from Common Lisp!~%")
`,
      clojure: `; Clojure - Press Ctrl+Enter to run

(println "Hello from Clojure!")
`,
      prolog: `% Prolog - Press Ctrl+Enter to run

:- write('Hello from Prolog!'), nl.
`,
      basic: `10 REM BASIC - Press Ctrl+Enter to run
20 PRINT "Hello from BASIC!"
30 END
`,
      sqlite: `-- ===================================================================
-- Welcome to DrLee IDE - SQLite 3 in Your Browser!
-- ===================================================================
--
-- Press Ctrl+Enter (or Cmd+Enter) to run
-- Uses sql.js - SQLite compiled to WebAssembly
--
-- CAPABILITIES:
-- ===================================================================
-- Full SQLite 3.42+ support running in your browser.
--
-- ✓ All SQL DDL - CREATE, ALTER, DROP tables/indexes
-- ✓ All SQL DML - SELECT, INSERT, UPDATE, DELETE
-- ✓ JOINs, subqueries, CTEs (WITH)
-- ✓ Aggregate functions - COUNT, SUM, AVG, MIN, MAX
-- ✓ Window functions - ROW_NUMBER, RANK, DENSE_RANK
-- ✓ JSON functions - json_extract, json_array, etc.
-- ✓ Full-text search (FTS5)
-- ✓ Transactions - BEGIN, COMMIT, ROLLBACK
-- ✓ Views, triggers, indexes
--
-- LIMITATIONS:
-- ✗ Data is stored in memory (cleared on page refresh)
-- ✗ No persistent file storage
-- ✗ No C extensions or custom functions
--
-- DOCUMENTATION:
-- • SQLite Docs: https://www.sqlite.org/docs.html
-- • SQL Reference: https://www.sqlite.org/lang.html
-- • sql.js (SQLite WASM): https://sql.js.org/
-- • JSON Functions: https://www.sqlite.org/json1.html
--
-- ===================================================================
-- QUICK START EXAMPLE:
-- ===================================================================

-- Create a users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, age) VALUES
  ('Alice Johnson', 'alice@example.com', 30),
  ('Bob Smith', 'bob@example.com', 25),
  ('Carol White', 'carol@example.com', 35);

-- Query with JOIN and aggregation
SELECT
  COUNT(*) as total_users,
  AVG(age) as avg_age,
  MIN(age) as youngest,
  MAX(age) as oldest
FROM users;

-- View all users
SELECT * FROM users ORDER BY name;

-- ✨ Ready to code! Press Ctrl+Enter to run.
`,
      css: `/* CSS - Press Ctrl+Enter to validate */

/* Example CSS */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}
`,
      html: `<!DOCTYPE html>
<!-- HTML - Press Ctrl+Enter to validate -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>Hello from HTML!</h1>
  <p>This is a simple HTML page.</p>

  <button onclick="alert('Hello!')">Click me</button>

  <script>
    console.log('Page loaded successfully!');
  </script>
</body>
</html>
`,
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<!-- XML - Press Ctrl+Enter to validate -->
<library>
  <book id="1">
    <title>The Pragmatic Programmer</title>
    <author>Andrew Hunt</author>
    <author>David Thomas</author>
    <year>1999</year>
    <isbn>978-0201616224</isbn>
  </book>
  <book id="2">
    <title>Clean Code</title>
    <author>Robert C. Martin</author>
    <year>2008</year>
    <isbn>978-0132350884</isbn>
  </book>
</library>
`,
      yaml: `# YAML - Press Ctrl+Enter to validate

# Configuration Example
app:
  name: "DrLee IDE"
  version: "1.0.0"
  debug: true

database:
  host: localhost
  port: 5432
  name: myapp
  credentials:
    user: admin
    password: secret

features:
  - code_execution
  - file_management
  - multi_language_support

languages:
  - name: JavaScript
    extensions: [js, mjs]
  - name: Python
    extensions: [py, pyw]
  - name: TypeScript
    extensions: [ts, tsx]
`,
      shell: `#!/bin/bash
# Shell - Press Ctrl+Enter to simulate

# This is a bash shell simulator (doesn't actually execute on system)
# Safe commands: ls, cd, pwd, cat, grep, wc, echo, etc.

echo "Hello from Shell!"

# List files
ls -la

# Current directory
pwd

# Create some variables
NAME="DrLee IDE"
VERSION="1.0.0"

echo "Welcome to $NAME v$VERSION"

# Simple loop
for i in 1 2 3 4 5; do
  echo "Count: $i"
done

# Note: This is a simulator - no actual system commands are executed
`,
      assemblyscript: `// AssemblyScript - Press Ctrl+Enter to compile to WASM

// AssemblyScript is a TypeScript-like language that compiles to WebAssembly

function fibonacci(n: i32): i32 {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n: i32): i32 {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Export functions to be called from JavaScript
export function calculate(n: i32): i32 {
  const fib = fibonacci(n);
  const fact = factorial(n);
  return fib + fact;
}

// Entry point
export function start(): void {
  const result = calculate(10);
  console.log("Result: " + result.toString());
}
`,
      perl: `# Perl - Press Ctrl+Enter to run
# Uses Perlito5 compiler (Perl to JavaScript)

print "Hello from Perl!\\n";

# Variables
my $name = "DrLee IDE";
my $version = "1.0.0";

print "Welcome to $name v$version\\n";

# Arrays
my @numbers = (1, 2, 3, 4, 5);
my $sum = 0;
foreach my $num (@numbers) {
  $sum += $num;
}
print "Sum: $sum\\n";

# Hashes
my %user = (
  name => "Alice",
  age => 30,
  email => "alice@example.com"
);

print "User: $user{name}, Age: $user{age}\\n";

# Subroutines
sub greet {
  my ($name) = @_;
  return "Hello, $name!";
}

print greet("World"), "\\n";
`,
      mysql: `-- MySQL - Press Ctrl+Enter to run
-- Note: Uses SQLite backend with MySQL-compatible syntax

-- Create a table
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2),
  category VARCHAR(50),
  stock INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO products (name, price, category, stock) VALUES
  ('Laptop', 999.99, 'Electronics', 50),
  ('Mouse', 24.99, 'Electronics', 200),
  ('Desk Chair', 199.99, 'Furniture', 30),
  ('Notebook', 4.99, 'Stationery', 500);

-- Query with aggregation
SELECT
  category,
  COUNT(*) as total_products,
  AVG(price) as avg_price,
  SUM(stock) as total_stock
FROM products
GROUP BY category
ORDER BY avg_price DESC;

-- View all products
SELECT * FROM products ORDER BY price DESC;
`,
      blockly: `<!-- Blockly - Press Ctrl+Enter to execute blocks -->
<!-- This is Blockly XML workspace format -->

<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="text_print" x="20" y="20">
    <value name="TEXT">
      <shadow type="text">
        <field name="TEXT">Hello from Blockly!</field>
      </shadow>
    </value>
  </block>

  <block type="math_arithmetic" x="20" y="80">
    <field name="OP">ADD</field>
    <value name="A">
      <shadow type="math_number">
        <field name="NUM">5</field>
      </shadow>
    </value>
    <value name="B">
      <shadow type="math_number">
        <field name="NUM">10</field>
      </shadow>
    </value>
  </block>
</xml>

<!-- Note: Blockly is best used with a visual editor -->
<!-- This XML format can be generated from blocks -->
`,
      p5js: `// p5.js - Press Ctrl+Enter to run
// Creative coding library for graphics and interactivity

// Setup function - runs once at start
function setup(p) {
  // Create canvas
  p.createCanvas(400, 400);
  p.background(220);

  // Draw a circle
  p.fill(255, 0, 100);
  p.circle(200, 200, 100);

  // Draw text
  p.fill(0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('Hello p5.js!', 200, 200);

  console.log('p5.js sketch started!');
}

// Draw function - runs repeatedly
function draw(p) {
  // Uncomment to create interactive animation
  // p.background(220);
  // p.fill(255, 0, 100);
  // p.circle(p.mouseX, p.mouseY, 50);
}

// Mouse pressed event
function mousePressed(p) {
  console.log('Mouse clicked at:', p.mouseX, p.mouseY);
}

// Note: In browser, creates a visible canvas
// Check console for output
`,
      racket: `#lang racket
; Racket - Press Ctrl+Enter to run
; Note: Uses Scheme R7RS compatibility mode

(display "Hello from Racket!")
(newline)

; Define a function
(define (square x)
  (* x x))

; Use the function
(display "5 squared is: ")
(display (square 5))
(newline)

; List operations
(define numbers (list 1 2 3 4 5))
(display "Numbers: ")
(display numbers)
(newline)

; Map function
(define squared (map square numbers))
(display "Squared: ")
(display squared)
(newline)

; Note: This is Scheme-compatible Racket
; Not all Racket features are supported
`,
      pascal: `program HelloWorld;
{ Pascal - Press Ctrl+Enter to run }
{ Educational Pascal interpreter }

var
  name: string;
  age: integer;
  price: real;

begin
  { Output }
  WriteLn('Hello from Pascal!');
  WriteLn('');
  WriteLn('Welcome to DrLee IDE');

  { Simple assignments }
  name := 'Alice';
  age := 30;
  price := 99.99;

  { Output variables }
  WriteLn(name);
  WriteLn(age);
  WriteLn(price);

  WriteLn('');
  WriteLn('Note: This is a basic educational Pascal interpreter');
  WriteLn('For full Pascal, use Free Pascal or Delphi');
end.
`,
      tcl: `# Tcl - Press Ctrl+Enter to run
# Tool Command Language

puts "Hello from Tcl!"

# Variables
set name "DrLee IDE"
set version "1.0.0"

puts "Welcome to $name v$version"

# Expressions
set a 10
set b 20
set sum [expr {$a + $b}]
puts "Sum: $sum"

# Increment
incr a 5
puts "After increment: $a"

# String operations
set text "Hello World"
set length [string length $text]
puts "Length: $length"

# Append to variable
set message "Tcl"
append message " is awesome!"
puts $message

# Note: Basic Tcl interpreter for educational use
`,
    };

    return defaults[language] || `// ${language}\n`;
  }

  /**
   * Format language name for display
   *
   * @private
   * @param {string} language - Language ID
   * @returns {string} Formatted name
   */
  formatLanguageName(language) {
    const names = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      lua: 'Lua',
      sql: 'SQL',
    };

    return names[language] || language.charAt(0).toUpperCase() + language.slice(1);
  }
}
