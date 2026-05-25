from fastapi import APIRouter

from app.models.employee_model import Employee

from app.core.enums.employee_state import (
    EmployeeState
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
async def get_dashboard_stats():

    total_employees = await Employee.find(
        Employee.is_deleted == False
    ).count()

    active_employees = await Employee.find(
        Employee.current_state == EmployeeState.ACTIVE,
        Employee.is_deleted == False
    ).count()

    onboarding_employees = await Employee.find(
        Employee.current_state == EmployeeState.ONBOARDING,
        Employee.is_deleted == False
    ).count()

    offboarded_employees = await Employee.find(
        Employee.current_state == EmployeeState.OFFBOARDED,
        Employee.is_deleted == False
    ).count()

    return {

        "total_employees": total_employees,

        "active_employees": active_employees,

        "onboarding_employees": onboarding_employees,

        "offboarded_employees": offboarded_employees
    }