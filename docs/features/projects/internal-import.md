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

The Markdown template is copied from the administrator-only Developer Tools
panel in Settings. The JSON form is the canonical structure accepted by the API.

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

- `apps/cli/templates/project-import.md`: human-readable template kept for
  future CLI work and checked against the web copy-template text.
- `apps/cli/templates/project-import.json`: canonical JSON example kept for
  future CLI work.
- `apps/web/src/features/developer/components/DeveloperImportToolItems.tsx`:
  developer Settings tool rows for copy-template, paste-to-parse, and
  paste-to-import tests.
- `apps/web/src/features/developer/import-template-prompts.ts`: prompt wrapper
  and template text copied into an LLM.
- `apps/web/src/app/api/developer/projects/parse/route.ts`: developer-only
  validation endpoint.
- `apps/web/src/app/api/developer/projects/import/route.ts`: developer-only
  insert endpoint.

## Naming

Use `parse` for validation and canonical JSON conversion. Use `import` only
when the API writes data to the database.

The project API is named `import` because it creates a real project tree:

```text
POST /api/developer/projects/parse
POST /api/developer/projects/import
```

Both endpoints accept canonical JSON directly, Markdown text, or an envelope:

```json
{
  "format": "markdown",
  "source": "# Project: ..."
}
```

`parse` returns the canonical document(s) and normalized command(s). `import`
writes the normalized command(s) to the signed-in developer session account.

## Testing

Developer API parse test:

1. Run the web app locally.
2. Sign in with a developer account.
3. Open Settings.
4. Use the developer-only Developer Tools panel.
5. Select Project.
6. Click Copy Template when asking an LLM to prepare the import Markdown.
7. Paste Markdown or canonical JSON, then click Parse.

The browser developer console can also call the API directly:

```js
await fetch("/api/developer/projects/parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(PROJECT_IMPORT_JSON),
}).then((response) => response.json());
```

Developer API import test:

Use the same Developer Tools panel, select Project, paste Markdown or
canonical JSON, then click Import. The import writes to the signed-in
developer account.

The browser developer console can also call the API directly:

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
  "projectId": "...",
  "projectIds": ["..."],
  "importedCount": 1
}
```

After success, Projects data refreshes automatically. Open the inserted project;
it should contain the imported milestones and tasks.

## Account Binding

The current developer APIs require an administrator web session. That is how the
backend knows which account receives imported data, and it prevents normal users
from calling internal import tools.

A future remote CLI client should use a separate CLI binding token stored
outside Git. Do not reuse Discord binding codes for this without a separate
design, because Discord binding proves a Discord account, while a CLI binding
would authorize data writes.

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

Batch JSON is also accepted:

```json
{
  "projects": [
    {
      "project": {
        "title": "Find a job"
      },
      "milestones": [
        {
          "title": "Applications",
          "tasks": [
            {
              "title": "Prepare resume"
            }
          ]
        }
      ]
    }
  ]
}
```

Markdown may contain one or more `Project:` or `# Project:` blocks. A line with
`---` is optional and only acts as a visual separator.

The importer fills missing optional start dates and timelines using the same
project validation helpers as normal project actions.

LLM-generated duration text is forgiving. Exact values are preferred:
`1_3_months`, `3_6_months`, `6_12_months`, and `1_3_years`. If the LLM returns
plain language such as `4 months`, the parser maps it to the closest supported
duration range. If the duration is unclear, it falls back to the default
`3_6_months`.
