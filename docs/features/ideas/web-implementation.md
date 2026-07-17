# Ideas Web Implementation

Ideas has a read-only web page and backend capture foundation.

## Code Locations

- Page: `apps/web/src/features/ideas/components/IdeasPage.tsx`
- Server actions: `apps/web/src/features/ideas/actions.ts`
- Service: `apps/web/src/features/ideas/server/idea-service.ts`
- Repository: `apps/web/src/features/ideas/server/postgres-idea-repository.ts`
- Validation: `apps/web/src/features/ideas/idea-validation.ts`
- Migration:
  `apps/infrastructure/database/migrations/0012_create_ideas_and_discord_accounts.sql`

## Current Behavior

The page is read-only. It lists unarchived ideas for the signed-in user. If no
ideas exist yet, it shows localized prototype rows marked as prototype data.

The backend capture service can create `untriaged` ideas from trusted callers.
The web UI does not expose add, edit, delete, triage, or conversion controls
yet.

Discord `/idea` uses the same Ideas table after Discord account binding is
validated by the Discord bot app.

## Verification

Focused coverage:

- `apps/web/src/features/ideas/__tests__/idea-service.test.ts`
- `apps/discord-bot/src/__tests__/idea-capturing.test.ts`

Broad verification:

- `pnpm --dir apps/web test`
- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web build`
