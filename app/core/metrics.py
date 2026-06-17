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

# Cache metrics
cache_hits_total = Counter(
    "cache_hits_total",
    "Total number of cache hits"
)

cache_misses_total = Counter(
    "cache_misses_total",
    "Total number of cache misses"
)

cache_hit_rate = Gauge(
    "cache_hit_rate",
    "Cache hit rate (hits / (hits + misses))"
)