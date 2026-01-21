/**
 * CodeAnchor - A CLI tool that anchors your code to standards and living documentation
 *
 * @module codeanchor
 */

// Phase 0: Only cache-manager is implemented for validation
export { DependencyAwareCacheManager } from './core/cache-manager.js';
export type { CacheEntry, DependencyCache, ComponentStructure } from './core/cache-manager.js';

// TODO: Phase 1 exports (will be uncommented during Phase 1 implementation)
// export { loadConfig } from './core/config-loader.js';
// export { AnchorConfigSchema } from './core/schema.js';
// export { createProvider } from './providers/index.js';
// export type { AnchorConfig, AIConfig } from './types/config.js';
// export type { AIProvider } from './types/provider.js';
