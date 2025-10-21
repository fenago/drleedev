/**
 * AIContextManager - Manages code context for AI assistance
 *
 * Tracks open files, current language, selections, and project context
 * to provide relevant information to the AI assistant.
 */
export default class AIContextManager {
  constructor() {
    this.currentFile = null;
    this.currentLanguage = null;
    this.currentCode = '';
    this.selection = '';
    this.cursorPosition = { line: 0, column: 0 };
    this.openFiles = [];
    this.recentErrors = [];
  }

  /**
   * Update current file context
   *
   * @param {Object} file - File object {name, path, content}
   */
  setCurrentFile(file) {
    this.currentFile = file;
    this.currentCode = file?.content || '';
  }

  /**
   * Update current language
   *
   * @param {string} language - Programming language
   */
  setCurrentLanguage(language) {
    this.currentLanguage = language;
  }

  /**
   * Update current code
   *
   * @param {string} code - Current editor content
   */
  setCurrentCode(code) {
    this.currentCode = code;
  }

  /**
   * Update selected text
   *
   * @param {string} selection - Selected text
   */
  setSelection(selection) {
    this.selection = selection;
  }

  /**
   * Update cursor position
   *
   * @param {Object} position - {line, column}
   */
  setCursorPosition(position) {
    this.cursorPosition = position;
  }

  /**
   * Add file to open files list
   *
   * @param {Object} file - File object
   */
  addOpenFile(file) {
    const exists = this.openFiles.find(f => f.path === file.path);
    if (!exists) {
      this.openFiles.push(file);
    }
  }

  /**
   * Remove file from open files list
   *
   * @param {string} filePath - File path
   */
  removeOpenFile(filePath) {
    this.openFiles = this.openFiles.filter(f => f.path !== filePath);
  }

  /**
   * Add recent error
   *
   * @param {Object} error - Error object {message, line, type}
   */
  addRecentError(error) {
    this.recentErrors.unshift(error);
    // Keep only last 5 errors
    if (this.recentErrors.length > 5) {
      this.recentErrors = this.recentErrors.slice(0, 5);
    }
  }

  /**
   * Clear recent errors
   */
  clearRecentErrors() {
    this.recentErrors = [];
  }

  /**
   * Build context for AI prompt
   *
   * @param {string} userMessage - User's question/request
   * @param {Object} options - Context options
   * @returns {Array} - Messages array for AI
   */
  buildContext(userMessage, options = {}) {
    const {
      includeCurrentFile = true,
      includeSelection = true,
      includeErrors = true,
      includeOpenFiles = false,
    } = options;

    // System prompt
    const systemPrompt = this.getSystemPrompt();

    // Build context parts
    let contextParts = [];

    if (includeCurrentFile && this.currentFile) {
      contextParts.push(`Current file: ${this.currentFile.name} (${this.currentLanguage || 'unknown'})`);

      // Include current code (limit to 500 lines for context size)
      if (this.currentCode) {
        const lines = this.currentCode.split('\n');
        const truncated = lines.length > 500 ? lines.slice(0, 500).join('\n') + '\n... (truncated)' : this.currentCode;
        contextParts.push(`\nCurrent code:\n\`\`\`${this.currentLanguage || ''}\n${truncated}\n\`\`\``);
      }
    }

    if (includeSelection && this.selection) {
      contextParts.push(`\nSelected code:\n\`\`\`${this.currentLanguage || ''}\n${this.selection}\n\`\`\``);
      contextParts.push(`Cursor position: Line ${this.cursorPosition.line}, Column ${this.cursorPosition.column}`);
    }

    if (includeErrors && this.recentErrors.length > 0) {
      const errorsText = this.recentErrors
        .map(e => `- ${e.type}: ${e.message} (line ${e.line})`)
        .join('\n');
      contextParts.push(`\nRecent errors:\n${errorsText}`);
    }

    if (includeOpenFiles && this.openFiles.length > 0) {
      const filesText = this.openFiles
        .map(f => `- ${f.name}`)
        .join('\n');
      contextParts.push(`\nOpen files:\n${filesText}`);
    }

    const contextMessage = contextParts.join('\n');

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (contextMessage) {
      messages.push({ role: 'system', content: contextMessage });
    }

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Get system prompt for AI
   *
   * @returns {string}
   */
  getSystemPrompt() {
    return `You are an AI coding assistant integrated into DrLee IDE, a browser-based development environment supporting 30+ programming languages.

Your role:
- Help developers write, understand, debug, and improve code
- Provide clear, concise explanations focused on best practices
- Suggest code improvements and optimizations
- Help fix bugs and errors
- Answer programming questions

Guidelines:
- Keep responses focused and practical
- Use code examples when helpful
- Reference the current file/language context
- Be specific about line numbers when discussing code
- Suggest improvements but respect the developer's approach
- Explain complex concepts simply

Current IDE capabilities:
- 30+ languages: JavaScript, Python, TypeScript, Ruby, PHP, Lua, R, SQL databases, and more
- Monaco Editor with syntax highlighting
- File management with IndexedDB
- JupyterLite notebooks
- Real-time code execution

Remember: You're running entirely in the browser with no access to external APIs or file systems.`;
  }

  /**
   * Get quick context (for simple questions)
   *
   * @param {string} userMessage - User's message
   * @returns {Array} - Messages array
   */
  getQuickContext(userMessage) {
    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: userMessage },
    ];
  }

  /**
   * Build context for code explanation
   *
   * @param {string} code - Code to explain
   * @param {string} language - Programming language
   * @returns {Array} - Messages array
   */
  buildExplainContext(code, language) {
    const prompt = `Explain this ${language || 'code'} clearly and concisely:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide:\n1. What the code does\n2. Key concepts used\n3. Any important details or gotchas`;

    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];
  }

  /**
   * Build context for code generation
   *
   * @param {string} description - What to generate
   * @param {string} language - Target language
   * @returns {Array} - Messages array
   */
  buildGenerateContext(description, language) {
    const prompt = `Generate ${language || 'code'} for the following:\n\n${description}\n\nProvide clean, well-commented code following best practices for ${language || 'this language'}.`;

    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];
  }

  /**
   * Build context for bug fixing
   *
   * @param {string} code - Code with bug
   * @param {string} error - Error message
   * @param {string} language - Programming language
   * @returns {Array} - Messages array
   */
  buildFixContext(code, error, language) {
    const prompt = `This ${language || 'code'} has an error:\n\nError: ${error}\n\nCode:\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nPlease:\n1. Explain what's causing the error\n2. Provide the corrected code\n3. Explain the fix`;

    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];
  }

  /**
   * Build context for code review
   *
   * @param {string} code - Code to review
   * @param {string} language - Programming language
   * @returns {Array} - Messages array
   */
  buildReviewContext(code, language) {
    const prompt = `Review this ${language || 'code'} and suggest improvements:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nFocus on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance optimizations\n4. Readability improvements`;

    return [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];
  }

  /**
   * Get current context summary
   *
   * @returns {Object}
   */
  getContextSummary() {
    return {
      currentFile: this.currentFile?.name || 'None',
      language: this.currentLanguage || 'None',
      codeLength: this.currentCode.length,
      hasSelection: !!this.selection,
      openFilesCount: this.openFiles.length,
      recentErrorsCount: this.recentErrors.length,
    };
  }
}
