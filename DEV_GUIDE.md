# DrLee IDE - Developer Guide

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The IDE will be available at http://localhost:3000/

### Development Commands

```bash
npm run dev      # Start Vite dev server (with HMR)
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run unit tests
npm run test:ui  # Run tests with UI
npm run lint     # Lint code
```

## Current Features (Month 1 - 80% Complete)

### ✅ Completed
- **Monaco Editor Integration** - Full VS Code editor with syntax highlighting
- **JavaScript Runtime** - Native browser JavaScript execution
- **TypeScript Support** - Transpiles to JavaScript
- **UI Layout** - Responsive layout with resizable panels
- **Output Panel** - Multi-channel output (stdout, stderr, info, success, error)
- **Execution Flow** - Run code with Ctrl+Enter or Run button

### ⏳ In Progress
- **Python Runtime (Pyodide)** - Next task (T002)

### 🔜 Coming Soon (Month 2-3)
- Lua runtime (Wasmoon)
- SQLite database (sql.js)
- File persistence (IndexedDB)
- Auto-save functionality
- Ruby runtime (ruby.wasm)
- PHP runtime (php-wasm)

## Testing the IDE

### Try JavaScript

```javascript
// Basic output
console.log("Hello from DrLee IDE!");

// Return values
42 + 8

// Error handling
throw new Error("Test error");
```

### Keyboard Shortcuts

- **Ctrl+Enter** (Cmd+Enter on Mac) - Run code
- **Ctrl+S** (Cmd+S on Mac) - Save (coming soon)

## Project Structure

```
DrLeeIDE/
├── src/
│   ├── runtimes/
│   │   ├── BaseRuntime.js              # Abstract base for all runtimes
│   │   ├── RuntimeManager.js           # Runtime orchestration
│   │   ├── languages/
│   │   │   └── JavaScriptRuntime.js    # JavaScript runtime implementation
│   │   └── databases/                  # Future: Database runtimes
│   │
│   ├── ui/
│   │   ├── components/
│   │   │   ├── Editor.js               # Monaco Editor wrapper
│   │   │   └── OutputPanel.js          # Output display component
│   │   └── styles/
│   │       └── main.css                # All styles (CSS variables)
│   │
│   ├── storage/                        # Future: IndexedDB file storage
│   ├── utils/                          # Utilities
│   └── main.js                         # Application entry point
│
├── public/
│   └── favicon.svg
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .claude/                            # AI agent system
│   ├── context/                        # Shared context files
│   └── [agent files]
│
├── docs/                               # Project documentation
├── index.html                          # Entry HTML
├── package.json
└── vite.config.js
```

## Architecture Patterns

### BaseRuntime Pattern

All language runtimes extend `BaseRuntime`:

```javascript
import BaseRuntime from '../BaseRuntime.js';

export default class MyLanguageRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('mylanguage', config);
  }

  async load() {
    // Load WASM runtime
    this.runtime = await loadMyLanguageWasm();
    this.loaded = true;
  }

  async execute(code, options = {}) {
    const startTime = performance.now();
    // Execute code
    const result = await this.runtime.run(code);
    return {
      success: true,
      output: result,
      returnValue: result,
      error: null,
      executionTime: performance.now() - startTime
    };
  }
}
```

### Adding a New Language

1. Create `src/runtimes/languages/YourLanguageRuntime.js` extending `BaseRuntime`
2. Implement `load()` and `execute()` methods
3. Register in `RuntimeManager.js`:
   ```javascript
   this.registry = {
     yourlanguage: {
       class: YourLanguageRuntime,
       displayName: 'Your Language',
       tier: 'free', // or 'pro'
       lazy: true,
     },
   };
   ```
4. Add to language selector in `index.html`

## Debugging

### Browser DevTools

- **Console** - Application logs
- **Network** - Monaco CDN loading
- **Application > IndexedDB** - Future: Stored files
- **Performance** - Runtime initialization timing

### Common Issues

**"No runtime loaded" error:**
- Fixed! RuntimeManager now properly initializes currentRuntime

**Monaco Editor not loading:**
- Check browser console for CDN errors
- Ensure internet connection for CDN access

**Code execution slow:**
- First run loads WASM runtime (expected delay)
- Subsequent runs should be fast

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial page load | < 3s | ~1s ✅ |
| Monaco load | < 2s | ~1s ✅ |
| JS execution | < 100ms | ~50ms ✅ |
| Python load | < 5s | Coming soon |

## Next Steps

1. **Implement Python Runtime** (T002) - See `.claude/context/task_queue.json`
2. **Add Lua Runtime** - Wasmoon integration
3. **Implement SQLite** - sql.js integration
4. **Build File Persistence** - IndexedDB storage

## Resources

- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Pyodide Docs](https://pyodide.org/)
- [Vite Docs](https://vitejs.dev/)
- [Architecture Decisions](.claude/context/architecture_decisions.md)
- [Product Requirements](docs/01-prd/PRODUCT_REQUIREMENTS.md)

## Getting Help

- Check `.claude/context/agent_knowledge.md` for best practices
- Review `.claude/AGENT_SYSTEM_COMPLETE.md` for agent system overview
- See architecture decision records in `.claude/context/architecture_decisions.md`
