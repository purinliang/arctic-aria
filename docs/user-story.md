# User Story

This document describes the user problems and expected workflows for Arctic
Aria.

## Main Focus

Arctic Aria should help with:

- breaking long-term projects into milestones and tasks
- automatically choosing daily work based on priority, urgency, deadline, and
  remaining progress
- managing routines and reminders
- capturing ideas, possible tasks, and possible routines in one place
- rediscovering saved personal experiences through memories
- suggesting fun activities such as cuisine, sightseeing, movies, or anime
- reviewing daily progress and creating a shareable progress card

## Daily Planning

At the start of the day, the system should help select a small set of realistic
priorities from projects, tasks, routines, and deadlines. The daily plan should
include time blocks where useful, but it should also allow flexible tasks that
do not need a fixed time.

Large projects can contain milestones. Milestones contain tasks. Examples
include finding a job, applying for a degree, applying for a visa, or finishing
a study/work project.

The user can click a checkbox or command button to mark a task as complete.
Progress should come from completed tasks or milestone phases, not from asking
the user to edit numeric progress fields. Daily review data should update the
displayed progress.

## Idea Capture

When a new thought appears, the user should be able to capture it quickly
through the web application or Discord bot. The captured item can later become a
task, project, routine, idea record, or plugin request.

The capture flow should be low-friction because many useful ideas happen away
from the desk, such as on a train.

## Memories

The user should be able to save repeatable personal experiences, such as
restaurants, cafes, parks, anime, games, books, or shops. These memories help
the user choose something enjoyable when they do not know what they want to do.

Memories are not commitments. They should not become overdue and should not
create pressure like tasks or routines.

The system should suggest a small number of memories manually when the user
clicks refresh. The user can pin, ignore, complete, replace, or open a memory
detail page. Cuisine and sightseeing memories can appear on the home dashboard
as a gentle `Pinned Memories` section.

## Routine Reminders

Repeating routines should produce reminders and completion checks. If a routine
is skipped often, the system should suggest changing the schedule, reducing the
scope, or pausing the routine.

For the initial personal workflow, the Discord bot should send daily reminder
checks at `20:30`, `22:00`, `23:30`, `01:00`, and `02:30`. The user's day ends
at `04:00`. Each reminder should let the user answer with actions such as
completed, skipped, or "busy now". The busy action should silence that reminder
for two hours. If the user does not reply, the bot should send another reminder
after 15 minutes.

To avoid noisy Discord channels, reminder messages should be concise. Where
possible, the bot should update an existing message instead of sending many new
messages.

## Daily Review And Sharing

The daily review should show what the user completed, partially completed,
skipped, or left unfinished. It should help the user see real progress even when
the day was imperfect.

The system should also be able to create a shareable progress card for friends
or family. Sharing should be optional and should not block the private personal
planning workflow.
