import { describe, it, expect, beforeEach } from 'vitest';
import { TechDetector } from '../../src/core/tech-detector.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('TechDetector', () => {
  let detector: TechDetector;
  const testDir = path.join(process.cwd(), 'tests/fixtures');
  const testPkgPath = path.join(testDir, 'test-package.json');

  beforeEach(() => {
    detector = new TechDetector();
  });

  it('should detect React and TypeScript', async () => {
    const mockPackage = {
      name: 'test-app',
      dependencies: {
        react: '^18.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0'
      }
    };

    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPkgPath, JSON.stringify(mockPackage));

    const result = await detector.detectFromPackageJson(testPkgPath);

    expect(result.stack).toContain('React 18.0.0');
    expect(result.stack).toContain('TypeScript');

    await fs.unlink(testPkgPath);
  });

  it('should detect Next.js and styling libraries', async () => {
    const mockPackage = {
      name: 'nextjs-app',
      dependencies: {
        next: '^14.0.0',
        tailwindcss: '^3.0.0'
      }
    };

    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPkgPath, JSON.stringify(mockPackage));

    const result = await detector.detectFromPackageJson(testPkgPath);

    expect(result.stack).toContain('Next.js 14.0.0');
    expect(result.stack).toContain('TailwindCSS');

    await fs.unlink(testPkgPath);
  });

  it('should suggest atomic structure for component libraries', async () => {
    const mockPackage = {
      dependencies: {
        react: '^18.0.0'
      }
    };

    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPkgPath, JSON.stringify(mockPackage));

    const result = await detector.detectFromPackageJson(testPkgPath);

    expect(result.suggestions.structure).toBe('atomic');
    expect(result.suggestions.watchPatterns).toContain('src/components/**/*.{ts,tsx}');

    await fs.unlink(testPkgPath);
  });

  it('should suggest feature-based structure for Next.js', async () => {
    const mockPackage = {
      dependencies: {
        next: '^14.0.0'
      }
    };

    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPkgPath, JSON.stringify(mockPackage));

    const result = await detector.detectFromPackageJson(testPkgPath);

    expect(result.suggestions.structure).toBe('feature-based');
    expect(result.suggestions.watchPatterns).toContain('app/**/*.{ts,tsx}');

    await fs.unlink(testPkgPath);
  });

  it('should return defaults for missing package.json', async () => {
    const result = await detector.detectFromPackageJson('./nonexistent-package.json');

    expect(result.stack).toEqual(['JavaScript']);
    expect(result.suggestions.structure).toBe('feature-based');
  });

  it('should detect project name from package.json', async () => {
    const mockPackage = {
      name: 'my-awesome-app',
      dependencies: {}
    };

    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPkgPath, JSON.stringify(mockPackage));

    const projectName = await detector.detectProjectName(testPkgPath);

    expect(projectName).toBe('my-awesome-app');

    await fs.unlink(testPkgPath);
  });
});
