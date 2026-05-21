from fastapi import FastAPI
from beanie import init_beanie

from app.core.database import db
from app.models.employee_model import Employee

app = FastAPI()


@app.on_event("startup")
async def app_init():
    await init_beanie(
        database=db,
        document_models=[Employee]
    )


@app.get("/")
async def root():
    return {"message": "Employee Lifecycle Engine Running"}