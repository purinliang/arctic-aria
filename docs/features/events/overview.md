# Events

Events are one-time scheduled items with a concrete local date and time. They
are useful for appointments, meetings, booked activities, and other fixed plans
that should be visible without becoming project tasks or routine instances.

## Boundary

An Event is not a project task and not a routine instance.

Events:

- happen once at one local `event_date` and `event_time`
- may include an optional description, estimated duration, and location
- can be created, edited, and deleted
- cannot be completed, skipped, reopened, moved, or rescheduled from Today
- do not affect Today progress counts or progress bars

Reminder delivery is out of scope for the first Events feature. Daily Review
may include Events as read-only context, but summary tone and work progress
still come from tasks and routines.

## Today Behavior

Today shows Events for the current local board date, using the same scheduled
day boundary as project tasks and routines. Event rows are display-only:

- no checkbox
- no done or undone state
- no Later, Move, Busy, or Skip controls

Clicking an Event title opens the Events page.

## Daily Review

Daily Review includes an Events section between Routines and Pinned Memories.
Event rows are plain bullet items, not checkbox rows. Review metadata includes
`eventCount`.

Events do not influence progress tone. Memories keep their existing life-count
behavior.
