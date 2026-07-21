# Routine Internal Parse

This document describes the internal routine parser. It is a developer tool for
checking LLM- or human-prepared routine text before any routine is saved.

## Flow

```text
Markdown template
  -> canonical JSON
  -> typed routine command
  -> developer-only parse API
```

The routine parse API does not insert, update, or delete database rows.

## Files

- `apps/web/templates/routine-import.md`: human-readable template.
- `apps/web/templates/routine-import.json`: canonical JSON template.
- `apps/web/scripts/parse-routine-import.ts`: Markdown or JSON parser command.
- `apps/web/src/app/api/developer/routines/parse/route.ts`: developer-only
  parse endpoint.

Run the parser locally with:

```sh
pnpm --dir apps/web routine:parse -- --file templates/routine-import.md
```

## Structure

One template describes one routine. Legal recurrence values are:

- `daily`
- `weekly`
- `monthly`
- `every_14_days`
- `every_30_days`
- `fixed_days`

`fixedIntervalDays` is only meaningful when recurrence is `fixed_days`. The
normalizer uses the same validation helper as the routine editor.
