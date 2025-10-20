import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    headers: {
      // Required for SharedArrayBuffer (needed by some WASM runtimes)
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Monaco Editor is large, so we split it out
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: [
      'pyodide',
      '@duckdb/duckdb-wasm',
      '@electric-sql/pglite',
      'sql.js',
      'wasmoon',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
      ],
    },
  },
});
