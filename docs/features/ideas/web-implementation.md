# Ideas Web Implementation

Ideas has a web management page and backend capture foundation.

## Code Locations

- Page: `apps/web/src/features/ideas/components/IdeasPage.tsx`
- Editor dialog: `apps/web/src/features/ideas/components/IdeaEditorDialog.tsx`
- Server actions: `apps/web/src/features/ideas/actions.ts`
- Service: `apps/web/src/features/ideas/server/idea-service.ts`
- Repository: `apps/web/src/features/ideas/server/postgres-idea-repository.ts`
- Validation: `apps/web/src/features/ideas/idea-validation.ts`
- Migration:
  `apps/database/migrations/0012_create_ideas_and_discord_accounts.sql`

## Current Behavior

The page lists unarchived ideas for the signed-in user. If no ideas exist yet,
it shows the normal empty state.

The web UI can add, edit, and delete ideas. Delete archives the idea, removes
it from the visible list, and does not hard-delete the database row.

The backend capture service can create `untriaged` ideas from trusted callers.
The web UI does not expose triage or conversion controls yet.

Discord `/idea` uses the same Ideas table after Discord account binding is
validated by the Discord integration.

Shared add/edit/delete dialog chrome comes from
`apps/web/src/components/dialog.tsx`. Ideas supplies only the feature-specific
text field and action handlers.

## Verification

Focused coverage:

- `apps/web/src/features/ideas/__tests__/idea-service.test.ts`
- `apps/web/src/features/discord/__tests__/interactions.test.ts`

Broad verification:

- `pnpm --dir apps/web test`
- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web build`
