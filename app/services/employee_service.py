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
from app.queue.event_queue import (
    publish_event
)

from app.websocket.manager import manager

from app.services.notification_service import (
    send_status_change_email
)

class EmployeeService:

    @staticmethod
    async def create_employee(
        employee_data: EmployeeCreateSchema
    ):

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
    ):

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

        await send_status_change_email(
            employee_email=employee.email,
            employee_name=employee.first_name,
            old_state=current_state,
            new_state=new_state
        )
        await manager.broadcast(
            f"Employee {employee.employee_code} moved from {current_state} to {new_state}"
            )

        audit_log = AuditLog(
            employee_id=str(employee.id),

            actor_id=actor_id,

            action=AuditAction.TRANSITION,

            old_state=current_state,
            new_state=new_state,

            reason=transition_data.reason
        )

        await audit_log.insert()
        
        await publish_event(
            event_name="EMPLOYEE_STATE_CHANGED",
            payload={
            "employee_id": str(employee.id),
            "old_state": current_state,
            "new_state": new_state
            }
        )

        return employee