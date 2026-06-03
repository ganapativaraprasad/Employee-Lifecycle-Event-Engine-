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
):

    employee = await EmployeeService.create_employee(
        employee_data
    )

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
):

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

    return EmployeeListResponseSchema(
        items=response,
        total=total,
        page=page,
        limit=limit
    )



@router.get("/{employee_id}")
async def get_employee_by_id(
    employee_id: str,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    employee = await Employee.get(employee_id)

    if not employee or employee.is_deleted:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return EmployeeResponseSchema(
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
):

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

    return {
        "message": "Employee updated successfully"
    }


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(
        require_roles([UserRole.ADMIN])
    )
):

    employee = await Employee.get(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.is_deleted = True

    await employee.save()

    return {
        "message": "Employee soft deleted successfully"
    }


@router.post("/{employee_id}/transition")
async def transition_employee(

    background_tasks: BackgroundTasks,

    employee_id: str,
    transition_data: TransitionSchema,

    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    employee = await EmployeeService.transition_employee(
        employee_id=employee_id,
        transition_data=transition_data,
        actor_id=str(current_user.id)
    )

    if transition_data.new_state == "ACTIVE":

        background_tasks.add_task(

            send_welcome_email,

            employee.email,

            employee.first_name
        )

    return {
        "message": "Employee transitioned successfully",
        "new_state": employee.current_state
    }


@router.post("/{employee_id}/upload")
async def upload_employee_document(
    employee_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    employee = await Employee.get(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    allowed_extensions = [
        ".pdf",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg"
    ]

    if file.filename is None:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing"
        )

    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    if file_extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail="Invalid file type"
        )

    file_size = 0

    contents = await file.read()

    file_size = len(contents)

    max_size = 5 * 1024 * 1024

    if file_size > max_size:

        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5MB limit"
        )

    upload_dir = "uploads"

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    file_path = f"{upload_dir}/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    employee.documents.append(file_path)

    await employee.save()

    return {
        "message": "File uploaded successfully",
        "file_path": file_path
    }

@router.get("/download/{file_name}")
async def download_employee_document(
    file_name: str,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
):

    file_path = f"uploads/{file_name}"

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/octet-stream"
    )