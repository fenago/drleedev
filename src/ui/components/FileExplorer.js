/**
 * FileExplorer - File browser sidebar component
 *
 * Features:
 * - Lists all saved files from IndexedDB
 * - Click to open file in tab
 * - Right-click context menu (rename, delete)
 * - File type icons
 * - Search/filter files
 * - Refresh file list
 */
export default class FileExplorer {
  /**
   * @param {HTMLElement} container - DOM container for the file explorer
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.fileManager = options.fileManager;
    this.toast = options.toast; // Toast notification system
    this.onFileOpen = options.onFileOpen || (() => {});
    this.onFileDelete = options.onFileDelete || (() => {});
    this.onFileRename = options.onFileRename || (() => {});
    this.onFileRun = options.onFileRun || (() => {});

    this.files = [];
    this.filteredFiles = [];
    this.searchQuery = '';
    this.contextMenu = null;
    this.expandedFolders = new Set(); // Track expanded folders
  }

  /**
   * Initialize file explorer
   */
  async init() {
    this.render();
    await this.loadFiles();
  }

  /**
   * Render file explorer UI
   */
  render() {
    this.container.innerHTML = `
      <div class="file-explorer">
        <div class="file-explorer-header">
          <h3 class="file-explorer-title">Files</h3>
          <div class="file-explorer-actions">
            <button class="btn-icon" id="download-all-files" title="Download all files as ZIP">📦</button>
            <button class="btn-icon" id="clear-all-files" title="Delete all files">🗑️</button>
            <button class="btn-icon" id="upload-file" title="Upload file">📤</button>
            <button class="btn-icon" id="refresh-files" title="Refresh">🔄</button>
            <button class="btn-icon" id="toggle-explorer" title="Collapse">◀</button>
          </div>
        </div>

        <div class="file-explorer-search">
          <input
            type="text"
            id="file-search"
            placeholder="Search files..."
            class="file-search-input"
          />
        </div>

        <div class="file-list" id="file-list">
          <div class="file-list-empty">
            <div class="empty-icon">📁</div>
            <div class="empty-text">No files yet</div>
            <div class="empty-hint">Create a file and save it to see it here</div>
          </div>
        </div>

        <!-- Hidden file input for uploads -->
        <input
          type="file"
          id="file-upload-input"
          style="display: none;"
          accept=".js,.ts,.py,.lua,.sql,.rb,.php,.r,.pl,.txt,.json,.html,.css,.md"
          multiple
        />
      </div>

      <!-- Context Menu -->
      <div class="context-menu hidden" id="file-context-menu">
        <div class="context-menu-item" data-action="open">
          <span class="context-menu-icon">📂</span>
          <span>Open</span>
        </div>
        <div class="context-menu-item" data-action="run">
          <span class="context-menu-icon">▶️</span>
          <span>Run</span>
        </div>
        <div class="context-menu-item" data-action="download">
          <span class="context-menu-icon">⬇️</span>
          <span>Download</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="rename">
          <span class="context-menu-icon">✏️</span>
          <span>Rename</span>
        </div>
        <div class="context-menu-item danger" data-action="delete">
          <span class="context-menu-icon">🗑️</span>
          <span>Delete</span>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Drag-and-drop file upload
    const fileList = document.getElementById('file-list');
    if (fileList) {
      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileList.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      // Highlight drop area when file is dragged over
      ['dragenter', 'dragover'].forEach(eventName => {
        fileList.addEventListener(eventName, () => {
          fileList.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        fileList.addEventListener(eventName, () => {
          fileList.classList.remove('drag-over');
        }, false);
      });

      // Handle dropped files
      fileList.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleDroppedFiles(files);
        }
      }, false);
    }

    // Search input
    const searchInput = document.getElementById('file-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterFiles();
      });
    }

    // Upload button
    const uploadBtn = document.getElementById('upload-file');
    const fileInput = document.getElementById('file-upload-input');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Download all files button
    const downloadAllBtn = document.getElementById('download-all-files');
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
    }

    // Clear all files button
    const clearAllBtn = document.getElementById('clear-all-files');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllFiles());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-files');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadFiles());
    }

    // Toggle explorer button
    const toggleBtn = document.getElementById('toggle-explorer');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
    }

    // Context menu
    this.contextMenu = document.getElementById('file-context-menu');
    if (this.contextMenu) {
      this.contextMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.context-menu-item');
        if (item) {
          const action = item.getAttribute('data-action');
          const fileId = this.contextMenu.getAttribute('data-file-id');
          this.handleContextMenuAction(action, fileId);
        }
      });
    }

    // Click outside to close context menu
    document.addEventListener('click', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });
  }

  /**
   * Load files from IndexedDB
   */
  async loadFiles() {
    try {
      this.files = await this.fileManager.getAllFiles({
        sortBy: 'modified',
        order: 'desc',
      });

      this.filteredFiles = this.files;
      this.renderFileList();
    } catch (error) {
      console.error('Failed to load files:', error);
      this.showError('Failed to load files');
    }
  }

  /**
   * Filter files based on search query
   */
  filterFiles() {
    if (!this.searchQuery) {
      this.filteredFiles = this.files;
    } else {
      this.filteredFiles = this.files.filter(file =>
        file.name.toLowerCase().includes(this.searchQuery)
      );
    }

    this.renderFileList();
  }

  /**
   * Build file tree structure from flat file list
   */
  buildFileTree(files) {
    const tree = {
      name: 'root',
      type: 'folder',
      children: {},
    };

    for (const file of files) {
      const parts = file.name.split('/');
      let current = tree;

      // Navigate/create folder structure
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        if (!current.children[folderName]) {
          current.children[folderName] = {
            name: folderName,
            type: 'folder',
            children: {},
          };
        }
        current = current.children[folderName];
      }

      // Add file at final location
      const fileName = parts[parts.length - 1];
      current.children[fileName] = {
        name: fileName,
        type: 'file',
        file: file,
      };
    }

    return tree;
  }

  /**
   * Render file tree recursively
   */
  renderTree(node, path = '', depth = 0) {
    let html = '';
    const entries = Object.entries(node.children).sort((a, b) => {
      // Folders first, then files
      const [aName, aNode] = a;
      const [bName, bNode] = b;

      if (aNode.type !== bNode.type) {
        return aNode.type === 'folder' ? -1 : 1;
      }
      return aName.localeCompare(bName);
    });

    for (const [name, childNode] of entries) {
      const fullPath = path ? `${path}/${name}` : name;
      const indent = depth * 16; // 16px per level

      if (childNode.type === 'folder') {
        const isExpanded = this.expandedFolders.has(fullPath);
        const folderIcon = isExpanded ? '📂' : '📁';
        const arrowIcon = isExpanded ? '▼' : '▶';

        html += `
          <div class="file-tree-folder" style="padding-left: ${indent}px;" data-folder-path="${fullPath}">
            <span class="folder-arrow">${arrowIcon}</span>
            <span class="folder-icon">${folderIcon}</span>
            <span class="folder-name">${this.escapeHtml(name)}</span>
          </div>
        `;

        if (isExpanded) {
          html += this.renderTree(childNode, fullPath, depth + 1);
        }
      } else {
        const icon = this.getFileIcon(childNode.file.language);
        const modified = this.formatDate(childNode.file.modified);

        html += `
          <div
            class="file-tree-item"
            style="padding-left: ${indent + 16}px;"
            data-file-id="${childNode.file.id}"
            title="${fullPath}"
          >
            <div class="file-icon">${icon}</div>
            <div class="file-info">
              <div class="file-name">${this.escapeHtml(name)}</div>
              <div class="file-meta">
                <span class="file-language">${this.formatLanguage(childNode.file.language)}</span>
                <span class="file-date">${modified}</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    return html;
  }

  /**
   * Render file list
   */
  renderFileList() {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;

    if (this.filteredFiles.length === 0) {
      if (this.searchQuery) {
        fileList.innerHTML = `
          <div class="file-list-empty">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">No files found</div>
            <div class="empty-hint">Try a different search query</div>
          </div>
        `;
      } else {
        fileList.innerHTML = `
          <div class="file-list-empty">
            <div class="empty-icon">📁</div>
            <div class="empty-text">No files yet</div>
            <div class="empty-hint">Create a file and save it to see it here</div>
          </div>
        `;
      }
      return;
    }

    // Build and render tree
    const tree = this.buildFileTree(this.filteredFiles);
    const html = this.renderTree(tree);
    fileList.innerHTML = html;

    // Attach folder event listeners
    fileList.querySelectorAll('.file-tree-folder').forEach(folder => {
      folder.addEventListener('click', (e) => {
        const folderPath = folder.getAttribute('data-folder-path');
        this.toggleFolder(folderPath);
      });
    });

    // Attach file item event listeners
    fileList.querySelectorAll('.file-tree-item').forEach(item => {
      const fileId = parseInt(item.getAttribute('data-file-id'));

      // Click to open
      item.addEventListener('click', () => {
        this.openFile(fileId);
      });

      // Right-click for context menu
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY, fileId);
      });
    });
  }

  /**
   * Toggle folder expand/collapse
   */
  toggleFolder(path) {
    if (this.expandedFolders.has(path)) {
      this.expandedFolders.delete(path);
    } else {
      this.expandedFolders.add(path);
    }
    this.renderFileList();
  }

  /**
   * Open file in editor
   */
  async openFile(fileId) {
    try {
      const file = await this.fileManager.loadFile(fileId);
      if (file) {
        this.onFileOpen(file);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showError('Failed to open file');
    }
  }

  /**
   * Show context menu
   */
  showContextMenu(x, y, fileId) {
    if (!this.contextMenu) return;

    this.contextMenu.setAttribute('data-file-id', fileId);
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.remove('hidden');
  }

  /**
   * Hide context menu
   */
  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.classList.add('hidden');
    }
  }

  /**
   * Handle context menu action
   */
  async handleContextMenuAction(action, fileId) {
    this.hideContextMenu();

    const id = parseInt(fileId);

    switch (action) {
      case 'open':
        await this.openFile(id);
        break;

      case 'run':
        await this.runFile(id);
        break;

      case 'download':
        await this.downloadFile(id);
        break;

      case 'rename':
        await this.renameFile(id);
        break;

      case 'delete':
        await this.deleteFile(id);
        break;
    }
  }

  /**
   * Rename file
   */
  async renameFile(fileId) {
    try {
      const file = await this.fileManager.loadFile(fileId);
      if (!file) {
        console.error('File not found:', fileId);
        return;
      }

      // Use toast prompt if available, otherwise fall back to browser prompt
      let newName;
      if (this.toast && this.toast.prompt) {
        newName = await this.toast.prompt('Enter new file name:', {
          defaultValue: file.name,
          placeholder: 'File name',
        });
      } else {
        newName = prompt('Enter new file name:', file.name);
      }

      if (!newName || newName === file.name) {
        console.log('Rename cancelled or no change');
        return;
      }

      // Update file name
      file.name = newName;
      await this.fileManager.saveFile(file);

      // Notify parent component
      this.onFileRename(fileId, newName);

      // Reload file list
      await this.loadFiles();

      // Show success message
      if (this.toast && this.toast.success) {
        this.toast.success(`Renamed to "${newName}"`);
      }

      console.log('File renamed successfully:', newName);
    } catch (error) {
      console.error('Failed to rename file:', error);
      this.showError('Failed to rename file: ' + error.message);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId) {
    try {
      const file = await this.fileManager.loadFile(fileId);
      if (!file) return;

      const confirmed = await this.toast.confirm(`Delete "${file.name}"? This action cannot be undone.`, {
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });

      if (!confirmed) return;

      await this.fileManager.deleteFile(fileId);

      this.onFileDelete(fileId);
      await this.loadFiles();

      this.toast.success(`Deleted "${file.name}"`);
    } catch (error) {
      console.error('Failed to delete file:', error);
      this.showError('Failed to delete file');
    }
  }

  /**
   * Run file
   */
  async runFile(fileId) {
    try {
      const file = await this.fileManager.loadFile(fileId);
      if (file) {
        this.onFileRun(file);
      }
    } catch (error) {
      console.error('Failed to run file:', error);
      this.showError('Failed to run file');
    }
  }

  /**
   * Download file to user's computer
   */
  async downloadFile(fileId) {
    try {
      const file = await this.fileManager.loadFile(fileId);
      if (!file) return;

      // Ensure file has proper extension
      let fileName = file.name;
      if (!fileName.includes('.')) {
        // Add extension based on language
        const ext = this.getFileExtension(file.language);
        fileName = `${fileName}${ext}`;
      }

      // Create a Blob from the file content
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });

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
    } catch (error) {
      console.error('Failed to download file:', error);
      this.showError('Failed to download file');
    }
  }

  /**
   * Get file extension based on language
   */
  getFileExtension(language) {
    const extensions = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      lua: '.lua',
      sqlite: '.sql',
      postgresql: '.sql',
      duckdb: '.sql',
      ruby: '.rb',
      php: '.php',
      r: '.r',
      perl: '.pl',
      scheme: '.scm',
      commonlisp: '.lisp',
      clojure: '.clj',
      prolog: '.pl',
      basic: '.bas',
      markdown: '.md',
      html: '.html',
      css: '.css',
      json: '.json',
      xml: '.xml',
    };

    return extensions[language] || '.txt';
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of files) {
        // Read file content
        const content = await this.readFileContent(file);

        // Detect language from file extension
        const language = this.detectLanguage(file.name);

        // Save file to IndexedDB
        await this.fileManager.saveFile({
          name: file.name,
          content,
          language,
        });
      }

      // Refresh file list
      await this.loadFiles();

      // Reset file input
      event.target.value = '';

      this.toast.success(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('Failed to upload files:', error);
      this.showError('Failed to upload files');
    }
  }

  /**
   * Handle dropped files (drag-and-drop)
   */
  async handleDroppedFiles(files) {
    if (!files || files.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          // Read file content
          const content = await this.readFileContent(file);

          // Detect language from file extension
          const language = this.detectLanguage(file.name);

          // Save file to IndexedDB
          await this.fileManager.saveFile({
            name: file.name,
            content,
            language,
          });

          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          errorCount++;
        }
      }

      // Refresh file list
      await this.loadFiles();

      // Show result
      if (successCount > 0) {
        this.toast.success(`Successfully uploaded ${successCount} file(s)`);
      }
      if (errorCount > 0) {
        this.toast.error(`Failed to upload ${errorCount} file(s)`);
      }
    } catch (error) {
      console.error('Failed to handle dropped files:', error);
      this.showError('Failed to upload files');
    }
  }

  /**
   * Read file content as text
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Detect language from file extension
   */
  detectLanguage(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    const languageMap = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      lua: 'lua',
      sql: 'sqlite',
      rb: 'ruby',
      php: 'php',
      r: 'r',
      pl: 'perl',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      txt: 'javascript',
      json: 'javascript',
      html: 'javascript',
      css: 'javascript',
      md: 'javascript',
    };

    return languageMap[ext] || 'javascript';
  }

  /**
   * Toggle explorer collapse
   */
  toggleCollapse() {
    const explorer = this.container.querySelector('.file-explorer');
    const toggleBtn = document.getElementById('toggle-explorer');

    if (explorer) {
      explorer.classList.toggle('collapsed');

      if (toggleBtn) {
        toggleBtn.textContent = explorer.classList.contains('collapsed') ? '▶' : '◀';
      }
    }
  }

  /**
   * Get file icon based on language
   */
  getFileIcon(language) {
    const icons = {
      javascript: '📜',
      typescript: '📘',
      python: '🐍',
      lua: '🌙',
      sqlite: '💾',
      ruby: '💎',
      php: '🐘',
      r: '📊',
      perl: '🐪',
    };

    return icons[language] || '📄';
  }

  /**
   * Format language name
   */
  formatLanguage(language) {
    const names = {
      javascript: 'JS',
      typescript: 'TS',
      python: 'PY',
      lua: 'Lua',
      sqlite: 'SQL',
      ruby: 'RB',
      php: 'PHP',
      r: 'R',
      perl: 'PL',
    };

    return names[language] || language.toUpperCase().substring(0, 3);
  }

  /**
   * Format date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
      return 'just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // Less than 1 week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }

    // Format as date
    return date.toLocaleDateString();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    if (this.toast) {
      this.toast.error(message);
    } else {
      alert(message); // Fallback if toast not available
    }
  }

  /**
   * Refresh file list
   */
  async refresh() {
    await this.loadFiles();
  }

  /**
   * Download all files as ZIP
   */
  async downloadAllFiles() {
    try {
      if (this.files.length === 0) {
        this.toast.show('No files to download', 'info');
        return;
      }

      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;

      // Create ZIP file
      const zip = new JSZip();

      // Add all files to ZIP
      for (const file of this.files) {
        // Ensure file has proper extension
        let fileName = file.name;
        if (!fileName.includes('.')) {
          const ext = this.getFileExtension(file.language);
          fileName = `${fileName}${ext}`;
        }

        zip.file(fileName, file.content);
      }

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drlee-files-${new Date().toISOString().split('T')[0]}.zip`;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      this.toast.success(`Downloaded ${this.files.length} files as ZIP`);
    } catch (error) {
      console.error('Failed to download all files:', error);
      this.showError(`Failed to download files: ${error.message}`);
    }
  }

  /**
   * Clear all files after confirmation
   */
  async clearAllFiles() {
    try {
      if (this.files.length === 0) {
        this.toast.show('No files to clear', 'info');
        return;
      }

      // Show confirmation dialog
      const confirmed = await this.toast.confirm(
        `Delete all ${this.files.length} files? This cannot be undone.`,
        {
          confirmText: 'Delete All',
          cancelText: 'Cancel',
        }
      );

      if (!confirmed) {
        return;
      }

      // Delete all files
      for (const file of this.files) {
        await this.fileManager.deleteFile(file.id);

        // Notify parent if file was deleted
        if (this.onFileDelete) {
          this.onFileDelete(file.id);
        }
      }

      // Refresh file list
      await this.loadFiles();

      this.toast.success(`Deleted ${this.files.length} files`);
    } catch (error) {
      console.error('Failed to clear all files:', error);
      this.showError(`Failed to clear files: ${error.message}`);
    }
  }

  /**
   * Dispose file explorer
   */
  dispose() {
    // Clean up event listeners if needed
  }
}
