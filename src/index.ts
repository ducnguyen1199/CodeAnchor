/**
 * CodeAnchor - A CLI tool that anchors your code to standards and living documentation
 *
 * @module codeanchor
 */

// Phase 0: Cache manager (from validation)
export { DependencyAwareCacheManager } from './core/cache-manager.js';
export type { CacheEntry, DependencyCache, ComponentStructure } from './core/cache-manager.js';

// Phase 1: Core configuration and providers
export { configLoader, ConfigLoader, ConfigError, loadConfig } from './core/config-loader.js';
export { configSchema, type AnchorConfig, type PartialAnchorConfig } from './core/config-schema.js';
export { techDetector, TechDetector, type DetectionResult, type PackageJson } from './core/tech-detector.js';
export { createProvider, getDefaultModel, isProviderSupported } from './providers/index.js';
export type { AIProvider, AIProviderConfig } from './providers/index.js';
export { AIProviderError, ConnectionTestError, GenerationError } from './providers/index.js';
export { templateEngine, TemplateEngine, renderComponentDoc, type ComponentTemplateData } from './templates/index.js';

// Phase 2: Detection engine and generators
export { ComponentAnalyzer, componentAnalyzer, ComponentAnalysisError, type ComponentMeta, type PropMeta } from './analyzers/component-analyzer.js';
export { DocGenerator, createDocGenerator, type DocGeneratorOptions } from './generators/doc-generator.js';
