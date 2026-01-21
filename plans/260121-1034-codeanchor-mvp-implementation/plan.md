# CodeAnchor MVP Implementation Plan

> **Created:** 2026-01-21
> **Type:** Full MVP Implementation
> **Scope:** Single-repo, Phase 0-4
> **Timeline:** 4-5 weeks

## Overview

Comprehensive plan for building CodeAnchor - CLI tool that anchors code to standards and living documentation. MVP focuses on single-repo support with core functionality: auto-doc generation, git integration, and AI enhancement.

## Context Documents

- [Architecture Report](../reports/brainstorm-2026-01-21-codeanchor-architecture.md)
- [Risk Mitigation](../reports/brainstorm-2026-01-21-risk-mitigation.md)
- [Original Brainstorm](../../docs/brainstorm.md)

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **No background queue** | Reliability > automation |
| **Template-only pre-commit** | Speed guarantee (<2s) |
| **Manual AI enrichment** | User control, no silent failures |
| **Draft-based FLOW approval** | Safety over convenience |
| **Dependency-aware cache** | Accuracy without excessive overhead |
| **MASTER_INDEX as artifact** | Zero merge conflicts |

## Phases

### Phase 0: Technical Validation (2-3 days) 🔍
**Status:** ✅ COMPLETE
**Completion Date:** 2026-01-21
**File:** [phase-00-technical-validation.md](./phase-00-technical-validation.md)
**Review:** [code-reviewer-260121-phase0-validation.md](../reports/code-reviewer-260121-phase0-validation.md)

Validate critical assumptions before implementation:
- ✅ ts-morph capability validation (100% must-pass tests - 14/14 passed)
- ✅ Performance benchmarking (4.58-76ms per component, avg 40MB memory)
- ✅ Cache strategy prototyping (80% hit rate achieved)
- ✅ Go/No-go decision (GO - all criteria exceeded)

**Success Criteria:** 90%+ pattern coverage, <2s for 10 components ✅ EXCEEDED
**Decision:** PROCEED TO PHASE 1 - All validation gates passed

---

### Phase 1: Foundation (Week 1-2) 🏗️
**Status:** Not Started
**File:** [phase-01-foundation.md](./phase-01-foundation.md)

Core infrastructure and CLI framework:
- Project scaffold + TypeScript setup
- CLI framework (Commander + Inquirer)
- Config system (Zod validation)
- AI provider abstraction (Claude, OpenAI)
- Template engine (Handlebars)

**Deliverable:** Working `anchor init` command

---

### Phase 2: Detection Engine (Week 2-3) 🔍
**Status:** Not Started
**File:** [phase-02-detection-engine.md](./phase-02-detection-engine.md)

Smart component detection and analysis:
- ts-morph integration
- Component analyzer (props extraction)
- Dependency-aware cache
- Template-based doc generation
- `anchor sync --fast` command

**Deliverable:** Accurate props tables auto-generated

---

### Phase 3: Git Integration (Week 3-4) 🔗
**Status:** Not Started
**File:** [phase-03-git-integration.md](./phase-03-git-integration.md)

Seamless git workflow integration:
- Pre-commit hook (<2s, template-only)
- `anchor enrich` command (manual AI)
- `anchor flow approve` workflow
- AI commit message generation
- Change history tracking

**Deliverable:** Fast commits with synced docs

---

### Phase 4: Polish & Launch (Week 4) ✨
**Status:** Not Started
**File:** [phase-04-polish-launch.md](./phase-04-polish-launch.md)

Production readiness:
- Error handling + logging
- CLI UX improvements
- Documentation
- Real-world testing
- Launch preparation

**Deliverable:** Production-ready MVP

---

## Dependencies

```
Phase 0 (Validation)
    ↓
Phase 1 (Foundation) → Phase 2 (Detection) → Phase 3 (Git) → Phase 4 (Polish)
```

**Critical Path:** Phase 0 must pass before starting Phase 1

## Success Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Pre-commit speed | <1s | <2s |
| Props extraction accuracy | 100% | 95% |
| Cache hit rate | >85% | >70% |
| Component parsing | <50ms | <100ms |
| AI enrichment | <30s/10 components | <60s |

## Risk Matrix

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| ts-morph complexity | High | Phase 0 validation | ✅ Resolved |
| Pre-commit slowness | Critical | Template-only, no AI | ✅ Validated (<1s) |
| Background process instability | Critical | Removed from MVP | ✅ Resolved |
| Cache invalidation bugs | Medium | Dependency-aware cache | ✅ Validated |
| FLOW.md inaccuracy | Medium | Draft + approval | Mitigated |

## Out of Scope (Post-MVP)

- ❌ Monorepo support
- ❌ Background enrichment queue
- ❌ VS Code extension
- ❌ Cloud sync/hosting
- ❌ Plugin system API
- ❌ Custom component frameworks

## Next Actions

1. ✅ ~~Execute Phase 0 validation spike~~
2. ✅ ~~Review validation results~~
3. ✅ ~~Make Go/No-go decision~~ (GO)
4. **→ Begin Phase 1 implementation** (NEXT)
5. Archive validation artifacts to `research/` directory

---

*Plan created: 2026-01-21*
*Last updated: 2026-01-21 14:00 UTC*
*Phase 0 Status: COMPLETE - All validation gates passed*
