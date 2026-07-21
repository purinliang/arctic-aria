# Project Internal Import

This document describes the internal project-import helper. It is a developer
tool for creating a project tree from LLM- or human-prepared text, not a normal
user-facing workflow.

## Flow

```text
Markdown template
  -> canonical JSON
  -> typed project import command
  -> developer-only API
  -> database insert
```

The Markdown template is for reading and light editing. The JSON form is the
canonical structure sent to the API.

## Structure

Imported projects use a strict tree:

```text
Project
  Milestone
    Task
```

Every imported task must be nested under a milestone. This is stricter than the
normal app UI, where a user can still create a task without a milestone. The
stricter import shape avoids fake milestone reference fields and makes LLM
output easier to validate.

## Files

- `apps/web/templates/project-import.md`: human-readable template.
- `apps/web/templates/project-import.json`: canonical JSON template.
- `apps/web/scripts/parse-project-import.ts`: Markdown or JSON parser command.
- `apps/web/src/app/api/developer/projects/import/route.ts`: developer-only
  insert endpoint.

Run the parser locally with:

```sh
pnpm --dir apps/web project:parse -- --file templates/project-import.md
```

## Naming

Use `parse` for validation and canonical JSON conversion. Use `import` only
when the API writes data to the database.

The project API is named `import` because it creates a real project tree:

```text
POST /api/developer/projects/import
```

## Testing

Local parse test:

```sh
pnpm --dir apps/web project:parse -- --file templates/project-import.md
pnpm --dir apps/web project:parse -- --file templates/project-import.json
```

Developer API insert test:

1. Run the web app locally.
2. Sign in with a developer account.
3. Open browser developer tools on the app page.
4. Paste a canonical JSON object from `templates/project-import.json` into this
   snippet:

```js
await fetch("/api/developer/projects/import", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(PROJECT_IMPORT_JSON),
}).then((response) => response.json());
```

Expected success shape:

```json
{
  "ok": true,
  "projectId": "..."
}
```

After success, refresh Projects and open the inserted project. It should contain
the imported milestones and tasks.

## API Shape

The API accepts canonical JSON with project fields and nested milestone tasks.
It does not accept top-level tasks.

```json
{
  "project": {
    "title": "Find a job",
    "objective": "Land a backend role.",
    "startDate": "2026-07-22",
    "timeline": {
      "type": "duration",
      "durationRange": "3_6_months"
    }
  },
  "milestones": [
    {
      "title": "Applications",
      "objective": "Submit strong applications.",
      "tasks": [
        {
          "title": "Prepare resume",
          "description": "Rewrite backend experience bullets."
        }
      ]
    }
  ]
}
```

The importer fills missing optional start dates and timelines using the same
project validation helpers as normal project actions.
