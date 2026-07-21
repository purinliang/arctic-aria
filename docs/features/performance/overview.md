# Performance Diagnostics

Performance diagnostics are administrator-only tools for measuring the live app
without exposing secrets or writing benchmark data into product tables.

## Latency

Progress: implemented for manual Settings diagnostics

The latency tool lives in Settings under `Developer Tools`. The card appears
only for signed-in administrators.

Historical environment measurements and the Singapore database decision record
live in [latency-benchmark.md](latency-benchmark.md).

Backend route:

- `POST /api/developer/performance/latency`
- requires a valid signed auth session
- requires `isAdmin = true` in the signed session payload
- returns one no-store probe result
- supports a `backend` probe without a database query
- supports a `database` probe with one lightweight `SELECT 1` database query
- does not return database URLs, environment values, usernames, cookies, or
  secrets

Frontend behavior:

- `Test Latency` runs 30 paired backend and database probes
- the browser records frontend/backend round-trip time around each backend probe
- the report shows min, p10, p50, p90, max, and average
- the report includes `Frontend-Backend RTT` and `Backend-Database RTT`
- the result is shown in the Settings panel, can be copied as Markdown, and is
  also printed with `console.table`
- reports are not persisted

Because there is no frontend-to-database direct connection by design, the tool
keeps frontend/backend and backend/database probes separate instead of reporting
a synthetic frontend/database number.

## Tab Switch Loading

Progress: benchmarked for the route-backed workspace decision

The tab switch benchmark measures the visible delay from clicking a sidebar tab
until the target page heading is visible. It is separate from backend latency:
the benchmark answers whether route-backed workspace navigation creates
noticeable local or production tab-switch lag.

Historical A/B/C route-navigation measurements live in
[tab-switch-loading-benchmark.md](tab-switch-loading-benchmark.md).

Benchmark script:

```bash
pnpm --dir apps/web switch:measure
```

Current decision:

- Keep rewrite-backed route navigation.
- Do not restore the first route-backed App Router page implementation.
- Keep the no-route single-`/` workspace as the raw speed baseline only.
