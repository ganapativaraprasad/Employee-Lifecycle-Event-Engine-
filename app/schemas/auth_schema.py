from pydantic import BaseModel, EmailStr

from app.core.enums.user_role import UserRole


class UserRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str