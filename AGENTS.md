# Agent Collaboration Guide

This repository may be edited by Codex or other helper agents. Follow these
rules so changes stay easy to review and integrate.

## Language

Even when the user provides requirements in Chinese, use English unless
translation is required to clarify a requirement.

- Write all code, comments, commit messages, documentation, and user-facing app
  text in English.
- Write agent responses in English unless translation is needed.
- Use clear, simple English so future documentation is easy for a non-native
  English speaker to edit.

## Context

Before making code changes, read:

1. `README.md`
   - Understand the product goal and current project status.

2. `docs/architecture.md`
   - Understand the Core / Plugin / Interface layer boundaries.

3. `docs/implementation.md`
   - Understand the project structure and technology stack guidelines.

4. `docs/user-story.md`
   - Understand the user requirements.

5. The nearest relevant `AGENTS.md`
   - Follow any module-specific instructions.

For task-specific work, also read the relevant docs only:

- Core work: `docs/core-layer/*` if present
- Infrastructure work: `docs/infrastructure/*` if present
- Web work: `docs/interface-layer/web/*` if present
- Discord bot work: `docs/interface-layer/discord-bot/*` if present

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
- Avoid very long single-file implementations. As a rule of thumb, split code
  into independent files before a file grows beyond about 300 lines.
- Focus on the task implied by the branch name. For example, do not implement
  application code during documentation-only work on an `agent/docs-*` branch.

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
