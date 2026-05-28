from app.models.base_model import BaseDocument
from app.core.enums.user_role import UserRole
from typing import Optional
from datetime import datetime


class User(BaseDocument):
    username: str
    email: str
    hashed_password: str
    role: UserRole
    is_active: bool = True
    # Password reset fields
    reset_code: Optional[str] = None
    reset_expires: Optional[datetime] = None

    class Settings:
        name = "users"