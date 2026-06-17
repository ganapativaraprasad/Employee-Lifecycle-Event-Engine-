import json
from typing import Any, List, cast

from redis.asyncio import Redis
from fastapi.encoders import jsonable_encoder

from app.core.config import settings
from app.core import metrics

redis_client = Redis.from_url(
    settings.redis_url,
    decode_responses=True
)


async def _update_hit_rate() -> None:
    # Use internal counter value to compute rate. Cast to Any to appease mypy.
    hits = cast(Any, metrics.cache_hits_total)._value.get()
    misses = cast(Any, metrics.cache_misses_total)._value.get()
    denom = hits + misses
    if denom == 0:
        metrics.cache_hit_rate.set(0.0)
    else:
        metrics.cache_hit_rate.set(hits / denom)


async def get_cached(key: str) -> Any:
    """Return decoded JSON value for `key` or `None`.

    Updates Prometheus cache hit/miss counters and the hit-rate gauge.
    """
    data = await redis_client.get(key)

    if data:
        metrics.cache_hits_total.inc()
        await _update_hit_rate()
        try:
            return json.loads(data)
        except Exception:
            # If stored blob isn't JSON for some reason, return raw string
            return data

    metrics.cache_misses_total.inc()
    await _update_hit_rate()
    return None


async def set_cached(
    key: str,
    value: Any,
    ttl: int,
) -> None:
    # Ensure value is JSON-serializable (ObjectId/datetime/enum handled)
    encoded = jsonable_encoder(value)
    await redis_client.set(
        key,
        json.dumps(encoded, default=str),
        ex=ttl
    )


async def invalidate(key: str) -> None:
    await redis_client.delete(key)


async def invalidate_pattern(pattern: str) -> None:
    """Delete all keys matching the given glob-style pattern.

    Uses SCAN to iterate matching keys and deletes them in batches to avoid
    blocking Redis on large keyspaces.
    """
    cursor = 0
    keys_to_delete: List[str] = []
    while True:
        cursor, keys = await redis_client.scan(cursor=cursor, match=pattern, count=100)
        if keys:
            # redis-py's return type can be `List[bytes] | List[str]` depending
            # on `decode_responses`. Cast to `List[str]` to satisfy mypy.
            keys_to_delete.extend(cast(List[str], keys))
        if cursor == 0:
            break

    if not keys_to_delete:
        return

    # delete in chunks
    chunk_size = 100
    for i in range(0, len(keys_to_delete), chunk_size):
        chunk = keys_to_delete[i:i + chunk_size]
        await redis_client.delete(*chunk)