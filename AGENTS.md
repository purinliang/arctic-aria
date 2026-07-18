# Agent Collaboration Guide

This repository may be edited by Codex or other helper agents. Follow these
rules so changes stay easy to review and integrate.

## Purpose

This file defines collaboration rules for agents. Keep it stable and
procedural. Product goals, technical direction, roadmap details, and next-step
planning belong in `README.md` or files under `docs/`.

## Language And Vocabulary

Even when the developer provides requirements in Chinese, use English unless
translation is required to clarify a requirement.

- Write all code, comments, commit messages, documentation, and default
  user-facing app text in English. Localized user-facing strings may use their
  target language inside explicit localization catalogs.
- Write agent responses in English unless translation is needed.
- Use clear, simple English so future documentation is easy for a non-native
  English speaker to edit.
- When the developer asks or comments with numbered points, answer with
  matching numbered points so each response can be checked directly.
- Call the human collaborating with Codex the `developer`. Use `user` for
  Arctic Aria product users unless the current sentence clearly means the
  developer.
- Do not use the developer's real username, display name, email address, or
  other personal identifiers as test data, sample data, logs, documentation
  examples, or placeholders. Use neutral fixtures such as `testusername`,
  `testdisplayname`, and `testpassword`.

## Required Context

Before making code changes, read:

1. `README.md`
   - Understand the product goal and current project status.

2. `docs/architecture.md`
   - Understand feature, app, and infrastructure ownership.

3. `docs/implementation.md`
   - Understand the project structure and technology stack guidelines.

4. `docs/user-story.md`
   - Understand the user requirements.

5. The nearest relevant `AGENTS.md`
   - Follow any module-specific instructions.

For task-specific work, also read the relevant docs only:

- Feature work: `docs/features/<feature>/*` if present
- Web app work: `apps/web/AGENTS.md`, `docs/web/ui.md`, and relevant
  `docs/features/<feature>/ui.md`
- Shared web UI work: `docs/web/*` if present
- Infrastructure work: `docs/infrastructure/*` if present
- Discord integration work: `docs/features/discord/*`

Do not read unrelated docs unless they are needed for the task.

## Instruction Priority

If documents conflict, follow this priority:

1. Developer's current task prompt
2. Nearest `AGENTS.md`
3. Root `AGENTS.md`
4. `docs/user-story.md`
5. `docs/implementation.md`
6. `docs/architecture.md`
7. `README.md`
8. Other docs

If the conflict affects architecture or data model decisions, stop and ask the
developer.

## Change Discipline

- Before implementation, inspect the current branch and working tree state.
- Explain the intended edits before changing files.
- Keep changes small, focused, and reviewable.
- Do not mutate unrelated work.
- Do not overwrite developer changes.
- If existing changes affect the requested task, work with them or ask the
  developer to decide.
- Avoid very long single-file implementations. Keep each source code file no
  longer than 400 lines. Treat 250 lines or less as the preferred target, but
  not a hard limit. When a file approaches the limit, split by responsibility
  before adding more behavior.
- Focus on the task implied by the branch name. For example, do not implement
  application code during documentation-only work on a `docs/*` branch.
- Do not hide unrelated bug fixes inside a broad commit. A branch may group
  several small bugs only when the commits inside the branch remain separately
  reviewable.

## Code Style

- Prefer existing local patterns, frameworks, helper APIs, and source
  organization over new abstractions.
- Use structured APIs or parsers for structured data when the codebase or
  standard toolchain provides them.
- Keep edits scoped to the requested modules, ownership boundaries, and
  behavioral surface.
- Add an abstraction only when it removes real complexity, reduces meaningful
  duplication, or clearly matches an established local pattern.
- Add succinct comments only where the code is not self-explanatory.
- Default to ASCII when editing or creating files. Use non-ASCII only when the
  file or localization catalog clearly requires it.

## Bug Fixing

- When the developer reports a bug, reproduce the reported behavior with a
  focused automated test whenever practical before changing the implementation.
- Think one step beyond the exact report and cover the closest related edge
  case when it is cheap and meaningful.
- Fix the smallest responsible layer, then rerun the focused test that exposed
  the bug and the relevant broader check.
- After the fix, inspect nearby code and migration history for the same class
  of bug before committing.
- If the developer sends a sequence of bug reports before a commit is made, fix
  small independent bugs one by one and commit each coherent fix separately.
  If the bugs clearly share the same cause or must be changed together, one
  shared bug-fix branch is acceptable, but the branch name should describe the
  affected area and each commit title/body must state which reported bugs it
  fixes.

## Refactoring

- Refactor in reviewable cycles. For each focused area, identify the relevant
  existing coverage or add focused coverage first when behavior is not already
  covered.
- Run the focused check before the move when practical, make the smallest
  coherent move, then run the same focused check again.
- Commit each completed refactor area separately before moving to the next
  unrelated area. Avoid accumulating a large mixed refactor diff.
- Keep pure moves, helper extraction, lint-rule changes, and behavior changes
  in separate commits unless they are tightly coupled.
- If a refactor area has no direct automated coverage, say so in the commit or
  final report and use `lint` plus `build` as the minimum safety check.

## Backend Behavior

- Backend validation should normalize form-shaped input before it reaches
  persistence code. Empty optional relation ids must become `null`, not empty
  strings.
- Treat empty strings, `null`, blank-only strings, unsupported characters, and
  malformed identifiers as separate input cases during validation. Trim only
  when the field semantics allow it, and reject unsupported characters with a
  clear message instead of letting the database fail later.
- SQL must stay parameterized. Never build SQL text by concatenating or
  interpolating user-provided values, identifiers, filters, sort keys, or raw
  search text. Whitelist dynamic SQL fragments when a query genuinely needs
  them.
- Backend actions should distinguish expected business failures from database
  or infrastructure defects. Return specific user-facing messages for expected
  validation, ownership, not-found, or constraint cases, and keep database
  defects identifiable instead of collapsing everything into a vague failure.
- For unexpected backend or database errors, prefer structured server logs with
  the feature name, command name, error code, and safe identifiers needed for
  debugging. Do not log secrets, passwords, auth cookies, full database URLs,
  or raw user-authored product content such as project titles, task
  descriptions, routine text, memory text, or idea text.

## Data Integrity

- When adding or changing persistence behavior, inspect the relevant migration
  history and repository tests for nearby constraints, nullable fields, foreign
  keys, and delete/archive behavior.
- Feature overview docs describe hierarchy, ownership, cross-feature
  interaction, dashboard behavior, and code ownership. Feature `data-model.md`
  docs describe persistent entities, schema direction, backend validation, and
  database constraints.
- Use frontend validation for guidance, backend validation for trusted
  user-facing rule checks, and database constraints for final consistency.
- Protect cross-row invariants in the database whenever practical. Use foreign
  keys for ownership and references, unique constraints for uniqueness, check
  constraints for simple allowed values or ranges, and transactions when a
  command changes multiple related rows.
- Do not rely on a preflight read as the only protection for uniqueness or
  references. Concurrent requests must still be safe because the database
  rejects conflicting writes.
- For parent-child product data, prefer archive or soft-delete commands for
  user-visible deletion. If hard delete is required, the default behavior is to
  refuse deleting a non-empty parent unless the feature explicitly documents a
  cascade cleanup.
- Feature `data-model.md` docs must state delete lifecycle behavior explicitly:
  archive, soft delete, hard delete, refused delete, and whether hidden rows
  remain queryable for normal UI.
- Backend actions should translate database constraint failures into clear
  user-facing messages instead of exposing raw database errors or generic
  failures when the cause is known.
- Redis or another cache may help with fast checks later, but it is not the
  source of truth for product integrity. The database remains the final
  consistency boundary.
- Credential behavior must be documented in auth and infrastructure docs. Never
  imply hashed passwords can be decrypted, and never store secrets in product
  tables unless a dedicated secret-storage design exists.

## Web App Work

Web-specific source organization, TypeScript style, UI component rules,
interaction defaults, generated-file rules, and web verification commands live
in `apps/web/AGENTS.md`. Human-facing UI guidance starts at `docs/web/ui.md`, with
detailed shared component rules in `docs/web/ui-components.md`.

## Web Discord Integration Work

- Discord integration work is web app work unless a separate runtime is
  explicitly reintroduced. Discord interaction routes currently live in the web
  app.
- When slash-command metadata changes, update
  `apps/web/src/features/discord/server/commands.ts`, run
  `pnpm --dir apps/web discord:register-commands`, and remind the developer to
  reinstall or re-authorize the user-installed Discord app if new or changed
  commands do not appear.
- Keep the runbook in `docs/features/discord/overview.md` aligned with the
  current web route runtime, command registration, interaction endpoint, ngrok,
  Vercel, and install steps.

## Security And Logging

- Do not commit secrets, auth cookies, database URLs, Discord tokens, personal
  access tokens, ngrok URLs intended to stay private, or local `.env*` files
  unless the developer explicitly asks and the file is already intended for
  tracked examples.
- Do not log passwords, auth cookies, full database URLs, raw product text, or
  the developer's personal identifiers.
- Test fixtures and examples must use neutral data such as `testusername`,
  `testdisplayname`, `testpassword`, `test-project`, and `test-memory`.

## Git Workflow

### Branches

Current Git rules:

- Use branch names without the old `agent/` prefix.
- Use commit titles without the old `(agent)` scope.
- Existing local branches and commits that already use the old style may remain
  unchanged unless the developer explicitly asks to rewrite them.

- `main` is the release and stable branch.
- `develop` is the integration and next-version development branch.
- `feature/*` branches are for new features created from `develop`.
- `fix/*` branches are for normal bug fixes created from `develop`.
- `hotfix/*` branches are for production or release fixes created from
  `main`; later, the fix should be cherry-picked or merged back to `develop`.
- `docs/*` branches are for documentation work.
- `refactor/*` branches are for refactoring work.
- `chore/*` branches are for maintenance work that is not a product feature,
  bug fix, docs-only change, or pure refactor.
- Before implementation, inspect the current branch and working tree state.
- If the developer asks for an unrelated bug fix or chore while another branch
  has active work in progress, do not mix it into the current branch. Stash the
  current work, switch back to `develop`, create a focused `fix/*` or
  `chore/*` branch, fix and commit there, merge that branch back into
  `develop` when the developer has requested that workflow, then return to the
  previous branch and restore the stash. Sync `develop` back into the previous
  branch only when the change is worth carrying forward immediately.
- Agents may commit on work branches when they believe their work is in a
  stable stage.
- Do not commit directly to `main` in any situation. It is protected by GitHub
  branch rules.
- Do not commit directly to `develop` unless the developer explicitly asks.
- Agents may use non-destructive git commands to inspect status, create
  branches, stage files, and commit changes when those actions follow the
  branch and commit rules in this file. Destructive git commands still require
  an explicit developer request.
- Do not delete branches after integration unless the developer asks for branch
  deletion and confirms it.
- When auditing unmerged or stale local branches, do not count `main` or
  `develop` as unmerged work branches. They are trunk branches, not disposable
  work branches.

### Ignored Local Files

- Do not inspect, edit, restore, or report contents from `.vercel/`. It stores
  local Vercel project-link metadata and is intentionally ignored by Git.

### Commits

Use a Git-flow-friendly Conventional Commits style:

```text
type: short summary

- subtask 1
- subtask 2
- subtask 3
```

Common commit types:

- `feat: ...` for feature work.
- `fix: ...` for bug fixes.
- `hotfix: ...` for production or release fixes.
- `docs: ...` for documentation changes.
- `refactor: ...` for refactoring without behavior changes.
- `test: ...` for test-only changes.
- `chore: ...` for maintenance work.

The title should be a short summary of the subtasks. Keep each commit focused
on one to five related subtasks. If a change needs more subtasks than that,
consider splitting it into separate commits.

Do not amend commits automatically. If the developer requests an amend
operation, prefer making a separate commit that shows the diff clearly, then
tell the developer how to squash or reset if they want to combine commits. Only
amend directly when the developer explicitly asks for an amend.

### Integration

- Before merging, state the source branch and target branch explicitly.
- Agents may only merge into `develop`, and only after the developer confirms
  the exact source branch and target branch.
- Agents must never merge into `main`. The developer handles `main`
  integration manually through GitHub pull requests.
- Agents may prepare merge instructions, but should not perform integration
  work unless the developer confirms the exact source and target branches.
- Normal feature integration should merge from a work branch into
  `develop`.
- For hotfixes that branch from `main`, agents may later cherry-pick the hotfix
  commit into `develop` after checking that it also works for the next version.
- Merge commit messages should follow the existing Conventional Commit style,
  such as `feat: merge project management` or
  `docs: merge web documentation`. Prefer `type: merge <feature name>` over
  generic messages such as `merge: <branch name>`.

### Release PRs

- Release PR drafts live in `docs/releases/vX.Y.Z.md`.
- Before creating or editing a release PR, write or update
  `docs/releases/vX.Y.Z.md` first. Copy the release title and release text from
  that file into the GitHub PR and later into the main release commit message.
  The release doc is the source of truth for release wording.
- GitHub release PR bodies should be valid Markdown for reading in GitHub. Use
  a short heading such as `## Release Text`, then paste the release text as
  normal paragraphs. Do not paste the release doc's fenced code block or the
  whole release doc into the PR body.
- Keep release PR text short. Use one release title and one release text block
  from the release doc instead of separate duplicated Summary, Changes,
  Verification, and Notes sections.
- Do not include long routine `Verification` or `Notes` sections in release PR
  text unless the developer explicitly asks or a release-blocking caveat must
  be visible in GitHub.
- When the developer asks an agent to open the GitHub release PR, first push
  `develop`, then create the PR with GitHub CLI from `develop` into `main`.
  Use the release title from the release doc as `--title`. Use only the plain
  paragraphs inside the release doc's `## Release Text` fenced block as the PR
  body. Do not include the `## Release Text` heading, fenced code markers,
  release-file instructions, verification boilerplate, or the whole release
  record file. Prefer `--body` for short release text.
  Example:

  ```bash
  git push origin develop
  gh pr create --base main --head develop --title "Release vX.Y.Z: concise release outcome" --body "Plain release text paragraphs only."
  ```

- Keep the main release merge commit title and body in the release record so
  future release messages stay consistent.
- Release commit bodies should be useful in `git log`, but shorter than older
  large release records when the release is a patch or UI polish release.

## Roadmap Tracking

- Treat `docs/roadmap.md` as the asynchronous ticket system between the
  developer and agents.
- When the developer asks for future work during another task, record the
  follow-up in the roadmap when it is useful, even if that roadmap edit is not
  committed immediately. Then continue the current task unless the developer
  explicitly asks to switch immediately.
- After finishing a branch, inspect the roadmap for relevant new instructions,
  update any touched roadmap item with its current state, and remove or revise
  stale items that are clearly completed or no longer planned.
- For roadmap items that span multiple branches, include concise tracking
  details when useful: created date, last updated date, related commit hash, and
  whether the item is open, in progress, or closed.

## Validation Workflow

### Focused Branch Checks

Use focused checks during normal feature, fix, refactor, and chore branch work.
The goal is to test the changed behavior without spending time on unrelated
full-repo checks after every small edit.

1. Identify the changed area from the branch name and touched paths.
2. Run the nearest automated tests for that area when they exist.
3. If multiple independent areas changed, run each area's focused tests
   separately.
4. If an area has no focused tests, report the gap and run the closest useful
   check, usually `lint` for style-only work or `build` when a shared runtime
   surface changed.
5. For docs-only changes, run at least `git diff --check`.

For the web app, prefer these focused examples:

- Feature code under `apps/web/src/features/<feature>/`:
  `pnpm --dir apps/web exec node --test src/features/<feature>/__tests__/*.test.ts`
- Shared component code under `apps/web/src/components/`:
  `pnpm --dir apps/web exec node --test src/components/__tests__/*.test.ts src/components/forms/__tests__/*.test.ts`
- App shell code under `apps/web/src/app-shell/`:
  `pnpm --dir apps/web exec node --test src/app-shell/__tests__/*.test.ts`
- Database helper code under `apps/web/src/server/database/`:
  `pnpm --dir apps/web exec node --test src/server/database/__tests__/*.test.ts`
- Discord helper code under `apps/web/src/server/discord/` or
  `apps/web/src/features/discord/`:
  `pnpm --dir apps/web exec node --test src/server/discord/__tests__/*.test.ts src/features/discord/__tests__/*.test.ts`

### Full Integration Checks

Run full-level checks before merging an agent branch back into `develop`, when
the developer asks for full validation, or when the focused checks do not cover
the risk of the change.

For the web app, full checks are:

- `git diff --check`
- `pnpm --dir apps/web test`
- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web build`

Also run `pnpm --dir apps/web db:migrate` when migrations, database metadata,
or the migration runner changed, or when the developer asks for migration
verification.

## Work Reports

- Report the focused checks and full checks separately.
- Say clearly when a check was skipped, unavailable, or blocked.
- Include a concise summary of changed files and validation results.
- State the current branch. When relevant, also state whether there are
  unmerged branches or stashed changes.
- Inspect the roadmap for new instructions before finalizing work, update the
  roadmap when the task creates or closes follow-up work, and suggest the next
  useful step based on the roadmap.
