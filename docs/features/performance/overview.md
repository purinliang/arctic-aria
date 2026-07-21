# Performance Diagnostics

Performance diagnostics are administrator-only tools for measuring the live app
without exposing secrets or writing benchmark data into product tables.

## Latency

Progress: implemented for manual Settings diagnostics

The latency tool lives in Settings under `Developer Tools`. The card appears
only for signed-in administrators.

Backend route:

- `POST /api/developer/performance/latency`
- requires a valid signed auth session
- requires `isAdmin = true` in the signed session payload
- returns one no-store sample
- runs one lightweight `SELECT 1` database query
- returns backend handler time and database query time only
- does not return database URLs, environment values, usernames, cookies, or
  secrets

Frontend behavior:

- `Test Latency` runs 30 sequential POST requests
- the browser records total request time around each fetch
- the report shows min, p10, p50, p90, max, and average
- the report includes browser-to-backend-to-database total, backend handler,
  backend-to-database, and estimated browser/backend overhead
- the result is shown in the Settings panel, can be copied as Markdown, and is
  also printed with `console.table`
- reports are not persisted

Because there is no frontend-to-database direct connection by design,
frontend/database latency is represented by the full
browser-to-backend-to-database path.
