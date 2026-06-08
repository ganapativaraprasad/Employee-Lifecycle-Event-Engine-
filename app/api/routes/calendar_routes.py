from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, require_roles
from app.core.enums.event_type import EventType
from app.core.enums.holiday_type import HolidayType
from app.core.enums.user_role import UserRole
from app.models.calendar_event_model import CalendarEvent
from app.models.holiday_model import Holiday
from app.models.user_model import User
from app.schemas.calendar_event_schema import (
    CalendarEventCreateSchema,
    CalendarEventListResponseSchema,
    CalendarEventResponseSchema,
    CalendarEventUpdateSchema
)
from app.schemas.holiday_schema import (
    HolidayCreateSchema,
    HolidayListResponseSchema,
    HolidayResponseSchema,
    HolidayUpdateSchema
)
from datetime import date
from typing import cast
from typing import Any

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"]
)

DEFAULT_HOLIDAYS_2026 = [
    {
        "date": date(2026, 1, 1),
        "name": "New Year's Day",
        "description": "New Year's Day",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 1, 15),
        "name": "Sankranti / Pongal / Makar Sankranti",
        "description": "Sankranti / Pongal / Makar Sankranti",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 1, 26),
        "name": "Republic Day",
        "description": "Republic Day",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 3, 21),
        "name": "Ramzan / Eid",
        "description": "Ramzan / Eid",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 5, 1),
        "name": "May Day",
        "description": "May Day",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 5, 27),
        "name": "Bakrid",
        "description": "Bakrid",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 6, 2),
        "name": "Telangana State Formation Day",
        "description": "Telangana State Formation Day",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 8, 15),
        "name": "Independence Day",
        "description": "Independence Day",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 9, 14),
        "name": "Ganesh Chaturthi",
        "description": "Ganesh Chaturthi",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 10, 2),
        "name": "Mahatma Gandhi Jayanti",
        "description": "Mahatma Gandhi Jayanti",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 10, 21),
        "name": "Dussehra",
        "description": "Dussehra",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 11, 8),
        "name": "Deepawali",
        "description": "Deepawali",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 12, 25),
        "name": "Christmas",
        "description": "Christmas",
        "type": HolidayType.PUBLIC
    },
    {
        "date": date(2026, 3, 4),
        "name": "Holi",
        "description": "Holi",
        "type": HolidayType.OPTIONAL
    },
    {
        "date": date(2026, 3, 19),
        "name": "Ugadi",
        "description": "Ugadi",
        "type": HolidayType.OPTIONAL
    },
    {
        "date": date(2026, 3, 26),
        "name": "Sri Rama Navami",
        "description": "Sri Rama Navami",
        "type": HolidayType.OPTIONAL
    },
    {
        "date": date(2026, 4, 3),
        "name": "Good Friday",
        "description": "Good Friday",
        "type": HolidayType.OPTIONAL
    },
    {
        "date": date(2026, 8, 10),
        "name": "Bonalu",
        "description": "Bonalu",
        "type": HolidayType.OPTIONAL
    },
    {
        "date": date(2026, 8, 26),
        "name": "Eid Milad",
        "description": "Eid Milad",
        "type": HolidayType.OPTIONAL
    }
]


@router.get("/holidays", response_model=HolidayListResponseSchema)
async def list_holidays(
    year: Optional[int] = None,
    page: int = 1,
    limit: int = 1000,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER,
            UserRole.EMPLOYEE
        ])
    )
) -> HolidayListResponseSchema:
    target_year = year or date.today().year

    existing_count = await Holiday.find(
        Holiday.year == target_year
    ).count()
    
    if target_year == 2026 and existing_count == 0:
        for holiday in DEFAULT_HOLIDAYS_2026:

            holiday_date = cast(date, holiday["date"])

            await Holiday(
                name=holiday["name"],
                description=holiday["description"],
                date=holiday_date,
                year=holiday_date.year,
                type=holiday["type"]
            ).insert()
    query = Holiday.find(
        Holiday.year == target_year
    ).sort("date")

    total = await query.count()

    items = await query.skip(
        (page - 1) * limit
    ).limit(limit).to_list()

    return HolidayListResponseSchema(
        items=[
            HolidayResponseSchema(
                id=str(holiday.id),
                name=holiday.name,
                description=holiday.description,
                date=holiday.date,
                year=holiday.year,
                type=holiday.type,
                created_at=holiday.created_at
            )
            for holiday in items
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.post("/holidays", response_model=HolidayResponseSchema)
async def create_holiday(
    payload: HolidayCreateSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> HolidayResponseSchema:
    holiday = Holiday(
        name=payload.name,
        description=payload.description or payload.name,
        date=payload.date,
        year=payload.date.year,
        type=payload.type
    )

    await holiday.insert()

    return HolidayResponseSchema(
        id=str(holiday.id),
        name=holiday.name,
        description=holiday.description,
        date=holiday.date,
        year=holiday.year,
        type=holiday.type,
        created_at=holiday.created_at
    )


@router.put("/holidays/{holiday_id}", response_model=HolidayResponseSchema)
async def update_holiday(
    holiday_id: str,
    payload: HolidayUpdateSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> HolidayResponseSchema:
    holiday = await Holiday.get(holiday_id)

    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    update_data = payload.dict(exclude_unset=True)

    if "date" in update_data:
        update_data["year"] = update_data["date"].year

    for key, value in update_data.items():
        setattr(holiday, key, value)

    holiday.updated_at = datetime.utcnow()

    await holiday.save()

    return HolidayResponseSchema(
        id=str(holiday.id),
        name=holiday.name,
        description=holiday.description,
        date=holiday.date,
        year=holiday.year,
        type=holiday.type,
        created_at=holiday.created_at
    )


@router.delete("/holidays/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
) -> dict[str, str]:
    holiday = await Holiday.get(holiday_id)

    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    await holiday.delete()

    return {"message": "Holiday deleted"}


@router.get("/events", response_model=CalendarEventListResponseSchema)
async def list_events(
    year: Optional[int] = None,
    page: int = 1,
    limit: int = 1000,
    current_user: User = Depends(get_current_user)
) -> CalendarEventListResponseSchema:
    target_year = year or date.today().year

    query = CalendarEvent.find(
        CalendarEvent.date >= date(target_year, 1, 1),
        CalendarEvent.date <= date(target_year, 12, 31)
    )

    if current_user.role == UserRole.EMPLOYEE:
        query = query.find(
            {
                "$or": [
                    {"event_type": EventType.COMPANY},
                    {
                        "event_type": EventType.TEAM,
                        "participants": {"$in": [current_user.email]}
                    },
                    {
                        "event_type": EventType.PERSONAL,
                        "created_by": str(current_user.id)
                    }
                ]
            }
        )

    total = await query.count()

    items = await query.sort(
        "date"
    ).skip((page - 1) * limit).limit(limit).to_list()

    return CalendarEventListResponseSchema(
        items=[
            CalendarEventResponseSchema(
                id=str(item.id),
                title=item.title,
                description=item.description,
                event_type=item.event_type,
                date=item.date,
                start_time=item.start_time,
                end_time=item.end_time,
                participants=item.participants,
                notes=item.notes,
                created_by=item.created_by,
                created_by_email=item.created_by_email,
                created_at=item.created_at
            )
            for item in items
        ],
        total=total,
        page=page,
        limit=limit
    )


@router.post("/events", response_model=CalendarEventResponseSchema)
async def create_event(
    payload: CalendarEventCreateSchema,
    current_user: User = Depends(get_current_user)
) -> CalendarEventResponseSchema:
    if payload.event_type in [EventType.COMPANY, EventType.TEAM]:
        if current_user.role not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
            raise HTTPException(status_code=403, detail="Permission denied")

    event = CalendarEvent(
        title=payload.title,
        description=payload.description,
        event_type=payload.event_type,
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        participants=payload.participants,
        notes=payload.notes,
        created_by=str(current_user.id),
        created_by_email=current_user.email
    )

    await event.insert()

    return CalendarEventResponseSchema(
        id=str(event.id),
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        date=event.date,
        start_time=event.start_time,
        end_time=event.end_time,
        participants=event.participants,
        notes=event.notes,
        created_by=event.created_by,
        created_by_email=event.created_by_email,
        created_at=event.created_at
    )


@router.put("/events/{event_id}", response_model=CalendarEventResponseSchema)
async def update_event(
    event_id: str,
    payload: CalendarEventUpdateSchema,
    current_user: User = Depends(get_current_user)
) -> CalendarEventResponseSchema:
    event = await CalendarEvent.get(event_id)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.event_type in [EventType.COMPANY, EventType.TEAM]:
        if current_user.role not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
            raise HTTPException(status_code=403, detail="Permission denied")
    elif event.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Permission denied")

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(event, key, value)

    event.updated_at = datetime.utcnow()

    await event.save()

    return CalendarEventResponseSchema(
        id=str(event.id),
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        date=event.date,
        start_time=event.start_time,
        end_time=event.end_time,
        participants=event.participants,
        notes=event.notes,
        created_by=event.created_by,
        created_by_email=event.created_by_email,
        created_at=event.created_at
    )


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user)
) -> dict[str, str]:
    event = await CalendarEvent.get(event_id)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.event_type in [EventType.COMPANY, EventType.TEAM]:
        if current_user.role not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
            raise HTTPException(status_code=403, detail="Permission denied")
    elif event.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Permission denied")

    await event.delete()

    return {"message": "Event deleted"}
