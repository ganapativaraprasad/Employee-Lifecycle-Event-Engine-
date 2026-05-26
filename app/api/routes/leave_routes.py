from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, require_roles
from app.core.enums.leave_status import LeaveStatus
from app.core.enums.user_role import UserRole
from app.models.employee_model import Employee
from app.models.leave_request_model import LeaveRequest
from app.core.enums.leave_type import LeaveType
from app.models.user_model import User
from app.schemas.leave_schema import (
    LeaveApplySchema,
    LeaveDecisionSchema,
    LeaveListResponseSchema,
    LeaveResponseSchema
)

router = APIRouter(
    prefix="/leaves",
    tags=["Leaves"]
)


def _ensure_date_range(
    start_date: date,
    end_date: date
):

    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date"
        )


async def _resolve_employee(
    current_user: User,
    employee_id: Optional[str]
) -> Employee:

    if current_user.role == UserRole.EMPLOYEE:

        employee = await Employee.find_one(
            Employee.email == current_user.email,
            Employee.is_deleted == False
        )

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee record not found"
            )

        return employee

    if not employee_id:
        raise HTTPException(
            status_code=400,
            detail="Employee ID is required"
        )

    employee = await Employee.get(employee_id)

    if not employee or employee.is_deleted:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


@router.post("/apply", response_model=LeaveResponseSchema)
async def apply_leave(
    payload: LeaveApplySchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
):

    _ensure_date_range(
        payload.start_date,
        payload.end_date
    )

    employee = await _resolve_employee(
        current_user,
        payload.employee_id
    )

    leave = LeaveRequest(
        employee_id=str(employee.id),
        employee_email=employee.email,
        employee_name=f"{employee.first_name} {employee.last_name}",
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        leave_type=payload.leave_type if getattr(payload, 'leave_type', None) else LeaveType.SICK,
        requested_by=str(current_user.id)
    )

    await leave.insert()

    return LeaveResponseSchema(
        id=str(leave.id),
        employee_id=leave.employee_id,
        employee_email=leave.employee_email,
        employee_name=leave.employee_name,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        leave_type=leave.leave_type,
        status=leave.status,
        requested_by=leave.requested_by,
        approved_by=leave.approved_by,
        approved_at=leave.approved_at,
        decision_note=leave.decision_note,
        created_at=leave.created_at
    )


@router.get("/my", response_model=LeaveListResponseSchema)
async def list_my_leaves(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
):

    skip = (page - 1) * limit

    filters = {}

    if current_user.role == UserRole.EMPLOYEE:

        employee = await Employee.find_one(
            Employee.email == current_user.email,
            Employee.is_deleted == False
        )

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee record not found"
            )

        filters["employee_id"] = str(employee.id)

    else:
        filters["requested_by"] = str(current_user.id)

    if status:
        try:
            filters["status"] = LeaveStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid status filter"
            )

    query = LeaveRequest.find(filters)

    total = await query.count()

    leaves = await query.sort(
        ("created_at", -1)
    ).skip(skip).limit(limit).to_list()

    return LeaveListResponseSchema(
        items=[
            LeaveResponseSchema(
                id=str(leave.id),
                employee_id=leave.employee_id,
                employee_email=leave.employee_email,
                employee_name=leave.employee_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                reason=leave.reason,
                leave_type=leave.leave_type,
                status=leave.status,
                requested_by=leave.requested_by,
                approved_by=leave.approved_by,
                approved_at=leave.approved_at,
                decision_note=leave.decision_note,
                created_at=leave.created_at
            )
            for leave in leaves
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.get("/", response_model=LeaveListResponseSchema)
async def list_leaves(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    start_from: Optional[date] = None,
    end_to: Optional[date] = None,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    skip = (page - 1) * limit

    filters = {}

    if status:
        try:
            filters["status"] = LeaveStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid status filter"
            )

    if employee_id:
        filters["employee_id"] = employee_id

    if start_from or end_to:
        date_filter = {}
        if start_from:
            date_filter["$gte"] = start_from
        if end_to:
            date_filter["$lte"] = end_to
        filters["start_date"] = date_filter

    query = LeaveRequest.find(filters)

    total = await query.count()

    leaves = await query.sort(
        ("created_at", -1)
    ).skip(skip).limit(limit).to_list()

    return LeaveListResponseSchema(
        items=[
            LeaveResponseSchema(
                id=str(leave.id),
                employee_id=leave.employee_id,
                employee_email=leave.employee_email,
                employee_name=leave.employee_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                reason=leave.reason,
                leave_type=leave.leave_type,
                status=leave.status,
                requested_by=leave.requested_by,
                approved_by=leave.approved_by,
                approved_at=leave.approved_at,
                decision_note=leave.decision_note,
                created_at=leave.created_at
            )
            for leave in leaves
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.put("/{leave_id}/approve", response_model=LeaveResponseSchema)
async def approve_leave(
    leave_id: str,
    payload: LeaveDecisionSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    leave = await LeaveRequest.get(leave_id)

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be approved"
        )

    leave.status = LeaveStatus.APPROVED
    leave.approved_by = str(current_user.id)
    leave.approved_at = datetime.utcnow()
    leave.decision_note = payload.decision_note
    leave.updated_at = datetime.utcnow()

    await leave.save()

    return LeaveResponseSchema(
        id=str(leave.id),
        employee_id=leave.employee_id,
        employee_email=leave.employee_email,
        employee_name=leave.employee_name,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        leave_type=leave.leave_type,
        status=leave.status,
        requested_by=leave.requested_by,
        approved_by=leave.approved_by,
        approved_at=leave.approved_at,
        decision_note=leave.decision_note,
        created_at=leave.created_at
    )


@router.put("/{leave_id}/reject", response_model=LeaveResponseSchema)
async def reject_leave(
    leave_id: str,
    payload: LeaveDecisionSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    leave = await LeaveRequest.get(leave_id)

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be rejected"
        )

    leave.status = LeaveStatus.REJECTED
    leave.approved_by = str(current_user.id)
    leave.approved_at = datetime.utcnow()
    leave.decision_note = payload.decision_note
    leave.updated_at = datetime.utcnow()

    await leave.save()

    return LeaveResponseSchema(
        id=str(leave.id),
        employee_id=leave.employee_id,
        employee_email=leave.employee_email,
        employee_name=leave.employee_name,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        leave_type=leave.leave_type,
        status=leave.status,
        requested_by=leave.requested_by,
        approved_by=leave.approved_by,
        approved_at=leave.approved_at,
        decision_note=leave.decision_note,
        created_at=leave.created_at
    )


@router.get("/stats")
async def leave_stats(
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    pending = await LeaveRequest.find(
        LeaveRequest.status == LeaveStatus.PENDING
    ).count()

    approved = await LeaveRequest.find(
        LeaveRequest.status == LeaveStatus.APPROVED
    ).count()

    rejected = await LeaveRequest.find(
        LeaveRequest.status == LeaveStatus.REJECTED
    ).count()

    return {
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }


@router.get("/calendar")
async def leave_calendar(
    year: Optional[int] = None,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
):
    """Return leave events for calendar view. If `year` provided, filter by that year.
    Employees only receive their own leaves; admins/hr receive all.
    """

    filters = {}

    # If year provided, limit by start_date year or end_date year
    if year:
        # simple filter: leaves that start or end in the year
        filters["$or"] = [
            {"start_date": {"$gte": f"{year}-01-01", "$lte": f"{year}-12-31"}},
            {"end_date": {"$gte": f"{year}-01-01", "$lte": f"{year}-12-31"}}
        ]

    if current_user.role == UserRole.EMPLOYEE:
        employee = await Employee.find_one(
            Employee.email == current_user.email,
            Employee.is_deleted == False
        )

        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee record not found"
            )

        filters["employee_id"] = str(employee.id)

    query = LeaveRequest.find(filters)

    leaves = await query.sort(("start_date", 1)).to_list()

    # Map to simple event objects for frontend calendar
    events = [
        {
            "id": str(l.id),
            "employee_id": l.employee_id,
            "employee_name": l.employee_name,
            "start_date": l.start_date.isoformat() if hasattr(l.start_date, 'isoformat') else str(l.start_date),
            "end_date": l.end_date.isoformat() if hasattr(l.end_date, 'isoformat') else str(l.end_date),
            "status": l.status,
            "reason": l.reason
        }
        for l in leaves
    ]

    return {"events": events}
