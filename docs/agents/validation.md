# Agent Validation Guide

Read this guide before choosing checks or reporting a completed change. The
root `AGENTS.md` still applies.

## Focused Branch Checks

During branch work, test the changed behavior without running unrelated
full-repository checks after every edit:

1. Identify the changed area from the branch name and touched paths.
2. Run the nearest automated tests when they exist.
3. Run each area's focused tests separately if multiple areas changed.
4. If no focused tests exist, report the gap and run the closest useful check,
   usually lint for style or build for a shared runtime surface.
5. For docs-only changes, run at least `git diff --check`.

Web examples:

```bash
pnpm --dir apps/web exec node --test src/features/<feature>/__tests__/*.test.ts
pnpm --dir apps/web exec node --test src/components/__tests__/*.test.ts src/components/forms/__tests__/*.test.ts
pnpm --dir apps/web exec node --test src/app-shell/__tests__/*.test.ts
pnpm --dir apps/web exec node --test src/server/database/__tests__/*.test.ts
pnpm --dir apps/web exec node --test src/server/discord/__tests__/*.test.ts src/features/discord/__tests__/*.test.ts
```

## Full Integration Checks

Run full checks before merging a branch into `develop`, when the developer asks
for full validation, or when focused checks do not cover the change's risk:

```bash
./scripts/verify-web.sh
```

The script runs `git diff --check`, web tests, web lint, and the production web
build in that order. It does not run migrations or deploy. Also run
`pnpm --dir apps/web database:migrate` when migrations, database metadata, or
the migration runner changed, or when requested. Choose the intended database
before running that command.

## Reports

- Report focused checks and full checks separately; name skipped, unavailable,
  or blocked checks.
- Summarize changed files, validation, and the current branch. When relevant,
  report unmerged branches or stashed changes.
- Inspect the roadmap before finalizing; update it when the task opens or closes
  follow-up work and suggest the next useful step.
