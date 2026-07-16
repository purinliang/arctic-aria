# Ideas UI

Ideas UI is planned as a lightweight capture and triage surface.

The current web app includes a read-only prototype page for visualization. Idea
creation, editing, deletion, triage, and conversion are not implemented yet.

## Sidebar And Page

The sidebar should show `Ideas` as a normal navigation item between Projects and
Routines. Use a lightbulb icon.

The page title should be `Ideas`.

## Ideas Page

The first page should use one full-width panel:

- panel title: `Ideas`
- panel icon: lightbulb
- panel description: short text explaining that these are captured thoughts
  waiting for review
- no `New`, edit, delete, or conversion buttons yet

Rows should use the standard list item style:

- first line: raw captured text
- second line: supporting metadata in one line, such as
  `Discord · Untriaged · Jul 17, 2026 Fri`

Prototype-only rows may be shown before persistence exists, but they must be
clearly marked as prototype data and replaced by real Ideas data when the
backend is implemented.

## Interactions

The current prototype is view-only:

- clicking a row should not open a detail page
- there is no add/edit dialog
- there is no delete action
- there is no triage or conversion action

Future interactions should be specified here before implementation.
