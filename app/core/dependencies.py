from jose import JWTError, jwt

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.security import ALGORITHM

from app.models.user_model import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


async def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )

    try:

        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[ALGORITHM]
        )

        user_id: str = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await User.get(user_id)

    if user is None:
        raise credentials_exception

    return user

def require_roles(allowed_roles: list):

    async def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )

        return current_user

    return role_checker