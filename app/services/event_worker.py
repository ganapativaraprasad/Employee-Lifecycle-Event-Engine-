from app.queue.event_queue import event_queue

from app.services.notification_service import (
    send_status_change_email
)

from app.websocket.manager import manager

from app.models.audit_log_model import AuditLog

from app.core.enums.audit_action import AuditAction


async def process_events():

    while True:

        event = await event_queue.get()

        event_name = event["event_name"]

        payload = event["payload"]

        print(
            f"Processing Event: {event_name}"
        )

        if event_name == "EMPLOYEE_STATE_CHANGED":

            await send_status_change_email(
                employee_email=payload["employee_email"],
                employee_name=payload["employee_name"],
                old_state=payload["old_state"],
                new_state=payload["new_state"]
            )

            await manager.broadcast(
                f"Employee {payload['employee_code']} moved from "
                f"{payload['old_state']} to {payload['new_state']}"
            )

            audit_log = AuditLog(
                employee_id=payload["employee_id"],
                actor_id=payload["actor_id"],
                action=AuditAction.TRANSITION,
                old_state=payload["old_state"],
                new_state=payload["new_state"],
                reason=payload["reason"]
            )

            await audit_log.insert()

        event_queue.task_done()