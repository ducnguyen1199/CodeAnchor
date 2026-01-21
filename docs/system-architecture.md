# System Architecture

> **Document:** Technical system design for CodeAnchor
> **Last Updated:** 2026-01-21
> **Current Phase:** Phase 0 Complete (GO to Phase 1)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Cache Strategy](#cache-strategy)
5. [AI Provider Integration](#ai-provider-integration)
6. [Git Integration](#git-integration)
7. [CLI Command Architecture](#cli-command-architecture)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Performance Characteristics](#performance-characteristics)
10. [Scalability Considerations](#scalability-considerations)

---

## Architecture Overview

### System Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                          │
│                    (CLI Commands & Interactive Prompts)          │
│  anchor init  │  anchor watch  │  anchor sync  │  anchor commit  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                 ORCHESTRATION LAYER                              │
│  • Change Detection        • Context Builder                     │
│  • Workflow Coordinator    • Configuration Manager              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│              PROCESSING PIPELINE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Analyzer    │  │  Generator   │  │  Validator   │           │
│  │              │  │              │  │              │           │
│  │ • Component  │  │ • Doc Gen    │  │ • Rule Check │           │
│  │ • Props      │  │ • Index Gen  │  │ • Format Val │           │
│  │ • Deps       │  │ • Template   │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                              │
│  • AST Parser (ts-morph)   • Cache Manager                       │
│  • Template Engine         • Git Handler                         │
│  • File Watcher            • AI Providers                        │
│  • Config Loader           • Logger                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                 STORAGE & EXTERNAL LAYER                         │
│  • File System             • Git Repository                      │
│  • Cache Storage           • AI Services                         │
│  • Environment Vars        • Configuration Files                 │
└──────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns** - Each layer has distinct responsibilities
2. **Dependency Injection** - Dependencies passed, not instantiated
3. **Async-first** - All I/O operations async
4. **Fail gracefully** - Fallback mechanisms for every critical path
5. **Test-driven** - Testable architecture from ground up
6. **Observable** - Comprehensive logging and error tracking

---

## Core Components

### 1. Component Analyzer

**Purpose:** Parse React/TypeScript components and extract metadata

**Interfaces:**
```typescript
interface ComponentAnalyzer {
  analyze(sourceFile: SourceFile): Promise<ComponentMeta>;
}

interface ComponentMeta {
  name: string;
  filePath: string;
  props: Prop[];
  variants?: string[];
  dependencies: string[];
  jsDoc?: JSDocMeta;
}

interface Prop {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  union?: string[];
}
```

**Implementation Strategy (Phase 1):**
- Use ts-morph to traverse component AST
- Extract props interface
- Parse JSDoc comments
- Identify import dependencies
- Generate structured metadata

**Performance Target:** 6-13ms per component (Phase 0: validated)

### 2. Dependency-Aware Cache Manager

**Purpose:** Store and validate component metadata with smart invalidation (Phase 0: IMPLEMENTED)

**Key Features:**
- SHA-256 file hashing for change detection
- Direct import dependency tracking (1-level)
- Version-based cache compatibility
- Automatic cleanup on invalidation

**Cache Entry Structure:**
```typescript
interface CacheEntry {
  fileHash: string;                    // SHA-256 of component file
  dependencies: DependencyCache[];     // Direct imports
  structure: ComponentStructure;       // Parsed metadata
  lastParsed: Date;                    // Timestamp
  version: string;                     // Cache format version
}

interface DependencyCache {
  path: string;                        // Absolute path
  hash: string;                        // File hash
  mtime: number;                       // Modification time
}
```

**Hit Rate:** 80% validated in Phase 0

**Storage:** `.anchor/cache/{filehash}.json`

### 3. Configuration Loader

**Purpose:** Load and validate project configuration (Phase 1)

**Responsibilities:**
- Discover `anchor.config.json` in project root
- Parse and validate with Zod schema
- Support environment variable substitution
- Detect technology stack
- Handle monorepo workspace config inheritance

**Configuration Priority:**
1. Project-specific config (`anchor.config.json`)
2. Workspace config (inherited in monorepo)
3. Environment variables (override)
4. Defaults (built-in)

### 4. AI Provider System

**Purpose:** Unified interface to multiple AI providers (Phase 1)

**Architecture:**
```typescript
interface AIProvider {
  name: string;
  testConnection(): Promise<boolean>;
  generateDescription(component: ComponentMeta): Promise<string>;
  generateExample(component: ComponentMeta): Promise<string>;
  summarizeChanges(diff: string): Promise<string>;
}

class ProviderFactory {
  static create(type: 'claude' | 'openai' | 'gemini' | 'ollama'): AIProvider
}
```

**Providers:**
- **Claude (Anthropic)** - Primary, best for code understanding
- **OpenAI** - Widely available fallback
- **Gemini** - Google ecosystem
- **Ollama** - Local/private deployments

**Fallback Behavior:**
- No AI configured → Use templates only
- AI unavailable → Use cache or template
- Parsing error → Fallback template

### 5. Document Generator

**Purpose:** Generate and update markdown documentation (Phase 2)

**Capabilities:**
- **Component README** - Auto-generated from metadata
- **Feature FLOW** - Semi-auto with AI enhancement
- **MASTER INDEX** - Fully auto-generated registry

**Template System:**
```typescript
interface TemplateContext {
  component: ComponentMeta;
  feature?: FeatureMeta;
  relatedComponents?: ComponentMeta[];
  config: AnchorConfig;
}

// Render with Handlebars
const html = template.render(context);
```

### 6. Git Integration

**Purpose:** Seamless Git workflow integration (Phase 3)

**Components:**
- **Pre-commit Hook** - Intercept commits to update docs
- **Diff Parser** - Understand what changed
- **Commit Message Generator** - Semantic commit messages
- **Git Handler** - Staging and committing

**Hook Workflow:**
```
git commit
  ↓
pre-commit hook triggers
  ↓
anchor scan staged files
  ↓
analyze changes
  ↓
generate/update docs
  ↓
auto-stage doc updates
  ↓
commit proceeds
```

---

## Data Flow

### 1. Watch Mode Flow

```
File System Event (add/modify/delete)
        │
        ▼
┌─────────────────────────┐
│   File Watcher          │
│   (chokidar)            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Change Detector        │
│  • Filter ignored files │
│  • Batch events         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Cache Manager          │
│  • Check needsUpdate()  │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
 CACHE HIT    CACHE MISS
    │             │
    │             ▼
    │      ┌──────────────────┐
    │      │ Component        │
    │      │ Analyzer         │
    │      │ • Parse AST      │
    │      │ • Extract props  │
    │      │ • Track deps     │
    │      └────────┬─────────┘
    │              │
    │              ▼
    │      ┌──────────────────┐
    │      │ AI Enhancement   │
    │      │ (if configured)  │
    │      │ • Generate desc  │
    │      └────────┬─────────┘
    │              │
    └──────┬───────┘
           │
           ▼
┌─────────────────────────┐
│  Cache Storage          │
│  • Save metadata        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Doc Generator          │
│  • Render templates     │
│  • Write README.md      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Index Updater          │
│  • Update MASTER_INDEX  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  User Notification      │
│  • CLI output           │
└─────────────────────────┘
```

### 2. Commit Workflow

```
$ anchor commit
     │
     ▼
┌─────────────────────────┐
│  Git Diff Parser        │
│  • Read staged changes  │
│  • Identify modified    │
│    components           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Change Analysis        │
│  • Detect new files     │
│  • Detect modifications │
│  • Detect deletions     │
└──────────┬──────────────┘
           │
    ┌──────┴──────┬─────────┐
    │             │         │
    ▼             ▼         ▼
  NEW           MODIFY    DELETE
  FILES         FILES     FILES
    │             │         │
    └──────┬───────┴────────┘
           │
           ▼
┌─────────────────────────┐
│  Batch Analysis         │
│  (parallel processing)  │
│  • Analyze each file    │
│  • Check dependencies   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Documentation Update   │
│  • Generate READMEs     │
│  • Update FLOW.md       │
│  • Update MASTER_INDEX  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Auto-Stage Docs        │
│  • git add *.md         │
│  • git add .anchor/     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Commit Message Gen     │
│  • Analyze changes      │
│  • Generate message     │
│  • Show suggestion      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Interactive Prompt     │
│  • User confirms        │
│  • User may edit        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Execute Commit         │
│  • git commit -m        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Success Notification   │
└─────────────────────────┘
```

### 3. Context Building (for AI)

```
┌─────────────────────────┐
│  Component Being Docs   │
│  (source file)          │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Load Related Documentation              │
│  • Search MASTER_INDEX for related items │
│  • Load feature FLOW.md if applicable    │
│  • Find dependent components             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Load Project Configuration              │
│  • Rules for this project                │
│  • Tech stack info                       │
│  • Documentation preferences             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Load Related Code Examples              │
│  • Similar components                    │
│  • Usage patterns                        │
│  • API endpoints (if feature)            │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Build RAG Context                       │
│  • Assemble all relevant information     │
│  • Format for AI consumption             │
│  • Optimize for token count              │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  Pass to AI Provider                     │
│  • Enhanced component descriptions       │
│  • Usage examples                        │
│  • Related documentation links           │
└──────────────────────────────────────────┘
```

---

## Cache Strategy

### Cache Validation Algorithm

```
1. Load cache file for component
   ├─ If not found → MISS (needs update)
   └─ If found → Continue

2. Check cache version compatibility
   ├─ If version mismatch → MISS (invalidate)
   └─ If match → Continue

3. Compute current file hash
   └─ Compare with cached fileHash
      ├─ If different → MISS (file modified)
      └─ If same → Continue

4. Get direct import dependencies
   └─ For each dependency:
      ├─ Check if exists (may be deleted)
      ├─ Check if mtime > lastParsed
      │  ├─ If yes → MISS (dependency modified)
      │  └─ If no → Continue
      └─ When all dependencies checked → HIT

5. Return HIT (no update needed) or MISS (update needed)
```

### Cache Invalidation Triggers

| Trigger | Action | Reason |
|---------|--------|--------|
| **File hash changed** | Invalidate | Component source changed |
| **Dependency mtime > lastParsed** | Invalidate | Dependency updated |
| **Cache version mismatch** | Invalidate | Cache format changed |
| **Dependency missing** | Skip (ignore) | Dependency deleted but irrelevant |
| **Cache not found** | Create | First analysis |

### Performance Impact

- **Cache HIT:** ~1ms (load from disk + validate)
- **Cache MISS:** ~6-13ms (parse component)
- **Hit Rate Typical:** 80% (Phase 0 validated)
- **Overall Speedup:** ~5x with caching

---

## AI Provider Integration

### Provider Selection Flow

```
Configuration Specified?
├─ No → Use Templates Only (no AI)
├─ Yes → Provider Available?
   ├─ No → Fallback to Templates
   └─ Yes → AI Processing
      ├─ Connection Test
      │  ├─ Fail → Fallback to Templates
      │  └─ Pass → Proceed
      ├─ Generate Enhanced Content
      │  ├─ Success → Use enhanced docs
      │  └─ Fail → Use fallback template
      └─ Return Result
```

### Token Usage Optimization

**Component Description:** ~150 tokens
**Usage Example:** ~200 tokens
**Context Payload:** ~500 tokens
**Response:** ~300 tokens

**Total per component:** ~1150 tokens
**Cost optimization:** Cache reduces redundant processing

---

## Git Integration

### Pre-commit Hook Installation

```bash
# During anchor init
$ anchor hooks install

# Creates .git/hooks/pre-commit:
#!/bin/sh
anchor sync --staged-only
anchor docs validate
```

### Hook Execution Flow

```
git commit
  │
  ▼
Check pre-commit hooks
  │
  ▼
Execute: anchor sync --staged-only
  │
  ├─ Parse git diff
  ├─ Identify changed components
  ├─ Run analysis on staged files
  ├─ Generate updated documentation
  ├─ Auto-stage documentation changes
  │
  ▼ (if successful)
Execute: anchor docs validate
  │
  ├─ Validate documentation format
  ├─ Check doc references
  ├─ Verify component metadata consistency
  │
  ▼ (if all pass)
Proceed with commit
  │
  ▼ (if any fail)
Abort commit, show error details
```

---

## CLI Command Architecture

### Command Hierarchy

```
anchor [global-options]
├─ init
│  ├─ [interactive prompts]
│  └─ Generate anchor.config.json
│
├─ watch
│  ├─ Start file watcher
│  ├─ Monitor src/components/** patterns
│  └─ Auto-update docs on changes
│
├─ sync
│  ├─ Manual documentation sync
│  ├─ [--staged-only]
│  ├─ [--workspace=<name>]
│  └─ Process all modified components
│
├─ commit
│  ├─ Smart commit workflow
│  ├─ [--message=<message>]
│  └─ Auto-update and commit docs
│
├─ docs
│  ├─ generate    # Regenerate all docs
│  ├─ check       # Validate doc freshness
│  ├─ search      # Search documentation
│  └─ validate    # Check consistency
│
├─ status
│  ├─ Show project health
│  ├─ Component count
│  ├─ Doc coverage
│  └─ Cache status
│
└─ doctor
   └─ Diagnose configuration issues
```

### Global Options

```
--config <path>        # Config file path
--workspace <name>     # Monorepo workspace
--verbose             # Verbose logging
--dry-run             # Preview changes (no write)
--debug               # Debug mode logging
```

---

## Error Handling Strategy

### Error Categories

```
AnchorError
├─ ConfigValidationError
│  ├─ Missing required field
│  ├─ Invalid schema
│  └─ Type mismatch
│
├─ ComponentParseError
│  ├─ Invalid TypeScript syntax
│  ├─ Unsupported patterns
│  └─ Missing exports
│
├─ AIProviderError
│  ├─ Connection failure
│  ├─ API error
│  └─ Rate limit exceeded
│
├─ FileSystemError
│  ├─ Permission denied
│  ├─ File not found
│  └─ Disk full
│
└─ GitError
   ├─ Git not found
   ├─ Repository corrupted
   └─ Merge conflicts
```

### Recovery Strategies

| Error | Recovery |
|-------|----------|
| **Config error** | Show helpful message, suggest fix, abort |
| **Component parse error** | Create template-only docs, log warning |
| **AI provider error** | Fall back to template, notify user |
| **File system error** | Retry with backoff, suggest manual fix |
| **Git error** | Show git error, suggest manual recovery |

---

## Performance Characteristics

### Benchmark Results (Phase 0)

| Scenario | Components | Time | Per-Component | Status |
|----------|-----------|------|---------------|--------|
| Small | 10 | 1,063ms | 106ms | ✅ Pass |
| Medium | 50 | 658ms | 13ms | ✅ Pass |
| Large | 100 | 654ms | 6.5ms | ✅ Excellent |

### Throughput Targets

- **Pre-commit hook:** <2 seconds for typical projects
- **Watch mode response:** <200ms from file change to doc update
- **CLI startup:** <500ms
- **Single component parse:** 6-13ms
- **Document generation:** <100ms per component

### Scalability Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Max components (single phase)** | 500+ | Parallel processing enables higher |
| **Monorepo packages** | 20+ | Config inheritance scales well |
| **Max cache size** | ~500MB | For 5000 components (~100KB each) |
| **Memory peak** | <200MB | For 100 concurrent analyses |

---

## Scalability Considerations

### Horizontal Scaling

**Current (Phase 0-1):**
- Single machine execution
- Parallel component processing (Promise.all)
- Local cache storage

**Future (Phase 4+):**
- Distributed cache (Redis optional)
- Team documentation sync
- Cloud-based context retrieval

### Vertical Scaling

**Optimizations:**
1. **Lazy project loading** - Load only changed files (Phase 2 optimization)
2. **Batch processing** - Process multiple files in parallel
3. **Structure API** - 5x faster than full AST traversal (Phase 0 validated)
4. **Incremental updates** - Only re-analyze changed dependencies

### Monorepo Considerations

- Per-package configuration inheritance
- Cross-package reference tracking
- Shared cache across packages
- Workspace-aware commands

---

## Dependencies Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Commands                             │
│  (init, watch, sync, commit, status, doctor)                │
└────────────┬────────────────────────┬──────────────────────┘
             │                        │
             ▼                        ▼
┌──────────────────────────┐  ┌───────────────────────────┐
│  Orchestration Layer     │  │  Git Integration          │
│  • ConfigLoader          │  │  • GitHandler             │
│  • ContextBuilder        │  │  • DiffParser             │
│  • WorkspaceDetector     │  │  • HookManager            │
└────────────┬─────────────┘  └────────────┬──────────────┘
             │                            │
             ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Core Processing Modules                         │
│  • ComponentAnalyzer      • DocumentGenerator                │
│  • PropsExtractor         • IndexGenerator                   │
│  • DependencyTracker      • TemplateEngine                   │
└────────────┬────────────────────────────┬──────────────────┘
             │                            │
             ▼                            ▼
┌──────────────────────────┐  ┌───────────────────────────┐
│  Infrastructure Layer    │  │  AI Provider Layer        │
│  • CacheManager ✅       │  │  • AIProvider (abstract)  │
│  • TSMorph Parser        │  │  • ClaudeProvider         │
│  • FileWatcher           │  │  • OpenAIProvider         │
│  • Logger                │  │  • GeminiProvider         │
└────────────┬─────────────┘  │  • OllamaProvider         │
             │                └────────────┬──────────────┘
             │                            │
             └────────────┬───────────────┘
                          │
                          ▼
         ┌─────────────────────────────────┐
         │  External Services & Storage    │
         │  • File System                  │
         │  • Git Repository               │
         │  • AI APIs (Claude, OpenAI, etc) │
         │  • Environment Config            │
         └─────────────────────────────────┘
```

---

## Future Architecture Enhancements

### Phase 2 Optimizations
- Lazy project loading
- Parallel file processing
- Incremental cache updates
- Streaming document generation

### Phase 3 Enhancements
- Semantic commit analysis
- Change impact assessment
- Cross-component dependency updates

### Phase 4 Extensions
- Distributed cache (Redis)
- Workspace-aware metrics
- Cross-package relationship tracking

### Phase 5+ Roadmap
- Plugin system for custom analyzers
- IDE integration (VS Code extension)
- Team documentation sync
- Cloud-based context enrichment

---

**Document Owner:** Architecture Team
**Last Updated:** 2026-01-21
**Next Review:** Post Phase 1 Implementation

