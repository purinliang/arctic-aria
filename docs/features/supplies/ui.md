# Supplies UI

The workspace header keeps its title, description and information hint.
A compact shared-card grid uses three columns on desktop, two on tablet and one
on mobile. Eleven supplies appear per page alongside a first-position dashed
New supply tile. Pagination spans the grid; the tile stays first on every page
and opens the unchanged creation editor.

Each card has only a single-line clickable title and a full-width stock bar.
Titles open editing; no pencil, visible numeric level or extra description.
Title tooltips include Food/Household. Levels 0/1 remain red, 2 amber and 3-5 blue.
Five visual increments indicate the scale; zero retains a short red fill.
The 32px pointer target supports click, drag, touch and native range keyboard
controls. It is unselectable, uses grab/grabbing cursors and has no mouse-focus
outline. Keyboard focus remains visible through focus-visible.

Dragging previews integer levels without submitting intermediate values.
Release recalculates severity/category/title ordering. Ordering stays frozen
during active pointer or keyboard interaction. Cancelling restores the initial
preview; pending server responses do not interrupt an active drag.

Stock bars never lock during saves. Each item has a serial, versioned write queue
that collapses intermediate committed intentions to the latest level. Responses
update confirmed versions/cache without replacing a newer local level.
Unrelated items save independently. A failed write reads current stock to resolve
uncertain commits or stale versions and retries once for the current intention.
If it still fails, restore confirmed stock with shared error feedback; another
interaction can retry. Only confirmed data enters the cache. Editing the title
waits until that item's queue finishes, preventing stale configuration edits.

The editor remains name, unchanged Food/Household Category selector, Initial
stock slider (default 5), collapsed optional note and full-width Create/Save.
Existing physical quantities remain read-only indicators with accessible quantity
text. Their stored quantities/configuration are not converted or clamped.

Existing supplies have a More actions icon beside the header Close button.
Its shared compact action menu contains Delete; there is no destructive footer
button. Delete opens the existing archive confirmation and retains soft-archive
persistence, version checks and pending behavior. Cancel keeps the editor draft.
Create/Save remains the full-width footer action; new supplies have no menu.

Travel Shopping is hidden, not deleted. Code, records and commands remain intact.
Restoration requires pending human confirmation in docs/roadmap.md.
