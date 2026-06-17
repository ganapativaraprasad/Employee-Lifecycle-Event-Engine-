# Load Test Report Template

Fill this table with numbers collected from baseline and cached runs.

| Endpoint | p50 Before | p50 After | p95 Before | p95 After | p99 Before | p99 After | RPS Before | RPS After | Improvement |
|---|---|---|---|---|---|---|---|---|
| GET /api/v1/employees |  |  |  |  |  |  |  |  |
| GET /api/v1/employees/{id} |  |  |  |  |  |  |  |  |
| GET /api/v1/dashboard/stats |  |  |  |  |  |  |  |  |
| PATCH /api/v1/employees/{id}/transition |  |  |  |  |  |  |  |  |

Notes:
- Populate the table with values from the generated Locust CSVs (p50, p95, p99, requests/sec).
- `Improvement` can be computed as percentage RPS or latency improvement.
