/**
 * AIRuntimeManager - Unified manager for WebLLM and MediaPipe AI runtimes
 *
 * Supports both WebLLM (30+ models) and MediaPipe (Gemma 3 multimodal) runtimes
 * Automatically switches between runtimes based on selected model
 */

import AIAssistantRuntime from './AIAssistantRuntime.js';
import MediaPipeRuntime from './MediaPipeRuntime.js';

export default class AIRuntimeManager {
  constructor() {
    this.webLLMRuntime = new AIAssistantRuntime();
    this.mediaPipeRuntime = new MediaPipeRuntime();
    this.currentRuntime = null; // Which runtime is currently active
    this.currentRuntimeType = null; // 'webllm' or 'mediapipe'
    this.currentModelId = null;
  }

  /**
   * Get all available models from both runtimes
   * @returns {Promise<Array>} Combined list of models
   */
  async getAvailableModels() {
    try {
      // Get WebLLM models
      const webllmModels = await this.webLLMRuntime.getAvailableModels();

      // Get MediaPipe models
      const mediapipeModels = this.mediaPipeRuntime.getAvailableModels();

      // Add metadata to distinguish between runtimes
      const webllmWithMeta = webllmModels.map(model => ({
        ...model,
        runtime: 'webllm',
        multimodal: false,
      }));

      const mediapipeWithMeta = mediapipeModels.map(model => ({
        ...model,
        runtime: 'mediapipe',
        multimodal: true,
        // Preserve category from model definition (small/large)
        // Add emoji to indicate multimodal support
        name: `🖼️ ${model.name}`,
      }));

      // Combine and return
      return [...mediapipeWithMeta, ...webllmWithMeta];
    } catch (error) {
      console.error('Error getting available models:', error);
      return [];
    }
  }

  /**
   * Load a model (automatically selects correct runtime)
   * @param {string} modelId - Model identifier
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<boolean>}
   */
  async load(modelId, onProgress = null) {
    // Determine which runtime to use
    const model = await this.findModel(modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Unload current model if switching runtimes
    if (this.currentRuntime && this.currentRuntimeType !== model.runtime) {
      await this.unload();
    }

    // Load model using appropriate runtime
    if (model.runtime === 'mediapipe') {
      this.currentRuntime = this.mediaPipeRuntime;
      this.currentRuntimeType = 'mediapipe';
      await this.mediaPipeRuntime.loadModel(modelId, onProgress);
    } else {
      this.currentRuntime = this.webLLMRuntime;
      this.currentRuntimeType = 'webllm';
      await this.webLLMRuntime.load(modelId, onProgress);
    }

    this.currentModelId = modelId;
    return true;
  }

  /**
   * Unload current model
   */
  async unload() {
    if (this.currentRuntime) {
      if (this.currentRuntimeType === 'mediapipe') {
        await this.currentRuntime.unloadModel();
      } else {
        await this.currentRuntime.unload();
      }
      this.currentRuntime = null;
      this.currentRuntimeType = null;
      this.currentModelId = null;
    }
  }

  /**
   * Check if model is loaded
   * @returns {boolean}
   */
  isLoaded() {
    if (!this.currentRuntime) {
      return false;
    }

    if (this.currentRuntimeType === 'mediapipe') {
      return this.currentRuntime.isLoaded;
    } else {
      return this.currentRuntime.isLoaded();
    }
  }

  /**
   * Get current model info
   * @returns {Object|null}
   */
  getCurrentModelInfo() {
    if (!this.currentRuntime) {
      return null;
    }

    if (this.currentRuntimeType === 'mediapipe') {
      const model = this.mediaPipeRuntime.availableModels.find(m => m.id === this.currentModelId);
      return model ? {
        id: model.id,
        name: model.name,
        size: model.size,
        multimodal: model.multimodal,
      } : null;
    } else {
      return this.currentRuntime.getCurrentModelInfo();
    }
  }

  /**
   * Generate chat response (streaming)
   * @param {Array|string} messages - Messages or prompt
   * @param {Function} onChunk - Chunk callback
   * @param {Object} options - Generation options
   * @param {Array} images - Optional array of image URLs (for MediaPipe multimodal)
   */
  async chatStream(messages, onChunk, options = {}, images = []) {
    if (!this.currentRuntime) {
      throw new Error('No model loaded');
    }

    // If using MediaPipe with images, use multimodal generation
    if (this.currentRuntimeType === 'mediapipe' && images && images.length > 0) {
      // Build multimodal input
      const multimodalInput = this.buildMultimodalInput(messages, images);
      await this.mediaPipeRuntime.generateMultimodal(multimodalInput, onChunk, options);
    } else {
      // Standard text-only generation
      await this.currentRuntime.chatStream(messages, onChunk, options);
    }
  }

  /**
   * Build multimodal input for MediaPipe
   * @param {Array|string} messages - Messages array
   * @param {Array} images - Array of image URLs
   * @returns {Array} Multimodal input array
   */
  buildMultimodalInput(messages, images) {
    // Convert messages to Gemma format with images
    const multimodalInput = ['<start_of_turn>user\n'];

    // Add images first if provided
    if (images && images.length > 0) {
      images.forEach(imageUrl => {
        multimodalInput.push({ imageSource: imageUrl });
        multimodalInput.push(' '); // Add space between images
      });
    }

    // Add text content
    if (typeof messages === 'string') {
      multimodalInput.push(messages);
    } else if (Array.isArray(messages)) {
      // Extract user message content
      const userMsg = messages.find(m => m.role === 'user');
      if (userMsg) {
        multimodalInput.push(userMsg.content);
      }
    }

    multimodalInput.push('<end_of_turn>\n<start_of_turn>model\n');

    return multimodalInput;
  }

  /**
   * Find model by ID across both runtimes
   * @param {string} modelId - Model ID
   * @returns {Promise<Object|null>}
   */
  async findModel(modelId) {
    const allModels = await this.getAvailableModels();
    return allModels.find(m => m.id === modelId);
  }

  /**
   * Check if current model supports multimodal
   * @returns {boolean}
   */
  supportsMultimodal() {
    if (this.currentRuntimeType === 'mediapipe') {
      return this.mediaPipeRuntime.supportsMultimodal();
    }
    return false;
  }

  /**
   * Get runtime status
   * @returns {Object}
   */
  getStatus() {
    if (!this.currentRuntime) {
      return {
        isLoaded: false,
        isLoading: false,
        currentModel: null,
        runtimeType: null,
        supportsMultimodal: false,
      };
    }

    return {
      ...this.currentRuntime.getStatus(),
      runtimeType: this.currentRuntimeType,
      supportsMultimodal: this.supportsMultimodal(),
    };
  }

  /**
   * Check WebGPU support (for MediaPipe)
   * @returns {Promise<boolean>}
   */
  async checkWebGPUSupport() {
    return await this.mediaPipeRuntime.checkWebGPUSupport();
  }
}
