# Projects Overview

This directory defines the Core project-management model for Arctic Aria.

Use `Project` as the product term. A project is a long-running thing the user
wants to accomplish, such as finding a job, applying for a degree, applying for
a visa, finishing a study program, or shipping a work project.

Project implementation details are split across:

- [data-model.md](data-model.md): product entities and SQL direction.
- [ui.md](ui.md): web UI behavior and page structure.

## Hierarchy

Arctic Aria project work has three managed levels:

```text
Project
  Milestone
    Task
```

## Level Meanings

### Project

A project is the big thing the user cares about.

Typical duration:

- usually at least one month
- can last several years
- can have a hard deadline or only an expected duration

The user should create the project first. At project creation time, collect only
the stable top-level information:

- title
- description
- start date
- hard deadline or expected duration range

The project should not require detailed implementation tasks at creation time.
The user often does not know the exact details yet, and those details will
change after the user starts.

Project description replaces the previous separate objective and importance
reason fields. It should prompt the user to describe what the project is trying
to accomplish and why it matters in real life. UI copy should use natural
product text, not literal prompt-template fragments.

### Milestone

A milestone is a phase boundary inside a project. It is similar to a smaller
project, but it should stay lightweight.

Milestones help the user avoid planning too far into the future. The user
should usually focus on the first or current milestone, then refine later
milestones when the project becomes clearer.

Milestone examples:

- for a one-month project: one to three milestones, often one to two weeks each
- for a three-year project: six or more milestones, often about half a year each

Milestones are optional. A project starts with no milestones, and the user can
add milestones only when phase boundaries are useful. A task can also have no
milestone.

### Task

A task is the schedulable work unit. The scheduler and dashboard should select
tasks directly.

Typical duration depends on project scale:

- for a one-month project: usually one to three days
- for a multi-year project: can be one to two months

A task can span several days. It should still be concrete enough that the user
can decide whether it is the right thing to work on today.

## Product Principles

- The user manages projects.
- The user can add milestones when phase boundaries are useful.
- The user creates tasks under a project, optionally assigning a milestone.
- Implementation details under a milestone should be easy to change.
- Today's dashboard should focus on today's tasks to move projects forward.
- The user can pin up to three active projects as sidebar shortcuts for quick
  access to important current work.
- Editable numeric progress fields should not appear in the UI.
- Dashboard task rows should avoid standalone progress visuals.
- Child checklist rows are intentionally removed from the current design. Add
  them back only if task-only management proves insufficient.

## Naming Decision

Use these user-facing terms:

- `Project`
- `Milestone`
- `Task`

Avoid `Plan` as the feature name. Planning is still an activity, but the entity
the user manages is a project.
