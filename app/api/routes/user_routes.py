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
):

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
):

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
):

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
):

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
):

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
):

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
