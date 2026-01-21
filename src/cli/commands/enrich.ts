/**
 * Enrich Command
 *
 * Manual AI enhancement of component documentation
 * Run after commit to enrich template-only docs with AI descriptions
 */

import chalk from 'chalk';
import ora from 'ora';
import fg from 'fast-glob';
import * as path from 'path';
import * as fs from 'fs/promises';

import { configLoader } from '../../core/config-loader.js';
import { ComponentAnalyzer } from '../../analyzers/component-analyzer.js';
import { DocGenerator } from '../../generators/doc-generator.js';
import { createProvider } from '../../providers/index.js';

export interface EnrichOptions {
  force?: boolean;
}

export async function enrichCommand(options: EnrichOptions = {}): Promise<void> {
  const startTime = performance.now();

  try {
    // Load config
    const config = await configLoader.loadOrThrow();

    if (!config.ai) {
      console.log(chalk.yellow('⚠️  AI provider not configured'));
      console.log(chalk.gray('   Run "anchor init" to configure AI provider'));
      return;
    }

    console.log(chalk.cyan('\n✨ Enriching documentation with AI...\n'));

    // Initialize AI provider
    const spinner = ora('Connecting to AI provider...').start();
    try {
      const aiProvider = createProvider(config.ai);
      await aiProvider.testConnection();
      spinner.succeed(`Connected to ${config.ai.provider}`);
    } catch (error) {
      spinner.fail('Failed to connect to AI provider');
      console.error(chalk.red(error));
      process.exit(1);
    }

    // Find component files
    const findSpinner = ora('Finding components...').start();
    const patterns = config.detection.watchPatterns;
    const ignore = config.detection.ignore || ['node_modules/**', 'dist/**', '.anchor/**'];

    const files = await fg(patterns, {
      ignore,
      absolute: true,
      cwd: process.cwd()
    });

    findSpinner.succeed(`Found ${chalk.cyan(files.length)} component files`);

    // Filter files that need enrichment
    const filesToEnrich: string[] = [];

    if (options.force) {
      // Force mode: enrich all
      filesToEnrich.push(...files);
    } else {
      // Check which READMEs need enrichment
      for (const file of files) {
        const readmePath = path.join(path.dirname(file), 'README.md');

        try {
          const content = await fs.readFile(readmePath, 'utf-8');

          // Check if README exists but lacks AI content
          if (content.includes('_Component description pending..._')) {
            filesToEnrich.push(file);
          }
        } catch {
          // README doesn't exist, needs generation
          filesToEnrich.push(file);
        }
      }
    }

    if (filesToEnrich.length === 0) {
      console.log(chalk.green('\n✓ All documentation is already enriched'));
      return;
    }

    console.log(chalk.gray(`${filesToEnrich.length} components need enrichment\n`));

    // Initialize components
    const analyzer = new ComponentAnalyzer('./tsconfig.json');
    const aiProvider = createProvider(config.ai);
    const docGenerator = new DocGenerator({
      aiProvider,
      includeExamples: config.documentation?.includeUsageExamples ?? true
    });

    // Process each component
    const progressSpinner = ora('Enriching components...').start();
    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToEnrich) {
      const fileName = path.basename(file);
      const fileIndex = filesToEnrich.indexOf(file) + 1;

      progressSpinner.text = `Enriching ${fileName} (${fileIndex}/${filesToEnrich.length})`;

      try {
        // Analyze component
        const componentMeta = await analyzer.analyze(file);

        // Generate with AI
        const outputPath = path.join(path.dirname(file), 'README.md');
        await docGenerator.generateToFile(
          componentMeta,
          outputPath,
          true // Enable AI
        );

        successCount++;
      } catch (error) {
        console.error(chalk.red(`\n✗ Failed to enrich ${fileName}:`), error);
        errorCount++;
      }
    }

    progressSpinner.succeed(
      chalk.green(`Enriched ${successCount} components`) +
      (errorCount > 0 ? chalk.red(` (${errorCount} errors)`) : '')
    );

    // Summary
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.gray(`\nCompleted in ${duration}s`));

    if (successCount > 0) {
      console.log(chalk.green('\n✓ Documentation enriched with AI'));
      console.log(chalk.gray('  Review changes and commit if satisfied'));
    }

  } catch (error) {
    console.error(chalk.red('\n✗ Enrich failed:'), error);
    process.exit(1);
  }
}
