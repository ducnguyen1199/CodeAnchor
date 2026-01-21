/**
 * Pre-commit Handler
 *
 * Fast template-only documentation sync during git pre-commit hook
 * Target: <2s execution time (no AI, cache-aware)
 */

import * as path from 'path';
import { getStagedFiles, stageFile } from './git-utils.js';
import { ComponentAnalyzer } from '../analyzers/component-analyzer.js';
import { DocGenerator } from '../generators/doc-generator.js';
import { DependencyAwareCacheManager } from '../core/cache-manager.js';
import { configLoader } from '../core/config-loader.js';
import { Project } from 'ts-morph';

export interface PreCommitResult {
  processed: number;
  skipped: number;
  errors: number;
  duration: number;
}

/**
 * Pre-commit hook handler
 * Template-only sync for speed (<2s target)
 */
export class PreCommitHandler {
  private analyzer?: ComponentAnalyzer;
  private docGenerator?: DocGenerator;
  private cacheManager?: Project;

  /**
   * Run pre-commit hook
   * @returns Result statistics
   */
  async run(): Promise<PreCommitResult> {
    const startTime = performance.now();
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Load config
      const config = await configLoader.loadOrThrow();

      // Get staged files
      const stagedFiles = await getStagedFiles();

      if (stagedFiles.length === 0) {
        return { processed: 0, skipped: 0, errors: 0, duration: 0 };
      }

      // Filter for component files matching watch patterns
      const componentFiles = stagedFiles.filter(file => {
        return config.detection.watchPatterns.some(pattern => {
          // Simple glob pattern matching (*.tsx, *.ts, etc.)
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(file);
        });
      });

      if (componentFiles.length === 0) {
        return { processed: 0, skipped: 0, errors: 0, duration: 0 };
      }

      // Initialize components
      const project = new Project({
        tsConfigFilePath: './tsconfig.json',
        skipAddingFilesFromTsConfig: true
      });

      this.analyzer = new ComponentAnalyzer('./tsconfig.json');
      this.docGenerator = new DocGenerator({
        includeExamples: false, // Skip examples for speed
        includeTimestamp: true
      });
      const cacheManager = new DependencyAwareCacheManager(project);

      // Process each component file
      for (const file of componentFiles) {
        try {
          // Check cache (skip if not needed)
          if (await cacheManager.needsUpdate(file)) {
            // Analyze component
            const componentMeta = await this.analyzer.analyze(file);

            // Generate template-only doc (no AI)
            const outputPath = path.join(path.dirname(file), 'README.md');
            await this.docGenerator.generateToFile(
              componentMeta,
              outputPath,
              false // No AI in pre-commit
            );

            // Stage generated README
            await stageFile(outputPath);

            // Update cache
            await cacheManager.saveCache(file, {
              name: componentMeta.name,
              props: componentMeta.props
            });

            processed++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Error processing ${file}:`, error);
          errors++;
        }
      }

      const duration = performance.now() - startTime;

      return {
        processed,
        skipped,
        errors,
        duration
      };
    } catch (error) {
      console.error('Pre-commit hook error:', error);
      const duration = performance.now() - startTime;
      return {
        processed,
        skipped,
        errors: errors + 1,
        duration
      };
    }
  }

  /**
   * Run silently (for git hook usage)
   * Never fails the commit
   */
  async runSilent(): Promise<void> {
    try {
      await this.run();
    } catch {
      // Swallow errors - never block commit
    }
  }
}

/**
 * Default pre-commit handler instance
 */
export const preCommitHandler = new PreCommitHandler();
