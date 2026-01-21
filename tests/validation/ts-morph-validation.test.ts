import { describe, it, expect, beforeEach } from 'vitest';
import { Project, SourceFile } from 'ts-morph';

interface PropMeta {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
}

interface ComponentMeta {
  name: string;
  props: PropMeta[];
  dependencies?: string[];
}

interface TestCase {
  name: string;
  code: string;
  expected: Partial<ComponentMeta>;
  mustPass: boolean;
}

/**
 * Extract component metadata from TypeScript source file using ts-morph
 */
function extractComponentMeta(sourceFile: SourceFile): ComponentMeta {
  const props: PropMeta[] = [];
  const dependencies: string[] = [];

  // Extract import dependencies
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpec = imp.getModuleSpecifierValue();
    if (!moduleSpec.includes('node_modules') && !moduleSpec.startsWith('react')) {
      dependencies.push(moduleSpec);
    }
  }

  // Find interface declarations (Props interfaces)
  const interfaces = sourceFile.getInterfaces();
  for (const iface of interfaces) {
    if (iface.getName().includes('Props')) {
      // Extract properties from interface
      const properties = iface.getProperties();
      for (const prop of properties) {
        const propName = prop.getName();
        const propType = prop.getType().getText(prop);
        const isOptional = prop.hasQuestionToken();

        // Extract JSDoc description
        const jsDocs = prop.getJsDocs();
        const description = jsDocs.length > 0
          ? jsDocs[0].getDescription().trim()
          : undefined;

        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
          description
        });
      }
    }
  }

  // Try to find default values from function parameters
  const functions = sourceFile.getFunctions();
  const variables = sourceFile.getVariableDeclarations();

  for (const varDecl of variables) {
    const initializer = varDecl.getInitializer();
    if (initializer && initializer.getText().includes('=>')) {
      // Arrow function component
      const params = initializer.getChildrenOfKind(288); // Parameter
      if (params.length > 0) {
        const paramText = params[0].getText();
        // Simple default value extraction
        const defaultMatches = paramText.matchAll(/(\w+)\s*=\s*([^,}]+)/g);
        for (const match of defaultMatches) {
          const propName = match[1];
          const defaultValue = match[2].trim();
          const prop = props.find(p => p.name === propName);
          if (prop) {
            prop.default = defaultValue;
          }
        }
      }
    }
  }

  return {
    name: sourceFile.getBaseName().replace('.tsx', ''),
    props,
    dependencies: dependencies.length > 0 ? dependencies : undefined
  };
}

describe('ts-morph Validation Suite', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99,
        jsx: 2, // React
        strict: true
      }
    });
  });

  const TEST_CASES: TestCase[] = [
    {
      name: 'Basic props',
      code: `
        import React from 'react';

        interface ButtonProps {
          children: React.ReactNode;
          onClick: () => void;
        }

        export const Button = (props: ButtonProps) => null;
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
        import React from 'react';

        interface ButtonProps {
          variant?: 'primary' | 'secondary';
        }

        export const Button = ({ variant = 'primary' }: ButtonProps) => null;
      `,
      expected: {
        props: [
          {
            name: 'variant',
            type: '"primary" | "secondary" | undefined',
            required: false
            // Note: Default value extraction is nice-to-have, not critical
          }
        ]
      },
      mustPass: false // Default value extraction is complex, mark as nice-to-have
    },
    {
      name: 'JSDoc comments',
      code: `
        import React from 'react';

        interface ButtonProps {
          /** Button label text */
          children: React.ReactNode;
          /** Visual style variant */
          variant?: 'primary' | 'secondary';
        }

        export const Button = (props: ButtonProps) => null;
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
            type: '"primary" | "secondary" | undefined',
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
        import React from 'react';
        import { Variant } from './types';
        import { BaseProps } from '@/components/base';

        interface ButtonProps extends BaseProps {
          variant: Variant;
        }

        export const Button = (props: ButtonProps) => null;
      `,
      expected: {
        dependencies: [
          './types',
          '@/components/base'
        ]
      },
      mustPass: true
    },
    {
      name: 'Generic props',
      code: `
        import React from 'react';

        interface ListProps<T> {
          items: T[];
          renderItem: (item: T) => React.ReactNode;
        }

        export const List = <T,>(props: ListProps<T>) => null;
      `,
      expected: {
        props: [
          { name: 'items', type: 'T[]', required: true },
          { name: 'renderItem', type: '(item: T) => React.ReactNode', required: true }
        ]
      },
      mustPass: false // Nice-to-have
    }
  ];

  TEST_CASES.forEach((testCase) => {
    it(testCase.name + (testCase.mustPass ? ' [MUST PASS]' : ' [NICE TO HAVE]'), () => {
      const sourceFile = project.createSourceFile('TestComponent.tsx', testCase.code);
      const result = extractComponentMeta(sourceFile);

      // Validate props if expected
      if (testCase.expected.props) {
        expect(result.props).toHaveLength(testCase.expected.props.length);

        testCase.expected.props.forEach((expectedProp, index) => {
          const actualProp = result.props[index];

          expect(actualProp.name).toBe(expectedProp.name);
          expect(actualProp.required).toBe(expectedProp.required);

          // Type comparison (normalize quotes)
          const normalizeType = (type: string) => type.replace(/'/g, '"');
          expect(normalizeType(actualProp.type)).toBe(normalizeType(expectedProp.type));

          if (expectedProp.description) {
            expect(actualProp.description).toBe(expectedProp.description);
          }

          if (expectedProp.default) {
            expect(actualProp.default).toBe(expectedProp.default);
          }
        });
      }

      // Validate dependencies if expected
      if (testCase.expected.dependencies) {
        expect(result.dependencies).toEqual(testCase.expected.dependencies);
      }
    });
  });

  it('Performance: Parse 10 components < 1s', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 10; i++) {
      const code = `
        import React from 'react';

        interface Component${i}Props {
          prop1: string;
          prop2: number;
          prop3?: boolean;
          /** A description */
          prop4: string[];
        }

        export const Component${i} = (props: Component${i}Props) => null;
      `;

      const sourceFile = project.createSourceFile(`Component${i}.tsx`, code);
      extractComponentMeta(sourceFile);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / 10;

    console.log(`Total time for 10 components: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per component: ${avgTime.toFixed(2)}ms`);

    expect(totalTime).toBeLessThan(1000); // < 1s for 10 components
    expect(avgTime).toBeLessThan(100); // < 100ms per component
  });
});
