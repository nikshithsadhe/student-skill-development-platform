"""Mock Interview Practice Lab Router."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ConfigDict, Field
from pymongo import DESCENDING

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.errors import AppException
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/interviews", tags=["Mock Interview Lab"])


class InterviewSubmissionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    question_id: str
    response_text: str = Field(..., min_length=20)
    situation: str = ""
    task: str = ""
    action: str = ""
    result: str = ""
    self_eval_checked: list[str] = []


@router.get("/questions")
async def get_interview_questions(
    category: str | None = None,
    difficulty: str | None = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve mock interview questions filtered by type (HR, Behavioral, Situational)."""
    query = {}
    if category and category != "all":
        query["category"] = category
    if difficulty and difficulty != "all":
        query["difficulty"] = difficulty

    questions = await db.mock_interview_questions.find(query).to_list(50)
    return format_response(questions)


@router.post("/submissions")
async def submit_interview_practice(
    payload: InterviewSubmissionRequest,
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Save student mock interview practice response with STAR breakdown."""
    q_id = validate_object_id(payload.question_id, "question_id")
    question = await db.mock_interview_questions.find_one({"_id": q_id})
    if not question:
        raise AppException(404, "QUESTION_NOT_FOUND", "Interview question not found.")

    student_id = current_user["_id"]
    now = datetime.now(timezone.utc)

    practice_doc = {
        "student_id": student_id,
        "question_id": q_id,
        "question_text": question.get("question", ""),
        "category": question.get("category", "General"),
        "response_text": payload.response_text,
        "star_breakdown": {
            "situation": payload.situation,
            "task": payload.task,
            "action": payload.action,
            "result": payload.result,
        },
        "self_eval_checked": payload.self_eval_checked,
        "created_at": now,
    }

    res = await db.mock_interview_submissions.insert_one(practice_doc)
    practice_doc["_id"] = res.inserted_id

    # Award 20 points for practice session
    await db.point_transactions.insert_one({
        "student_id": student_id,
        "source_type": "interview_practice",
        "source_id": str(res.inserted_id),
        "points": 20,
        "description": f"Completed mock interview response: {question.get('category')}",
        "created_at": now,
    })
    await db.student_profiles.update_one(
        {"user_id": student_id},
        {"$inc": {"total_points": 20}},
    )

    return format_response(practice_doc)


@router.get("/history")
async def get_interview_history(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve student's interview rehearsal history."""
    items = await db.mock_interview_submissions.find(
        {"student_id": current_user["_id"]}
    ).sort("created_at", DESCENDING).to_list(50)
    return format_response(items)
