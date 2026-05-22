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

app = FastAPI()

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