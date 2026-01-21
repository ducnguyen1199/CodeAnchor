#!/usr/bin/env node

/**
 * CodeAnchor CLI Entry Point
 *
 * This file serves as the executable entry point for the anchor command.
 * It imports and executes the main CLI module from the compiled dist folder.
 */

import('../dist/cli/index.js').catch((error) => {
  console.error('Fatal error loading CodeAnchor CLI:');
  console.error(error);
  process.exit(1);
});
