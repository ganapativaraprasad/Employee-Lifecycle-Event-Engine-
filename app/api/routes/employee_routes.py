from fastapi import APIRouter

from app.models.employee_model import Employee
from app.schemas.employee_schema import (
    EmployeeCreateSchema
)

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


@router.post("/")
async def create_employee(
    employee_data: EmployeeCreateSchema
):
    employee = Employee(
        **employee_data.dict()
    )

    await employee.insert()

    return {
        "message": "Employee created successfully",
        "employee_id": str(employee.id)
    }