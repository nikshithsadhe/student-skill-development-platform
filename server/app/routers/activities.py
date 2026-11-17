"""Practical Activities and Challenge Submissions Router."""
from datetime import datetime, timezone
import os
from pathlib import Path
import secrets
from typing import Literal
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ConfigDict, Field
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_roles
from app.core.errors import AppException
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/activities", tags=["Practical Activities"])
settings = get_settings()

VALID_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webm", ".mp3", ".wav"}
VALID_TRANSITIONS = {
    "draft": ["submitted"],
    "submitted": ["under_review", "reviewed", "revision_required"],
    "under_review": ["reviewed", "revision_required"],
    "revision_required": ["submitted"],
    "reviewed": [],
}


class RubricScoreItem(BaseModel):
    criterion: str
    score: float
    max_points: float
    notes: str = ""


class ActivityReviewRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    status: Literal["reviewed", "revision_required"]
    feedback: str = Field(..., min_length=5)
    rubric_scores: list[RubricScoreItem] = []


@router.get("")
async def list_activities(
    category_id: str | None = None,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List all available practical activities with current student submission statuses."""
    query = {}
    if category_id:
        query["category_id"] = validate_object_id(category_id, "category_id")

    activities = await db.practical_activities.find(query).to_list(50)

    # Attach student's submission status if authenticated as student
    if current_user and current_user.get("role") == "student":
        student_id = current_user["_id"]
        for act in activities:
            sub = await db.activity_submissions.find_one(
                {"student_id": student_id, "activity_id": act["_id"]},
                sort=[("updated_at", DESCENDING)],
            )
            act["student_submission"] = clean_mongo_doc(sub) if sub else None

    return format_response(activities)


@router.get("/{activity_id}")
async def get_activity_detail(
    activity_id: str,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get single activity details, rubrics, and existing student submission."""
    obj_id = validate_object_id(activity_id, "activity_id")
    act = await db.practical_activities.find_one({"_id": obj_id})
    if not act:
        raise AppException(404, "ACTIVITY_NOT_FOUND", "Practical activity not found.")

    doc = clean_mongo_doc(act)
    if current_user and current_user.get("role") == "student":
        sub = await db.activity_submissions.find_one(
            {"student_id": current_user["_id"], "activity_id": obj_id},
            sort=[("updated_at", DESCENDING)],
        )
        doc["student_submission"] = clean_mongo_doc(sub) if sub else None

    return format_response(doc)


@router.post("/{activity_id}/submissions")
async def submit_activity(
    activity_id: str,
    text_response: str = Form(""),
    is_draft: bool = Form(False),
    file: UploadFile | None = File(None),
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Submit or update practical activity response (draft or submitted).
    Supports optional file attachments (audio, PDF, docx).
    """
    act_id = validate_object_id(activity_id, "activity_id")
    act = await db.practical_activities.find_one({"_id": act_id})
    if not act:
        raise AppException(404, "ACTIVITY_NOT_FOUND", "Activity not found.")

    student_id = current_user["_id"]
    now = datetime.now(timezone.utc)

    # File upload handling
    attachment_path = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in VALID_EXTENSIONS:
            raise AppException(400, "INVALID_FILE_TYPE", f"File type '{ext}' is not permitted.")

        file_bytes = await file.read()
        if len(file_bytes) > settings.MAX_UPLOAD_MB * 1024 * 1024:
            raise AppException(400, "FILE_TOO_LARGE", f"File exceeds {settings.MAX_UPLOAD_MB}MB limit.")

        safe_filename = f"{secrets.token_hex(16)}{ext}"
        upload_dir = Path(__file__).resolve().parent.parent.parent / settings.UPLOAD_DIR
        upload_dir.mkdir(exist_ok=True)
        file_dest = upload_dir / safe_filename
        with open(file_dest, "wb") as f:
            f.write(file_bytes)
        attachment_path = f"/uploads/{safe_filename}"

    new_status = "draft" if is_draft else "submitted"

    # Find existing submission
    existing = await db.activity_submissions.find_one({
        "student_id": student_id,
        "activity_id": act_id,
    })

    if existing and existing.get("status") == "reviewed":
        raise AppException(400, "ALREADY_REVIEWED", "This activity has already been reviewed by faculty.")

    sub_doc = {
        "student_id": student_id,
        "student_name": current_user.get("full_name", ""),
        "activity_id": act_id,
        "activity_title": act.get("title", ""),
        "text_response": text_response.strip(),
        "status": new_status,
        "updated_at": now,
    }
    if attachment_path:
        sub_doc["attachment_url"] = attachment_path

    if existing:
        await db.activity_submissions.update_one(
            {"_id": existing["_id"]},
            {"$set": sub_doc},
        )
        sub_doc["_id"] = existing["_id"]
    else:
        sub_doc["created_at"] = now
        res = await db.activity_submissions.insert_one(sub_doc)
        sub_doc["_id"] = res.inserted_id

    # If submitted (not draft), notify assigned faculty
    if not is_draft:
        assignment = await db.faculty_assignments.find_one({"student_id": student_id})
        if assignment:
            await db.notifications.insert_one({
                "user_id": assignment["faculty_id"],
                "title": "New Activity Submission",
                "message": f"Student {current_user.get('full_name')} submitted '{act.get('title')}' for review.",
                "type": "submission_review",
                "is_read": False,
                "created_at": now,
            })

    return format_response(sub_doc)


@router.get("/submissions/queue")
async def get_submissions_queue(
    submission_status: str | None = None,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Faculty submissions review queue (filtered to assigned students for faculty)."""
    query = {}
    if submission_status and submission_status != "all":
        query["status"] = submission_status
    else:
        query["status"] = {"$in": ["submitted", "under_review", "revision_required", "reviewed"]}

    if current_user.get("role") == "faculty":
        # Get assigned student IDs
        assignments = await db.faculty_assignments.find({"faculty_id": current_user["_id"]}).to_list(500)
        assigned_student_ids = [a["student_id"] for a in assignments]
        query["student_id"] = {"$in": assigned_student_ids}

    submissions = await db.activity_submissions.find(query).sort("updated_at", DESCENDING).to_list(100)
    return format_response(submissions)


@router.patch("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: str,
    payload: ActivityReviewRequest,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Faculty reviews, grades with rubric, and provides constructive feedback."""
    sub_id = validate_object_id(submission_id, "submission_id")
    sub = await db.activity_submissions.find_one({"_id": sub_id})
    if not sub:
        raise AppException(404, "SUBMISSION_NOT_FOUND", "Submission not found.")

    # Faculty access check: must be assigned or admin
    if current_user.get("role") == "faculty":
        is_assigned = await db.faculty_assignments.find_one({
            "faculty_id": current_user["_id"],
            "student_id": sub["student_id"],
        })
        if not is_assigned:
            raise AppException(403, "FORBIDDEN", "You are not assigned to this student.")

    now = datetime.now(timezone.utc)
    total_score = sum(item.score for item in payload.rubric_scores) if payload.rubric_scores else 80.0

    update_fields = {
        "status": payload.status,
        "faculty_feedback": payload.feedback,
        "rubric_scores": [item.model_dump() for item in payload.rubric_scores],
        "score": total_score,
        "reviewed_by": current_user["_id"],
        "reviewed_by_name": current_user.get("full_name", "Faculty"),
        "reviewed_at": now,
        "updated_at": now,
    }

    await db.activity_submissions.update_one({"_id": sub_id}, {"$set": update_fields})

    # If approved (reviewed), award points idempotently
    if payload.status == "reviewed":
        try:
            pt = {
                "student_id": sub["student_id"],
                "source_type": "activity_approved",
                "source_id": str(sub["activity_id"]),
                "points": 100,
                "description": f"Faculty approved: {sub.get('activity_title', 'Activity')}",
                "created_at": now,
            }
            await db.point_transactions.insert_one(pt)
            await db.student_profiles.update_one(
                {"user_id": sub["student_id"]},
                {
                    "$inc": {"total_points": 100, "completed_activities_count": 1},
                    "$set": {"last_activity_date": now, "updated_at": now},
                },
            )
        except DuplicateKeyError:
            pass

    # Notify student
    await db.notifications.insert_one({
        "user_id": sub["student_id"],
        "title": "Activity Review Update",
        "message": f"Faculty {current_user.get('full_name')} evaluated '{sub.get('activity_title')}': {payload.status.replace('_', ' ').title()}.",
        "type": "activity_feedback",
        "is_read": False,
        "created_at": now,
    })

    return format_response({"message": "Review submitted successfully."})
