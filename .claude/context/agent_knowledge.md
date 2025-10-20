# Agent Knowledge Base

**Last Updated:** 2025-10-19

This document contains accumulated learnings, best practices, and patterns discovered by agents during development.

---

## General Best Practices

### Code Organization
- Follow BaseRuntime pattern for all language runtimes
- Use BaseDatabase pattern for all database integrations
- Implement lazy loading for all heavy resources (WASM, etc.)
- Keep components focused and single-purpose

### Error Handling
- Always provide helpful error messages
- Include line/column numbers when available
- Capture and log all errors
- Never let errors crash the application

### Testing
- Aim for 80%+ code coverage
- Test edge cases thoroughly
- Write integration tests for cross-component interactions
- Use E2E tests for critical user workflows

### Documentation
- Use JSDoc for all public APIs
- Include usage examples
- Document edge cases and limitations
- Keep README files up to date

---

## Runtime Implementation Learnings

### WASM Loading
**Best Practice:** Lazy load WASM runtimes to minimize initial page load
- Load on first use, not on page load
- Show loading progress to user
- Cache loaded runtimes in memory
- Handle CDN failures gracefully with fallbacks

**Example:**
```javascript
async load() {
  if (this.loaded) return;
  this.log('Loading runtime...', 'info');
  // Load from CDN with timeout and fallback
}
```

### Output Capture
**Pattern:** Use callback pattern for stdout/stderr capture
- Set up output callbacks during runtime initialization
- Stream output in real-time for better UX
- Buffer output for later retrieval if needed

---

## Database Integration Learnings

### Query Performance
**Lesson:** DuckDB is 10-100x faster than SQLite for analytics workloads
- Use SQLite for general-purpose queries
- Use DuckDB for aggregations, joins, large datasets
- Benchmark both for specific use cases

### Data Import
**Pattern:** Auto-detect types when importing CSV
- Parse sample rows to infer column types
- Provide override options for user
- Handle edge cases (empty strings, nulls, etc.)

---

## UI/UX Learnings

### Monaco Editor Integration
**Gotcha:** Monaco requires careful CDN loading
- Use loader.js to bootstrap
- Configure paths correctly
- Handle loading errors gracefully

### Performance
**Optimization:** Virtual scrolling for long output
- Render only visible items
- Update on scroll events
- Massive performance improvement for large outputs

---

## Storage Learnings

### IndexedDB
**Best Practice:** Always handle quota exceeded errors
- Monitor storage usage proactively
- Warn users before hitting quota
- Provide cleanup options
- Gracefully degrade if quota exceeded

### Auto-Save
**Pattern:** Debounce save operations
- Don't save on every keystroke
- Use 2-second debounce
- Provide visual feedback (saving/saved)
- Force save on navigation away

---

## Monetization Learnings

### Server-Controlled Delivery
**Architecture:** Use Cloudflare Workers for WASM delivery
- Authenticate with JWT tokens
- Verify subscription with Stripe API
- Cache authenticated responses (1 hour)
- Log usage for analytics

**Why not license keys:** Users can cache WASM files locally and keep access after cancellation. Server-controlled delivery prevents this.

---

## Testing Learnings

### Test Organization
**Pattern:** Follow the test pyramid
- 80% unit tests (fast, isolated)
- 15% integration tests (component interactions)
- 5% E2E tests (critical user workflows)

### Mocking
**Best Practice:** Mock external dependencies
- Mock WASM runtimes in unit tests
- Mock IndexedDB for storage tests
- Use fake-indexeddb package for realistic testing

---

## Performance Learnings

### Bundle Optimization
**Optimization:** Code splitting is critical
- Main bundle < 100KB
- Lazy load Monaco Editor
- Lazy load all runtimes
- Use dynamic imports

### Memory Management
**Lesson:** Clean up runtimes when done
- Call dispose() on unused runtimes
- Clear large result sets
- Monitor memory usage
- Alert on memory leaks

---

## Security Learnings

### Content Security Policy
**Requirement:** CSP must allow 'unsafe-eval' for WASM
- Required for WebAssembly.compile()
- Restrict other resources strictly
- Monitor CSP violations

### Input Validation
**Critical:** Never trust user input
- Validate all inputs server-side
- Sanitize HTML before rendering
- Use parameterized queries for SQL
- Escape special characters

---

## Deployment Learnings

### CI/CD
**Pattern:** Deploy on every commit to main
- Run tests first
- Deploy to staging automatically
- Manual approval for production
- Automatic rollback on errors

### Environment Variables
**Best Practice:** Never commit secrets
- Use environment variables
- Different configs for dev/staging/prod
- Validate all required vars on startup

---

## Common Pitfalls to Avoid

❌ **Loading all runtimes at once** - Use lazy loading
❌ **Ignoring quota exceeded** - Monitor and handle proactively
❌ **Synchronous operations** - Use async/await everywhere
❌ **Missing error handling** - Catch and handle all errors
❌ **Hardcoded values** - Use configuration
❌ **Not cleaning up** - Dispose resources when done
❌ **Skipping tests** - Tests prevent regressions
❌ **Poor error messages** - Be specific and helpful

---

## Patterns Library

### 1. Lazy Loading Pattern
```javascript
async loadWhenNeeded(name) {
  if (!this.loaded[name]) {
    await this.load(name);
    this.loaded[name] = true;
  }
  return this.instances[name];
}
```

### 2. Callback Pattern
```javascript
setCallback(callback) {
  this.callback = callback;
}

notify(data) {
  if (this.callback) {
    this.callback(data);
  }
}
```

### 3. Debounce Pattern
```javascript
debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

---

## Future Improvements

### Identified Opportunities
1. Implement WebWorkers for heavy computations
2. Add Service Worker for offline support
3. Implement result caching for repeated queries
4. Add collaborative editing (WebRTC)
5. Implement undo/redo for editor

### Technical Debt
1. Refactor RuntimeManager (too complex)
2. Improve error messages across all runtimes
3. Add more comprehensive E2E tests
4. Optimize bundle size further

---

**This document is continuously updated as agents learn from development.**
