# CodeAnchor - Project Overview & Product Development Requirements

> **Status:** Phase 0 Complete (Technical Validation) | GO to Phase 1
> **Last Updated:** 2026-01-21
> **Project Version:** 0.1.0

---

## Executive Summary

CodeAnchor is a CLI tool that anchors your code to standards and living documentation. It combines AST parsing (via ts-morph) with AI enhancement to automatically generate and maintain accurate component documentation, keeping docs in sync with code through Git integration.

**Phase 0 Milestone:** Technical validation spike PASSED all success criteria. Ready for Phase 1 Foundation implementation.

---

## Product Vision

### Problem Statement

1. **AI-generated code ignores conventions** - Generated code often violates project standards
2. **Documentation becomes stale** - Manual docs drift from actual implementation
3. **No single source of truth** - Specs scattered across README, Jira, Slack
4. **Synchronization overhead** - Developer effort required to keep docs current
5. **Context window fatigue** - Developers must manually maintain context for AI assistance

### Solution

Provide a unified system that:
- Enforces project standards through configuration-driven validation
- Generates living documentation from code AST (100% accurate structure)
- Maintains single source of truth (SSoT) across three documentation levels
- Automates doc updates during Git workflow (pre-commit hooks)
- Reduces context window waste through smart hierarchical docs

### Target Users

- **Primary:** React/TypeScript development teams (MVPs, startups, enterprises)
- **Secondary:** Monorepo maintainers needing multi-package consistency
- **Future:** Vue/Svelte/mobile development communities

---

## Core Capabilities

### Phase 0: Technical Validation (COMPLETE)
- [x] AST parsing capability validation with ts-morph
- [x] Performance benchmarking (must parse <100ms per component)
- [x] Cache strategy validation (dependency-aware)
- [x] Memory footprint analysis (<200MB for 100 components)
- [x] Fallback strategy definition for edge cases

**Result:** All success criteria met. GO decision approved.

### Phase 1: Foundation (NEXT)
- Scaffold CLI with Commander.js
- Implement config system with Zod validation
- AI provider abstraction (Claude, OpenAI, Gemini, Ollama)
- `anchor init` command for project setup
- Core exports for validation code

### Phase 2: Smart Detection
- File watcher system (chokidar)
- Component analyzer (ts-morph-based)
- Props extractor with JSDoc parsing
- Auto README generation from templates
- `anchor watch` and `anchor sync` commands

### Phase 3: Git Integration
- Pre-commit hook system
- `anchor commit` smart workflow
- Semantic commit message generation
- Change history tracking

### Phase 4: Monorepo Support
- Workspace detection and config inheritance
- Cross-package reference tracking
- Scoped commands (`--workspace` flag)

### Phase 5: Polish & DX
- Comprehensive error handling
- `anchor doctor` diagnostics
- `anchor status` dashboard
- Plugin system foundation

---

## Technical Architecture

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                                  │
│  File Change | AI-Generated Code | Manual Creation              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              DETECTION & ANALYSIS LAYER                         │
│  • File Watcher (chokidar)                                      │
│  • Component Analyzer (ts-morph AST parsing)                    │
│  • Dependency Tracker (direct imports)                          │
│  • Cache Manager (SHA-256 hash, 1-level dependency tracking)    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│            CONTEXT RETRIEVAL & ENRICHMENT LAYER                 │
│  • Load anchor.config.json (project rules)                      │
│  • Load MASTER_INDEX.md (global registry)                       │
│  • Load Feature/FLOW.md (business context)                      │
│  • AI enhancement (optional - descriptions, examples)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│           GENERATION & VALIDATION LAYER                         │
│  • Template Engine (Handlebars)                                 │
│  • Documentation Generator (README.md, FLOW.md)                 │
│  • Validation Engine (rule enforcement)                         │
│  • Cache Storage (.anchor/cache/)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│           OUTPUT & GIT INTEGRATION LAYER                        │
│  • File system persistence                                      │
│  • Git staging and commit                                       │
│  • Semantic commit message generation                           │
│  • Hook installation & execution                                │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Core Dependencies
- **CLI Framework:** Commander.js (command parsing)
- **Interactive Prompts:** Inquirer.js (user interaction)
- **Schema Validation:** Zod (config validation with type safety)
- **AST Parsing:** ts-morph (TypeScript analysis)
- **Template Engine:** Handlebars (document generation)
- **File Watching:** chokidar (file system events)
- **Git Operations:** simple-git (programmatic Git)
- **Config Loading:** cosmiconfig (config discovery)

#### AI Providers
- Anthropic Claude (primary: most capable for code)
- OpenAI GPT (widely available)
- Google Gemini (ecosystem integration)
- Ollama (local/private deployments)

#### Testing & Build
- **Test Framework:** Vitest (faster than Jest for TS)
- **Type Checking:** TypeScript 5.3
- **Build:** tsc (TypeScript compiler)

### Key Design Decisions

| Decision | Rationale | Validation |
|----------|-----------|-----------|
| **AST-first, AI-second** | Accuracy for structure, AI for descriptions | Phase 0: 100% accuracy on props/types |
| **ts-morph as parser** | TypeScript native, excellent API, stable | Phase 0: 6-13ms per component parse |
| **Dependency-aware cache** | Invalidate only when files/deps change | Phase 0: 80% cache hit rate |
| **1-level dependency tracking** | Balance accuracy vs complexity | Phase 0: Handles 95% of use cases |
| **Template-based fallback** | Graceful degradation when parsing fails | Phase 0: Defined fallback strategy |
| **Git pre-commit hooks** | Enforce doc sync before every commit | Brainstorm: Approved pattern |

---

## Three-Level Documentation Architecture (SSoT)

### Level 1: Component Documentation (Micro)
- **Location:** `Component/README.md`
- **Ownership:** Auto-generated from code
- **Content:**
  - Component overview
  - Props table (name, type, required, description)
  - Variants and variants
  - Usage examples
  - Change history
  - Links to dependent components

**Example:**
```markdown
# Button Component

> Auto-generated by CodeAnchor | Last updated: 2026-01-21

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | ✅ | Button label |
| `variant` | `'primary' \| 'secondary'` | ❌ | Visual variant |
| `onClick` | `() => void` | ❌ | Click handler |

## Usage
```tsx
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>
```
```

### Level 2: Feature Flow Documentation (Macro)
- **Location:** `Feature/FLOW.md`
- **Ownership:** Semi-auto (AI-suggested, human-approved)
- **Content:**
  - User flow narrative
  - Component composition
  - API endpoints
  - State management details
  - Decision points

### Level 3: Master Index (Global)
- **Location:** `.anchor/MASTER_INDEX.md`
- **Ownership:** Fully auto-generated
- **Content:**
  - Registry of all components/features
  - Metadata index
  - Cross-reference map
  - Project structure overview

---

## Functional Requirements

### F1: Configuration Management
- Load `anchor.config.json` from project root
- Support config inheritance for monorepos
- Validate config with Zod schema
- Auto-detect project stack (Next.js, React, etc.)

### F2: Component Analysis
- Extract component name, props, and types using ts-morph
- Parse JSDoc comments for prop descriptions
- Identify component variants
- Track direct import dependencies
- Generate component metadata structure

### F3: Documentation Generation
- Generate README.md from component analysis
- Use Handlebars templates for consistency
- Support AI-enhanced descriptions (optional)
- Auto-link related components

### F4: Caching System
- Store component metadata in `.anchor/cache/`
- Use SHA-256 file hashing for change detection
- Track direct import dependencies
- Invalidate cache when file or dependencies change
- Support cache clearing

### F5: Git Integration
- Install pre-commit hooks
- Scan staged files for changes
- Auto-generate/update documentation
- Auto-stage generated docs
- Generate semantic commit messages

### F6: CLI Commands
- `anchor init` - Project initialization
- `anchor watch` - Watch mode for continuous updates
- `anchor sync` - Manual documentation sync
- `anchor commit` - Smart commit workflow
- `anchor status` - Project health dashboard

### F7: Error Handling
- Graceful fallback when parsing fails
- Clear error messages with remediation
- Offline mode (AST+templates, no AI)
- Comprehensive logging

---

## Non-Functional Requirements

### Performance
- **Pre-commit parsing:** <2 seconds for typical projects
- **Per-component parse:** 6-13ms (Phase 0: validated)
- **Memory usage:** <200MB for 100 components (Phase 0: validated ~40MB)
- **Cache hit rate:** >70% for typical workflows (Phase 0: 80% validated)
- **CLI startup:** <500ms

### Scalability
- Support 100+ components in single project
- Support monorepos with multiple packages
- Handle cross-package dependencies
- Parallel processing for batch operations

### Reliability
- No data loss during cache operations
- Graceful degradation on API errors
- Fallback template generation if AI unavailable
- Comprehensive error recovery

### Usability
- Zero-config for typical projects
- Clear, colored CLI output
- Helpful error messages with examples
- Fast interactive prompts (<1s)

### Security
- API keys from environment variables
- No credentials in config files
- Local cache only (no cloud sync in MVP)
- Support for local models (Ollama)

### Maintainability
- Well-documented code with JSDoc
- Testable architecture (dependency injection)
- Clear separation of concerns
- Comprehensive test coverage (>80% target)

---

## Success Metrics

### Phase 0 Completion Criteria (PASSED)
- [x] 90%+ must-pass tests succeed (Result: 100% - 3/3)
- [x] Average parse time <100ms (Result: 6-13ms)
- [x] Memory usage <200MB for 100 components (Result: ~40MB)
- [x] Cache strategy validated (Result: 80% hit rate)
- [x] Clear fallback strategy defined (Result: Defined)

### Phase 1 Success Metrics
- [ ] `npm install` without errors
- [ ] `anchor init` completes interactive setup
- [ ] All CLI commands accessible and functional
- [ ] Config validation prevents invalid configurations
- [ ] 80%+ test coverage

### Overall Product KPIs
- Developer time saved per component: 5-10 minutes
- Documentation freshness: 100% (auto-synced)
- Community adoption: 1000+ monthly active projects
- Support tickets resolved: <5% related to stale docs

---

## Dependencies & Prerequisites

### External Dependencies
- **Node.js:** ≥20.0.0
- **TypeScript:** ≥5.3
- **Git:** Required for git integration

### Internal Dependencies

#### Phase 1 Dependencies
- Phase 0 validation artifacts (cache-manager.ts, tests)

#### Phase 2 Dependencies
- Phase 1 (Foundation) complete

#### Phase 3 Dependencies
- Phase 2 (Smart Detection) complete

---

## Known Limitations & Mitigations

### Limitation 1: Default Value Extraction
- **Impact:** Default prop values not automatically extracted
- **Mitigation:** Document as known limitation, can infer from usage
- **Phase:** Phase 2 enhancement candidate

### Limitation 2: Advanced Patterns
- **Impact:** HOCs, complex generics, prop spreading not fully supported
- **Mitigation:** Provide `@anchor-ignore` decorator for edge cases
- **Phase:** Phase 2+ enhancement

### Limitation 3: Multi-language Support
- **Impact:** MVP supports English documentation only
- **Mitigation:** i18n framework in Phase 5
- **Phase:** Phase 5 enhancement

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| ts-morph API instability | Low | High | Phase 0 validation proved stable; vendored if needed |
| Pre-commit hook slowdown | Medium | High | Aggressive caching + parallel processing |
| Git merge conflicts | Medium | Medium | Alphabetical sorting in generated files |
| Monorepo complexity | Medium | Medium | Extensive Phase 4 testing |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Developer adoption | Medium | High | Free tier, excellent DX, community focus |
| Enterprise sales | Low | High | RBAC, SSO, audit logs in Phase 5+ |

---

## Go/No-Go Decision

### Phase 0 Result: GO ✅

**Criteria Met:**
1. ✅ 100% must-pass tests (target: 90%)
2. ✅ 6-13ms parse time (target: <100ms)
3. ✅ 40MB memory (target: <200MB)
4. ✅ 80% cache hit rate (target: >70%)
5. ✅ Fallback strategy defined

**Recommendation:** Proceed to Phase 1 Foundation with confidence.

---

## Roadmap & Milestones

### Timeline

| Phase | Duration | Deliverables | Status |
|-------|----------|--------------|--------|
| **Phase 0** | 1 day | Validation spike, tech decisions | ✅ COMPLETE |
| **Phase 1** | 2 weeks | Foundation, CLI scaffold | ⏳ NEXT |
| **Phase 2** | 2 weeks | Smart detection, component analysis | 📋 PLANNED |
| **Phase 3** | 1 week | Git integration, pre-commit hooks | 📋 PLANNED |
| **Phase 4** | 1.5 weeks | Monorepo support | 📋 PLANNED |
| **Phase 5** | 1.5 weeks | Polish, error handling, DX | 📋 PLANNED |

**MVP Ready:** End of Phase 3 (week 5-6)

---

## References & Resources

- [TypeScript Compiler API](https://www.typescriptlang.org/docs/handbook/compiler-api.html)
- [ts-morph Documentation](https://ts-morph.com/)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Atomic Design by Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Document Owner:** CodeAnchor Development Team
**Last Updated:** 2026-01-21
**Next Review:** Post Phase 1 Completion

