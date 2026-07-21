# Latency Benchmark

This file records manual latency measurements from the administrator-only
Settings performance diagnostics panel. Keep these records because they explain
why Arctic Aria moved the database closer to the deployed backend.

## Method

- Tool: Settings -> Developer Tools -> Test Latency.
- Samples: 30 sequential browser requests per environment.
- Date: July 21, 2026.
- Frontend location: developer browser in Australia.
- Backend platform: Vercel.
- Database platform: Neon PostgreSQL.
- Database query: one lightweight `SELECT 1` per sample.
- Results are operational measurements, not an SLA.

The current Settings diagnostic UI shows two rows:

- `Frontend-Backend RTT`: a signed-in developer API probe without a database
  query.
- `Backend-Database RTT`: the backend's measured round trip for one lightweight
  database query.

Older raw measurements below may include extra rows from the previous diagnostic
output.

## Summary

| Environment | Avg total | P50 total | P90 total | Avg database |
| --- | ---: | ---: | ---: | ---: |
| Washington backend + Washington database | 338.2 ms | 305.7 ms | 410.6 ms | 7.6 ms |
| Singapore backend + Washington database | 537.3 ms | 413.8 ms | 691.2 ms | 252.2 ms |
| Singapore backend + Singapore database | 198.3 ms | 180.9 ms | 239.9 ms | 6.6 ms |

Decision note: Singapore backend plus Singapore database is the best measured
layout so far. Keeping the backend in Singapore while the database stayed in
Washington made backend/database latency dominate the request.

## Raw Measurements

### Washington Backend + Washington Database

Latency diagnostics, 30 samples, 2026-07-21T01:05:53.713Z.

| Metric | Avg | Min | P10 | P50 | P90 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frontend -> Backend -> Database | 338.2 ms | 269.1 ms | 277.3 ms | 305.7 ms | 410.6 ms | 960.2 ms |
| Backend handler | 7.6 ms | 3.9 ms | 5.0 ms | 5.6 ms | 10.3 ms | 42.9 ms |
| Backend -> Database | 7.6 ms | 3.9 ms | 5.0 ms | 5.6 ms | 10.3 ms | 42.9 ms |
| Frontend/backend overhead | 330.6 ms | 264.1 ms | 272.1 ms | 298.2 ms | 405.0 ms | 917.3 ms |

### Singapore Backend + Washington Database

Latency diagnostics, 30 samples, 2026-07-21T01:11:46.043Z.

| Metric | Avg | Min | P10 | P50 | P90 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frontend -> Backend -> Database | 537.3 ms | 375.5 ms | 377.4 ms | 413.8 ms | 691.2 ms | 1697.5 ms |
| Backend handler | 252.2 ms | 219.4 ms | 219.5 ms | 220.3 ms | 222.2 ms | 702.8 ms |
| Backend -> Database | 252.2 ms | 219.4 ms | 219.5 ms | 220.3 ms | 222.2 ms | 702.8 ms |
| Frontend/backend overhead | 285.1 ms | 155.4 ms | 157.9 ms | 193.7 ms | 471.6 ms | 994.7 ms |

### Singapore Backend + Singapore Database

Latency diagnostics, 30 samples, 2026-07-21T01:30:31.432Z.

| Metric | Avg | Min | P10 | P50 | P90 | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frontend -> Backend -> Database | 198.3 ms | 152.5 ms | 159.4 ms | 180.9 ms | 239.9 ms | 420.7 ms |
| Backend handler | 6.6 ms | 4.4 ms | 5.7 ms | 6.7 ms | 7.5 ms | 8.1 ms |
| Backend -> Database | 6.6 ms | 4.4 ms | 5.7 ms | 6.7 ms | 7.5 ms | 8.1 ms |
| Frontend/backend overhead | 191.7 ms | 147.3 ms | 152.5 ms | 173.7 ms | 233.0 ms | 412.7 ms |
