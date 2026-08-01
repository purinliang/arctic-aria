# Events

Events are fixed plans with concrete generated instances. They are useful for
appointments, meetings, booked activities, classes, customer work, deadlines,
and other plans that have an outside dependency and should be visible without
becoming project tasks or routine instances.

## Boundary

An Event is not a project task and not a routine instance.

Events:

- are stored as Event definitions plus generated Event instances
- can happen once, daily, or weekly
- may belong to an optional Event Group
- may include an optional description, estimated duration, and location
- can be created, edited, and deleted
- cannot be completed, skipped, reopened, moved, or rescheduled from Today
- do not affect Today progress counts or progress bars

Reminder delivery is not implemented for Events. Daily Review may include Event
instances as read-only context, but summary tone and work progress still come
from tasks and routines.

## Definitions And Instances

An Event definition stores the repeatable plan: title, description, group,
start date, optional end date, recurrence rule, default scheduled time,
estimated duration, and default location.

An Event instance stores one concrete appointment generated from a definition.
The current UI shows instances but does not yet expose reschedule, cancel, or
location-override actions. Those lifecycle fields exist in the data model so a
future Event-instance editor can change one occurrence without rewriting the
whole definition.

Event Groups are optional folders for related definitions, such as school
tutorials, student lessons, customer meetings, or weekly reports. Different
predictable times or locations should be separate Event definitions inside the
same group.

## Today Behavior

Today shows Event instances for the current local board date, using the same
scheduled day boundary as project tasks and routines. Event rows are
display-only:

- no checkbox
- no done or undone state
- no Later, Move, Busy, or Skip controls

Clicking an Event title opens the Events page.

## Daily Review

Daily Review includes an Events section between Routines and Pinned Memories.
Event instance rows are plain bullet items, not checkbox rows. Review metadata
includes `eventCount`.

Events do not influence progress tone. Memories keep their existing life-count
behavior.
