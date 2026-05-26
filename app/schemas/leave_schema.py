from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.core.enums.leave_status import LeaveStatus


class LeaveApplySchema(BaseModel):
    employee_id: Optional[str] = None
    start_date: date
    end_date: date
    reason: str
    leave_type: Optional[str] = "SICK"


class LeaveDecisionSchema(BaseModel):
    decision_note: Optional[str] = None


class LeaveResponseSchema(BaseModel):
    id: str
    employee_id: str
    employee_email: str
    employee_name: str
    start_date: date
    end_date: date
    reason: str
    leave_type: str
    status: LeaveStatus
    requested_by: str
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    decision_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveListResponseSchema(BaseModel):
    items: list[LeaveResponseSchema]
    total: int
    page: int
    limit: int
