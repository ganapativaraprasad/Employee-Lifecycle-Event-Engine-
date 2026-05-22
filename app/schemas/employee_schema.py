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