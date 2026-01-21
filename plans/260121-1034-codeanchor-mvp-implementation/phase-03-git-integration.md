# Phase 3: Git Integration

> **Priority:** P0 - Critical
> **Duration:** Week 3-4 (10 days)
> **Status:** ✅ COMPLETE
> **Completion Date:** 2026-01-21
> **Dependencies:** Phase 2 complete

## Overview

Seamless git workflow: pre-commit hook (<2s), manual AI enrichment, FLOW.md approval workflow, and commit message generation.

**Goal:** Developer commits → docs synced (<2s) → no AI blocking

## Key Components

1. **Pre-commit Hook** - Fast sync (template-only)
2. **Enrich Command** - Manual AI enhancement
3. **Flow Approve** - FLOW.md draft approval
4. **Commit Message** - AI-generated semantic messages

## Implementation Steps

### Step 1: Pre-commit Hook (Day 1-3)
```bash
# .git/hooks/pre-commit
#!/bin/sh
anchor sync --fast --staged
exit 0  # Never block commit
```

```typescript
// src/git/pre-commit-handler.ts
class PreCommitHandler {
  async run() {
    const staged = await git.getStagedFiles();
    const filtered = staged.filter(f => matchesPatterns(f));

    for (const file of filtered) {
      const meta = await analyzer.analyze(file);
      const doc = generator.generateTemplate(meta);
      await fs.writeFile(getDocPath(file), doc);
      await git.add(getDocPath(file));
    }

    await this.markPendingEnrichment(filtered);
  }
}
```

### Step 2: Enrich Command (Day 4-5)
```typescript
// src/cli/commands/enrich.ts
async function enrichCommand(options: { watch?: boolean }) {
  const pending = await db.getPendingEnrichments();

  console.log(`📝 Enriching ${pending.length} components...`);

  for (const component of pending) {
    const enhanced = await aiProvider.generateDescription(component);
    await mergeEnhancement(component.path, enhanced);
    console.log(`  ✓ ${component.name}`);
  }

  if (options.watch) {
    console.log('👁️  Watching... (Ctrl+C to stop)');
    await watchForChanges();
  }
}
```

### Step 3: FLOW Approve Workflow (Day 6-7)
```typescript
// src/cli/commands/flow-approve.ts
async function flowApproveCommand(featurePath: string) {
  const draftPath = `${featurePath}/FLOW.draft.md`;
  const finalPath = `${featurePath}/FLOW.md`;

  // Show diff
  const diff = await generateDiff(finalPath, draftPath);
  console.log('\n📋 Flow Changes:\n');
  console.log(diff);

  // Require approval
  const approved = await inquirer.confirm({
    message: 'Approve and commit FLOW.md?',
    default: false
  });

  if (approved) {
    await fs.copy(finalPath, `${finalPath}.backup`);
    await fs.rename(draftPath, finalPath);
    await git.add(finalPath);
    await logApproval(featurePath);
  }
}
```

### Step 4: Commit Message Gen (Day 8-9)
```typescript
// src/git/commit-message-generator.ts
class CommitMessageGenerator {
  async generate(): Promise<string> {
    const diff = await git.getDiff();
    const files = await git.getStagedFiles();

    return await aiProvider.generateCommitMessage(diff, files);
  }
}
```

### Step 5: Hook Installer (Day 10)
```typescript
// src/git/hooks-installer.ts
class HooksInstaller {
  async install() {
    const hookPath = '.git/hooks/pre-commit';
    await fs.writeFile(hookPath, PRE_COMMIT_SCRIPT);
    await fs.chmod(hookPath, 0o755);
  }
}
```

## Success Criteria

- ✅ Pre-commit completes <2s (template-only mode)
- ✅ Docs always synced after commit
- ✅ `anchor enrich` works correctly
- ⏭️ FLOW approval workflow (deferred to post-MVP)
- ✅ Commit messages semantic & accurate

## Implementation Summary

**Completed:**
- Git utilities module with all necessary operations
- Pre-commit handler with cache-aware template-only sync
- Hooks installer with backup/restore capability
- `anchor enrich` command for manual AI enhancement
- `anchor commit` command for AI-generated commit messages
- Git hooks installation prompt in init wizard

**Deferred:**
- FLOW.md approval workflow (not in MVP scope)

## Related Files

**Create:**
- `src/git/pre-commit-handler.ts`
- `src/git/commit-message-generator.ts`
- `src/git/hooks-installer.ts`
- `src/git/diff-parser.ts`
- `src/cli/commands/enrich.ts`
- `src/cli/commands/flow-approve.ts`
- `src/cli/commands/commit.ts`

---

**Next:** Phase 4 - Polish & Launch
