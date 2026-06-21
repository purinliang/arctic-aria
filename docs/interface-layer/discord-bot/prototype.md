# Discord Bot Prototype

This document describes the first Discord bot direction for Arctic Aria. The bot
belongs to the Interface layer. It should deliver reminders and capture quick
input, but it should not own Core planning, routine, scheduler, or review rules.

## Scope

The first bot should support:

- binding one Discord account to one Arctic Aria user
- receiving reminder messages
- answering reminders with `Done`, `Busy`, or `Skip`
- quick idea capture
- concise daily status or review prompts

The first version does not need general multi-user login. Arctic Aria can start
with one seeded user record for the owner.

## Binding

Even though the first version has one user, keep the binding model explicit so
the data model does not need to be rebuilt later.

Recommended behavior:

- Store Discord bindings in `discord_accounts`.
- Enforce one Arctic Aria user per Discord user.
- Enforce at most one Discord user per Arctic Aria user.
- Allow the first personal setup to bind through a one-time token or a manually
  configured owner Discord user id.

The bot should not implement web login or account management. It only needs to
identify which Arctic Aria user should receive or answer a Discord interaction.

## Reminder Interaction

Reminder messages should contain three actions:

- `Done`
- `Busy`
- `Skip`

When the user clicks `Done`, the bot should call a Core command that marks the
target task or routine instance complete.

When the user clicks `Skip`, the bot should call a Core command that marks the
target task or routine instance skipped.

When the user clicks `Busy`, the bot should call a reminder command that snoozes
or reschedules the reminder. `Busy` should not become a task or routine status.

After any action, the bot should update the Discord message when possible so the
channel does not fill with repeated reminder messages.

## Data Flow

```text
Reminder job due
  -> Discord bot sends or updates reminder message
  -> user clicks Done, Busy, or Skip
  -> bot validates Discord binding
  -> bot calls Core or reminder command
  -> database state changes
  -> event bus publishes completion, skip, or snooze event
  -> review and reward subscribers react
```

The bot should call application APIs or shared command handlers. It should not
write planning tables directly.
