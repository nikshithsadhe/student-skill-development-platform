"""Admin Portal Management Router."""
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pymongo import DESCENDING

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.errors import AppException
from app.core.security import hash_password
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


class CreateFacultyRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    department: str = Field(..., min_length=2)
    password: str = Field(..., min_length=8, max_length=72)


class AssignFacultyRequest(BaseModel):
    faculty_id: str
    student_ids: list[str] = Field(..., min_length=1)


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


@router.get("/analytics")
async def get_platform_analytics(
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Platform-wide system metrics for administrative overview."""
    total_students = await db.users.count_documents({"role": "student"})
    total_faculty = await db.users.count_documents({"role": "faculty"})
    published_modules = await db.learning_modules.count_documents({"status": "published"})
    total_assessments = await db.assessment_attempts.count_documents({})
    pending_reviews = await db.activity_submissions.count_documents({"status": {"$in": ["submitted", "under_review"]}})
    active_students = await db.users.count_documents({"role": "student", "is_active": True})

    return format_response({
        "total_students": total_students,
        "total_faculty": total_faculty,
        "published_modules": published_modules,
        "total_assessments_taken": total_assessments,
        "pending_reviews": pending_reviews,
        "active_students": active_students,
    })


@router.get("/users")
async def list_users(
    role: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Search and filter all registered users with profiles."""
    query = {}
    if role and role != "all":
        query["role"] = role
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
        ]

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    users = await db.users.find(query).sort("created_at", DESCENDING).skip(skip).limit(limit).to_list(limit)

    result = []
    for u in users:
        item = clean_mongo_doc(u)
        if u.get("role") == "student":
            item["profile"] = clean_mongo_doc(await db.student_profiles.find_one({"user_id": u["_id"]}))
        elif u.get("role") == "faculty":
            item["profile"] = clean_mongo_doc(await db.faculty_profiles.find_one({"user_id": u["_id"]}))
        result.append(item)

    return format_response(result, meta={"total": total, "page": page, "limit": limit})


@router.post("/faculty", status_code=status.HTTP_201_CREATED)
async def create_faculty_member(
    payload: CreateFacultyRequest,
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new faculty account."""
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise AppException(409, "EMAIL_EXISTS", f"User with email '{payload.email}' already exists.")

    hashed = await hash_password(payload.password)
    now = datetime.now(timezone.utc)

    user_doc = {
        "email": payload.email.lower(),
        "password_hash": hashed,
        "full_name": payload.full_name,
        "role": "faculty",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.users.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    await db.faculty_profiles.insert_one({
        "user_id": res.inserted_id,
        "department": payload.department,
        "title": "Faculty Mentor",
        "created_at": now,
        "updated_at": now,
    })

    await db.audit_logs.insert_one({
        "user_id": current_user["_id"],
        "action": "FACULTY_CREATED",
        "details": {"faculty_email": payload.email},
        "created_at": now,
    })

    return format_response(user_doc)


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Activate or deactivate a user account."""
    u_id = validate_object_id(user_id, "user_id")
    if str(u_id) == str(current_user["_id"]):
        raise AppException(400, "CANNOT_DEACTIVATE_SELF", "You cannot modify your own administrative status.")

    now = datetime.now(timezone.utc)
    res = await db.users.update_one(
        {"_id": u_id},
        {"$set": {"is_active": payload.is_active, "updated_at": now}},
    )
    if res.matched_count == 0:
        raise AppException(404, "USER_NOT_FOUND", "User not found.")

    await db.audit_logs.insert_one({
        "user_id": current_user["_id"],
        "action": "USER_STATUS_UPDATED",
        "details": {"target_user_id": user_id, "is_active": payload.is_active},
        "created_at": now,
    })

    return format_response({"message": f"User status set to {'Active' if payload.is_active else 'Deactivated'}."})


@router.post("/assignments")
async def assign_faculty_to_students(
    payload: AssignFacultyRequest,
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Assign a faculty member to one or more students."""
    fac_id = validate_object_id(payload.faculty_id, "faculty_id")
    faculty = await db.users.find_one({"_id": fac_id, "role": "faculty"})
    if not faculty:
        raise AppException(404, "FACULTY_NOT_FOUND", "Faculty member not found.")

    now = datetime.now(timezone.utc)
    assigned_count = 0

    for st_id_str in payload.student_ids:
        st_id = validate_object_id(st_id_str, "student_id")
        await db.faculty_assignments.update_one(
            {"student_id": st_id},
            {"$set": {"faculty_id": fac_id, "assigned_at": now}},
            upsert=True,
        )
        assigned_count += 1

    await db.audit_logs.insert_one({
        "user_id": current_user["_id"],
        "action": "FACULTY_STUDENTS_ASSIGNED",
        "details": {"faculty_id": payload.faculty_id, "student_count": assigned_count},
        "created_at": now,
    })

    return format_response({"message": f"Successfully assigned {assigned_count} students to {faculty.get('full_name')}."})


@router.get("/audit-logs")
async def get_audit_logs(
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """View recent administrative and security audit events."""
    logs = await db.audit_logs.find().sort("created_at", DESCENDING).limit(50).to_list(50)
    return format_response(logs)
