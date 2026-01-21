/**
 * Documentation Generator
 *
 * Generates markdown documentation from component metadata
 * Uses template engine for consistent formatting
 */

import { renderComponentDoc, type ComponentTemplateData } from '../templates/index.js';
import type { ComponentMeta } from '../analyzers/component-analyzer.js';
import type { AIProvider } from '../providers/ai-provider.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Doc generation options
 */
export interface DocGeneratorOptions {
  aiProvider?: AIProvider;
  includeExamples?: boolean;
  includeTimestamp?: boolean;
}

/**
 * Documentation generator
 */
export class DocGenerator {
  private aiProvider?: AIProvider;
  private includeExamples: boolean;
  private includeTimestamp: boolean;

  constructor(options: DocGeneratorOptions = {}) {
    this.aiProvider = options.aiProvider;
    this.includeExamples = options.includeExamples ?? true;
    this.includeTimestamp = options.includeTimestamp ?? true;
  }

  /**
   * Generate documentation for component
   * @param component - Component metadata
   * @param useAI - Whether to use AI for descriptions
   * @returns Generated markdown
   */
  async generate(component: ComponentMeta, useAI: boolean = false): Promise<string> {
    // Prepare template data
    const templateData: ComponentTemplateData = {
      name: component.name,
      props: component.props,
      dependencies: component.dependencies.length > 0 ? component.dependencies : undefined,
      lastUpdated: this.includeTimestamp ? new Date().toISOString() : undefined as any
    };

    // Generate AI-powered descriptions if available and requested
    if (useAI && this.aiProvider) {
      try {
        templateData.description = await this.aiProvider.generateDescription({
          name: component.name,
          props: component.props,
          dependencies: component.dependencies
        });

        if (this.includeExamples) {
          templateData.example = await this.aiProvider.generateExample({
            name: component.name,
            props: component.props,
            dependencies: component.dependencies
          });
        }
      } catch (error) {
        console.warn(`AI generation failed for ${component.name}, using template-only mode`);
        // Continue with template-only mode
      }
    }

    // Render template
    return renderComponentDoc(templateData);
  }

  /**
   * Generate and write documentation to file
   * @param component - Component metadata
   * @param outputPath - Path to write README.md
   * @param useAI - Whether to use AI for descriptions
   */
  async generateToFile(
    component: ComponentMeta,
    outputPath: string,
    useAI: boolean = false
  ): Promise<void> {
    const markdown = await this.generate(component, useAI);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    await fs.writeFile(outputPath, markdown, 'utf-8');
  }

  /**
   * Generate documentation for multiple components
   * @param components - Array of component metadata
   * @param useAI - Whether to use AI for descriptions
   * @returns Map of component name to generated markdown
   */
  async generateBatch(
    components: ComponentMeta[],
    useAI: boolean = false
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const component of components) {
      const markdown = await this.generate(component, useAI);
      results.set(component.name, markdown);
    }

    return results;
  }

  /**
   * Update AI provider
   */
  setAIProvider(provider: AIProvider): void {
    this.aiProvider = provider;
  }
}

/**
 * Create default doc generator
 */
export function createDocGenerator(options?: DocGeneratorOptions): DocGenerator {
  return new DocGenerator(options);
}
