/**
 * CLI Framework Setup
 *
 * Main entry point for the anchor CLI.
 * Sets up Commander program with all available commands.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { syncCommand } from './commands/sync.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('anchor')
  .description('Anchor your code to standards and living documentation')
  .version('0.1.0');

// Init command - Initialize CodeAnchor in project
program
  .command('init')
  .description('Initialize CodeAnchor in your project')
  .action(initCommand);

// Sync command - Generate/update documentation
program
  .command('sync')
  .description('Sync component documentation')
  .option('--fast', 'Only process changed files (cache-aware)')
  .option('--force', 'Force regeneration of all docs')
  .option('--no-ai', 'Disable AI-powered generation')
  .action(syncCommand);

// Watch command - Monitor file changes
program
  .command('watch')
  .description('Watch for changes and auto-sync documentation')
  .option('--no-ai', 'Disable AI-powered generation')
  .action(watchCommand);

// Parse command line arguments
program.parse();
