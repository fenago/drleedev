/**
 * Vitest setup file
 * Run before all tests
 */

// Mock browser APIs that aren't available in jsdom
global.performance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB mock
  },
};

// Mock Monaco Editor (not available in test environment)
global.monaco = {
  editor: {
    create: () => ({
      getValue: () => '',
      setValue: () => {},
      getModel: () => ({
        getLanguageId: () => 'javascript',
      }),
      onDidChangeModelContent: () => {},
      onDidChangeCursorPosition: () => {},
      addCommand: () => {},
      dispose: () => {},
      focus: () => {},
    }),
    setModelLanguage: () => {},
    setTheme: () => {},
  },
  KeyMod: {
    CtrlCmd: 1,
  },
  KeyCode: {
    Enter: 2,
    KeyS: 3,
  },
};

// Suppress console warnings during tests (optional)
global.console = {
  ...console,
  warn: () => {}, // Suppress warnings
  // Keep error and log for debugging
};
