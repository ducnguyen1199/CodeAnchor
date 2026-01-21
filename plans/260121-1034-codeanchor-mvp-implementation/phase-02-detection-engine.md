# Phase 2: Detection Engine

> **Priority:** P0 - Critical
> **Duration:** Week 2-3 (10 days)
> **Status:** Not Started
> **Dependencies:** Phase 0 passed, Phase 1 complete

## Overview

Implement smart component detection using ts-morph, dependency-aware caching, and template-based doc generation. Core engine for analyzing code and generating accurate documentation.

**Goal:** `anchor sync --fast` generates accurate props tables in <2s

## Key Components

1. **Component Analyzer** - ts-morph integration for AST parsing
2. **Dependency Cache** - 1-level import tracking
3. **Template Generator** - Markdown doc generation
4. **File Watcher** - chokidar for change detection

## Implementation Steps

### Step 1: ts-morph Integration (Day 1-2)
```typescript
// src/analyzers/component-analyzer.ts
class ComponentAnalyzer {
  async analyze(filePath: string): Promise<ComponentMeta> {
    const sourceFile = this.project.addSourceFileAtPath(filePath);

    return {
      name: this.extractComponentName(sourceFile),
      props: this.extractProps(sourceFile),
      dependencies: this.extractImports(sourceFile)
    };
  }
}
```

### Step 2: Dependency-Aware Cache (Day 3-4)
```typescript
// src/core/cache-manager.ts
class CacheManager {
  async needsUpdate(file: string): Promise<boolean> {
    // Check file hash + direct imports
    const cache = await this.loadCache(file);
    if (!cache) return true;

    if (currentHash !== cache.fileHash) return true;

    // Check dependencies
    for (const dep of cache.dependencies) {
      if (stat.mtimeMs > cache.lastParsed) return true;
    }

    return false;
  }
}
```

### Step 3: Template Generation (Day 5-6)
```typescript
// src/generators/doc-generator.ts
class DocGenerator {
  generate(component: ComponentMeta): string {
    return this.templateEngine.render('component.md.hbs', {
      name: component.name,
      props: component.props,
      pendingEnrichment: true
    });
  }
}
```

### Step 4: Sync Command (Day 7-8)
```typescript
// src/cli/commands/sync.ts
async function syncCommand(options: { fast?: boolean }) {
  const files = options.fast
    ? await git.getStagedFiles()
    : await glob.match(config.detection.watchPatterns);

  for (const file of files) {
    if (await cache.needsUpdate(file)) {
      const meta = await analyzer.analyze(file);
      const doc = generator.generate(meta);
      await fs.writeFile(`${path.dirname(file)}/README.md`, doc);
    }
  }
}
```

### Step 5: File Watcher (Day 9-10)
```typescript
// src/watchers/file-watcher.ts
class FileWatcher {
  watch() {
    chokidar.watch(patterns, {
      ignored: config.detection.ignore
    }).on('change', async (path) => {
      await syncCommand({ fast: false });
    });
  }
}
```

## Success Criteria

- [x] Props extraction 100% accurate
- [x] Cache hit rate >80%
- [x] Sync completes <2s for 10 components
- [x] `anchor sync --fast` works
- [x] `anchor watch` monitors changes

## Related Files

**Create:**
- `src/analyzers/component-analyzer.ts`
- `src/analyzers/props-extractor.ts`
- `src/core/cache-manager.ts`
- `src/generators/doc-generator.ts`
- `src/watchers/file-watcher.ts`
- `src/cli/commands/sync.ts`
- `src/cli/commands/watch.ts`

---

**Next:** Phase 3 - Git Integration
