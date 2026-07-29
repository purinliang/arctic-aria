# Project Template Plan

This document records the reviewed plan for the first user-facing project tree
template workflow. It is an implementation checklist, not released behavior
yet.

## Summary

Add a public Project Template workflow for project-level create and edit.
The normal Project editor stays focused on project metadata. A header ellipsis
menu opens a separate wide Project Template dialog where the user can copy a
Markdown template with embedded LLM instructions, paste the filled template
back, parse it, review a human summary, and save the create/update to the
project tree.

## Key Decisions

- V1 supports Project tree templates only.
- Project add and edit dialogs both expose the template action.
- Milestone, task, routine, and event standalone templates are out of scope.
- The template uses Markdown as the user-facing format.
- The template includes the prompt/instructions; there is no separate Copy
  Prompt action.
- The preview is a human summary, not JSON.
- The template dialog uses tabs: Template input and Preview are not shown at
  the same time.
- Template and Preview tab bodies use fixed-height internal scrolling.
- The Preview tab is disabled until the current template has parsed.
- The Template tab has Copy and primary Preview actions. Save is shown only on the
  Preview tab.
- Preview rows render as `Project: title`, `Milestone: title`, and `Task: title`
  with fixed-width indentation for tree depth and truncated titles.
- Preview rows use full-word operation chips. Existing update rows whose editable
  fields match the stored item are shown as neutral `Preserve` rows.
- Unsupported extra fields are ignored, counted, and reported after parse.
- The workflow is available to normal signed-in users, not only developer mode.
- Existing developer import APIs and UI are removed instead of kept as hidden
  long-term import behavior.

## Template Model

- In add mode, the root project row uses `op: create`, leaves `project_id`
  empty, and all milestone/task rows must use `op: create` with empty ids.
- In edit mode, the root project row uses `op: update`, requires `project_id`,
  and it must match the current project.
- Milestone rows use `milestone_id`.
- Task rows use `task_id`.
- Generated template fields are ordered as id, `op`, then the fields in the
  matching input dialog order.
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
- Deleting a milestone soft-deletes its visible tasks.

## Implementation Notes

- Create the work on `feature/project-tree-template`.
- Add a header action slot to `CrudEditorDialog`, with the ellipsis button left
  of the close button.
- In Project edit mode, the ellipsis menu contains Template and Delete.
- In Project add mode, the ellipsis menu contains Template.
- Keep the bottom Project edit action row as Save only.
- Add authenticated project server actions for parsing and saving project
  tree templates.
- Use current project, milestone, and task validation helpers for all field
  validation.
- Add ownership checks for every non-empty project, milestone, and task id.
- Parse add-mode templates without generating persistent ids. Generate ids only
  in the save write path.
- Save tree changes in one guarded database statement.
- Refresh Projects dashboard data after a successful save.

## Test Plan

- Parser tests cover valid export parse, mismatched root `project_id`, invalid
  `op`, create rows with ids, update/delete rows without ids, invalid fields,
  and top-level versus milestone task placement.
- Service/action tests cover update, create, delete, omitted-row preservation,
  ownership rejection, cross-project rejection, and same-project task moves.
- UI tests cover the Project edit ellipsis menu, Template dialog open/copy,
  parse preview, save refresh, and Delete confirmation from the menu.
- Run focused project tests plus `git diff --check`, `pnpm --dir apps/web test`,
  `pnpm --dir apps/web lint`, and `pnpm --dir apps/web build`.
