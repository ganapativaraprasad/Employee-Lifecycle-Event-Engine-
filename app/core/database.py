from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(
    settings.mongodb_url
)

db = client[settings.database_name]