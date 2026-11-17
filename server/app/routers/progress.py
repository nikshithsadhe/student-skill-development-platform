"""Progress Analytics and PDF Report Generation Router."""
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.errors import AppException
from app.services.pdf import generate_pdf_report_sync
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/progress", tags=["Progress & Reports"])


@router.get("")
@router.get("/me")
@router.get("/summary")
async def get_my_progress(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve the current student's recorded progress metrics and charts."""
    student_id = current_user["_id"]

    # 1. Profile stats
    profile = await db.student_profiles.find_one({"user_id": student_id})

    # 2. Latest assessment
    latest_attempt = await db.assessment_attempts.find_one(
        {"student_id": student_id},
        sort=[("completed_at", DESCENDING)],
    )

    # 3. Initial assessment (for comparison)
    initial_attempt = await db.assessment_attempts.find_one(
        {"student_id": student_id},
        sort=[("completed_at", 1)],
    )

    # 4. Module progress
    all_modules_count = await db.learning_modules.count_documents({"status": "published"})
    completed_modules = await db.learning_progress.find({
        "student_id": student_id,
        "status": "completed",
    }).to_list(100)

    # 5. Weekly points earned from recorded transactions (no simulated chart data).
    now = datetime.now(timezone.utc)
    week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
    transactions = await db.point_transactions.find({
        "student_id": student_id,
        "created_at": {"$gte": week_start},
    }).to_list(500)
    weekly_chart = [
        {"day": day, "points": 0}
        for day in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    ]
    for transaction in transactions:
        created_at = transaction.get("created_at")
        if isinstance(created_at, datetime):
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            weekly_chart[created_at.weekday()]["points"] += transaction.get("points", 0)

    return format_response({
        "profile": clean_mongo_doc(profile),
        "total_modules_published": all_modules_count,
        "completed_modules_count": len(completed_modules),
        "module_completion_rate": round((len(completed_modules) / max(1, all_modules_count)) * 100, 1),
        "latest_assessment": clean_mongo_doc(latest_attempt),
        "initial_assessment": clean_mongo_doc(initial_attempt),
        "weekly_chart": weekly_chart,
    })


@router.get("/report.pdf")
async def download_my_progress_pdf(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Convenience endpoint for student to download their own progress report."""
    return await download_student_progress_pdf(str(current_user["_id"]), current_user, db)


@router.get("/reports/{student_id}/pdf")
async def download_student_progress_pdf(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Generate and stream ReportLab PDF progress report.
    Permission check: Student can download own; Faculty can download assigned; Admin can download any.
    """
    target_student_id = validate_object_id(student_id, "student_id")

    user_role = current_user.get("role")
    if user_role == "student" and str(current_user["_id"]) != str(target_student_id):
        raise AppException(403, "FORBIDDEN", "You can only download your own progress report.")

    if user_role == "faculty":
        is_assigned = await db.faculty_assignments.find_one({
            "faculty_id": current_user["_id"],
            "student_id": target_student_id,
        })
        if not is_assigned:
            raise AppException(403, "FORBIDDEN", "You are not assigned to this student.")

    # Gather data for report
    student_user = await db.users.find_one({"_id": target_student_id})
    if not student_user:
        raise AppException(404, "STUDENT_NOT_FOUND", "Student account not found.")

    student_profile = await db.student_profiles.find_one({"user_id": target_student_id})
    latest_attempt = await db.assessment_attempts.find_one(
        {"student_id": target_student_id},
        sort=[("completed_at", DESCENDING)],
    )

    # Completed modules
    completed_progress = await db.learning_progress.find({
        "student_id": target_student_id,
        "status": "completed",
    }).to_list(50)
    completed_modules = []
    for cp in completed_progress:
        mod = await db.learning_modules.find_one({"_id": cp["module_id"]})
        if mod:
            completed_modules.append({
                "title": mod.get("title"),
                "category_name": mod.get("category_name"),
                "completed_at": cp.get("completed_at"),
            })

    report_data = {
        "student": clean_mongo_doc(student_user),
        "profile": clean_mongo_doc(student_profile),
        "latest_attempt": clean_mongo_doc(latest_attempt),
        "completed_modules": completed_modules,
    }

    # Run PDF generation in threadpool to prevent blocking the event loop
    pdf_bytes = await asyncio.to_thread(generate_pdf_report_sync, report_data)

    safe_name = student_user.get("full_name", "Student").replace(" ", "_")
    filename = f"SSP_Progress_Report_{safe_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
