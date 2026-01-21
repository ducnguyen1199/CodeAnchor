/**
 * Git Utilities
 *
 * Helper functions for git operations
 * Used by pre-commit hooks, enrich command, and commit message generation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Git operation errors
 */
export class GitError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GitError';
    this.cause = cause;
  }
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get staged files (files added to git index)
 * @returns Array of absolute file paths
 */
export async function getStagedFiles(cwd: string = process.cwd()): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git diff --cached --name-only --diff-filter=ACMR', { cwd });

    if (!stdout.trim()) {
      return [];
    }

    const files = stdout
      .trim()
      .split('\n')
      .map(file => path.resolve(cwd, file));

    return files;
  } catch (error) {
    throw new GitError('Failed to get staged files', error);
  }
}

/**
 * Get git diff for staged files
 * @returns Git diff output
 */
export async function getStagedDiff(cwd: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git diff --cached', { cwd });
    return stdout;
  } catch (error) {
    throw new GitError('Failed to get staged diff', error);
  }
}

/**
 * Stage file (git add)
 */
export async function stageFile(filePath: string, cwd: string = process.cwd()): Promise<void> {
  try {
    const relativePath = path.relative(cwd, filePath);
    await execAsync(`git add "${relativePath}"`, { cwd });
  } catch (error) {
    throw new GitError(`Failed to stage file: ${filePath}`, error);
  }
}

/**
 * Stage multiple files
 */
export async function stageFiles(filePaths: string[], cwd: string = process.cwd()): Promise<void> {
  for (const filePath of filePaths) {
    await stageFile(filePath, cwd);
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(cwd: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd });
    return stdout.trim();
  } catch (error) {
    throw new GitError('Failed to get current branch', error);
  }
}

/**
 * Check if file is tracked by git
 */
export async function isTrackedFile(filePath: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    const relativePath = path.relative(cwd, filePath);
    await execAsync(`git ls-files --error-unmatch "${relativePath}"`, { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git root directory
 */
export async function getGitRoot(cwd: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd });
    return stdout.trim();
  } catch (error) {
    throw new GitError('Failed to get git root', error);
  }
}

/**
 * Get changed files (uncommitted changes)
 */
export async function getChangedFiles(cwd: string = process.cwd()): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git diff --name-only --diff-filter=ACMR', { cwd });

    if (!stdout.trim()) {
      return [];
    }

    const files = stdout
      .trim()
      .split('\n')
      .map(file => path.resolve(cwd, file));

    return files;
  } catch (error) {
    throw new GitError('Failed to get changed files', error);
  }
}

/**
 * Create git commit
 */
export async function createCommit(message: string, cwd: string = process.cwd()): Promise<void> {
  try {
    // Use heredoc for multi-line commit messages
    const escapedMessage = message.replace(/'/g, "'\\''");
    await execAsync(`git commit -m '${escapedMessage}'`, { cwd });
  } catch (error) {
    throw new GitError('Failed to create commit', error);
  }
}

/**
 * Get file content at specific commit
 */
export async function getFileAtCommit(
  filePath: string,
  commit: string = 'HEAD',
  cwd: string = process.cwd()
): Promise<string> {
  try {
    const relativePath = path.relative(cwd, filePath);
    const { stdout } = await execAsync(`git show ${commit}:"${relativePath}"`, { cwd });
    return stdout;
  } catch (error) {
    throw new GitError(`Failed to get file at commit ${commit}`, error);
  }
}
