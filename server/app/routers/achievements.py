"""Gamification, Badges, and Leaderboard Router."""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(tags=["Gamification & Leaderboard"])


@router.get("/achievements")
@router.get("/achievements/badges")
async def get_all_badges(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all achievement badges available on the platform."""
    badges = await db.achievement_badges.find().to_list(50)
    return format_response(badges)


@router.get("/achievements/me")
@router.get("/achievements/points")
async def get_my_achievements(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve badges earned by the current student and recent point transactions."""
    student_id = current_user["_id"]
    earned_badges = await db.student_achievements.find({"student_id": student_id}).to_list(50)
    recent_transactions = await db.point_transactions.find(
        {"student_id": student_id}
    ).sort("created_at", DESCENDING).limit(15).to_list(15)

    profile = await db.student_profiles.find_one({"user_id": student_id})
    total_points = profile.get("total_points", 0) if profile else 0

    # Calculate user tier/level
    level = "Beginner"
    if total_points >= 400:
        level = "Advanced Practitioner"
    elif total_points >= 150:
        level = "Intermediate Communicator"

    return format_response({
        "total_points": total_points,
        "level": level,
        "streak_days": profile.get("current_streak_days", 0) if profile else 0,
        "earned_badges": clean_mongo_doc(earned_badges),
        "recent_transactions": clean_mongo_doc(recent_transactions),
    })


@router.get("/leaderboard")
@router.get("/achievements/leaderboard")
async def get_leaderboard(db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Privacy-preserving leaderboard: shows display names and points only (no emails).
    """
    profiles = await db.student_profiles.find(
        {"total_points": {"$gt": 0}}
    ).sort("total_points", DESCENDING).limit(20).to_list(20)

    rankings = []
    for rank, p in enumerate(profiles, start=1):
        user = await db.users.find_one({"_id": p["user_id"]})
        if user and user.get("is_active", True):
            rankings.append({
                "rank": rank,
                "display_name": user.get("full_name", f"Student {rank}"),
                "branch": p.get("branch", "Engineering"),
                "semester": p.get("semester", 1),
                "total_points": p.get("total_points", 0),
                "overall_skill_score": p.get("overall_skill_score", 0.0),
            })

    return format_response(rankings)
