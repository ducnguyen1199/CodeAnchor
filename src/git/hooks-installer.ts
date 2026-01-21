/**
 * Git Hooks Installer
 *
 * Installs CodeAnchor git hooks (pre-commit)
 * Hook runs fast template-only sync (<2s target)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { isGitRepository, getGitRoot } from './git-utils.js';

/**
 * Pre-commit hook script template
 * Calls anchor's internal pre-commit handler
 */
const PRE_COMMIT_SCRIPT = `#!/bin/sh
# CodeAnchor Pre-commit Hook
# Auto-generated - do not edit manually
# Fast template-only documentation sync (<2s target)

# Run anchor pre-commit handler
node -e "
const { preCommitHandler } = require('./dist/git/pre-commit-handler.js');
preCommitHandler.runSilent().catch(() => process.exit(0));
" || exit 0

# Never block commit
exit 0
`;

/**
 * Hooks installer class
 */
export class HooksInstaller {
  /**
   * Install pre-commit hook
   */
  async install(cwd: string = process.cwd()): Promise<void> {
    // Verify git repository
    if (!await isGitRepository(cwd)) {
      throw new Error('Not a git repository. Run this command from inside a git repository.');
    }

    const gitRoot = await getGitRoot(cwd);
    const hooksDir = path.join(gitRoot, '.git', 'hooks');
    const hookPath = path.join(hooksDir, 'pre-commit');

    // Ensure hooks directory exists
    await fs.mkdir(hooksDir, { recursive: true });

    // Check for existing hook
    let existingHook: string | null = null;
    try {
      existingHook = await fs.readFile(hookPath, 'utf-8');
    } catch {
      // No existing hook
    }

    // Backup existing hook if not ours
    if (existingHook && !existingHook.includes('CodeAnchor Pre-commit Hook')) {
      const backupPath = `${hookPath}.backup`;
      await fs.writeFile(backupPath, existingHook);
      console.log(`⚠️  Existing pre-commit hook backed up to: ${backupPath}`);
    }

    // Write new hook
    await fs.writeFile(hookPath, PRE_COMMIT_SCRIPT, { mode: 0o755 });

    console.log(`✓ Pre-commit hook installed: ${hookPath}`);
  }

  /**
   * Uninstall pre-commit hook
   */
  async uninstall(cwd: string = process.cwd()): Promise<void> {
    if (!await isGitRepository(cwd)) {
      throw new Error('Not a git repository');
    }

    const gitRoot = await getGitRoot(cwd);
    const hookPath = path.join(gitRoot, '.git', 'hooks', 'pre-commit');

    // Check if it's our hook
    try {
      const hookContent = await fs.readFile(hookPath, 'utf-8');

      if (!hookContent.includes('CodeAnchor Pre-commit Hook')) {
        console.log('⚠️  Pre-commit hook is not a CodeAnchor hook, skipping removal');
        return;
      }

      // Remove hook
      await fs.unlink(hookPath);
      console.log('✓ Pre-commit hook uninstalled');

      // Restore backup if exists
      const backupPath = `${hookPath}.backup`;
      try {
        const backup = await fs.readFile(backupPath, 'utf-8');
        await fs.writeFile(hookPath, backup, { mode: 0o755 });
        await fs.unlink(backupPath);
        console.log('✓ Previous hook restored from backup');
      } catch {
        // No backup
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('ℹ️  No pre-commit hook found');
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if hook is installed
   */
  async isInstalled(cwd: string = process.cwd()): Promise<boolean> {
    if (!await isGitRepository(cwd)) {
      return false;
    }

    try {
      const gitRoot = await getGitRoot(cwd);
      const hookPath = path.join(gitRoot, '.git', 'hooks', 'pre-commit');
      const hookContent = await fs.readFile(hookPath, 'utf-8');
      return hookContent.includes('CodeAnchor Pre-commit Hook');
    } catch {
      return false;
    }
  }
}

/**
 * Default hooks installer instance
 */
export const hooksInstaller = new HooksInstaller();
