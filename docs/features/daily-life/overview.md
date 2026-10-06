# Daily

Daily is a chronological record of ordinary life, separate from Today planning,
Projects, and Memories. Its sidebar item follows Today and opens `/daily`.

Meal, Shower, Sleep, and Exercise cards capture one activity with the server's
current timestamp. Sleep and Exercise are occurrences in this version, not
duration trackers. Multiple activities of the same kind on one day are valid.
Work and study remain project tasks; this feature does not create obligations,
routine completions, memory signals, or Today selections.

The page shows today and the previous six calendar dates in the user's configured
timezone. Older entries remain stored. Notes and recorded times can be edited;
entries can be removed with confirmation.

Chat is currently hidden in the frontend; its backend and stored conversation
history remain intact. Its implementation always gives the localized
development reply. There is no AI integration, API credential,
tool execution, or product command parsing. Future AI chat must use the owning
features' backend commands instead of writing directly to their tables.

See [ui.md](ui.md), [data-model.md](data-model.md), and
[web-implementation.md](web-implementation.md).
