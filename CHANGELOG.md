# Changelog

All notable changes to CodeAnchor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-21

### Added

**Phase 0: Technical Validation**
- ts-morph validation suite with 14 tests (100% must-pass criteria met)
- Performance benchmarking (4-13ms per component, avg 40MB memory)
- Dependency-aware cache implementation (80% hit rate)
- Technical validation report and GO decision

**Phase 1: Foundation**
- CLI framework with Commander.js
- Interactive setup wizard with Inquirer.js
- Configuration system with Zod validation
- Tech stack auto-detection from package.json
- AI provider abstraction (Claude implementation)
- Template engine with Handlebars
- `anchor init` command for project setup
- Support for multiple project structures (Atomic, Feature-based, Modular, Custom)

**Phase 2: Detection Engine**
- ComponentAnalyzer with ts-morph integration
- Complete prop extraction (name, type, required, JSDoc)
- Dependency tracking (1-level imports)
- DocGenerator with template system
- `anchor sync` command with --fast and --force options
- `anchor watch` command with file monitoring
- Cache-aware synchronization (80% hit rate)
- Template-only mode for speed

**Phase 3: Git Integration**
- Git utilities module with operation wrappers
- Pre-commit handler with template-only sync (<2s target)
- Hooks installer with backup/restore capability
- `anchor enrich` command for manual AI enhancement
- `anchor commit` command for AI-generated commit messages
- Optional git hooks installation in init wizard
- Never blocks git workflow

**Phase 4: Polish & Launch**
- Comprehensive README.md with examples
- MIT LICENSE file
- CONTRIBUTING.md guide for contributors
- Getting Started guide (docs/getting-started.md)
- Enhanced CLI help text with examples
- .npmignore for package distribution
- Updated package.json metadata
- This CHANGELOG.md

### Features

- 🚀 Fast component documentation generation
- 🤖 AI-powered descriptions using Claude
- 📝 Automatic TypeScript prop analysis
- 🔄 Git workflow integration
- ⚡ Smart caching with dependency tracking
- 🎯 Template-first approach (works without AI)
- 📦 Support for React, Vue, Svelte projects
- 🔍 Atomic Design, Feature-based, and Modular structures

### Technical

- Node.js >= 20.0.0 required
- TypeScript support with ts-morph AST parsing
- ESM modules
- Commander.js CLI framework
- Zod configuration validation
- Handlebars template engine
- Chokidar file watching
- Vitest testing framework

### Testing

- 25/25 tests passing
- Unit tests for core functionality
- Validation tests for technical assumptions
- TypeScript compilation successful

### Performance

- Component analysis: 4-13ms per component
- Pre-commit hook: <2s (template-only mode)
- Cache hit rate: 80%
- Memory usage: ~40MB for 100 components

### Documentation

- README.md - Quick start and commands
- docs/getting-started.md - Step-by-step setup guide
- CONTRIBUTING.md - Development guidelines
- LICENSE - MIT license
- CHANGELOG.md - Version history

### Known Limitations

- Single-repo support only (monorepo support planned for future)
- Claude is the only AI provider (OpenAI, Gemini, Ollama coming soon)
- FLOW.md approval workflow deferred to post-MVP
- English language only (i18n planned for future)

## [0.0.0] - 2026-01-21

### Validation

- Phase 0 technical validation complete
- All 14 validation tests passed
- GO decision for Phase 1-4 implementation

---

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG.md with new version
3. Commit changes: `git commit -m "chore: release v0.x.x"`
4. Create git tag: `git tag -a v0.x.x -m "Release v0.x.x"`
5. Push commits and tags: `git push && git push --tags`
6. Publish to npm: `npm publish`

## Future Versions

### [0.2.0] - Planned

- OpenAI provider support
- Google Gemini provider support
- Ollama local provider support
- FLOW.md approval workflow
- Internationalization (i18n)

### [0.3.0] - Planned

- Monorepo support
- VS Code extension
- Enhanced caching strategies
- Custom template support

### [1.0.0] - Planned

- Stable API
- Production-ready
- Full test coverage
- Comprehensive documentation
- Community feedback incorporated

---

[Unreleased]: https://github.com/yourusername/codeanchor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/codeanchor/releases/tag/v0.1.0
[0.0.0]: https://github.com/yourusername/codeanchor/commits/main
