/**
 * Tech Stack Detector
 *
 * Analyzes package.json to detect frameworks, libraries, and tooling
 * Used during "anchor init" to auto-configure the project
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  [key: string]: unknown;
}

export interface DetectionResult {
  stack: string[];
  suggestions: {
    structure: 'atomic' | 'feature-based' | 'modular' | 'custom';
    watchPatterns: string[];
  };
}

/**
 * Tech stack detector class
 */
export class TechDetector {
  /**
   * Detect tech stack from package.json
   * @param pkgPath - Path to package.json
   * @returns Detected technologies and suggestions
   */
  async detectFromPackageJson(pkgPath: string = './package.json'): Promise<DetectionResult> {
    try {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);

      const deps: Record<string, string> = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      const detected: string[] = [];

      // Framework detection
      if (deps.next) {
        detected.push(`Next.js ${this.cleanVersion(deps.next)}`);
      } else if (deps.react) {
        detected.push(`React ${this.cleanVersion(deps.react)}`);
      }

      if (deps.vue) {
        detected.push(`Vue ${this.cleanVersion(deps.vue)}`);
      }

      if (deps.svelte) {
        detected.push(`Svelte ${this.cleanVersion(deps.svelte)}`);
      }

      // Styling detection
      if (deps.tailwindcss) {
        detected.push('TailwindCSS');
      }

      if (deps['styled-components']) {
        detected.push('Styled Components');
      }

      if (deps['@emotion/react'] || deps['@emotion/styled']) {
        detected.push('Emotion');
      }

      // State management
      if (deps.zustand) {
        detected.push('Zustand');
      }

      if (deps.redux || deps['@reduxjs/toolkit']) {
        detected.push('Redux');
      }

      if (deps.jotai) {
        detected.push('Jotai');
      }

      // TypeScript
      if (deps.typescript) {
        detected.push('TypeScript');
      }

      // Testing
      if (deps.vitest) {
        detected.push('Vitest');
      } else if (deps.jest) {
        detected.push('Jest');
      }

      // Build tools
      if (deps.vite) {
        detected.push('Vite');
      }

      if (deps.turbopack || deps.turbo) {
        detected.push('Turbo');
      }

      // Generate suggestions based on detected stack
      const suggestions = this.generateSuggestions(detected, deps);

      return {
        stack: detected.length > 0 ? detected : ['JavaScript'],
        suggestions
      };
    } catch (error) {
      // If package.json doesn't exist or is invalid, return defaults
      return {
        stack: ['JavaScript'],
        suggestions: {
          structure: 'feature-based',
          watchPatterns: ['src/**/*.{js,jsx,ts,tsx}']
        }
      };
    }
  }

  /**
   * Generate project suggestions based on detected stack
   */
  private generateSuggestions(
    detected: string[],
    deps: Record<string, string>
  ): DetectionResult['suggestions'] {
    const hasNext = detected.some(d => d.includes('Next.js'));
    const hasReact = detected.some(d => d.includes('React'));
    const hasVue = detected.some(d => d.includes('Vue'));

    // Structure suggestions
    let structure: DetectionResult['suggestions']['structure'] = 'feature-based';

    if (hasNext) {
      structure = 'feature-based'; // Next.js app directory structure
    } else if (hasReact || hasVue) {
      structure = 'atomic'; // Atomic design for component libraries
    }

    // Watch pattern suggestions
    const watchPatterns: string[] = [];

    if (hasNext) {
      watchPatterns.push('app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}');
    } else if (hasReact) {
      watchPatterns.push('src/components/**/*.{ts,tsx}');
    } else if (hasVue) {
      watchPatterns.push('src/components/**/*.vue');
    } else {
      watchPatterns.push('src/**/*.{js,jsx,ts,tsx}');
    }

    return {
      structure,
      watchPatterns
    };
  }

  /**
   * Clean version string (remove ^, ~, etc.)
   */
  private cleanVersion(version: string): string {
    return version.replace(/^[\^~]/, '');
  }

  /**
   * Detect project name from package.json
   */
  async detectProjectName(pkgPath: string = './package.json'): Promise<string> {
    try {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);
      return pkg.name || path.basename(process.cwd());
    } catch {
      return path.basename(process.cwd());
    }
  }
}

/**
 * Default tech detector instance
 */
export const techDetector = new TechDetector();
