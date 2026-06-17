import json
import asyncio
import logging
from typing import Optional, TYPE_CHECKING, Any, cast

if TYPE_CHECKING:  # pragma: no cover - typing only
    from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

producer: Optional["AIOKafkaProducer"] = None


async def start_producer() -> None:
    """Initialize a singleton AIOKafkaProducer with retry and structured logging."""
    global producer

    producer = AIOKafkaProducer(
        bootstrap_servers="kafka:9092",
        value_serializer=lambda v: json.dumps(v).encode()
    )

    for attempt in range(10):
        try:
            await cast(Any, producer).start()
            logger.info("Kafka producer started")
            return
        except Exception as e:
            logger.warning("Kafka not ready, retrying... (%d/10): %s", attempt + 1, e)
            await asyncio.sleep(5)

    logger.error("Could not connect to Kafka after retries")
    raise RuntimeError("Could not connect to Kafka")


async def stop_producer() -> None:
    # global producer
    if producer:
        try:
            await cast(Any, producer).stop()
            logger.info("Kafka producer stopped")
        except Exception:
            logger.exception("Error while stopping Kafka producer")


async def publish_event(topic: str, payload: dict[str, Any]) -> None:
    """Publish an event to Kafka without blocking request flow.

    This enqueues the message in the producer buffer and returns immediately.
    """
    # global producer
    if producer is None:
        logger.error("Attempted to publish event but producer is not started")
        return

    try:
        # Fire-and-forget: schedule the send but don't await network round-trip
        cast(Any, producer).send(topic, payload)
        logger.debug("Published event to topic %s: %s", topic, payload)
    except Exception:
        logger.exception("Failed to publish event to topic %s", topic)