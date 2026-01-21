# Contributing to CodeAnchor

Thank you for your interest in contributing to CodeAnchor! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Git
- TypeScript knowledge

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/codeanchor.git
cd codeanchor

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development mode (watch)
npm run dev

# Link locally for testing
npm link

# Test in another project
cd /path/to/test-project
npm link codeanchor
anchor init
```

## Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript

- Use strict mode
- Avoid `any` types
- Document complex functions with JSDoc
- Use descriptive variable names
- Follow YAGNI, KISS, and DRY principles

### File Organization

```
src/
├── cli/           # CLI commands and setup
├── core/          # Core configuration and utilities
├── analyzers/     # Component analysis
├── generators/    # Documentation generation
├── providers/     # AI provider implementations
├── git/           # Git integration
└── templates/     # Documentation templates
```

### Naming Conventions

- **Files:** kebab-case (e.g., `config-loader.ts`)
- **Classes:** PascalCase (e.g., `ConfigLoader`)
- **Functions:** camelCase (e.g., `loadConfig`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_MODEL`)

### Error Handling

- Use custom error classes for specific errors
- Provide clear error messages
- Include context in error objects
- Never swallow errors silently

Example:
```typescript
export class ConfigError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ConfigError';
    this.cause = cause;
  }
}

throw new ConfigError('Failed to load config', originalError);
```

### Testing

- Write unit tests for new features
- Aim for >80% code coverage
- Test error cases
- Use descriptive test names

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('ConfigLoader', () => {
  it('should load valid configuration', async () => {
    const config = await configLoader.load();
    expect(config).toBeDefined();
  });

  it('should throw on invalid configuration', async () => {
    await expect(configLoader.validate({})).rejects.toThrow(ConfigError);
  });
});
```

## Project Structure

### Phase-based Development

CodeAnchor is built in phases:
- **Phase 0:** Technical validation
- **Phase 1:** Foundation & CLI
- **Phase 2:** Detection engine
- **Phase 3:** Git integration
- **Phase 4:** Polish & launch

### Key Components

**CLI Framework (`src/cli/`)**
- Commander.js for command routing
- Inquirer.js for interactive prompts
- Ora for progress indicators
- Chalk for colored output

**Core (`src/core/`)**
- Configuration system with Zod validation
- Tech stack detection
- Cache management

**Analyzers (`src/analyzers/`)**
- ts-morph for TypeScript AST parsing
- Component metadata extraction
- Prop type analysis

**Generators (`src/generators/`)**
- Handlebars template engine
- Markdown generation
- AI integration

**Providers (`src/providers/`)**
- AI provider abstraction
- Claude implementation
- Future: OpenAI, Gemini, Ollama

**Git Integration (`src/git/`)**
- Pre-commit hooks
- Commit message generation
- File staging and tracking

## Adding New Features

### 1. AI Providers

To add a new AI provider:

1. Create `src/providers/your-provider.ts`
2. Implement the `AIProvider` interface
3. Add to provider factory in `src/providers/index.ts`
4. Update CLI provider list in `src/cli/commands/init.ts`
5. Add tests
6. Update documentation

### 2. Project Structures

To add a new project structure type:

1. Add to `configSchema` in `src/core/config-schema.ts`
2. Update `getDefaultPaths` in `src/cli/commands/init.ts`
3. Add detection logic in `src/core/tech-detector.ts`
4. Update documentation

### 3. Commands

To add a new CLI command:

1. Create `src/cli/commands/your-command.ts`
2. Export command function
3. Register in `src/cli/index.ts`
4. Add help text and examples
5. Add tests
6. Update README.md

## Pull Request Process

1. **Ensure tests pass**
   ```bash
   npm test
   npm run build
   ```

2. **Update documentation**
   - Update README.md if needed
   - Add/update inline code documentation
   - Update CHANGELOG.md

3. **Follow commit conventions**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Test additions/changes
   - `chore:` - Maintenance tasks

4. **Create Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots if UI changes
   - Request review from maintainers

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- src/core/config-loader.test.ts
```

### Writing Tests

- Test public APIs, not implementation details
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies (AI APIs, file system)

## Documentation

### Code Documentation

- Add JSDoc comments to public functions and classes
- Explain complex logic with inline comments
- Document function parameters and return types
- Include usage examples for non-obvious APIs

### User Documentation

When adding features, update:
- README.md - Quick start and command reference
- docs/getting-started.md - Step-by-step guides
- docs/user-guide.md - Detailed usage instructions

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v0.2.0 -m "Release v0.2.0"`
4. Push tags: `git push --tags`
5. Publish to npm: `npm publish`

## Questions or Help?

- **Issues:** [GitHub Issues](https://github.com/yourusername/codeanchor/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/codeanchor/discussions)

## License

By contributing to CodeAnchor, you agree that your contributions will be licensed under the MIT License.
