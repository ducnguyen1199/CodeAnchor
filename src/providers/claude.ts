/**
 * Claude AI Provider
 *
 * Implementation of AIProvider interface using Anthropic's Claude API
 * Supports Claude 3 and Claude 3.5 models
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AIProviderConfig,
  ComponentMeta,
  ConnectionTestError,
  GenerationError
} from './ai-provider.js';

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  model: string;
  private client: Anthropic;
  private options: AIProviderConfig['options'];

  constructor(config: AIProviderConfig) {
    this.model = config.model;
    this.options = config.options;
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error) {
      throw new ConnectionTestError('claude', error);
    }
  }

  /**
   * Generate component description using Claude
   */
  async generateDescription(component: ComponentMeta): Promise<string> {
    try {
      const prompt = this.buildDescriptionPrompt(component);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.options?.maxTokens || 500,
        temperature: this.options?.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text.trim();
    } catch (error) {
      throw new GenerationError('claude', 'description', error);
    }
  }

  /**
   * Generate usage example using Claude
   */
  async generateExample(component: ComponentMeta): Promise<string> {
    try {
      const prompt = this.buildExamplePrompt(component);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.options?.maxTokens || 800,
        temperature: this.options?.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text.trim();
    } catch (error) {
      throw new GenerationError('claude', 'example', error);
    }
  }

  /**
   * Generate commit message using Claude
   */
  async generateCommitMessage(diff: string, files: string[]): Promise<string> {
    try {
      const prompt = this.buildCommitMessagePrompt(diff, files);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        temperature: 0.3, // Lower temperature for more consistent commit messages
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      return textContent.text.trim();
    } catch (error) {
      throw new GenerationError('claude', 'commit message', error);
    }
  }

  /**
   * Build prompt for component description generation
   */
  private buildDescriptionPrompt(component: ComponentMeta): string {
    const propsText = component.props
      .map(p => `  - ${p.name}: ${p.type}${p.required ? ' (required)' : ' (optional)'}${p.description ? ` - ${p.description}` : ''}`)
      .join('\n');

    return `Generate a concise, professional description for this React component.

Component Name: ${component.name}

Props:
${propsText}

Requirements:
- 1-2 sentences maximum
- Focus on functionality and use case
- Avoid redundant phrases like "This component..."
- Be specific and actionable

Description:`;
  }

  /**
   * Build prompt for usage example generation
   */
  private buildExamplePrompt(component: ComponentMeta): string {
    const propsText = component.props
      .map(p => `  - ${p.name}: ${p.type}${p.required ? ' (required)' : ' (optional)'}`)
      .join('\n');

    const requiredProps = component.props.filter(p => p.required);

    return `Generate a realistic usage example for this React component.

Component Name: ${component.name}

Props:
${propsText}

Requirements:
- Show realistic prop values
- Include all required props
- Use TypeScript syntax
- Keep it simple and practical
- Include only the component usage, no imports or function wrappers

Example:`;
  }

  /**
   * Build prompt for commit message generation
   */
  private buildCommitMessagePrompt(diff: string, files: string[]): string {
    // Truncate diff if too long
    const truncatedDiff = diff.length > 3000 ? diff.slice(0, 3000) + '\n...(truncated)' : diff;

    return `Generate a conventional commit message for these changes.

Changed files:
${files.map(f => `  - ${f}`).join('\n')}

Git diff:
${truncatedDiff}

Requirements:
- Use conventional commit format: <type>(<scope>): <description>
- Type: feat, fix, docs, style, refactor, test, chore
- Keep description under 72 characters
- Be specific and clear

Commit message:`;
  }
}
