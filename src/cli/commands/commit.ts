/**
 * Commit Command
 *
 * AI-powered commit message generation
 * Generates semantic, conventional commit messages
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

import { configLoader } from '../../core/config-loader.js';
import { createProvider } from '../../providers/index.js';
import { getStagedFiles, getStagedDiff, createCommit } from '../../git/git-utils.js';

export interface CommitOptions {
  message?: string;
}

export async function commitCommand(options: CommitOptions = {}): Promise<void> {
  try {
    // Check for staged files
    const stagedFiles = await getStagedFiles();

    if (stagedFiles.length === 0) {
      console.log(chalk.yellow('⚠️  No staged files'));
      console.log(chalk.gray('   Use "git add" to stage files first'));
      return;
    }

    // If message provided, use it directly
    if (options.message) {
      await createCommit(options.message);
      console.log(chalk.green('\n✓ Commit created'));
      return;
    }

    // Load config
    const config = await configLoader.loadOrThrow();

    if (!config.ai) {
      console.log(chalk.yellow('\n⚠️  AI provider not configured'));
      console.log(chalk.gray('   Using manual commit message input\n'));

      const { message } = await inquirer.prompt([{
        type: 'input',
        name: 'message',
        message: 'Commit message:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Commit message is required';
          }
          return true;
        }
      }]);

      await createCommit(message);
      console.log(chalk.green('\n✓ Commit created'));
      return;
    }

    console.log(chalk.cyan('\n🤖 Generating commit message...\n'));

    // Get diff
    const spinner = ora('Analyzing changes...').start();
    const diff = await getStagedDiff();

    // Generate commit message with AI
    try {
      const aiProvider = createProvider(config.ai);
      spinner.text = 'Generating commit message...';

      const commitMessage = await aiProvider.generateCommitMessage(
        diff,
        stagedFiles.map(f => f.split('/').pop() || f)
      );

      spinner.succeed('Commit message generated');

      // Show generated message
      console.log(chalk.cyan('\n📝 Generated commit message:\n'));
      console.log(chalk.white(commitMessage));
      console.log();

      // Ask for confirmation
      const { confirmed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmed',
        message: 'Use this commit message?',
        default: true
      }]);

      if (!confirmed) {
        const { editedMessage } = await inquirer.prompt([{
          type: 'input',
          name: 'editedMessage',
          message: 'Enter custom message:',
          default: commitMessage,
          validate: (input: string) => {
            if (!input || input.trim().length === 0) {
              return 'Commit message is required';
            }
            return true;
          }
        }]);

        await createCommit(editedMessage);
      } else {
        await createCommit(commitMessage);
      }

      console.log(chalk.green('\n✓ Commit created'));

    } catch (error) {
      spinner.fail('Failed to generate commit message');
      console.error(chalk.red(error));

      // Fallback to manual input
      console.log(chalk.yellow('\nFalling back to manual input\n'));

      const { message } = await inquirer.prompt([{
        type: 'input',
        name: 'message',
        message: 'Commit message:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Commit message is required';
          }
          return true;
        }
      }]);

      await createCommit(message);
      console.log(chalk.green('\n✓ Commit created'));
    }

  } catch (error) {
    console.error(chalk.red('\n✗ Commit failed:'), error);
    process.exit(1);
  }
}
