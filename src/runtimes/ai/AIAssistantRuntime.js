/**
 * AIAssistantRuntime - Browser-based LLM for code assistance
 *
 * Uses WebLLM with WebGPU for fast inference, with WASM fallback.
 * No API keys required - 100% client-side AI.
 */
import * as webllm from '@mlc-ai/web-llm';

export default class AIAssistantRuntime {
  constructor() {
    this.engine = null;
    this.currentModel = null;
    this.loadingProgress = 0;
    this.isLoading = false;
    this.loaded = false;
    this.progressCallback = null;
    this.webgpuSupported = false;
    this.availableModels = [];
  }

  /**
   * Get available models from WebLLM's prebuilt config
   *
   * @returns {Array} List of available models
   */
  async getAvailableModels() {
    try {
      // Get the prebuilt model list from WebLLM
      const modelList = webllm.prebuiltAppConfig?.model_list || [];

      if (Array.isArray(modelList) && modelList.length > 0) {
        this.availableModels = modelList.map(m => ({
          id: m.model_id,
          name: m.model_id,
          // Extract size info if available in model metadata
          size: this.estimateModelSize(m.model_id),
          // Categorize models by size
          category: this.categorizeModel(m.model_id),
        }));
      } else {
        // Fallback to a minimal list if prebuilt config fails
        console.warn('Could not load WebLLM model list, using fallback');
        this.availableModels = [
          { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', name: 'TinyLlama 1.1B', size: '~600MB', category: 'small' },
          { id: 'Phi-2-q4f16_1-MLC', name: 'Phi-2 2.7B', size: '~1.5GB', category: 'medium' },
          { id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', name: 'Mistral 7B', size: '~4GB', category: 'large' },
        ];
      }

      return this.availableModels;
    } catch (error) {
      console.error('Failed to get available models:', error);
      return this.availableModels;
    }
  }

  /**
   * Estimate model size based on name patterns
   *
   * @param {string} modelId - Model ID
   * @returns {string} Estimated size
   */
  estimateModelSize(modelId) {
    const lower = modelId.toLowerCase();

    // Extract parameter count
    if (lower.includes('0.5b') || lower.includes('500m')) return '~300MB';
    if (lower.includes('1b') || lower.includes('1.1b')) return '~600MB';
    if (lower.includes('2b') || lower.includes('2.7b')) return '~1.5GB';
    if (lower.includes('3b')) return '~2GB';
    if (lower.includes('7b')) return '~4GB';
    if (lower.includes('8b')) return '~4.5GB';
    if (lower.includes('13b')) return '~7GB';
    if (lower.includes('70b')) return '~35GB';

    // Default estimate
    return '~2GB';
  }

  /**
   * Categorize model by size
   *
   * @param {string} modelId - Model ID
   * @returns {string} Category (small/medium/large)
   */
  categorizeModel(modelId) {
    const lower = modelId.toLowerCase();

    if (lower.includes('0.5b') || lower.includes('500m') || lower.includes('1b') || lower.includes('1.1b')) {
      return 'small';
    }
    if (lower.includes('2b') || lower.includes('2.7b') || lower.includes('3b')) {
      return 'medium';
    }
    return 'large';
  }

  /**
   * Check WebGPU support
   */
  async checkWebGPUSupport() {
    try {
      if (!navigator.gpu) {
        this.webgpuSupported = false;
        return false;
      }

      const adapter = await navigator.gpu.requestAdapter();
      this.webgpuSupported = !!adapter;
      return this.webgpuSupported;
    } catch (error) {
      console.warn('WebGPU check failed:', error);
      this.webgpuSupported = false;
      return false;
    }
  }

  /**
   * Load AI model
   *
   * @param {string} modelId - Full model ID from WebLLM's model list
   * @param {Function} progressCallback - Progress callback (progress) => {}
   * @returns {Promise<void>}
   */
  async load(modelId, progressCallback = null) {
    if (this.isLoading) {
      console.warn('Model is already loading');
      return;
    }

    if (this.loaded && this.currentModel === modelId) {
      console.log('Model already loaded');
      return;
    }

    this.isLoading = true;
    this.progressCallback = progressCallback;

    try {
      console.log(`Loading ${modelId}...`);

      // Check WebGPU support
      await this.checkWebGPUSupport();

      if (!this.webgpuSupported) {
        console.warn('WebGPU not supported. AI assistant will use slower WASM fallback.');
      }

      // Create MLCEngine with progress tracking
      const engineConfig = {
        initProgressCallback: (progress) => {
          this.loadingProgress = progress.progress || 0;
          console.log(`Loading model: ${this.loadingProgress}%`);

          if (this.progressCallback) {
            this.progressCallback({
              progress: this.loadingProgress,
              text: progress.text || `Loading model...`,
            });
          }
        },
        appConfig: webllm.prebuiltAppConfig, // Use prebuilt model list
      };

      this.engine = await webllm.CreateMLCEngine(modelId, engineConfig);

      this.currentModel = modelId;
      this.loaded = true;
      this.isLoading = false;
      this.loadingProgress = 100;

      console.log(`${modelId} loaded successfully!`);

      if (this.progressCallback) {
        this.progressCallback({
          progress: 100,
          text: `${modelId} ready!`,
          complete: true,
        });
      }
    } catch (error) {
      this.isLoading = false;
      this.loaded = false;
      console.error('Failed to load AI model:', error);

      if (this.progressCallback) {
        this.progressCallback({
          progress: 0,
          text: `Failed to load model: ${error.message}`,
          error: true,
        });
      }

      throw error;
    }
  }

  /**
   * Chat with the AI (non-streaming)
   *
   * @param {Array} messages - Array of {role, content} messages
   * @param {Object} options - Chat options
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    if (!this.loaded || !this.engine) {
      throw new Error('AI model not loaded. Call load() first.');
    }

    try {
      const completion = await this.engine.chat.completions.create({
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: options.topP || 0.9,
        seed: options.seed || 0,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Chat with the AI (streaming)
   *
   * @param {Array} messages - Array of {role, content} messages
   * @param {Function} onChunk - Callback for each chunk (chunk) => {}
   * @param {Object} options - Chat options
   * @returns {Promise<string>} - Full response
   */
  async chatStream(messages, onChunk, options = {}) {
    if (!this.loaded || !this.engine) {
      throw new Error('AI model not loaded. Call load() first.');
    }

    try {
      const completion = await this.engine.chat.completions.create({
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: options.topP || 0.9,
        seed: options.seed || 0,
      });

      let fullResponse = '';

      for await (const chunk of completion) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          if (onChunk) {
            onChunk(delta);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Stream chat error:', error);
      throw error;
    }
  }

  /**
   * Get current model info
   *
   * @returns {Object|null}
   */
  getCurrentModelInfo() {
    if (!this.currentModel) {
      return null;
    }
    const modelInfo = this.availableModels.find(m => m.id === this.currentModel);
    return modelInfo || { id: this.currentModel, name: this.currentModel, size: 'Unknown' };
  }

  /**
   * Get all available models
   *
   * @returns {Array}
   */
  getAvailableModelsList() {
    return this.availableModels;
  }

  /**
   * Unload current model
   */
  async unload() {
    if (this.engine) {
      try {
        // WebLLM doesn't have explicit cleanup, but we can nullify
        this.engine = null;
        this.loaded = false;
        this.currentModel = null;
        console.log('AI model unloaded');
      } catch (error) {
        console.error('Error unloading model:', error);
      }
    }
  }

  /**
   * Check if model is loaded
   *
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Get loading progress
   *
   * @returns {number} - Progress 0-100
   */
  getProgress() {
    return this.loadingProgress;
  }
}
