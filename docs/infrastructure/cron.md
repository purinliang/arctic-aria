# Cron Scheduling

Cron scheduling is split from product logic.

Current runtime:

- Scheduler platform: Cloudflare Workers Cron Triggers
- Scheduler app: `apps/cron`
- Product execution route: `apps/web/src/app/api/cron/discord-notifications/route.ts`
- Authorization: `CRON_SECRET`

The cron worker does not connect to Neon and does not call Discord directly. It
only wakes up on a schedule and invokes the web app's protected cron route:

```text
Cloudflare Cron Trigger
  -> apps/cron scheduled handler
  -> GET https://<web-host>/api/cron/discord-notifications
  -> Next.js web route validates CRON_SECRET
  -> web app sends due routine reminders and Daily Review messages
```

This keeps reminder selection, Daily Review generation, Discord delivery,
delivery idempotency, and database access inside the web app, where the current
feature services already live.

## Why Cloudflare

Vercel remains the web app host, but Vercel Cron is no longer the scheduler.
Cloudflare Workers Cron Triggers are a better fit for Arctic Aria's current
small scheduled workload because the cron worker can be deployed separately and
does not require moving the web backend off Vercel.

Cloudflare cron expressions run in UTC. The web app remains responsible for
translating UTC execution time into each user's stored timezone and deciding
which reminders or Daily Reviews are due.

## Configuration

Cloudflare worker configuration:

- `apps/cron/wrangler.jsonc`

Current schedule:

```text
*/15 * * * *
```

Current production web target:

```text
https://arctic-aria.vercel.app
```

The target route path is fixed in `apps/cron/src/index.js`:

```text
/api/cron/discord-notifications
```

## Environment Variables

Cron worker:

- `WEB_APP_BASE_URL`: non-secret target web app base URL
- `CRON_SECRET`: secret matching the target web app environment

Web app:

- `CRON_SECRET`: secret used to authorize scheduled cron routes

Do not give the cron worker database or Discord credentials. The web app owns
those integrations.

## Local Testing

1. Start the web app:

   ```bash
   pnpm --dir apps/web dev
   ```

2. Copy `apps/cron/.dev.vars.example` to `apps/cron/.dev.vars` and set
   `CRON_SECRET` to the same value as `apps/web/.env.local`.

3. Start the cron worker locally:

   ```bash
   pnpm --dir apps/cron dev
   ```

4. Trigger the scheduled handler through Wrangler's test endpoint:

   ```bash
   curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
   ```

The worker also exposes:

```text
GET /health
```

for a simple local or deployed health check.

## Deployment

Set the worker secret before deploying:

```bash
cd apps/cron
pnpm dlx wrangler secret put CRON_SECRET
```

Deploy with:

```bash
pnpm --dir apps/cron deploy
```

If the production web app moves away from `https://arctic-aria.vercel.app`,
update `WEB_APP_BASE_URL` in `apps/cron/wrangler.jsonc` before
deploying the worker.

## Failure Behavior

If the web route returns a non-2xx response, the cron worker logs the HTTP
status and throws. It does not log secrets or raw user-authored product content.

The web app still records Discord delivery idempotency through
`discord_message_deliveries`, so retrying a cron invocation should not duplicate
messages for the same user and idempotency key.
