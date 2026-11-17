"""Authentication router handling registration, login, logout, and password resets."""
from datetime import datetime, timedelta, timezone
import logging
import re
from fastapi import APIRouter, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.errors import AppException
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    generate_random_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.schemas.auth import (
    AdminRegisterRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.utils.serializers import clean_mongo_doc, format_response

logger = logging.getLogger("ssp.auth")
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register_student(
    request: Request,
    payload: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Public student self-registration.
    Always assigns role 'student'. Validates unique email and USN/student ID.
    """
    # Check duplicate email (case-insensitive)
    existing_email = await db.users.find_one({"email": {"$regex": f"^{re.escape(payload.email)}$", "$options": "i"}})
    if existing_email:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            code="EMAIL_EXISTS",
            message=f"An account with email '{payload.email}' already exists.",
        )

    # Check duplicate student ID / USN (case-insensitive)
    existing_usn = await db.users.find_one({"student_id": {"$regex": f"^{re.escape(payload.student_id)}$", "$options": "i"}})
    if existing_usn:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            code="STUDENT_ID_EXISTS",
            message=f"A student with ID/USN '{payload.student_id}' is already registered.",
        )

    # Hash password in threadpool
    password_hash = await hash_password(payload.password)
    now = datetime.now(timezone.utc)

    # Create user document - role is IMMUTABLY student for public registration
    user_doc = {
        "email": payload.email.lower().strip(),
        "password_hash": password_hash,
        "full_name": payload.full_name.strip(),
        "role": "student",
        "student_id": payload.student_id.upper().strip(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create student profile document
    profile_doc = {
        "user_id": result.inserted_id,
        "student_id": payload.student_id.upper().strip(),
        "branch": payload.branch,
        "semester": payload.semester,
        "overall_skill_score": 0.0,
        "completed_modules_count": 0,
        "completed_activities_count": 0,
        "completed_assessments_count": 0,
        "current_streak_days": 0,
        "last_activity_date": None,
        "total_points": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.student_profiles.insert_one(profile_doc)

    # Log audit entry
    await db.audit_logs.insert_one({
        "user_id": result.inserted_id,
        "action": "USER_REGISTERED",
        "details": {"email": payload.email, "role": "student"},
        "created_at": now,
    })

    # Persist mock snapshot so signups survive restarts
    from app.core.database import DatabaseManager
    if DatabaseManager.is_mock:
        await DatabaseManager.save_mock_snapshot()

    # Generate access token
    access_token = create_access_token(user_id=user_id, role="student")

    # Fetch created user document with profile
    user_doc["_id"] = result.inserted_id
    user_data = clean_mongo_doc(user_doc)
    user_data["profile"] = clean_mongo_doc(profile_doc)

    return format_response({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    })


@router.post("/admin-register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register_admin(
    request: Request,
    payload: AdminRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create an administrator account through the public signup flow."""
    existing_email = await db.users.find_one({"email": {"$regex": f"^{re.escape(payload.email)}$", "$options": "i"}})
    if existing_email:
        raise AppException(
            status_code=status.HTTP_409_CONFLICT,
            code="EMAIL_EXISTS",
            message=f"An account with email '{payload.email}' already exists.",
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": payload.email.lower().strip(),
        "password_hash": await hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "role": "admin",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    await db.audit_logs.insert_one({
        "user_id": result.inserted_id,
        "action": "ADMIN_SELF_REGISTERED",
        "details": {"email": payload.email, "role": "admin"},
        "created_at": now,
    })

    from app.core.database import DatabaseManager
    if DatabaseManager.is_mock:
        await DatabaseManager.save_mock_snapshot()

    access_token = create_access_token(user_id=str(result.inserted_id), role="admin")
    user_doc["_id"] = result.inserted_id
    user_data = clean_mongo_doc(user_doc)

    return format_response({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    })


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Authenticate user by email, student ID, full name, or username and return a JWT access token.
    Enforces active status check and returns user details.
    """
    raw_identifier = (payload.username or payload.email or "").strip()
    identifier = raw_identifier.lower()
    if not identifier:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MISSING_CREDENTIALS",
            message="Please provide your email, student ID, or username.",
        )

    # Convenient demo username mappings
    if identifier == "student":
        identifier = "student@college.edu"
    elif identifier == "admin":
        identifier = "admin@ssp.edu"

    # Match across email, student_id (USN), full_name, or email prefix
    or_clauses = [
        {"email": identifier},
        {"email": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
        {"student_id": identifier.upper()},
        {"student_id": {"$regex": f"^{re.escape(raw_identifier)}$", "$options": "i"}},
        {"full_name": {"$regex": f"^{re.escape(raw_identifier)}$", "$options": "i"}},
    ]
    # If no '@' entered, also check if it matches the prefix of their email
    if "@" not in identifier and len(identifier) >= 3:
        or_clauses.append({"email": {"$regex": f"^{re.escape(identifier)}@", "$options": "i"}})

    user = await db.users.find_one({"$or": or_clauses})
    if not user:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
            message="No account found matching this email, student ID, or name.",
        )

    if user.get("role") == "faculty":
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
            message="Faculty accounts are no longer available on this platform.",
        )

    # Check deactivated user
    if not user.get("is_active", True):
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_DEACTIVATED",
            message="Your account has been deactivated. Please contact an administrator.",
        )

    # Verify password
    is_valid = await verify_password(payload.password, user.get("password_hash", ""))
    if not is_valid:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
        )

    user_id = str(user["_id"])
    role = user.get("role", "student")
    access_token = create_access_token(user_id=user_id, role=role)

    # Fetch associated profile
    profile = None
    if role == "student":
        profile = await db.student_profiles.find_one({"user_id": user["_id"]})
    elif role == "faculty":
        profile = await db.faculty_profiles.find_one({"user_id": user["_id"]})

    # Update last login time
    now = datetime.now(timezone.utc)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now}})

    user_data = clean_mongo_doc(user)
    user_data["profile"] = clean_mongo_doc(profile)

    return format_response({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    })


@router.post("/logout")
async def logout():
    """Client logout confirmation endpoint."""
    return format_response({"message": "Successfully signed out."})


@router.post("/forgot-password")
@limiter.limit("10/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Initiate password reset. Always returns identical generic message.
    In development mode without SMTP, logs the reset URL to console.
    """
    user = await db.users.find_one({"email": payload.email, "is_active": True})
    if user:
        raw_token = generate_random_token()
        hashed = hash_token(raw_token)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=30)

        # Invalidate any prior reset tokens for this user
        await db.password_reset_tokens.delete_many({"user_id": user["_id"]})

        # Insert new reset token
        await db.password_reset_tokens.insert_one({
            "user_id": user["_id"],
            "token_hash": hashed,
            "expires_at": expires_at,
            "created_at": now,
        })

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        if settings.is_development:
            logger.info("=" * 60)
            logger.info(f"[DEV ONLY] Password reset requested for: {payload.email}")
            logger.info(f"[DEV ONLY] Reset URL: {reset_url}")
            logger.info("=" * 60)

    # Return standard generic response for privacy/security
    return format_response({
        "message": "If an account with that email exists, password reset instructions have been dispatched.",
    })


@router.post("/reset-password")
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Reset password using single-use hashed token with 30-minute validity.
    """
    hashed = hash_token(payload.token)
    now = datetime.now(timezone.utc)

    # Find token document that has not expired
    token_doc = await db.password_reset_tokens.find_one({
        "token_hash": hashed,
        "expires_at": {"$gt": now},
    })

    if not token_doc:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_RESET_TOKEN",
            message="This password reset link is invalid or has expired. Please request a new one.",
        )

    # Hash new password
    new_password_hash = await hash_password(payload.password)

    # Update user password
    await db.users.update_one(
        {"_id": token_doc["user_id"]},
        {"$set": {"password_hash": new_password_hash, "updated_at": now}},
    )

    # Delete single-use token
    await db.password_reset_tokens.delete_one({"_id": token_doc["_id"]})

    # Log audit entry
    await db.audit_logs.insert_one({
        "user_id": token_doc["user_id"],
        "action": "PASSWORD_RESET_SUCCESS",
        "created_at": now,
    })

    return format_response({
        "message": "Your password has been successfully reset. You may now sign in.",
    })


@router.get("/me")
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get full profile details for the currently authenticated user.
    """
    role = current_user.get("role", "student")
    profile = None
    if role == "student":
        profile = await db.student_profiles.find_one({"user_id": current_user["_id"]})

    user_data = clean_mongo_doc(current_user)
    user_data["profile"] = clean_mongo_doc(profile)

    return format_response(user_data)
