from pydantic import BaseModel

from app.core.enums.employee_state import (
    EmployeeState
)


class TransitionSchema(BaseModel):
    new_state: EmployeeState
    reason: str