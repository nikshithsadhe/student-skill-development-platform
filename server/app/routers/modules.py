"""Learning Modules and Skill Categories router."""
from datetime import datetime, timezone
import re
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_current_user, require_roles
from app.core.errors import AppException
from app.schemas.modules import ModuleCreateRequest, ModuleUpdateRequest
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/modules", tags=["Modules"])


def slugify(text: str) -> str:
    """Generate URL-safe slug from string."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


@router.get("/categories")
async def list_categories(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all soft-skill categories with module counts."""
    categories = await db.skill_categories.find().sort("name", ASCENDING).to_list(100)
    # Add count of published modules
    for cat in categories:
        count = await db.learning_modules.count_documents({
            "category_id": cat["_id"],
            "status": "published",
        })
        cat["module_count"] = count

    return format_response(categories)


@router.get("")
async def list_modules(
    category_id: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    module_status: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    List learning modules with optional category, difficulty, and search filters.
    Attaches student learning progress when authenticated as a student.
    """
    query: dict = {}

    # Role-based status visibility
    user_role = current_user.get("role", "student") if current_user else "student"
    if user_role == "student":
        query["status"] = "published"
    elif module_status:
        query["status"] = module_status

    if category_id:
        query["category_id"] = validate_object_id(category_id, "category_id")

    if difficulty:
        query["difficulty"] = difficulty

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = await db.learning_modules.count_documents(query)
    skip = (page - 1) * limit
    pages = (total + limit - 1) // limit if total > 0 else 1

    cursor = db.learning_modules.find(query).sort("created_at", -1).skip(skip).limit(limit)
    modules = await cursor.to_list(limit)

    # Attach student progress if user is a student
    if current_user and user_role == "student":
        student_id = current_user["_id"]
        for mod in modules:
            progress = await db.learning_progress.find_one({
                "student_id": student_id,
                "module_id": mod["_id"],
            })
            if progress:
                mod["student_progress"] = {
                    "completed_lesson_ids": progress.get("completed_lesson_ids", []),
                    "progress_percentage": progress.get("progress_percentage", 0),
                    "status": progress.get("status", "in_progress"),
                }
            else:
                mod["student_progress"] = {
                    "completed_lesson_ids": [],
                    "progress_percentage": 0,
                    "status": "not_started",
                }

    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
    }
    return format_response(modules, meta=meta)


@router.get("/{module_id}")
async def get_module_detail(
    module_id: str,
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get single module by ID with full lessons and student progress."""
    obj_id = validate_object_id(module_id, "module_id")
    module = await db.learning_modules.find_one({"_id": obj_id})
    if not module:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="MODULE_NOT_FOUND",
            message=f"Module with ID '{module_id}' was not found.",
        )

    # If student, attach progress
    if current_user and current_user.get("role") == "student":
        progress = await db.learning_progress.find_one({
            "student_id": current_user["_id"],
            "module_id": module["_id"],
        })
        if progress:
            module["student_progress"] = {
                "completed_lesson_ids": progress.get("completed_lesson_ids", []),
                "progress_percentage": progress.get("progress_percentage", 0),
                "status": progress.get("status", "in_progress"),
            }
        else:
            module["student_progress"] = {
                "completed_lesson_ids": [],
                "progress_percentage": 0,
                "status": "not_started",
            }

    return format_response(module)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_module(
    payload: ModuleCreateRequest,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new soft-skill learning module (Faculty/Admin only)."""
    cat_id = validate_object_id(payload.category_id, "category_id")
    category = await db.skill_categories.find_one({"_id": cat_id})
    if not category:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="CATEGORY_NOT_FOUND",
            message=f"Category with ID '{payload.category_id}' does not exist.",
        )

    base_slug = slugify(payload.title)
    # Ensure slug uniqueness
    slug = base_slug
    counter = 1
    while await db.learning_modules.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    now = datetime.now(timezone.utc)
    module_doc = {
        "title": payload.title,
        "slug": slug,
        "category_id": cat_id,
        "category_name": category.get("name", ""),
        "description": payload.description,
        "difficulty": payload.difficulty,
        "estimated_minutes": payload.estimated_minutes,
        "learning_objectives": payload.learning_objectives,
        "lessons": [lesson.model_dump() for lesson in payload.lessons],
        "status": payload.status,
        "points_reward": payload.points_reward,
        "created_by": current_user["_id"],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.learning_modules.insert_one(module_doc)
    module_doc["_id"] = result.inserted_id

    # Log audit entry
    await db.audit_logs.insert_one({
        "user_id": current_user["_id"],
        "action": "MODULE_CREATED",
        "details": {"module_id": str(result.inserted_id), "title": payload.title},
        "created_at": now,
    })

    return format_response(module_doc)


@router.patch("/{module_id}")
async def update_module(
    module_id: str,
    payload: ModuleUpdateRequest,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update a learning module."""
    obj_id = validate_object_id(module_id, "module_id")
    existing = await db.learning_modules.find_one({"_id": obj_id})
    if not existing:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="MODULE_NOT_FOUND",
            message=f"Module with ID '{module_id}' was not found.",
        )

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "category_id" in update_data:
        cat_id = validate_object_id(update_data["category_id"], "category_id")
        cat = await db.skill_categories.find_one({"_id": cat_id})
        if not cat:
            raise AppException(404, "CATEGORY_NOT_FOUND", "Category not found.")
        update_data["category_id"] = cat_id
        update_data["category_name"] = cat.get("name", "")

    now = datetime.now(timezone.utc)
    update_data["updated_at"] = now

    updated = await db.learning_modules.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )
    return format_response(updated)


@router.delete("/{module_id}")
async def archive_module(
    module_id: str,
    current_user: dict = Depends(require_roles("faculty", "admin")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Soft archive a module to preserve student completion history."""
    obj_id = validate_object_id(module_id, "module_id")
    now = datetime.now(timezone.utc)
    res = await db.learning_modules.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": "archived", "updated_at": now}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise AppException(404, "MODULE_NOT_FOUND", "Module not found.")

    await db.audit_logs.insert_one({
        "user_id": current_user["_id"],
        "action": "MODULE_ARCHIVED",
        "details": {"module_id": module_id},
        "created_at": now,
    })

    return format_response({"message": "Module successfully archived."})


@router.post("/{module_id}/lessons/{lesson_id}/complete")
async def complete_lesson(
    module_id: str,
    lesson_id: str,
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Mark a lesson complete for the current student.
    Calculates progress percentage and awards idempotent gamification points.
    """
    mod_id = validate_object_id(module_id, "module_id")
    module = await db.learning_modules.find_one({"_id": mod_id, "status": "published"})
    if not module:
        raise AppException(404, "MODULE_NOT_FOUND", "Module not found.")

    lessons = module.get("lessons", [])
    lesson_exists = any(str(l.get("id")) == str(lesson_id) for l in lessons)
    if not lesson_exists:
        raise AppException(404, "LESSON_NOT_FOUND", f"Lesson '{lesson_id}' not found in this module.")

    student_id = current_user["_id"]
    now = datetime.now(timezone.utc)

    # 1. Fetch or create progress document
    progress = await db.learning_progress.find_one({"student_id": student_id, "module_id": mod_id})
    completed_set = set(progress.get("completed_lesson_ids", [])) if progress else set()
    is_new_completion = str(lesson_id) not in completed_set
    completed_set.add(str(lesson_id))

    total_lessons = max(1, len(lessons))
    progress_pct = round((len(completed_set) / total_lessons) * 100, 1)
    is_fully_completed = len(completed_set) >= total_lessons
    module_status_str = "completed" if is_fully_completed else "in_progress"

    # Update learning progress
    await db.learning_progress.update_one(
        {"student_id": student_id, "module_id": mod_id},
        {
            "$set": {
                "completed_lesson_ids": list(completed_set),
                "progress_percentage": progress_pct,
                "status": module_status_str,
                "updated_at": now,
                **({"completed_at": now} if is_fully_completed else {}),
            },
            "$setOnInsert": {
                "student_id": student_id,
                "module_id": mod_id,
                "created_at": now,
            },
        },
        upsert=True,
    )

    points_awarded = 0

    # 2. Idempotent point award for lesson completion (10 points)
    if is_new_completion:
        try:
            pt_doc = {
                "student_id": student_id,
                "source_type": "lesson_completion",
                "source_id": f"{mod_id}:{lesson_id}",
                "points": 10,
                "description": f"Completed lesson in {module.get('title')}",
                "created_at": now,
            }
            await db.point_transactions.insert_one(pt_doc)
            points_awarded += 10
            # Increment student profile total points
            await db.student_profiles.update_one(
                {"user_id": student_id},
                {
                    "$inc": {"total_points": 10},
                    "$set": {"last_activity_date": now, "updated_at": now},
                },
            )
        except DuplicateKeyError:
            # Already awarded, idempotent ignore
            pass

    # 3. If module was newly completed, award module points bonus (50 points)
    if is_fully_completed:
        try:
            module_points = module.get("points_reward", 50)
            bonus_doc = {
                "student_id": student_id,
                "source_type": "module_completion",
                "source_id": str(mod_id),
                "points": module_points,
                "description": f"Completed entire module: {module.get('title')}",
                "created_at": now,
            }
            await db.point_transactions.insert_one(bonus_doc)
            points_awarded += module_points
            # Increment completed_modules_count in student profile
            await db.student_profiles.update_one(
                {"user_id": student_id},
                {
                    "$inc": {"total_points": module_points, "completed_modules_count": 1},
                    "$set": {"last_activity_date": now, "updated_at": now},
                },
            )

            # Issue notification
            await db.notifications.insert_one({
                "user_id": student_id,
                "title": "Module Completed!",
                "message": f"Congratulations! You completed '{module.get('title')}' and earned {module_points} points.",
                "type": "module_completed",
                "is_read": False,
                "created_at": now,
            })
        except DuplicateKeyError:
            # Bonus already granted, idempotent ignore
            pass

    return format_response({
        "lesson_id": lesson_id,
        "completed_lesson_ids": list(completed_set),
        "progress_percentage": progress_pct,
        "status": module_status_str,
        "points_awarded": points_awarded,
    })
