"""Interactive CLI to create the first admin user."""
import asyncio
from datetime import datetime, timezone
import getpass
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.core.security import hash_password


async def create_admin():
    settings = get_settings()
    print("=" * 60)
    print("  Student Skill Development Platform - Admin Bootstrap CLI")
    print("=" * 60)

    email = input("Enter admin email address: ").strip().lower()
    if not email or "@" not in email:
        print("[ERROR] A valid email address is required.")
        sys.exit(1)

    full_name = input("Enter admin full name: ").strip()
    if not full_name:
        full_name = "System Administrator"

    password = getpass.getpass("Enter secure admin password (min 8 chars): ")
    if len(password) < 8:
        print("[ERROR] Password must be at least 8 characters long.")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm admin password: ")
    if password != confirm_password:
        print("[ERROR] Passwords do not match.")
        sys.exit(1)

    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]

    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"[ERROR] User with email '{email}' already exists.")
        sys.exit(1)

    hashed = await hash_password(password)
    now = datetime.now(timezone.utc)

    user_doc = {
        "email": email,
        "password_hash": hashed,
        "full_name": full_name,
        "role": "admin",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    await db.audit_logs.insert_one({
        "user_id": result.inserted_id,
        "action": "ADMIN_BOOTSTRAP_CREATED",
        "details": {"email": email},
        "created_at": now,
    })

    print("-" * 60)
    print(f"[SUCCESS] Admin account created successfully! ID: {result.inserted_id}")
    print(f"Email: {email}")
    print("You may now log in to the platform with role: admin.")
    print("=" * 60)
    client.close()


if __name__ == "__main__":
    asyncio.run(create_admin())
