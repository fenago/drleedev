# AI Assistant Integration Plan

## Overview
Integrate DrleeWebSLM's browser-based LLM capabilities into DrLee IDE to provide AI-powered code assistance without requiring API keys or backend servers.

## Architecture

### Components to Add

1. **AIAssistantRuntime** (`src/runtimes/ai/AIAssistantRuntime.js`)
   - WebLLM integration with WebGPU
   - WASM fallback via wllama
   - Model management and caching
   - Streaming response handling

2. **AIChatPanel** (`src/ui/components/AIChatPanel.js`)
   - Chat interface UI
   - Message history
   - Model selector
   - Streaming message display

3. **AIContextManager** (`src/ai/AIContextManager.js`)
   - Manages code context for AI
   - Tracks open files, current language
   - Provides relevant context to AI

4. **AIActions** (`src/ai/AIActions.js`)
   - Code explanation
   - Code generation
   - Bug fixing
   - Code review
   - Refactoring suggestions

## Dependencies

```json
{
  "@mlc-ai/web-llm": "^0.2.79",
  "@wllama/wllama": "^2.3.5"
}
```

## File Structure

```
DrLeeIDE/
├── src/
│   ├── runtimes/
│   │   └── ai/
│   │       └── AIAssistantRuntime.js
│   ├── ai/
│   │   ├── AIContextManager.js
│   │   ├── AIActions.js
│   │   └── prompts/
│   │       ├── code-explanation.js
│   │       ├── code-generation.js
│   │       ├── bug-fixing.js
│   │       └── code-review.js
│   └── ui/
│       └── components/
│           └── AIChatPanel.js
└── docs/
    └── ai-assistant-guide.md
```

## Features to Implement

### Phase 1: Basic Chat (Week 1)
- [ ] Chat panel UI
- [ ] WebLLM integration
- [ ] Model selection
- [ ] Basic Q&A

### Phase 2: Code Assistance (Week 2)
- [ ] Code explanation
- [ ] Code generation
- [ ] Bug fixing suggestions
- [ ] Code review

### Phase 3: Advanced Features (Week 3)
- [ ] Context-aware responses
- [ ] Function calling
- [ ] Multi-file analysis
- [ ] Smart autocomplete

## UI Design

### Chat Panel Layout
```
┌─────────────────────────────┐
│ AI Assistant       [Model ▼]│
├─────────────────────────────┤
│                             │
│ User: Explain this code     │
│                             │
│ AI: This Python function... │
│     - Takes a list...       │
│     - Returns...            │
│                             │
├─────────────────────────────┤
│ [Type a message...]    [→]  │
└─────────────────────────────┘
```

### Quick Actions
- Right-click on code → "Ask AI"
- Toolbar button → "AI Assistant"
- Keyboard shortcut → Ctrl+Shift+A

## Model Strategy

### Default Model: TinyLlama 1.1B
- Fast loading (~500MB)
- Low memory usage
- Good for basic assistance

### Optional Models (User Choice):
- **Phi-2** (2.7B) - Better quality, still fast
- **Mistral 7B** - High quality, requires more RAM
- **Llama 3.1 8B** - Best quality, requires 8GB+ RAM

## Performance Considerations

### Model Caching
- Service Worker caches model shards
- First load: 30s-2min (depending on model)
- Subsequent loads: < 5 seconds

### Memory Requirements
- TinyLlama: ~2GB RAM
- Phi-2: ~4GB RAM
- Mistral 7B: ~8GB RAM
- Llama 3.1 8B: ~10GB RAM

### WebGPU vs WASM
- **WebGPU**: Fast inference (10-50 tokens/sec)
- **WASM**: Slower fallback (2-10 tokens/sec)
- Auto-detect and fallback gracefully

## Integration Steps

### Step 1: Install Dependencies
```bash
npm install @mlc-ai/web-llm @wllama/wllama
```

### Step 2: Create AIAssistantRuntime
```javascript
// src/runtimes/ai/AIAssistantRuntime.js
import * as webllm from "@mlc-ai/web-llm";

export default class AIAssistantRuntime {
  constructor() {
    this.engine = null;
    this.currentModel = null;
  }

  async load(modelId = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC") {
    this.engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        console.log(`Loading model: ${progress.progress}%`);
      }
    });
    this.currentModel = modelId;
  }

  async chat(messages, options = {}) {
    const completion = await this.engine.chat.completions.create({
      messages,
      stream: options.stream || false,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    });
    return completion;
  }
}
```

### Step 3: Add Chat Panel UI
```javascript
// src/ui/components/AIChatPanel.js
export default class AIChatPanel {
  constructor(container, aiRuntime) {
    this.container = container;
    this.aiRuntime = aiRuntime;
    this.messages = [];
  }

  init() {
    this.createUI();
    this.attachEventListeners();
  }

  async sendMessage(userMessage) {
    this.addMessage('user', userMessage);

    const response = await this.aiRuntime.chat([
      { role: 'user', content: userMessage }
    ], { stream: true });

    // Handle streaming response
    for await (const chunk of response) {
      this.updateAssistantMessage(chunk.choices[0].delta.content);
    }
  }
}
```

### Step 4: Integrate into Main App
```javascript
// src/main.js
import AIAssistantRuntime from './runtimes/ai/AIAssistantRuntime.js';
import AIChatPanel from './ui/components/AIChatPanel.js';

class DrLeeIDE {
  async init() {
    // ... existing code ...

    // Initialize AI Assistant
    this.aiRuntime = new AIAssistantRuntime();
    this.aiChatPanel = new AIChatPanel(
      document.getElementById('ai-chat-container'),
      this.aiRuntime
    );

    await this.aiChatPanel.init();
  }
}
```

## Context Building

### Code Context Template
```javascript
const codeContext = {
  currentFile: {
    name: 'example.py',
    language: 'python',
    content: '...',
  },
  selection: '...',
  cursorPosition: { line: 10, column: 5 },
  openFiles: [...],
  projectType: 'web-app',
};

const prompt = `
You are an AI coding assistant for DrLee IDE.

Current file: ${codeContext.currentFile.name} (${codeContext.currentFile.language})
Selected code:
\`\`\`${codeContext.currentFile.language}
${codeContext.selection}
\`\`\`

User question: ${userMessage}

Provide a helpful response focusing on code quality and best practices.
`;
```

## Security Considerations

1. **Model Isolation**: Models run in browser, no data sent to servers
2. **Local Storage**: Chat history stored locally only
3. **No API Keys**: No credentials needed
4. **Privacy**: User code never leaves the browser

## Browser Compatibility

| Browser | WebGPU | WASM Fallback |
|---------|--------|---------------|
| Chrome 113+ | ✅ | ✅ |
| Edge 113+ | ✅ | ✅ |
| Safari 17+ | ⚠️ (experimental) | ✅ |
| Firefox | ❌ (behind flag) | ✅ |

## Testing Plan

1. **Unit Tests**: AI runtime, context manager
2. **Integration Tests**: Chat panel, code actions
3. **Performance Tests**: Model loading, inference speed
4. **Browser Tests**: WebGPU, WASM fallback

## Rollout Strategy

### Beta Release
- Default: AI assistant disabled
- Enable via Settings → Experimental Features
- Collect user feedback

### Full Release
- Default: TinyLlama model
- Easy model switching
- Comprehensive documentation

## Success Metrics

- Model load time < 30 seconds (first load)
- Inference speed > 10 tokens/second (WebGPU)
- User satisfaction > 80%
- Crash rate < 1%

## Future Enhancements

1. **Multi-turn conversations** with context memory
2. **Project-wide analysis** (understand entire codebase)
3. **Custom prompts** (user-defined AI behaviors)
4. **Code completion** inline in editor
5. **Test generation** automated test writing
6. **Documentation generation** auto-generate docs

## Resources

- WebLLM Docs: https://github.com/mlc-ai/web-llm
- DrleeWebSLM: https://github.com/fenago/DrleeWebSLM
- WebGPU Spec: https://www.w3.org/TR/webgpu/
