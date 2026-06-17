from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI
from beanie import init_beanie
from app.core.database import db
from app.models.employee_model import Employee
from app.models.user_model import User
from app.models.audit_log_model import AuditLog
from app.models.leave_request_model import LeaveRequest
from app.models.holiday_model import Holiday
from app.models.calendar_event_model import CalendarEvent
from app.api.routes.employee_routes import (
    router as employee_router
)
from app.api.routes.auth_routes import (
    router as auth_router
)
from app.exceptions.custom_exceptions import (
    EmployeeNotFoundException,
    InvalidTransitionException,
    PermissionDeniedException
)
from app.exceptions.exception_handlers import (
    employee_not_found_handler,
    invalid_transition_handler,
    permission_denied_handler
)
from app.api.routes.dashboard_routes import (
    router as dashboard_router
)
from app.api.routes.user_routes import (
    router as user_router
)
from app.api.routes.leave_routes import (
    router as leave_router
)
from app.api.routes.calendar_routes import (
    router as calendar_router
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket
from app.websocket.manager import manager
import asyncio

from app.kafka.producer import (
    start_producer,
    stop_producer
)
from app.kafka.consumers.transition_consumer import (
    start_consumer as start_transition_consumer,
    stop_consumer as stop_transition_consumer
)
from app.kafka.consumers.audit_consumer import (
    start_consumer as start_audit_consumer,
    stop_consumer as stop_audit_consumer
)
from app.kafka.consumers.notification_consumer import (
    start_consumer as start_notification_consumer,
    stop_consumer as stop_notification_consumer
)

app = FastAPI()
Instrumentator().instrument(app).expose(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(
    EmployeeNotFoundException,
    employee_not_found_handler
)

app.add_exception_handler(
    InvalidTransitionException,
    invalid_transition_handler
)

app.add_exception_handler(
    PermissionDeniedException,
    permission_denied_handler
)

app.include_router(
    dashboard_router,
    prefix="/api/v1"
)

@app.on_event("startup")
async def app_init()-> None:
    await init_beanie(
        database=db,
        document_models=[
            Employee,
            User,
            AuditLog,
            LeaveRequest,
            Holiday,
            CalendarEvent
        ]
    )
    await start_producer()
    # Start Kafka consumers (each start_consumer creates its own background task)
    start_transition_consumer()
    start_audit_consumer()
    start_notification_consumer()

app.include_router(
    employee_router,
    prefix="/api/v1"
)

@app.on_event("shutdown")
async def shutdown():

    # Stop consumers first, then producer
    await stop_transition_consumer()
    await stop_audit_consumer()
    await stop_notification_consumer()
    await stop_producer()


@app.get("/")
async def root()-> dict[str, str]:
    return {
        "message": "Employee Lifecycle Engine Running"
    }

app.include_router(
    auth_router,
    prefix="/api/v1"
)

app.include_router(
    user_router,
    prefix="/api/v1"
)

app.include_router(
    leave_router,
    prefix="/api/v1"
)

app.include_router(
    calendar_router,
    prefix="/api/v1"
)

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
)-> None:

    await manager.connect(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            await manager.broadcast(
                f"Message: {data}"
            )

    except:

        manager.disconnect(websocket)