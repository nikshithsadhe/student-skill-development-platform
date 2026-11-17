"""FastAPI dependency injection utilities."""
from typing import Any
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_db
from app.core.errors import AppException
from app.core.security import decode_access_token
from app.utils.object_id import validate_object_id

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    """
    Authenticate request via JWT Bearer token and retrieve the user from DB.
    Blocks immediately if user is missing, deactivated, or token is invalid.
    """
    if not credentials:
        raise AppException(
            status_code=401,
            code="UNAUTHORIZED",
            message="Authentication credentials were not provided. Please sign in.",
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            status_code=401,
            code="INVALID_TOKEN",
            message="Token payload is missing user identification.",
        )

    obj_id = validate_object_id(user_id, field_name="token user_id")
    user = await db.users.find_one({"_id": obj_id})
    if not user:
        raise AppException(
            status_code=401,
            code="USER_NOT_FOUND",
            message="The user associated with this token no longer exists.",
        )

    if not user.get("is_active", True):
        raise AppException(
            status_code=403,
            code="ACCOUNT_DEACTIVATED",
            message="Your account has been deactivated. Please contact an administrator.",
        )

    return user


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any] | None:
    """Optional authentication for endpoints that support both public and student views."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None


def require_roles(*allowed_roles: str):
    """Factory dependency to enforce role-based access control (RBAC)."""
    async def role_checker(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise AppException(
                status_code=403,
                code="FORBIDDEN",
                message=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}. Current role: {user_role}",
            )
        return current_user

    return role_checker
