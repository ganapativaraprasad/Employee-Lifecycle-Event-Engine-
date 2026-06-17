from threading import active_count

from fastapi import HTTPException

from app.models.employee_model import Employee
from app.models.audit_log_model import AuditLog

from app.schemas.employee_schema import (
    EmployeeCreateSchema
)

from app.schemas.transition_schema import (
    TransitionSchema
)

from app.core.enums.audit_action import (
    AuditAction
)

from app.core.fsm import (
    is_transition_allowed
)

from app.exceptions.custom_exceptions import (
    EmployeeNotFoundException,
    InvalidTransitionException
)
from app.kafka.producer import (
    publish_event
)

from app.websocket.manager import manager

from app.services.notification_service import (
    send_status_change_email
)
from app.core.enums.employee_state import (
    EmployeeState
)
from app.core.cache import invalidate

class EmployeeService:

    @staticmethod
    async def create_employee(
        employee_data: EmployeeCreateSchema
    ) -> Employee:

        employee = Employee(
            **employee_data.dict()
        )

        await employee.insert()

        return employee
    
    @staticmethod
    async def transition_employee(
        employee_id: str,
        transition_data: TransitionSchema,
        actor_id: str
    ) -> Employee:

        employee = await Employee.get(employee_id)

        if not employee:
            raise EmployeeNotFoundException()

        current_state = employee.current_state
        new_state = transition_data.new_state

        is_allowed = is_transition_allowed(
            current_state,
            new_state
        )

        if not is_allowed:
            raise InvalidTransitionException(
                current_state,
                new_state
            )

        employee.current_state = new_state

        await employee.save()
        # Metrics updates have been moved to Kafka consumers. The API
        # publishes transition events and returns immediately.

        from datetime import datetime
        timestamp = datetime.utcnow().isoformat()

        await publish_event(
            "employee.state.transitions",
            {
                "employee_id": str(employee.id),
                "from_state": current_state,
                "to_state": new_state,
                "role": "HR",
                "timestamp": timestamp,
                "triggered_by": actor_id
            }
        )

        await publish_event(
            "employee.audit.events",
            {
                "event_type": "EMPLOYEE_STATE_CHANGED",
                "employee_id": str(employee.id),
                "actor_id": actor_id,
                "timestamp": timestamp,
                "metadata": {
                    "old_state": current_state,
                    "new_state": new_state,
                    "reason": transition_data.reason
                }
            }
        )

        await publish_event(
            "employee.notifications",
            {
                "employee_id": str(employee.id),
                "email": employee.email,
                "notification_type": "STATE_CHANGE",
                "from_state": current_state,
                "to_state": new_state,
                "message": (
                    f"Employee state changed "
                    f"from {current_state} to {new_state}"
                )
            }
        )

        # Invalidate dashboard cache so stats reflect this transition
        try:
            await invalidate("dashboard:stats")
        except Exception:
            # don't let cache invalidation break the transition
            pass
        # Invalidate employee detail cache
        try:
            await invalidate(f"employee:{str(employee.id)}")
        except Exception:
            pass

        return employee