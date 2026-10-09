# Supplies Web Implementation

Feature code lives in apps/web/src/features/supplies. stock-level.ts owns
neutral-scale compatibility, absolute save inputs and severity/category/title
ordering. Shared RecordCard, CreateCard, PagedList and StockLevelSlider render
the compact responsive grid. PagedList's optional leading item provides a
creation cell; grid pagination spans every column.

Today checkbox request chains and revision guards inform StockLevelQueue.
One request per item is in flight. New selections update the UI immediately,
replace the queued target and increment a local revision. Successful responses
provide the next backend version; the queue saves only the latest target.
Different items remain independent. Server optimistic concurrency, not browser
timestamps, determines accepted writes. Failed/uncertain writes read the current
item before a bounded retry. A final failure restores confirmed stock with shared
notification feedback. No spinners or global overlays are used.

useSupplies protects queued rows from stale refreshes and only writes confirmed
snapshots to the account-scoped v2 cache. Native range inputs preserve keyboard
and accessible slider semantics; transparent input styling and focus-visible
keep the progress indicator visually quiet for pointer users. Active drags retain
their local preview across server version changes.

Legacy physical quantities are read-only; metadata edits preserve configuration.
Travel Shopping's visibility constant is false pending human confirmation;
implementation, data and APIs remain unchanged. No migrations are required.

Run focused Supplies/shared/app-shell tests, ./scripts/verify-web.sh and the
personal-tools browser matrix, including tablet and rapid queued interactions.
The real-backend check verifies confirmed persistence and legacy editing.
