"""Security utilities: bcrypt password hashing and PyJWT token generation."""
import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import bcrypt
import jwt
from app.core.config import get_settings
from app.core.errors import AppException

settings = get_settings()


def _hash_sync(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_sync(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


async def hash_password(password: str) -> str:
    """Async bcrypt password hashing executed off the main event loop."""
    if len(password.encode("utf-8")) > 72:
        raise AppException(
            status_code=400,
            code="PASSWORD_TOO_LONG",
            message="Password cannot exceed 72 bytes.",
        )
    if len(password) < 8:
        raise AppException(
            status_code=400,
            code="PASSWORD_TOO_SHORT",
            message="Password must be at least 8 characters long.",
        )
    return await asyncio.to_thread(_hash_sync, password)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Async bcrypt password verification executed off the main event loop."""
    return await asyncio.to_thread(_verify_sync, plain_password, hashed_password)


def create_access_token(user_id: str, role: str, expires_delta: timedelta | None = None) -> str:
    """Generate PyJWT access token containing user id and role."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate PyJWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AppException(
            status_code=401,
            code="TOKEN_EXPIRED",
            message="Session has expired. Please sign in again.",
        )
    except jwt.InvalidTokenError:
        raise AppException(
            status_code=401,
            code="INVALID_TOKEN",
            message="Invalid authentication credentials.",
        )


def generate_random_token() -> str:
    """Generate secure URL-safe random string for password resets."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash single-use tokens (like password reset) with SHA256 before DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
