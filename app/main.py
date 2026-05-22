from fastapi import FastAPI
from beanie import init_beanie

from app.core.database import db

from app.models.employee_model import Employee
from app.models.user_model import User
from app.models.audit_log_model import AuditLog

from app.api.routes.employee_routes import (
    router as employee_router
)

app = FastAPI()


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


app.include_router(employee_router)


@app.get("/")
async def root():
    return {
        "message": "Employee Lifecycle Engine Running"
    }