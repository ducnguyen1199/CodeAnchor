import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Project } from 'ts-morph';
import { DependencyAwareCacheManager } from '../../src/core/cache-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Cache Strategy Validation', () => {
  let project: Project;
  let cacheManager: DependencyAwareCacheManager;
  const testDir = '.test-cache';

  beforeEach(async () => {
    project = new Project({
      compilerOptions: {
        target: 99,
        module: 99,
        jsx: 2
      }
    });
    cacheManager = new DependencyAwareCacheManager(project);

    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    await cacheManager.clearCache();
  });

  it('Should detect file change (cache invalidation)', async () => {
    const testFile = path.join(testDir, 'Component.tsx');

    // Create initial file
    await fs.writeFile(testFile, `
      import React from 'react';
      interface Props { prop1: string; }
      export const Component = (props: Props) => null;
    `);

    // First check - no cache, should need update
    const needsUpdate1 = await cacheManager.needsUpdate(testFile);
    expect(needsUpdate1).toBe(true);

    // Save cache
    await cacheManager.saveCache(testFile, {
      name: 'Component',
      props: [{ name: 'prop1', type: 'string', required: true }]
    });

    // Second check - cache exists, should not need update
    const needsUpdate2 = await cacheManager.needsUpdate(testFile);
    expect(needsUpdate2).toBe(false);

    // Modify file
    await fs.writeFile(testFile, `
      import React from 'react';
      interface Props { prop1: string; prop2: number; }
      export const Component = (props: Props) => null;
    `);

    // Third check - file changed, should need update
    const needsUpdate3 = await cacheManager.needsUpdate(testFile);
    expect(needsUpdate3).toBe(true);
  });

  it('Should detect dependency change (transitive invalidation)', async () => {
    const componentFile = path.join(testDir, 'Component.tsx');
    const typesFile = path.join(testDir, 'types.ts');

    // Create dependency file
    await fs.writeFile(typesFile, `
      export type Variant = 'primary' | 'secondary';
    `);

    // Create component file that imports types
    await fs.writeFile(componentFile, `
      import React from 'react';
      import { Variant } from './types';
      interface Props { variant: Variant; }
      export const Component = (props: Props) => null;
    `);

    project.addSourceFileAtPath(typesFile);
    project.addSourceFileAtPath(componentFile);

    // First check - no cache
    const needsUpdate1 = await cacheManager.needsUpdate(componentFile);
    expect(needsUpdate1).toBe(true);

    // Save cache
    await cacheManager.saveCache(componentFile, {
      name: 'Component',
      props: [{ name: 'variant', type: 'Variant', required: true }]
    });

    // Second check - cache valid
    const needsUpdate2 = await cacheManager.needsUpdate(componentFile);
    expect(needsUpdate2).toBe(false);

    // Wait 10ms to ensure mtime changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Modify dependency (types.ts)
    await fs.writeFile(typesFile, `
      export type Variant = 'primary' | 'secondary' | 'danger';
    `);

    // Third check - dependency changed, should invalidate cache
    const needsUpdate3 = await cacheManager.needsUpdate(componentFile);
    expect(needsUpdate3).toBe(true);
  });

  it('Should handle missing cache gracefully', async () => {
    const testFile = path.join(testDir, 'NonExistent.tsx');

    const needsUpdate = await cacheManager.needsUpdate(testFile);
    expect(needsUpdate).toBe(true); // Should need update if cache missing
  });

  it('Cache hit rate simulation', async () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      path.join(testDir, `Component${i}.tsx`)
    );

    // Create files
    for (const file of files) {
      await fs.writeFile(file, `
        import React from 'react';
        interface Props { prop: string; }
        export const Component = (props: Props) => null;
      `);
      project.addSourceFileAtPath(file);
    }

    // First pass - all need update (no cache)
    let cacheHits = 0;
    for (const file of files) {
      const needsUpdate = await cacheManager.needsUpdate(file);
      if (!needsUpdate) cacheHits++;

      await cacheManager.saveCache(file, {
        name: path.basename(file, '.tsx'),
        props: [{ name: 'prop', type: 'string', required: true }]
      });
    }
    expect(cacheHits).toBe(0); // No cache hits first pass

    // Second pass - all should hit cache
    cacheHits = 0;
    for (const file of files) {
      const needsUpdate = await cacheManager.needsUpdate(file);
      if (!needsUpdate) cacheHits++;
    }
    expect(cacheHits).toBe(10); // 100% hit rate

    // Modify 2 files (20%)
    await new Promise(resolve => setTimeout(resolve, 10));
    await fs.writeFile(files[0], 'modified content');
    await fs.writeFile(files[5], 'modified content');

    // Third pass - 80% hit rate
    cacheHits = 0;
    for (const file of files) {
      const needsUpdate = await cacheManager.needsUpdate(file);
      if (!needsUpdate) cacheHits++;
    }
    expect(cacheHits).toBe(8); // 80% hit rate

    const hitRate = (cacheHits / files.length) * 100;
    console.log(`\nCache hit rate: ${hitRate}%`);
    expect(hitRate).toBeGreaterThanOrEqual(70); // > 70% hit rate [SUCCESS CRITERIA]
  });
});
