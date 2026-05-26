from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.core.enums.employee_state import EmployeeState


class EmployeeCreateSchema(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    designation: str


class EmployeeResponseSchema(BaseModel):

    id: str
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    designation: str
    current_state: EmployeeState
    created_at: datetime

    class Config:
        from_attributes = True

from typing import Optional

class EmployeeUpdateSchema(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None


class EmployeeListResponseSchema(BaseModel):
    items: list[EmployeeResponseSchema]
    total: int
    page: int
    limit: int