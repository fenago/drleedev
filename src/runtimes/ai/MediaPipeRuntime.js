/**
 * MediaPipeRuntime - Google MediaPipe LLM Inference for Gemma 3 multimodal AI
 *
 * Supports Gemma 3 models with multimodal capabilities (text + images + audio)
 * Runs completely in-browser using WebGPU/WASM
 *
 * Documentation: https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js
 */

import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai';

export default class MediaPipeRuntime {
  constructor() {
    this.llmInference = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.currentModel = null;
    this.genai = null;

    // Available Gemma 3 models (hosted on Cloudflare R2 CDN)
    this.availableModels = [
      {
        name: 'Gemma 3n E2B (1.5B)',
        id: 'gemma-3n-E2B',
        url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm',
        size: '2.8GB',
        multimodal: true,
        category: 'large',
        description: 'Best quality multimodal model for complex tasks, code review, and image analysis',
      },
      {
        name: 'Gemma 3 270M Q8',
        id: 'gemma-3-270m-q8',
        url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task',
        size: '263MB',
        multimodal: true,
        category: 'small',
        description: 'Fast, lightweight model for quick responses and simple code generation',
      },
    ];
  }

  /**
   * Get list of available models
   * @returns {Array} Array of model objects
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Load MediaPipe LLM model
   * @param {string} modelId - Model identifier
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<boolean>} Success status
   */
  async loadModel(modelId, onProgress = null) {
    if (this.isLoading) {
      throw new Error('Model is already loading');
    }

    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.isLoading = true;
    this.currentModel = modelId;

    try {
      // Report progress
      if (onProgress) {
        onProgress({ status: 'initializing', progress: 0 });
      }

      // Initialize FilesetResolver (WASM files)
      if (!this.genai) {
        if (onProgress) {
          onProgress({ status: 'loading_wasm', progress: 10 });
        }

        this.genai = await FilesetResolver.forGenAiTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
        );
      }

      // Download and load model
      if (onProgress) {
        onProgress({ status: 'downloading_model', progress: 20 });
      }

      this.llmInference = await LlmInference.createFromOptions(this.genai, {
        baseOptions: {
          modelAssetPath: model.url,
        },
        maxTokens: 1000,
        topK: 40,
        temperature: 0.8,
        randomSeed: 101,
        // Enable multimodal support for Gemma 3
        maxNumImages: 5, // Support up to 5 images per prompt
        supportAudio: true, // Enable audio input
      });

      if (onProgress) {
        onProgress({ status: 'ready', progress: 100 });
      }

      this.isLoaded = true;
      this.isLoading = false;

      return true;
    } catch (error) {
      this.isLoading = false;
      this.isLoaded = false;
      console.error('MediaPipe model load error:', error);
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  /**
   * Unload current model
   */
  async unloadModel() {
    if (this.llmInference) {
      // MediaPipe doesn't have explicit unload, just clear reference
      this.llmInference = null;
    }
    this.isLoaded = false;
    this.currentModel = null;
  }

  /**
   * Generate text response (streaming)
   * @param {Array|string} messages - Messages array or prompt string
   * @param {Function} onChunk - Callback for streaming chunks
   * @param {Object} options - Generation options
   */
  async chatStream(messages, onChunk, options = {}) {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      // Convert messages to MediaPipe format
      const prompt = this.convertMessagesToPrompt(messages);

      // Apply options to model parameters
      if (options.temperature !== undefined) {
        this.llmInference.setOptions({ temperature: options.temperature });
      }
      if (options.maxTokens !== undefined) {
        this.llmInference.setOptions({ maxTokens: options.maxTokens });
      }
      if (options.topP !== undefined) {
        this.llmInference.setOptions({ topK: Math.round(options.topP * 40) });
      }

      // Generate response with streaming
      await this.llmInference.generateResponse(
        prompt,
        (partialResult, done) => {
          if (onChunk) {
            onChunk(partialResult, done);
          }
        }
      );
    } catch (error) {
      console.error('MediaPipe generation error:', error);
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Generate text response with multimodal input (images + text)
   * @param {Array} multimodalInput - Array of text strings and {imageSource: url} objects
   * @param {Function} onChunk - Callback for streaming chunks
   * @param {Object} options - Generation options
   */
  async generateMultimodal(multimodalInput, onChunk, options = {}) {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      // Apply options
      if (options.temperature !== undefined) {
        this.llmInference.setOptions({ temperature: options.temperature });
      }
      if (options.maxTokens !== undefined) {
        this.llmInference.setOptions({ maxTokens: options.maxTokens });
      }

      // Generate response with multimodal input
      await this.llmInference.generateResponse(
        multimodalInput,
        (partialResult, done) => {
          if (onChunk) {
            onChunk(partialResult, done);
          }
        }
      );
    } catch (error) {
      console.error('MediaPipe multimodal generation error:', error);
      throw new Error(`Multimodal generation failed: ${error.message}`);
    }
  }

  /**
   * Convert messages array to Gemma prompt format
   * @param {Array|string} messages - Messages array or string
   * @returns {string} Formatted prompt
   */
  convertMessagesToPrompt(messages) {
    // If already a string, return as-is
    if (typeof messages === 'string') {
      return messages;
    }

    // Convert standard messages format to Gemma format
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages go at the start
        prompt = `<start_of_turn>user\n${msg.content}<end_of_turn>\n` + prompt;
      } else if (msg.role === 'user') {
        prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
      }
    }

    // Add model turn prefix
    prompt += '<start_of_turn>model\n';

    return prompt;
  }

  /**
   * Check if model supports multimodal input
   * @returns {boolean}
   */
  supportsMultimodal() {
    if (!this.currentModel) return false;
    const model = this.availableModels.find(m => m.id === this.currentModel);
    return model?.multimodal || false;
  }

  /**
   * Check WebGPU support
   * @returns {Promise<boolean>}
   */
  async checkWebGPUSupport() {
    if (!navigator.gpu) {
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get runtime status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      currentModel: this.currentModel,
      supportsMultimodal: this.supportsMultimodal(),
    };
  }
}
