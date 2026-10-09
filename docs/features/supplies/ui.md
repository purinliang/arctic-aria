# Supplies UI

The workspace header keeps its title, description and information hint. A
right-aligned New action precedes one compact list with ten rows per page. There
is no restock summary, category dropdown, filter toolbar or repeated list heading.
Name tooltips include Food/Household as secondary category metadata.

Each compact shared RecordCard has two rows: name on the left, remaining level
and edit icon on the right; then a full-width StockLevelSlider. Levels 0/1 are
red, 2 amber, and 3–5 blue. Five visual increments show the scale; zero keeps a
small red fill visible. The entire track is clickable with a 32px interaction
target, native slider semantics and keyboard support.

Dragging previews integer levels immediately without intermediate submissions.
Release commits once and recalculates ordering: severity (red, amber, blue),
category (Food, Household), then alphabetical title. The same comparator applies
on loading and updates. Pointer/keyboard interaction freezes ordering until
completion; cancelled pointer gestures restore their starting preview.

Commits are optimistic, locking only the saving item without spinners. Failures
restore the confirmed value and show a concise shared notification. Only confirmed
snapshots enter the cache; pending and newer-version rows are protected from stale
refreshes. Version checks prevent overwriting another client. Refresh resolves
uncertain writes after transport failure.

The editor contains name, the unchanged Food/Household selector labelled Category,
Initial stock slider (default 5), a collapsed optional note, and a full-width
Create/Save action. Non-empty notes open initially. Saves close only after backend
confirmation; archival retains its confirmation flow.

Existing physical quantities keep exact values and units. Their row uses a
read-only quantity indicator rather than a misleading scale. Name/category/note
edits preserve quantity, unit, target, increment, threshold, spares and history.
The editor explains that stock adjustment is unavailable for those records. No
conversion or clamping occurs.

Travel shopping remains in a collapsed secondary section with its existing
New/edit/link/purchased actions and six-row pagination. Purchasing changes neither
stock nor expenses. No consumption or prediction workflow is introduced. Mobile
keeps the same compact order without horizontal overflow.
