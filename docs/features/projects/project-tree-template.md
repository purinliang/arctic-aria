# Project Tree Template Plan

This document records the reviewed plan for the first user-facing project tree
template workflow. It is an implementation checklist, not released behavior
yet.

## Summary

Add a public Project Tree Template workflow for project-level editing only. The
normal Project edit dialog stays focused on project metadata. A header
ellipsis menu opens a separate wide template dialog where the user can copy a
Markdown template with embedded LLM instructions, paste the filled template
back, parse it, review a human summary, and apply the changes to the current
project tree.

## Key Decisions

- V1 supports Project tree templates only.
- Milestone, task, routine, and event standalone templates are out of scope.
- The template uses Markdown as the user-facing format.
- The template includes the prompt/instructions; there is no separate Copy
  Prompt action.
- The preview is a human summary, not JSON.
- The workflow is available to normal signed-in users, not only developer mode.
- Existing developer import APIs and UI are removed instead of kept as hidden
  long-term import behavior.

## Template Model

- Root project row uses `op: update`.
- Root project row requires `project_id`, and it must match the current
  project.
- Milestone rows use `milestone_id`.
- Task rows use `task_id`.
- Child rows use `op: create`, `op: update`, or `op: delete`.
- `create` rows must omit the id or leave it empty.
- `update` and `delete` rows require the matching existing id.
- Task placement is defined by nesting: top-level task sections stay without a
  milestone; tasks nested under a milestone belong to that milestone.
- Moving a task is allowed only within the current project by placing its
  existing `task_id` under a different valid milestone section or the top-level
  task section.
- Omitted milestones and tasks are preserved.
- Explicit `delete` performs existing soft-delete behavior.
- Deleting a milestone follows current product behavior: soft-delete the
  milestone and detach visible tasks unless those tasks are explicitly deleted.

## Implementation Notes

- Create the work on `feature/project-tree-template`.
- Add a header action slot to `CrudEditorDialog`, with the ellipsis button left
  of the close button.
- In Project edit mode, the ellipsis menu contains Template and Delete.
- Keep the bottom Project edit action row as Save only.
- Add authenticated project server actions for parsing and applying project
  tree templates.
- Use current project, milestone, and task validation helpers for all field
  validation.
- Add ownership checks for every non-empty project, milestone, and task id.
- Apply tree changes in one database transaction.
- Refresh Projects dashboard data after a successful apply.

## Test Plan

- Parser tests cover valid export parse, mismatched root `project_id`, invalid
  `op`, create rows with ids, update/delete rows without ids, invalid fields,
  and top-level versus milestone task placement.
- Service/action tests cover update, create, delete, omitted-row preservation,
  ownership rejection, cross-project rejection, and same-project task moves.
- UI tests cover the Project edit ellipsis menu, Template dialog open/copy,
  parse preview, apply refresh, and Delete confirmation from the menu.
- Run focused project tests plus `git diff --check`, `pnpm --dir apps/web test`,
  `pnpm --dir apps/web lint`, and `pnpm --dir apps/web build`.
