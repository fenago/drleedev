/**
 * GitManager.js
 *
 * Git operations in the browser using isomorphic-git
 *
 * Features:
 * - Clone repositories from GitHub
 * - Pull updates
 * - List repository files
 * - Integration with FileManager for file persistence
 *
 * Libraries:
 * - isomorphic-git: Pure JavaScript Git implementation
 * - @isomorphic-git/lightning-fs: In-memory file system
 */

import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import FS from '@isomorphic-git/lightning-fs';
import { Buffer } from 'buffer';

// Make Buffer available globally for isomorphic-git
window.Buffer = Buffer;

export default class GitManager {
  constructor(fileManager) {
    this.fileManager = fileManager;
    this.fs = new FS('git-fs');
    this.pfs = this.fs.promises;
    this.corsProxy = 'https://cors.isomorphic-git.org';

    // Track cloned repositories
    this.repositories = new Map();
  }

  /**
   * Clone a Git repository from a URL
   *
   * @param {string} url - Git repository URL (e.g., https://github.com/user/repo)
   * @param {object} options - Clone options
   * @param {string} [options.dir] - Local directory name (defaults to repo name)
   * @param {string} [options.branch] - Branch to clone (defaults to main/master)
   * @param {number} [options.depth] - Clone depth (1 for shallow clone)
   * @param {function} [options.onProgress] - Progress callback
   * @returns {Promise<object>} Clone result with file count and directory
   */
  async clone(url, options = {}) {
    try {
      // Extract repository name from URL
      const repoName = this.extractRepoName(url);
      const dir = options.dir || repoName;
      const gitDir = `/${dir}`;

      console.log(`[GitManager] Cloning ${url} to ${gitDir}...`);

      // Progress tracking
      const progress = options.onProgress || (() => {});

      progress({ phase: 'Initializing', loaded: 0, total: 0 });

      // Clone repository
      await git.clone({
        fs: this.fs,
        http,
        dir: gitDir,
        corsProxy: this.corsProxy,
        url,
        ref: options.branch || 'main',
        singleBranch: true,
        depth: options.depth || 1,
        onProgress: (event) => {
          progress({
            phase: event.phase,
            loaded: event.loaded || 0,
            total: event.total || 0,
          });
        },
      });

      console.log(`[GitManager] Clone successful`);

      // Get list of files
      const files = await this.listFiles(gitDir);

      // Store repository info
      this.repositories.set(dir, {
        url,
        dir: gitDir,
        branch: options.branch || 'main',
        clonedAt: Date.now(),
        fileCount: files.length,
      });

      progress({ phase: 'Importing files', loaded: 0, total: files.length });

      // Import files into FileManager
      let importedCount = 0;
      for (const file of files) {
        try {
          const content = await this.pfs.readFile(`${gitDir}/${file}`, 'utf8');
          const language = this.detectLanguage(file);

          await this.fileManager.saveFile({
            name: file,
            content,
            language,
            gitRepo: dir,
            gitUrl: url,
          });

          importedCount++;
          progress({
            phase: 'Importing files',
            loaded: importedCount,
            total: files.length
          });
        } catch (error) {
          console.warn(`[GitManager] Failed to import ${file}:`, error.message);
        }
      }

      progress({ phase: 'Complete', loaded: files.length, total: files.length });

      return {
        success: true,
        repository: dir,
        directory: gitDir,
        fileCount: files.length,
        importedCount,
        url,
      };
    } catch (error) {
      console.error('[GitManager] Clone failed:', error);
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Pull latest changes from remote
   *
   * @param {string} dir - Repository directory
   * @param {function} [onProgress] - Progress callback
   * @returns {Promise<object>} Pull result
   */
  async pull(dir, onProgress) {
    try {
      const repoInfo = this.repositories.get(dir);
      if (!repoInfo) {
        throw new Error(`Repository ${dir} not found. Clone it first.`);
      }

      const gitDir = repoInfo.dir;
      const progress = onProgress || (() => {});

      progress({ phase: 'Fetching', loaded: 0, total: 0 });

      // Fetch from remote
      await git.fetch({
        fs: this.fs,
        http,
        dir: gitDir,
        corsProxy: this.corsProxy,
        url: repoInfo.url,
        ref: repoInfo.branch,
        singleBranch: true,
        depth: 1,
        onProgress: (event) => {
          progress({
            phase: event.phase,
            loaded: event.loaded || 0,
            total: event.total || 0,
          });
        },
      });

      // Pull (fast-forward merge)
      await git.pull({
        fs: this.fs,
        http,
        dir: gitDir,
        corsProxy: this.corsProxy,
        ref: repoInfo.branch,
        singleBranch: true,
        fastForwardOnly: true,
      });

      progress({ phase: 'Complete', loaded: 1, total: 1 });

      return {
        success: true,
        repository: dir,
        updatedAt: Date.now(),
      };
    } catch (error) {
      console.error('[GitManager] Pull failed:', error);
      throw new Error(`Failed to pull updates: ${error.message}`);
    }
  }

  /**
   * List all files in a Git repository
   *
   * @param {string} gitDir - Git directory path
   * @returns {Promise<string[]>} Array of file paths (relative to repo root)
   */
  async listFiles(gitDir, subDir = '') {
    const files = [];
    const currentDir = subDir ? `${gitDir}/${subDir}` : gitDir;

    try {
      const entries = await this.pfs.readdir(currentDir);

      for (const entry of entries) {
        // Skip .git directory
        if (entry === '.git') continue;

        const fullPath = subDir ? `${subDir}/${entry}` : entry;
        const absolutePath = `${gitDir}/${fullPath}`;

        try {
          const stat = await this.pfs.stat(absolutePath);

          if (stat.isDirectory()) {
            // Recursively list files in subdirectory
            const subFiles = await this.listFiles(gitDir, fullPath);
            files.push(...subFiles);
          } else {
            files.push(fullPath);
          }
        } catch (error) {
          console.warn(`[GitManager] Error reading ${fullPath}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[GitManager] Error listing directory ${currentDir}:`, error);
    }

    return files;
  }

  /**
   * Get repository information
   *
   * @param {string} dir - Repository directory name
   * @returns {object|null} Repository info or null
   */
  getRepositoryInfo(dir) {
    return this.repositories.get(dir) || null;
  }

  /**
   * Get list of all cloned repositories
   *
   * @returns {Array<object>} Array of repository info objects
   */
  getRepositories() {
    return Array.from(this.repositories.entries()).map(([name, info]) => ({
      name,
      ...info,
    }));
  }

  /**
   * Extract repository name from Git URL
   *
   * @param {string} url - Git repository URL
   * @returns {string} Repository name
   */
  extractRepoName(url) {
    // Handle various URL formats:
    // https://github.com/user/repo
    // https://github.com/user/repo.git
    // git@github.com:user/repo.git

    const match = url.match(/\/([^\/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }

    return 'repository';
  }

  /**
   * Detect programming language from file extension
   *
   * @param {string} filename - File name
   * @returns {string} Language identifier
   */
  detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();

    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      lua: 'lua',
      r: 'r',
      sql: 'sqlite',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      php: 'php',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
      rs: 'rust',
      go: 'go',
      kt: 'kotlin',
      swift: 'swift',
      cs: 'csharp',
      sh: 'bash',
      txt: 'plaintext',
    };

    return languageMap[ext] || 'plaintext';
  }

  /**
   * Delete repository from file system
   *
   * @param {string} dir - Repository directory name
   * @returns {Promise<void>}
   */
  async deleteRepository(dir) {
    const repoInfo = this.repositories.get(dir);
    if (!repoInfo) {
      throw new Error(`Repository ${dir} not found`);
    }

    // Remove from file system
    await this.pfs.rmdir(repoInfo.dir, { recursive: true });

    // Remove from tracking
    this.repositories.delete(dir);
  }

  /**
   * Clear all repositories
   *
   * @returns {Promise<void>}
   */
  async clearAll() {
    for (const [dir] of this.repositories) {
      await this.deleteRepository(dir);
    }
  }
}
