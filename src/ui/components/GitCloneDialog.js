/**
 * GitCloneDialog.js
 *
 * UI component for Git clone operations
 *
 * Features:
 * - Input for GitHub repository URL
 * - Progress indicator during clone
 * - Options for branch and clone depth
 * - List of cloned repositories
 */

export default class GitCloneDialog {
  constructor(gitManager, fileExplorer) {
    this.gitManager = gitManager;
    this.fileExplorer = fileExplorer;

    this.dialog = null;
    this.isOpen = false;
  }

  /**
   * Initialize the Git clone dialog
   */
  init() {
    this.createDialog();
    this.attachEventListeners();
  }

  /**
   * Create the Git clone dialog element
   */
  createDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'git-clone-dialog';
    dialog.className = 'git-clone-dialog hidden';

    dialog.innerHTML = `
      <div class="git-clone-backdrop"></div>
      <div class="git-clone-content">
        <div class="git-clone-header">
          <h2>🔀 Clone Git Repository</h2>
          <button class="close-btn" title="Close (Esc)">×</button>
        </div>

        <div class="git-clone-body">
          <div class="git-clone-form">
            <div class="form-group">
              <label for="git-url-input">
                <strong>GitHub Repository URL</strong>
              </label>
              <input
                type="text"
                id="git-url-input"
                placeholder="https://github.com/username/repository"
                autocomplete="off"
              />
              <small>Enter a public GitHub repository URL</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="git-branch-input">Branch (optional)</label>
                <input
                  type="text"
                  id="git-branch-input"
                  placeholder="main"
                  autocomplete="off"
                />
              </div>

              <div class="form-group">
                <label for="git-depth-select">Clone Depth</label>
                <select id="git-depth-select">
                  <option value="1">Shallow (latest only)</option>
                  <option value="10">Last 10 commits</option>
                  <option value="0">Full history</option>
                </select>
              </div>
            </div>

            <div class="git-clone-actions">
              <button id="git-clone-btn" class="btn btn-primary">
                <span class="btn-icon">📥</span>
                Clone Repository
              </button>
              <button id="git-cancel-btn" class="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>

          <div class="git-clone-progress hidden">
            <div class="progress-info">
              <div class="progress-phase">Initializing...</div>
              <div class="progress-stats">0 / 0</div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>

          <div class="git-clone-result hidden">
            <div class="result-icon">✅</div>
            <div class="result-message"></div>
            <div class="result-details"></div>
          </div>

          <div class="git-repositories">
            <h3>Cloned Repositories</h3>
            <div id="git-repo-list" class="repo-list">
              <div class="empty-state">No repositories cloned yet</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.dialog = dialog;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.dialog.querySelector('.close-btn').addEventListener('click', () => {
      this.close();
    });

    // Backdrop click
    this.dialog.querySelector('.git-clone-backdrop').addEventListener('click', () => {
      this.close();
    });

    // Cancel button
    this.dialog.querySelector('#git-cancel-btn').addEventListener('click', () => {
      this.close();
    });

    // Clone button
    this.dialog.querySelector('#git-clone-btn').addEventListener('click', () => {
      this.handleClone();
    });

    // Enter key in URL input
    this.dialog.querySelector('#git-url-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleClone();
      }
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }

  /**
   * Open the dialog
   */
  open() {
    this.dialog.classList.remove('hidden');
    this.isOpen = true;

    // Focus URL input
    setTimeout(() => {
      this.dialog.querySelector('#git-url-input').focus();
    }, 100);

    // Update repository list
    this.updateRepositoryList();
  }

  /**
   * Close the dialog
   */
  close() {
    this.dialog.classList.add('hidden');
    this.isOpen = false;

    // Reset form
    this.resetForm();
  }

  /**
   * Handle clone button click
   */
  async handleClone() {
    const urlInput = this.dialog.querySelector('#git-url-input');
    const branchInput = this.dialog.querySelector('#git-branch-input');
    const depthSelect = this.dialog.querySelector('#git-depth-select');

    const url = urlInput.value.trim();
    const branch = branchInput.value.trim() || 'main';
    const depth = parseInt(depthSelect.value);

    if (!url) {
      alert('Please enter a repository URL');
      urlInput.focus();
      return;
    }

    // Validate URL format
    if (!this.isValidGitHubUrl(url)) {
      alert('Please enter a valid GitHub repository URL\n\nExample: https://github.com/username/repository');
      urlInput.focus();
      return;
    }

    // Show progress
    this.showProgress();

    try {
      const result = await this.gitManager.clone(url, {
        branch,
        depth: depth || undefined,
        onProgress: (progress) => {
          this.updateProgress(progress);
        },
      });

      // Show success result
      this.showResult(true, result);

      // Refresh file explorer
      if (this.fileExplorer) {
        await this.fileExplorer.loadFiles();
      }

      // Update repository list
      this.updateRepositoryList();
    } catch (error) {
      console.error('Clone error:', error);
      this.showResult(false, { error: error.message });
    }
  }

  /**
   * Validate GitHub URL format
   *
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidGitHubUrl(url) {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+/;
    return githubPattern.test(url);
  }

  /**
   * Show progress UI
   */
  showProgress() {
    this.dialog.querySelector('.git-clone-form').classList.add('hidden');
    this.dialog.querySelector('.git-clone-result').classList.add('hidden');
    this.dialog.querySelector('.git-clone-progress').classList.remove('hidden');
  }

  /**
   * Update progress display
   *
   * @param {object} progress - Progress information
   */
  updateProgress(progress) {
    const phaseEl = this.dialog.querySelector('.progress-phase');
    const statsEl = this.dialog.querySelector('.progress-stats');
    const fillEl = this.dialog.querySelector('.progress-fill');

    phaseEl.textContent = progress.phase;
    statsEl.textContent = `${progress.loaded} / ${progress.total}`;

    const percentage = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
    fillEl.style.width = `${percentage}%`;
  }

  /**
   * Show clone result
   *
   * @param {boolean} success - Whether clone was successful
   * @param {object} result - Result object
   */
  showResult(success, result) {
    this.dialog.querySelector('.git-clone-form').classList.add('hidden');
    this.dialog.querySelector('.git-clone-progress').classList.add('hidden');
    this.dialog.querySelector('.git-clone-result').classList.remove('hidden');

    const icon = this.dialog.querySelector('.result-icon');
    const message = this.dialog.querySelector('.result-message');
    const details = this.dialog.querySelector('.result-details');

    if (success) {
      icon.textContent = '✅';
      message.textContent = 'Repository cloned successfully!';
      details.innerHTML = `
        <strong>Repository:</strong> ${result.repository}<br>
        <strong>Files imported:</strong> ${result.importedCount} / ${result.fileCount}<br>
        <strong>URL:</strong> ${result.url}
      `;

      // Auto-close after 3 seconds
      setTimeout(() => {
        this.close();
      }, 3000);
    } else {
      icon.textContent = '❌';
      message.textContent = 'Clone failed';
      details.innerHTML = `<strong>Error:</strong> ${result.error}`;
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    this.dialog.querySelector('#git-url-input').value = '';
    this.dialog.querySelector('#git-branch-input').value = '';
    this.dialog.querySelector('#git-depth-select').value = '1';

    this.dialog.querySelector('.git-clone-form').classList.remove('hidden');
    this.dialog.querySelector('.git-clone-progress').classList.add('hidden');
    this.dialog.querySelector('.git-clone-result').classList.add('hidden');
  }

  /**
   * Update list of cloned repositories
   */
  updateRepositoryList() {
    const listEl = this.dialog.querySelector('#git-repo-list');
    const repos = this.gitManager.getRepositories();

    if (repos.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No repositories cloned yet</div>';
      return;
    }

    listEl.innerHTML = repos.map((repo) => `
      <div class="repo-item">
        <div class="repo-icon">📦</div>
        <div class="repo-info">
          <div class="repo-name">${repo.name}</div>
          <div class="repo-url">${repo.url}</div>
          <div class="repo-meta">
            ${repo.fileCount} files • ${repo.branch} •
            ${new Date(repo.clonedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Dispose of the dialog
   */
  dispose() {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
  }
}
