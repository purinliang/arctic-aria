# Daily Data Model

Migration `0035_create_daily_life_entries.sql` adds two user-owned tables.

## Activity Entries

`daily_life_entries` contains `id`, `user_id`, `capture_key`, `activity`,
`occurred_at`, optional `note`, and creation/update/deletion timestamps.

- Activity is restricted to `meal`, `shower`, `sleep`, or `exercise` by backend
  validation and a database check.
- Notes are trimmed; blank notes become NULL. Maximum length is 500 Unicode
  characters, matching PostgreSQL character counting.
- Occurrence is a UTC timestamp, not a timezone-less date. Quick capture defaults
  to server time; edits require a real timestamp from 1900 onward, not in the
  future. Display and seven-day boundaries use the configured user timezone.
- `(user_id, capture_key)` is unique. Each capture gets a UUID; replaying it
  returns the existing active row without modifying its activity or timestamp.
  Distinct capture keys allow repeated activities without daily count limits.
- User ownership is checked by the authenticated server action and included in
  every select/update/archive query. User identifiers never come from the form.
- A partial index on owner and occurrence supports recent active-entry reads.
- Removal is soft deletion. Deleted rows do not appear in normal reads; retries
  cannot revive them. Deleting a user cascades to their activity entries.

The recent query uses calendar midnight six days before the current local date,
not a fixed 168-hour interval. Daylight-saving changes must not change the number
of dates shown. Editing an entry outside the seven-day window hides it from the
current page without deleting it.

## Chat Turns

`daily_life_chat_turns` stores `id`, `user_id`, `capture_key`, `message`,
`response_code`, and `created_at`. A turn represents a message and its fixed
development reply atomically in one row.

- Trimmed messages contain 1–2000 Unicode characters.
- Response code is restricted to `chat_not_available`; localized reply text is
  rendered from the message catalog, not saved in a particular language.
- The owner/capture-key unique constraint makes failed-response retries safe.
- Reads are owner-scoped, ordered newest first; UI pagination shows six turns.
- Chat turns are retained across page visits. This version has no chat deletion
  or archival control. Deleting a user cascades to their chat turns.
- A chat message never modifies activities, projects, routines, or events.
