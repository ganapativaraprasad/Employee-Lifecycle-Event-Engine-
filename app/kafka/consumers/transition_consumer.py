import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.core.metrics import (
    employee_state_transitions_total,
    active_employees_gauge
)
from app.models.employee_model import Employee
from app.core.enums.employee_state import EmployeeState

logger = logging.getLogger(__name__)

_consumer: Optional[AIOKafkaConsumer] = None
_task: Optional[asyncio.Task] = None


async def _consume() -> None:
    global _consumer
    try:
        _consumer = AIOKafkaConsumer(
            "employee.state.transitions",
            bootstrap_servers="kafka:9092",
            group_id="transition-consumer",
            value_deserializer=lambda v: json.loads(v.decode())
        )

        await _consumer.start()
        logger.info("Transition consumer started")

        async for msg in _consumer:
            try:
                payload = msg.value
                logger.debug("Transition message received: %s", payload)

                from_state = payload.get("from_state")
                to_state = payload.get("to_state")
                role = payload.get("role", "unknown")

                # Update Prometheus metrics
                employee_state_transitions_total.labels(
                    from_state=from_state,
                    to_state=to_state,
                    role=role
                ).inc()

                # Recompute active employees count from DB
                try:
                    active_count = await Employee.find(
                        Employee.current_state == EmployeeState.ACTIVE
                    ).count()
                    active_employees_gauge.set(active_count)
                except Exception:
                    logger.exception("Failed to update active employees gauge")

            except Exception:
                logger.exception("Failed to process transition message")

    except asyncio.CancelledError:
        logger.info("Transition consumer cancelled")
        raise
    except Exception:
        logger.exception("Transition consumer error")
    finally:
        if _consumer:
            await _consumer.stop()
            logger.info("Transition consumer stopped")


def start_consumer() -> asyncio.Task:
    global _task
    loop = asyncio.get_event_loop()
    _task = loop.create_task(_consume())
    return _task


async def stop_consumer() -> None:
    global _task
    if _task:
        _task.cancel()
        try:
            await _task
        except asyncio.CancelledError:
            pass
 