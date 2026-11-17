"""Skill Assessment and Diagnostic Scoring Router."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_roles
from app.core.errors import AppException
from app.schemas.assessments import AssessmentCreateRequest, AssessmentSubmissionRequest
from app.services.scoring import calculate_assessment_results
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("")
async def list_assessments(
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List published assessments with student completion status."""
    assessments = await db.assessments.find({"status": "published"}).to_list(50)

    # Attach student's latest attempt if authenticated
    if current_user and current_user.get("role") == "student":
        student_id = current_user["_id"]
        for asm in assessments:
            latest_attempt = await db.assessment_attempts.find_one(
                {"student_id": student_id, "assessment_id": asm["_id"]},
                sort=[("completed_at", DESCENDING)],
            )
            if latest_attempt:
                asm["latest_attempt"] = {
                    "score": latest_attempt.get("total_score"),
                    "completed_at": latest_attempt.get("completed_at"),
                    "strengths_count": len(latest_attempt.get("strengths", [])),
                }
            else:
                asm["latest_attempt"] = None

    # Strip correct answers from list view
    clean_list = []
    for asm in assessments:
        doc = clean_mongo_doc(asm)
        if "questions" in doc:
            doc["questions_count"] = len(doc["questions"])
            del doc["questions"]
        clean_list.append(doc)

    return format_response(clean_list)


@router.get("/attempts/history")
async def get_assessment_history(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve all historical assessment attempts for current student."""
    attempts = await db.assessment_attempts.find(
        {"student_id": current_user["_id"]}
    ).sort("completed_at", DESCENDING).to_list(50)

    return format_response(attempts)


@router.get("/{assessment_id}")
async def get_assessment_detail(
    assessment_id: str,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get assessment details and questions.
    Security: Strips correct_index and explanation before submission!
    """
    obj_id = validate_object_id(assessment_id, "assessment_id")
    asm = await db.assessments.find_one({"_id": obj_id})
    if not asm:
        raise AppException(404, "ASSESSMENT_NOT_FOUND", "Assessment not found.")

    doc = clean_mongo_doc(asm)

    # Sanitize questions for test-taker: remove answers/explanations
    user_role = current_user.get("role") if current_user else "student"
    if user_role not in ["faculty", "admin"]:
        sanitized_questions = []
        for q in doc.get("questions", []):
            sanitized = {
                "question": q.get("question"),
                "question_type": q.get("question_type"),
                "options": q.get("options", []),
                "category_slug": q.get("category_slug"),
                "score_weight": q.get("score_weight", 5),
            }
            sanitized_questions.append(sanitized)
        doc["questions"] = sanitized_questions

    return format_response(doc)


@router.post("/{assessment_id}/attempts", status_code=status.HTTP_201_CREATED)
async def submit_assessment_attempt(
    assessment_id: str,
    payload: AssessmentSubmissionRequest,
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Submit answers for evaluation.
    Performs server-side scoring with documented transparent formula.
    Protects against duplicate submissions and awards gamification points.
    """
    asm_id = validate_object_id(assessment_id, "assessment_id")
    asm = await db.assessments.find_one({"_id": asm_id})
    if not asm:
        raise AppException(404, "ASSESSMENT_NOT_FOUND", "Assessment not found.")

    student_id = current_user["_id"]
    now = datetime.now(timezone.utc)

    # Check duplicate submission using idempotency key if provided
    if payload.idempotency_key:
        duplicate = await db.assessment_attempts.find_one({
            "student_id": student_id,
            "idempotency_key": payload.idempotency_key,
        })
        if duplicate:
            return format_response(duplicate)

    questions = asm.get("questions", [])
    raw_answers = [a.model_dump() for a in payload.answers]

    # Calculate transparent scoring
    scoring_result = calculate_assessment_results(questions, raw_answers)
    total_score = scoring_result["overall_score"]

    # Create attempt document
    attempt_doc = {
        "student_id": student_id,
        "assessment_id": asm_id,
        "assessment_title": asm.get("title", ""),
        "total_score": total_score,
        "total_earned": scoring_result["total_earned"],
        "total_max": scoring_result["total_max"],
        "skill_wise_scores": scoring_result["skill_wise_scores"],
        "strengths": scoring_result["strengths"],
        "improvement_areas": scoring_result["improvement_areas"],
        "detailed_breakdown": scoring_result["detailed_breakdown"],
        "formula_documentation": scoring_result["formula_documentation"],
        "idempotency_key": payload.idempotency_key,
        "completed_at": now,
    }

    insert_result = await db.assessment_attempts.insert_one(attempt_doc)
    attempt_doc["_id"] = insert_result.inserted_id

    # Update student profile: overall_skill_score & completed_assessments_count
    await db.student_profiles.update_one(
        {"user_id": student_id},
        {
            "$set": {
                "overall_skill_score": total_score,
                "last_activity_date": now,
                "updated_at": now,
            },
            "$inc": {"completed_assessments_count": 1},
        },
    )

    # Award idempotent points (75 points for completing assessment)
    try:
        pt_doc = {
            "student_id": student_id,
            "source_type": "assessment_completion",
            "source_id": str(asm_id),
            "points": 75,
            "description": f"Completed diagnostic assessment: {asm.get('title')}",
            "created_at": now,
        }
        await db.point_transactions.insert_one(pt_doc)
        await db.student_profiles.update_one(
            {"user_id": student_id},
            {"$inc": {"total_points": 75}},
        )
    except DuplicateKeyError:
        pass

    # Award Diagnostic Pioneer badge if initial assessment
    if asm.get("is_initial"):
        try:
            badge = await db.achievement_badges.find_one({"slug": "diagnostic-pioneer"})
            if badge:
                await db.student_achievements.update_one(
                    {"student_id": student_id, "badge_slug": "diagnostic-pioneer"},
                    {"$setOnInsert": {
                        "student_id": student_id,
                        "badge_id": badge["_id"],
                        "badge_slug": "diagnostic-pioneer",
                        "badge_title": badge["title"],
                        "earned_at": now,
                    }},
                    upsert=True,
                )
        except Exception:
            pass

    # Notification
    await db.notifications.insert_one({
        "user_id": student_id,
        "title": "Assessment Results Ready",
        "message": f"You scored {total_score}% on {asm.get('title')}. View your strengths and personalized learning recommendations.",
        "type": "assessment_result",
        "is_read": False,
        "created_at": now,
    })

    return format_response(attempt_doc)


@router.get("/{assessment_id}/results")
async def get_latest_results(
    assessment_id: str,
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get latest assessment result for current student."""
    asm_id = validate_object_id(assessment_id, "assessment_id")
    attempt = await db.assessment_attempts.find_one(
        {"student_id": current_user["_id"], "assessment_id": asm_id},
        sort=[("completed_at", DESCENDING)],
    )
    if not attempt:
        raise AppException(404, "NO_RESULTS_FOUND", "No completed attempt found for this assessment.")

    return format_response(attempt)
