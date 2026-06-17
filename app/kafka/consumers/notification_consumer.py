import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.services.notification_service import (
    send_status_change_email,
    send_welcome_email
)
from app.websocket.manager import manager
from app.models.employee_model import Employee

logger = logging.getLogger(__name__)

_consumer: Optional[AIOKafkaConsumer] = None
_task: Optional[asyncio.Task] = None


async def _consume() -> None:
    global _consumer
    try:
        _consumer = AIOKafkaConsumer(
            "employee.notifications",
            bootstrap_servers="kafka:9092",
            group_id="notification-consumer",
            value_deserializer=lambda v: json.loads(v.decode())
        )

        await _consumer.start()
        logger.info("Notification consumer started")

        async for msg in _consumer:
            try:
                payload = msg.value
                logger.debug("Notification message received: %s", payload)

                employee_id = payload.get("employee_id")
                email = payload.get("email")
                notification_type = payload.get("notification_type")
                message = payload.get("message")

                # Send emails for known notification types
                if notification_type == "STATE_CHANGE":
                    # Resolve employee name and send email asynchronously
                    async def _send():
                        try:
                            emp = None
                            if employee_id:
                                emp = await Employee.get(employee_id)
                            name = emp.first_name if emp else ""
                            await send_status_change_email(
                                employee_email=email,
                                employee_name=name,
                                old_state=payload.get("from_state"),
                                new_state=payload.get("to_state")
                            )
                        except Exception:
                            logger.exception("Failed to send state change email")

                    asyncio.create_task(_send())

                # Broadcast websocket notification
                try:
                    await manager.broadcast(message)
                except Exception:
                    logger.exception("Failed to broadcast websocket message")

            except Exception:
                logger.exception("Failed to process notification message")

    except asyncio.CancelledError:
        logger.info("Notification consumer cancelled")
        raise
    except Exception:
        logger.exception("Notification consumer error")
    finally:
        if _consumer:
            await _consumer.stop()
            logger.info("Notification consumer stopped")


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
 