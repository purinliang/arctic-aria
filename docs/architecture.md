# Architecture

This document describes the high-level module architecture for Arctic Aria. It
focuses on what each layer owns. Technology choices and repository layout are
documented in [implementation.md](implementation.md).

## Layer Overview

```text
ArcticAria
|-- Core layer
|   |-- plan and task engine
|   |-- routine engine
|   |-- idea engine
|   |-- scheduler
|   `-- review engine
|
|-- Plugin layer
|   |-- reward system
|   |-- english coach
|   |-- future research coach
|   `-- future life planners
|
|-- Interface layer
|   |-- web dashboard
|   `-- discord bot
|
`-- Infrastructure layer
    |-- database
    |-- event bus
    `-- background jobs
```

The Core layer owns stable product logic. The Plugin layer adds optional
specialized workflows. The Interface layer lets the user operate the same
system through the web dashboard or Discord. The Infrastructure layer provides
shared technical capabilities that other layers use, but it does not own product
rules.

## Core Layer

The Core layer is the source of truth for planning, routines, scheduling, ideas,
and reviews. It should be deterministic, testable, and independent from any
specific interface.

### Plan And Task Engine

A plan is a large goal that may last for weeks or months. A task is a smaller
piece of work that usually takes a few hours to a few days. A task can contain
subtasks, but subtasks are still tasks.

The first model should use two conceptual levels:

- Plan: long-running goal, deadline, overall progress, and grouped work.
- Task: executable work item, optional parent task, weight, status, and
  completion progress.

The task engine owns:

- task capture and triage
- parent-child task relationships
- task weights
- full completion and partial completion
- deadline and progress calculation
- status changes such as todo, doing, blocked, skipped, and done

### Routine Engine

A routine is not a plan. It represents repeated daily-life work, such as
exercise, sleep preparation, English practice, review, or other recurring
chores.

The routine engine owns:

- recurrence rules
- routine instances for specific days
- completion and skip states
- reminder preferences used by the scheduler
- simple routine categories, including fitness routines

Fitness belongs here by default. It should become a plugin only if a future
fitness feature needs specialized recommendation, analysis, or external device
integration.

### Idea Engine

The idea engine stores quick thoughts before they become tasks, plans, routines,
or plugin inputs.

The idea engine owns:

- quick capture records
- source information, such as web, Discord, or mobile
- triage state
- conversion into a task, plan, routine, idea record, or plugin request

### Scheduler

The scheduler selects tasks and routines for upcoming time windows and returns
data for a timetable. It should not directly own Discord or web UI behavior.

The scheduler owns:

- selecting candidate tasks and routines
- checking deadlines and remaining work
- producing timetable data for coming days
- creating reminder jobs
- handling retry and quiet-period rules
- notifying the Interface layer when a reminder should be delivered

The scheduler can send an internal job or API request to the Interface layer,
but the Interface layer should deliver the actual notification.

### Review Engine

The review engine manages feedback and reflection.

The review engine owns:

- daily reviews
- weekly and monthly review summaries
- completion history
- progress summaries
- adjustment suggestions
- hooks that allow the reward plugin to grant rewards

## Plugin Layer

Plugins add specialized behavior without owning core product state directly.
They should read core context through approved APIs and submit proposed actions
back to the Core layer for validation.

### Reward System

The reward system is a plugin because it is a light game for positive feedback,
not required for the core planning model.

It owns:

- money, boxes, gems, flowers, and inventory items
- reward rules based on completion and review results
- box opening logic
- optional game-like progress such as building or repairing a small island

The reward plugin should listen to review or completion events rather than
being embedded in the task engine.

### English Coach

The English coach is a plugin because it has specialized agent behavior,
conversation, correction, speaking practice, and learning memory.

It owns:

- daily topic suggestions
- chat-style practice
- mistake correction
- daily learning review
- learning memory and retrieval context

It may create tasks or routines, but those actions must go through the Core
layer.

### Future Research Coach

The research coach can help collect sources, summarize material, and produce
structured outputs. It should save outputs as plugin records or ideas that can
be triaged later.

### Future Life Planners

Future planners can include cooking, shopping, sightseeing, anime
recommendation, or other fun planning helpers. They should remain plugins unless
their behavior becomes a stable part of the core planning model.

## Interface Layer

The Interface layer is responsible for user interaction, not business rules.

### Web Dashboard

The web dashboard is the primary interface. It should focus on desktop first,
while remaining usable on iPhone Chrome.

It owns:

- schedule editing UI
- completion and partial-completion UI
- plan and task management UI
- routine management UI
- review UI
- reward and plugin screens

### Discord Bot

The Discord bot is mainly for notification and quick interaction. It is
important because the user may forget to open the web dashboard.

It owns:

- pushed reminders
- daily scheduler messages
- quick capture
- reminder buttons
- review prompts
- concise status updates

The Discord bot should call Core APIs. It should not implement its own planning
or routine logic.

## Infrastructure Layer

The Infrastructure layer supports the Core, Plugin, and Interface layers. It is
where shared storage, event delivery, migrations, background jobs, and external
service adapters belong.

Infrastructure owns technical mechanisms, not product decisions. For example:

- The database owns persistence, migrations, indexes, and transaction support.
- The event bus owns publishing, subscribing, retries, and delivery tracking.
- Background jobs own durable execution for reminders, scheduled review work,
  plugin runs, and notification delivery.

Core code should define product entities, commands, validations, and domain
events. Infrastructure code should store those entities and move those events
between modules.

For the first version, the database and event bus can be simple. They still
belong to Infrastructure because the Core layer should not depend on a specific
storage engine, queue, or notification transport.

## Data Flow

Typical daily flow:

```text
User input
  -> Interface layer
  -> Core layer command
  -> Core state change
  -> Infrastructure persistence
  -> Scheduler / review update
  -> Future plugin or dataflow hook
  -> Interface notification or dashboard update
```

Example reminder flow:

```text
Scheduler
  -> reminder job
  -> Discord bot delivery
  -> user button response
  -> Core routine/task completion command
  -> Infrastructure persistence
  -> completion event recorded
  -> review update
  -> optional future reward flow
```

Example English coach flow:

```text
Web dashboard
  -> English coach plugin session
  -> plugin context lookup
  -> learning response and correction
  -> learning memory saved
  -> optional task/routine suggestion through Core layer
```
