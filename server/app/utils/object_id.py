"""ObjectId parsing and validation utilities."""
from bson import ObjectId
from app.core.errors import AppException


def validate_object_id(id_val: str | ObjectId, field_name: str = "id") -> ObjectId:
    """Validate and convert string to ObjectId. Raises 400 AppException on invalid id."""
    if isinstance(id_val, ObjectId):
        return id_val
    if not isinstance(id_val, str) or not ObjectId.is_valid(id_val):
        raise AppException(
            status_code=400,
            code="INVALID_OBJECT_ID",
            message=f"Invalid {field_name} format: '{id_val}'. Must be a 24-character hexadecimal string.",
        )
    return ObjectId(id_val)


def str_object_id(val: ObjectId | str | None) -> str:
    """Safely convert ObjectId or string to string."""
    if val is None:
        return ""
    return str(val)
