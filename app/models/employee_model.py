from typing import Optional

from app.models.base_model import BaseDocument
from app.core.enums.employee_state import EmployeeState


class Employee(BaseDocument):
    employee_code: str
    first_name: str
    last_name: str
    email: str
    department: str
    designation: str

    current_state: EmployeeState = EmployeeState.HIRED

    manager_id: Optional[str] = None

    class Settings:
        name = "employees"