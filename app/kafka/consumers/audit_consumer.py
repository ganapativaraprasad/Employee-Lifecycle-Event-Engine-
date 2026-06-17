import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.models.audit_log_model import AuditLog
from app.core.enums.audit_action import AuditAction

logger = logging.getLogger(__name__)

_consumer: Optional[AIOKafkaConsumer] = None
_task: Optional[asyncio.Task] = None


async def _consume() -> None:
    global _consumer
    try:
        _consumer = AIOKafkaConsumer(
            "employee.audit.events",
            bootstrap_servers="kafka:9092",
            group_id="audit-consumer",
            value_deserializer=lambda v: json.loads(v.decode())
        )

        await _consumer.start()
        logger.info("Audit consumer started")

        async for msg in _consumer:
            try:
                payload = msg.value
                logger.debug("Audit message received: %s", payload)

                event_type = payload.get("event_type")
                employee_id = payload.get("employee_id")
                actor_id = payload.get("actor_id")
                # timestamp = payload.get("timestamp")
                metadata = payload.get("metadata", {})

                # Map event types to AuditAction where applicable
                action = AuditAction.TRANSITION if event_type == "EMPLOYEE_STATE_CHANGED" else AuditAction.TRANSITION

                audit_log = AuditLog(
                    employee_id=employee_id,
                    actor_id=actor_id,
                    action=action,
                    old_state=metadata.get("old_state"),
                    new_state=metadata.get("new_state"),
                    reason=metadata.get("reason") if metadata else None
                )

                await audit_log.insert()

            except Exception:
                logger.exception("Failed to process audit message")

    except asyncio.CancelledError:
        logger.info("Audit consumer cancelled")
        raise
    except Exception:
        logger.exception("Audit consumer error")
    finally:
        if _consumer:
            await _consumer.stop()
            logger.info("Audit consumer stopped")


def start_consumer() -> asyncio.Task:
    # global _task
    _task = asyncio.create_task(_consume())
    return _task


async def stop_consumer() -> None:
    # global _task
    if _task:
        _task.cancel()
        try:
            await _task
        except asyncio.CancelledError:
            pass
 