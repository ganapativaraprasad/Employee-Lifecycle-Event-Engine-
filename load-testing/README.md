# Load Testing — Employee Lifecycle Engine

This folder contains Locust load tests and instructions for running baseline and cached comparisons.

Prerequisites
- Python 3.12
- Docker-compose stack running the application at `http://localhost:8000` (optional — you can run Locust against any accessible host)
- Locust (installed via `pip install -r requirements.txt`)

Environment variables
- `HRMS_USERNAME` and `HRMS_PASSWORD` — credentials used to log in. Do NOT hardcode tokens; set these in your environment.
- `EMPLOYEES_P95_THRESHOLD_MS` — optional override for the p95 threshold (defaults to `300`).

Running Locust (headless)

Baseline (no Redis):
```
locust --headless -u 100 -r 10 --run-time 90s --host http://localhost:8000 --csv=results/baseline
```

With Redis (cached):
```
locust --headless -u 100 -r 10 --run-time 90s --host http://localhost:8000 --csv=results/with_redis
```

CSV outputs
- Locust will write a set of CSVs prefixed with the `--csv` option (e.g. `results/baseline_stats.csv`). These include per-endpoint statistics and request distribution.

Interpreting results
- p50: median latency — 50% of requests are faster than this value.
- p95: 95th percentile latency — critical for user experience. The test includes a hook that fails the run if `p95` for `GET /api/v1/employees` exceeds `300ms` (configurable via `EMPLOYEES_P95_THRESHOLD_MS`).
- p99: 99th percentile latency — tail latency measure.
- requests/sec: throughput measured by Locust.
- failures: number of failed requests.

Notes
- Provide valid credentials via env vars before running; the test will not hardcode any tokens.
- The test will gracefully handle transient errors and will not crash Locust.
