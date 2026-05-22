from beanie import Document

from pydantic import EmailStr

from typing import Optional

from datetime import datetime

from pymongo import IndexModel

from app.core.enums.employee_state import (
    EmployeeState
)

class Employee(Document):

    employee_code: str

    first_name: str
    last_name: str

    email: EmailStr

    department: str
    designation: str

    current_state: EmployeeState = (
        EmployeeState.ONBOARDING
    )

    manager_id: Optional[str] = None

    documents: list[str] = []

    is_deleted: bool = False

    created_at: datetime = datetime.utcnow()

    updated_at: datetime = datetime.utcnow()

    class Settings:

        name = "employees"

        indexes = [

            IndexModel(
                [("employee_code", 1)],
                unique=True
            ),

            IndexModel(
                [("email", 1)],
                unique=True
            ),

            IndexModel(
                [("department", 1)]
            ),

            IndexModel(
                [("current_state", 1)]
            )
        ]