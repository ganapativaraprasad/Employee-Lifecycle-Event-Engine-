import json
import logging
from typing import Any, List, cast

from redis.asyncio import Redis
from redis.exceptions import TimeoutError as RedisTimeoutError, ConnectionError as RedisConnectionError
from fastapi.encoders import jsonable_encoder

from app.core.config import settings
from app.core import metrics

logger = logging.getLogger(__name__)

# Create Redis client with conservative timeouts so Redis failures are
# fast and don't block the API. Operations below are individually wrapped
# to ensure Redis unavailability never crashes the application.
redis_client = Redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
    retry_on_timeout=True,
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
    try:
        data = await redis_client.get(key)
    except (RedisTimeoutError, RedisConnectionError) as exc:
        logger.warning("Redis GET failed for key=%s: %s", key, exc)
        return None
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Unexpected Redis error on GET for key=%s: %s", key, exc)
        return None

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
    try:
        await redis_client.set(
            key,
            json.dumps(encoded, default=str),
            ex=ttl
        )
    except (RedisTimeoutError, RedisConnectionError) as exc:
        logger.warning("Redis SET skipped for key=%s due to error: %s", key, exc)
        return
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Unexpected Redis error on SET for key=%s: %s", key, exc)
        return


async def invalidate(key: str) -> None:
    try:
        await redis_client.delete(key)
    except (RedisTimeoutError, RedisConnectionError) as exc:
        logger.warning("Redis DELETE skipped for key=%s due to error: %s", key, exc)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Unexpected Redis error on DELETE for key=%s: %s", key, exc)


async def invalidate_pattern(pattern: str) -> None:
    """Delete all keys matching the given glob-style pattern.

    Uses SCAN to iterate matching keys and deletes them in batches to avoid
    blocking Redis on large keyspaces.
    """
    cursor = 0
    keys_to_delete: List[str] = []
    try:
        while True:
            cursor, keys = await redis_client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                # redis-py's return type can be `List[bytes] | List[str]` depending
                # on `decode_responses`. Cast to `List[str]` to satisfy mypy.
                keys_to_delete.extend(cast(List[str], keys))
            if cursor == 0:
                break
    except (RedisTimeoutError, RedisConnectionError) as exc:
        logger.warning("Redis SCAN skipped for pattern=%s due to error: %s", pattern, exc)
        return
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Unexpected Redis error on SCAN for pattern=%s: %s", pattern, exc)
        return

    if not keys_to_delete:
        return

    # delete in chunks
    chunk_size = 100
    for i in range(0, len(keys_to_delete), chunk_size):
        chunk = keys_to_delete[i:i + chunk_size]
        try:
            await redis_client.delete(*chunk)
        except (RedisTimeoutError, RedisConnectionError) as exc:
            logger.warning("Redis batch DELETE skipped for keys starting at index %d due to error: %s", i, exc)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Unexpected Redis error on batch DELETE for keys starting at index %d: %s", i, exc)