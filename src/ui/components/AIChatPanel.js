import AISettings from '../../ai/AISettings.js';

/**
 * AIChatPanel - AI assistant chat interface
 *
 * Provides chat UI for interacting with the AI assistant.
 */
export default class AIChatPanel {
  constructor(container, aiRuntime, contextManager) {
    this.container = container;
    this.aiRuntime = aiRuntime;
    this.contextManager = contextManager;
    this.settings = new AISettings();
    this.messages = [];
    this.isVisible = false;
    this.isMinimized = false;

    // UI elements
    this.panel = null;
    this.header = null;
    this.messagesContainer = null;
    this.inputContainer = null;
    this.input = null;
    this.sendButton = null;
    this.modelSelector = null;
    this.statusBar = null;
    this.minimizeButton = null;
    this.closeButton = null;
    this.toggleButton = null;
    this.settingsButton = null;
    this.settingsDialog = null;
  }

  /**
   * Initialize chat panel
   */
  init() {
    this.createUI();
    this.attachEventListeners();
    this.hide(); // Start hidden
  }

  /**
   * Create UI elements
   */
  createUI() {
    // Create main panel
    this.panel = document.createElement('div');
    this.panel.className = 'ai-chat-panel';
    this.panel.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <span class="ai-icon">🤖</span>
          <span>AI Assistant</span>
        </div>
        <div class="ai-chat-controls">
          <select class="ai-model-selector" title="Select AI Model">
            <option value="">Loading models...</option>
          </select>
          <button class="ai-settings-btn" title="Settings">⚙️</button>
          <button class="ai-minimize-btn" title="Minimize">_</button>
          <button class="ai-close-btn" title="Close">×</button>
        </div>
      </div>

      <div class="ai-chat-status-bar">
        <span class="ai-status-text">Click "Load Model" to start</span>
        <div class="ai-status-progress" style="display: none;">
          <div class="ai-progress-bar">
            <div class="ai-progress-fill"></div>
          </div>
          <span class="ai-progress-text">0%</span>
        </div>
      </div>

      <div class="ai-chat-messages"></div>

      <div class="ai-chat-input-container">
        <textarea
          class="ai-chat-input"
          placeholder="Ask AI anything... (Shift+Enter to send)"
          rows="2"
        ></textarea>
        <button class="ai-send-btn" disabled title="Load model first">
          <span>Send</span>
        </button>
      </div>

      <div class="ai-chat-actions">
        <button class="ai-action-btn" data-action="explain" disabled>
          <span>💡</span> Explain Code
        </button>
        <button class="ai-action-btn" data-action="fix" disabled>
          <span>🔧</span> Fix Errors
        </button>
        <button class="ai-action-btn" data-action="review" disabled>
          <span>👀</span> Review Code
        </button>
        <button class="ai-action-btn" data-action="generate" disabled>
          <span>✨</span> Generate Code
        </button>
      </div>
    `;

    // Create toggle button (floating button when panel is hidden)
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'ai-chat-toggle';
    this.toggleButton.innerHTML = '🤖 AI Assistant';
    this.toggleButton.title = 'Open AI Assistant';

    // Get UI elements
    this.header = this.panel.querySelector('.ai-chat-header');
    this.messagesContainer = this.panel.querySelector('.ai-chat-messages');
    this.inputContainer = this.panel.querySelector('.ai-chat-input-container');
    this.input = this.panel.querySelector('.ai-chat-input');
    this.sendButton = this.panel.querySelector('.ai-send-btn');
    this.modelSelector = this.panel.querySelector('.ai-model-selector');
    this.statusBar = this.panel.querySelector('.ai-chat-status-bar');
    this.settingsButton = this.panel.querySelector('.ai-settings-btn');
    this.minimizeButton = this.panel.querySelector('.ai-minimize-btn');
    this.closeButton = this.panel.querySelector('.ai-close-btn');

    // Create settings dialog
    this.createSettingsDialog();

    // Add to container
    this.container.appendChild(this.panel);
    document.body.appendChild(this.toggleButton);

    // Load and apply settings
    this.applySettings();

    // Add welcome message
    this.addSystemMessage('Welcome to AI Assistant! Click "Load Model" below to get started.');
    this.addSystemMessage('💡 Tip: You can ask questions, explain code, fix bugs, or generate new code.');

    // Populate model selector
    this.populateModelSelector();
  }

  /**
   * Create settings dialog
   */
  createSettingsDialog() {
    this.settingsDialog = document.createElement('div');
    this.settingsDialog.className = 'ai-settings-dialog';
    this.settingsDialog.style.display = 'none';
    this.settingsDialog.innerHTML = `
      <div class="ai-settings-backdrop"></div>
      <div class="ai-settings-content">
        <div class="ai-settings-header">
          <h3>AI Settings</h3>
          <button class="ai-settings-close">×</button>
        </div>
        <div class="ai-settings-body">
          <div class="ai-settings-section">
            <h4>System Prompt</h4>
            <textarea
              class="ai-setting-system-prompt"
              placeholder="Leave empty to use default system prompt..."
              rows="6"
            ></textarea>
            <small>Custom instructions for the AI assistant. Leave empty for default behavior.</small>
          </div>

          <div class="ai-settings-section">
            <h4>Model Parameters</h4>

            <div class="ai-setting-row">
              <label>
                Temperature <span class="ai-setting-value">0.7</span>
                <input type="range" class="ai-setting-temperature" min="0" max="2" step="0.1" value="0.7">
              </label>
              <small>Higher = more creative, Lower = more focused</small>
            </div>

            <div class="ai-setting-row">
              <label>
                Max Tokens <span class="ai-setting-value">1000</span>
                <input type="range" class="ai-setting-max-tokens" min="100" max="4000" step="100" value="1000">
              </label>
              <small>Maximum length of AI responses</small>
            </div>

            <div class="ai-setting-row">
              <label>
                Top P <span class="ai-setting-value">0.9</span>
                <input type="range" class="ai-setting-top-p" min="0" max="1" step="0.05" value="0.9">
              </label>
              <small>Nucleus sampling threshold</small>
            </div>

            <div class="ai-setting-row">
              <label>
                Frequency Penalty <span class="ai-setting-value">0.0</span>
                <input type="range" class="ai-setting-freq-penalty" min="0" max="2" step="0.1" value="0">
              </label>
              <small>Reduce repetition of tokens</small>
            </div>

            <div class="ai-setting-row">
              <label>
                Presence Penalty <span class="ai-setting-value">0.0</span>
                <input type="range" class="ai-setting-pres-penalty" min="0" max="2" step="0.1" value="0">
              </label>
              <small>Encourage topic diversity</small>
            </div>

            <div class="ai-setting-row">
              <label>
                Seed
                <input type="number" class="ai-setting-seed" min="0" step="1" value="0">
              </label>
              <small>For reproducible responses (0 = random)</small>
            </div>
          </div>

          <div class="ai-settings-section">
            <h4>UI Preferences</h4>

            <div class="ai-setting-row">
              <label>
                <input type="checkbox" class="ai-setting-auto-load">
                Auto-load model on startup
              </label>
            </div>

            <div class="ai-setting-row">
              <label>
                Chat History Size
                <input type="number" class="ai-setting-history-size" min="10" max="200" step="10" value="50">
              </label>
              <small>Number of messages to keep in history</small>
            </div>
          </div>
        </div>
        <div class="ai-settings-footer">
          <button class="ai-settings-reset">Reset to Defaults</button>
          <button class="ai-settings-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.settingsDialog);
  }

  /**
   * Populate model selector with all available models
   */
  async populateModelSelector() {
    try {
      // Get available models from AI runtime
      const models = await this.aiRuntime.getAvailableModels();

      if (!models || models.length === 0) {
        this.modelSelector.innerHTML = '<option value="">No models available</option>';
        return;
      }

      // Clear loading option
      this.modelSelector.innerHTML = '';

      // Group models by category
      const small = models.filter(m => m.category === 'small');
      const medium = models.filter(m => m.category === 'medium');
      const large = models.filter(m => m.category === 'large');

      // Add small models group
      if (small.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = '⚡ Small Models (Fast, <2GB RAM)';
        small.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = `${model.name} ${model.size}`;
          optgroup.appendChild(option);
        });
        this.modelSelector.appendChild(optgroup);
      }

      // Add medium models group
      if (medium.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = '🚀 Medium Models (Balanced, 2-4GB RAM)';
        medium.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = `${model.name} ${model.size}`;
          optgroup.appendChild(option);
        });
        this.modelSelector.appendChild(optgroup);
      }

      // Add large models group
      if (large.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = '🔥 Large Models (Best Quality, 4GB+ RAM)';
        large.forEach(model => {
          const option = document.createElement('option');
          option.value = model.id;
          option.textContent = `${model.name} ${model.size}`;
          optgroup.appendChild(option);
        });
        this.modelSelector.appendChild(optgroup);
      }

      // Select Gemma model by default if available, otherwise first small model
      let defaultModel = models[0]?.id;

      // Try to find a Gemma model
      const gemmaModel = models.find(m =>
        m.id.toLowerCase().includes('gemma') &&
        m.category === 'small'
      );

      if (gemmaModel) {
        defaultModel = gemmaModel.id;
        console.log(`Default model set to: ${gemmaModel.name}`);
      } else {
        // Try any Gemma model (even if large)
        const anyGemma = models.find(m => m.id.toLowerCase().includes('gemma'));
        if (anyGemma) {
          defaultModel = anyGemma.id;
          console.log(`Default model set to: ${anyGemma.name}`);
        }
      }

      if (defaultModel) {
        this.modelSelector.value = defaultModel;
      }

      console.log(`Loaded ${models.length} AI models into selector (default: ${defaultModel})`);
    } catch (error) {
      console.error('Failed to populate model selector:', error);
      this.modelSelector.innerHTML = '<option value="">Error loading models</option>';
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle button
    this.toggleButton.addEventListener('click', () => {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    });

    // Minimize/Close buttons
    this.minimizeButton.addEventListener('click', () => this.minimize());
    this.closeButton.addEventListener('click', () => this.hide());

    // Settings button
    this.settingsButton.addEventListener('click', () => this.openSettings());

    // Settings dialog buttons
    const settingsClose = this.settingsDialog.querySelector('.ai-settings-close');
    const settingsSave = this.settingsDialog.querySelector('.ai-settings-save');
    const settingsReset = this.settingsDialog.querySelector('.ai-settings-reset');
    const settingsBackdrop = this.settingsDialog.querySelector('.ai-settings-backdrop');

    settingsClose.addEventListener('click', () => this.closeSettings());
    settingsBackdrop.addEventListener('click', () => this.closeSettings());
    settingsSave.addEventListener('click', () => this.saveSettings());
    settingsReset.addEventListener('click', () => this.resetSettings());

    // Update value displays for range inputs
    const rangeInputs = this.settingsDialog.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const valueSpan = e.target.parentElement.querySelector('.ai-setting-value');
        if (valueSpan) {
          valueSpan.textContent = e.target.value;
        }
      });
    });

    // Send button
    this.sendButton.addEventListener('click', () => this.handleSend());

    // Input field (Shift+Enter to send)
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Model selector
    this.modelSelector.addEventListener('change', () => this.handleModelChange());

    // Action buttons
    const actionButtons = this.panel.querySelectorAll('.ai-action-btn');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Auto-load model on first interaction
    let modelLoaded = false;
    const loadModelOnce = async () => {
      if (!modelLoaded && !this.aiRuntime.isLoaded()) {
        modelLoaded = true;
        await this.loadModel();
      }
    };

    this.input.addEventListener('focus', loadModelOnce);
    this.sendButton.addEventListener('click', loadModelOnce);
  }

  /**
   * Load AI model
   */
  async loadModel(modelId = null) {
    const model = modelId || this.modelSelector.value;

    if (!model) {
      this.addSystemMessage('⚠️ Please select a model first.');
      return;
    }

    try {
      // Show progress
      this.setStatus('loading', 'Loading AI model...');
      this.showProgress();

      await this.aiRuntime.load(model, (progress) => {
        this.updateProgress(progress.progress, progress.text);
      });

      // Success
      const modelInfo = this.aiRuntime.getCurrentModelInfo();
      const modelName = modelInfo ? modelInfo.name : model;
      this.setStatus('ready', `${modelName} ready!`);
      this.hideProgress();
      this.enableInput();
      this.addSystemMessage(`✅ Model loaded successfully! You can now ask questions or use quick actions.`);
    } catch (error) {
      this.setStatus('error', `Failed to load model: ${error.message}`);
      this.hideProgress();
      this.addSystemMessage(`❌ Failed to load AI model: ${error.message}. Try refreshing the page or selecting a different model.`);
    }
  }

  /**
   * Handle model change
   */
  async handleModelChange() {
    if (this.aiRuntime.isLoaded()) {
      // Ask user to confirm model change
      if (!confirm('Changing models will reload the AI. Continue?')) {
        return;
      }

      await this.aiRuntime.unload();
      this.disableInput();
    }

    await this.loadModel();
  }

  /**
   * Handle send message
   */
  async handleSend() {
    const userMessage = this.input.value.trim();

    if (!userMessage) {
      return;
    }

    if (!this.aiRuntime.isLoaded()) {
      this.addSystemMessage('⚠️ Please wait for the AI model to load first.');
      return;
    }

    // Clear input
    this.input.value = '';

    // Add user message to chat
    this.addUserMessage(userMessage);

    // Show typing indicator
    const typingId = this.addTypingIndicator();

    try {
      // Build context
      const messages = this.contextManager.buildContext(userMessage, {
        includeCurrentFile: true,
        includeSelection: false,
        includeErrors: false,
      });

      // Get AI response (streaming)
      let responseText = '';
      const messageId = this.addAssistantMessage('');

      // Get model parameters from settings
      const options = this.settings.getModelParameters();

      await this.aiRuntime.chatStream(
        messages,
        (chunk) => {
          responseText += chunk;
          this.updateAssistantMessage(messageId, responseText);
        },
        options
      );

      // Store message in history
      this.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: responseText }
      );
    } catch (error) {
      console.error('Chat error:', error);
      this.addSystemMessage(`❌ Error: ${error.message}`);
    } finally {
      // Remove typing indicator
      this.removeTypingIndicator(typingId);
    }
  }

  /**
   * Handle quick action
   */
  async handleQuickAction(action) {
    if (!this.aiRuntime.isLoaded()) {
      this.addSystemMessage('⚠️ Please wait for the AI model to load first.');
      return;
    }

    const code = this.contextManager.currentCode;
    const language = this.contextManager.currentLanguage;

    if (!code) {
      this.addSystemMessage('⚠️ No code in the editor. Open or write some code first.');
      return;
    }

    let messages;
    let actionName;

    switch (action) {
      case 'explain':
        messages = this.contextManager.buildExplainContext(code, language);
        actionName = 'Explain Code';
        break;
      case 'fix':
        const errors = this.contextManager.recentErrors;
        if (errors.length === 0) {
          this.addSystemMessage('ℹ️ No recent errors to fix!');
          return;
        }
        const error = errors[0].message;
        messages = this.contextManager.buildFixContext(code, error, language);
        actionName = 'Fix Errors';
        break;
      case 'review':
        messages = this.contextManager.buildReviewContext(code, language);
        actionName = 'Review Code';
        break;
      case 'generate':
        const description = prompt('What code would you like to generate?');
        if (!description) return;
        messages = this.contextManager.buildGenerateContext(description, language);
        actionName = 'Generate Code';
        break;
      default:
        return;
    }

    // Add action message
    this.addUserMessage(`[${actionName}]`);

    // Show typing indicator
    const typingId = this.addTypingIndicator();

    try {
      // Get AI response (streaming)
      let responseText = '';
      const messageId = this.addAssistantMessage('');

      // Get model parameters from settings
      const options = this.settings.getModelParameters();

      await this.aiRuntime.chatStream(
        messages,
        (chunk) => {
          responseText += chunk;
          this.updateAssistantMessage(messageId, responseText);
        },
        options
      );
    } catch (error) {
      console.error('Action error:', error);
      this.addSystemMessage(`❌ Error: ${error.message}`);
    } finally {
      // Remove typing indicator
      this.removeTypingIndicator(typingId);
    }
  }

  /**
   * Add user message
   */
  addUserMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'ai-message ai-message-user';
    messageEl.innerHTML = `
      <div class="ai-message-content">${this.escapeHtml(text)}</div>
    `;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  /**
   * Add assistant message
   */
  addAssistantMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'ai-message ai-message-assistant';
    messageEl.innerHTML = `
      <div class="ai-message-content">${this.formatMarkdown(text)}</div>
    `;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  /**
   * Update assistant message
   */
  updateAssistantMessage(messageEl, text) {
    const contentEl = messageEl.querySelector('.ai-message-content');
    contentEl.innerHTML = this.formatMarkdown(text);
    this.scrollToBottom();
  }

  /**
   * Add system message
   */
  addSystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.className = 'ai-message ai-message-system';
    messageEl.innerHTML = `
      <div class="ai-message-content">${this.escapeHtml(text)}</div>
    `;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  /**
   * Add typing indicator
   */
  addTypingIndicator() {
    const messageEl = document.createElement('div');
    messageEl.className = 'ai-message ai-message-assistant ai-typing';
    messageEl.innerHTML = `
      <div class="ai-message-content">
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
      </div>
    `;
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    return messageEl;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  /**
   * Format markdown (basic)
   */
  formatMarkdown(text) {
    if (!text) return '';

    let html = this.escapeHtml(text);

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Show progress bar
   */
  showProgress() {
    const progressDiv = this.statusBar.querySelector('.ai-status-progress');
    progressDiv.style.display = 'flex';
  }

  /**
   * Hide progress bar
   */
  hideProgress() {
    const progressDiv = this.statusBar.querySelector('.ai-status-progress');
    progressDiv.style.display = 'none';
  }

  /**
   * Update progress
   */
  updateProgress(percent, text) {
    const fill = this.statusBar.querySelector('.ai-progress-fill');
    const progressText = this.statusBar.querySelector('.ai-progress-text');

    fill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;

    if (text) {
      this.setStatus('loading', text);
    }
  }

  /**
   * Set status
   */
  setStatus(type, text) {
    const statusText = this.statusBar.querySelector('.ai-status-text');
    statusText.textContent = text;
    statusText.className = `ai-status-text ai-status-${type}`;
  }

  /**
   * Enable input
   */
  enableInput() {
    this.input.disabled = false;
    this.sendButton.disabled = false;
    this.sendButton.title = 'Send message (Shift+Enter)';

    const actionButtons = this.panel.querySelectorAll('.ai-action-btn');
    actionButtons.forEach(btn => btn.disabled = false);
  }

  /**
   * Disable input
   */
  disableInput() {
    this.input.disabled = true;
    this.sendButton.disabled = true;
    this.sendButton.title = 'Load model first';

    const actionButtons = this.panel.querySelectorAll('.ai-action-btn');
    actionButtons.forEach(btn => btn.disabled = true);
  }

  /**
   * Show panel
   */
  show() {
    this.panel.style.display = 'flex';
    this.toggleButton.style.display = 'none';
    this.isVisible = true;
    this.isMinimized = false;
  }

  /**
   * Hide panel
   */
  hide() {
    this.panel.style.display = 'none';
    this.toggleButton.style.display = 'flex';
    this.isVisible = false;
    this.isMinimized = false;
  }

  /**
   * Minimize panel
   */
  minimize() {
    if (this.isMinimized) {
      this.panel.classList.remove('minimized');
      this.isMinimized = false;
      this.minimizeButton.textContent = '_';
    } else {
      this.panel.classList.add('minimized');
      this.isMinimized = true;
      this.minimizeButton.textContent = '□';
    }
  }

  /**
   * Clear chat
   */
  clearChat() {
    this.messagesContainer.innerHTML = '';
    this.messages = [];
    this.addSystemMessage('Chat cleared.');
  }

  /**
   * Open settings dialog
   */
  openSettings() {
    this.settingsDialog.style.display = 'block';
  }

  /**
   * Close settings dialog
   */
  closeSettings() {
    this.settingsDialog.style.display = 'none';
  }

  /**
   * Apply settings from storage to UI
   */
  applySettings() {
    const all = this.settings.getAll();

    // System prompt
    const systemPromptInput = this.settingsDialog.querySelector('.ai-setting-system-prompt');
    systemPromptInput.value = all.systemPrompt || '';
    this.contextManager.setCustomSystemPrompt(all.systemPrompt);

    // Model parameters
    this.setRangeValue('.ai-setting-temperature', all.temperature);
    this.setRangeValue('.ai-setting-max-tokens', all.maxTokens);
    this.setRangeValue('.ai-setting-top-p', all.topP);
    this.setRangeValue('.ai-setting-freq-penalty', all.frequencyPenalty);
    this.setRangeValue('.ai-setting-pres-penalty', all.presencePenalty);

    const seedInput = this.settingsDialog.querySelector('.ai-setting-seed');
    seedInput.value = all.seed;

    // UI preferences
    const autoLoadCheckbox = this.settingsDialog.querySelector('.ai-setting-auto-load');
    autoLoadCheckbox.checked = all.autoLoadModel;

    const historySizeInput = this.settingsDialog.querySelector('.ai-setting-history-size');
    historySizeInput.value = all.chatHistorySize;
  }

  /**
   * Set range input value and update display
   */
  setRangeValue(selector, value) {
    const input = this.settingsDialog.querySelector(selector);
    if (input) {
      input.value = value;
      const valueSpan = input.parentElement.querySelector('.ai-setting-value');
      if (valueSpan) {
        valueSpan.textContent = value;
      }
    }
  }

  /**
   * Save settings from UI to storage
   */
  saveSettings() {
    // Get values from UI
    const systemPrompt = this.settingsDialog.querySelector('.ai-setting-system-prompt').value;
    const temperature = parseFloat(this.settingsDialog.querySelector('.ai-setting-temperature').value);
    const maxTokens = parseInt(this.settingsDialog.querySelector('.ai-setting-max-tokens').value);
    const topP = parseFloat(this.settingsDialog.querySelector('.ai-setting-top-p').value);
    const frequencyPenalty = parseFloat(this.settingsDialog.querySelector('.ai-setting-freq-penalty').value);
    const presencePenalty = parseFloat(this.settingsDialog.querySelector('.ai-setting-pres-penalty').value);
    const seed = parseInt(this.settingsDialog.querySelector('.ai-setting-seed').value);
    const autoLoadModel = this.settingsDialog.querySelector('.ai-setting-auto-load').checked;
    const chatHistorySize = parseInt(this.settingsDialog.querySelector('.ai-setting-history-size').value);

    // Update settings
    this.settings.update({
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      seed,
      autoLoadModel,
      chatHistorySize,
    });

    // Apply custom system prompt to context manager
    this.contextManager.setCustomSystemPrompt(systemPrompt);

    // Show confirmation
    this.addSystemMessage('✅ Settings saved successfully!');

    // Close dialog
    this.closeSettings();
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    if (!confirm('Reset all settings to defaults?')) {
      return;
    }

    this.settings.reset();
    this.applySettings();
    this.addSystemMessage('✅ Settings reset to defaults.');
  }
}
