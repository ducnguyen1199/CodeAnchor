/**
 * Config Loader
 *
 * Loads and validates anchor.config.json using cosmiconfig
 * Provides type-safe config access throughout the application
 */

import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import { configSchema, type AnchorConfig } from './config-schema.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Config loader errors
 */
export class ConfigError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ConfigError';
    this.cause = cause;
  }
}

/**
 * Config loader class
 */
export class ConfigLoader {
  private moduleName = 'anchor';
  private explorer = cosmiconfig(this.moduleName);

  /**
   * Load configuration from project directory
   * @param searchFrom - Directory to start search from (defaults to cwd)
   * @returns Validated config or null if not found
   */
  async load(searchFrom?: string): Promise<AnchorConfig | null> {
    try {
      const result = await this.explorer.search(searchFrom);

      if (!result || result.isEmpty) {
        return null;
      }

      // Validate config with Zod
      return this.validate(result.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigError('Invalid configuration', error);
      }
      throw error;
    }
  }

  /**
   * Load configuration or throw error if not found
   * @param searchFrom - Directory to start search from
   * @returns Validated config
   * @throws ConfigError if config not found or invalid
   */
  async loadOrThrow(searchFrom?: string): Promise<AnchorConfig> {
    const config = await this.load(searchFrom);

    if (!config) {
      throw new ConfigError(
        'CodeAnchor configuration not found. Run "anchor init" to create one.'
      );
    }

    return config;
  }

  /**
   * Validate config object against schema
   * @param config - Raw config object
   * @returns Validated and typed config
   */
  validate(config: unknown): AnchorConfig {
    try {
      return configSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `  • ${e.path.join('.')}: ${e.message}`);
        throw new ConfigError(
          `Configuration validation failed:\n${messages.join('\n')}`,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Write configuration to anchor.config.json
   * @param config - Config object to write
   * @param targetDir - Directory to write config to (defaults to cwd)
   */
  async write(config: AnchorConfig, targetDir?: string): Promise<string> {
    // Validate before writing
    const validated = this.validate(config);

    const configPath = path.join(targetDir || process.cwd(), 'anchor.config.json');

    await fs.writeFile(
      configPath,
      JSON.stringify(validated, null, 2),
      'utf-8'
    );

    return configPath;
  }

  /**
   * Check if config file exists
   * @param searchFrom - Directory to start search from
   * @returns True if config exists
   */
  async exists(searchFrom?: string): Promise<boolean> {
    const result = await this.explorer.search(searchFrom);
    return result !== null && !result.isEmpty;
  }

  /**
   * Clear cosmiconfig cache
   */
  clearCache(): void {
    this.explorer.clearCaches();
  }
}

/**
 * Default config loader instance
 */
export const configLoader = new ConfigLoader();

/**
 * Convenience function to load config
 */
export async function loadConfig(searchFrom?: string): Promise<AnchorConfig | null> {
  return configLoader.load(searchFrom);
}
