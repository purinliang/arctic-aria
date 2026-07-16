# Redis

Redis is a planned infrastructure direction, not an implemented dependency.
Arctic Aria currently uses Neon PostgreSQL as the only durable system of record.

## Purpose

Redis may be added later to reduce user-visible latency and support short-lived
coordination while keeping the web backend stateless.

Good future uses:

- cache frequently read dashboard summaries
- cache current-user/session-derived lookup results when database latency is too
  high
- cache scheduler candidate lists for a short time
- rate-limit auth and write-heavy commands
- debounce repeated lightweight commands
- coordinate reminder delivery or background jobs
- store short-lived idempotency keys for retry-safe commands

Bad first uses:

- replacing PostgreSQL as the source of truth
- storing canonical projects, tasks, routines, memories, or users
- storing raw credentials, OAuth tokens, or long-lived secrets
- hiding database consistency problems instead of adding constraints

## Stateless Backend Rule

The Next.js backend should remain stateless across requests. A server process
should be replaceable at any time without losing canonical product state.

Redis can hold ephemeral state that survives one server process but does not
need to be durable forever. If Redis data disappears, the app should be able to
rebuild it from PostgreSQL or continue with a slower direct PostgreSQL path.

Examples:

- A dashboard cache miss should reload from PostgreSQL.
- A scheduler candidate cache miss should recompute from PostgreSQL.
- A rate-limit key disappearing should fail open or closed according to the
  command's security needs, but it must not corrupt product data.

## Consistency Boundary

PostgreSQL remains the final consistency boundary.

Redis must not be the only place that enforces:

- unique username
- ownership checks
- parent-child references
- task or routine status validity
- delete/archive safety
- completion event persistence

Redis may help reduce repeated reads before a write, but the database must still
reject invalid or conflicting writes.

## When To Add Redis

Do not add Redis just because the architecture mentions it. Add it only after a
measured need appears.

Acceptable triggers:

- dashboard load time is too slow after measuring frontend-to-backend and
  backend-to-database latency
- auth or write endpoints need rate limiting
- reminder delivery needs short-lived locks, retries, or idempotency keys
- scheduler computation becomes expensive enough to cache
- a background job system requires lightweight coordination

Before adding Redis, record:

```text
Date | Environment | Slow path | p50 | p95 | Proposed Redis use | Expiry policy
```

## Data Rules

All Redis keys should have explicit ownership and expiry.

Recommended key shape:

```text
arctic-aria:<environment>:<area>:<user-or-global>:<purpose>
```

Examples:

- `arctic-aria:prod:dashboard:<user_id>:summary`
- `arctic-aria:prod:rate-limit:auth:<username-or-ip>`
- `arctic-aria:prod:idempotency:<command_id>`

Do not put raw secrets in key names or values. Keep Redis connection strings in
untracked local env files or deployment secret storage.

## Relationship To Event/Dataflow

Redis may later support queues, streams, locks, or pub/sub, but Arctic Aria does
not have an event-bus implementation yet.

If Redis is used for event/dataflow later, add a dedicated infrastructure doc
for that flow before implementation. The doc should define durability,
retry, dead-letter, ordering, and failure semantics.
