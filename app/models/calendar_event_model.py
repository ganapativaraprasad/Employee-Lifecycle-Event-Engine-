from datetime import date, datetime, time
from typing import Optional

from beanie import Document
from pymongo import IndexModel

from app.core.enums.event_type import EventType


class CalendarEvent(Document):
    title: str
    description: Optional[str] = None
    event_type: EventType
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    participants: list[str] = []
    notes: Optional[str] = None
    created_by: str
    created_by_email: str

    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "calendar_events"
        indexes = [
            IndexModel([("date", 1)]),
            IndexModel([("event_type", 1)]),
            IndexModel([("created_by", 1)])
        ]
