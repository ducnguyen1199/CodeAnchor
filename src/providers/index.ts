/**
 * AI Provider Factory
 *
 * Creates AI provider instances based on configuration
 * Supports pluggable provider architecture
 */

import { AIProvider, AIProviderConfig, AIProviderError } from './ai-provider.js';
import { ClaudeProvider } from './claude.js';

/**
 * Create AI provider instance from config
 * @param config - AI provider configuration
 * @returns Provider instance
 * @throws AIProviderError if provider not supported
 */
export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config);

    case 'openai':
      throw new AIProviderError(
        'OpenAI provider not yet implemented. Use Claude for now.',
        'openai'
      );

    case 'gemini':
      throw new AIProviderError(
        'Gemini provider not yet implemented. Use Claude for now.',
        'gemini'
      );

    case 'ollama':
      throw new AIProviderError(
        'Ollama provider not yet implemented. Use Claude for now.',
        'ollama'
      );

    default:
      throw new AIProviderError(
        `Unsupported AI provider: ${config.provider}`,
        config.provider
      );
  }
}

/**
 * Get default model for provider
 * @param provider - Provider name
 * @returns Default model identifier
 */
export function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'claude':
      return 'claude-3-5-sonnet-20241022';
    case 'openai':
      return 'gpt-4-turbo-preview';
    case 'gemini':
      return 'gemini-pro';
    case 'ollama':
      return 'codellama';
    default:
      return 'claude-3-5-sonnet-20241022';
  }
}

/**
 * Validate provider availability
 * @param provider - Provider name
 * @returns True if provider is implemented
 */
export function isProviderSupported(provider: string): boolean {
  return provider === 'claude';
}

// Re-export types and errors
export type { AIProvider, AIProviderConfig, ComponentMeta } from './ai-provider.js';
export { AIProviderError, ConnectionTestError, GenerationError } from './ai-provider.js';
