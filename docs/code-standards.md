# Code Standards & Architecture Guide

> **Document:** Development standards for CodeAnchor
> **Last Updated:** 2026-01-21
> **Audience:** Core developers, contributors

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Naming Conventions](#naming-conventions)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Module Architecture](#module-architecture)
5. [Testing Standards](#testing-standards)
6. [Error Handling](#error-handling)
7. [Configuration & Dependencies](#configuration--dependencies)
8. [Git Workflow](#git-workflow)

---

## Directory Structure

### Project Layout

```
codeanchor/
├── bin/
│   └── anchor.js                    # CLI entry point (shebang script)
│
├── src/
│   ├── index.ts                     # Main exports
│   ├── cli/
│   │   ├── index.ts                 # CLI registration & setup
│   │   └── commands/
│   │       ├── init.ts              # anchor init command
│   │       ├── watch.ts             # anchor watch command
│   │       ├── sync.ts              # anchor sync command
│   │       └── commit.ts            # anchor commit command
│   │
│   ├── core/
│   │   ├── cache-manager.ts         # Dependency-aware caching (Phase 0 ✅)
│   │   ├── config-loader.ts         # Load & validate config (Phase 1)
│   │   ├── context-builder.ts       # Build RAG context (Phase 2)
│   │   └── workspace.ts             # Monorepo detection (Phase 4)
│   │
│   ├── analyzers/
│   │   ├── component-analyzer.ts    # AST-based component parsing
│   │   ├── props-extractor.ts       # Extract props & types
│   │   └── dependency-tracker.ts    # Track component dependencies
│   │
│   ├── generators/
│   │   ├── doc-generator.ts         # Generate markdown docs
│   │   ├── index-generator.ts       # Generate MASTER_INDEX
│   │   └── template-engine.ts       # Handlebars wrapper
│   │
│   ├── providers/
│   │   ├── ai-provider.ts           # Abstract AI interface
│   │   ├── claude.ts                # Claude provider
│   │   ├── openai.ts                # OpenAI provider
│   │   ├── gemini.ts                # Gemini provider
│   │   └── index.ts                 # Provider factory
│   │
│   ├── git/
│   │   ├── git-handler.ts           # Git operations wrapper
│   │   ├── diff-parser.ts           # Parse git diff
│   │   └── hooks.ts                 # Git hooks management
│   │
│   ├── types/
│   │   ├── config.ts                # Configuration types
│   │   ├── provider.ts              # AI provider types
│   │   ├── component.ts             # Component metadata types
│   │   └── index.ts                 # Type exports
│   │
│   ├── schemas/
│   │   └── config.schema.ts         # Zod config schema
│   │
│   ├── templates/
│   │   ├── component.md.hbs         # Component README template
│   │   ├── feature.md.hbs           # Feature README template
│   │   └── index.md.hbs             # MASTER_INDEX template
│   │
│   └── utils/
│       ├── logger.ts                # Logging utilities
│       ├── prompts.ts               # CLI prompt helpers
│       └── errors.ts                # Custom error classes
│
├── tests/
│   ├── validation/                  # Phase 0 validation tests ✅
│   │   ├── ts-morph-validation.test.ts
│   │   ├── performance-benchmark.test.ts
│   │   └── cache-strategy.test.ts
│   │
│   ├── unit/                        # Phase 1+
│   │   └── core/
│   │       └── cache-manager.test.ts
│   │
│   └── integration/                 # Phase 3+
│       └── git-workflow.test.ts
│
├── docs/
│   ├── project-overview-pdr.md      # This PDR document
│   ├── code-standards.md            # This file
│   ├── codebase-summary.md          # Auto-generated codebase overview
│   ├── system-architecture.md       # System design details
│   ├── validation-report.md         # Phase 0 results
│   └── deployment-guide.md          # Deployment instructions
│
├── .anchor/                         # Internal cache & config
│   └── cache/                       # Component metadata cache
│
├── .claude/                         # AI workflow configs
│   └── workflows/                   # Development workflows
│
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── vitest.config.ts                 # Test configuration
├── .gitignore                       # Git ignore rules
├── README.md                        # Project README
└── LICENSE                          # MIT License
```

### Directory Principles

1. **Grouping by feature/domain** - Similar functionality grouped together
2. **Clear separation of concerns** - CLI, core, analyzers, generators separate
3. **Testable structure** - Each module independently testable
4. **Scalable hierarchy** - Fits single package and monorepo structures
5. **Convention over configuration** - Standard directory names reduce boilerplate

---

## Naming Conventions

### Files

```typescript
// Classes/interfaces: PascalCase with .ts extension
ComponentAnalyzer.ts
DependencyAwareCacheManager.ts
AIProvider.ts

// Functions/utilities: camelCase with .ts extension
logger.ts
prompts.ts
errors.ts

// Types: PascalCase.d.ts or types.ts
ComponentMeta.ts
ConfigSchema.ts

// Tests: Same as source + .test.ts
ComponentAnalyzer.test.ts
logger.test.ts

// Configuration/templates: kebab-case.ext
component.md.hbs
anchor.config.json
```

### Classes

```typescript
// Main classes: Verb+Noun pattern
class ComponentAnalyzer { }
class DependencyAwareCacheManager { }
class ConfigLoader { }

// Provider classes: ProviderName+Provider pattern
class ClaudeProvider { }
class OllamaProvider { }

// Error classes: ErrorName+Error pattern
class ConfigValidationError { }
class FileNotFoundError { }
```

### Functions

```typescript
// Async functions: clear action verbs
async function analyzeComponent(path: string): Promise<ComponentMeta>
async function parseConfig(filePath: string): Promise<AnchorConfig>
async function extractProps(sourceFile: SourceFile): Promise<Prop[]>

// Boolean predicates: is/has prefix
function isValidComponent(meta: ComponentMeta): boolean
function hasJSDocComment(node: Node): boolean
function needsUpdate(filePath: string): boolean

// Handler functions: on/handle prefix
function onFileChange(path: string): void
function handleError(error: Error): void
```

### Variables

```typescript
// Constants: UPPER_SNAKE_CASE
const DEFAULT_CACHE_DIR = '.anchor/cache';
const MAX_PARSE_TIME_MS = 100;
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx'];

// Config objects: camelCase
const cacheConfig = { dir: '.anchor/cache', ttl: 3600 };
const providerConfig = { model: 'claude-sonnet', maxTokens: 4096 };

// Component instances: camelCase
const cacheManager = new DependencyAwareCacheManager(project);
const configLoader = new ConfigLoader(projectRoot);
```

### Imports

```typescript
// Group imports: standard lib → external → internal
import * as fs from 'fs/promises';
import * as path from 'path';

import { Project } from 'ts-morph';
import { z } from 'zod';

import { DependencyAwareCacheManager } from './core/cache-manager.js';
import type { ComponentMeta, Prop } from './types/component.js';
```

---

## TypeScript Guidelines

### Strict Mode

All code must compile with TypeScript strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "noImplicitThis": true
  }
}
```

### Type Annotations

```typescript
// Always annotate function parameters and return types
function analyzeComponent(path: string): ComponentMeta { }

// Use type inference for variables when obvious
const componentCount = components.length; // number inferred

// Explicit types for complex structures
const componentMap: Map<string, ComponentMeta> = new Map();
const config: AnchorConfig = { /* ... */ };
```

### Interfaces vs Types

```typescript
// Use interfaces for object shapes (extensible)
interface ComponentMeta {
  name: string;
  props: Prop[];
  filePath: string;
}

interface Prop {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// Use types for unions, intersections, primitives
type Provider = 'claude' | 'openai' | 'gemini' | 'ollama';
type ParseResult = ComponentMeta | null;
type ConfigOrError = AnchorConfig | ConfigValidationError;
```

### Generics

```typescript
// Use generics for reusable container types
class Cache<T> {
  get(key: string): T | null { }
  set(key: string, value: T): void { }
}

// Factory functions with generics
function createProvider<T extends AIProvider>(type: string): T {
  // ...
}
```

### Error Types

```typescript
// Use proper Error subclasses
class ConfigValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

// Avoid catching generic Error
try {
  // ...
} catch (error) {
  if (error instanceof ConfigValidationError) {
    // Handle specific error
  } else if (error instanceof Error) {
    // Handle generic error
  }
}
```

---

## Module Architecture

### Dependency Injection Pattern

All modules accept dependencies via constructor:

```typescript
// ❌ Bad: Hard dependency
class ComponentAnalyzer {
  private cache = new DependencyAwareCacheManager(new Project());
}

// ✅ Good: Injected dependency
class ComponentAnalyzer {
  constructor(
    private cache: DependencyAwareCacheManager,
    private logger: Logger
  ) { }
}

// Usage
const cache = new DependencyAwareCacheManager(project);
const logger = createLogger();
const analyzer = new ComponentAnalyzer(cache, logger);
```

### Module Exports

```typescript
// src/index.ts - Main entry point (minimal exports)
export { DependencyAwareCacheManager } from './core/cache-manager.js';
export type { CacheEntry, ComponentStructure } from './core/cache-manager.js';

// src/core/cache-manager.ts - Full implementation + types
export class DependencyAwareCacheManager { }
export interface CacheEntry { }

// src/types/index.ts - Re-export all types
export type * from './config.js';
export type * from './provider.js';
export type * from './component.js';
```

### Error Handling Module

```typescript
// src/utils/errors.ts
export class AnchorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnchorError';
  }
}

export class ConfigValidationError extends AnchorError { }
export class ComponentParseError extends AnchorError { }
export class FileNotFoundError extends AnchorError { }
```

---

## Testing Standards

### Test File Organization

```typescript
// tests/validation/cache-strategy.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DependencyAwareCacheManager } from '../../src/core/cache-manager.js';

describe('DependencyAwareCacheManager', () => {
  let manager: DependencyAwareCacheManager;

  beforeEach(() => {
    manager = new DependencyAwareCacheManager(mockProject);
  });

  afterEach(async () => {
    await manager.clearCache();
  });

  describe('needsUpdate', () => {
    it('returns true when cache does not exist', async () => {
      const result = await manager.needsUpdate('src/components/Button.tsx');
      expect(result).toBe(true);
    });

    it('returns false when file hash unchanged', async () => {
      // Arrange
      const filePath = 'src/components/Button.tsx';
      await manager.saveCache(filePath, mockComponentStructure);

      // Act
      const result = await manager.needsUpdate(filePath);

      // Assert
      expect(result).toBe(false);
    });
  });
});
```

### Test Naming

```typescript
// ✅ Good: Describe behavior, not implementation
it('returns true when file hash has changed')
it('throws ConfigValidationError for invalid schema')
it('caches component metadata for 1 hour')

// ❌ Bad: Too technical or implementation-focused
it('calls hashFile and compares')
it('throws error')
it('saves to cache')
```

### Phase-Specific Test Locations

| Phase | Location | Type | Purpose |
|-------|----------|------|---------|
| Phase 0 | `tests/validation/` | Spike tests | Validate technology choices |
| Phase 1 | `tests/unit/` | Unit tests | Test individual modules |
| Phase 2 | `tests/unit/` | Unit tests | Expand coverage |
| Phase 3 | `tests/integration/` | Integration tests | Test workflows |
| Phase 4 | `tests/integration/` | Integration tests | Monorepo scenarios |

---

## Error Handling

### Error Hierarchy

```typescript
// Custom error classes with context
export class AnchorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnchorError';
  }
}

export class ConfigValidationError extends AnchorError {
  constructor(message: string, public field: string) {
    super(message, 'CONFIG_VALIDATION_ERROR', { field });
  }
}

// Usage
try {
  parseConfig(filePath);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    logger.error(`Invalid config field: ${error.field}`, error.context);
  } else if (error instanceof AnchorError) {
    logger.error(`CodeAnchor error: ${error.code}`, error.context);
  } else {
    logger.error('Unexpected error', { error });
  }
}
```

### Async Error Handling

```typescript
// Always use try-catch for async operations
async function analyzeComponent(path: string): Promise<ComponentMeta> {
  try {
    const sourceFile = project.addSourceFileAtPath(path);
    return extractMetadata(sourceFile);
  } catch (error) {
    if (error instanceof Error) {
      throw new ComponentParseError(
        `Failed to analyze ${path}: ${error.message}`,
        'COMPONENT_PARSE_ERROR'
      );
    }
    throw error;
  }
}

// Never swallow errors silently
async function updateCache(filePath: string): Promise<void> {
  try {
    const metadata = await analyzeComponent(filePath);
    await cache.saveCache(filePath, metadata.structure);
  } catch (error) {
    // Log the error for debugging, but re-throw
    logger.warn(`Failed to update cache for ${filePath}`, { error });
    throw error;
  }
}
```

---

## Configuration & Dependencies

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  }
}
```

### Environment Variables

```bash
# Required for AI providers
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
OLLAMA_BASE_URL=http://localhost:11434

# Optional
DEBUG=codeanchor:*          # Enable debug logging
CODEANCHOR_CONFIG=/path/to/config.json
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Git Workflow

### Commit Message Format

Follow Conventional Commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation change
- `refactor` - Code refactor
- `test` - Test addition/update
- `chore` - Build/dependency change

**Examples:**
```
feat(cache): implement dependency-aware cache validation

- Add file hash comparison
- Track direct import dependencies
- Support 1-level dependency invalidation

Closes #123
```

### Branch Naming

```
feat/component-analyzer
fix/cache-invalidation
docs/phase-0-completion
chore/update-dependencies
```

### Pull Request Template

```markdown
## Summary
Brief description of changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Breaking change

## Testing
- [ ] Added/updated tests
- [ ] All tests passing
- [ ] Manual testing performed

## Documentation
- [ ] Updated relevant docs
- [ ] Added code comments
- [ ] Updated CHANGELOG

## Related Issues
Closes #XXX
```

---

## Code Review Checklist

Every PR should verify:

- [ ] **Code Quality**
  - [ ] Follows naming conventions
  - [ ] Proper TypeScript types
  - [ ] No unused variables/imports
  - [ ] DRY principle followed

- [ ] **Architecture**
  - [ ] Dependency injection used
  - [ ] Clear module boundaries
  - [ ] No circular dependencies
  - [ ] Error handling comprehensive

- [ ] **Testing**
  - [ ] Tests added for new code
  - [ ] All tests passing
  - [ ] Edge cases covered
  - [ ] >80% coverage maintained

- [ ] **Documentation**
  - [ ] JSDoc comments present
  - [ ] README updated if needed
  - [ ] Complex logic explained
  - [ ] Examples included

---

## Performance Guidelines

### Optimization Priorities

1. **Correctness** - Always correct first
2. **Readability** - Code should be maintainable
3. **Performance** - Optimize only when needed

### Critical Paths

| Operation | Target | Phase |
|-----------|--------|-------|
| Component parsing | <100ms | Phase 0 ✅ |
| Pre-commit hook | <2 seconds | Phase 1 |
| Cache hit validation | <10ms | Phase 1 |
| Document generation | <500ms | Phase 2 |

### Memory Considerations

- Don't load entire project into memory unnecessarily
- Use lazy loading for large datasets
- Clear caches after operations
- Monitor memory usage in benchmarks

---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Analyzes a component file and extracts metadata
 * @param sourceFile - The TypeScript source file to analyze
 * @returns Component metadata including props, variants, and dependencies
 * @throws ComponentParseError if analysis fails
 * @example
 * ```ts
 * const meta = analyzeComponent(sourceFile);
 * console.log(meta.name, meta.props);
 * ```
 */
function analyzeComponent(sourceFile: SourceFile): ComponentMeta {
  // ...
}
```

### Inline Comments

```typescript
// Use for "why" not "what"
// ✅ Good
// Cache miss detected, trigger re-analysis to catch recent changes
const needsUpdate = currentHash !== cachedHash;

// ❌ Bad
// Set needsUpdate to true
const needsUpdate = true;
```

---

## Versioning

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (0.1.0 → 1.0.0): Breaking changes
- **MINOR** (0.1.0 → 0.2.0): New features, backwards compatible
- **PATCH** (0.1.0 → 0.1.1): Bug fixes

Current version: **0.1.0** (MVP in development)

---

## Phase-Specific Guidelines

### Phase 0: Validation
- Spike code acceptable for exploration
- Document decisions and learnings
- Create production-ready cache manager

### Phase 1: Foundation
- Full TypeScript strict mode
- 80%+ test coverage requirement
- All public APIs documented
- Error handling comprehensive

### Phase 2+: Maintenance
- Maintain test coverage >80%
- Backwards compatibility in minor versions
- Clear deprecation warnings before removal
- Detailed changelog for each release

---

**Last Updated:** 2026-01-21
**Audience:** Core developers and contributors

