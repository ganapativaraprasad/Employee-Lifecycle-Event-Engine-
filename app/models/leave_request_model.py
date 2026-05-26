from datetime import date, datetime

from beanie import Document
from pydantic import EmailStr
from typing import Optional

from app.core.enums.leave_status import LeaveStatus
from app.core.enums.leave_type import LeaveType


class LeaveRequest(Document):
    employee_id: str
    employee_email: EmailStr
    employee_name: str

    start_date: date
    end_date: date
    reason: str
    leave_type: LeaveType = LeaveType.SICK

    status: LeaveStatus = LeaveStatus.PENDING

    requested_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    decision_note: Optional[str] = None

    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "leave_requests"
