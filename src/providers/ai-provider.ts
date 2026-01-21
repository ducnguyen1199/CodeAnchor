/**
 * AI Provider Interface
 *
 * Abstract interface for AI providers (Claude, OpenAI, Gemini, etc.)
 * Enables easy swapping and addition of new AI providers
 */

/**
 * Component metadata for AI generation
 */
export interface ComponentMeta {
  name: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  dependencies?: string[];
}

/**
 * AI provider interface
 * All providers must implement these methods
 */
export interface AIProvider {
  /** Provider name (e.g., 'claude', 'openai') */
  name: string;

  /** Model identifier */
  model: string;

  /**
   * Test connection to AI provider
   * @returns True if connection successful
   */
  testConnection(): Promise<boolean>;

  /**
   * Generate component description from metadata
   * @param component - Component metadata
   * @returns AI-generated description
   */
  generateDescription(component: ComponentMeta): Promise<string>;

  /**
   * Generate usage example for component
   * @param component - Component metadata
   * @returns AI-generated usage example code
   */
  generateExample(component: ComponentMeta): Promise<string>;

  /**
   * Generate conventional commit message
   * @param diff - Git diff content
   * @param files - Changed file paths
   * @returns AI-generated commit message
   */
  generateCommitMessage(diff: string, files: string[]): Promise<string>;
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'ollama';
  model: string;
  apiKey: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * Base error class for AI provider errors
 */
export class AIProviderError extends Error {
  public provider: string;
  public override cause?: unknown;

  constructor(
    message: string,
    provider: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.cause = cause;
  }
}

/**
 * Connection test failed error
 */
export class ConnectionTestError extends AIProviderError {
  constructor(provider: string, cause?: unknown) {
    super(`Failed to connect to ${provider}`, provider, cause);
    this.name = 'ConnectionTestError';
  }
}

/**
 * Generation failed error
 */
export class GenerationError extends AIProviderError {
  constructor(provider: string, operation: string, cause?: unknown) {
    super(`Failed to generate ${operation} using ${provider}`, provider, cause);
    this.name = 'GenerationError';
  }
}
