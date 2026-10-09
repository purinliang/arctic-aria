# Progress

Progress (进步) records time spent working, studying, and exercising, separate
from Today planning, project completion, and Memories. Its sidebar item follows
Today and opens `/progress`; `/daily` redirects to the new route. Internal
feature keys and storage names remain `daily-life` to avoid unrelated churn.

Work, Study, and Exercise cards open a duration form. Each record stores whole
minutes, a timestamp, and an optional note. Multiple sessions on one day are
valid. Meal, shower, and sleep have no recording controls. These records do not
complete project tasks or routines, create obligations, or affect Today.

The chart shows daily duration totals across seven local calendar dates, oldest
on the left and Today on the right. Short weekday labels replace full dates.
Select a bar to inspect its records below. Older records remain stored. Duration,
notes, and recorded times can be edited; removal requires confirmation.

Chat is currently hidden in the frontend; its backend and stored conversation
history remain intact. Its implementation always gives the localized
development reply. There is no AI integration, API credential,
tool execution, or product command parsing. Future AI chat must use the owning
features' backend commands instead of writing directly to their tables.

See [ui.md](ui.md), [data-model.md](data-model.md), and
[web-implementation.md](web-implementation.md).
