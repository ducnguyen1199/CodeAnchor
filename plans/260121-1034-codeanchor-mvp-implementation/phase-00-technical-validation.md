# Phase 0: Technical Validation

> **Priority:** P0 - Critical
> **Duration:** 2-3 days
> **Status:** ✅ COMPLETE
> **Type:** Validation Spike
> **Started:** 2026-01-21
> **Completed:** 2026-01-21 14:00 UTC
> **Decision:** GO - Proceed to Phase 1
> **Timestamp:** 2026-01-21T14:00:00Z

## Context Links

- [Architecture Report](../reports/brainstorm-2026-01-21-codeanchor-architecture.md#risk-d-ts-morph-learning-curve-p2---medium)
- [Risk Mitigation](../reports/brainstorm-2026-01-21-risk-mitigation.md#risk-d-ts-morph-learning-curve-p2---medium)
- [Validation Report](../../docs/validation-report.md)
- [Code Review](../reports/code-reviewer-260121-phase0-validation.md)

## Overview

Validate critical technical assumptions before committing to full MVP implementation. This spike determines feasibility of ts-morph for component analysis and validates performance targets.

**Goal:** Prove or disprove that ts-morph can reliably extract component metadata with required performance.

## Key Insights

**Why This Matters:**
- ts-morph is complex library with steep learning curve
- Unknown if it handles all React/TS patterns
- Performance critical for <2s pre-commit target
- Wrong choice here = rewrite entire detection engine later

**Alternative if validation fails:**
- Regex-based extraction (less accurate)
- Babel parser (less TS support)
- Hybrid approach (ts-morph + fallbacks)

## Requirements

### Functional Requirements

1. **Extract basic props** from TypeScript interfaces
2. **Extract prop types** including unions, literals
3. **Extract JSDoc comments** from prop declarations
4. **Extract default values** from destructuring
5. **Handle generic props** (`interface Props<T>`)
6. **Handle HOCs** (Higher Order Components)
7. **Handle forwardRef** patterns
8. **Track dependencies** (import statements)

### Non-Functional Requirements

1. **Performance:** <100ms per component parse
2. **Accuracy:** 90%+ pattern coverage
3. **Error handling:** Graceful fallback for edge cases
4. **Memory:** <200MB for 100 component project

## Architecture

### Validation Test Suite

```typescript
// tests/validation/ts-morph-validation.test.ts

interface TestCase {
  name: string;
  code: string;
  expected: ComponentMeta;
  mustPass: boolean; // false = nice-to-have
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Basic props',
    code: `
      interface ButtonProps {
        children: React.ReactNode;
        onClick: () => void;
      }
    `,
    expected: {
      props: [
        { name: 'children', type: 'React.ReactNode', required: true },
        { name: 'onClick', type: '() => void', required: true }
      ]
    },
    mustPass: true
  },
  {
    name: 'Optional props with defaults',
    code: `
      interface ButtonProps {
        variant?: 'primary' | 'secondary';
      }
      export const Button = ({ variant = 'primary' }: ButtonProps) => {}
    `,
    expected: {
      props: [
        {
          name: 'variant',
          type: "'primary' | 'secondary'",
          required: false,
          default: "'primary'"
        }
      ]
    },
    mustPass: true
  },
  {
    name: 'Generic props',
    code: `
      interface ListProps<T> {
        items: T[];
        renderItem: (item: T) => React.ReactNode;
      }
    `,
    expected: {
      props: [
        { name: 'items', type: 'T[]', required: true },
        { name: 'renderItem', type: '(item: T) => React.ReactNode', required: true }
      ]
    },
    mustPass: false // Nice-to-have
  },
  {
    name: 'ForwardRef pattern',
    code: `
      interface InputProps {
        value: string;
        onChange: (value: string) => void;
      }
      const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {})
    `,
    expected: {
      props: [
        { name: 'value', type: 'string', required: true },
        { name: 'onChange', type: '(value: string) => void', required: true }
      ]
    },
    mustPass: false // Nice-to-have
  },
  {
    name: 'HOC pattern',
    code: `
      const EnhancedButton = withAuth(Button);
    `,
    expected: {
      // Extract props from Button, not HOC
    },
    mustPass: false // Nice-to-have
  },
  {
    name: 'JSDoc comments',
    code: `
      interface ButtonProps {
        /** Button label text */
        children: React.ReactNode;
        /** Visual style variant */
        variant?: 'primary' | 'secondary';
      }
    `,
    expected: {
      props: [
        {
          name: 'children',
          type: 'React.ReactNode',
          required: true,
          description: 'Button label text'
        },
        {
          name: 'variant',
          type: "'primary' | 'secondary'",
          required: false,
          description: 'Visual style variant'
        }
      ]
    },
    mustPass: true
  },
  {
    name: 'Import dependencies',
    code: `
      import { Variant } from './types';
      import { BaseProps } from '@/components/base';

      interface ButtonProps extends BaseProps {
        variant: Variant;
      }
    `,
    expected: {
      dependencies: [
        './types',
        '@/components/base'
      ]
    },
    mustPass: true
  }
];
```

### Performance Benchmark Suite

```typescript
// tests/validation/performance-benchmark.ts

interface BenchmarkResult {
  testName: string;
  componentCount: number;
  totalTime: number;
  avgTimePerComponent: number;
  memoryUsage: number;
}

async function runPerformanceBenchmark(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // Test 1: Small project (10 components)
  results.push(await benchmarkComponentSet(10));

  // Test 2: Medium project (50 components)
  results.push(await benchmarkComponentSet(50));

  // Test 3: Large project (100 components)
  results.push(await benchmarkComponentSet(100));

  return results;
}

async function benchmarkComponentSet(count: number): Promise<BenchmarkResult> {
  const project = new Project();

  // Generate test components
  for (let i = 0; i < count; i++) {
    project.createSourceFile(`Component${i}.tsx`, generateTestComponent(i));
  }

  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  // Parse all components
  for (const sourceFile of project.getSourceFiles()) {
    await extractComponentMeta(sourceFile);
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    testName: `${count} components`,
    componentCount: count,
    totalTime: endTime - startTime,
    avgTimePerComponent: (endTime - startTime) / count,
    memoryUsage: endMemory - startMemory
  };
}
```

### Cache Strategy Prototype

```typescript
// src/core/cache-manager.ts

interface CacheEntry {
  fileHash: string;
  dependencies: DependencyCache[];
  structure: ComponentStructure;
  lastParsed: Date;
}

interface DependencyCache {
  path: string;
  hash: string;
  mtime: number;
}

class DependencyAwareCacheManager {
  private cacheDir = '.anchor/cache';

  async needsUpdate(file: string): Promise<boolean> {
    const cache = await this.loadCache(file);
    if (!cache) return true;

    // Fast check: file hash
    const currentHash = await this.hashFile(file);
    if (currentHash !== cache.fileHash) return true;

    // Deep check: dependencies (1-level only)
    const imports = await this.extractImports(file);
    for (const imp of imports) {
      if (!fs.existsSync(imp)) continue;

      const stat = fs.statSync(imp);
      const depCache = cache.dependencies.find(d => d.path === imp);

      if (!depCache || stat.mtimeMs > cache.lastParsed.getTime()) {
        return true; // Dependency changed
      }
    }

    return false;
  }

  private async extractImports(file: string): Promise<string[]> {
    // Test if ts-morph can efficiently extract imports
    const sourceFile = project.addSourceFileAtPath(file);
    return sourceFile.getImportDeclarations()
      .map(imp => imp.getModuleSpecifierSourceFile()?.getFilePath())
      .filter((path): path is string =>
        !!path && !path.includes('node_modules')
      );
  }
}
```

## Related Code Files

### Files to Create

- `tests/validation/ts-morph-validation.test.ts` - Test suite
- `tests/validation/performance-benchmark.ts` - Performance tests
- `tests/validation/test-fixtures/` - Test component files
- `src/core/cache-manager.ts` - Cache prototype
- `docs/validation-report.md` - Results documentation

## Implementation Steps

### Step 1: Setup Test Environment

```bash
# Create test directory
mkdir -p tests/validation/test-fixtures

# Install dependencies
npm install --save-dev ts-morph vitest
```

### Step 2: Implement Test Cases

1. Create `ts-morph-validation.test.ts`
2. Implement each test case
3. Run and document results
4. Calculate pass rate

**Success criteria:** 90%+ "mustPass" cases pass

### Step 3: Run Performance Benchmarks

1. Create `performance-benchmark.ts`
2. Generate test components
3. Measure parsing time
4. Measure memory usage
5. Document results

**Success criteria:** <100ms avg per component

### Step 4: Prototype Cache Strategy

1. Implement `DependencyAwareCacheManager`
2. Test cache invalidation logic
3. Measure cache hit rate
4. Test with dependency changes

**Success criteria:** >80% hit rate in typical workflow

### Step 5: Document Findings

Create `docs/validation-report.md` with:
- Test results (pass/fail rates)
- Performance metrics
- Cache effectiveness
- Identified edge cases
- Fallback strategies
- Go/No-go recommendation

### Step 6: Make Go/No-go Decision

**Go Criteria (all must pass):**
- ✅ 90%+ mustPass test cases succeed
- ✅ <100ms avg parse time per component
- ✅ <200MB memory for 100 components
- ✅ Cache strategy validated
- ✅ Clear fallback for edge cases

**No-go Criteria (any):**
- ❌ <80% mustPass test cases fail
- ❌ >200ms avg parse time
- ❌ >500MB memory usage
- ❌ No viable fallback strategy

## Todo List

- [ ] Setup test environment
- [ ] Implement basic props test case
- [ ] Implement optional props test case
- [ ] Implement JSDoc test case
- [ ] Implement generic props test case
- [ ] Implement forwardRef test case
- [ ] Implement HOC test case
- [ ] Implement import tracking test case
- [ ] Create performance benchmark suite
- [ ] Run 10 component benchmark
- [ ] Run 50 component benchmark
- [ ] Run 100 component benchmark
- [ ] Implement cache prototype
- [ ] Test cache invalidation
- [ ] Measure cache hit rate
- [ ] Document all findings
- [ ] Make Go/No-go decision
- [ ] Present results to team

## Success Criteria

### Must Have ✅ ALL MET
- [x] 90%+ "mustPass" test cases pass → **100%** ✅
- [x] <100ms average parse time per component → **4.58-76ms** ✅
- [x] <200MB memory for 100 components → **~40MB** ✅
- [x] Clear fallback strategy documented → **Done** ✅
- [x] Go/No-go recommendation with rationale → **GO** ✅

### Nice to Have
- [x] 100% test case coverage → **14/14 tests pass** ✅
- [x] <50ms average parse time → **4.58ms for 100 components** ✅
- [x] Generic props support → **Validated** ✅
- [ ] HOC pattern support → **Documented as limitation**

## Risk Assessment

### High Risk
- **ts-morph too complex:** Fallback to regex extraction
- **Performance insufficient:** Optimize or use simpler parser
- **Memory leaks:** Implement lazy loading

### Medium Risk
- **Edge cases unsupported:** Document limitations, provide manual override
- **Cache strategy flawed:** Simplify to file hash only

### Low Risk
- **Test environment issues:** Use isolated test project
- **Benchmark variance:** Run multiple iterations

## Next Steps

**If Go:**
1. Archive validation artifacts in `plans/260121-1034-codeanchor-mvp-implementation/research/`
2. Proceed to Phase 1: Foundation
3. Implement production code based on validation learnings

**If No-go:**
1. Document why validation failed
2. Propose alternative approach:
   - Option A: Use regex-based extraction (simpler, less accurate)
   - Option B: Use different AST parser (e.g., babel-parser)
   - Option C: Hybrid approach (ts-morph + fallbacks)
3. Re-run validation with alternative
4. Make new Go/No-go decision

**If Partial Go (some limitations):**
1. Document unsupported patterns
2. Implement fallback strategy
3. Proceed with Phase 1 with known constraints
4. Plan Phase 2 enhancements for edge cases

---

**Timeline:** 2-3 days max
**Output:** Validation report + Go/No-go decision
**Next Phase:** Phase 1 (if Go) or Architecture revision (if No-go)
