"""Asynchronous MongoDB connection management using Motor."""
from datetime import datetime
import json
import logging
from pathlib import Path
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, IndexModel
from app.core.config import get_settings

logger = logging.getLogger("ssp.database")
settings = get_settings()

SNAPSHOT_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SNAPSHOT_PATH = SNAPSHOT_DIR / "local_mock_db.json"


def _serialize_val(val: Any) -> Any:
    if isinstance(val, ObjectId):
        return {"$oid": str(val)}
    if isinstance(val, datetime):
        return {"$date": val.isoformat()}
    if isinstance(val, dict):
        return {k: _serialize_val(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_serialize_val(x) for x in val]
    return val


def _deserialize_val(val: Any) -> Any:
    if isinstance(val, dict):
        if len(val) == 1 and "$oid" in val:
            return ObjectId(val["$oid"])
        if len(val) == 1 and "$date" in val:
            return datetime.fromisoformat(val["$date"])
        return {k: _deserialize_val(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_deserialize_val(x) for x in val]
    return val


class DatabaseManager:
    """Manages the MongoDB client and database connections."""
    client: AsyncIOMotorClient | Any = None
    db: AsyncIOMotorDatabase | Any = None
    is_mock: bool = False

    @classmethod
    async def save_mock_snapshot(cls):
        """Persist in-memory mock MongoDB collections to local JSON file so signups survive restarts."""
        if not cls.is_mock or cls.db is None:
            return
        try:
            SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
            collections = await cls.db.list_collection_names()
            dump_data = {}
            for col_name in collections:
                if col_name.startswith("system."):
                    continue
                cursor = cls.db[col_name].find({})
                docs = await cursor.to_list(length=10000)
                dump_data[col_name] = [_serialize_val(doc) for doc in docs]

            tmp_path = SNAPSHOT_DIR / "local_mock_db.tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(dump_data, f, indent=2)
            tmp_path.replace(SNAPSHOT_PATH)
            logger.info(f"Persisted mock database snapshot ({len(collections)} collections) to {SNAPSHOT_PATH}")
        except Exception as e:
            logger.warning(f"Could not persist mock database snapshot: {e}")

    @classmethod
    async def load_mock_snapshot(cls) -> bool:
        """Load in-memory mock MongoDB collections from local JSON file."""
        if not cls.is_mock or cls.db is None or not SNAPSHOT_PATH.exists():
            return False
        try:
            with open(SNAPSHOT_PATH, "r", encoding="utf-8") as f:
                dump_data = json.load(f)
            for col_name, docs in dump_data.items():
                if docs:
                    deserialized = [_deserialize_val(d) for d in docs]
                    await cls.db[col_name].insert_many(deserialized)
            logger.info(f"Restored mock database snapshot from {SNAPSHOT_PATH}")
            return True
        except Exception as e:
            logger.warning(f"Could not load mock database snapshot: {e}")
            return False

    @classmethod
    async def connect(cls):
        """Initialize database connection and verify connectivity."""
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI} (DB: {settings.MONGODB_DB_NAME})...")
        try:
            temp_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500,
            )
            # Ping database to confirm reachability
            await temp_client.admin.command("ping")
            cls.client = temp_client
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            cls.is_mock = False
            logger.info("Successfully connected to MongoDB.")
        except Exception as exc:
            logger.warning(f"Could not connect to live MongoDB at {settings.MONGODB_URI}: {exc}")
            if settings.is_development:
                logger.warning(
                    "[DEV FALLBACK] Initializing in-memory mock MongoDB (mongomock-motor). "
                    "To persist data, run MongoDB locally on port 27017 or set MONGODB_URI to a MongoDB Atlas connection string in .env."
                )
                from mongomock_motor import AsyncMongoMockClient
                cls.client = AsyncMongoMockClient()
                cls.db = cls.client[settings.MONGODB_DB_NAME]
                cls.is_mock = True
            else:
                logger.error("Production MongoDB connection failure.")
                raise exc

        await cls.create_indexes()

        # Seed initial content or restore from snapshot
        try:
            restored = False
            if cls.is_mock:
                restored = await cls.load_mock_snapshot()

            if not restored:
                cat_count = await cls.db.skill_categories.count_documents({})
                if cat_count == 0:
                    logger.info("Database is empty. Seeding initial categories, modules, assessments, and activities...")
                    from scripts.seed import seed_database_direct
                    await seed_database_direct(cls.db, with_demo_users=settings.is_development, print_logs=False)
                    logger.info("Initial platform content successfully seeded.")
                    if cls.is_mock:
                        await cls.save_mock_snapshot()
        except Exception as seed_err:
            logger.warning(f"Note on initial seeding / restore: {seed_err}")

    @classmethod
    async def disconnect(cls):
        """Close MongoDB connection pool and persist snapshot."""
        if cls.is_mock:
            await cls.save_mock_snapshot()
        if cls.client:
            logger.info("Closing MongoDB connection pool.")
            cls.client.close()
            cls.client = None
            cls.db = None

    @classmethod
    async def create_indexes(cls):
        """Create idempotent indexes across all collections."""
        if cls.db is None:
            return

        try:
            # Users collection
            await cls.db.users.create_indexes([
                IndexModel([("email", ASCENDING)], unique=True, name="uniq_user_email"),
                IndexModel([("student_id", ASCENDING)], unique=True, sparse=True, name="uniq_user_student_id"),
                IndexModel([("role", ASCENDING)], name="idx_user_role"),
                IndexModel([("is_active", ASCENDING)], name="idx_user_active"),
            ])

            # Student profiles
            await cls.db.student_profiles.create_indexes([
                IndexModel([("user_id", ASCENDING)], unique=True, name="uniq_profile_user"),
                IndexModel([("student_id", ASCENDING)], unique=True, name="uniq_profile_student_id"),
                IndexModel([("branch", ASCENDING), ("semester", ASCENDING)], name="idx_student_branch_sem"),
            ])

            # Faculty profiles
            await cls.db.faculty_profiles.create_indexes([
                IndexModel([("user_id", ASCENDING)], unique=True, name="uniq_faculty_user"),
                IndexModel([("department", ASCENDING)], name="idx_faculty_dept"),
            ])

            # Point transactions - CRITICAL: idempotent point awards
            await cls.db.point_transactions.create_indexes([
                IndexModel(
                    [("student_id", ASCENDING), ("source_type", ASCENDING), ("source_id", ASCENDING)],
                    unique=True,
                    name="uniq_point_transaction",
                ),
                IndexModel([("student_id", ASCENDING), ("created_at", ASCENDING)], name="idx_pt_student_date"),
            ])

            # Learning modules & categories
            await cls.db.skill_categories.create_indexes([
                IndexModel([("slug", ASCENDING)], unique=True, name="uniq_category_slug"),
            ])
            await cls.db.learning_modules.create_indexes([
                IndexModel([("category_id", ASCENDING)], name="idx_module_category"),
                IndexModel([("status", ASCENDING)], name="idx_module_status"),
                IndexModel([("slug", ASCENDING)], unique=True, name="uniq_module_slug"),
            ])

            # Learning progress
            await cls.db.learning_progress.create_indexes([
                IndexModel([("student_id", ASCENDING), ("module_id", ASCENDING)], unique=True, name="uniq_student_module_progress"),
            ])

            # Assessment attempts
            await cls.db.assessment_attempts.create_indexes([
                IndexModel([("student_id", ASCENDING), ("assessment_id", ASCENDING)], name="idx_attempt_student_assessment"),
                IndexModel([("status", ASCENDING)], name="idx_attempt_status"),
            ])

            # Activity submissions
            await cls.db.activity_submissions.create_indexes([
                IndexModel([("student_id", ASCENDING), ("activity_id", ASCENDING)], name="idx_sub_student_activity"),
                IndexModel([("status", ASCENDING)], name="idx_sub_status"),
                IndexModel([("assigned_faculty_id", ASCENDING)], name="idx_sub_faculty"),
            ])

            # Faculty assignments
            await cls.db.faculty_assignments.create_indexes([
                IndexModel([("faculty_id", ASCENDING), ("student_id", ASCENDING)], unique=True, name="uniq_faculty_student_assignment"),
            ])

            # Notifications
            await cls.db.notifications.create_indexes([
                IndexModel([("user_id", ASCENDING), ("is_read", ASCENDING)], name="idx_user_unread_notifications"),
                IndexModel([("created_at", ASCENDING)], name="idx_notification_date"),
            ])

            # Password reset tokens (with TTL index)
            await cls.db.password_reset_tokens.create_indexes([
                IndexModel([("token_hash", ASCENDING)], unique=True, name="uniq_reset_token"),
                IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="ttl_reset_token"),
            ])

            # Audit logs
            await cls.db.audit_logs.create_indexes([
                IndexModel([("created_at", ASCENDING)], name="idx_audit_timestamp"),
                IndexModel([("user_id", ASCENDING)], name="idx_audit_user"),
            ])

            logger.info("Database indexes verified and applied.")
        except Exception as exc:
            logger.warning(f"Note on index creation: {exc}")


def get_db() -> AsyncIOMotorDatabase:
    """Dependency helper to get the active database instance."""
    if DatabaseManager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return DatabaseManager.db


def get_client() -> AsyncIOMotorClient:
    """Dependency helper to get the active client instance."""
    if DatabaseManager.client is None:
        raise RuntimeError("Database client has not been initialized.")
    return DatabaseManager.client
