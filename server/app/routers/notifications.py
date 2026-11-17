"""Notifications router for in-app alert center."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.errors import AppException
from app.utils.object_id import validate_object_id
from app.utils.serializers import clean_mongo_doc, format_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve notifications for the current authenticated user."""
    user_id = current_user["_id"]
    items = await db.notifications.find({"user_id": user_id}).sort("created_at", DESCENDING).to_list(30)
    unread_count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})

    return format_response({
        "items": clean_mongo_doc(items),
        "unread_count": unread_count,
    })


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Mark a specific notification as read."""
    obj_id = validate_object_id(notification_id, "notification_id")
    await db.notifications.update_one(
        {"_id": obj_id, "user_id": current_user["_id"]},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}},
    )
    return format_response({"message": "Notification marked as read."})


@router.patch("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Mark all notifications as read for current user."""
    await db.notifications.update_many(
        {"user_id": current_user["_id"], "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}},
    )
    return format_response({"message": "All notifications marked as read."})
