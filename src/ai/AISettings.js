/**
 * AISettings - Manages AI assistant settings with localStorage persistence
 */
export default class AISettings {
  constructor() {
    this.storageKey = 'drlee-ai-settings';
    this.defaults = {
      // Model parameters
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      seed: 0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stopSequences: [],

      // System prompt
      systemPrompt: '',

      // UI preferences
      autoLoadModel: false,
      chatHistorySize: 50,
      showTypingIndicator: true,
      codeHighlighting: true,
    };

    this.settings = this.load();
  }

  /**
   * Load settings from localStorage
   * @returns {Object} Settings object
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return { ...this.defaults, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
    return { ...this.defaults };
  }

  /**
   * Save settings to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with key-value pairs
   */
  update(updates) {
    Object.assign(this.settings, updates);
    this.save();
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.settings = { ...this.defaults };
    this.save();
  }

  /**
   * Get model parameters for AI runtime
   * @returns {Object} Parameters object
   */
  getModelParameters() {
    return {
      temperature: this.get('temperature'),
      maxTokens: this.get('maxTokens'),
      topP: this.get('topP'),
      seed: this.get('seed'),
      frequencyPenalty: this.get('frequencyPenalty'),
      presencePenalty: this.get('presencePenalty'),
      stopSequences: this.get('stopSequences'),
    };
  }

  /**
   * Get custom system prompt (empty string means use default)
   * @returns {string} Custom system prompt
   */
  getCustomSystemPrompt() {
    return this.get('systemPrompt') || '';
  }

  /**
   * Check if custom system prompt is set
   * @returns {boolean}
   */
  hasCustomSystemPrompt() {
    return !!this.get('systemPrompt');
  }
}
