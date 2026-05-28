from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel

from app.core.enums.event_type import EventType


class CalendarEventCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    participants: list[str] = []
    notes: Optional[str] = None


class CalendarEventUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    participants: Optional[list[str]] = None
    notes: Optional[str] = None


class CalendarEventResponseSchema(BaseModel):
    id: str
    title: str
    description: Optional[str]
    event_type: EventType
    date: date
    start_time: Optional[time]
    end_time: Optional[time]
    participants: list[str]
    notes: Optional[str]
    created_by: str
    created_by_email: str
    created_at: datetime

    class Config:
        from_attributes = True


class CalendarEventListResponseSchema(BaseModel):
    items: list[CalendarEventResponseSchema]
    total: int
    page: int
    limit: int
