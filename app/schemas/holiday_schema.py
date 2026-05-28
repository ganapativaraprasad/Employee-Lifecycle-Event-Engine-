from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.core.enums.holiday_type import HolidayType


class HolidayCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    date: date
    type: HolidayType


class HolidayUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    type: Optional[HolidayType] = None


class HolidayResponseSchema(BaseModel):
    id: str
    name: str
    description: Optional[str]
    date: date
    year: int
    type: HolidayType
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayListResponseSchema(BaseModel):
    items: list[HolidayResponseSchema]
    total: int
    page: int
    limit: int
