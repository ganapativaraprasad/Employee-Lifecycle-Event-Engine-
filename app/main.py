from fastapi import FastAPI
from beanie import init_beanie
from app.core.database import db
from app.models.employee_model import Employee
from app.models.user_model import User
from app.models.audit_log_model import AuditLog
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
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket
from app.websocket.manager import manager

app = FastAPI()
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
async def app_init():
    await init_beanie(
        database=db,
        document_models=[
            Employee,
            User,
            AuditLog
        ]
    )


app.include_router(
    employee_router,
    prefix="/api/v1"
)



@app.get("/")
async def root():
    return {
        "message": "Employee Lifecycle Engine Running"
    }

app.include_router(
    auth_router,
    prefix="/api/v1"
)

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            await manager.broadcast(
                f"Message: {data}"
            )

    except:

        manager.disconnect(websocket)