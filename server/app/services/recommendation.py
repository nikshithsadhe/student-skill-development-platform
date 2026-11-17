"""
Rule-Based Personalized Learning Path Recommendation Engine.
Clean interface designed for straightforward future AI extension.
"""
from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.serializers import clean_mongo_doc


async def generate_recommendations(student_id: Any, db: AsyncIOMotorDatabase) -> dict[str, Any]:
    """
    Generate personalized recommendations based on:
    1. Latest diagnostic assessment scores (< 70% categorized as growth areas)
    2. Uncompleted foundational modules in weak disciplines
    3. Uncompleted foundational modules for continued practice.
    """
    # 1. Fetch latest assessment attempt
    latest_attempt = await db.assessment_attempts.find_one(
        {"student_id": student_id},
        sort=[("completed_at", -1)],
    )

    weak_categories = []
    strengths = []
    if latest_attempt:
        skill_scores = latest_attempt.get("skill_wise_scores", {})
        for cat_slug, score in skill_scores.items():
            if score < 70.0:
                weak_categories.append({"slug": cat_slug, "score": score})
            elif score >= 75.0:
                strengths.append({"slug": cat_slug, "score": score})

    # 2. Fetch completed module IDs
    completed_progress = await db.learning_progress.find({
        "student_id": student_id,
        "status": "completed",
    }).to_list(100)
    completed_module_ids = [p["module_id"] for p in completed_progress]

    # 3. Recommend modules targeting weak categories first
    recommended_modules = []
    if weak_categories:
        for item in weak_categories[:3]:
            cat = await db.skill_categories.find_one({"slug": item["slug"]})
            if cat:
                mod = await db.learning_modules.find_one({
                    "category_id": cat["_id"],
                    "_id": {"$nin": completed_module_ids},
                    "status": "published",
                })
                if mod:
                    recommended_modules.append({
                        "module": clean_mongo_doc(mod),
                        "reason": f"Recommended because your {cat.get('name')} diagnostic score was {item['score']}%, which is below the 70% threshold.",
                        "priority": "High",
                    })

    # If few or no weak categories, recommend next uncompleted beginner/intermediate modules
    if len(recommended_modules) < 3:
        generic_mods = await db.learning_modules.find({
            "_id": {"$nin": completed_module_ids},
            "status": "published",
        }).limit(3 - len(recommended_modules)).to_list(5)

        for gm in generic_mods:
            recommended_modules.append({
                "module": clean_mongo_doc(gm),
                "reason": "Foundational curriculum recommendation to expand your collegiate soft-skills repertoire.",
                "priority": "Standard",
            })

    # Weekly milestone suggestions
    weekly_milestones = [
        {"title": "Complete 1 Diagnostic Focus Module", "target_days": 3, "reward_points": 60},
        {"title": "Review 1 Skill Assessment", "target_days": 5, "reward_points": 40},
        {"title": "Practice 1 STAR Behavioral Interview Question", "target_days": 7, "reward_points": 20},
    ]

    return {
        "assessment_taken": latest_attempt is not None,
        "overall_score": latest_attempt.get("total_score") if latest_attempt else None,
        "strengths": strengths,
        "improvement_areas": weak_categories,
        "recommended_modules": recommended_modules,
        "weekly_milestones": weekly_milestones,
    }
