/**
 * LanguageSelector - Modal-based language/database selector
 *
 * Features:
 * - Searchable list with instant filtering
 * - Categorized by type (scripting, compiled, databases, etc.)
 * - Visual language icons
 * - Keyboard navigation
 * - Shows availability status (available, coming soon)
 */
export default class LanguageSelector {
  /**
   * @param {HTMLElement} container - DOM container for the selector trigger
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.currentLanguage = options.currentLanguage || 'javascript';
    this.onLanguageChange = options.onLanguageChange || (() => {});

    this.modal = null;
    this.searchInput = null;
    this.languageGrid = null;
    this.isOpen = false;

    this.languages = this.getLanguageData();
  }

  /**
   * Initialize the language selector
   */
  init() {
    this.createTriggerButton();
    this.createModal();
    this.attachEventListeners();
  }

  /**
   * Create the trigger button that opens the modal
   */
  createTriggerButton() {
    const button = document.createElement('button');
    button.id = 'language-trigger';
    button.className = 'language-trigger';
    button.innerHTML = `
      <span class="language-icon">${this.getLanguageIcon(this.currentLanguage)}</span>
      <span class="language-name">${this.formatLanguageName(this.currentLanguage)}</span>
      <span class="dropdown-arrow">▼</span>
    `;
    button.title = 'Select language or database';

    this.container.innerHTML = '';
    this.container.appendChild(button);

    button.addEventListener('click', () => this.toggleModal());
  }

  /**
   * Create the modal dialog
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'language-selector-modal';
    modal.className = 'language-selector-modal hidden';

    modal.innerHTML = `
      <div class="language-selector-backdrop"></div>
      <div class="language-selector-content">
        <div class="language-selector-header">
          <h2>Select Language or Database</h2>
          <button class="close-btn" title="Close (Esc)">×</button>
        </div>

        <div class="language-selector-search">
          <input
            type="text"
            id="language-search"
            placeholder="Search languages... (type to filter)"
            autocomplete="off"
          />
        </div>

        <div class="language-selector-body">
          <div id="language-grid" class="language-grid"></div>
        </div>

        <div class="language-selector-footer">
          <div class="legend">
            <span class="legend-item"><span class="status-badge available">✓</span> Available Now</span>
            <span class="legend-item"><span class="status-badge coming-soon">⏳</span> Coming Soon</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    this.modal = modal;
    this.searchInput = modal.querySelector('#language-search');
    this.languageGrid = modal.querySelector('#language-grid');

    // Close button
    modal.querySelector('.close-btn').addEventListener('click', () => this.closeModal());

    // Backdrop click
    modal.querySelector('.language-selector-backdrop').addEventListener('click', () => this.closeModal());

    // Render languages
    this.renderLanguages();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.filterLanguages(e.target.value);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  /**
   * Render language grid
   */
  renderLanguages(filter = '') {
    const filterLower = filter.toLowerCase();

    // Group languages by category
    const categories = this.categorizeLanguages();

    let html = '';

    for (const [category, langs] of Object.entries(categories)) {
      // Filter languages in this category
      const filteredLangs = langs.filter(lang =>
        lang.name.toLowerCase().includes(filterLower) ||
        lang.id.toLowerCase().includes(filterLower) ||
        (lang.description && lang.description.toLowerCase().includes(filterLower))
      );

      if (filteredLangs.length === 0) continue;

      html += `<div class="language-category">`;
      html += `<h3 class="category-title">${category}</h3>`;
      html += `<div class="language-cards">`;

      for (const lang of filteredLangs) {
        const isActive = lang.id === this.currentLanguage;
        const isAvailable = lang.available;
        const statusClass = isAvailable ? 'available' : 'coming-soon';
        const disabledClass = !isAvailable ? 'disabled' : '';
        const activeClass = isActive ? 'active' : '';

        html += `
          <button
            class="language-card ${statusClass} ${disabledClass} ${activeClass}"
            data-language="${lang.id}"
            ${!isAvailable ? 'disabled' : ''}
            title="${lang.description || lang.name}"
          >
            <div class="language-card-icon">${lang.icon}</div>
            <div class="language-card-name">${lang.name}</div>
            ${isActive ? '<div class="active-indicator">✓ Active</div>' : ''}
            ${!isAvailable ? '<div class="status-badge">Coming Soon</div>' : ''}
          </button>
        `;
      }

      html += `</div></div>`;
    }

    if (html === '') {
      html = '<div class="no-results">No languages found matching your search.</div>';
    }

    this.languageGrid.innerHTML = html;

    // Attach click handlers to cards
    this.languageGrid.querySelectorAll('.language-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        const languageId = card.getAttribute('data-language');
        this.selectLanguage(languageId);
      });
    });
  }

  /**
   * Filter languages based on search input
   */
  filterLanguages(query) {
    this.renderLanguages(query);
  }

  /**
   * Select a language
   */
  selectLanguage(languageId) {
    this.currentLanguage = languageId;
    this.updateTriggerButton();
    this.closeModal();
    this.onLanguageChange(languageId);
  }

  /**
   * Update trigger button text
   */
  updateTriggerButton() {
    const button = this.container.querySelector('#language-trigger');
    if (button) {
      button.innerHTML = `
        <span class="language-icon">${this.getLanguageIcon(this.currentLanguage)}</span>
        <span class="language-name">${this.formatLanguageName(this.currentLanguage)}</span>
        <span class="dropdown-arrow">▼</span>
      `;
    }
  }

  /**
   * Toggle modal visibility
   */
  toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  /**
   * Open modal
   */
  openModal() {
    this.modal.classList.remove('hidden');
    this.isOpen = true;
    this.searchInput.value = '';
    this.renderLanguages();

    // Focus search input
    setTimeout(() => this.searchInput.focus(), 100);
  }

  /**
   * Close modal
   */
  closeModal() {
    this.modal.classList.add('hidden');
    this.isOpen = false;
  }

  /**
   * Categorize languages
   */
  categorizeLanguages() {
    const categories = {
      'Popular': [],
      'Databases': [],
      'Scripting Languages': [],
      'Functional & Logic Languages': [],
      'Educational Languages': [],
      'Notebooks & IDE Integrations': [],
      'Compiled Languages': [],
      'JVM Languages': [],
      '.NET Languages': [],
      'Math & Science': [],
      'Modern Languages': [],
      'WASM-Native': [],
    };

    // Define popular languages
    const popularIds = ['javascript', 'typescript', 'python', 'lua', 'r', 'php', 'sql', 'sqlite', 'postgresql', 'duckdb'];

    for (const lang of this.languages) {
      // Skip unavailable languages
      if (!lang.available) continue;

      // Popular category
      if (popularIds.includes(lang.id)) {
        categories['Popular'].push(lang);
      }
      // Databases
      else if (lang.category === 'database') {
        categories['Databases'].push(lang);
      }
      // Notebooks
      else if (lang.category === 'notebook') {
        categories['Notebooks & IDE Integrations'].push(lang);
      }
      // Scripting languages
      else if (['ruby', 'perl', 'tcl'].includes(lang.id)) {
        categories['Scripting Languages'].push(lang);
      }
      // Functional & Logic
      else if (['scheme', 'commonlisp', 'racket', 'haskell', 'ocaml', 'elm', 'erlang', 'elixir', 'prolog', 'clojure'].includes(lang.id)) {
        categories['Functional & Logic Languages'].push(lang);
      }
      // Educational
      else if (['basic', 'pascal', 'scratch', 'blockly'].includes(lang.id)) {
        categories['Educational Languages'].push(lang);
      }
      // Compiled
      else if (['c', 'cpp', 'rust', 'go', 'zig', 'swift'].includes(lang.id)) {
        categories['Compiled Languages'].push(lang);
      }
      // JVM
      else if (['java', 'kotlin', 'scala'].includes(lang.id)) {
        categories['JVM Languages'].push(lang);
      }
      // .NET
      else if (['csharp', 'fsharp'].includes(lang.id)) {
        categories['.NET Languages'].push(lang);
      }
      // Math & Science
      else if (['julia', 'octave', 'fortran'].includes(lang.id)) {
        categories['Math & Science'].push(lang);
      }
      // Modern
      else if (['nim', 'd', 'dart', 'crystal'].includes(lang.id)) {
        categories['Modern Languages'].push(lang);
      }
      // WASM-Native
      else if (['assemblyscript', 'grain', 'wat'].includes(lang.id)) {
        categories['WASM-Native'].push(lang);
      }
    }

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, langs]) => langs.length > 0)
    );
  }

  /**
   * Get language data from LanguageRegistry
   */
  getLanguageData() {
    // Import from LanguageRegistry (will be included inline for now)
    const registryData = [
      // === CURRENTLY IMPLEMENTED ===
      { id: 'javascript', name: 'JavaScript', icon: '🟨', available: true, category: 'language', tier: 'free', description: 'Native browser JavaScript execution' },
      { id: 'typescript', name: 'TypeScript', icon: '🔷', available: true, category: 'language', tier: 'free', description: 'TypeScript with type checking' },
      { id: 'python', name: 'Python', icon: '🐍', available: true, category: 'language', tier: 'free', description: 'Python 3.11+ via Pyodide' },
      { id: 'lua', name: 'Lua', icon: '🌙', available: true, category: 'language', tier: 'free', description: 'Lua 5.4 via Wasmoon' },
      { id: 'r', name: 'R', icon: '📊', available: true, category: 'language', tier: 'pro', description: 'R 4.3 for statistics and data science' },
      { id: 'ruby', name: 'Ruby', icon: '💎', available: true, category: 'language', tier: 'pro', description: 'Ruby 3.2 via ruby.wasm' },
      { id: 'sqlite', name: 'SQLite', icon: '🗄️', available: true, category: 'database', tier: 'free', description: 'SQLite 3.x embedded database' },
      { id: 'duckdb', name: 'DuckDB', icon: '🦆', available: true, category: 'database', tier: 'pro', description: 'DuckDB analytics database' },

      // === COMING SOON - HIGH PRIORITY ===
      { id: 'php', name: 'PHP', icon: '🐘', available: true, category: 'language', tier: 'pro', description: 'PHP 8.2 for web development' },
      { id: 'postgresql', name: 'PostgreSQL', icon: '🐘', available: true, category: 'database', tier: 'pro', description: 'PostgreSQL 16 via PGLite' },
      { id: 'scheme', name: 'Scheme', icon: '🎓', available: true, category: 'language', tier: 'pro', description: 'Scheme R7RS via BiwaScheme' },
      { id: 'perl', name: 'Perl', icon: '🐪', available: false, category: 'language', tier: 'pro', description: 'Perl 5 scripting' },

      // === COMPILED LANGUAGES ===
      { id: 'c', name: 'C', icon: '⚙️', available: false, category: 'language', tier: 'enterprise', description: 'C via Emscripten/clang-wasm' },
      { id: 'cpp', name: 'C++', icon: '⚙️', available: false, category: 'language', tier: 'enterprise', description: 'C++ via Emscripten/clang-wasm' },
      { id: 'rust', name: 'Rust', icon: '🦀', available: false, category: 'language', tier: 'enterprise', description: 'Rust via rust-wasm' },
      { id: 'go', name: 'Go', icon: '🐹', available: false, category: 'language', tier: 'enterprise', description: 'Go via TinyGo WASM' },
      { id: 'zig', name: 'Zig', icon: '⚡', available: false, category: 'language', tier: 'enterprise', description: 'Zig systems programming' },
      { id: 'swift', name: 'Swift', icon: '🦅', available: false, category: 'language', tier: 'enterprise', description: 'Swift via SwiftWasm' },

      // === JVM LANGUAGES ===
      { id: 'java', name: 'Java', icon: '☕', available: false, category: 'language', tier: 'enterprise', description: 'Java via CheerpJ/TeaVM' },
      { id: 'kotlin', name: 'Kotlin', icon: '🟣', available: false, category: 'language', tier: 'enterprise', description: 'Kotlin via Kotlin/JS' },
      { id: 'scala', name: 'Scala', icon: '🔴', available: false, category: 'language', tier: 'enterprise', description: 'Scala via Scala.js' },
      { id: 'clojure', name: 'Clojure', icon: '🔵', available: true, category: 'language', tier: 'pro', description: 'Clojure via ClojureScript REPL' },

      // === .NET LANGUAGES ===
      { id: 'csharp', name: 'C#', icon: '💚', available: false, category: 'language', tier: 'enterprise', description: 'C# via Blazor WASM' },
      { id: 'fsharp', name: 'F#', icon: '💜', available: false, category: 'language', tier: 'enterprise', description: 'F# via Fable' },

      // === FUNCTIONAL LANGUAGES ===
      { id: 'haskell', name: 'Haskell', icon: '🎭', available: false, category: 'language', tier: 'pro', description: 'Haskell via GHCJS/Asterius' },
      { id: 'ocaml', name: 'OCaml', icon: '🐫', available: false, category: 'language', tier: 'pro', description: 'OCaml via js_of_ocaml' },
      { id: 'elm', name: 'Elm', icon: '🌳', available: false, category: 'language', tier: 'pro', description: 'Elm functional programming' },
      { id: 'erlang', name: 'Erlang', icon: '📡', available: false, category: 'language', tier: 'pro', description: 'Erlang via Gleam' },
      { id: 'elixir', name: 'Elixir', icon: '💧', available: false, category: 'language', tier: 'pro', description: 'Elixir (experimental)' },

      // === LISP FAMILY ===
      { id: 'commonlisp', name: 'Common Lisp', icon: '🎓', available: true, category: 'language', tier: 'pro', description: 'Common Lisp ANSI CL via JSCL' },
      { id: 'racket', name: 'Racket', icon: '🎾', available: false, category: 'language', tier: 'pro', description: 'Racket Scheme' },

      // === EDUCATION/SCRIPTING ===
      { id: 'basic', name: 'BASIC', icon: '📺', available: true, category: 'language', tier: 'free', description: 'Classic BASIC programming' },
      { id: 'pascal', name: 'Pascal', icon: '🎯', available: false, category: 'language', tier: 'pro', description: 'Pascal via pas2js' },
      { id: 'tcl', name: 'Tcl', icon: '🔧', available: false, category: 'language', tier: 'pro', description: 'Tool Command Language' },

      // === MATH & SCIENCE ===
      { id: 'julia', name: 'Julia', icon: '🔬', available: false, category: 'language', tier: 'enterprise', description: 'Julia scientific computing (experimental)' },
      { id: 'octave', name: 'Octave', icon: '🔢', available: false, category: 'language', tier: 'pro', description: 'GNU Octave (MATLAB alternative)' },
      { id: 'fortran', name: 'Fortran', icon: '🧮', available: false, category: 'language', tier: 'enterprise', description: 'Fortran via LLVM WASM' },
      { id: 'prolog', name: 'Prolog', icon: '🤔', available: true, category: 'language', tier: 'pro', description: 'Prolog logic programming via Tau Prolog' },

      // === MODERN/NICHE LANGUAGES ===
      { id: 'nim', name: 'Nim', icon: '👑', available: false, category: 'language', tier: 'pro', description: 'Nim systems programming' },
      { id: 'd', name: 'D', icon: '🔶', available: false, category: 'language', tier: 'pro', description: 'D programming language' },
      { id: 'dart', name: 'Dart', icon: '🎯', available: false, category: 'language', tier: 'pro', description: 'Dart via dart2js' },
      { id: 'crystal', name: 'Crystal', icon: '💎', available: false, category: 'language', tier: 'pro', description: 'Crystal (Ruby-like syntax, compiled)' },

      // === WASM-NATIVE LANGUAGES ===
      { id: 'assemblyscript', name: 'AssemblyScript', icon: '🔷', available: false, category: 'language', tier: 'pro', description: 'TypeScript-like for WASM' },
      { id: 'grain', name: 'Grain', icon: '🌾', available: false, category: 'language', tier: 'pro', description: 'Modern language for WASM' },
      { id: 'wat', name: 'WebAssembly Text', icon: '⚙️', available: false, category: 'language', tier: 'pro', description: 'WebAssembly Text Format' },

      // === ADDITIONAL DATABASES ===
      { id: 'mongodb', name: 'MongoDB', icon: '🍃', available: false, category: 'database', tier: 'enterprise', description: 'MongoDB document database' },
      { id: 'redis', name: 'Redis', icon: '🔴', available: false, category: 'database', tier: 'pro', description: 'Redis in-memory database' },

      // === NOTEBOOKS & IDE INTEGRATIONS ===
      { id: 'jupyterlite', name: 'JupyterLite', icon: '📓', available: true, category: 'notebook', tier: 'pro', description: 'Jupyter notebooks in browser' },
      { id: 'starboard', name: 'Starboard Notebook', icon: '⭐', available: false, category: 'notebook', tier: 'free', description: 'Interactive notebook environment' },
      { id: 'observable', name: 'Observable', icon: '👁️', available: false, category: 'notebook', tier: 'pro', description: 'Reactive notebooks for JavaScript' },
      { id: 'blockly', name: 'Blockly', icon: '🧩', available: false, category: 'notebook', tier: 'free', description: 'Visual block programming' },
      { id: 'codemirror', name: 'CodeMirror', icon: '📝', available: false, category: 'notebook', tier: 'free', description: 'Advanced code editor' },
      { id: 'sagemath', name: 'SageMath Cell', icon: '🧮', available: false, category: 'notebook', tier: 'pro', description: 'Mathematics computation' },
      { id: 'swagger', name: 'Swagger Editor', icon: '📋', available: false, category: 'notebook', tier: 'pro', description: 'API design and documentation' },
      { id: 'sqlpad', name: 'SQL Pad', icon: '💾', available: false, category: 'notebook', tier: 'pro', description: 'SQL query editor' },
      { id: 'p5js', name: 'p5.js Editor', icon: '🎨', available: false, category: 'notebook', tier: 'free', description: 'Creative coding with p5.js' },
      { id: 'scratch', name: 'Scratch', icon: '🐱', available: false, category: 'notebook', tier: 'free', description: 'Visual programming for education' },
      { id: 'polynote', name: 'Polynote', icon: '📊', available: false, category: 'notebook', tier: 'enterprise', description: 'Polyglot notebook environment' },
    ];

    return registryData;
  }

  /**
   * Get language icon
   */
  getLanguageIcon(languageId) {
    const lang = this.languages.find(l => l.id === languageId);
    return lang ? lang.icon : '📄';
  }

  /**
   * Format language name for display
   */
  formatLanguageName(languageId) {
    const lang = this.languages.find(l => l.id === languageId);
    return lang ? lang.name : languageId.charAt(0).toUpperCase() + languageId.slice(1);
  }

  /**
   * Dispose selector
   */
  dispose() {
    if (this.modal) {
      this.modal.remove();
    }
  }
}
