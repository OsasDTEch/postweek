from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def _prepare(plain: str) -> str:
    """bcrypt silently truncates at 72 bytes — enforce it explicitly."""
    encoded = plain.encode("utf-8")
    return encoded[:72].decode("utf-8", errors="ignore") if len(encoded) > 72 else plain


def hash_password(plain: str) -> str:
    return pwd_context.hash(_prepare(plain))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare(plain), hashed)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "type": token_type,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def get_user_id_from_token(token: str, expected_type: str = "access") -> str:
    """Extract user_id from a valid token, checking the token type."""
    try:
        payload = decode_token(token)
        if payload.get("type") != expected_type:
            raise JWTError("Wrong token type")
        user_id: str = payload["sub"]
        return user_id
    except (JWTError, KeyError) as exc:
        raise ValueError("Invalid or expired token") from exc
