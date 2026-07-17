# Agent Collaboration Guide

This repository may be edited by Codex or other helper agents. Follow these
rules so changes stay easy to review and integrate.

## Language

Even when the user provides requirements in Chinese, use English unless
translation is required to clarify a requirement.

- Write all code, comments, commit messages, documentation, and default
  user-facing app text in English. Localized user-facing strings may use their
  target language inside explicit localization catalogs.
- Write agent responses in English unless translation is needed.
- Use clear, simple English so future documentation is easy for a non-native
  English speaker to edit.
- When the user asks or comments with numbered points, answer with matching
  numbered points so each response can be checked directly.
- Call the human collaborating with Codex the `developer`. Use `user` for
  Arctic Aria product users unless the current sentence clearly means the
  developer.
- Do not use the developer's real username, display name, email address, or
  other personal identifiers as test data, sample data, logs, documentation
  examples, or placeholders. Use neutral fixtures such as `testusername`,
  `testdisplayname`, and `testpassword`.

- Call the human collaborating with Codex the `developer`. Use `user` for
  Arctic Aria product users unless the current sentence clearly means the
  developer.

## Context

Before making code changes, read:

1. `README.md`
   - Understand the product goal and current project status.

2. `docs/architecture.md`
   - Understand feature, plugin, app, and infrastructure ownership.

3. `docs/implementation.md`
   - Understand the project structure and technology stack guidelines.

4. `docs/user-story.md`
   - Understand the user requirements.

5. The nearest relevant `AGENTS.md`
   - Follow any module-specific instructions.

For task-specific work, also read the relevant docs only:

- Feature work: `docs/features/<feature>/*` if present
- Web app work: `apps/web/AGENTS.md`, `docs/ui.md`, and relevant
  `docs/features/<feature>/ui.md`
- Shared web UI work: `docs/web/*` if present
- Infrastructure work: `docs/infrastructure/*` if present
- App-specific work: `docs/apps/*` if present

Do not read unrelated docs unless they are needed for the task.

### Instruction Priority

If documents conflict, follow this priority:

1. User's current task prompt
2. Nearest `AGENTS.md`
3. Root `AGENTS.md`
4. `docs/user-story.md`
5. `docs/implementation.md`
6. `docs/architecture.md`
7. `README.md`
8. Other docs

If the conflict affects architecture or data model decisions, stop and ask the
user.

## Change Discipline

- Before implementation, inspect the current branch and working tree state.
- Explain the intended edits before changing files.
- Keep changes small, focused, and reviewable.
- Do not mutate unrelated work.
- Do not overwrite user changes.
- If existing changes affect the requested task, work with them or ask the user
  to decide.
- Avoid very long single-file implementations. Keep each source code file no
  longer than 400 lines. Treat 250 lines or less as the preferred target, but
  not a hard limit. When a file approaches the limit, split by responsibility
  before adding more behavior.
- Focus on the task implied by the branch name. For example, do not implement
  application code during documentation-only work on an `agent/docs-*` branch.
- If the user asks for an unrelated bug fix or chore while another branch has
  active work in progress, do not mix it into the current branch. Stash the
  current work, switch back to `develop`, create a focused `agent/fix-*` or
  `agent/chore-*` branch, fix and commit there, merge that branch back into
  `develop` when the user has requested that workflow, then return to the
  previous branch and restore the stash. Sync `develop` back into the previous
  branch only when the change is worth carrying forward immediately.
- If the user sends a sequence of bug reports before a commit is made, fix small
  independent bugs one by one and commit each coherent fix separately. If the
  bugs clearly share the same cause or must be changed together, one shared bug
  fix branch is acceptable, but the branch name should describe the affected
  area and each commit title/body must state which reported bug or bugs it fixes.
- Do not hide unrelated bug fixes inside a broad commit. A branch may group
  several small bugs only when the commits inside the branch remain separately
  reviewable.

## Generated Files

- Do not inspect, edit, restore, or report contents from `.vercel/`. It stores
  local Vercel project-link metadata and is intentionally ignored by Git.

## Refactor Discipline

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

## Bug Fix Discipline

- When the user reports a bug, reproduce the reported behavior with a focused
  automated test whenever practical before changing the implementation.
- Think one step beyond the exact report and cover the closest related edge
  case when it is cheap and meaningful.
- Fix the smallest responsible layer, then rerun the focused test that exposed
  the bug and the relevant broader check.
- After the fix, inspect nearby code and migration history for the same class
  of bug before committing.

## Backend Development Discipline

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
  debugging. Do not log secrets, passwords, auth cookies, full database URLs, or
  raw user-authored product content such as project titles, task descriptions,
  routine text, memory text, or idea text.
- When adding or changing persistence behavior, inspect the relevant migration
  history and repository tests for nearby constraints, nullable fields, foreign
  keys, and delete/archive behavior.

## Data Integrity Discipline

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
in `apps/web/AGENTS.md`. Human-facing UI guidance starts at `docs/ui.md`, with
detailed shared component rules in `docs/web/ui-components.md`.

## Discord Bot Work

- When slash-command metadata changes, update
  `apps/web/src/features/discord/server/commands.ts`, run
  `pnpm --dir apps/web discord:register-commands`, and remind the developer to
  reinstall or re-authorize the user-installed Discord app if new or changed
  commands do not appear.
- Keep the local runbook in `docs/apps/discord-bot/overview.md` aligned with
  the current web route runtime, command registration, interaction endpoint,
  ngrok, Vercel, and install steps.

## Branches

- `main` is the release and stable branch.
- `develop` is the integration and next-version development branch.
- `agent/feat-*` branches are for new features created from `develop`.
- `agent/fix-*` branches are for normal bug fixes created from `develop`.
- `agent/hotfix-*` branches are for production or release fixes created from
  `main`; later, the fix should be cherry-picked or merged back to `develop`.
- `agent/docs-*` branches are for documentation work.
- `agent/refactor-*` branches are for refactoring work.

Agents may commit on `agent/*` branches when they believe their work is in a
stable stage.

Do not commit directly to `main` in any situation. It is protected by GitHub
branch rules. Do not commit directly to `develop` unless the user explicitly
asks.

Agents may use non-destructive git commands to inspect status, create branches,
stage files, and commit changes when those actions follow the branch and commit
rules in this file. Destructive git commands still require an explicit user
request.

## Integration

- Before merging, state the source branch and target branch explicitly.
- Agents may only merge into `develop`, and only after the user confirms the
  exact source branch and target branch.
- Agents must never merge into `main`. The user handles `main` integration
  manually through GitHub pull requests.
- Agents may prepare merge instructions, but should not perform integration work
  unless the user confirms the exact source and target branches.
- Normal feature integration should merge from an `agent/*` branch into
  `develop`.
- For hotfixes that branch from `main`, agents may later cherry-pick the hotfix
  commit into `develop` after checking that it also works for the next version.
- Do not delete branches after integration unless the user asks for branch
  deletion and confirms it.
- Merge commit messages should follow the existing Conventional Commit style,
  such as `feat(agent): merge project management` or
  `docs(agent): merge web documentation`. Prefer
  `type(agent): merge <feature name>` over generic messages such as
  `merge: <branch name>`.

## Release Preparation

- Release PR drafts live in `docs/releases/vX.Y.Z.md`.
- Before creating or editing a release PR, write or update
  `docs/releases/vX.Y.Z.md` first. Copy the release title and release text from
  that file into the GitHub PR and later into the main release commit message.
  The release doc is the source of truth for release wording.
- GitHub release PR bodies should be valid Markdown for reading in GitHub. Use
  a short heading such as `## Release Text`, then paste the release text as
  normal paragraphs. Do not paste the release doc's fenced code block or the
  whole release doc into the PR body.
- From `v0.7.0` onward, keep release PR text short. Use one release title and
  one release text block from the release doc instead of separate duplicated
  Summary, Changes, Verification, and Notes sections.
- Do not include long routine `Verification` or `Notes` sections in release PR
  text unless the developer explicitly asks or a release-blocking caveat must
  be visible in GitHub.
- Keep the main release merge commit title and body in the release record so
  future release messages stay consistent.
- Release commit bodies should be useful in `git log`, but shorter than older
  large release records when the release is a patch or UI polish release.

## Commits

Use a Git-flow-friendly Conventional Commits style:

```text
type(agent): short summary

- subtask 1
- subtask 2
- subtask 3
```

Common commit types:

- `feat(agent): ...` for feature work.
- `fix(agent): ...` for bug fixes.
- `hotfix(agent): ...` for production or release fixes.
- `docs(agent): ...` for documentation changes.
- `refactor(agent): ...` for refactoring without behavior changes.
- `test(agent): ...` for test-only changes.
- `chore(agent): ...` for maintenance work.

The title should be a short summary of the subtasks. Keep each commit focused
on one to five related subtasks. If a change needs more subtasks than that,
consider splitting it into separate commits.

Do not amend commits automatically. If the user requests an amend operation,
prefer making a separate commit that shows the diff clearly, then tell the user
how to squash or reset if they want to combine commits. Only amend directly when
the user explicitly asks for an amend.

## Verification

- Run relevant tests or checks when they exist.
- For documentation changes, at minimum run `git diff --check`.
- Report any checks that could not be run.
- Include a concise summary of changed files and verification results.

## Repository Purpose

This file defines collaboration rules for agents. It should stay stable and
procedural. Product goals, technical direction, roadmap details, and next-step
planning should live in `README.md` or future files under `docs/`.
