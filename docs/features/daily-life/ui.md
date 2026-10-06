# Daily UI

The top-level Daily page sits immediately after Today in navigation. It uses the
normal workspace title, description, and information hint. No floating menu,
hamburger, extra Today tab, or hidden chat page is added.

## Quick Capture

An unframed Quick capture section contains four equal shared ActionCards: Meal,
Shower, Sleep, and Exercise, with Lucide activity icons. Cards form four columns
on desktop and two on narrow screens. Their dimensions stay stable while counts
or pending labels change. Supporting text shows today's count and latest time.

Clicking a card adds an optimistic activity entry immediately. Only the active
kind is disabled until its request finishes; another card remains usable. The
pending card shows shared Recording dots. Successful writes are silent. A failed
write removes only its optimistic row and uses the shared error notification.

## Chat

Below capture is the shared framed Chat panel: paged conversation history,
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

Below Chat is an unframed Last seven days section. Each date uses a shared
ContentSubsection and normal list rows, with six entries per page if needed.
Today and Yesterday have localized labels; dates and times respect the app's
language, timezone, and 12/24-hour preference. Entries are newest first within
each day. Empty dates remain visible. The date window rolls over at local
midnight, checked once per minute while the page is open.

An edit icon opens the shared CRUD dialog for activity, date, time, and optional
note. Save is blocking and closes only after backend confirmation. Invalid,
future, or nonexistent local clock-change times show an error without discarding
the draft. Changing only a note preserves the original seconds. Delete opens the
shared confirmation dialog and removes the row only after confirmation succeeds.

There are no work/study cards, streak goals, sleep duration controls, or automatic
routine completion side effects. English and Simplified Chinese use typed catalogs.
