# Progress UI

The top-level Progress / 进步 page sits immediately after Today in navigation. It uses the
normal workspace title, description, and information hint. No floating menu,
hamburger, extra Today tab, or hidden chat page is added.

## Quick Capture

An unframed Quick capture section contains three equal shared ActionCards: Work,
Study, and Exercise, with Lucide activity icons. Cards show only their icon and
activity name, without counts or last-recorded times. Clicking opens the shared
editor with a required whole-minute duration, recorded time, and optional note.
The selected activity is named in the dialog title, without a redundant activity
switch. Existing-record editors still allow correcting the activity.

Save uses the shared Saving state and waits for persistence before closing.
Successful writes are silent. Failed writes keep the draft and show the shared
error notification; retries retain the same capture key.

## Chat

Chat is currently hidden in the frontend. The Progress page does not mount its
panel or hook, so it does not fetch history or send messages. There is no
composer, chat navigation entry, or chat information hint. Backend actions,
stored history, and the existing panel implementation remain intact for later
development.

When enabled, the shared framed Chat panel provides paged conversation history,
multiline composer, and primary Send button with its icon. Each history item
shows the user's message/time and the fixed development reply stating that no
AI response or app action is supported. Six newest-first turns are shown per
page; the normal compact pagination reaches older messages. History uses the
shared ScrollArea with an 18rem maximum height so long conversations do not
push capture and the recent log apart. Sending reveals the newest turn.

Sending waits for persistence, disables the composer and send control, and shows
shared Sending dots. Success clears the composer and prepends the turn. Failure
keeps the message for retry and shows the shared notification. A retry of the
same failed message retains its capture key. Blank messages cannot be sent.
Refresh reloads the history without losing the draft. There is no AI API call.

## Recent Log

Below quick capture is a shared Last seven days card with a stacked bar chart.
Seven bars run left to right from six days ago to Today. Work, Study, and Exercise
have distinct colors and a legend. Daily totals appear above each bar, with the
minute unit shown once in the chart header to avoid crowded mobile labels;
short weekday labels appear below, with Today localized. Empty days remain visible.
All seven bars fit on mobile without horizontal scrolling. Accessible button
names provide per-activity totals without relying on color. Selecting a bar
shows that day's newest-first record cards below, six per page, in two columns on
larger screens and one on mobile. Notes are limited to two visible lines; the
editor retains the full text. There is no refresh
button. The date window uses the user's timezone and rolls over once per minute.

Returning to Progress shows the signed-in account's cached chart and records
while refreshing in the background. Capture is not disabled by that refresh.
If it fails, cached content stays visible with a shared error notification.
Timezone changes or a new local day require a fresh seven-day snapshot.

An edit icon opens the shared CRUD dialog for activity, duration, date, time, and optional
note. Save is blocking and closes only after backend confirmation. Invalid,
future, or nonexistent local clock-change times show an error without discarding
the draft. Changing only a note preserves the original seconds. Delete opens the
shared confirmation dialog and removes the row only after confirmation succeeds.

There are no meal/shower/sleep controls, streak goals, running timers, or automatic
routine or project completion side effects. English and Chinese use typed catalogs.
