# Deliverable 3 - Load Testing Report

## Objective

Evaluate HRMS application performance under concurrent load and compare system behavior with and without Redis enabled.

---

## Test Configuration

* Tool: Locust
* Users: 100
* Spawn Rate: 10 users/second
* Duration: 90 seconds
* Host: http://localhost:8000

### Tested Endpoints

* POST /auth/login
* GET /api/v1/employees
* GET /api/v1/employees/{id}
* GET /api/v1/dashboard/stats
* PATCH /api/v1/employees/{id}/transition

---

## Baseline Results (Redis Disabled)

| Endpoint             | Requests | Failures | Median Response (ms) | Avg Response (ms) |
| -------------------- | -------- | -------- | -------------------- | ----------------- |
| GET /dashboard/stats | 42       | 0        | 11000                | 16515             |
| GET /employees       | 148      | 0        | 12000                | 20072             |
| GET /employees/{id}  | 99       | 0        | 8300                 | 8803              |
| PATCH /transition    | 7        | 7        | 40                   | 280               |
| Aggregated           | 296      | 7        | 8700                 | 15330             |

---

## Redis Enabled Results

| Endpoint             | Requests | Failures | Median Response (ms) | Avg Response (ms) |
| -------------------- | -------- | -------- | -------------------- | ----------------- |
| GET /dashboard/stats | 35       | 0        | 2400                 | 12279             |
| GET /employees       | 160      | 0        | 2400                 | 11602             |
| GET /employees/{id}  | 100      | 0        | 740                  | 1296              |
| PATCH /transition    | 18       | 6        | 550                  | 611               |
| Aggregated           | 313      | 6        | 1100                 | 7753              |

---

## Performance Comparison

### GET /dashboard/stats

* Median latency reduced from 11000 ms to 2400 ms
* Approximate improvement: 78%

### GET /employees

* Median latency reduced from 12000 ms to 2400 ms
* Approximate improvement: 80%

### GET /employees/{id}

* Median latency reduced from 8300 ms to 740 ms
* Approximate improvement: 91%

### Overall System

* Aggregated median latency reduced from 8700 ms to 1100 ms
* Approximate improvement: 87%
* Total requests processed increased from 296 to 313

---

## Observations

1. Redis significantly reduced response times for read-heavy endpoints.
2. Employee listing and employee detail APIs showed the largest improvement.
3. Dashboard statistics endpoint also demonstrated noticeable latency reduction.
4. Throughput increased slightly with Redis enabled.
5. Transition endpoint failures are related to business validation and state-transition rules rather than Redis functionality.

---

## Threshold Validation

Target:

* p95 latency for GET /employees < 300 ms

Observed:

* p95 latency for GET /employees = 40000 ms

Result:

* Threshold NOT achieved.

Reason:

* Dataset size, MongoDB query cost, container resource limitations, and load-test environment constraints prevented the target from being reached.
* Redis improved performance substantially compared to the baseline, but additional query optimization and indexing would be required to meet the 300 ms target under 100 concurrent users.

---

## Conclusion

Load testing was successfully completed using Locust. Redis improved application performance across all major read endpoints and reduced overall response latency significantly. Although the predefined p95 target was not achieved, measurable improvements were observed, demonstrating the effectiveness of caching under concurrent load.
