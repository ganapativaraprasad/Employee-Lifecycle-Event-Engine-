from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user, require_roles
from app.core.enums.user_role import UserRole
from app.core.security import hash_password, verify_password
from app.models.user_model import User
from app.schemas.user_schema import (
    AdminSetPasswordSchema,
    ChangePasswordSchema,
    UserCreateSchema,
    UserResponseSchema,
    UserUpdateSchema
)
from app.schemas.user_schema import ForgotPasswordSchema, ResetPasswordSchema
from datetime import datetime, timedelta
import random
from app.services.notification_service import send_password_reset_email
from typing import Any
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/", response_model=UserResponseSchema)
async def create_user(
    user_data: UserCreateSchema,
    current_user: User = Depends(
        require_roles([
            UserRole.ADMIN,
            UserRole.HR_MANAGER
        ])
    )
)-> UserResponseSchema:

    if current_user.role == UserRole.HR_MANAGER:

        if user_data.role != UserRole.EMPLOYEE:
            raise HTTPException(
                status_code=403,
                detail="HR can only create employee accounts"
            )

    existing_user = await User.find_one(
        User.email == user_data.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        role=user_data.role
    )

    await user.insert()

    return UserResponseSchema(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active
    )


@router.get("/", response_model=list[UserResponseSchema])
async def list_users(
    current_user: User = Depends(
        require_roles([UserRole.ADMIN])
    )
)-> list[UserResponseSchema]:

    users = await User.find().to_list()

    return [
        UserResponseSchema(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active
        )
        for user in users
    ]


@router.get("/me", response_model=UserResponseSchema)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponseSchema:

    return UserResponseSchema(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active
    )


@router.put("/me", response_model=UserResponseSchema)
async def update_my_profile(
    payload: UserUpdateSchema,
    current_user: User = Depends(get_current_user)
) -> UserResponseSchema:

    update_data = payload.dict(
        exclude_unset=True
    )

    if "email" in update_data:

        existing_user = await User.find_one(
            User.email == update_data["email"]
        )

        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

    for key, value in update_data.items():
        setattr(current_user, key, value)

    await current_user.save()

    return UserResponseSchema(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active
    )


@router.post("/me/change-password")
async def change_my_password(
    payload: ChangePasswordSchema,
    current_user: User = Depends(get_current_user)
) -> dict[str, str]:

    if not verify_password(
        payload.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(
        payload.new_password
    )

    await current_user.save()

    return {
        "message": "Password changed successfully"
    }


@router.put("/{user_id}/password")
async def admin_set_password(
    user_id: str,
    payload: AdminSetPasswordSchema,
    current_user: User = Depends(
        require_roles([UserRole.ADMIN])
    )
) -> dict[str, str]:

    user = await User.get(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.hashed_password = hash_password(
        payload.new_password
    )

    await user.save()

    return {
        "message": "Password updated successfully"
    }


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordSchema
) -> dict[str, str]:

    user = await User.find_one(User.email == payload.email)

    # Always return success to avoid user enumeration
    if not user:
        return {"message": "If the email exists, a reset code was sent."}

    # generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    user.reset_code = code
    user.reset_expires = datetime.utcnow() + timedelta(minutes=15)
    await user.save()

    # send email (may be skipped if SMTP not configured)
    try:
        await send_password_reset_email(user.email, code)
    except Exception:
        pass

    return {"message": "If the email exists, a reset code was sent."}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordSchema
) -> dict[str, str]:

    user = await User.find_one(User.email == payload.email)

    if not user or not getattr(user, 'reset_code', None):
        raise HTTPException(status_code=400, detail="Invalid code or email")

    if user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid code or email")

    reset_expires = getattr(user, "reset_expires", None)

    if reset_expires is not None and datetime.utcnow() > reset_expires:  
        raise HTTPException(
            status_code=400,
            detail="Reset code expired"
        )

    user.hashed_password = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_expires = None
    await user.save()

    return {"message": "Password has been reset successfully"}
