from datetime import date, datetime

from beanie import Document
from pymongo import IndexModel

from app.core.enums.holiday_type import HolidayType


class Holiday(Document):
    name: str
    description: str
    date: date
    year: int
    type: HolidayType

    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "holidays"
        indexes = [
            IndexModel([("date", 1)]),
            IndexModel([("year", 1)]),
            IndexModel([("type", 1)])
        ]
