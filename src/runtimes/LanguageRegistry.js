/**
 * LanguageRegistry.js
 *
 * Comprehensive registry of all supported languages and databases
 * Includes current status, tier, and implementation details
 */

export const LANGUAGE_REGISTRY = {
  // === CURRENTLY IMPLEMENTED ===

  javascript: {
    id: 'javascript',
    displayName: 'JavaScript',
    category: 'language',
    tier: 'free',
    status: 'implemented',
    lazy: false,
    size: '0 KB (native)',
    icon: '🟨',
    description: 'Native browser JavaScript execution',
  },

  typescript: {
    id: 'typescript',
    displayName: 'TypeScript',
    category: 'language',
    tier: 'free',
    status: 'implemented',
    lazy: false,
    size: '0 KB (transpiles to JS)',
    icon: '🔷',
    description: 'TypeScript with type checking',
  },

  python: {
    id: 'python',
    displayName: 'Python',
    category: 'language',
    tier: 'free',
    status: 'implemented',
    lazy: true,
    size: '6.5 MB',
    icon: '🐍',
    description: 'Python 3.11+ via Pyodide',
  },

  lua: {
    id: 'lua',
    displayName: 'Lua',
    category: 'language',
    tier: 'free',
    status: 'implemented',
    lazy: true,
    size: '200 KB',
    icon: '🌙',
    description: 'Lua 5.4 via Wasmoon',
  },

  r: {
    id: 'r',
    displayName: 'R',
    category: 'language',
    tier: 'pro',
    status: 'implemented',
    lazy: true,
    size: '10 MB',
    icon: '📊',
    description: 'R 4.3 for statistics and data science',
  },

  ruby: {
    id: 'ruby',
    displayName: 'Ruby',
    category: 'language',
    tier: 'pro',
    status: 'implemented',
    lazy: true,
    size: '15 MB',
    icon: '💎',
    description: 'Ruby 3.2 via ruby.wasm',
  },

  sqlite: {
    id: 'sqlite',
    displayName: 'SQLite',
    category: 'database',
    tier: 'free',
    status: 'implemented',
    lazy: true,
    size: '2 MB',
    icon: '🗄️',
    description: 'SQLite 3.x embedded database',
  },

  duckdb: {
    id: 'duckdb',
    displayName: 'DuckDB',
    category: 'database',
    tier: 'pro',
    status: 'implemented',
    lazy: true,
    size: '5 MB',
    icon: '🦆',
    description: 'DuckDB analytics database',
  },

  // === COMING SOON (HIGH PRIORITY) ===

  php: {
    id: 'php',
    displayName: 'PHP',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '5 MB',
    icon: '🐘',
    description: 'PHP 8.x for web development',
  },

  postgresql: {
    id: 'postgresql',
    displayName: 'PostgreSQL',
    category: 'database',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '3 MB',
    icon: '🐘',
    description: 'PostgreSQL via PGLite',
  },

  scheme: {
    id: 'scheme',
    displayName: 'Scheme',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '500 KB',
    icon: '🎓',
    description: 'Scheme (Lisp dialect) via BiwaScheme',
  },

  // === COMPILED LANGUAGES ===

  c: {
    id: 'c',
    displayName: 'C',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '20 MB',
    icon: '⚙️',
    description: 'C via Emscripten/clang-wasm',
  },

  cpp: {
    id: 'cpp',
    displayName: 'C++',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '20 MB',
    icon: '⚙️',
    description: 'C++ via Emscripten/clang-wasm',
  },

  rust: {
    id: 'rust',
    displayName: 'Rust',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '25 MB',
    icon: '🦀',
    description: 'Rust via rust-wasm',
  },

  go: {
    id: 'go',
    displayName: 'Go',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '15 MB',
    icon: '🐹',
    description: 'Go via TinyGo WASM',
  },

  zig: {
    id: 'zig',
    displayName: 'Zig',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '12 MB',
    icon: '⚡',
    description: 'Zig systems programming',
  },

  swift: {
    id: 'swift',
    displayName: 'Swift',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '18 MB',
    icon: '🦅',
    description: 'Swift via SwiftWasm',
  },

  // === JVM LANGUAGES ===

  java: {
    id: 'java',
    displayName: 'Java',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '30 MB',
    icon: '☕',
    description: 'Java via CheerpJ/TeaVM',
  },

  kotlin: {
    id: 'kotlin',
    displayName: 'Kotlin',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '25 MB',
    icon: '🟣',
    description: 'Kotlin via Kotlin/JS',
  },

  scala: {
    id: 'scala',
    displayName: 'Scala',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '28 MB',
    icon: '🔴',
    description: 'Scala via Scala.js',
  },

  // === .NET LANGUAGES ===

  csharp: {
    id: 'csharp',
    displayName: 'C#',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '22 MB',
    icon: '💚',
    description: 'C# via Blazor WASM',
  },

  fsharp: {
    id: 'fsharp',
    displayName: 'F#',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '20 MB',
    icon: '💜',
    description: 'F# via Fable',
  },

  // === FUNCTIONAL LANGUAGES ===

  haskell: {
    id: 'haskell',
    displayName: 'Haskell',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '18 MB',
    icon: '🎭',
    description: 'Haskell via GHCJS/Asterius',
  },

  ocaml: {
    id: 'ocaml',
    displayName: 'OCaml',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '12 MB',
    icon: '🐫',
    description: 'OCaml via js_of_ocaml',
  },

  elm: {
    id: 'elm',
    displayName: 'Elm',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '8 MB',
    icon: '🌳',
    description: 'Elm functional programming',
  },

  erlang: {
    id: 'erlang',
    displayName: 'Erlang',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '15 MB',
    icon: '📡',
    description: 'Erlang via Gleam',
  },

  elixir: {
    id: 'elixir',
    displayName: 'Elixir',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '16 MB',
    icon: '💧',
    description: 'Elixir (experimental)',
  },

  // === LISP FAMILY ===

  commonlisp: {
    id: 'commonlisp',
    displayName: 'Common Lisp',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '10 MB',
    icon: '🎓',
    description: 'Common Lisp via JSCL',
  },

  // === EDUCATION/SCRIPTING ===

  basic: {
    id: 'basic',
    displayName: 'BASIC',
    category: 'language',
    tier: 'free',
    status: 'planned',
    lazy: true,
    size: '1 MB',
    icon: '📺',
    description: 'BASIC programming',
  },

  // === MATH & SCIENCE ===

  julia: {
    id: 'julia',
    displayName: 'Julia',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '50 MB',
    icon: '🔬',
    description: 'Julia scientific computing (experimental)',
  },

  octave: {
    id: 'octave',
    displayName: 'Octave',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '35 MB',
    icon: '🔢',
    description: 'GNU Octave (MATLAB alternative)',
  },

  fortran: {
    id: 'fortran',
    displayName: 'Fortran',
    category: 'language',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '25 MB',
    icon: '🧮',
    description: 'Fortran via LLVM WASM',
  },

  prolog: {
    id: 'prolog',
    displayName: 'Prolog',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '4 MB',
    icon: '🤔',
    description: 'Prolog logic programming',
  },

  // === MODERN/NICHE LANGUAGES ===

  nim: {
    id: 'nim',
    displayName: 'Nim',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '10 MB',
    icon: '👑',
    description: 'Nim systems programming',
  },

  d: {
    id: 'd',
    displayName: 'D',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '15 MB',
    icon: '🔶',
    description: 'D programming language',
  },

  dart: {
    id: 'dart',
    displayName: 'Dart',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '12 MB',
    icon: '🎯',
    description: 'Dart via dart2js',
  },

  crystal: {
    id: 'crystal',
    displayName: 'Crystal',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '18 MB',
    icon: '💎',
    description: 'Crystal (Ruby-like syntax, compiled)',
  },

  // === WASM-NATIVE LANGUAGES ===

  assemblyscript: {
    id: 'assemblyscript',
    displayName: 'AssemblyScript',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '5 MB',
    icon: '🔷',
    description: 'TypeScript-like for WASM',
  },

  grain: {
    id: 'grain',
    displayName: 'Grain',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '8 MB',
    icon: '🌾',
    description: 'Modern language for WASM',
  },

  wat: {
    id: 'wat',
    displayName: 'WebAssembly Text',
    category: 'language',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '1 MB',
    icon: '⚙️',
    description: 'WebAssembly Text Format',
  },

  // === ADDITIONAL DATABASES ===

  mongodb: {
    id: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    tier: 'enterprise',
    status: 'planned',
    lazy: true,
    size: '10 MB',
    icon: '🍃',
    description: 'MongoDB document database',
  },

  redis: {
    id: 'redis',
    displayName: 'Redis',
    category: 'database',
    tier: 'pro',
    status: 'planned',
    lazy: true,
    size: '3 MB',
    icon: '🔴',
    description: 'Redis in-memory database',
  },
};

/**
 * Get all languages/databases by status
 */
export function getByStatus(status) {
  return Object.values(LANGUAGE_REGISTRY).filter((item) => item.status === status);
}

/**
 * Get all languages (excluding databases)
 */
export function getLanguages() {
  return Object.values(LANGUAGE_REGISTRY).filter((item) => item.category === 'language');
}

/**
 * Get all databases
 */
export function getDatabases() {
  return Object.values(LANGUAGE_REGISTRY).filter((item) => item.category === 'database');
}

/**
 * Get all items by tier
 */
export function getByTier(tier) {
  return Object.values(LANGUAGE_REGISTRY).filter((item) => item.tier === tier);
}

/**
 * Get statistics
 */
export function getStats() {
  const all = Object.values(LANGUAGE_REGISTRY);
  return {
    total: all.length,
    implemented: all.filter((i) => i.status === 'implemented').length,
    planned: all.filter((i) => i.status === 'planned').length,
    languages: getLanguages().length,
    databases: getDatabases().length,
    free: getByTier('free').length,
    pro: getByTier('pro').length,
    enterprise: getByTier('enterprise').length,
  };
}
