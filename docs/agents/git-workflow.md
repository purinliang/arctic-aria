# Agent Git Workflow

Read this guide before branch, commit, integration, or release work. The root
`AGENTS.md` still applies.

## Branches And Commits

- Use branch names without the old `agent/` prefix and commit titles without
  the old `(agent)` scope. Existing historical names need no rewrite unless the
  developer explicitly asks.
- `main` is stable and protected; `develop` is the integration branch. Start
  `feature/*`, `fix/*`, `refactor/*`, `chore/*`, and `docs/*` from `develop`.
  Start production `hotfix/*` branches from `main`.
- Inspect the branch and working tree before implementation. For related
  follow-up fixes, keep using the same work branch and make focused commits.
- For an unrelated request during active branch work, stash the current work,
  create an appropriate branch from `develop`, complete it, and return to the
  earlier branch. Carry the change forward only when it is needed there.
- Agents may commit stable work on work branches. Never commit directly to
  `main`, or to `develop` without an explicit developer request.
- Do not delete branches after integration without a developer request and
  confirmation. Do not count `main` or `develop` as unmerged work branches.
- Never inspect, edit, restore, or report contents from ignored `.vercel/`.

Use Git-flow-friendly Conventional Commits:

```text
type: short summary

- subtask 1
- subtask 2
```

Use `feat`, `fix`, `hotfix`, `docs`, `refactor`, `test`, or `chore` as applicable.
Keep a commit focused on one to five related subtasks. Do not amend commits
automatically; even when asked to amend, prefer a separate reviewable commit
unless the developer explicitly requires the amend operation.

## Concurrent Agent Work

- Give each agent a separate branch and worktree for simultaneous edits. State
  its owned paths and expected output before it starts. Do not let two agents
  write the same file at the same time.
- At handoff, inspect `git status --short --branch`, the diff, and the branch
  commit list. Recheck the target branch immediately before integration.
- Integrate one completed branch at a time and run the required validation on
  the resulting tree. Resolve conflicts with the current source of truth;
  never discard another agent's edits to make a merge pass.
- Database writes require database-level constraints or transactions. Separate
  worktrees do not prevent simultaneous requests from racing in production.

## Integration

- State the source and target branches explicitly before merging. Agents may
  merge only into `develop`, and only after the developer confirms that exact
  pair. The root guide's completed sub-agent branch exception still applies.
- Never merge into `main`; the developer handles that through GitHub PRs.
- Normal feature branches merge into `develop`. A `main` hotfix may later be
  cherry-picked or merged back after checking it works for the next version.
- Use a Conventional Commit merge message such as `feat: merge project
  management`, not a generic branch-name message.

## Release PRs

- Every hotfix PR into `main` must target the next patch version of the current
  main release, such as `v0.15.0` to `v0.15.1`. Verify the Git-derived app
  metadata reports that target before pushing; the package version is not the
  release version.
- Hotfix PRs require `docs/releases/vX.Y.Z.md` and use
  `Hotfix vX.Y.Z: concise release outcome` for the PR and main release commit
  title. Normal releases from `develop` use `Release vX.Y.Z: ...`. Version
  detection must recognize both title forms.
- Push hotfix branches with `main` as the PR base, then carry the merged hotfix
  back to `develop` through the integration workflow.
- Derive versions from the newest release in the branch ancestry. An older
  release tag must not override a newer release commit, and the hotfix patch
  target must remain separate from the next minor version on `develop`.
- Prepare `docs/releases/vX.Y.Z.md` before creating or editing a release PR.
  It is the source of truth for the PR title, PR text, and later main release
  commit message.
- Use a short `## Release Text` heading and plain paragraphs in the GitHub PR.
  Do not paste the release doc fence or duplicate Summary, Changes,
  Verification, and Notes sections. Include a release-blocking caveat only
  when necessary.
- When asked to open a release PR, push `develop` first, then create the PR
  from `develop` into `main` using the release doc's title and plain text.
- Before pushing `develop` automatically or creating/editing a release PR,
  refresh `main` if its last confirmed sync was more than 12 hours ago:
  `git fetch origin main`, `git switch main`, `git pull --ff-only origin main`,
  then return to the work branch. Ask before merging or rebasing diverged
  `main` and `develop`.
- Keep the main release merge commit title and body in the release record.
  Short patch releases need a concise body.

## Roadmap

- Use `docs/roadmap.md` as the asynchronous ticket system. Record useful
  future requests during another task, then continue that task unless the
  developer switches scope.
- After a branch, inspect the roadmap for new instructions; update touched
  items and remove clearly stale or completed entries.
- For work spanning branches, record the date, latest update, related commit,
  and open/in-progress/closed state where useful.
