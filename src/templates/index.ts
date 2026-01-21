/**
 * Template Engine
 *
 * Handlebars-based template loader and renderer
 * Used for generating component documentation
 */

import Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template data for component documentation
 */
export interface ComponentTemplateData {
  name: string;
  description?: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  example?: string;
  dependencies?: string[];
  lastUpdated: string;
}

/**
 * Template engine class
 */
export class TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Load template from file
   * @param name - Template name (without extension)
   * @returns Compiled template
   */
  async loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache first
    if (this.templates.has(name)) {
      return this.templates.get(name)!;
    }

    // Load template file
    const templatePath = path.join(__dirname, `${name}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Compile template
    const compiled = Handlebars.compile(templateContent);

    // Cache it
    this.templates.set(name, compiled);

    return compiled;
  }

  /**
   * Render component documentation template
   * @param data - Template data
   * @returns Rendered markdown
   */
  async renderComponentDoc(data: ComponentTemplateData): Promise<string> {
    const template = await this.loadTemplate('component.md');
    return template(data);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templates.clear();
  }
}

/**
 * Default template engine instance
 */
export const templateEngine = new TemplateEngine();

/**
 * Convenience function to render component documentation
 */
export async function renderComponentDoc(data: ComponentTemplateData): Promise<string> {
  return templateEngine.renderComponentDoc(data);
}
