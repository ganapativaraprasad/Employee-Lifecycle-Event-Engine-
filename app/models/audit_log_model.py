from app.models.base_model import BaseDocument
from app.core.enums.audit_action import AuditAction
from app.core.enums.employee_state import EmployeeState


class AuditLog(BaseDocument):
    employee_id: str
    actor_id: str

    action: AuditAction

    old_state: EmployeeState
    new_state: EmployeeState

    reason: str

    class Settings:
        name = "audit_logs"