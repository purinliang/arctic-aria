# Ideas

Ideas are quick captured thoughts before they become projects, tasks, routines,
memories, or review notes. The goal is low-friction capture:
the user should be able to save a thought before deciding what it means.

Ideas persistence and the backend capture service foundation are implemented.
The web app currently has a read-only Ideas page. Discord `/idea` can create
untriaged ideas for a bound Arctic Aria user. User-facing web add/edit/triage
controls are not implemented yet.

UI behavior is documented in [ui.md](ui.md). Persistence direction is documented
in [data-model.md](data-model.md).

## Scope

The first Ideas feature should support:

- raw-text capture
- source tracking, such as web, Discord, mobile, or agent
- an `untriaged` state for newly captured thoughts
- later review and conversion into another product entity

The first Ideas feature should not include:

- AI parsing or classification
- tags or category management
- project/task/routine creation during capture
- free-form Discord chat behavior
- reminder or scheduler ownership

## Capture Rules

The first capture command stores one raw text value. The user should not need to
choose a title, tags, destination feature, deadline, or priority during capture.

Backend validation should trim the captured text, reject empty text, and reject
text longer than 2,000 characters. This keeps the first Discord command and
database storage predictable.

## Triage

New ideas start as `untriaged`.

Future triage can:

- keep the idea as a note
- convert it into a project, task, routine, memory, or review note
- archive it when it is no longer useful

Conversion rules belong to the target feature. Ideas should record the
conversion target, but they should not duplicate project, routine, memory, or
review rules.

## Discord Relationship

The first Discord workflow uses `/idea text:<raw text>`. The Discord integration
is only an app surface for capture. It should call an Ideas command or service
and should not write project, routine, memory, or review tables directly.

The first Discord workflow should use command chat only. Normal direct messages
to the bot are not captured until a later design explicitly defines free-text DM
behavior.
