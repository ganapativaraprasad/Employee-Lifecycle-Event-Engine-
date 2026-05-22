from app.models.base_model import BaseDocument
from app.core.enums.user_role import UserRole


class User(BaseDocument):
    username: str
    email: str
    hashed_password: str
    role: UserRole
    is_active: bool = True

    class Settings:
        name = "users"