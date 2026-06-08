from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.core.enums.employee_state import EmployeeState
from app.core.enums.user_role import UserRole
from app.models.audit_log_model import AuditLog
from app.models.employee_model import Employee
from app.models.user_model import User
from typing import Any

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
) -> dict[str, Any]:

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

    on_leave_employees = await Employee.find(
        Employee.current_state == EmployeeState.ON_LEAVE,
        Employee.is_deleted == False
    ).count()

    suspended_employees = await Employee.find(
        Employee.current_state == EmployeeState.SUSPENDED,
        Employee.is_deleted == False
    ).count()

    offboarded_employees = await Employee.find(
        Employee.current_state == EmployeeState.OFFBOARDED,
        Employee.is_deleted == False
    ).count()

    department_distribution = await Employee.aggregate(
        [
            {"$match": {"is_deleted": False}},
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
    ).to_list()

    recent_activities = await AuditLog.find().sort(
        "-created_at"
    ).limit(8).to_list()

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "onboarding_employees": onboarding_employees,
        "on_leave_employees": on_leave_employees,
        "suspended_employees": suspended_employees,
        "offboarded_employees": offboarded_employees,
        "department_distribution": [
            {
                "department": item.get("_id") or "Unassigned",
                "count": item.get("count", 0)
            }
            for item in department_distribution
        ],
        "recent_activities": [
            {
                "employee_id": log.employee_id,
                "actor_id": log.actor_id,
                "action": log.action,
                "old_state": log.old_state,
                "new_state": log.new_state,
                "reason": log.reason,
                "created_at": log.created_at
            }
            for log in recent_activities
        ]
    }