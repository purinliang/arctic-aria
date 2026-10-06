# Agent Collaboration Guide

This repository may be edited by Codex or other helper agents. Keep changes
easy to review and integrate. This file is the entry point; detailed rules live
in `docs/agents/`. Product direction belongs in `README.md` and `docs/`.

## Language And Vocabulary

- Use English for code, comments, commit messages, documentation, default app
  text, and agent responses unless translation clarifies a requirement.
  Localized text belongs in explicit message catalogs.
- Use simple English. Answer numbered developer points with matching numbers.
- Call the human collaborator the `developer`; use `user` for product users.
- Never use the developer's personal identifiers in fixtures, samples, logs,
  docs, or placeholders. Use neutral fixtures such as `testusername`.

## Required Context

Before changing code, read `README.md`, `docs/architecture.md`,
`docs/implementation.md`, `docs/user-story.md`, and the nearest `AGENTS.md`.
Read only the task-specific docs that apply:

- Feature: `docs/features/<feature>/*` if present.
- Web UI: `apps/web/AGENTS.md`, `docs/web/ui.md`, and relevant feature UI docs;
  for shared UI, relevant `docs/web/*`.
- Infrastructure: relevant `docs/infrastructure/*`.
- Discord integration: `docs/features/discord/*`.
- Persistence, validation, or migrations: `docs/agents/data-integrity.md`.
- Branch, commit, integration, or release work: `docs/agents/git-workflow.md`.
- Choosing checks or reporting work: `docs/agents/validation.md`.

If instructions conflict, use this priority: current developer task, nearest
`AGENTS.md`, root `AGENTS.md`, `docs/user-story.md`,
`docs/implementation.md`, `docs/architecture.md`, `README.md`, then other
docs. If a conflict affects architecture or data model, ask the developer.

## Change Discipline

- Inspect the current branch and working tree before implementation. Explain
  intended edits before changing files. Keep changes small and reviewable.
- Never mutate unrelated work or overwrite developer changes. If those changes
  affect the task, work with them or ask the developer to decide.
- Prefer existing patterns and structured APIs. Keep edits within the owning
  module and add abstractions only when they remove meaningful complexity.
- Keep source files at most 400 lines; prefer 250 or fewer. Split by
  responsibility before adding behavior to a file near the limit.
- Follow the branch's task. Keep unrelated bug fixes in separate commits.
- Default to ASCII except where a file or localization catalog needs Unicode.
  Comment only where the code is not self-explanatory.

## Sub-Agent Workflow

- Spawn sub-agents only when asked or when tooling explicitly allows them.
  Use `gpt-5.3-codex-spark` by default unless a stronger model is needed.
- Give each agent a narrow task and explicit file ownership. Tell it to read
  `README.md`, root `AGENTS.md`, and the nearest `AGENTS.md` before editing,
  and never to revert unrelated changes.
- Agents may create focused branches and commit there. Before integration,
  run the checks in `docs/agents/validation.md`, including full checks before
  a merge into `develop` unless the developer limits validation.
- A parent agent may merge a completed developer-requested sub-agent branch
  into `develop` automatically when scope is focused, checks passed, the
  worktree is clean, and the target is not `main`. If scope, validation, or
  conflicts are unclear, report the branch, commit, and blocker instead.
- For simultaneous work, follow `docs/agents/git-workflow.md`'s concurrent
  agent protocol.

## Bug Fixing And Refactoring

- Reproduce a reported bug with a focused automated test when practical.
  Cover the closest related edge case when cheap and meaningful. Fix the
  smallest responsible layer, rerun the focused test and broader check, and
  inspect nearby code and migrations for the same class of bug.
- If several independent bugs arrive before a commit, fix and commit each
  separately. A shared branch is fine for one underlying cause; commit titles
  and bodies should identify which reported bugs they fix.
- Refactor in reviewable cycles. Identify existing coverage or add focused
  coverage first, run it before and after the move when practical, and commit
  each completed area separately. Separate pure moves, helper extraction,
  lint changes, and behavior changes unless tightly coupled.
- When direct automated coverage is absent, state that in the commit or final
  report and run lint plus build as the minimum safety check.

## Web And Security

- Follow `apps/web/AGENTS.md` for web source organization, TypeScript, UI,
  localization, generated files, and interaction rules. Human-facing UI
  guidance starts in `docs/web/ui.md`.
- Discord integration is web app work. When slash-command metadata changes,
  update `apps/web/src/features/discord/server/commands.ts`, run
  `pnpm --dir apps/web discord:sync-commands` against the intended app, and
  remind the developer to reinstall or re-authorize if commands are missing.
  Keep `docs/features/discord/overview.md` aligned with current routes and
  deployment steps.
- Never commit secrets, auth cookies, database URLs, Discord tokens, personal
  access tokens, private ngrok URLs, or local `.env*` files unless explicitly
  requested and the file is intended as a tracked example.
- Never log passwords, auth cookies, full database URLs, raw product text, or
  developer identifiers. Use neutral test fixtures.

## Git And Validation

- Follow `docs/agents/git-workflow.md` for branches, commits, concurrent work,
  integration, release PRs, and roadmap tracking.
- Follow `docs/agents/validation.md` for focused and full checks and reports.
- Use `./scripts/verify-web.sh` for the repeatable full web gate. Run database
  migrations only when the validation guide calls for them and against the
  intended database.
