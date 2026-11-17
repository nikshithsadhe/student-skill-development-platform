"""Personalized Recommendations Router."""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_db
from app.core.deps import require_roles
from app.services.recommendation import generate_recommendations
from app.utils.serializers import format_response

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("")
@router.get("/me")
async def get_my_recommendations(
    current_user: dict = Depends(require_roles("student")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retrieve personalized rule-based recommendations for current student."""
    recs = await generate_recommendations(current_user["_id"], db)
    return format_response(recs)
