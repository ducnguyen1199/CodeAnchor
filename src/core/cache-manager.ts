import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { Project } from 'ts-morph';
import * as path from 'path';

export interface CacheEntry {
  fileHash: string;
  dependencies: DependencyCache[];
  structure: ComponentStructure;
  lastParsed: Date;
  version: string;
}

export interface DependencyCache {
  path: string;
  hash: string;
  mtime: number;
}

export interface ComponentStructure {
  name: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

/**
 * Dependency-aware cache manager for component metadata
 * Tracks file changes and direct import dependencies
 */
export class DependencyAwareCacheManager {
  private cacheDir = '.anchor/cache';
  private project: Project;
  private version = '1.0.0';

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Check if file needs update based on file hash and dependency changes
   */
  async needsUpdate(filePath: string): Promise<boolean> {
    const cache = await this.loadCache(filePath);
    if (!cache) return true; // No cache = needs update

    // Fast check: file hash
    const currentHash = await this.hashFile(filePath);
    if (currentHash !== cache.fileHash) {
      return true; // File changed
    }

    // Deep check: direct dependencies only (not transitive)
    try {
      const imports = await this.extractImports(filePath);

      for (const imp of imports) {
        // Check if dependency exists
        const stats = await fs.stat(imp).catch(() => null);
        if (!stats) continue; // Dependency missing, skip

        const depCache = cache.dependencies.find(d => d.path === imp);

        // If no cached dependency or mtime changed, needs update
        if (!depCache || stats.mtimeMs > new Date(cache.lastParsed).getTime()) {
          return true; // Dependency modified
        }
      }
    } catch (error) {
      console.error(`Error checking dependencies for ${filePath}:`, error);
      return true; // On error, force update
    }

    return false; // Cache valid
  }

  /**
   * Save cache entry for file
   */
  async saveCache(filePath: string, structure: ComponentStructure): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });

      const imports = await this.extractImports(filePath);

      const dependencies: DependencyCache[] = await Promise.all(
        imports.map(async (imp) => {
          const stats = await fs.stat(imp);
          return {
            path: imp,
            hash: await this.hashFile(imp),
            mtime: stats.mtimeMs
          };
        })
      );

      const cacheEntry: CacheEntry = {
        fileHash: await this.hashFile(filePath),
        dependencies,
        structure,
        lastParsed: new Date(),
        version: this.version
      };

      const cacheFile = this.getCacheFilePath(filePath);
      await fs.writeFile(cacheFile, JSON.stringify(cacheEntry, null, 2));
    } catch (error) {
      console.error(`Error saving cache for ${filePath}:`, error);
    }
  }

  /**
   * Load cache entry for file
   */
  private async loadCache(filePath: string): Promise<CacheEntry | null> {
    try {
      const cacheFile = this.getCacheFilePath(filePath);
      const content = await fs.readFile(cacheFile, 'utf-8');
      const cache = JSON.parse(content) as CacheEntry;

      // Verify cache version
      if (cache.version !== this.version) {
        return null; // Incompatible version
      }

      return cache;
    } catch {
      return null; // Cache not found or invalid
    }
  }

  /**
   * Extract direct imports from file using ts-morph
   */
  private async extractImports(filePath: string): Promise<string[]> {
    try {
      const sourceFile = this.project.getSourceFile(filePath) || this.project.addSourceFileAtPath(filePath);

      const imports: string[] = [];
      for (const imp of sourceFile.getImportDeclarations()) {
        const moduleFile = imp.getModuleSpecifierSourceFile();
        if (moduleFile) {
          const path = moduleFile.getFilePath();
          if (!path.includes('node_modules') && !path.includes('@types')) {
            imports.push(path);
          }
        }
      }

      return imports;
    } catch (error) {
      console.error(`Error extracting imports from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Compute SHA-256 hash of file
   */
  private async hashFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.error(`Error hashing file ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Get cache file path for source file
   */
  private getCacheFilePath(filePath: string): string {
    const hash = crypto.createHash('sha256').update(filePath).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
