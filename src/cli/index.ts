/**
 * CLI Framework Setup
 *
 * Main entry point for the anchor CLI.
 * Sets up Commander program with all available commands.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';

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

// Parse command line arguments
program.parse();
