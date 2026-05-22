from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings



pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    data: dict,
    expires_delta: timedelta = timedelta(hours=24)
):

    to_encode = data.copy()

    expire = datetime.utcnow() + expires_delta

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=ALGORITHM
    )

    return encoded_jwt

def create_refresh_token(
    data: dict
):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        days=7
    )

    to_encode.update(
        {"exp": expire}
    )

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=ALGORITHM
    )

    return encoded_jwt