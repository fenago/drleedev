/**
 * DrLee IDE - Main Application Entry Point
 *
 * Initializes and orchestrates all components of the IDE.
 */

import Editor from './ui/components/Editor.js';
import OutputPanel from './ui/components/OutputPanel.js';
import PreviewPanel from './ui/components/PreviewPanel.js';
import RuntimeManager from './runtimes/RuntimeManager.js';
import FileManager from './storage/FileManager.js';
import GitManager from './storage/GitManager.js';
import TabBar from './ui/components/TabBar.js';
import LanguageSelector from './ui/components/LanguageSelector.js';
import FileExplorer from './ui/components/FileExplorer.js';
import Toast from './ui/components/Toast.js';
import SettingsPanel from './ui/components/SettingsPanel.js';
import GitCloneDialog from './ui/components/GitCloneDialog.js';

/**
 * DrLeeIDE - Main Application Class
 */
class DrLeeIDE {
  constructor() {
    this.editor = null;
    this.outputPanel = null;
    this.previewPanel = null;
    this.runtimeManager = null;
    this.fileManager = null;
    this.gitManager = null;
    this.tabBar = null;
    this.languageSelector = null;
    this.fileExplorer = null;
    this.toast = null;
    this.settingsPanel = null;
    this.gitCloneDialog = null;

    this.currentLanguage = 'markdown';
    this.currentFile = null; // Currently open file
    this.openFiles = new Map(); // Map of tabId -> file content
    this.isExecuting = false;
    this.hasUnsavedChanges = false;
    this.currentTheme = 'dark'; // 'dark' or 'light'
    this.autoSaveTimer = null;
    this.autoSaveDelay = 3000; // Auto-save after 3 seconds of inactivity
    this.isAutoSaving = false;
    this.isPreviewMode = false; // Track if preview is active
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing DrLee IDE...');

      // Show loading overlay
      this.showLoading('Initializing IDE...');

      // Initialize components
      this.initToast(); // Initialize toast first
      this.initSettingsPanel(); // Initialize settings panel
      await this.initEditor();
      this.initOutputPanel();
      this.initPreviewPanel();
      await this.initRuntimeManager();
      await this.initFileManager();
      this.initTabBar();
      this.initLanguageSelector();
      await this.initFileExplorer();
      this.initTheme();
      this.initEventListeners();

      // Open initial tab
      this.handleNewTab();

      // Update button visibility (preview, validator)
      this.updatePreviewVisibility();
      this.updateValidatorVisibility();

      // Hide loading overlay
      this.hideLoading();

      // Update status
      this.setStatus('Ready');

      // Focus editor
      this.editor.focus();

      console.log('DrLee IDE initialized successfully!');

      // Show welcome toast
      this.toast.success('Welcome to DrLee IDE! 🚀');
    } catch (error) {
      console.error('Failed to initialize DrLee IDE:', error);
      this.showError(`Initialization failed: ${error.message}`);
      this.hideLoading();
    }
  }

  /**
   * Initialize Monaco Editor
   */
  async initEditor() {
    const container = document.getElementById('editor-container');
    if (!container) {
      throw new Error('Editor container not found');
    }

    this.editor = new Editor(container, {
      language: this.currentLanguage,
      theme: 'vs-dark',
      fontSize: 14,
    });

    await this.editor.init();

    // Register callbacks
    this.editor.onRun(() => this.handleRunCode());
    this.editor.onChange((code) => this.handleCodeChange(code));
  }

  /**
   * Initialize Output Panel
   */
  initOutputPanel() {
    const container = document.getElementById('output-container');
    if (!container) {
      throw new Error('Output container not found');
    }

    this.outputPanel = new OutputPanel(container);
    this.outputPanel.showWelcome();
  }

  /**
   * Initialize Preview Panel
   */
  initPreviewPanel() {
    const container = document.getElementById('preview-container');
    if (!container) {
      throw new Error('Preview container not found');
    }

    this.previewPanel = new PreviewPanel(container);
    this.previewPanel.init();
    console.log('Preview panel initialized');
  }

  /**
   * Initialize Runtime Manager
   */
  async initRuntimeManager() {
    this.runtimeManager = new RuntimeManager();
    await this.runtimeManager.init();

    // Switch to default language (JavaScript)
    await this.runtimeManager.switchLanguage(this.currentLanguage);

    // Register output callbacks
    this.runtimeManager.onOutput((text, type) => {
      this.outputPanel.addLine(text, type);
    });

    this.runtimeManager.onError((text, type) => {
      this.outputPanel.addLine(text, type);
    });
  }

  /**
   * Initialize File Manager
   */
  async initFileManager() {
    this.fileManager = new FileManager();
    await this.fileManager.init();
    console.log('FileManager initialized successfully');

    // Initialize Git Manager
    this.gitManager = new GitManager(this.fileManager);
    console.log('GitManager initialized successfully');

    // Create example files for new users (if no files exist)
    const fileCount = await this.fileManager.getFileCount();
    if (fileCount === 0) {
      console.log('Creating example files for new user...');
      const exampleCount = await this.fileManager.createExampleFiles();
      console.log(`Created ${exampleCount} example files`);
    }
  }

  /**
   * Initialize Tab Bar
   */
  initTabBar() {
    const container = document.getElementById('tab-bar-container');
    if (!container) {
      throw new Error('Tab bar container not found');
    }

    this.tabBar = new TabBar(container);

    // Register tab callbacks
    this.tabBar.onTabSwitch((tabId, file) => {
      this.handleTabSwitch(tabId, file);
    });

    this.tabBar.onTabClose((tabId, file) => {
      return this.handleTabClose(tabId, file);
    });

    this.tabBar.onNewTab(() => {
      this.handleNewTab();
    });

    this.tabBar.onTabRename((tabId, file) => {
      return this.handleTabRename(tabId, file);
    });

    console.log('TabBar initialized successfully');
  }

  /**
   * Initialize Language Selector
   */
  initLanguageSelector() {
    const container = document.getElementById('language-selector-container');
    if (!container) {
      throw new Error('Language selector container not found');
    }

    this.languageSelector = new LanguageSelector(container, {
      currentLanguage: this.currentLanguage,
      onLanguageChange: (language) => this.handleLanguageChange(language),
    });

    this.languageSelector.init();
    console.log('LanguageSelector initialized successfully');
  }

  /**
   * Initialize Toast Notification System
   */
  initToast() {
    this.toast = new Toast();
    console.log('Toast notification system initialized');
  }

  /**
   * Initialize Settings Panel
   */
  initSettingsPanel() {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('drlee-ide-settings');
    const initialSettings = savedSettings ? JSON.parse(savedSettings) : undefined;

    this.settingsPanel = new SettingsPanel({
      initialSettings,
      onSave: (settings) => this.applySettings(settings),
      onClose: () => {
        // Settings panel closed
      },
    });
    console.log('Settings panel initialized');
  }

  /**
   * Initialize File Explorer
   */
  async initFileExplorer() {
    const container = document.getElementById('file-explorer-container');
    if (!container) {
      throw new Error('File explorer container not found');
    }

    this.fileExplorer = new FileExplorer(container, {
      fileManager: this.fileManager,
      toast: this.toast,
      onFileOpen: (file) => this.handleFileOpen(file),
      onFileDelete: (fileId) => this.handleFileDeleted(fileId),
      onFileRename: (fileId, newName) => this.handleFileRenamed(fileId, newName),
      onFileRun: (file) => this.handleFileRun(file),
    });

    await this.fileExplorer.init();
    console.log('FileExplorer initialized successfully');

    // Initialize Git Clone Dialog
    this.gitCloneDialog = new GitCloneDialog(this.gitManager, this.fileExplorer);
    this.gitCloneDialog.init();
    console.log('GitCloneDialog initialized successfully');

    // Add Git clone button to toolbar
    this.createGitCloneButton();
  }

  /**
   * Initialize theme
   */
  initTheme() {
    // Load theme preference from localStorage (default to light)
    const savedTheme = localStorage.getItem('drlee-ide-theme') || 'light';
    this.currentTheme = savedTheme;

    // Apply theme
    this.applyTheme(savedTheme);

    console.log(`Theme initialized: ${savedTheme}`);
  }

  /**
   * Apply theme to the application
   *
   * @param {string} theme - 'dark' or 'light'
   */
  applyTheme(theme) {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');

    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
      if (themeIcon) themeIcon.textContent = '☀️';
      if (this.editor) {
        this.editor.setTheme('vs-light');
      }
    } else {
      html.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.textContent = '🌙';
      if (this.editor) {
        this.editor.setTheme('vs-dark');
      }
    }

    this.currentTheme = theme;
    localStorage.setItem('drlee-ide-theme', theme);
  }

  /**
   * Toggle between light and dark themes
   */
  handleThemeToggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.setStatus(`Switched to ${newTheme} theme`);
    setTimeout(() => this.setStatus('Ready'), 2000);
  }

  /**
   * Initialize event listeners for UI controls
   */
  initEventListeners() {
    // Run button
    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.handleRunCode());
    }

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClearOutput());
    }

    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave());
    }

    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.handleDownload());
    }

    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => this.handleThemeToggle());
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.handleSettings());
    }

    // Preview toggle button
    const previewToggleBtn = document.getElementById('preview-toggle');
    if (previewToggleBtn) {
      previewToggleBtn.addEventListener('click', () => this.handlePreviewToggle());
    }

    // Validator button
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => this.handleValidate());
    }

    // Panel resizer
    this.initResizer();

    // Global keyboard shortcuts
    this.initKeyboardShortcuts();
  }

  /**
   * Initialize global keyboard shortcuts
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S - Save
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        this.handleSave();
        return;
      }

      // Ctrl/Cmd + Enter - Run
      if (ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.handleRunCode();
        return;
      }

      // Ctrl/Cmd + W - Close current tab
      if (ctrlKey && e.key === 'w') {
        e.preventDefault();
        const activeTabId = this.tabBar.getActiveTabId();
        if (activeTabId) {
          this.tabBar.closeTab(activeTabId);
        }
        return;
      }

      // Ctrl/Cmd + Shift + N - New file
      if (ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.handleNewTab();
        return;
      }

      // Ctrl/Cmd + Tab - Next tab
      if (ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.switchToNextTab();
        return;
      }

      // Ctrl/Cmd + Shift + Tab - Previous tab
      if (ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        this.switchToPreviousTab();
        return;
      }

      // Ctrl/Cmd + , - Settings (for future use)
      if (ctrlKey && e.key === ',') {
        e.preventDefault();
        this.handleSettings();
        return;
      }
    });

    console.log('Keyboard shortcuts initialized');
  }

  /**
   * Switch to next tab
   */
  switchToNextTab() {
    const tabs = Array.from(this.tabBar.tabs.keys());
    if (tabs.length <= 1) return;

    const currentIndex = tabs.indexOf(this.tabBar.getActiveTabId());
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTabId = tabs[nextIndex];

    this.tabBar.setActiveTab(nextTabId);
    const file = this.tabBar.tabs.get(nextTabId).file;
    this.handleTabSwitch(nextTabId, file);
  }

  /**
   * Switch to previous tab
   */
  switchToPreviousTab() {
    const tabs = Array.from(this.tabBar.tabs.keys());
    if (tabs.length <= 1) return;

    const currentIndex = tabs.indexOf(this.tabBar.getActiveTabId());
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    const prevTabId = tabs[prevIndex];

    this.tabBar.setActiveTab(prevTabId);
    const file = this.tabBar.tabs.get(prevTabId).file;
    this.handleTabSwitch(prevTabId, file);
  }

  /**
   * Initialize panel resizer
   */
  initResizer() {
    const resizer = document.getElementById('resizer');
    const editorPanel = document.getElementById('editor-panel');
    const outputPanel = document.getElementById('output-panel');

    if (!resizer || !editorPanel || !outputPanel) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const containerWidth = editorPanel.parentElement.offsetWidth;
      const outputWidth = containerWidth - e.clientX;

      // Enforce min/max widths
      if (outputWidth >= 300 && outputWidth <= 800) {
        outputPanel.style.width = `${outputWidth}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
  }

  /**
   * Handle Run Code button/shortcut
   */
  async handleRunCode() {
    if (this.isExecuting) {
      console.log('Code is already executing...');
      return;
    }

    try {
      this.isExecuting = true;

      // Get code from editor
      const code = this.editor.getValue();

      if (!code.trim()) {
        this.outputPanel.addLine('No code to execute', 'info');
        return;
      }

      // Clear previous output
      this.outputPanel.clear();

      // Update status
      this.setStatus('Executing...');

      // Add separator
      this.outputPanel.addLine('='.repeat(50), 'info');
      this.outputPanel.addLine(`Executing ${this.currentLanguage}...`, 'info');
      this.outputPanel.addLine('='.repeat(50), 'info');

      // Execute code
      const result = await this.runtimeManager.executeCode(code);

      // Display results
      if (result.success) {
        this.outputPanel.addLine('', 'stdout');
        this.outputPanel.addLine('✓ Execution completed successfully', 'success');
      } else {
        this.outputPanel.addLine('', 'stdout');
        this.outputPanel.addError(`✗ Execution failed:\n${result.error?.message || 'Unknown error'}`);
      }

      // Display metadata
      const memoryUsage = performance.memory
        ? performance.memory.usedJSHeapSize / 1024 / 1024
        : undefined;

      this.outputPanel.addMetadata({
        executionTime: result.executionTime,
        memoryUsage,
      });

      // Update status
      this.setStatus('Ready');
    } catch (error) {
      console.error('Execution error:', error);
      this.outputPanel.addError(`Error: ${error.message}`);
      this.setStatus('Error');
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Handle Clear Output button
   */
  handleClearOutput() {
    this.outputPanel.clear();
    this.outputPanel.showWelcome();
    this.setStatus('Ready');
  }

  /**
   * Handle Save button
   */
  async handleSave() {
    try {
      const code = this.editor.getValue();

      // Prompt for file name if this is a new file OR if it's still "Untitled"
      let fileName = this.currentFile?.name;
      const isUntitled = !fileName || fileName === 'Untitled' || fileName.startsWith('Untitled.');

      if (isUntitled) {
        fileName = await this.toast.prompt('Enter file name:', {
          defaultValue: `my_file.${this.getFileExtension(this.currentLanguage)}`,
          placeholder: 'e.g., my_script.py',
        });

        if (!fileName) {
          return; // User cancelled
        }
      }

      // Save file
      const fileId = await this.fileManager.saveFile({
        id: this.currentFile?.id,
        name: fileName,
        content: code,
        language: this.currentLanguage,
        created: this.currentFile?.created,
      });

      // Update current file reference
      this.currentFile = {
        id: fileId,
        name: fileName,
        language: this.currentLanguage,
      };

      // Clear unsaved indicator
      this.hasUnsavedChanges = false;
      const activeTabId = this.tabBar.getActiveTabId();
      if (activeTabId) {
        this.tabBar.updateTab(activeTabId, {
          name: fileName,
          unsaved: false,
        });
      }

      this.setStatus(`Saved: ${fileName}`);
      setTimeout(() => this.setStatus('Ready'), 2000);

      // Refresh file explorer
      if (this.fileExplorer) {
        await this.fileExplorer.refresh();
      }

      console.log(`File saved: ${fileName} (ID: ${fileId})`);
    } catch (error) {
      console.error('Failed to save file:', error);
      this.showError(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Handle Download button - download current file
   */
  handleDownload() {
    try {
      const code = this.editor.getValue();
      const fileName = this.currentFile?.name || `untitled.${this.getFileExtension(this.currentLanguage)}`;

      // Create a Blob from the code
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      this.toast.success(`Downloaded "${fileName}"`);
      console.log(`File downloaded: ${fileName}`);
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(`Failed to download: ${error.message}`);
    }
  }

  /**
   * Handle preview toggle
   */
  handlePreviewToggle() {
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');
    const previewToggleBtn = document.getElementById('preview-toggle');

    if (!editorContainer || !previewContainer || !previewToggleBtn) return;

    if (this.isPreviewMode) {
      // Switch to editor mode
      editorContainer.style.display = 'block';
      previewContainer.style.display = 'none';
      this.isPreviewMode = false;
      previewToggleBtn.classList.remove('active');
      previewToggleBtn.innerHTML = '<span class="btn-icon">👁️</span> Preview';
    } else {
      // Switch to preview mode
      const content = this.editor.getValue();
      const fileName = this.currentFile?.name || '';
      const previewMode = PreviewPanel.getPreviewMode(fileName);

      if (previewMode === 'markdown') {
        this.previewPanel.showMarkdown(content);
      } else if (previewMode === 'html') {
        this.previewPanel.showHTML(content);
      }

      editorContainer.style.display = 'none';
      previewContainer.style.display = 'block';
      this.isPreviewMode = true;
      previewToggleBtn.classList.add('active');
      previewToggleBtn.innerHTML = '<span class="btn-icon">✏️</span> Edit';
    }
  }

  /**
   * Update preview button visibility based on current file
   */
  updatePreviewVisibility() {
    const previewToggleBtn = document.getElementById('preview-toggle');
    if (!previewToggleBtn) return;

    // Check both file extension and current language
    const fileName = this.currentFile?.name || '';
    const canPreviewByFile = PreviewPanel.canPreview(fileName);
    const canPreviewByLanguage = ['markdown', 'html'].includes(this.currentLanguage);

    const canPreview = canPreviewByFile || canPreviewByLanguage;

    if (canPreview) {
      previewToggleBtn.style.display = 'inline-flex';
    } else {
      previewToggleBtn.style.display = 'none';
      // If preview button is hidden, make sure we're in editor mode
      if (this.isPreviewMode) {
        this.handlePreviewToggle(); // Switch back to editor
      }
    }
  }

  /**
   * Update validator button visibility based on current language
   */
  updateValidatorVisibility() {
    const validateBtn = document.getElementById('validate-btn');
    if (!validateBtn) return;

    // Show validator for data/markup languages
    const validatorLanguages = ['json', 'yaml', 'html', 'xml', 'css'];
    const canValidate = validatorLanguages.includes(this.currentLanguage);

    if (canValidate) {
      validateBtn.style.display = 'inline-flex';
    } else {
      validateBtn.style.display = 'none';
    }
  }

  /**
   * Handle validate button click - validates syntax without executing
   */
  async handleValidate() {
    if (this.isExecuting) {
      this.toast.show('Already executing...', 'warning');
      return;
    }

    try {
      this.isExecuting = true;
      const code = this.editor.getValue();

      this.outputPanel.clear();
      this.outputPanel.addLine('==================================================', 'info');
      this.outputPanel.addLine(`Validating ${this.currentLanguage.toUpperCase()}...`, 'info');
      this.outputPanel.addLine('==================================================', 'info');

      // Execute the runtime (which does validation for these languages)
      const startTime = performance.now();
      const result = await this.runtimeManager.execute(code);
      const endTime = performance.now();

      // Display results
      if (result.success) {
        this.outputPanel.addLine(result.output, 'success');
        this.toast.success(`✓ Valid ${this.currentLanguage.toUpperCase()}!`);
      } else {
        this.outputPanel.addLine(result.output, 'error');
        this.toast.error(`✗ Invalid ${this.currentLanguage.toUpperCase()}`);
      }

      // Show execution time
      const executionTime = (endTime - startTime).toFixed(2);
      this.updateExecutionStats(executionTime);

      this.isExecuting = false;
    } catch (error) {
      console.error('Validation error:', error);
      this.outputPanel.addLine(`Validation Error: ${error.message}`, 'error');
      this.toast.error(`Validation failed: ${error.message}`);
      this.isExecuting = false;
    }
  }

  /**
   * Handle opening file from File Explorer
   */
  handleFileOpen(file) {
    // Check if file is already open in a tab
    for (const [tabId, fileData] of this.openFiles.entries()) {
      const tab = this.tabBar.tabs.get(tabId);
      if (tab && tab.file && tab.file.name === file.name && tab.file.id === file.id) {
        // File already open, just switch to its tab
        this.tabBar.setActiveTab(tabId);
        return;
      }
    }

    // Create new tab for the file - pass complete file object
    this.tabBar.addTab({
      id: file.id,
      name: file.name,
      language: file.language,
      unsaved: false,
      content: file.content, // Include content in file object
    });

    // Store file data in openFiles
    this.openFiles.set(file.id, {
      content: file.content,
      language: file.language,
    });

    // Update editor
    this.editor.setValue(file.content);
    this.editor.setLanguage(file.language);
    this.currentLanguage = file.language;

    // Update current file reference
    this.currentFile = file;

    this.hasUnsavedChanges = false;
    this.setStatus(`Opened ${file.name}`);

    // Update preview button visibility
    this.updatePreviewVisibility();
  }

  /**
   * Handle file deleted from File Explorer
   */
  handleFileDeleted(fileId) {
    // Close tab if file was open
    for (const [tabId, fileData] of this.openFiles.entries()) {
      const tab = this.tabBar.tabs.get(tabId);
      if (tab && tab.file.id === fileId) {
        this.tabBar.closeTab(tabId);
        break;
      }
    }
  }

  /**
   * Handle file renamed from File Explorer
   */
  handleFileRenamed(fileId, newName) {
    // Update tab name if file is open
    for (const [tabId, fileData] of this.openFiles.entries()) {
      const tab = this.tabBar.tabs.get(tabId);
      if (tab && tab.file.id === fileId) {
        this.tabBar.updateTab(tabId, { name: newName });

        // Update current file if it's the active one
        if (this.currentFile && this.currentFile.id === fileId) {
          this.currentFile.name = newName;
        }
        break;
      }
    }
  }

  /**
   * Handle file run from File Explorer
   */
  async handleFileRun(file) {
    // First, open the file in a tab if not already open
    await this.handleFileOpen(file);

    // Then run the code
    await this.handleRunCode();
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
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      lua: 'lua',
      sqlite: 'sql',
      ruby: 'rb',
      php: 'php',
      r: 'r',
      perl: 'pl',
    };

    return extensions[language] || 'txt';
  }

  /**
   * Handle Settings button
   */
  handleSettings() {
    if (this.settingsPanel) {
      this.settingsPanel.show();
      this.setStatus('Settings panel opened');
    }
  }

  /**
   * Apply settings from settings panel
   */
  applySettings(settings) {
    console.log('Applying settings:', settings);

    // Apply editor settings
    if (settings.editor && this.editor) {
      this.editor.updateOptions({
        fontSize: settings.editor.fontSize,
        fontFamily: settings.editor.fontFamily,
        tabSize: settings.editor.tabSize,
        lineNumbers: settings.editor.lineNumbers ? 'on' : 'off',
        minimap: { enabled: settings.editor.minimap },
        wordWrap: settings.editor.wordWrap,
        cursorStyle: settings.editor.cursorStyle,
        renderWhitespace: settings.editor.renderWhitespace,
      });
    }

    // Apply theme setting
    if (settings.ui && settings.ui.theme) {
      if (settings.ui.theme !== this.currentTheme) {
        this.toggleTheme(false); // Force toggle to the desired theme
      }
    }

    // Apply auto-save interval
    if (settings.ui && settings.ui.autoSaveInterval) {
      this.autoSaveDelay = settings.ui.autoSaveInterval;
    }

    // Apply file settings
    if (settings.files && settings.files.defaultLanguage) {
      // Could set as default for new files
    }

    this.toast.show('Settings saved successfully', 'success');
    this.setStatus('Settings applied');
    setTimeout(() => this.setStatus('Ready'), 2000);
  }

  /**
   * Handle language change
   */
  async handleLanguageChange(language) {
    if (language === this.currentLanguage) return;

    try {
      this.showLoading(`Loading ${language} runtime...`);

      // Switch runtime
      await this.runtimeManager.switchLanguage(language);

      // Update editor language
      this.editor.setLanguage(language);

      // Update current language
      this.currentLanguage = language;

      // Update current file language
      if (this.currentFile) {
        this.currentFile.language = language;
      }

      // Load default code for new language if current file is untitled
      if (this.currentFile && this.currentFile.name === 'Untitled') {
        const defaultCode = this.editor.getDefaultCode(language);
        this.editor.setValue(defaultCode);

        // Update the file content in openFiles map
        const activeTabId = this.tabBar.getActiveTabId();
        if (activeTabId) {
          const fileData = this.openFiles.get(activeTabId);
          if (fileData) {
            fileData.content = defaultCode;
            fileData.language = language;
          }
        }

        // Mark as not having unsaved changes since we just loaded default code
        this.hasUnsavedChanges = false;
        if (activeTabId) {
          this.tabBar.updateTab(activeTabId, { unsaved: false });
        }
      }

      // Update tab language
      const activeTabId = this.tabBar.getActiveTabId();
      if (activeTabId) {
        this.tabBar.updateTab(activeTabId, { language: language });
      }

      // Update status
      this.setStatus(`Switched to ${language}`);

      // Update preview/validator button visibility based on new language
      this.updatePreviewVisibility();
      this.updateValidatorVisibility();

      this.hideLoading();
    } catch (error) {
      console.error('Failed to switch language:', error);
      this.showError(`Failed to load ${language}: ${error.message}`);
      this.hideLoading();
    }
  }

  /**
   * Handle new tab creation
   */
  handleNewTab() {
    const tabId = `new-${Date.now()}`;
    const fileName = 'Untitled';

    // Add tab
    this.tabBar.addTab({
      id: tabId,
      name: fileName,
      language: this.currentLanguage,
      unsaved: false,
    });

    // Create file data
    const fileData = {
      content: this.editor.getDefaultCode(this.currentLanguage),
      language: this.currentLanguage,
    };

    this.openFiles.set(tabId, fileData);

    // Switch to new tab (already happens in addTab)
    this.currentFile = {
      id: tabId,
      name: fileName,
      language: this.currentLanguage,
    };

    // Reset editor
    this.editor.setValue(fileData.content);
    this.editor.setLanguage(this.currentLanguage);
    this.hasUnsavedChanges = false;

    // Update preview/validator button visibility
    this.updatePreviewVisibility();
    this.updateValidatorVisibility();
  }

  /**
   * Handle tab switch
   *
   * @param {string|number} tabId - Tab ID
   * @param {object} file - File object
   */
  handleTabSwitch(tabId, file) {
    // Save current file content before switching
    const currentTabId = this.tabBar.getActiveTabId();
    if (currentTabId && currentTabId !== tabId) {
      const currentContent = this.editor.getValue();
      const currentFileData = this.openFiles.get(currentTabId);
      if (currentFileData) {
        currentFileData.content = currentContent;
      }
    }

    // Load new file content
    const fileData = this.openFiles.get(tabId);
    if (fileData) {
      this.editor.setValue(fileData.content);
      this.editor.setLanguage(fileData.language);
      this.currentLanguage = fileData.language;
      this.currentFile = {
        id: tabId,
        name: file.name,
        language: fileData.language,
      };
    }

    this.hasUnsavedChanges = file.unsaved || false;

    // Update preview/validator button visibility
    this.updatePreviewVisibility();
    this.updateValidatorVisibility();
  }

  /**
   * Handle tab close
   *
   * @param {string|number} tabId - Tab ID
   * @param {object} file - File object
   * @returns {boolean|Promise<boolean>} True to allow close, false to cancel
   */
  async handleTabClose(tabId, file) {
    // Check for unsaved changes
    if (file.unsaved) {
      const confirmed = await this.toast.confirm(`'${file.name}' has unsaved changes. Close anyway?`, {
        confirmText: 'Close',
        cancelText: 'Cancel',
      });

      if (!confirmed) {
        return false; // Cancel close
      }
    }

    // Remove from open files
    this.openFiles.delete(tabId);

    return true; // Allow close
  }

  /**
   * Handle tab rename (double-click on tab name)
   */
  async handleTabRename(tabId, file) {
    try {
      // Prompt for new name
      const newName = await this.toast.prompt('Enter new file name:', {
        defaultValue: file.name || `my_file.${this.getFileExtension(this.currentLanguage)}`,
        placeholder: 'e.g., my_script.py',
      });

      if (!newName || newName === file.name) {
        return; // User cancelled or no change
      }

      // Update tab display
      this.tabBar.updateTab(tabId, { name: newName });

      // Update current file reference if this is the active tab
      if (tabId === this.tabBar.getActiveTabId()) {
        if (this.currentFile) {
          this.currentFile.name = newName;
        }
      }

      // Update file in memory
      const fileData = this.openFiles.get(tabId);
      if (fileData) {
        fileData.name = newName;
      }

      // If file is saved (has an ID), update it in IndexedDB
      if (file.id && typeof file.id === 'number') {
        await this.fileManager.saveFile({
          id: file.id,
          name: newName,
          content: fileData?.content || this.editor.getValue(),
          language: file.language || this.currentLanguage,
        });

        // Refresh file explorer
        if (this.fileExplorer) {
          await this.fileExplorer.refresh();
        }
      }

      this.toast.success(`Renamed to "${newName}"`);
    } catch (error) {
      console.error('Failed to rename tab:', error);
      this.toast.error(`Failed to rename: ${error.message}`);
    }
  }

  /**
   * Handle code change
   */
  handleCodeChange(code) {
    // Mark as unsaved
    if (!this.hasUnsavedChanges) {
      this.hasUnsavedChanges = true;

      // Update tab to show unsaved indicator
      const activeTabId = this.tabBar.getActiveTabId();
      if (activeTabId) {
        this.tabBar.updateTab(activeTabId, { unsaved: true });
      }
    }

    // Update file content in memory
    const activeTabId = this.tabBar.getActiveTabId();
    if (activeTabId) {
      const fileData = this.openFiles.get(activeTabId);
      if (fileData) {
        fileData.content = code;
      }
    }

    // Trigger auto-save (debounced)
    this.scheduleAutoSave();
  }

  /**
   * Schedule auto-save with debouncing
   */
  scheduleAutoSave() {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Only auto-save if file has been named (not "Untitled")
    if (!this.currentFile || this.currentFile.name === 'Untitled') {
      return;
    }

    // Schedule new auto-save
    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.autoSaveDelay);
  }

  /**
   * Perform auto-save
   */
  async performAutoSave() {
    if (this.isAutoSaving || !this.hasUnsavedChanges) {
      return;
    }

    try {
      this.isAutoSaving = true;

      const code = this.editor.getValue();

      // Save file silently
      const fileId = await this.fileManager.saveFile({
        id: this.currentFile?.id,
        name: this.currentFile?.name,
        content: code,
        language: this.currentLanguage,
        created: this.currentFile?.created,
      });

      // Update current file reference
      if (fileId) {
        this.currentFile.id = fileId;
      }

      // Clear unsaved indicator
      this.hasUnsavedChanges = false;
      const activeTabId = this.tabBar.getActiveTabId();
      if (activeTabId) {
        this.tabBar.updateTab(activeTabId, { unsaved: false });
      }

      // Show brief auto-save indicator
      this.setStatus('Auto-saved');
      setTimeout(() => this.setStatus('Ready'), 1000);

      console.log(`Auto-saved: ${this.currentFile.name}`);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error to user for auto-save failures
    } finally {
      this.isAutoSaving = false;
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');

    if (overlay) {
      overlay.classList.remove('hidden');
      if (text) {
        text.textContent = message;
      }
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Show error modal
   */
  showError(message) {
    const modal = document.getElementById('error-modal');
    const messageElement = document.getElementById('error-message');
    const closeBtn = document.getElementById('error-close-btn');

    if (modal && messageElement) {
      messageElement.textContent = message;
      modal.classList.remove('hidden');

      if (closeBtn) {
        closeBtn.onclick = () => modal.classList.add('hidden');
      }
    }
  }

  /**
   * Set status bar text
   */
  setStatus(text) {
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  /**
   * Create Git clone button in toolbar
   */
  createGitCloneButton() {
    const toolbar = document.querySelector('.toolbar-right');
    if (!toolbar) {
      console.warn('Toolbar not found, cannot add Git clone button');
      return;
    }

    // Create Git clone button
    const gitBtn = document.createElement('button');
    gitBtn.id = 'git-clone-btn';
    gitBtn.className = 'toolbar-btn';
    gitBtn.title = 'Clone Git Repository (Ctrl+G)';
    gitBtn.innerHTML = `
      <span class="btn-icon">🔀</span>
      <span class="btn-text">Git Clone</span>
    `;

    gitBtn.addEventListener('click', () => {
      this.gitCloneDialog.open();
    });

    // Add keyboard shortcut (Ctrl+G)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        this.gitCloneDialog.open();
      }
    });

    // Insert before settings button or at the end
    const settingsBtn = toolbar.querySelector('#settings-btn');
    if (settingsBtn) {
      toolbar.insertBefore(gitBtn, settingsBtn);
    } else {
      toolbar.appendChild(gitBtn);
    }
  }

  /**
   * Dispose application
   */
  async dispose() {
    if (this.editor) {
      this.editor.dispose();
    }

    if (this.runtimeManager) {
      await this.runtimeManager.dispose();
    }

    if (this.languageSelector) {
      this.languageSelector.dispose();
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new DrLeeIDE();
  await app.init();

  // Make app globally available for debugging
  window.drLeeIDE = app;
});

// Handle page unload
window.addEventListener('beforeunload', async () => {
  if (window.drLeeIDE) {
    await window.drLeeIDE.dispose();
  }
});
