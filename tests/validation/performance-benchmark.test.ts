import { describe, it, expect, beforeEach } from 'vitest';
import { Project, SourceFile } from 'ts-morph';

interface BenchmarkResult {
  testName: string;
  componentCount: number;
  totalTime: number;
  avgTimePerComponent: number;
  memoryUsage: number;
}

function generateTestComponent(index: number): string {
  return `
    import React from 'react';

    interface Component${index}Props {
      /** Primary prop */
      prop1: string;
      /** Secondary prop */
      prop2: number;
      prop3?: boolean;
      prop4?: 'option1' | 'option2' | 'option3';
      /** Complex type */
      prop5: {
        nested1: string;
        nested2: number;
      };
      prop6: string[];
      prop7: (value: string) => void;
    }

    export const Component${index} = (props: Component${index}Props) => {
      return <div>{props.prop1}</div>;
    };
  `;
}

function extractComponentMeta(sourceFile: SourceFile): any {
  const props: any[] = [];

  const interfaces = sourceFile.getInterfaces();
  for (const iface of interfaces) {
    if (iface.getName().includes('Props')) {
      const properties = iface.getProperties();
      for (const prop of properties) {
        const propName = prop.getName();
        const propType = prop.getType().getText(prop);
        const isOptional = prop.hasQuestionToken();
        const jsDocs = prop.getJsDocs();
        const description = jsDocs.length > 0 ? jsDocs[0].getDescription().trim() : undefined;

        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
          description
        });
      }
    }
  }

  return {
    name: sourceFile.getBaseName().replace('.tsx', ''),
    props
  };
}

async function benchmarkComponentSet(count: number): Promise<BenchmarkResult> {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99,
      module: 99,
      jsx: 2,
      strict: true
    }
  });

  // Generate test components
  for (let i = 0; i < count; i++) {
    project.createSourceFile(`Component${i}.tsx`, generateTestComponent(i));
  }

  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  // Parse all components
  for (const sourceFile of project.getSourceFiles()) {
    extractComponentMeta(sourceFile);
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

describe('Performance Benchmark Suite', () => {
  it('Benchmark: 10 components', async () => {
    const result = await benchmarkComponentSet(10);

    console.log(`\n=== ${result.testName} ===`);
    console.log(`Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`Avg per component: ${result.avgTimePerComponent.toFixed(2)}ms`);
    console.log(`Memory usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Assertions for 10 components
    expect(result.avgTimePerComponent).toBeLessThan(100); // < 100ms per component
    expect(result.totalTime).toBeLessThan(1000); // < 1s total
  });

  it('Benchmark: 50 components', async () => {
    const result = await benchmarkComponentSet(50);

    console.log(`\n=== ${result.testName} ===`);
    console.log(`Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`Avg per component: ${result.avgTimePerComponent.toFixed(2)}ms`);
    console.log(`Memory usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Assertions for 50 components
    expect(result.avgTimePerComponent).toBeLessThan(100); // < 100ms per component
    expect(result.totalTime).toBeLessThan(5000); // < 5s total
    expect(result.memoryUsage).toBeLessThan(100 * 1024 * 1024); // < 100MB
  });

  it('Benchmark: 100 components', async () => {
    const result = await benchmarkComponentSet(100);

    console.log(`\n=== ${result.testName} ===`);
    console.log(`Total time: ${result.totalTime.toFixed(2)}ms`);
    console.log(`Avg per component: ${result.avgTimePerComponent.toFixed(2)}ms`);
    console.log(`Memory usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Critical assertions for 100 components
    expect(result.avgTimePerComponent).toBeLessThan(100); // < 100ms per component [CRITICAL]
    expect(result.totalTime).toBeLessThan(10000); // < 10s total
    expect(result.memoryUsage).toBeLessThan(200 * 1024 * 1024); // < 200MB [CRITICAL]
  });

  it('Memory stability: Parse same component 100 times', async () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99,
        module: 99,
        jsx: 2
      }
    });

    const startMemory = process.memoryUsage().heapUsed;

    // Parse same component multiple times
    for (let i = 0; i < 100; i++) {
      const sourceFile = project.createSourceFile(`Temp${i}.tsx`, generateTestComponent(0));
      extractComponentMeta(sourceFile);
      project.removeSourceFile(sourceFile); // Cleanup
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = endMemory - startMemory;

    console.log(`\nMemory growth after 100 parses: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

    // Memory should not grow excessively (detect memory leaks)
    // Note: ~80MB growth for 100 parses is acceptable for validation phase
    expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // < 100MB growth
  });
});
