# User Story

This document describes how Arctic Aria is meant to feel from the user's point
of view. It is close to README tone on purpose: it explains the problem in
plain language, then marks whether each workflow is already implemented or
still in progress.

## Why You Might Need It

You might find it hard to decide what to do next, even when you already know
your larger goals. A project such as finding a job, applying for a degree,
preparing a visa, or finishing a long study plan can feel too large to hold in
your head.

You might also forget small but important things:

- events and routines that appear quietly in the background
- ideas that appear when you are away from your desk
- personal experiences you enjoyed and want to revisit
- daily progress that was real, but easy to dismiss

Arctic Aria should turn those scattered pieces into a calmer workspace: one
place for projects, routines, events, memories, ideas, and later review.

## Account And Workspace

Status: implemented.

You can create an Arctic Aria account, sign in, stay signed in with a session
cookie, and sign out. After signing in, you enter the main workspace with a
sidebar, Today page, Projects, Routines, Events, Memories, Ideas, and Settings.

Settings currently let you choose theme mode, language, time format, Discord
binding, and app information. Simplified Chinese is available, but some
translations are still incomplete and machine translated.

In progress:

- OAuth login
- password reset
- account deletion
- deeper user profile settings

## Projects And Tasks

Status: implemented for manual project and task management.

You might know the big target but not the next step. Arctic Aria lets you create
a long-running project with a title, description, start date, and either a
deadline or expected duration. The description is where you explain the
objective and why it matters to you.

Inside a project, you can optionally create milestones. A milestone is a light
phase boundary, not a required layer. You can also create tasks directly under a
project without a milestone. Tasks are the practical pieces of work you can
check off.

You can:

- create, edit, delete, and pin projects
- create, edit, delete, and check tasks
- create, edit, and delete milestones
- open a project detail page from the Projects page or a pinned sidebar project
- see scheduled project tasks on the Today page, where completed tasks stay
  visible for the current local day

In progress:

- project pause, resume, complete, and archive UI
- project task reminder delivery through Discord
- richer review summaries based on completed and unfinished tasks

## Routines

Status: implemented for routine creation and daily checks.

You might have repeated work that is not a project, such as bills,
subscriptions, cleaning, medicine, or regular personal habits. Arctic Aria lets
you create routines with start/end dates, a due time, and a recurrence pattern
such as once, daily, weekly, monthly, yearly, every 14 days, every 30 days, or
every fixed number of days.

You can:

- create, edit, and delete routines
- see due routine instances on the Today page
- check a routine as done without opening the routine detail UI
- receive Discord routine reminders from the scheduled notification path

In progress:

- reminder response buttons such as Later or Move to tomorrow
- suggestions to adjust a routine after repeated misses

## Events

Status: implemented for fixed plans with one-time, daily, and weekly
recurrence.

You might have appointments, bookings, meetings, or other plans that happen
at a fixed date and time, or repeat as a series with an outside dependency.
Arctic Aria lets you create Events with a title, optional description, group,
date, time, recurrence, estimated duration, and location.

You can:

- create, edit, and delete Events
- organize related Events with Event Groups
- see Event definitions and generated Event instances on the Events page
- filter Event instances by All, Recent, Future, or Past
- reschedule or cancel one generated Event instance without changing the whole
  Event definition
- see today's Events on Today
- open the Events page from a Today Event row
- see Events in the Daily Review message

Events do not become checkboxes. They cannot be completed or moved, and they do
not change Today progress.

## Memories

Status: implemented for manual memory management and simple suggestions.

You might remember that you enjoyed a restaurant, cafe, park, book, movie,
anime, game, or shop, but forget it when you actually need a relaxing idea.
Memories are not commitments. They should not become overdue or create pressure
like tasks and routines.

You can:

- create, edit, and delete memories
- create and edit user-created memory categories
- use built-in categories with fixed icons and translated names
- refresh suggestions
- pin or unpin memories from the Memories page
- pin memories to Today
- check a pinned memory when you use it

In progress:

- smarter suggestion logic
- richer category configuration
- using memory history in daily review

## Ideas

Status: implemented for capture and basic web management.

You might have an idea on a train, before sleep, or while doing something else.
The first goal is to capture it quickly before it disappears.

You can:

- bind a Discord account in Settings
- run `/idea text:<raw text>` in Discord
- view captured ideas in the web Ideas page
- create, edit, and delete ideas from the web Ideas page

In progress:

- converting an idea into a project, task, routine, memory, or review note
- triage states beyond the first untriaged list

## Discord

Status: implemented for account binding, idea capture, and test messages.

Discord is a quick interaction surface hosted by the web app. It is useful when
you are not looking at the Arctic Aria website.

You can:

- bind your Discord account with a short code from Settings
- capture an idea with `/idea`
- send a test direct message from Settings to confirm message push works
- receive scheduled routine reminders and Daily Review messages

In progress:

- project task reminders
- reminder buttons
- free-text DM capture

## Daily Review And Sharing

Status: implemented for generated Today summary and Discord delivery.

You may finish part of a hard day and still feel like nothing happened. Arctic
Aria can summarize today's visible tasks, routines, and pinned memories into a
short Daily Review. The Today page shows the summary in a popover, and the
scheduled Discord path can send the review near the local day boundary.

In progress:

- daily review page
- daily review data model
- shareable progress card
- richer long-term review workflow
