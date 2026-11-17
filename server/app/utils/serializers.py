"""Serialization and document transformation utilities for MongoDB."""
from datetime import datetime
from typing import Any
from bson import ObjectId


SENSITIVE_KEYS = {"password_hash", "reset_token_hash", "verification_token"}


def clean_mongo_doc(doc: Any) -> Any:
    """
    Recursively transform MongoDB documents:
    - Replaces '_id' with string 'id'
    - Converts ObjectId to string
    - Converts datetime to ISO formatted string
    - Strips internal sensitive fields like password hashes
    """
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, list):
        return [clean_mongo_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, val in doc.items():
            if key in SENSITIVE_KEYS:
                continue
            if key == "_id":
                result["id"] = str(val) if isinstance(val, ObjectId) else str(val)
            else:
                result[key] = clean_mongo_doc(val)
        return result
    return doc


def format_response(data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    """Format standard API success payload."""
    payload: dict[str, Any] = {
        "success": True,
        "data": clean_mongo_doc(data),
    }
    if meta is not None:
        payload["meta"] = meta
    return payload
