/**
 * Sync Command
 *
 * Analyzes components and generates/updates documentation
 * Supports fast mode (git staged files only) and full sync
 */

import chalk from 'chalk';
import ora from 'ora';
import fg from 'fast-glob';
import * as path from 'path';

import { configLoader } from '../../core/config-loader.js';
import { ComponentAnalyzer } from '../../analyzers/component-analyzer.js';
import { DependencyAwareCacheManager } from '../../core/cache-manager.js';
import { DocGenerator } from '../../generators/doc-generator.js';
import { createProvider } from '../../providers/index.js';
import { Project } from 'ts-morph';

export interface SyncOptions {
  fast?: boolean;
  force?: boolean;
  ai?: boolean;
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
  const startTime = performance.now();

  try {
    // Load config
    const config = await configLoader.loadOrThrow();

    console.log(chalk.cyan('\n🔄 Syncing documentation...\n'));

    // Initialize components
    const project = new Project({
      tsConfigFilePath: './tsconfig.json',
      skipAddingFilesFromTsConfig: true
    });

    const analyzer = new ComponentAnalyzer('./tsconfig.json');
    const cacheManager = new DependencyAwareCacheManager(project);
    const docGenerator = new DocGenerator({
      includeExamples: config.documentation?.includeUsageExamples ?? true
    });

    // Setup AI provider if configured and requested
    if (options.ai !== false && config.ai) {
      try {
        const aiProvider = createProvider(config.ai);
        docGenerator.setAIProvider(aiProvider);
        console.log(chalk.green(`✓ AI provider: ${config.ai.provider} (${config.ai.model})\n`));
      } catch (error) {
        console.log(chalk.yellow('⚠️  AI provider not available, using template-only mode\n'));
      }
    }

    // Find component files
    const spinner = ora('Finding components...').start();
    const patterns = config.detection.watchPatterns;
    const ignore = config.detection.ignore || ['node_modules/**', 'dist/**', '.anchor/**'];

    const files = await fg(patterns, {
      ignore,
      absolute: true,
      cwd: process.cwd()
    });

    spinner.succeed(`Found ${chalk.cyan(files.length)} component files`);

    // Filter files based on mode
    let filesToSync: string[] = files;
    if (options.fast) {
      // Fast mode: only process changed files (cache-aware)
      const changedFiles: string[] = [];
      for (const file of files) {
        if (options.force || await cacheManager.needsUpdate(file)) {
          changedFiles.push(file);
        }
      }
      filesToSync = changedFiles;
      console.log(chalk.gray(`Fast mode: ${filesToSync.length} files need update\n`));
    }

    if (filesToSync.length === 0) {
      console.log(chalk.green('✓ All documentation is up to date'));
      return;
    }

    // Process each component
    const progressSpinner = ora('Analyzing components...').start();
    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToSync) {
      const fileName = path.basename(file);
      const fileIndex = filesToSync.indexOf(file) + 1;

      progressSpinner.text = `Analyzing ${fileName} (${fileIndex}/${filesToSync.length})`;

      try {
        // Analyze component
        const componentMeta = await analyzer.analyze(file);

        // Generate documentation
        const outputPath = path.join(path.dirname(file), 'README.md');
        await docGenerator.generateToFile(
          componentMeta,
          outputPath,
          options.ai !== false && !!config.ai
        );

        // Update cache
        await cacheManager.saveCache(file, {
          name: componentMeta.name,
          props: componentMeta.props
        });

        successCount++;
      } catch (error) {
        console.error(chalk.red(`\n✗ Failed to process ${fileName}:`), error);
        errorCount++;
      }
    }

    progressSpinner.succeed(
      chalk.green(`Processed ${successCount} components`) +
      (errorCount > 0 ? chalk.red(` (${errorCount} errors)`) : '')
    );

    // Summary
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.gray(`\nCompleted in ${duration}s`));

    if (successCount > 0) {
      console.log(chalk.green('\n✓ Documentation synced successfully'));
    }

  } catch (error) {
    console.error(chalk.red('\n✗ Sync failed:'), error);
    process.exit(1);
  }
}
