# CodeAnchor - Product Brainstorm

> A CLI tool that anchors your code to standards and living documentation.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Architecture](#2-core-architecture)
3. [CLI Design](#3-cli-design)
4. [AI Provider System](#4-ai-provider-system)
5. [Smart Component Detection](#5-smart-component-detection)
6. [Configuration Schema](#6-configuration-schema)
7. [Monorepo Support](#7-monorepo-support)
8. [SSoT Documentation Layer](#8-ssot-documentation-layer)
9. [Git Integration](#9-git-integration)
10. [Technical Stack](#10-technical-stack)
11. [Development Workflow Rules](#11-development-workflow-rules) ⚠️ **MUST READ**
12. [Development Roadmap](#12-development-roadmap)

---

## 1. Overview

### Problem Statement

- AI-generated code often ignores project conventions and existing patterns
- Documentation becomes stale and disconnected from code
- No single source of truth for component specifications
- Manual effort required to maintain consistency across large codebases

### Solution

CodeAnchor provides:

- **Configuration-driven standards** - Define rules once, enforce everywhere
- **Living documentation** - Auto-generated docs that stay in sync with code
- **Smart detection** - Automatically document new components created by AI or developers
- **Git integration** - Seamless commit workflow with doc updates

---

## 2. Core Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                              │
│  User Prompt / AI Code Generation / Manual File Creation         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTEXT LAYER (RAG)                        │
│  • Read MASTER_INDEX.md → Find related components/features       │
│  • Load anchor.config.json → Apply rules                         │
│  • Load Feature/FLOW.md → Understand business logic              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                            │
│  • Component Analyzer (AST parsing via ts-morph)                 │
│  • Template Engine (Handlebars)                                  │
│  • AI Enhancement (optional - descriptions, examples)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                              │
│  • Code files (.tsx, .ts)                                        │
│  • Documentation files (.md)                                     │
│  • Index files (MASTER_INDEX.md)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GIT HOOK LAYER                              │
│  • Pre-commit: Scan diff → Update docs → Stage all               │
│  • Generate semantic commit message                              │
│  • Execute commit                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
codeanchor/
├── bin/
│   └── anchor.js                 # CLI entry point
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.ts           # Initialize project
│   │   │   ├── watch.ts          # Watch mode
│   │   │   ├── sync.ts           # Sync docs
│   │   │   ├── commit.ts         # Smart commit
│   │   │   └── status.ts         # Project status
│   │   └── index.ts
│   ├── core/
│   │   ├── config-loader.ts      # Parse anchor.config.json
│   │   ├── context-builder.ts    # Build RAG context
│   │   └── workspace.ts          # Workspace detection
│   ├── providers/
│   │   ├── ai-provider.ts        # Abstract interface
│   │   ├── claude.ts             # Anthropic Claude
│   │   ├── openai.ts             # OpenAI GPT
│   │   ├── gemini.ts             # Google Gemini
│   │   └── ollama.ts             # Local Ollama
│   ├── analyzers/
│   │   ├── component-analyzer.ts # Parse React components
│   │   ├── props-extractor.ts    # Extract props/interfaces
│   │   └── dependency-tracker.ts # Track cross-references
│   ├── generators/
│   │   ├── doc-generator.ts      # Generate markdown docs
│   │   ├── index-generator.ts    # Generate MASTER_INDEX
│   │   └── template-engine.ts    # Handlebars wrapper
│   ├── watchers/
│   │   ├── file-watcher.ts       # Chokidar wrapper
│   │   └── change-detector.ts    # Detect meaningful changes
│   ├── git/
│   │   ├── git-handler.ts        # Git operations
│   │   ├── diff-parser.ts        # Parse git diff
│   │   └── hooks.ts              # Git hooks management
│   ├── templates/
│   │   ├── atomic/
│   │   │   ├── component.md.hbs
│   │   │   └── atom.tsx.hbs
│   │   ├── feature-based/
│   │   │   ├── feature.md.hbs
│   │   │   └── flow.md.hbs
│   │   └── shared/
│   │       └── readme.md.hbs
│   └── utils/
│       ├── logger.ts
│       └── prompts.ts
└── package.json
```

---

## 3. CLI Design

### Command Structure

```bash
# Initialization
anchor init                      # Interactive setup wizard

# Development
anchor watch                     # Watch mode - auto-detect changes
anchor sync                      # Manual sync docs with code
anchor status                    # Show project health

# Documentation
anchor docs generate             # Generate all docs
anchor docs check                # Check doc freshness
anchor docs search <query>       # Search in docs

# Git Workflow
anchor commit                    # Smart commit with doc updates
anchor diff                      # Show changes + affected docs

# Utilities
anchor doctor                    # Diagnose configuration issues
anchor index                     # Rebuild MASTER_INDEX
```

### Interactive Init Flow

```
$ anchor init

┌─────────────────────────────────────────────────────────────┐
│  🚀 CodeAnchor Setup                                        │
└─────────────────────────────────────────────────────────────┘

Scanning project...

📦 Detected from package.json:
   • next: 14.0.4
   • react: 18.2.0
   • tailwindcss: 3.4.0
   • zustand: 4.4.7

? Confirm detected tech stack?
  ❯ Yes, use detected stack
    No, let me customize

? Project structure preference:
    Atomic Design     (atoms → molecules → organisms)
  ❯ Feature-based    (features/Auth, features/Checkout)
    Modular          (modules with own routes & state)
    Custom           (define your own)

? Enable AI features?
  ❯ Yes, setup now
    No, use templates only

? Select AI provider:
  ❯ Claude (Anthropic)
    OpenAI (GPT-4)
    Gemini (Google)
    Ollama (Local)

? Enter your API key:
  > sk-ant-xxxxx

? Documentation language:
    English
  ❯ Vietnamese
    Both

Creating configuration...
  ✓ Created anchor.config.json
  ✓ Created .anchor/MASTER_INDEX.md
  ✓ Created .anchor/templates/

Setup complete!
```

### Watch Mode

```
$ anchor watch

┌─────────────────────────────────────────────────────────────┐
│  👁️  CodeAnchor Watch Mode                                  │
│  Watching: src/components/**, src/features/**               │
└─────────────────────────────────────────────────────────────┘

[14:32:05] Detected: New file src/components/atoms/Spinner.tsx
[14:32:05] Analyzing component...
[14:32:06] ✓ Generated README.md
[14:32:06] ✓ Updated MASTER_INDEX.md

[14:35:12] Detected: Modified src/features/Auth/LoginForm.tsx
[14:35:12] Props changed: +loading, +errorMessage
[14:35:13] ✓ Updated README.md (props table)

Ctrl+C to stop watching
```

---

## 4. AI Provider System

### Abstract Interface

```typescript
interface AIProvider {
  name: string;
  
  // Core methods
  generateCode(prompt: string, context: Context): Promise<string>;
  generateDocs(component: ComponentMeta): Promise<string>;
  summarizeChanges(diff: string): Promise<string>;
  analyzeComponent(code: string): Promise<ComponentMeta>;
  
  // Validation
  testConnection(): Promise<boolean>;
}
```

### Supported Providers

| Provider | Model Examples | Use Case |
|----------|---------------|----------|
| **Claude** | claude-sonnet-4-20250514, claude-opus-4-20250514 | Best for code understanding |
| **OpenAI** | gpt-4o, gpt-4-turbo | Widely available |
| **Gemini** | gemini-1.5-pro | Google ecosystem |
| **Ollama** | llama3, codellama | Local, private |

### Configuration

```json
{
  "ai": {
    "provider": "claude",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "${ANTHROPIC_API_KEY}",
    "options": {
      "temperature": 0.3,
      "maxTokens": 4096
    }
  }
}
```

### Fallback Behavior

When AI is not configured or unavailable:
- Use template-based generation (Handlebars)
- Extract props from AST (ts-morph)
- Skip AI-enhanced descriptions
- Still functional, just less intelligent

---

## 5. Smart Component Detection

### Detection Triggers

| Trigger | Description |
|---------|-------------|
| **File Watch** | Real-time detection during development |
| **Pre-commit Hook** | Scan staged files before commit |
| **Manual Sync** | Full project scan via `anchor sync` |
| **Post AI-Gen** | After AI creates new files |

### Detection Flow

```
New File Created
       │
       ▼
┌─────────────────────────────────────┐
│  File Watcher (chokidar)            │
│  Match: src/components/**/*.tsx     │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Component Analyzer (ts-morph)      │
│  • Extract component name           │
│  • Parse props interface            │
│  • Detect variants                  │
│  • Find dependencies                │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Doc Generator                      │
│  • Generate README.md               │
│  • (Optional) AI enhancement        │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Index Updater                      │
│  • Update MASTER_INDEX.md           │
│  • Update cross-references          │
└─────────────────────────────────────┘
```

### Automatic Prop Extraction

Input:
```typescript
interface ButtonProps {
  /** Button label */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Click handler */
  onClick?: () => void;
}
```

Output:
```markdown
| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `children` | `React.ReactNode` | - | ✅ | Button label |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | - | ❌ | Visual variant |
| `onClick` | `() => void` | - | ❌ | Click handler |
```

---

## 6. Configuration Schema

### Full Schema

```json
{
  "$schema": "https://codeanchor.dev/schema/v1.json",
  "projectName": "my-app",
  
  "structure": {
    "type": "atomic",
    "paths": {
      "atoms": "src/components/atoms",
      "molecules": "src/components/molecules",
      "organisms": "src/components/organisms",
      "templates": "src/components/templates",
      "features": "src/features"
    }
  },
  
  "stack": ["Next.js 14", "TailwindCSS", "Zustand", "Day.js"],
  
  "rules": {
    "components": {
      "naming": "PascalCase",
      "fileNaming": "PascalCase",
      "exportStyle": "named",
      "propsInterface": "required"
    },
    "styling": {
      "allowed": ["tailwind"],
      "banned": ["css-modules", "styled-components"]
    },
    "functions": {
      "style": "arrow-function"
    },
    "imports": {
      "aliasRequired": true,
      "sortOrder": ["react", "next", "external", "internal", "relative"]
    }
  },
  
  "ai": {
    "provider": "claude",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "${ANTHROPIC_API_KEY}",
    "options": {
      "temperature": 0.3,
      "maxTokens": 4096
    }
  },
  
  "detection": {
    "enabled": true,
    "watchPatterns": [
      "src/components/**/*.tsx",
      "src/features/**/*.tsx"
    ],
    "ignore": [
      "**/*.test.tsx",
      "**/*.stories.tsx",
      "**/index.ts"
    ],
    "autoGenerateDocs": true,
    "autoUpdateIndex": true
  },
  
  "documentation": {
    "language": "en",
    "includeUsageExamples": true,
    "includeChangeHistory": true,
    "aiEnhanced": true
  },
  
  "git": {
    "conventionalCommits": true,
    "autoStageDocs": true,
    "hooks": {
      "preCommit": ["sync", "validate"]
    }
  }
}
```

### Config Inheritance (Monorepo)

```json
// Root: anchor.config.json
{
  "projectName": "monorepo",
  "defaults": {
    "structure": "atomic",
    "rules": { "css": "tailwind-only" }
  },
  "workspaces": ["packages/*", "apps/*"]
}

// packages/mobile/anchor.config.json
{
  "extends": "../../anchor.config.json",
  "projectName": "mobile-app",
  "structure": "feature-based",
  "rules": {
    "css": "nativewind"
  }
}
```

---

## 7. Monorepo Support

### Structure

```
my-monorepo/
├── anchor.config.json          # Root config (shared defaults)
├── .anchor/
│   └── MASTER_INDEX.md         # Global index
│
├── packages/
│   ├── web/
│   │   ├── anchor.config.json  # Package override
│   │   ├── .anchor/
│   │   │   └── MASTER_INDEX.md
│   │   └── src/
│   │
│   ├── mobile/
│   │   ├── anchor.config.json
│   │   └── src/
│   │
│   └── shared/
│       ├── anchor.config.json
│       └── src/
│
└── apps/
    └── dashboard/
        ├── anchor.config.json
        └── src/
```

### Workspace Detection

```bash
$ cd packages/web
$ anchor status

┌─────────────────────────────────────────────────────────────┐
│  📦 Package: web                                            │
│  📍 Root: my-monorepo                                       │
│  🏗️  Structure: atomic (inherited)                          │
│  📋 Config: packages/web/anchor.config.json                 │
└─────────────────────────────────────────────────────────────┘

Components: 24 (12 atoms, 8 molecules, 4 organisms)
Features: 5
Doc Coverage: 87%
```

### Cross-package Commands

```bash
anchor status --all              # All workspaces
anchor sync --workspace=web      # Specific workspace
anchor docs check --workspace=shared
```

---

## 8. SSoT Documentation Layer

### Three-Level Hierarchy

#### Level 1: Component SSoT (Micro)
- Location: `Component/README.md`
- Content: Props, variants, usage examples, change history
- Auto-generated from code

#### Level 2: Feature/Flow SSoT (Macro)
- Location: `Feature/FLOW.md`
- Content: User flow, API endpoints, state management
- Partially auto-generated, partially manual

#### Level 3: Master Index (Global)
- Location: `.anchor/MASTER_INDEX.md`
- Content: Metadata index, component registry
- Fully auto-generated

### Component README Template

```markdown
# {{componentName}}

> Auto-generated by CodeAnchor | Last updated: {{lastUpdated}}

## Overview
{{description}}

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
{{#each props}}
| `{{name}}` | `{{type}}` | `{{default}}` | {{required}} | {{description}} |
{{/each}}

## Variants
{{#each variants}}
### {{name}}
{{description}}
{{/each}}

## Usage

```tsx
{{usageExample}}
```

## Used In
{{#each usedIn}}
- [{{name}}]({{path}})
{{/each}}

## Change History
{{#each changes}}
- `{{date}}` - {{message}} ({{author}})
{{/each}}
```

### Feature FLOW Template

```markdown
# {{featureName}} Flow

> Last updated: {{lastUpdated}}

## Overview
{{description}}

## User Flow

```mermaid
{{flowDiagram}}
```

## Components

| Component | Role |
|-----------|------|
{{#each components}}
| [{{name}}]({{path}}) | {{role}} |
{{/each}}

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
{{#each endpoints}}
| `{{method}}` | `{{path}}` | {{description}} |
{{/each}}

## State Management
{{stateDescription}}
```

---

## 9. Git Integration

### Smart Commit Flow

```
$ anchor commit

Scanning changes...
  • 5 files modified
  • 2 new components detected
  • 1 feature updated

Generating documentation...
  ✓ Created Button/README.md
  ✓ Created Input/README.md
  ✓ Updated Checkout/FLOW.md
  ✓ Updated MASTER_INDEX.md

Staging files...
  ✓ Staged 5 code files
  ✓ Staged 4 documentation files

Generating commit message...

┌─────────────────────────────────────────────────────────────┐
│  📝 Suggested commit message:                                │
│                                                              │
│  feat(checkout): add payment form validation                 │
│                                                              │
│  - Add Button and Input components                           │
│  - Update checkout flow with validation step                 │
│  - Auto-generate component documentation                     │
└─────────────────────────────────────────────────────────────┘

? Use this message?
  ❯ Yes, commit now
    Edit message
    Cancel

✓ Committed: abc1234
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit (installed via `anchor hooks install`)

#!/bin/sh
anchor sync --staged-only
anchor docs validate
```

### Commit Message Generation

AI analyzes git diff and generates semantic commit message:

```
feat(scope): short description

- Bullet point 1
- Bullet point 2
- Documentation updates (auto-generated)
```

---

## 10. Technical Stack

### Dependencies

```json
{
  "dependencies": {
    // CLI Framework
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "boxen": "^7.1.0",
    
    // Config & Validation
    "zod": "^3.22.0",
    "cosmiconfig": "^9.0.0",
    
    // Code Parsing
    "ts-morph": "^22.0.0",
    "@babel/parser": "^7.24.0",
    
    // Template Engine
    "handlebars": "^4.7.8",
    
    // Git
    "simple-git": "^3.22.0",
    
    // File System
    "chokidar": "^3.6.0",
    "fast-glob": "^3.3.0",
    "fs-extra": "^11.2.0",
    
    // Markdown
    "remark": "^15.0.0",
    "remark-gfm": "^4.0.0",
    
    // AI Providers
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "@google/generative-ai": "^0.2.0"
  },
  "optionalDependencies": {
    "ollama": "^0.5.0"
  }
}
```

### Technology Choices

| Purpose | Technology | Reason |
|---------|------------|--------|
| CLI Framework | Commander.js | Industry standard, excellent DX |
| Interactive Prompts | Inquirer.js | Beautiful prompts, easy to use |
| Schema Validation | Zod | Type-safe, great error messages |
| AST Parsing | ts-morph | TypeScript-native, powerful API |
| Templates | Handlebars | Simple, extensible, well-known |
| Git Operations | simple-git | Promise-based, comprehensive |
| File Watching | chokidar | Cross-platform, reliable |

---

## 11. Development Workflow Rules

### Rule #1: Plan Before Code

> **No code without a plan. No deviation from the plan.**

Every development task MUST follow this workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE PLAN                                                  │
│     └── Write detailed plan file before any code                 │
├─────────────────────────────────────────────────────────────────┤
│  2. REVIEW PLAN                                                  │
│     └── Validate plan covers all requirements                    │
├─────────────────────────────────────────────────────────────────┤
│  3. EXECUTE PLAN                                                 │
│     └── Code ONLY what is specified in the plan                  │
├─────────────────────────────────────────────────────────────────┤
│  4. VERIFY AGAINST PLAN                                          │
│     └── Check implementation matches plan exactly                │
└─────────────────────────────────────────────────────────────────┘
```

### Plan File Structure

Each phase/feature requires a plan file in `/docs/plans/`:

```
docs/plans/
├── phase-1-foundation.md
├── phase-2-detection.md
├── phase-3-git.md
├── phase-4-monorepo.md
└── phase-5-polish.md
```

### Plan File Template

```markdown
# Plan: [Feature/Phase Name]

## Objective
Clear statement of what this plan achieves.

## Prerequisites
- [ ] Dependency 1 completed
- [ ] Dependency 2 completed

## Scope
### In Scope
- Item 1
- Item 2

### Out of Scope
- Item 1 (will be done in Phase X)

## Implementation Steps

### Step 1: [Name]
**Files to create/modify:**
- `path/to/file.ts` - Description of changes

**Details:**
- Specific implementation detail 1
- Specific implementation detail 2

**Acceptance Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2

### Step 2: [Name]
...

## Testing Strategy
- Unit tests for X
- Integration tests for Y

## Rollback Plan
How to undo if something goes wrong.

## Checklist
- [ ] Step 1 completed
- [ ] Step 2 completed
- [ ] All tests passing
- [ ] Documentation updated
```

### Rules for Plan Execution

| Rule | Description |
|------|-------------|
| **No Skipping** | Every step must be completed in order |
| **No Adding** | Don't add features not in the plan |
| **No Shortcuts** | Follow the specified implementation details |
| **Document Deviations** | If plan needs changes, update plan FIRST |
| **Checkpoint Reviews** | Review after each major step |

### Plan Change Protocol

If during execution you discover the plan needs changes:

1. **STOP** current implementation
2. **DOCUMENT** what was discovered
3. **UPDATE** the plan file with changes
4. **REVIEW** updated plan
5. **CONTINUE** from where you stopped

```markdown
## Plan Amendments

### Amendment 1 - [Date]
**Reason:** [Why the change is needed]
**Original:** [What was planned]
**Changed to:** [New approach]
**Impact:** [What else is affected]
```

### Example: Phase 1 Plan

```markdown
# Plan: Phase 1 - Foundation

## Objective
Set up project scaffold, CLI framework, and AI provider system.

## Prerequisites
- [ ] Node.js 20+ installed
- [ ] npm/pnpm available

## Scope
### In Scope
- Project initialization
- TypeScript configuration
- CLI entry point
- `anchor init` command
- AI provider abstraction
- Claude provider implementation

### Out of Scope
- File watching (Phase 2)
- Git integration (Phase 3)
- OpenAI/Gemini providers (can add later)

## Implementation Steps

### Step 1: Project Scaffold
**Files to create:**
- `package.json` - Project configuration
- `tsconfig.json` - TypeScript config
- `.gitignore` - Git ignore rules
- `src/index.ts` - Main entry

**Acceptance Criteria:**
- [ ] `npm install` works
- [ ] `npm run build` compiles without errors

### Step 2: CLI Framework
**Files to create:**
- `bin/anchor.js` - CLI entry point
- `src/cli/index.ts` - Command registration
- `src/cli/commands/init.ts` - Init command

**Acceptance Criteria:**
- [ ] `anchor --help` shows available commands
- [ ] `anchor --version` shows version

### Step 3: Config System
**Files to create:**
- `src/core/config-loader.ts` - Load anchor.config.json
- `src/core/schema.ts` - Zod schema definition
- `src/types/config.ts` - TypeScript types

**Acceptance Criteria:**
- [ ] Can load valid config
- [ ] Rejects invalid config with clear errors

### Step 4: AI Provider System
**Files to create:**
- `src/providers/ai-provider.ts` - Abstract interface
- `src/providers/claude.ts` - Claude implementation
- `src/providers/index.ts` - Provider factory

**Acceptance Criteria:**
- [ ] Can instantiate Claude provider
- [ ] `testConnection()` works with valid API key

### Step 5: Init Command
**Files to modify:**
- `src/cli/commands/init.ts` - Full implementation

**Details:**
- Detect package.json
- Interactive prompts for config
- Generate anchor.config.json
- Create .anchor directory

**Acceptance Criteria:**
- [ ] `anchor init` creates valid config
- [ ] Detects existing tech stack
- [ ] Prompts for AI provider setup

## Testing Strategy
- Unit tests for config validation
- Integration test for init command

## Checklist
- [ ] Step 1: Project Scaffold
- [ ] Step 2: CLI Framework
- [ ] Step 3: Config System
- [ ] Step 4: AI Provider System
- [ ] Step 5: Init Command
- [ ] All tests passing
- [ ] README updated
```

---

## 12. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project scaffold with TypeScript
- [ ] CLI setup with Commander.js
- [ ] Config parser with Zod validation
- [ ] `anchor init` command
- [ ] AI provider abstraction
- [ ] Claude, OpenAI, Gemini implementations

### Phase 2: Smart Detection (Week 2-3)
- [ ] File watcher system
- [ ] Component analyzer with ts-morph
- [ ] Props extractor
- [ ] Auto README generation
- [ ] MASTER_INDEX generator
- [ ] `anchor watch` command
- [ ] `anchor sync` command

### Phase 3: Git Integration (Week 3-4)
- [ ] `anchor commit` workflow
- [ ] Git diff parser
- [ ] Pre-commit hooks
- [ ] AI commit message generation
- [ ] Change history tracking

### Phase 4: Monorepo Support (Week 4-5)
- [ ] Config inheritance
- [ ] Workspace detection
- [ ] Cross-package references
- [ ] Scoped commands

### Phase 5: Polish & DX (Week 5-6)
- [ ] Beautiful CLI output
- [ ] Comprehensive error handling
- [ ] `anchor doctor` diagnostics
- [ ] `anchor status` dashboard
- [ ] Plugin system foundation

---

## Open Questions

1. **Plugin System** - Should we support custom analyzers/generators?
2. **IDE Integration** - VS Code extension later?
3. **Cloud Sync** - Optional team documentation sync?
4. **Versioning** - How to handle breaking config changes?

---

## References

- [Atomic Design by Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [ts-morph Documentation](https://ts-morph.com/)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

*Last updated: January 2026*
