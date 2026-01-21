# CodeAnchor Architecture Brainstorm Report

> **Session Date:** 2026-01-21
> **Status:** Architecture Design & Risk Mitigation
> **Priority Focus:** Speed-critical git workflow + AI-enhanced documentation

---

## Executive Summary

CodeAnchor addresses core pain: **AI-generated code ignores project conventions & docs become stale**. Solution architecture combines AST parsing (structure accuracy) + LLM (semantic richness) with git-driven enforcement loop.

**Critical Success Factor:** Pre-commit hook MUST complete <2s or developers bypass with `--no-verify`

**Key Decisions:**
- ✅ Speed-first: AST-based sync, async AI enhancement
- ✅ MASTER_INDEX as build artifact (not committed)
- ✅ FLOW.md requires human approval
- ✅ MVP = Phase 1+2+3 (Foundation → Detection → Git)

---

## 1. Architecture Overview

### 1.1 Hybrid Intelligence Model

**Decision:** AST Parsing for structure + LLM for semantics

**Why This Works:**
```
Component Analysis Pipeline:
┌─────────────────────────────────────────────────────────────┐
│  ts-morph (AST)              │  LLM (AI Provider)           │
├──────────────────────────────┼──────────────────────────────┤
│  ✓ Props extraction          │  ✓ Descriptions              │
│  ✓ Type definitions          │  ✓ Usage examples            │
│  ✓ Dependencies              │  ✓ Best practices            │
│  ✓ Variants detection        │  ✓ Common pitfalls           │
│  Speed: ~50ms/component      │  Speed: ~500-2000ms/call     │
└──────────────────────────────┴──────────────────────────────┘
```

**Benefits:**
- Zero hallucination risk for technical data (props always accurate)
- Cost-efficient (1 LLM call vs 10+ for full analysis)
- Works offline (AST-only fallback mode)
- Token-efficient context (structured data input)

### 1.2 Three-Tier Performance Strategy

Based on [pre-commit performance best practices](https://pre-commit.com/) and [ts-morph optimization guide](https://ts-morph.com/manipulation/performance):

```
Tier 1: Pre-commit Hook (<2s budget)
├── Changed files detection (git diff --cached)
├── AST parsing with ts-morph (structures only)
├── Template-based doc generation
├── MASTER_INDEX regeneration
└── Stage updated docs

Tier 2: Background Enhancement (async)
├── Full AI description generation
├── Usage example enrichment
├── Cross-reference updates
└── Commit metadata tracking

Tier 3: CI/CD Validation (post-merge)
├── Comprehensive doc coverage check
├── Link validation
├── Style consistency enforcement
└── Generate team dashboards
```

**Performance Targets:**
- Tier 1: <2s (CRITICAL - user-facing)
- Tier 2: 10-30s (invisible to dev)
- Tier 3: 1-2min (blocking only on merge)

---

## 2. Critical Risk Mitigation

### 2.1 Pre-commit Hook Performance (P0 - Critical)

**Problem:** Heavy processing blocks commit → developers bypass tool

**Root Causes:**
1. AI API latency (500-2000ms minimum)
2. Full AST parsing overhead
3. File I/O bottlenecks
4. Sequential processing

**UPDATED Solution: Two-Tier Synchronous Architecture (No Background Queue)**

**Key Decision:** Background processes on local machines are unreliable. Terminal close = process death. Solution: Remove background queue entirely from MVP.

```typescript
// Tier 1: Pre-commit (Fast Path ONLY) - <2s guaranteed
class FastCommitProcessor {
  async process(stagedFiles: string[]): Promise<void> {
    const components = await this.detectChangedComponents(stagedFiles);

    // AST-only extraction (no AI)
    const structures = await this.extractStructures(components);

    // Template-only docs (props table, no descriptions)
    const docs = this.generateTemplateDocs(structures);

    // Parallel write
    await Promise.all([
      this.updateComponentDocs(docs),
      this.updateMasterIndex(structures)
    ]);

    // Mark components needing enrichment
    await this.markPendingEnrichment(components);

    // Auto-stage docs
    await this.stageFiles(docs.map(d => d.path));
  }

  private generateTemplateDocs(structures: ComponentStructure[]): Doc[] {
    return structures.map(s => ({
      path: `${s.path}/README.md`,
      content: `
# ${s.name}

> ⚠️ **AI enrichment pending** - Run \`anchor enrich\` for enhanced descriptions

## Props

| Prop | Type | Default | Required |
|------|------|---------|----------|
${s.props.map(p => `| ${p.name} | \`${p.type}\` | ${p.default || '-'} | ${p.required ? '✅' : '❌'} |`).join('\n')}
`
    }));
  }
}

// Tier 2: Manual Enrichment (User-initiated - NO background process)
class EnrichmentCommand {
  async execute(options: { watch?: boolean }): Promise<void> {
    const pending = await this.getPendingEnrichments();

    console.log(`📝 Enriching ${pending.length} components...`);

    for (const component of pending) {
      const enhanced = await this.aiProvider.enhance(component);
      await this.mergeEnhancement(component, enhanced);
      console.log(`  ✓ ${component.name}`);
    }

    if (options.watch) {
      // Foreground watch with explicit user control
      console.log('👁️  Watching for changes (Ctrl+C to stop)...');
      await this.watchMode();
    }
  }
}
```

**Implementation Details:**

1. **Dependency-Aware Caching (Updated):**
```typescript
interface CacheEntry {
  fileHash: string;                 // SHA-256 of source file
  dependencies: DependencyCache[];  // Track direct imports
  structures: ComponentStructure;
  lastParsed: Date;
}

interface DependencyCache {
  path: string;
  hash: string;
  mtime: number; // Faster than rehashing
}

class DependencyAwareCacheManager {
  async needsUpdate(file: string): Promise<boolean> {
    const cache = await this.get(file);
    if (!cache) return true;

    // Fast check: file hash
    const currentHash = await this.computeHash(file);
    if (currentHash !== cache.fileHash) return true;

    // Deep check: direct dependencies only (not transitive)
    const imports = await this.extractDirectImports(file);
    for (const imp of imports) {
      const stat = await fs.stat(imp);
      if (stat.mtimeMs > cache.lastParsed.getTime()) {
        return true; // Dependency modified
      }
    }

    return false; // Cache valid
  }

  private async extractDirectImports(file: string): Promise<string[]> {
    // Use ts-morph to get import declarations
    const sourceFile = this.project.getSourceFile(file);
    return sourceFile.getImportDeclarations()
      .map(imp => imp.getModuleSpecifierSourceFile()?.getFilePath())
      .filter((path): path is string =>
        !!path && !path.includes('node_modules')
      );
  }
}
```

2. **Parallel Processing:**
```typescript
// Process up to 4 components simultaneously
const CONCURRENCY = 4;
const results = await pMap(changedFiles, processComponent, {
  concurrency: CONCURRENCY
});
```

3. **Incremental Updates:**
```typescript
// Only regenerate affected index sections
class IncrementalIndexer {
  async updateSection(componentPath: string): Promise<void> {
    const section = this.identifySection(componentPath); // e.g., "atoms"
    await this.regenerateSection(section);
    // Don't regenerate entire MASTER_INDEX
  }
}
```

**Fallback Strategy:**
```typescript
const TIMEOUT_MS = 1500; // 1.5s budget for hook

try {
  await Promise.race([
    fastPathProcessor.process(stagedFiles),
    timeout(TIMEOUT_MS)
  ]);
} catch (TimeoutError) {
  logger.warn('Hook timeout - queuing for background processing');
  await backgroundQueue.add(stagedFiles);
  // Let commit proceed anyway
}
```

**Expected Performance:**
- 1-3 files changed: 200-500ms ✅
- 5-10 files changed: 800-1500ms ✅
- 20+ files changed: Queue for background ⚠️

**Sources:**
- [Pre-commit Performance Optimization](https://pre-commit.com/)
- [ts-morph Performance Guide](https://ts-morph.com/manipulation/performance)

---

### 2.2 MASTER_INDEX Merge Conflicts (P1 - High)

**Problem:** Auto-generated files conflict in multi-dev teams

**Solution: Build Artifact Pattern**

Based on [GitHub artifact best practices](https://docs.github.com/actions/using-workflows/storing-workflow-data-as-artifacts):

```gitignore
# .gitignore
.anchor/MASTER_INDEX.md
.anchor/cache/
.anchor/build/
```

**Workflow:**
```bash
# Developer workflow
git pull                    # Pull latest code
anchor index --rebuild      # Regenerate index locally
anchor status               # View project health

# Pre-commit automatically:
anchor sync --fast          # Update affected docs only
# (MASTER_INDEX regenerated from component metadata)
```

**Implementation:**
```typescript
class IndexBuilder {
  async build(): Promise<MasterIndex> {
    // Deterministic generation from code
    const components = await this.scanAllComponents();
    const features = await this.scanAllFeatures();

    // Alphabetical sorting for consistency
    components.sort((a, b) => a.name.localeCompare(b.name));

    return {
      timestamp: new Date().toISOString(),
      version: this.getGitCommit(),
      components: components.map(c => ({
        name: c.name,
        path: path.relative(this.root, c.path),
        type: c.type,
        props: c.props.length,
        usedBy: c.usedBy.length
      })),
      features
    };
  }
}
```

**Alternative: Distributed Index Pattern**

If team insists on committing:

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   └── _index.json          # Atomic index
│   ├── molecules/
│   │   └── _index.json          # Molecular index
│   └── _index.json              # Component index
├── features/
│   └── _index.json              # Feature index
└── .anchor/
    └── MASTER_INDEX.md          # Aggregates _index.json files
```

Each `_index.json` scoped to its directory → fewer conflicts.

**Recommendation:** Build artifact pattern (cleaner, zero conflicts)

**Sources:**
- [GitHub Workflow Artifacts](https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts)
- [Git Flow Immutable Artifacts](https://shinesolutions.com/2015/01/07/git-flow-and-immutable-build-artifacts/)

---

### 2.3 Feature FLOW Documentation (P1 - High)

**Problem:** AI may misinterpret business logic from code analysis alone

**UPDATED Solution: Draft-Based Approval with Commit Blocking**

**Key Decision:** Never auto-commit FLOW.md. AI suggestions require explicit human approval. Block commits if unapproved drafts exist.

```typescript
class FlowDocManager {
  async detectFlowChanges(featurePath: string, changes: FileChange[]): Promise<void> {
    // Only trigger for business logic changes
    const impactsFlow = this.analyzesBusinessLogic(changes);
    if (!impactsFlow) return;

    // Generate draft
    const draft = await this.aiProvider.analyzeFlow({
      files: changes,
      existingFlow: await this.readFlow(featurePath),
      context: await this.buildContext(featurePath)
    });

    const draftPath = `${featurePath}/FLOW.draft.md`;
    await fs.writeFile(draftPath, draft);

    // Track unapproved draft
    await this.trackUnapprovedDraft(featurePath);

    console.log(`
⚠️  Feature flow updated - approval required

Draft: ${draftPath}
Run: anchor flow approve ${featurePath}
    `);
  }

  async approveFlow(featurePath: string): Promise<void> {
    const draftPath = `${featurePath}/FLOW.draft.md`;
    const finalPath = `${featurePath}/FLOW.md`;

    // Show diff
    const diff = await this.generateDiff(finalPath, draftPath);
    console.log('\n📋 Flow Changes:\n');
    console.log(diff);

    // Require explicit approval (default NO)
    const approved = await inquirer.confirm({
      message: 'Approve changes and commit FLOW.md?',
      default: false // Safety: default NO
    });

    if (approved) {
      // Backup previous version
      if (await fs.pathExists(finalPath)) {
        await fs.copy(finalPath, `${finalPath}.backup`);
      }

      await fs.rename(draftPath, finalPath);
      await git.add(finalPath);

      // Audit log
      await this.logApproval(featurePath, {
        timestamp: new Date(),
        user: await git.getUser(),
        changes: diff
      });

      console.log('✓ Flow approved and staged');
    }
  }

  // Block commits if unapproved drafts exist
  async validateBeforeCommit(): Promise<void> {
    const unapproved = await this.getUnapprovedDrafts();
    if (unapproved.length > 0) {
      throw new Error(`
❌ Cannot commit: ${unapproved.length} unapproved FLOW draft(s)

Please review:
${unapproved.map(f => `  anchor flow approve ${f}`).join('\n')}

Or bypass: git commit --no-verify
      `);
    }
  }
}
```

**Workflow:**
```bash
# Automatic detection
$ git commit -m "Add payment validation"
⚠️  Feature flow updated - review required
✓ Committed code changes
⚠️ FLOW.md draft created - run: anchor flow approve features/Checkout

# Manual review
$ anchor flow approve features/Checkout
╔═══════════════════════════════════════════════════════════╗
║  Flow Changes: Checkout                                    ║
╠═══════════════════════════════════════════════════════════╣
║  + Payment validation step                                 ║
║  + Error handling for card decline                         ║
║  ~ Updated component: PaymentForm                          ║
╚═══════════════════════════════════════════════════════════╝

? Approve changes? (Y/n)
```

**Safety Rails:**
1. Never auto-commit FLOW.md changes
2. Always show diff before approval
3. Keep previous version as FLOW.md.backup
4. Log all approvals for audit trail

---

### 2.4 ts-morph Performance at Scale (P2 - Medium)

**Challenge:** Large codebases (1000+ components) slow AST parsing

**Optimization Strategies:**

Based on [ts-morph performance docs](https://ts-morph.com/manipulation/performance):

1. **Use Structures API:**
```typescript
// ❌ Slow - full AST navigation
const component = sourceFile.getClass('Button');
const props = component.getProperties();

// ✅ Fast - structures only
const structure = sourceFile.getStructure();
const componentStructure = structure.classes.find(c => c.name === 'Button');
```

2. **Lazy Project Loading:**
```typescript
class LazyProject {
  private project: Project;
  private loadedFiles = new Set<string>();

  async loadFile(path: string): Promise<SourceFile> {
    if (this.loadedFiles.has(path)) {
      return this.project.getSourceFile(path);
    }

    const sourceFile = this.project.addSourceFileAtPath(path);
    this.loadedFiles.add(path);
    return sourceFile;
  }

  // Only load files we actually need to analyze
  async analyzeChangedFiles(paths: string[]): Promise<void> {
    for (const path of paths) {
      await this.loadFile(path);
    }
  }
}
```

3. **Parallel Processing with Worker Threads:**
```typescript
import { Worker } from 'worker_threads';

class ParallelAnalyzer {
  private workers: Worker[];

  async analyzeComponents(paths: string[]): Promise<ComponentMeta[]> {
    const chunks = this.chunkArray(paths, this.workers.length);

    const results = await Promise.all(
      chunks.map((chunk, i) => this.analyzeInWorker(this.workers[i], chunk))
    );

    return results.flat();
  }
}
```

**Expected Improvements:**
- Structures API: 5-10x faster
- Lazy loading: 3-5x faster startup
- Worker threads: 2-4x faster (multi-core)

**Sources:**
- [ts-morph Performance](https://ts-morph.com/manipulation/performance)
- [AST-based Refactoring](https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/)

---

## 3. MVP Scope & Sequencing

### Phase 0: Technical Validation (NEW - 2-3 days) 🔍

**Goal:** Validate critical assumptions before committing to implementation

**Deliverables:**
```
✓ ts-morph capability validation (edge cases)
✓ Performance benchmarking (50 component test)
✓ Cache strategy prototype
✓ Go/No-go decision documentation
```

**Validation Tests:**
- Extract props from basic interfaces ✅
- Extract props with generics ✅
- Extract default values from destructuring ✅
- Handle HOCs and forwardRef ✅
- Measure parsing time per component (<100ms target)

**Success Criteria:**
- ts-morph handles 90%+ of common patterns
- Fallback strategy defined for edge cases
- Performance targets achievable (<2s for 10 components)

**Risk: Medium** - If validation fails, adjust architecture

**Go/No-go:** Must pass before Phase 1 begins

---

### Phase 1: Foundation (Week 1-2) ✅

**Goal:** Prove config system + AI providers work

**Deliverables:**
```
✓ CLI scaffold (Commander + Inquirer)
✓ anchor init - interactive setup
✓ Config parser with Zod validation
✓ AI provider abstraction
✓ Claude + OpenAI implementations
✓ Template engine (Handlebars)
✗ Background queue (REMOVED from MVP)
```

**Success Criteria:**
- `anchor init` generates valid anchor.config.json
- Can detect tech stack from package.json
- AI connection test passes
- Template-only mode works (no AI required)

**Risk: Low** - Established libraries, clear scope

---

### Phase 2: Smart Detection (Week 2-3) ✅

**Goal:** Auto-generate component docs from code

**Deliverables:**
```
✓ File watcher (chokidar)
✓ Component analyzer (ts-morph)
✓ Props extractor with JSDoc support
✓ Template-based README generation
✓ anchor watch command
✓ anchor sync command
```

**Critical Path:**
1. Parse TypeScript interfaces → Extract props
2. Generate markdown table (template only)
3. Validate generated docs are accurate
4. Add AI descriptions (async enhancement)

**Success Criteria:**
- Create Button.tsx → README.md auto-generated
- Props table matches interface exactly
- Works without AI (template mode)
- AI mode adds rich descriptions

**Risk: Medium** - ts-morph learning curve, need solid AST extraction

**Validation Test:**
```typescript
// Input: src/components/atoms/Button/Button.tsx
interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

// Expected Output: Button/README.md
| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| children | React.ReactNode | - | ✅ | Button label text |
| variant | 'primary' \| 'secondary' | - | ❌ | - |
| onClick | () => void | - | ❌ | - |
```

---

### Phase 3: Git Integration (Week 3-4) ✅

**Goal:** Seamless git workflow - the "magic moment"

**UPDATED Deliverables:**
```
✓ Pre-commit hook installer
✓ Fast sync processor (<2s, template-only)
✓ anchor enrich command (manual AI enrichment)
✓ anchor flow approve command (FLOW.md approval)
✓ Dependency-aware cache
✓ AI commit message generation
✓ Change history tracking
✗ Background enrichment queue (REMOVED)
```

**Critical Path:**
1. Install pre-commit hook → Fast sync (template-only, no AI)
2. Optimize to <2s (cache + parallel + dependency tracking)
3. Implement `anchor enrich` for manual AI enhancement
4. Implement `anchor flow approve` with draft workflow
5. Generate semantic commit messages

**Success Criteria:**
- Pre-commit completes in <2s consistently ✅
- Docs structure always synced (props tables accurate) ✅
- AI enrichment user-controlled (no silent failures) ✅
- FLOW.md changes require approval ✅
- Zero merge conflicts (MASTER_INDEX as artifact) ✅

**Risk: Medium** - Performance critical but achievable without AI in hook

**Performance Benchmark:**
```bash
# Test case: 3 components modified
$ time git commit -m "test"

Target: <2s
Acceptable: <3s
Fail: >5s (developers will bypass)
```

---

### Phase 4: Monorepo (Post-MVP)

**Defer Reasoning:**
- Adds significant complexity (config inheritance, workspace detection)
- Not required to prove core value proposition
- Can validate with single-repo first
- Enterprise feature - validate market fit first

**When to Build:**
- After 10+ teams using single-repo version
- Clear demand from enterprise customers
- MVP proven stable

---

## 4. Technical Stack Validation

### 4.1 Core Dependencies (Approved ✅)

| Dependency | Why | Alternatives Considered |
|------------|-----|------------------------|
| `commander` | Industry standard CLI framework | yargs (less ergonomic) |
| `inquirer` | Beautiful prompts, active development | prompts (less features) |
| `zod` | Type-safe validation, great DX | joi (no TS inference) |
| `ts-morph` | TypeScript-native AST | babel-parser (less TS features) |
| `handlebars` | Simple, extensible templates | ejs (less separation) |
| `chokidar` | Cross-platform, reliable | fs.watch (platform issues) |
| `simple-git` | Promise-based, comprehensive | nodegit (C++ binding issues) |

### 4.2 AI Providers Priority

**Phase 1 (MVP):**
1. Claude (Anthropic) - Best code understanding
2. OpenAI (GPT-4) - Widely available

**Phase 2 (Post-MVP):**
3. Ollama - Local/private deployments
4. Gemini - Google ecosystem integration

**Rationale:** Focus on 2 cloud providers first, validate market, then add local/alternative options.

---

## 5. Open Questions & Future Considerations

### 5.1 Plugin System

**Question:** Should we support custom analyzers/generators?

**Considerations:**
- **Pro:** Extensibility for custom component patterns (e.g., Vue, Svelte)
- **Pro:** Community can add framework adapters
- **Con:** Adds API surface area & maintenance burden
- **Con:** May be premature before core stabilizes

**Recommendation:** Plan architecture for plugins (interface-based design) but don't expose public API until v2.0.

**Architecture Preview:**
```typescript
interface Analyzer {
  name: string;
  filePatterns: string[];
  analyze(file: string): Promise<ComponentMeta>;
}

// Allow registration
class AnalyzerRegistry {
  register(analyzer: Analyzer): void;
  getAnalyzer(file: string): Analyzer | null;
}
```

### 5.2 IDE Integration

**Question:** VS Code extension for real-time doc preview?

**Considerations:**
- **Pro:** See docs as you write code
- **Pro:** Inline warnings for missing docs
- **Con:** Significant additional scope
- **Con:** Requires learning VS Code extension API

**Recommendation:** CLI-first approach. If successful, extension is great v2 feature.

**Potential Features:**
- Hover over component → Show generated docs
- CodeLens for "Update docs" button
- Sidebar panel with project status

### 5.3 Cloud Sync

**Question:** Team documentation sync/hosting?

**Considerations:**
- **Pro:** Central docs server for team
- **Pro:** Potential SaaS revenue model
- **Con:** Requires infrastructure & auth
- **Con:** Scope creep from core tool

**Recommendation:** Not in MVP. If users ask for it post-launch, consider as separate product.

### 5.4 Anchor Fix Command

**Proposal:** `anchor fix` to standardize manually-edited docs

**Implementation:**
```typescript
class DocFixer {
  async fix(componentPath: string): Promise<void> {
    // Re-parse component
    const structure = await this.analyzer.analyze(componentPath);

    // Regenerate doc
    const newDoc = await this.generator.generate(structure);

    // Merge custom sections (preserve manual content)
    const merged = await this.mergeDocs(
      await fs.readFile(`${componentPath}/README.md`),
      newDoc
    );

    await fs.writeFile(`${componentPath}/README.md`, merged);
  }
}
```

**Use Cases:**
- Dev manually edited props table → Fix with correct data
- Code changed but docs not synced → Force sync
- Format got messed up → Restore template

**Priority:** Phase 5 (Polish) - nice-to-have, not critical path

### 5.5 Visual Diagram Generator

**Proposal:** `anchor graph` to generate component dependency graphs

**Implementation:**
```typescript
class GraphGenerator {
  async generateGraph(type: 'components' | 'features'): Promise<string> {
    const nodes = await this.collectNodes(type);
    const edges = await this.collectEdges(nodes);

    // Generate Mermaid diagram
    return this.renderMermaid(nodes, edges);
  }

  async renderImage(format: 'png' | 'svg'): Promise<Buffer> {
    // Use mermaid-cli to render
    const mermaid = await this.generateGraph('components');
    return await this.mermaidCLI.render(mermaid, format);
  }
}
```

**Output Example:**
```bash
$ anchor graph --output component-graph.png

Generated: component-graph.png
- 24 components
- 15 molecules
- 8 organisms
- 127 dependency edges
```

**Priority:** Phase 5 (Polish) - high value for visualization

---

## 6. Success Metrics

### 6.1 Technical Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Pre-commit hook time | <1s | <2s |
| Component parsing | <50ms | <200ms |
| Doc generation | <100ms | <300ms |
| AI enhancement | <2s | <5s |
| Memory usage | <200MB | <500MB |
| Cache hit rate | >80% | >60% |

### 6.2 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Setup time | <2min | From `anchor init` to first commit |
| Developer friction | Invisible | Commit time increase <10% |
| Doc accuracy | >95% | Props match 100%, descriptions reviewed |
| Adoption rate | >70% | Team members using tool |

### 6.3 Business Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| GitHub stars | 1000 | 3 months post-launch |
| Weekly active projects | 100 | 6 months |
| Enterprise inquiries | 10 | 6 months |
| Community PRs | 20 | 6 months |

---

## 7. Risk Matrix

### High Priority (Address in MVP)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Hook performance** | P0 - Tool abandoned if slow | Fast path <2s, aggressive caching, background AI |
| **Merge conflicts** | P1 - Team friction | MASTER_INDEX as artifact, not committed |
| **AI accuracy** | P1 - Dangerous if wrong | Human approval for FLOW.md, AST-only for props |
| **ts-morph learning curve** | P2 - Dev velocity | Research phase, use Structures API |

### Medium Priority (Monitor Post-MVP)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Monorepo complexity** | P2 - Feature delayed | Defer to post-MVP, single-repo first |
| **Plugin system design** | P2 - API changes | Plan interface, don't expose until v2 |
| **AI cost** | P2 - Operating expense | Cache aggressively, offer local Ollama |

### Low Priority (Accept/Monitor)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **IDE extension scope** | P3 - Nice-to-have | CLI-first, extension v2 |
| **Cloud sync** | P3 - Different product | Not in scope |
| **Framework support** | P3 - Market expansion | Start React/TS, add later |

---

## 8. Development Sequencing (Updated)

### Phase 0: Validation (2-3 days BEFORE Week 1)
```
Day -3:   ts-morph edge case validation
Day -2:   Performance benchmarking setup
Day -1:   Cache strategy prototyping + Go/No-go
```

### Week 1: Foundation Fundamentals
```
Day 1-2:  Project scaffold + CLI framework
Day 3-4:  Config system + Zod validation
Day 5-6:  AI provider abstraction + Claude impl
Day 7:    Testing & validation
```

### Week 2: Detection Engine
```
Day 8-9:  ts-morph integration + component analyzer
Day 10-11: Props extraction + template engine
Day 12-13: Dependency-aware cache implementation
Day 14:   Integration testing
```

### Week 3: Git Integration (Critical Path)
```
Day 15-16: Pre-commit hook (template-only, <2s)
Day 17-18: anchor enrich command (manual AI)
Day 19-20: anchor flow approve workflow
Day 21:   Performance validation (<2s benchmark)
```

### Week 4: Polish & MVP Launch
```
Day 22-23: Error handling + logging
Day 24-25: CLI UX polish + documentation
Day 26-27: Real-world testing with sample repos
Day 28:   MVP launch prep
```

**Key Changes:**
- ✅ Added Phase 0 validation spike
- ❌ Removed background queue work (Day 19-20)
- ✅ Added FLOW approval workflow
- ✅ Focus on <2s pre-commit guarantee

---

## 9. Implementation Plan (Next Steps)

### Immediate Actions (This Week)

1. **Set up project structure** ✅
   ```bash
   mkdir codeanchor && cd codeanchor
   npm init -y
   npm install -D typescript @types/node
   npx tsc --init
   ```

2. **Install core dependencies**
   ```bash
   npm install commander inquirer zod ts-morph handlebars chokidar simple-git
   npm install chalk ora boxen
   npm install @anthropic-ai/sdk openai
   ```

3. **Create initial CLI structure**
   ```
   codeanchor/
   ├── bin/anchor.js
   ├── src/
   │   ├── cli/
   │   │   ├── commands/
   │   │   │   └── init.ts
   │   │   └── index.ts
   │   ├── core/
   │   │   ├── config-loader.ts
   │   │   └── schema.ts
   │   └── index.ts
   └── tsconfig.json
   ```

4. **Build `anchor init` MVP**
   - Detect package.json tech stack
   - Interactive prompts
   - Generate anchor.config.json
   - Test with sample Next.js project

### Week 1 Checkpoint

**Demo Goal:** Show working `anchor init` that:
- Detects Next.js + React + TailwindCSS
- Prompts for structure type (atomic/feature-based)
- Prompts for AI provider + API key
- Generates valid config file
- Tests AI connection

### Week 2 Checkpoint

**Demo Goal:** Show working `anchor sync` that:
- Parses sample Button.tsx component
- Extracts props interface correctly
- Generates accurate README.md
- Shows diff before/after

### Week 3 Checkpoint (Critical)

**Demo Goal:** Show working `anchor commit` that:
- Hooks into git commit flow
- Completes in <2s consistently
- Updates docs automatically
- Generates semantic commit message

**Success = MVP Ready**

---

## 10. Final Recommendation (UPDATED)

### Build It This Way:

1. **Validate First** - Phase 0 validation spike (ts-morph, performance, cache)
2. **Start Minimal** - Phase 1+2 proves core value (template-based auto-docs)
3. **Guarantee Speed** - Phase 3 git integration <2s (NO AI in pre-commit hook)
4. **Manual Enrichment** - User controls when AI runs (`anchor enrich`)
5. **Defer Complexity** - Monorepo, plugins, IDE extensions post-MVP

### Architecture Principles (Updated):

✅ **Reliability First** - No silent failures, no background zombies
✅ **Speed Guaranteed** - <2s pre-commit (template-only, no AI)
✅ **User Control** - Developer controls when AI enrichment runs
✅ **Offline Capable** - Template mode always works without AI
✅ **Zero Config** - Sensible defaults, minimal setup
✅ **Git Native** - Feels like git, not a separate tool
✅ **Human in Loop** - AI suggests, human approves (FLOW.md)
✅ **Zero Conflicts** - MASTER_INDEX as build artifact

### Critical Decisions:

| What | Decision | Why |
|------|----------|-----|
| **Background Process** | ❌ REMOVED | Unreliable on local machines |
| **AI in Pre-commit** | ❌ NO | Blocks commits, causes bypassing |
| **AI Enrichment** | ✅ Manual command | User controls timing |
| **FLOW.md** | ✅ Draft + approval | Safety over automation |
| **Cache Strategy** | ✅ Dependency-aware | Catches indirect changes |
| **MASTER_INDEX** | ✅ Don't commit | Zero merge conflicts |

### Do NOT Build (MVP):

❌ Background enrichment queue (unreliable)
❌ AI in pre-commit hook (too slow)
❌ Auto-commit FLOW.md (too risky)
❌ Cloud hosting/sync (scope creep)
❌ VS Code extension (prove CLI first)
❌ Complex plugin system (defer to v2)

### The "Magic Moment" (REVISED):

```bash
# Commit flow
Developer writes code → git commit → commit completes <2s
✓ Props table auto-generated (AST-accurate)
⚠️ AI descriptions pending

# Enrichment flow (when ready)
Developer runs → anchor enrich → AI enhances descriptions
✓ No blocking, no silent failures, full control

Developer thinks: "Props are always correct, and I control when AI runs!"
```

**Success = Fast commits + accurate structure + user control**

### Risk Mitigation Summary:

See detailed analysis: `plans/reports/brainstorm-2026-01-21-risk-mitigation.md`

| Risk | Status | Solution |
|------|--------|----------|
| Background process instability | ✅ SOLVED | Removed from MVP |
| Pre-commit slowness | ✅ SOLVED | Template-only (<2s) |
| Cache invalidation bugs | ✅ MITIGATED | Dependency-aware cache |
| FLOW.md inaccuracy | ✅ MITIGATED | Draft + approval workflow |
| ts-morph complexity | ⚠️ VALIDATE | Phase 0 spike required |
| Merge conflicts | ✅ SOLVED | MASTER_INDEX as artifact |

---

## 11. Unresolved Questions (UPDATED)

### Technical:
1. ~~Background enrichment trigger?~~ → RESOLVED: Manual `anchor enrich` only
2. ~~MASTER_INDEX conflicts?~~ → RESOLVED: Build artifact (don't commit)
3. ~~Cache invalidation?~~ → RESOLVED: Dependency-aware (1-level)
4. **NEW:** Should `anchor enrich` run automatically in CI/CD?
5. **NEW:** Cache storage location - `.anchor/cache/` or OS cache dir?
6. **NEW:** If ts-morph validation fails in Phase 0, delay MVP or use regex fallback?
7. Should we support `.anchorignore` file or config-based ignore patterns?
8. How to handle React Native vs web components (different prop patterns)?
9. What's the strategy for documenting custom hooks?

### Product:
10. Should we target solo developers, small teams, or enterprises first?
11. Pricing model if cloud features added later (freemium? enterprise only)?
12. Go-to-market strategy (Product Hunt? HN? Dev.to)?
13. **NEW:** How often do FLOW.md docs realistically change vs components?

### Process:
14. ~~When to regenerate MASTER_INDEX?~~ → RESOLVED: Every commit (fast rebuild)
15. ~~Background enrichment?~~ → RESOLVED: Manual only
16. Should we support custom templates or lock to opinionated defaults?
17. **NEW:** Should FLOW approval block commits or just warn?

---

## Conclusion (UPDATED)

**CodeAnchor solves a real pain:** Stale docs & AI ignoring conventions.

**Architecture refined:** Hybrid AST+LLM with reliability guarantees.

**Critical decisions made:**
- ✅ No background processes (reliability first)
- ✅ Template-only pre-commit (<2s guaranteed)
- ✅ Manual AI enrichment (user control)
- ✅ Draft-based FLOW approval (safety first)
- ✅ Dependency-aware cache (accuracy)
- ✅ MASTER_INDEX as artifact (zero conflicts)

**MVP scope validated:** Phase 0 → Foundation → Detection → Git

**Next steps:**
1. **Phase 0** (2-3 days): ts-morph validation spike → Go/No-go decision
2. **Phase 1** (Week 1-2): Foundation + CLI scaffold
3. **Phase 2** (Week 2-3): Detection engine + cache
4. **Phase 3** (Week 3-4): Git integration + enrichment commands

**Success metrics:**
- Pre-commit: <2s ✅
- Cache hit rate: >80% ✅
- Zero silent failures ✅
- Zero FLOW.md inaccuracies ✅

**Risk mitigation:** See detailed analysis in `plans/reports/brainstorm-2026-01-21-risk-mitigation.md`

**Remember:** Perfect tool is reliable first, intelligent second. Speed + accuracy + control = success.

---

## Sources

- [Pre-commit Performance Best Practices](https://pre-commit.com/)
- [Pre-commit Hooks Guide 2025](https://gatlenculp.medium.com/effortless-code-quality-the-ultimate-pre-commit-hooks-guide-for-2025-57ca501d9835)
- [Git Hooks Complete Guide](https://www.datacamp.com/tutorial/git-hooks-complete-guide)
- [ts-morph Performance Documentation](https://ts-morph.com/manipulation/performance)
- [AST-based Refactoring with ts-morph](https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/)
- [GitHub Workflow Artifacts](https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts)
- [Artifacts vs Cache in GitHub Actions](https://echobind.com/post/difference-between-artifacts-and-cache-in-GitHub-Actions)
- [Git Flow and Immutable Build Artifacts](https://shinesolutions.com/2015/01/07/git-flow-and-immutable-build-artifacts/)

---

## 12. Related Documents

### Risk Analysis & Mitigation
📄 **[Risk Mitigation Strategies](./brainstorm-2026-01-21-risk-mitigation.md)**
- Detailed solutions for 5 critical risks
- Implementation code examples
- Decision rationale & trade-offs
- Phase 0 validation requirements

### Vietnamese Analysis (Original Issues)
📄 **[Technical Risk Analysis](../../issue-brainstorm.md)** (Vietnamese)
- Background process instability concerns
- Cache invalidation edge cases
- FLOW.md human-in-loop requirements

---

## Changelog

### 2026-01-21 (v2) - Architecture Refinement
**Major Changes:**
- ❌ REMOVED: Background enrichment queue (reliability risk)
- ❌ REMOVED: AI in pre-commit hook (performance risk)
- ✅ ADDED: Phase 0 validation spike (ts-morph feasibility)
- ✅ ADDED: Manual `anchor enrich` command (user control)
- ✅ ADDED: Draft-based FLOW approval (safety)
- ✅ ADDED: Dependency-aware cache (accuracy)
- ✅ REFINED: MASTER_INDEX as build artifact (zero conflicts)

**Rationale:** Prioritize reliability + speed over feature completeness

**Risk Status:**
- Background process: RESOLVED (removed)
- Pre-commit performance: GUARANTEED (<2s)
- Cache invalidation: MITIGATED (dependency tracking)
- FLOW.md accuracy: PROTECTED (approval required)
- ts-morph complexity: VALIDATING (Phase 0 spike)

---

*Report generated: 2026-01-21*
*Last updated: 2026-01-21 (v2 - Risk mitigation refinement)*
*Status: Ready for Phase 0 validation*
*Next milestone: ts-morph feasibility validation → Week 1 Foundation*
