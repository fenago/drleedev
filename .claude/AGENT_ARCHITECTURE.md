# Claude Code Subagent Architecture
## DrLee IDE - Intelligent Agent System Design

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Agent Design Specification

---

## 🎯 Overview

This document defines the complete agent architecture for building DrLee IDE. Each agent is specialized, can work autonomously, and can chain with other agents for complex tasks.

**Key Principles:**
- **Specialization**: Each agent has a specific domain of expertise
- **Context Sharing**: All agents access shared project context
- **Chaining**: Agents can delegate to other agents
- **Learning**: Meta agent improves all agents over time
- **Validation**: Analysis agent verifies all outputs

---

## 🏗️ Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     META AGENT                              │
│           (Updates & improves all agents)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION AGENT                         │
│         (Coordinates work, manages workflow)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                 ┌──────────────────┐
│ ARCHITECTURE     │                 │ PROJECT MANAGER  │
│ AGENTS           │                 │ AGENT            │
└──────────────────┘                 └──────────────────┘
        ↓                                       ↓
┌─────────────────────────────────────────────────────────────┐
│              DEVELOPMENT AGENTS                             │
│  Frontend | Runtime | Storage | Database | API             │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│              QUALITY AGENTS                                 │
│  Testing | Code Review | Performance | Security            │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│              DEPLOYMENT AGENTS                              │
│  Deployment | Monitoring | Documentation                   │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│                 ANALYSIS AGENT                              │
│           (Validates all outputs)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Agent Roster (16 Specialized Agents)

### **Tier 0: Meta & Orchestration (2 agents)**

#### 1. **Meta Agent** 🧠
**Purpose:** Learns from all agent activities and improves agent prompts/capabilities over time

**Capabilities:**
- Monitor all agent outputs and success rates
- Identify patterns and improvement opportunities
- Update agent prompts and instructions
- Add new tools to agent configurations
- Track agent performance metrics
- Create new agents when needed

**MCP Tools:** Read, Write, Edit, Grep, Glob, WebFetch, Context7
**Outputs:** Updated agent files, performance reports
**Triggers:** Weekly review, after major milestones
**Context Needs:** All agent logs, project state

**Why:** Continuous improvement system that makes all agents smarter over time

---

#### 2. **Orchestration Agent** 🎭
**Purpose:** Coordinates complex multi-agent workflows, manages task delegation

**Capabilities:**
- Break down complex tasks into agent-specific subtasks
- Determine optimal agent for each task
- Manage agent handoffs and context passing
- Track progress across multiple agents
- Resolve conflicts between agents
- Ensure task completion

**MCP Tools:** Read, Write, TodoWrite, Task (all subagents), Grep, Glob
**Outputs:** Task delegation plans, workflow status
**Triggers:** Complex tasks requiring multiple agents
**Context Needs:** Project roadmap, agent capabilities, current tasks

**Why:** Essential for coordinating complex features that require multiple specialists

**Agent Chaining Example:**
```
User: "Implement Python runtime with database support"
Orchestration → Architecture Agent (design)
             → Runtime Agent (implement)
             → Database Agent (integrate)
             → Testing Agent (verify)
             → Analysis Agent (validate)
```

---

### **Tier 1: Strategic Planning (2 agents)**

#### 3. **Project Manager Agent** 📊
**Purpose:** Manages project timeline, tracks progress, maintains roadmap

**Capabilities:**
- Track development progress against roadmap
- Manage task prioritization (P0/P1/P2)
- Monitor milestone completion
- Identify blockers and risks
- Update project documentation
- Generate status reports

**MCP Tools:** Read, Write, Edit, TodoWrite, Grep, Glob
**Outputs:** Status reports, updated roadmaps, risk assessments
**Triggers:** Weekly reviews, milestone completions
**Context Needs:** PRD, roadmap, all agent outputs

**Why:** Keeps project on track, ensures alignment with goals

---

#### 4. **Architecture Agent** 🏛️
**Purpose:** Designs system architecture, makes technical decisions

**Capabilities:**
- Design component architecture
- Define data flow patterns
- Make technology stack decisions
- Create architecture diagrams
- Review architectural changes
- Ensure scalability and maintainability

**MCP Tools:** Read, Write, Edit, Grep, Glob, WebFetch, Context7
**Outputs:** Architecture docs, component designs, technical decisions
**Triggers:** New features, major changes
**Context Needs:** Full system architecture, current codebase

**Why:** Ensures coherent, scalable system design

**Works With:** All development agents (provides blueprints)

---

### **Tier 2: Specialized Design (2 agents)**

#### 5. **Database Agent** 💾
**Purpose:** Designs database schemas, optimizes queries, implements integrations

**Capabilities:**
- Design database schemas
- Implement SQLite/DuckDB/PGlite integrations
- Write query optimization logic
- Create data import/export features
- Handle database persistence
- Benchmark database performance

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, WebFetch, Supabase MCP (for research)
**Outputs:** Database runtime implementations, schemas, query optimizers
**Triggers:** Database features, query optimization needs
**Context Needs:** Database documentation, performance requirements

**Why:** Databases are core to DrLee IDE, need specialized expertise

**Works With:** Runtime Agent (integration), Performance Agent (optimization)

---

#### 6. **API Design Agent** 🔌
**Purpose:** Designs public APIs, creates TypeScript types, ensures consistency

**Capabilities:**
- Design public API interfaces
- Create TypeScript type definitions
- Write API documentation
- Ensure API consistency
- Version API changes
- Design error handling patterns

**MCP Tools:** Read, Write, Edit, Grep, Glob
**Outputs:** API interfaces, TypeScript types, API documentation
**Triggers:** New features requiring public APIs
**Context Needs:** Existing APIs, user requirements

**Why:** Clean, consistent APIs are critical for extensibility

**Works With:** Frontend Agent (API consumers), Documentation Agent

---

### **Tier 3: Development Agents (4 agents)**

#### 7. **Frontend Agent** 🎨
**Purpose:** Implements UI components, Monaco Editor integration, styling

**Capabilities:**
- Build React/vanilla JS components
- Integrate Monaco Editor
- Implement responsive layouts
- Create CSS/styling
- Handle user interactions
- Implement accessibility features

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, Puppeteer MCP (UI testing)
**Outputs:** UI components, CSS files, interactive features
**Triggers:** UI features, design implementations
**Context Needs:** Design specs, architecture docs

**Why:** User interface is the primary touchpoint

**Works With:** Runtime Agent (execute code), Storage Agent (save files)

---

#### 8. **Runtime Agent** ⚙️
**Purpose:** Implements WebAssembly language runtimes

**Capabilities:**
- Implement BaseRuntime class
- Integrate Pyodide, ruby.wasm, etc.
- Handle runtime initialization
- Manage output capture
- Implement package management
- Handle runtime errors

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, WebFetch, Context7
**Outputs:** Language runtime implementations
**Triggers:** Adding new language support
**Context Needs:** Language documentation, runtime APIs

**Why:** Core value proposition is multi-language support

**Works With:** Database Agent (SQL runtimes), Testing Agent (runtime validation)

---

#### 9. **Storage Agent** 💿
**Purpose:** Implements IndexedDB storage, file management, persistence

**Capabilities:**
- Implement IndexedDB schema
- Create file management system
- Handle auto-save logic
- Implement import/export
- Manage storage quotas
- Handle database persistence

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash
**Outputs:** Storage manager, file manager, persistence layer
**Triggers:** Storage features, data persistence needs
**Context Needs:** Storage architecture, browser APIs

**Why:** Persistence is critical for user experience

**Works With:** Frontend Agent (file explorer), Database Agent (save DB state)

---

#### 10. **Monetization Agent** 💰
**Purpose:** Implements payment system, authentication, premium features

**Capabilities:**
- Implement Cloudflare Workers
- Integrate Stripe payments
- Build authentication flow
- Implement paywall UI
- Create subscription management
- Handle WASM delivery

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, Netlify MCP, WebFetch
**Outputs:** Payment integration, auth system, worker code
**Triggers:** Phase 3 (Month 7+), premium feature development
**Context Needs:** Monetization docs, Stripe API docs

**Why:** Revenue generation is essential for sustainability

**Works With:** Runtime Agent (premium runtimes), Frontend Agent (paywall UI)

---

### **Tier 4: Quality Assurance (4 agents)**

#### 11. **Testing Agent** 🧪
**Purpose:** Writes and runs tests, ensures code quality

**Capabilities:**
- Write unit tests
- Write integration tests
- Create E2E tests with Playwright
- Run test suites
- Generate coverage reports
- Test runtime implementations

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, Playwright MCP
**Outputs:** Test files, test reports, coverage data
**Triggers:** New features, bug fixes
**Context Needs:** Feature specs, existing tests

**Why:** Quality assurance prevents regressions

**Works With:** All development agents (tests their code)

---

#### 12. **Code Review Agent** 👁️
**Purpose:** Reviews code quality, enforces best practices

**Capabilities:**
- Review code for best practices
- Identify code smells
- Suggest refactoring
- Ensure style consistency
- Check for security issues
- Validate error handling

**MCP Tools:** Read, Write, Edit, Grep, Glob
**Outputs:** Code review comments, refactoring suggestions
**Triggers:** After major implementations
**Context Needs:** Codebase, style guide, best practices

**Why:** Maintains code quality and consistency

**Works With:** All development agents (reviews their output)

---

#### 13. **Performance Agent** ⚡
**Purpose:** Optimizes performance, benchmarks, reduces bundle size

**Capabilities:**
- Profile application performance
- Optimize bundle size
- Implement lazy loading
- Benchmark runtime speed
- Optimize database queries
- Monitor memory usage

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash, Puppeteer MCP
**Outputs:** Performance reports, optimization implementations
**Triggers:** Performance issues, optimization needs
**Context Needs:** Performance targets, current metrics

**Why:** Performance is critical for browser-based IDE

**Works With:** All development agents (optimizes their code)

---

#### 14. **Security Agent** 🔒
**Purpose:** Security review, vulnerability scanning, CSP configuration

**Capabilities:**
- Review code for security issues
- Configure Content Security Policy
- Implement sandboxing
- Validate input sanitization
- Check for XSS vulnerabilities
- Audit authentication flow

**MCP Tools:** Read, Write, Edit, Grep, Glob, WebFetch
**Outputs:** Security reports, security configurations
**Triggers:** Security reviews, new features
**Context Needs:** Security requirements, threat models

**Why:** Security is paramount for browser-based code execution

**Works With:** Monetization Agent (auth security), Frontend Agent (XSS prevention)

---

### **Tier 5: Operations (2 agents)**

#### 15. **Deployment Agent** 🚀
**Purpose:** Handles deployment, CI/CD, infrastructure

**Capabilities:**
- Deploy to Netlify/Vercel
- Configure Cloudflare Workers
- Set up CI/CD pipelines
- Manage environment variables
- Configure CDN
- Monitor deployments

**MCP Tools:** Read, Write, Edit, Bash, Netlify MCP, WebFetch
**Outputs:** Deployment configs, CI/CD workflows, infrastructure code
**Triggers:** Deployment needs, infrastructure changes
**Context Needs:** Deployment guide, infrastructure requirements

**Why:** Automated deployment is essential for rapid iteration

**Works With:** Monitoring Agent (post-deployment monitoring)

---

#### 16. **Monitoring Agent** 📈
**Purpose:** Sets up analytics, error tracking, performance monitoring

**Capabilities:**
- Configure Plausible Analytics
- Set up Sentry error tracking
- Implement Web Vitals tracking
- Create dashboards
- Monitor user behavior
- Track conversion metrics

**MCP Tools:** Read, Write, Edit, Bash, WebFetch
**Outputs:** Analytics configs, monitoring dashboards
**Triggers:** Production deployment, monitoring needs
**Context Needs:** Analytics requirements, KPIs

**Why:** Data-driven decisions require monitoring

**Works With:** Performance Agent (performance metrics)

---

### **Tier 6: Validation (1 agent)**

#### 17. **Analysis Agent** 🔍
**Purpose:** Validates ALL agent outputs, ensures quality and correctness

**Capabilities:**
- Validate code correctness
- Check against requirements
- Verify test coverage
- Validate documentation accuracy
- Ensure architectural compliance
- Final quality gate before completion

**MCP Tools:** Read, Write, Edit, Grep, Glob, Bash
**Outputs:** Validation reports, approval/rejection
**Triggers:** After any agent completes work
**Context Needs:** Requirements, architecture, test results

**Why:** Final safety check ensures quality

**Works With:** ALL agents (validates their outputs)

---

## 🔗 Agent Chaining Patterns

### Pattern 1: Feature Implementation Chain
```
User Request → Orchestration Agent
            → Architecture Agent (design)
            → Frontend Agent (UI)
            → Runtime Agent (logic)
            → Testing Agent (tests)
            → Code Review Agent (review)
            → Analysis Agent (validate)
            → DONE ✓
```

### Pattern 2: Bug Fix Chain
```
Bug Report → Orchestration Agent
          → Analysis Agent (diagnose)
          → [Appropriate Dev Agent] (fix)
          → Testing Agent (verify)
          → Code Review Agent (review)
          → DONE ✓
```

### Pattern 3: Performance Optimization Chain
```
Performance Issue → Orchestration Agent
                 → Performance Agent (benchmark)
                 → [Dev Agent] (optimize)
                 → Performance Agent (verify)
                 → Analysis Agent (validate)
                 → DONE ✓
```

### Pattern 4: Deployment Chain
```
Release Ready → Orchestration Agent
             → Testing Agent (full suite)
             → Security Agent (audit)
             → Deployment Agent (deploy)
             → Monitoring Agent (track)
             → DONE ✓
```

---

## 🗂️ Context Sharing System

### Shared Context Files (All agents can read/write):

1. **`.claude/context/project_state.json`**
   - Current phase, milestone progress
   - Active tasks, blockers
   - Recent decisions

2. **`.claude/context/agent_knowledge.md`**
   - Learnings from all agents
   - Best practices discovered
   - Common patterns

3. **`.claude/context/architecture_decisions.md`**
   - ADRs (Architecture Decision Records)
   - Technology choices
   - Design patterns

4. **`.claude/context/task_queue.json`**
   - Pending tasks
   - Agent assignments
   - Dependencies

### Agent Communication Protocol:

```json
{
  "from": "orchestration-agent",
  "to": "runtime-agent",
  "task": "implement-python-runtime",
  "context": {
    "architecture": "docs/02-architecture/SYSTEM_ARCHITECTURE.md",
    "requirements": "docs/03-languages/LANGUAGE_SUPPORT.md#python",
    "dependencies": ["base-runtime-class"]
  },
  "deliverables": [
    "src/runtimes/languages/PythonRuntime.js",
    "tests/runtimes/PythonRuntime.test.js"
  ],
  "handoff_to": "testing-agent"
}
```

---

## 📊 Agent Performance Tracking

The Meta Agent tracks:
- Task completion success rate
- Average time per task type
- Quality of outputs (via Analysis Agent feedback)
- Context sharing effectiveness
- Agent utilization

---

## 🎯 Agent Usage by Phase

### Phase 1: MVP (Months 1-3)
**Active Agents:** Orchestration, Architecture, Frontend, Runtime, Storage, Database, Testing, Code Review, Analysis
**Dormant:** Monetization, Deployment, Monitoring

### Phase 2: Expansion (Months 4-6)
**Active:** All Phase 1 + Performance, Security
**Dormant:** Monetization

### Phase 3: Monetization (Months 7-8)
**Active:** All agents + Monetization, Deployment, Monitoring

---

## 📝 Next Steps

1. ✅ Create this architecture document
2. Create individual agent prompt files
3. Implement context sharing system
4. Test agent chaining
5. Deploy first agent (Orchestration)
6. Iteratively add agents as needed

---

**Ready to build the actual agent files!**
