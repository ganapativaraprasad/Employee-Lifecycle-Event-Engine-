import json
import asyncio
import logging
from typing import Optional, Any, cast

logger = logging.getLogger(__name__)

# Producer may be an aiokafka AIOKafkaProducer instance when available
producer: Optional[Any] = None


async def start_producer() -> None:
    """Initialize a singleton AIOKafkaProducer with retry and structured logging.

    If Kafka is unreachable after retries, leave `producer` as None and continue.
    """
    global producer

    try:
        from aiokafka import AIOKafkaProducer  # imported at runtime

        producer = AIOKafkaProducer(
            bootstrap_servers="kafka:9092",
            value_serializer=lambda v: json.dumps(v).encode()
        )
    except Exception as e:
        logger.warning("aiokafka not available; starting without Kafka: %s", e)
        producer = None
        return

    for attempt in range(10):
        try:
            await cast(Any, producer).start()
            logger.info("Kafka producer started")
            return
        except Exception as e:
            logger.warning("Kafka not ready, retrying... (%d/10): %s", attempt + 1, e)
            await asyncio.sleep(5)

    logger.error("Could not connect to Kafka after retries; proceeding without Kafka")
    producer = None


async def stop_producer() -> None:
    global producer
    if producer:
        try:
            await cast(Any, producer).stop()
            logger.info("Kafka producer stopped")
        except Exception:
            logger.exception("Error while stopping Kafka producer")


def _schedule_send(topic: str, payload: dict[str, Any]) -> None:
    async def _send() -> None:
        try:
            if producer is None:
                logger.debug("Producer not available; skipping send to %s", topic)
                return
            await cast(Any, producer).send_and_wait(topic, payload)
            logger.debug("Published event to topic %s: %s", topic, payload)
        except Exception:
            logger.exception("Failed to publish event to topic %s", topic)

    asyncio.create_task(_send())


async def publish_event(topic: str, payload: dict[str, Any]) -> None:
    """Non-blocking publish: schedule send in background and return quickly."""
    if producer is None:
        logger.debug("Producer not available; dropping event to %s", topic)
        return

    _schedule_send(topic, payload)