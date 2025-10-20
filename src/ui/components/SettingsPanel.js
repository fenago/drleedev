/**
 * SettingsPanel.js
 *
 * Comprehensive settings panel for IDE configuration
 * Includes editor, runtime, UI, and file settings
 */

import { getStats } from '../../runtimes/LanguageRegistry.js';

export default class SettingsPanel {
  constructor(config = {}) {
    this.config = {
      onSave: config.onSave || (() => {}),
      onClose: config.onClose || (() => {}),
      initialSettings: config.initialSettings || this.getDefaultSettings(),
    };

    this.settings = { ...this.config.initialSettings };
    this.modal = null;
    this.activeTab = 'editor';
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      // Editor settings
      editor: {
        fontSize: 14,
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        tabSize: 2,
        lineNumbers: true,
        minimap: true,
        wordWrap: 'off',
        cursorStyle: 'line',
        renderWhitespace: 'none',
      },

      // Runtime settings
      runtime: {
        autoRun: false,
        timeout: 30000, // 30 seconds
        clearOutputOnRun: false,
        showExecutionTime: true,
        showMemoryUsage: true,
      },

      // UI settings
      ui: {
        theme: localStorage.getItem('theme') || 'dark',
        showFileExplorer: true,
        showStatusBar: true,
        outputPosition: 'right', // 'right', 'bottom'
        autoSaveInterval: 3000, // 3 seconds
      },

      // File settings
      files: {
        autoSave: true,
        defaultLanguage: 'javascript',
        confirmBeforeClose: true,
        rememberOpenFiles: true,
      },
    };
  }

  /**
   * Show settings panel
   */
  show() {
    this.render();
    this.modal.classList.remove('hidden');
  }

  /**
   * Hide settings panel
   */
  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.config.onClose();
    }
  }

  /**
   * Render settings panel
   */
  render() {
    // Create modal if it doesn't exist
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.className = 'settings-modal modal';
      this.modal.id = 'settings-modal';
      document.body.appendChild(this.modal);
    }

    const stats = getStats();

    this.modal.innerHTML = `
      <div class="settings-modal-overlay"></div>
      <div class="settings-modal-content">
        <div class="settings-header">
          <h2 class="settings-title">⚙️ Settings</h2>
          <button class="settings-close-btn" id="settings-close-btn">×</button>
        </div>

        <div class="settings-body">
          <!-- Tabs -->
          <div class="settings-tabs">
            <button class="settings-tab ${this.activeTab === 'editor' ? 'active' : ''}" data-tab="editor">
              📝 Editor
            </button>
            <button class="settings-tab ${this.activeTab === 'runtime' ? 'active' : ''}" data-tab="runtime">
              ⚡ Runtime
            </button>
            <button class="settings-tab ${this.activeTab === 'ui' ? 'active' : ''}" data-tab="ui">
              🎨 UI & Appearance
            </button>
            <button class="settings-tab ${this.activeTab === 'files' ? 'active' : ''}" data-tab="files">
              📁 Files
            </button>
            <button class="settings-tab ${this.activeTab === 'about' ? 'active' : ''}" data-tab="about">
              ℹ️ About
            </button>
          </div>

          <!-- Tab Content -->
          <div class="settings-content">
            ${this.renderTabContent()}
          </div>
        </div>

        <div class="settings-footer">
          <button class="btn btn-secondary" id="settings-reset-btn">Reset to Defaults</button>
          <div class="settings-footer-right">
            <button class="btn btn-secondary" id="settings-cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="settings-save-btn">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render tab content based on active tab
   */
  renderTabContent() {
    switch (this.activeTab) {
      case 'editor':
        return this.renderEditorSettings();
      case 'runtime':
        return this.renderRuntimeSettings();
      case 'ui':
        return this.renderUISettings();
      case 'files':
        return this.renderFileSettings();
      case 'about':
        return this.renderAbout();
      default:
        return '';
    }
  }

  /**
   * Render editor settings
   */
  renderEditorSettings() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Editor Configuration</h3>

        <div class="setting-item">
          <label class="setting-label">Font Size</label>
          <div class="setting-control">
            <input
              type="range"
              id="setting-font-size"
              min="10"
              max="24"
              step="1"
              value="${this.settings.editor.fontSize}"
            />
            <span class="setting-value" id="font-size-value">${this.settings.editor.fontSize}px</span>
          </div>
          <p class="setting-description">Adjust the editor font size</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Font Family</label>
          <div class="setting-control">
            <select id="setting-font-family" class="setting-select">
              <option value='Monaco, Consolas, "Courier New", monospace' ${this.settings.editor.fontFamily.includes('Monaco') ? 'selected' : ''}>
                Monaco (Default)
              </option>
              <option value='"Fira Code", monospace' ${this.settings.editor.fontFamily.includes('Fira') ? 'selected' : ''}>
                Fira Code
              </option>
              <option value='"Source Code Pro", monospace' ${this.settings.editor.fontFamily.includes('Source') ? 'selected' : ''}>
                Source Code Pro
              </option>
              <option value='"JetBrains Mono", monospace' ${this.settings.editor.fontFamily.includes('JetBrains') ? 'selected' : ''}>
                JetBrains Mono
              </option>
            </select>
          </div>
          <p class="setting-description">Choose your preferred monospace font</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Tab Size</label>
          <div class="setting-control">
            <input
              type="number"
              id="setting-tab-size"
              min="2"
              max="8"
              value="${this.settings.editor.tabSize}"
              class="setting-input-number"
            />
          </div>
          <p class="setting-description">Number of spaces per tab</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Line Numbers</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-line-numbers"
                ${this.settings.editor.lineNumbers ? 'checked' : ''}
              />
              <span class="checkbox-label">Show line numbers</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Minimap</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-minimap"
                ${this.settings.editor.minimap ? 'checked' : ''}
              />
              <span class="checkbox-label">Show code minimap</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Word Wrap</label>
          <div class="setting-control">
            <select id="setting-word-wrap" class="setting-select">
              <option value="off" ${this.settings.editor.wordWrap === 'off' ? 'selected' : ''}>Off</option>
              <option value="on" ${this.settings.editor.wordWrap === 'on' ? 'selected' : ''}>On</option>
              <option value="bounded" ${this.settings.editor.wordWrap === 'bounded' ? 'selected' : ''}>Bounded</option>
            </select>
          </div>
          <p class="setting-description">Control how lines wrap in the editor</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Cursor Style</label>
          <div class="setting-control">
            <select id="setting-cursor-style" class="setting-select">
              <option value="line" ${this.settings.editor.cursorStyle === 'line' ? 'selected' : ''}>Line</option>
              <option value="block" ${this.settings.editor.cursorStyle === 'block' ? 'selected' : ''}>Block</option>
              <option value="underline" ${this.settings.editor.cursorStyle === 'underline' ? 'selected' : ''}>Underline</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Whitespace</label>
          <div class="setting-control">
            <select id="setting-whitespace" class="setting-select">
              <option value="none" ${this.settings.editor.renderWhitespace === 'none' ? 'selected' : ''}>None</option>
              <option value="boundary" ${this.settings.editor.renderWhitespace === 'boundary' ? 'selected' : ''}>Boundary</option>
              <option value="all" ${this.settings.editor.renderWhitespace === 'all' ? 'selected' : ''}>All</option>
            </select>
          </div>
          <p class="setting-description">Show whitespace characters</p>
        </div>
      </div>
    `;
  }

  /**
   * Render runtime settings
   */
  renderRuntimeSettings() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Runtime Configuration</h3>

        <div class="setting-item">
          <label class="setting-label">Auto Run</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-auto-run"
                ${this.settings.runtime.autoRun ? 'checked' : ''}
              />
              <span class="checkbox-label">Automatically run code on changes</span>
            </label>
          </div>
          <p class="setting-description">Run code automatically after typing stops</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Execution Timeout</label>
          <div class="setting-control">
            <input
              type="number"
              id="setting-timeout"
              min="5000"
              max="120000"
              step="1000"
              value="${this.settings.runtime.timeout}"
              class="setting-input-number"
            />
            <span class="setting-unit">ms</span>
          </div>
          <p class="setting-description">Maximum execution time in milliseconds</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Clear Output</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-clear-output"
                ${this.settings.runtime.clearOutputOnRun ? 'checked' : ''}
              />
              <span class="checkbox-label">Clear output panel before running</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Show Execution Time</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-show-time"
                ${this.settings.runtime.showExecutionTime ? 'checked' : ''}
              />
              <span class="checkbox-label">Display execution time in output</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Show Memory Usage</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-show-memory"
                ${this.settings.runtime.showMemoryUsage ? 'checked' : ''}
              />
              <span class="checkbox-label">Display memory usage in output</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render UI settings
   */
  renderUISettings() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">UI & Appearance</h3>

        <div class="setting-item">
          <label class="setting-label">Theme</label>
          <div class="setting-control">
            <select id="setting-theme" class="setting-select">
              <option value="light" ${this.settings.ui.theme === 'light' ? 'selected' : ''}>☀️ Light</option>
              <option value="dark" ${this.settings.ui.theme === 'dark' ? 'selected' : ''}>🌙 Dark</option>
            </select>
          </div>
          <p class="setting-description">Choose light or dark theme</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">File Explorer</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-file-explorer"
                ${this.settings.ui.showFileExplorer ? 'checked' : ''}
              />
              <span class="checkbox-label">Show file explorer sidebar</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Status Bar</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-status-bar"
                ${this.settings.ui.showStatusBar ? 'checked' : ''}
              />
              <span class="checkbox-label">Show status bar at bottom</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Output Position</label>
          <div class="setting-control">
            <select id="setting-output-position" class="setting-select">
              <option value="right" ${this.settings.ui.outputPosition === 'right' ? 'selected' : ''}>Right Side</option>
              <option value="bottom" ${this.settings.ui.outputPosition === 'bottom' ? 'selected' : ''}>Bottom</option>
            </select>
          </div>
          <p class="setting-description">Position of the output panel (requires reload)</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Auto-Save Interval</label>
          <div class="setting-control">
            <input
              type="number"
              id="setting-autosave-interval"
              min="1000"
              max="30000"
              step="1000"
              value="${this.settings.ui.autoSaveInterval}"
              class="setting-input-number"
            />
            <span class="setting-unit">ms</span>
          </div>
          <p class="setting-description">Time to wait before auto-saving</p>
        </div>
      </div>
    `;
  }

  /**
   * Render file settings
   */
  renderFileSettings() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">File Management</h3>

        <div class="setting-item">
          <label class="setting-label">Auto-Save</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-auto-save"
                ${this.settings.files.autoSave ? 'checked' : ''}
              />
              <span class="checkbox-label">Automatically save files after editing</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Default Language</label>
          <div class="setting-control">
            <select id="setting-default-language" class="setting-select">
              <option value="javascript" ${this.settings.files.defaultLanguage === 'javascript' ? 'selected' : ''}>JavaScript</option>
              <option value="python" ${this.settings.files.defaultLanguage === 'python' ? 'selected' : ''}>Python</option>
              <option value="typescript" ${this.settings.files.defaultLanguage === 'typescript' ? 'selected' : ''}>TypeScript</option>
              <option value="lua" ${this.settings.files.defaultLanguage === 'lua' ? 'selected' : ''}>Lua</option>
              <option value="r" ${this.settings.files.defaultLanguage === 'r' ? 'selected' : ''}>R</option>
              <option value="ruby" ${this.settings.files.defaultLanguage === 'ruby' ? 'selected' : ''}>Ruby</option>
              <option value="sqlite" ${this.settings.files.defaultLanguage === 'sqlite' ? 'selected' : ''}>SQLite</option>
              <option value="duckdb" ${this.settings.files.defaultLanguage === 'duckdb' ? 'selected' : ''}>DuckDB</option>
            </select>
          </div>
          <p class="setting-description">Language for new files</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">Confirm Before Close</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-confirm-close"
                ${this.settings.files.confirmBeforeClose ? 'checked' : ''}
              />
              <span class="checkbox-label">Confirm before closing unsaved files</span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">Remember Open Files</label>
          <div class="setting-control">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                id="setting-remember-files"
                ${this.settings.files.rememberOpenFiles ? 'checked' : ''}
              />
              <span class="checkbox-label">Restore open files on next visit</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render about section
   */
  renderAbout() {
    const stats = getStats();
    return `
      <div class="settings-section settings-about">
        <h3 class="settings-section-title">About DrLee IDE</h3>

        <div class="about-logo">
          <h1>DrLee IDE</h1>
          <p class="about-tagline">Code Anywhere, Execute Everywhere</p>
          <p class="about-version">Version 0.1.0 (Beta)</p>
        </div>

        <div class="about-stats">
          <div class="stat-item">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Languages & Databases</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.implemented}</div>
            <div class="stat-label">Currently Available</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.planned}</div>
            <div class="stat-label">Coming Soon</div>
          </div>
        </div>

        <div class="about-section">
          <h4>What is DrLee IDE?</h4>
          <p>
            DrLee IDE is a revolutionary browser-based Integrated Development Environment
            that runs 100% in your browser using WebAssembly technology. No backend servers,
            complete privacy, and support for 40+ programming languages.
          </p>
        </div>

        <div class="about-section">
          <h4>Features</h4>
          <ul class="about-list">
            <li>✨ 100% client-side execution (your code never leaves your browser)</li>
            <li>🚀 Powered by WebAssembly for near-native performance</li>
            <li>🔒 Privacy-first architecture</li>
            <li>📦 Zero installation required</li>
            <li>💾 Persistent file storage using IndexedDB</li>
            <li>🎨 Monaco Editor (VS Code engine)</li>
            <li>🌙 Light/Dark theme support</li>
          </ul>
        </div>

        <div class="about-section">
          <h4>Currently Available Languages</h4>
          <p class="about-languages">
            JavaScript, TypeScript, Python, Lua, R, Ruby, SQLite, DuckDB
          </p>
        </div>

        <div class="about-section">
          <h4>System Information</h4>
          <div class="system-info">
            <div><strong>Browser:</strong> ${navigator.userAgent.split('(')[1].split(')')[0]}</div>
            <div><strong>Platform:</strong> ${navigator.platform}</div>
            <div><strong>WebAssembly:</strong> ${typeof WebAssembly !== 'undefined' ? '✅ Supported' : '❌ Not Supported'}</div>
            <div><strong>IndexedDB:</strong> ${typeof indexedDB !== 'undefined' ? '✅ Supported' : '❌ Not Supported'}</div>
          </div>
        </div>

        <div class="about-footer">
          <p>
            Built with ❤️ by the DrLee IDE Team<br>
            <a href="https://github.com/drlee-ide" target="_blank">GitHub</a> •
            <a href="https://docs.drlee-ide.dev" target="_blank">Documentation</a> •
            <a href="https://drlee-ide.dev/support" target="_blank">Support</a>
          </p>
          <p class="about-license">
            Licensed under MIT License
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.modal.querySelector('#settings-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click
    const overlay = this.modal.querySelector('.settings-modal-overlay');
    overlay?.addEventListener('click', () => this.hide());

    // Cancel button
    const cancelBtn = this.modal.querySelector('#settings-cancel-btn');
    cancelBtn?.addEventListener('click', () => this.hide());

    // Save button
    const saveBtn = this.modal.querySelector('#settings-save-btn');
    saveBtn?.addEventListener('click', () => this.handleSave());

    // Reset button
    const resetBtn = this.modal.querySelector('#settings-reset-btn');
    resetBtn?.addEventListener('click', () => this.handleReset());

    // Tab switching
    const tabs = this.modal.querySelectorAll('.settings-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        this.activeTab = e.target.dataset.tab;
        this.render();
      });
    });

    // Font size slider
    const fontSizeInput = this.modal.querySelector('#setting-font-size');
    const fontSizeValue = this.modal.querySelector('#font-size-value');
    fontSizeInput?.addEventListener('input', (e) => {
      fontSizeValue.textContent = `${e.target.value}px`;
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Collect settings from form
   */
  collectSettings() {
    const newSettings = {
      editor: {
        fontSize: parseInt(document.getElementById('setting-font-size')?.value || '14'),
        fontFamily: document.getElementById('setting-font-family')?.value || this.settings.editor.fontFamily,
        tabSize: parseInt(document.getElementById('setting-tab-size')?.value || '2'),
        lineNumbers: document.getElementById('setting-line-numbers')?.checked ?? true,
        minimap: document.getElementById('setting-minimap')?.checked ?? true,
        wordWrap: document.getElementById('setting-word-wrap')?.value || 'off',
        cursorStyle: document.getElementById('setting-cursor-style')?.value || 'line',
        renderWhitespace: document.getElementById('setting-whitespace')?.value || 'none',
      },
      runtime: {
        autoRun: document.getElementById('setting-auto-run')?.checked ?? false,
        timeout: parseInt(document.getElementById('setting-timeout')?.value || '30000'),
        clearOutputOnRun: document.getElementById('setting-clear-output')?.checked ?? false,
        showExecutionTime: document.getElementById('setting-show-time')?.checked ?? true,
        showMemoryUsage: document.getElementById('setting-show-memory')?.checked ?? true,
      },
      ui: {
        theme: document.getElementById('setting-theme')?.value || 'dark',
        showFileExplorer: document.getElementById('setting-file-explorer')?.checked ?? true,
        showStatusBar: document.getElementById('setting-status-bar')?.checked ?? true,
        outputPosition: document.getElementById('setting-output-position')?.value || 'right',
        autoSaveInterval: parseInt(document.getElementById('setting-autosave-interval')?.value || '3000'),
      },
      files: {
        autoSave: document.getElementById('setting-auto-save')?.checked ?? true,
        defaultLanguage: document.getElementById('setting-default-language')?.value || 'javascript',
        confirmBeforeClose: document.getElementById('setting-confirm-close')?.checked ?? true,
        rememberOpenFiles: document.getElementById('setting-remember-files')?.checked ?? true,
      },
    };

    return newSettings;
  }

  /**
   * Handle save button
   */
  handleSave() {
    const newSettings = this.collectSettings();
    this.settings = newSettings;

    // Save to localStorage
    localStorage.setItem('drlee-ide-settings', JSON.stringify(newSettings));

    // Call onSave callback
    this.config.onSave(newSettings);

    this.hide();
  }

  /**
   * Handle reset button
   */
  handleReset() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      this.settings = this.getDefaultSettings();
      this.render();
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }
}
