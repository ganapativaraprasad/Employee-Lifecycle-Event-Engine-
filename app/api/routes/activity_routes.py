from fastapi import APIRouter, Depends
from typing import Any
from app.models.audit_log_model import AuditLog
from app.models.user_model import User
from app.core.dependencies import require_roles
from app.core.enums.user_role import UserRole
from app.core.cache import get_cached, set_cached

router = APIRouter(
    prefix="/activity",
    tags=["Activity"]
)


@router.get("")
async def get_activity(
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
) -> dict[str, Any]:

    key = "activity"
    cached = await get_cached(key)
    if cached:
        return cached

    activities = await AuditLog.find().sort("-created_at").limit(50).to_list()

    result = {
        "activities": [
            {
                "employee_id": a.employee_id,
                "actor_id": a.actor_id,
                "action": a.action,
                "old_state": a.old_state,
                "new_state": a.new_state,
                "reason": a.reason,
                "created_at": a.created_at
            }
            for a in activities
        ]
    }

    await set_cached(key, result, ttl=15)

    return result
