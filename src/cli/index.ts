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
import { enrichCommand } from './commands/enrich.js';
import { commitCommand } from './commands/commit.js';

const program = new Command();

program
  .name('anchor')
  .description('⚓ Anchor your code to standards and living documentation')
  .version('0.1.0')
  .addHelpText('after', '\nDocumentation: https://github.com/yourusername/codeanchor\nIssues: https://github.com/yourusername/codeanchor/issues');

// Init command - Initialize CodeAnchor in project
program
  .command('init')
  .description('Initialize CodeAnchor in your project')
  .addHelpText('after', '\nThis will:\n  • Detect your tech stack\n  • Configure project structure\n  • Set up AI provider (optional)\n  • Create anchor.config.json\n  • Install git hooks (optional)')
  .action(initCommand);

// Sync command - Generate/update documentation
program
  .command('sync')
  .description('Sync component documentation')
  .option('--fast', 'Only process changed files (cache-aware, faster)')
  .option('--force', 'Force regeneration of all docs (ignore cache)')
  .option('--no-ai', 'Disable AI-powered generation (template-only mode)')
  .addHelpText('after', '\nExamples:\n  $ anchor sync              # Full sync with AI\n  $ anchor sync --fast       # Only changed files\n  $ anchor sync --no-ai      # Template-only (faster)')
  .action(syncCommand);

// Watch command - Monitor file changes
program
  .command('watch')
  .description('Watch for changes and auto-sync documentation')
  .option('--no-ai', 'Disable AI-powered generation (template-only mode)')
  .addHelpText('after', '\nExamples:\n  $ anchor watch             # Watch with AI\n  $ anchor watch --no-ai     # Watch template-only\n\nPress Ctrl+C to stop watching.')
  .action(watchCommand);

// Enrich command - AI enhancement
program
  .command('enrich')
  .description('Enrich documentation with AI descriptions')
  .option('--force', 'Re-enrich all components (even already enriched)')
  .addHelpText('after', '\nExamples:\n  $ anchor enrich            # Enrich pending components\n  $ anchor enrich --force    # Re-enrich all components\n\nNote: Requires AI provider configured in anchor.config.json')
  .action(enrichCommand);

// Commit command - AI commit messages
program
  .command('commit')
  .description('Create commit with AI-generated semantic commit message')
  .option('-m, --message <message>', 'Use provided message instead of AI')
  .addHelpText('after', '\nExamples:\n  $ anchor commit                           # AI-generated message\n  $ anchor commit -m "feat: add button"    # Manual message\n\nNote: Analyzes staged changes to generate semantic commit messages.')
  .action(commitCommand);

// Parse command line arguments
program.parse();
