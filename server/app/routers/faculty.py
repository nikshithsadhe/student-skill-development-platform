"""Faculty Portal Management Router."""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.errors import AppException
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/faculty", tags=["Faculty Management"])


@router.get("/dashboard")
async def get_faculty_dashboard(
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve faculty dashboard overview widgets and assigned student metrics."""
    faculty_id = current_user["_id"]

    # 1. Assigned students
    assignments = await db.faculty_assignments.find({"faculty_id": faculty_id}).to_list(500)
    assigned_student_ids = [a["student_id"] for a in assignments]

    # 2. Pending submissions from assigned students
    pending_count = await db.activity_submissions.count_documents({
        "student_id": {"$in": assigned_student_ids},
        "status": {"$in": ["submitted", "under_review"]},
    })

    # 3. Reviewed submissions
    reviewed_count = await db.activity_submissions.count_documents({
        "student_id": {"$in": assigned_student_ids},
        "status": "reviewed",
    })

    # 4. Average progress of assigned students
    profiles = await db.student_profiles.find(
        {"user_id": {"$in": assigned_student_ids}}
    ).to_list(500)

    avg_skill_score = 0.0
    if profiles:
        total = sum(p.get("overall_skill_score", 0.0) for p in profiles)
        avg_skill_score = round(total / len(profiles), 1)

    # 5. Recent submissions
    recent_submissions = await db.activity_submissions.find(
        {"student_id": {"$in": assigned_student_ids}}
    ).sort("updated_at", -1).limit(5).to_list(5)

    return format_response({
        "assigned_students_count": len(assigned_student_ids),
        "pending_submissions_count": pending_count,
        "reviewed_submissions_count": reviewed_count,
        "average_skill_score": avg_skill_score,
        "recent_submissions": clean_mongo_doc(recent_submissions),
    })


@router.get("/students")
async def get_assigned_students(
    search: str | None = None,
    branch: str | None = None,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List students assigned to this faculty member with skill profiles."""
    faculty_id = current_user["_id"]
    assignments = await db.faculty_assignments.find({"faculty_id": faculty_id}).to_list(500)
    assigned_student_ids = [a["student_id"] for a in assignments]

    query = {"_id": {"$in": assigned_student_ids}}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
        ]

    students = await db.users.find(query).to_list(200)

    result = []
    for s in students:
        profile = await db.student_profiles.find_one({"user_id": s["_id"]})
        if branch and profile and profile.get("branch") != branch:
            continue
        item = clean_mongo_doc(s)
        item["profile"] = clean_mongo_doc(profile)
        result.append(item)

    return format_response(result)


@router.get("/students/{student_id}")
async def get_student_detail(
    student_id: str,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """View full profile, assessment attempts, and activity history for an assigned student."""
    st_id = validate_object_id(student_id, "student_id")

    # Verify assignment for faculty
    if current_user.get("role") == "faculty":
        is_assigned = await db.faculty_assignments.find_one({
            "faculty_id": current_user["_id"],
            "student_id": st_id,
        })
        if not is_assigned:
            raise AppException(403, "FORBIDDEN", "You are not assigned to this student.")

    student = await db.users.find_one({"_id": st_id})
    if not student:
        raise AppException(404, "NOT_FOUND", "Student not found.")

    profile = await db.student_profiles.find_one({"user_id": st_id})
    attempts = await db.assessment_attempts.find({"student_id": st_id}).sort("completed_at", -1).to_list(20)
    submissions = await db.activity_submissions.find({"student_id": st_id}).sort("updated_at", -1).to_list(20)

    return format_response({
        "student": clean_mongo_doc(student),
        "profile": clean_mongo_doc(profile),
        "assessment_attempts": clean_mongo_doc(attempts),
        "submissions": clean_mongo_doc(submissions),
    })


@router.get("/reports")
async def get_faculty_cohort_report(
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Aggregate cohort analytics for faculty's assigned students."""
    faculty_id = current_user["_id"]
    assignments = await db.faculty_assignments.find({"faculty_id": faculty_id}).to_list(500)
    assigned_student_ids = [a["student_id"] for a in assignments]

    profiles = await db.student_profiles.find({"user_id": {"$in": assigned_student_ids}}).to_list(500)
    
    # Calculate distributions
    score_distribution = [
        {"range": "0-40%", "count": sum(1 for p in profiles if p.get("overall_skill_score", 0) < 40)},
        {"range": "40-60%", "count": sum(1 for p in profiles if 40 <= p.get("overall_skill_score", 0) < 60)},
        {"range": "60-80%", "count": sum(1 for p in profiles if 60 <= p.get("overall_skill_score", 0) < 80)},
        {"range": "80-100%", "count": sum(1 for p in profiles if p.get("overall_skill_score", 0) >= 80)},
    ]

    total_submissions = await db.activity_submissions.count_documents({"student_id": {"$in": assigned_student_ids}})
    reviewed_submissions = await db.activity_submissions.count_documents({
        "student_id": {"$in": assigned_student_ids},
        "status": "reviewed",
    })

    return format_response({
        "cohort_size": len(assigned_student_ids),
        "score_distribution": score_distribution,
        "total_submissions": total_submissions,
        "reviewed_submissions": reviewed_submissions,
        "pending_reviews": total_submissions - reviewed_submissions,
    })

