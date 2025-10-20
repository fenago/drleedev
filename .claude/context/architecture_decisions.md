# Architecture Decision Records (ADRs)

**Last Updated:** 2025-10-19

This document tracks all major architectural decisions made during DrLee IDE development.

---

## ADR-001: Runtime System Architecture

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent

### Context

Need extensible architecture for supporting 40+ programming languages with minimal coupling and maximum maintainability.

### Decision

Use abstract BaseRuntime class with lazy-loaded language-specific implementations managed by RuntimeManager.

### Rationale

1. **Extensibility:** New languages are just new BaseRuntime subclasses
2. **Performance:** Lazy loading keeps initial bundle small (<100KB)
3. **Consistency:** All runtimes have same interface (load, execute, dispose)
4. **Maintainability:** Clear separation of concerns
5. **Testability:** Easy to mock and test independently

### Consequences

**Positive:**
- New language support requires minimal changes
- Consistent API across all languages
- Easy to test in isolation
- Memory efficient (load only what's needed)

**Negative:**
- Requires discipline to maintain pattern
- All runtimes must implement same interface
- Some language-specific features may need workarounds

**Neutral:**
- RuntimeManager becomes single point of coordination
- Need to document pattern clearly for contributors

### Implementation

```javascript
export default class BaseRuntime {
  async load() { /* Must implement */ }
  async execute(code, options) { /* Must implement */ }
  async dispose() { /* Must implement */ }
}
```

---

## ADR-002: Database Persistence Strategy

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Database Agent

### Context

Need to persist database state (SQLite .db files, DuckDB state) across browser sessions without backend servers.

### Decision

Use IndexedDB to store database files as ArrayBuffers with compression.

### Rationale

1. **Browser-native:** IndexedDB available in all modern browsers
2. **Capacity:** Can store large files (typically 50MB-1GB quota)
3. **Performance:** Fast read/write operations
4. **Reliability:** Transaction-based, ACID guarantees
5. **No server needed:** Fully client-side

### Consequences

**Positive:**
- No backend infrastructure required
- Works offline
- Fast access to persisted databases
- Reliable storage with transactions

**Negative:**
- Storage quota limitations
- No cross-device sync without additional solution
- Complexity of quota management

**Neutral:**
- Need to handle quota exceeded errors
- Users must download .db files for backups

---

## ADR-003: Monetization Architecture (Server-Controlled WASM Delivery)

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Monetization Agent

### Context

Need secure, revocable access control for premium language runtimes without relying on license keys that can be copied.

### Decision

Implement server-controlled WASM delivery via Cloudflare Workers with JWT authentication and active subscription verification.

### Rationale

1. **Security:** WASM files never cached locally for premium runtimes
2. **Revocability:** Access immediately revoked on subscription cancellation
3. **Scalability:** Cloudflare Workers handle global edge delivery
4. **Trackability:** Full usage analytics
5. **Cost-effective:** ~$100/month at 10,000 subscribers

### Rejected Alternatives

**License Keys:**
- Users can cache WASM files locally
- Access continues after cancellation
- Hard to revoke
- Easy to share keys

**Browser-only DRM:**
- Doesn't exist for WASM
- Can be bypassed
- Not reliable

### Consequences

**Positive:**
- Secure revenue protection
- Immediate access revocation
- Full usage tracking
- Scalable to millions of users

**Negative:**
- Requires internet connection for premium runtimes
- Cloudflare Workers infrastructure dependency
- Slight latency on first load (cached after)

**Neutral:**
- Need to handle offline gracefully
- Free runtimes still work offline

---

## ADR-004: Monaco Editor Integration

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Frontend Agent

### Context

Need professional code editor with syntax highlighting, IntelliSense, and multi-language support.

### Decision

Use Monaco Editor (VS Code engine) loaded from CDN with lazy loading.

### Rationale

1. **Feature-rich:** Industry-standard editor
2. **Multi-language:** Built-in support for 50+ languages
3. **IntelliSense:** Auto-completion out of the box
4. **Familiar:** Developers know VS Code
5. **Well-maintained:** Microsoft-backed project

### Consequences

**Positive:**
- Professional editor experience
- Extensive language support
- Active development and community
- Familiar to developers

**Negative:**
- Large bundle size (~500KB gzipped)
- CDN dependency
- Complex configuration

**Mitigation:**
- Lazy load Monaco (not in initial bundle)
- Use CDN with fallback
- Only load needed languages

---

## ADR-005: Testing Strategy (Test Pyramid)

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Testing Agent

### Context

Need comprehensive testing strategy that balances coverage, speed, and maintenance burden.

### Decision

Follow test pyramid: 80% unit tests, 15% integration tests, 5% E2E tests.

### Rationale

1. **Speed:** Unit tests are fast (milliseconds)
2. **Coverage:** Unit tests catch most bugs
3. **Maintenance:** Unit tests easier to maintain
4. **Confidence:** E2E tests validate critical flows
5. **Balance:** Right mix of speed and coverage

### Consequences

**Positive:**
- Fast test suite (< 5 minutes)
- High confidence in code quality
- Easy to maintain
- Catches bugs early

**Negative:**
- E2E tests can be flaky
- Integration tests slower than unit tests
- Requires discipline to maintain ratio

**Neutral:**
- Need to choose which flows get E2E tests
- Should re-evaluate ratio over time

---

## ADR-006: State Management (No Framework)

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Frontend Agent

### Context

Need to manage application state (current runtime, files, settings, etc.) without framework overhead.

### Decision

Use vanilla JavaScript with custom manager classes (RuntimeManager, FileManager, etc.).

### Rationale

1. **Simplicity:** No framework learning curve
2. **Bundle size:** Avoid framework overhead
3. **Performance:** Direct DOM manipulation faster
4. **Flexibility:** Not locked into framework patterns
5. **Maintainability:** Easier to understand and debug

### Rejected Alternatives

**React/Vue:**
- Framework overhead (~40KB+)
- Unnecessary complexity for this use case
- Can add later if needed

**Redux/Vuex:**
- Overkill for state complexity
- Adds boilerplate

### Consequences

**Positive:**
- Small bundle size
- Fast performance
- Simple mental model
- Easy to onboard developers

**Negative:**
- Must implement patterns manually
- No framework ecosystem benefits
- More code to write

**Neutral:**
- Can add framework later if needed
- May need custom reactivity system

---

## ADR-007: Deployment Platform (Netlify Primary)

**Status:** ✅ Accepted
**Date:** 2025-10-19
**Decision Makers:** Architecture Agent, Deployment Agent

### Context

Need reliable, fast, cost-effective platform for deploying static site with Cloudflare Workers for premium features.

### Decision

Deploy static site to Netlify with Cloudflare Workers for WASM delivery.

### Rationale

1. **Netlify:**
   - Free tier generous
   - Excellent CDN
   - Easy CI/CD integration
   - Preview deployments
   - $0-19/month at scale

2. **Cloudflare Workers:**
   - Edge computing
   - Fast WASM delivery
   - $5-100/month at scale

### Consequences

**Positive:**
- Fast global delivery
- Low cost
- Easy deployments
- Reliable infrastructure

**Negative:**
- Two platforms to manage
- Cloudflare Workers has compute limits
- Vendor lock-in (mild)

**Mitigation:**
- Netlify can be swapped for Vercel easily
- Workers can be replaced with Lambda@Edge

---

## Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Runtime System Architecture | ✅ Accepted | 2025-10-19 |
| ADR-002 | Database Persistence Strategy | ✅ Accepted | 2025-10-19 |
| ADR-003 | Server-Controlled WASM Delivery | ✅ Accepted | 2025-10-19 |
| ADR-004 | Monaco Editor Integration | ✅ Accepted | 2025-10-19 |
| ADR-005 | Testing Strategy | ✅ Accepted | 2025-10-19 |
| ADR-006 | State Management | ✅ Accepted | 2025-10-19 |
| ADR-007 | Deployment Platform | ✅ Accepted | 2025-10-19 |

---

**Future ADRs will be added as architectural decisions are made during development.**
