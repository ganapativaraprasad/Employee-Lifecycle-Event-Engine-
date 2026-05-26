from typing import Optional

from pydantic import BaseModel, EmailStr

from app.core.enums.user_role import UserRole


class UserCreateSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole


class UserResponseSchema(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool


class UserUpdateSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str


class AdminSetPasswordSchema(BaseModel):
    new_password: str
