from __future__ import annotations

import os
import random
import time
import statistics
from collections import deque
from typing import Any, Deque, Dict, List, Optional

from locust import HttpUser, task, between, events, constant_pacing

# Read credentials from environment variables (do NOT hardcode tokens)
HRMS_USERNAME = os.getenv("HRMS_USERNAME")
HRMS_PASSWORD = os.getenv("HRMS_PASSWORD")

# Request name used for employee list so the monitoring hook can match it
EMPLOYEES_LIST_NAME = "GET /api/v1/employees/"

# p95 threshold in milliseconds
EMPLOYEES_P95_THRESHOLD_MS = int(os.getenv("EMPLOYEES_P95_THRESHOLD_MS", "300"))


class HRMSUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self) -> None:
        self.token: Optional[str] = None
        self.auth_headers: Dict[str, str] = {}
        # local cache of employee ids
        self.employee_ids: List[str] = []
        self.auth_ready: bool = False
        # attempt login if credentials provided
        if HRMS_USERNAME and HRMS_PASSWORD:
            # try to obtain a token before starting workload
            import gevent

            max_attempts = 10
            for attempt in range(max_attempts):
                self.login()
                if self.token:
                    self.auth_ready = True
                    break
                gevent.sleep(1)

            if not self.token:
                print("Warning: could not obtain auth token in on_start; tasks will wait until auth is available")

    def login(self) -> None:
        try:
            resp = self.client.post(
                "/api/v1/auth/login",
                data={"username": HRMS_USERNAME, "password": HRMS_PASSWORD},
                catch_response=True,
                name="POST /api/v1/auth/login",
            )
        except Exception as exc:  # network issues
            # network error during login - log and return
            print(f"login network error: {exc}")
            return

        if resp.status_code != 200:
            # do not treat transient login failures as catastrophic here
            print(f"login failed: {resp.status_code} {resp.text}")
            return

        body = resp.json()
        token = body.get("access_token")
        if not token:
            resp.failure("no access_token in login response")
            return

        self.token = token
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        self.auth_ready = True

    def ensure_auth(self, resp) -> bool:
        # If we get 401/403 attempt to re-login once
        if resp.status_code in (401, 403):
            if HRMS_USERNAME and HRMS_PASSWORD:
                self.login()
                return True
        return False

    def _refresh_employee_ids(self) -> None:
        # Query first page to collect ids
        try:
            resp = self.client.get(
                "/api/v1/employees/",
                headers=self.auth_headers,
                name=EMPLOYEES_LIST_NAME,
            )
        except Exception:
            return

        if resp.status_code != 200:
            # attempt to re-auth if 401/403
            if resp.status_code in (401, 403) and self.ensure_auth(resp):
                try:
                    resp = self.client.get(
                        "/api/v1/employees/",
                        headers=self.auth_headers,
                        name=EMPLOYEES_LIST_NAME,
                    )
                except Exception:
                    return
                if resp.status_code != 200:
                    return
            else:
                return

        try:
            data = resp.json()
            items = data.get("items", [])
            ids = [item.get("id") for item in items if item.get("id")]
            self.employee_ids = ids
        except Exception:
            # malformed response, ignore
            self.employee_ids = []
            # malformed response, ignore
            self.employee_ids = []

    @task(1)
    def login_task(self) -> None:
        if not (HRMS_USERNAME and HRMS_PASSWORD):
            return  # skip if no creds provided
        self.login()

    @task(4)
    def list_employees(self) -> None:
        # Highest weight task. Use catch_response to validate.
        try:
            start = time.time()
            with self.client.get(
                "/api/v1/employees/",
                headers=self.auth_headers,
                catch_response=True,
                name=EMPLOYEES_LIST_NAME,
            ) as resp:

                if resp.status_code != 200:
                    # if auth error, try to re-auth and retry once without marking failure
                    if resp.status_code in (401, 403) and self.ensure_auth(resp):
                        # retry once
                        try:
                            with self.client.get("/api/v1/employees/", headers=self.auth_headers, catch_response=True, name=EMPLOYEES_LIST_NAME) as resp2:
                                if resp2.status_code != 200:
                                    resp2.failure(f"unexpected status after re-auth: {resp2.status_code}")
                                    return
                                data = resp2.json()
                                if not isinstance(data, dict) or "items" not in data:
                                    resp2.failure("response structure mismatch after re-auth: missing items")
                                    return
                                items = data.get("items") or []
                                ids = [it.get("id") for it in items if it.get("id")]
                                if ids:
                                    self.employee_ids = ids
                                duration_ms = (time.time() - start) * 1000.0
                                _record_employees_latency(duration_ms)
                                return
                        except Exception as exc:
                            print(f"list_employees retry network error: {exc}")
                            return
                    # non-auth error: mark failure
                    resp.failure(f"unexpected status: {resp.status_code}")
                    return

                data = None
                try:
                    data = resp.json()
                except Exception:
                    resp.failure("invalid json in /employees response")
                    return

                if not isinstance(data, dict) or "items" not in data:
                    resp.failure("response structure mismatch: missing items")
                    return

                # success: update local employee id cache
                items = data.get("items") or []
                ids = [it.get("id") for it in items if it.get("id")]
                if ids:
                    self.employee_ids = ids
                # record latency for p95 monitoring
                try:
                    duration_ms = (time.time() - start) * 1000.0
                    _record_employees_latency(duration_ms)
                except Exception:
                    pass

        except Exception as exc:
            # network error while listing employees
            print(f"list_employees network error: {exc}")

    @task(3)
    def get_employee_detail(self) -> None:
        # ensure we have ids
        if not self.employee_ids:
            self._refresh_employee_ids()
            if not self.employee_ids:
                return

        emp_id = random.choice(self.employee_ids)
        name = "GET /api/v1/employees/{id}"
        try:
            resp = self.client.get(f"/api/v1/employees/{emp_id}", headers=self.auth_headers, name=name)
        except Exception as exc:
            # network error fetching detail
            print(f"get_employee_detail network error: {exc}")
            return

        if resp.status_code == 404:
            # employee deleted concurrently - refresh ids
            self._refresh_employee_ids()
            return

        if resp.status_code != 200:
            # if auth error, attempt re-auth and retry once without counting as failure
            if resp.status_code in (401, 403) and self.ensure_auth(resp):
                try:
                    resp2 = self.client.get(f"/api/v1/employees/{emp_id}", headers=self.auth_headers, name=name)
                    if resp2.status_code == 200:
                        return
                except Exception:
                    return
            # otherwise record failure
            print(f"get_employee_detail unexpected status: {resp.status_code}")
            return

    @task(2)
    def get_dashboard_stats(self) -> None:
        name = "GET /api/v1/dashboard/stats"
        try:
            resp = self.client.get("/api/v1/dashboard/stats", headers=self.auth_headers, name=name)
        except Exception as exc:
            # network error fetching dashboard
            print(f"get_dashboard_stats network error: {exc}")
            return

        if resp.status_code != 200:
            if resp.status_code in (401, 403) and self.ensure_auth(resp):
                try:
                    resp2 = self.client.get("/api/v1/dashboard/stats", headers=self.auth_headers, name=name)
                    if resp2.status_code == 200:
                        return
                except Exception:
                    return
            print(f"get_dashboard_stats unexpected status: {resp.status_code}")
            return

    @task(1)
    def trigger_transition(self) -> None:
        # pick random employee and attempt allowed transition
        if not self.employee_ids:
            self._refresh_employee_ids()
            if not self.employee_ids:
                return

        emp_id = random.choice(self.employee_ids)
        # fetch current employee state
        try:
            resp = self.client.get(f"/api/v1/employees/{emp_id}", headers=self.auth_headers, name="GET /api/v1/employees/{id}")
        except Exception as exc:
            # network error fetching current employee for transition
            print(f"trigger_transition fetch network error: {exc}")
            return

        if resp.status_code != 200:
            return

        try:
            emp = resp.json()
            current_state = emp.get("current_state")
        except Exception:
            return

        # Define allowed transitions matching server-side FSM
        ALLOWED_TRANSITIONS = {
            "HIRED": ["ONBOARDING"],
            "ONBOARDING": ["ACTIVE"],
            "ACTIVE": ["ON_LEAVE", "TRANSFERRED", "SUSPENDED", "OFFBOARDED"],
            "ON_LEAVE": ["ACTIVE", "OFFBOARDED"],
            "TRANSFERRED": ["ACTIVE"],
            "SUSPENDED": ["ACTIVE", "OFFBOARDED"],
            "OFFBOARDED": ["ACTIVE"],
        }

        possible = ALLOWED_TRANSITIONS.get(current_state, [])
        if not possible:
            return

        new_state = random.choice(possible)
        payload = {"new_state": new_state, "reason": "load test transition"}

        try:
            patch_resp = self.client.patch(f"/api/v1/employees/{emp_id}/transition", json=payload, headers=self.auth_headers, name="PATCH /api/v1/employees/{id}/transition")
        except Exception as exc:
            # network error during transition
            print(f"trigger_transition patch network error: {exc}")
            return
        if patch_resp.status_code >= 400:
            # on auth errors try re-auth + retry once without recording failure
            if patch_resp.status_code in (401, 403) and self.ensure_auth(patch_resp):
                try:
                    patch_resp2 = self.client.patch(f"/api/v1/employees/{emp_id}/transition", json=payload, headers=self.auth_headers, name="PATCH /api/v1/employees/{id}/transition")
                    if patch_resp2.status_code < 400:
                        return
                except Exception:
                    return
            # otherwise log the failure
            print(f"transition failed status: {patch_resp.status_code}")


# Shared structure to collect latencies for GET /employees
EMPLOYEES_LATENCIES: Deque[float] = deque(maxlen=20000)


def _record_employees_latency(response_time_ms: float) -> None:
    # response_time provided in ms
    EMPLOYEES_LATENCIES.append(response_time_ms)


def monitor_threshold(environment, check_interval: float = 2.0) -> None:
    # This runs in a greenlet while the test is running
    while True:
        time.sleep(check_interval)
        latencies = list(EMPLOYEES_LATENCIES)
        # only evaluate after we have a reasonable sample size
        if len(latencies) < 100:
            continue

        p50 = statistics.quantiles(latencies, n=100)[49]
        p95 = statistics.quantiles(latencies, n=100)[94]
        p99 = statistics.quantiles(latencies, n=100)[98]

        if p95 > EMPLOYEES_P95_THRESHOLD_MS:
            msg = f"p95 for {EMPLOYEES_LIST_NAME} exceeded threshold: {p95:.2f}ms > {EMPLOYEES_P95_THRESHOLD_MS}ms"
            print(msg)
            # mark failure in Locust and stop the runner gracefully
            environment.process_exit_code = 1
            try:
                environment.runner.quit()
            except Exception:
                pass
            return


@events.test_start.add_listener
def on_test_start(environment, **kwargs: Any) -> None:
    # spawn monitor greenlet
    import gevent

    gevent.spawn(monitor_threshold, environment)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs: Any) -> None:
    # Print final percentiles and pass/fail result
    latencies = list(EMPLOYEES_LATENCIES)
    if not latencies:
        print("No employee list samples recorded")
        return

    # compute percentiles
    try:
        p50 = statistics.quantiles(latencies, n=100)[49]
        p95 = statistics.quantiles(latencies, n=100)[94]
        p99 = statistics.quantiles(latencies, n=100)[98]
    except Exception:
        p50 = p95 = p99 = 0.0

    print(f"Final latencies for {EMPLOYEES_LIST_NAME}: p50={p50:.2f}ms p95={p95:.2f}ms p99={p99:.2f}ms")
    if p95 > EMPLOYEES_P95_THRESHOLD_MS:
        print(f"THRESHOLD FAILED: p95 {p95:.2f}ms > {EMPLOYEES_P95_THRESHOLD_MS}ms")
    else:
        print(f"THRESHOLD PASSED: p95 {p95:.2f}ms <= {EMPLOYEES_P95_THRESHOLD_MS}ms")
