from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Depends

from fastapi.security import OAuth2PasswordRequestForm

from jose import jwt, JWTError

from app.models.user_model import User

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    ALGORITHM
)

from app.core.config import settings


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    user = await User.find_one(
        User.email == form_data.username
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    is_password_valid = verify_password(
        form_data.password,
        user.hashed_password
    )

    if not is_password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "role": user.role
        }
    )

    refresh_token = create_refresh_token(
        data={
            "user_id": str(user.id)
        }
    )

    return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer",

    "user": {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
}


@router.post("/refresh")
async def refresh_access_token(
    refresh_token: str
):

    try:

        payload = jwt.decode(
            refresh_token,
            settings.jwt_secret_key,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )

        new_access_token = create_access_token(
            data={
                "user_id": user_id
            }
        )

        return {
            "access_token": new_access_token
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )