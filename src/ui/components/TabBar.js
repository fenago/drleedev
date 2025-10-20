/**
 * TabBar.js
 *
 * Tab bar component for managing multiple open files
 *
 * Features:
 * - Display tabs for open files
 * - Switch between tabs
 * - Close tabs
 * - New tab button
 * - Unsaved indicator
 * - Tab overflow handling
 */

export default class TabBar {
  constructor(container) {
    this.container = container;
    this.tabs = new Map(); // Map of fileId -> tab data
    this.activeTabId = null;

    // Callbacks
    this.onTabSwitchCallback = null;
    this.onTabCloseCallback = null;
    this.onNewTabCallback = null;
    this.onTabRenameCallback = null;

    this.init();
  }

  /**
   * Initialize tab bar UI
   */
  init() {
    this.container.innerHTML = `
      <div class="tab-bar-wrapper">
        <div class="tab-list" id="tab-list"></div>
        <button class="btn-new-tab" id="btn-new-tab" title="New file (Ctrl+N)">
          <span class="btn-icon">+</span>
        </button>
      </div>
    `;

    // Event listeners
    const newTabBtn = this.container.querySelector('#btn-new-tab');
    newTabBtn.addEventListener('click', () => {
      if (this.onNewTabCallback) {
        this.onNewTabCallback();
      }
    });
  }

  /**
   * Add a new tab
   *
   * @param {object} file - File object
   * @param {string|number} file.id - File ID (or 'new' for untitled)
   * @param {string} file.name - File name
   * @param {string} file.language - Programming language
   * @param {boolean} [file.unsaved] - Has unsaved changes
   * @returns {HTMLElement} Tab element
   */
  addTab(file) {
    const tabList = this.container.querySelector('#tab-list');
    const tabId = file.id || `new-${Date.now()}`;

    // Don't add duplicate tabs
    if (this.tabs.has(tabId)) {
      this.setActiveTab(tabId);
      return this.tabs.get(tabId).element;
    }

    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.tabId = tabId;

    const icon = this.getLanguageIcon(file.language);
    const unsavedIndicator = file.unsaved ? '<span class="unsaved-indicator">●</span>' : '';

    // Add file extension to Untitled files for clarity
    let displayName = file.name || 'Untitled';
    if (displayName === 'Untitled' && file.language) {
      const ext = this.getFileExtension(file.language);
      displayName = `Untitled${ext}`;
    }

    // Add language badge for extra clarity
    const languageBadge = `<span class="tab-language-badge" title="${this.getLanguageName(file.language)}">${this.getLanguageAbbr(file.language)}</span>`;

    tab.innerHTML = `
      <span class="tab-icon">${icon}</span>
      <span class="tab-name">${displayName}</span>
      ${languageBadge}
      ${unsavedIndicator}
      <button class="tab-close" title="Close (Ctrl+W)">×</button>
    `;

    // Tab click to switch
    tab.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.setActiveTab(tabId);
        if (this.onTabSwitchCallback) {
          this.onTabSwitchCallback(tabId, this.tabs.get(tabId).file);
        }
      }
    });

    // Close button
    const closeBtn = tab.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });

    // Double-click on tab name to rename
    const tabNameElement = tab.querySelector('.tab-name');
    if (tabNameElement) {
      tabNameElement.addEventListener('dblclick', async (e) => {
        e.stopPropagation();
        await this.renameTabInline(tabId);
      });
      // Add visual hint that it's editable
      tabNameElement.style.cursor = 'text';
      tabNameElement.title = 'Double-click to rename';
    }

    tabList.appendChild(tab);

    // Store tab data
    this.tabs.set(tabId, {
      element: tab,
      file: file,
    });

    // Set as active
    this.setActiveTab(tabId);

    return tab;
  }

  /**
   * Close a tab
   *
   * @param {string|number} tabId - Tab ID to close
   */
  async closeTab(tabId) {
    const tabData = this.tabs.get(tabId);
    if (!tabData) return;

    // Callback before closing (allows cancellation via unsaved changes prompt)
    if (this.onTabCloseCallback) {
      const shouldClose = await this.onTabCloseCallback(tabId, tabData.file);
      if (shouldClose === false) {
        return; // User cancelled
      }
    }

    // Remove tab element
    tabData.element.remove();
    this.tabs.delete(tabId);

    // If this was the active tab, switch to another
    if (this.activeTabId === tabId) {
      const remainingTabs = Array.from(this.tabs.keys());
      if (remainingTabs.length > 0) {
        this.setActiveTab(remainingTabs[remainingTabs.length - 1]);
        if (this.onTabSwitchCallback) {
          const newActiveTab = this.tabs.get(this.activeTabId);
          this.onTabSwitchCallback(this.activeTabId, newActiveTab.file);
        }
      } else {
        this.activeTabId = null;
        // Open new tab if all tabs are closed
        if (this.onNewTabCallback) {
          this.onNewTabCallback();
        }
      }
    }
  }

  /**
   * Set active tab
   *
   * @param {string|number} tabId - Tab ID to activate
   */
  setActiveTab(tabId) {
    // Remove active class from all tabs
    this.container.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Set active class on selected tab
    const tabData = this.tabs.get(tabId);
    if (tabData) {
      tabData.element.classList.add('active');
      this.activeTabId = tabId;

      // Scroll tab into view if needed
      this.scrollTabIntoView(tabData.element);
    }
  }

  /**
   * Update tab (name, unsaved status, language, etc.)
   *
   * @param {string|number} tabId - Tab ID
   * @param {object} updates - Updates to apply
   * @param {string} [updates.name] - New name
   * @param {boolean} [updates.unsaved] - Unsaved status
   * @param {string} [updates.language] - Language ID
   */
  updateTab(tabId, updates) {
    const tabData = this.tabs.get(tabId);
    if (!tabData) return;

    // Update file data
    if (updates.name !== undefined) {
      tabData.file.name = updates.name;
    }
    if (updates.unsaved !== undefined) {
      tabData.file.unsaved = updates.unsaved;
    }
    if (updates.language !== undefined) {
      tabData.file.language = updates.language;
    }

    // Update UI - name
    const nameElement = tabData.element.querySelector('.tab-name');
    if (nameElement && updates.name) {
      nameElement.textContent = updates.name;
    }

    // Update UI - language icon
    const iconElement = tabData.element.querySelector('.tab-icon');
    if (iconElement && updates.language) {
      iconElement.textContent = this.getLanguageIcon(updates.language);
    }

    // Update UI - language badge
    const badgeElement = tabData.element.querySelector('.tab-language-badge');
    if (badgeElement && updates.language) {
      badgeElement.textContent = this.getLanguageAbbr(updates.language);
      badgeElement.title = this.getLanguageName(updates.language);
    }

    // Update unsaved indicator
    let unsavedIndicator = tabData.element.querySelector('.unsaved-indicator');
    if (updates.unsaved) {
      if (!unsavedIndicator) {
        unsavedIndicator = document.createElement('span');
        unsavedIndicator.className = 'unsaved-indicator';
        unsavedIndicator.textContent = '●';
        tabData.element.insertBefore(unsavedIndicator, tabData.element.querySelector('.tab-close'));
      }
    } else {
      if (unsavedIndicator) {
        unsavedIndicator.remove();
      }
    }
  }

  /**
   * Get language icon emoji
   *
   * @private
   * @param {string} language - Language name
   * @returns {string} Emoji icon
   */
  getLanguageIcon(language) {
    const icons = {
      javascript: '📜',
      typescript: '📘',
      python: '🐍',
      lua: '🌙',
      sqlite: '💾',
      sql: '💾',
      ruby: '💎',
      php: '🐘',
      r: '📊',
      perl: '🐪',
      rust: '🦀',
      go: '🐹',
      java: '☕',
      csharp: '#️⃣',
      cpp: '⚙️',
      c: '⚙️',
    };

    return icons[language] || '📄';
  }

  /**
   * Get file extension for a language
   *
   * @private
   * @param {string} language - Language name
   * @returns {string} File extension
   */
  getFileExtension(language) {
    const extensions = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      lua: '.lua',
      sqlite: '.sql',
      sql: '.sql',
      ruby: '.rb',
      php: '.php',
      r: '.r',
      perl: '.pl',
      rust: '.rs',
      go: '.go',
      java: '.java',
      csharp: '.cs',
      cpp: '.cpp',
      c: '.c',
    };

    return extensions[language] || '.txt';
  }

  /**
   * Get full language name
   *
   * @private
   * @param {string} language - Language ID
   * @returns {string} Full language name
   */
  getLanguageName(language) {
    const names = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      lua: 'Lua',
      sqlite: 'SQLite',
      sql: 'SQL',
      ruby: 'Ruby',
      php: 'PHP',
      r: 'R',
      perl: 'Perl',
      rust: 'Rust',
      go: 'Go',
      java: 'Java',
      csharp: 'C#',
      cpp: 'C++',
      c: 'C',
    };

    return names[language] || language;
  }

  /**
   * Get abbreviated language name for badge
   *
   * @private
   * @param {string} language - Language ID
   * @returns {string} Abbreviated language name
   */
  getLanguageAbbr(language) {
    const abbrs = {
      javascript: 'JS',
      typescript: 'TS',
      python: 'PY',
      lua: 'LUA',
      sqlite: 'SQL',
      sql: 'SQL',
      ruby: 'RB',
      php: 'PHP',
      r: 'R',
      perl: 'PL',
      rust: 'RS',
      go: 'GO',
      java: 'JAVA',
      csharp: 'C#',
      cpp: 'C++',
      c: 'C',
    };

    return abbrs[language] || language.toUpperCase().substring(0, 3);
  }

  /**
   * Scroll tab into view if needed
   *
   * @private
   * @param {HTMLElement} tabElement - Tab element
   */
  scrollTabIntoView(tabElement) {
    const tabList = this.container.querySelector('#tab-list');
    const tabRect = tabElement.getBoundingClientRect();
    const listRect = tabList.getBoundingClientRect();

    if (tabRect.left < listRect.left) {
      tabList.scrollLeft -= listRect.left - tabRect.left + 10;
    } else if (tabRect.right > listRect.right) {
      tabList.scrollLeft += tabRect.right - listRect.right + 10;
    }
  }

  /**
   * Get active tab ID
   *
   * @returns {string|number|null} Active tab ID
   */
  getActiveTabId() {
    return this.activeTabId;
  }

  /**
   * Get tab data
   *
   * @param {string|number} tabId - Tab ID
   * @returns {object|null} Tab data
   */
  getTab(tabId) {
    return this.tabs.get(tabId) || null;
  }

  /**
   * Get all tabs
   *
   * @returns {Array} Array of tab data
   */
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  /**
   * Close all tabs
   */
  closeAllTabs() {
    const tabIds = Array.from(this.tabs.keys());
    tabIds.forEach(tabId => this.closeTab(tabId));
  }

  /**
   * Register callback for tab switch
   *
   * @param {Function} callback - Callback function
   */
  onTabSwitch(callback) {
    this.onTabSwitchCallback = callback;
  }

  /**
   * Register callback for tab close
   *
   * @param {Function} callback - Callback function (return false to cancel)
   */
  onTabClose(callback) {
    this.onTabCloseCallback = callback;
  }

  /**
   * Register callback for new tab
   *
   * @param {Function} callback - Callback function
   */
  onNewTab(callback) {
    this.onNewTabCallback = callback;
  }

  /**
   * Register callback for tab rename
   *
   * @param {Function} callback - Callback function (tabId, newName)
   */
  onTabRename(callback) {
    this.onTabRenameCallback = callback;
  }

  /**
   * Rename tab inline (double-click on tab name)
   *
   * @param {string|number} tabId - Tab ID to rename
   */
  async renameTabInline(tabId) {
    const tabData = this.tabs.get(tabId);
    if (!tabData || !this.onTabRenameCallback) return;

    // Trigger the rename callback which should show a toast prompt
    await this.onTabRenameCallback(tabId, tabData.file);
  }
}
