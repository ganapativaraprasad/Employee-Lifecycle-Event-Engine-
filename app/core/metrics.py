from prometheus_client import Counter, Gauge

employee_state_transitions_total = Counter(
    "employee_state_transitions_total",
    "Total employee state transitions",
    ["from_state", "to_state", "role"]
)

active_employees_gauge = Gauge(
    "active_employees_gauge",
    "Current number of active employees"
)

event_queue_depth = Gauge(
    "event_queue_depth",
    "Current number of events waiting in queue"
)