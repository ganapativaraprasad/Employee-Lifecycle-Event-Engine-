from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    UploadFile,
    File
)

from datetime import datetime
from typing import Optional, Any

import os
import shutil
from fastapi.responses import FileResponse
from app.models.employee_model import Employee
from app.models.user_model import User

from app.schemas.employee_schema import (
    EmployeeCreateSchema,
    EmployeeUpdateSchema,
    EmployeeResponseSchema,
    EmployeeListResponseSchema
)

from app.schemas.transition_schema import (
    TransitionSchema
)

from app.core.enums.user_role import (
    UserRole
)
from app.core.enums.employee_state import (
    EmployeeState
)

from app.core.dependencies import (
    require_roles
)

from app.services.employee_service import (
    EmployeeService
)

from fastapi import BackgroundTasks

from app.services.notification_service import (
    send_status_change_email,
    send_welcome_email
)
from app.core.cache import (
    get_cached,
    set_cached,
    invalidate_pattern,
    invalidate,
)

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


@router.post("/")
async def create_employee(
    employee_data: EmployeeCreateSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> dict[str, Any]:

    employee = await EmployeeService.create_employee(
        employee_data
    )

    # Invalidate employee list caches
    await invalidate_pattern("employees:*")
    # Invalidate detail cache for this employee (if any)
    await invalidate(f"employee:{str(employee.id)}")

    return {
        "message": "Employee created successfully",
        "employee_id": str(employee.id)
    }


@router.get(
    "/",
    response_model=EmployeeListResponseSchema
)
async def get_all_employees(

    page: int = 1,
    limit: int = 5,

    search: Optional[str] = None,

    employee_code: Optional[str] = None,

    name: Optional[str] = None,

    department: Optional[str] = None,

    designation: Optional[str] = None,

    current_state: Optional[str] = None,

    employment_status: Optional[str] = None,

    leave_status: Optional[str] = None,

    joined_from: Optional[datetime] = None,

    joined_to: Optional[datetime] = None,

    sort_by: Optional[str] = "created_at",

    sort_order: Optional[str] = "desc",

    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> EmployeeListResponseSchema:

    skip = (page - 1) * limit

    filters: dict[str, Any] = {}

    if department:
        filters["department"] = department

    if designation:
        filters["designation"] = designation

    if current_state:
        filters["current_state"] = current_state
    elif employment_status:
        filters["current_state"] = employment_status

    if not current_state:

        if leave_status == "ON_LEAVE":
            filters["current_state"] = EmployeeState.ON_LEAVE

        elif leave_status == "NOT_ON_LEAVE":
            filters["current_state"] = {
                "$ne": EmployeeState.ON_LEAVE
            }

    filters["is_deleted"] = False

    if joined_from or joined_to:
        date_filter: dict[str, Any] = {}
        if joined_from:
            date_filter["$gte"] = joined_from
        if joined_to:
            date_filter["$lte"] = joined_to
        filters["created_at"] = date_filter

    if employee_code:
        filters["employee_code"] = {
            "$regex": employee_code,
            "$options": "i"
        }

    # Cache key built from query parameters
    key = "employees:" + ":".join([
        str(page),
        str(limit),
        str(search),
        str(department),
        str(designation),
        str(current_state)
    ])

    # Check Redis cache before querying MongoDB
    cached = await get_cached(key)
    if cached:
        return EmployeeListResponseSchema(**cached)

    query = Employee.find(filters)

    if search or name:
        search_value = name or search
        query = query.find(
            {
                "$or": [
                    {
                        "first_name": {
                            "$regex": search_value,
                            "$options": "i"
                        }
                    },
                    {
                        "last_name": {
                            "$regex": search_value,
                            "$options": "i"
                        }
                    },
                    {
                        "email": {
                            "$regex": search_value,
                            "$options": "i"
                        }
                    },
                    {
                        "employee_code": {
                            "$regex": search_value,
                            "$options": "i"
                        }
                    }
                ]
            }
        )

    sortable_fields = {
        "employee_code",
        "first_name",
        "last_name",
        "department",
        "designation",
        "current_state",
        "created_at"
    }

    sort_field = "created_at"

    if sort_by in sortable_fields:
        sort_field = sort_by

    total = await query.count()

    query = query.sort(sort_field)

    employees = await query \
        .skip(skip) \
        .limit(limit) \
        .to_list()
    response: list[EmployeeResponseSchema] = []

    for employee in employees:

        response.append(
            EmployeeResponseSchema(
                id=str(employee.id),
                employee_code=employee.employee_code,
                first_name=employee.first_name,
                last_name=employee.last_name,
                email=employee.email,
                department=employee.department,
                designation=employee.designation,
                current_state=employee.current_state,
                created_at=employee.created_at
            )
        )

    result = EmployeeListResponseSchema(
        items=response,
        total=total,
        page=page,
        limit=limit
    )

    # Store result in cache for short TTL (ensure JSON-serializable)
    await set_cached(key, result, ttl=60)

    return result


@router.get("/{employee_id}")
async def get_employee_by_id(
    employee_id: str,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> EmployeeResponseSchema:

    # Try cache first
    key = f"employee:{employee_id}"
    cached = await get_cached(key)
    if cached:
        return EmployeeResponseSchema(**cached)

    employee = await Employee.get(employee_id)

    if not employee or employee.is_deleted:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    result = EmployeeResponseSchema(
        id=str(employee.id),
        employee_code=employee.employee_code,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        department=employee.department,
        designation=employee.designation,
        current_state=employee.current_state,
        created_at=employee.created_at
    )

    # Cache detail
    await set_cached(key, result, ttl=120)

    return result


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    employee_data: EmployeeUpdateSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> dict[str, str]:

    employee = await Employee.get(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    update_data = employee_data.dict(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(employee, key, value)

    await employee.save()

    # Invalidate employee list caches
    await invalidate_pattern("employees:*")
    # Invalidate employee detail cache
    await invalidate(f"employee:{str(employee.id)}")

    return {
        "message": "Employee updated successfully"
    }


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(
        require_roles([UserRole.ADMIN])
    )
) -> dict[str, str]:

    employee = await Employee.get(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.is_deleted = True

    await employee.save()

    # Invalidate employee list caches
    await invalidate_pattern("employees:*")
    # Invalidate employee detail cache
    await invalidate(f"employee:{str(employee.id)}")

    return {
        "message": "Employee deleted successfully"
    }