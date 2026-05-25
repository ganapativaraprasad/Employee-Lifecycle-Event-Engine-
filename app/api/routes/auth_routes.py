from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Depends

from fastapi.security import OAuth2PasswordRequestForm

from jose import jwt, JWTError

from app.models.user_model import User

from app.schemas.auth_schema import (
    UserRegisterSchema
)

from app.core.security import (
    hash_password,
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


@router.post("/register")
async def register_user(
    user_data: UserRegisterSchema
):

    existing_user = await User.find_one(
        User.email == user_data.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user_data.password
    )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )

    await user.insert()

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    user = await User.find_one(
        User.email == form_data.username
    )

    if not user:
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