"""FastAPI service for the Student Skill Development Platform."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
import os
import re
import uuid

import bcrypt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from fastapi.staticfiles import StaticFiles

load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "student_skill_platform")
JWT_SECRET = os.getenv("JWT_SECRET", "development-secret-change-me")
ALGORITHM = "HS256"
TOKEN_HOURS = 24
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=4000)
db = client[DB_NAME]
security = HTTPBearer(auto_error=False)
app = FastAPI(title="Student Skill Development Platform API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

COLLECTIONS = {"skills", "courses", "enrollments", "assessments", "challenges", "submissions", "certificates", "projects", "resources", "bookmarks", "notifications", "badges"}
PUBLIC_READ = {"skills", "courses", "challenges", "resources", "badges"}
FACULTY_ROLES = {"faculty", "admin"}


def clean(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {("id" if key == "_id" else key): clean(item) for key, item in value.items() if key != "password"}
    if isinstance(value, list):
        return [clean(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(400, "Invalid record id")
    return ObjectId(value)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def make_token(user: dict) -> str:
    payload = {"sub": str(user["_id"]), "role": user["role"], "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def get_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(401, "Please sign in to continue")
    try:
        data = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user = db.users.find_one({"_id": object_id(data["sub"]), "active": {"$ne": False}})
    except (JWTError, KeyError, ValueError):
        user = None
    if not user:
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    return user


def require_roles(*roles: str):
    def check(user: dict = Depends(get_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(403, "You do not have permission to perform this action")
        return user
    return check


def owner_filter(collection: str, user: dict) -> dict:
    if user["role"] in FACULTY_ROLES or collection in PUBLIC_READ:
        return {}
    if collection == "users":
        return {"_id": user["_id"]}
    return {"student": str(user["_id"])}


@app.get("/api/health")
def health():
    try:
        client.admin.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(503, "MongoDB is unavailable. Start MongoDB and try again.")


@app.post("/api/auth/register")
def register(body: dict):
    name, email, password = (str(body.get(key, "")).strip() for key in ("name", "email", "password"))
    if not name or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(422, "Enter your name and a valid email address")
    if len(password) < 6:
        raise HTTPException(422, "Password must contain at least 6 characters")
    if body.get("confirmPassword") and body["confirmPassword"] != password:
        raise HTTPException(422, "Passwords do not match")
    user = {"name": name, "email": email.lower(), "password": hash_password(password), "role": "student", "college": body.get("college", ""), "department": body.get("department", ""), "branch": body.get("branch", "Other"), "semester": body.get("semester", "1"), "phone": body.get("phone", ""), "bio": "", "github": "", "linkedin": "", "skills": [], "active": True, "createdAt": datetime.now(timezone.utc)}
    if body.get("usn", "").strip():
        user["usn"] = body["usn"].strip()
    try:
        db.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(409, "Email or student ID is already registered")
    return {"message": "Registration successful. You can now sign in."}


@app.post("/api/auth/login")
def login(body: dict):
    user = db.users.find_one({"email": str(body.get("email", "")).lower().strip()})
    if not user or not user.get("active", True) or not bcrypt.checkpw(str(body.get("password", "")).encode(), user["password"].encode()):
        raise HTTPException(401, "Email or password is incorrect")
    if body.get("role") and body["role"] != user["role"]:
        raise HTTPException(403, f"This account is registered as {user['role']}")
    return {"token": make_token(user), "user": clean(user)}


@app.post("/api/auth/forgot-password")
def forgot_password(body: dict):
    # Demo-friendly response; production apps should email a single-use reset link.
    return {"message": "If that account exists, password reset instructions will be sent."}


@app.get("/api/auth/me")
def me(user: dict = Depends(get_user)):
    return clean(user)


@app.put("/api/users/me")
def update_profile(body: dict, user: dict = Depends(get_user)):
    allowed = {key: body[key] for key in ("name", "phone", "bio", "github", "linkedin", "portfolio", "college", "department", "branch", "semester", "profileImage") if key in body}
    db.users.update_one({"_id": user["_id"]}, {"$set": allowed})
    return clean(db.users.find_one({"_id": user["_id"]}))


@app.get("/api/users/me/skills")
def my_skills(user: dict = Depends(get_user)):
    return clean(user.get("skills", []))


@app.post("/api/users/me/skills")
def add_my_skill(body: dict, user: dict = Depends(get_user)):
    name = str(body.get("name", "")).strip()
    if not name:
        raise HTTPException(422, "Choose a skill name")
    skill = {"name": name, "category": body.get("category", "Technical"), "level": body.get("level", "Beginner"), "progress": int(body.get("progress", 25))}
    if any(item.get("name", "").lower() == name.lower() for item in user.get("skills", [])):
        raise HTTPException(409, "This skill is already on your profile")
    db.users.update_one({"_id": user["_id"]}, {"$push": {"skills": skill}})
    return clean(db.users.find_one({"_id": user["_id"]}).get("skills", []))


@app.delete("/api/users/me/skills/{skill_name}")
def remove_my_skill(skill_name: str, user: dict = Depends(get_user)):
    db.users.update_one({"_id": user["_id"]}, {"$pull": {"skills": {"name": skill_name}}})
    return clean(db.users.find_one({"_id": user["_id"]}).get("skills", []))


@app.get("/api/dashboard")
def dashboard(user: dict = Depends(get_user)):
    uid = str(user["_id"])
    enrollment_filter = {"student": uid}
    enrollments = list(db.enrollments.find(enrollment_filter))
    skills = user.get("skills", [])
    return {"stats": {"skills": len(skills), "enrolled": len(enrollments), "completed": sum(1 for row in enrollments if row.get("progress", 0) >= 100), "certificates": db.certificates.count_documents({"student": uid}), "streak": user.get("streak", 7), "points": user.get("points", 850)}, "enrollments": clean(enrollments), "recentCourses": clean(list(db.courses.find({"published": {"$ne": False}}).limit(4))), "notifications": clean(list(db.notifications.find({"student": uid}).sort("createdAt", -1).limit(5)))}


@app.post("/api/assessments/submit")
def submit_assessment(body: dict, user: dict = Depends(get_user)):
    questions = body.get("questions", [])
    score = sum(1 for q in questions if q.get("selected") == q.get("answer"))
    total = len(questions) or 1
    percentage = round(score / total * 100)
    level = "Expert" if percentage >= 90 else "Advanced" if percentage >= 75 else "Intermediate" if percentage >= 50 else "Beginner"
    result = {"student": str(user["_id"]), "skill": body.get("skill", "General"), "score": score, "total": total, "percentage": percentage, "level": level, "completedAt": datetime.now(timezone.utc)}
    db.assessments.insert_one(result)
    db.users.update_one({"_id": user["_id"]}, {"$addToSet": {"skills": {"name": result["skill"], "level": level, "progress": percentage}}})
    return clean(result)


@app.post("/api/enrollments")
def enroll(body: dict, user: dict = Depends(get_user)):
    course_id = body.get("course") or body.get("courseId")
    course = db.courses.find_one({"_id": object_id(str(course_id))}) if course_id and ObjectId.is_valid(str(course_id)) else None
    if not course:
        raise HTTPException(404, "Course not found")
    uid = str(user["_id"])
    existing = db.enrollments.find_one({"student": uid, "course": str(course["_id"])})
    if existing:
        return clean(existing)
    record = {"student": uid, "course": str(course["_id"]), "progress": 0, "completedModules": [], "enrolledAt": datetime.now(timezone.utc)}
    result = db.enrollments.insert_one(record)
    return clean(db.enrollments.find_one({"_id": result.inserted_id}))


@app.put("/api/enrollments/{record_id}/progress")
def update_progress(record_id: str, body: dict, user: dict = Depends(get_user)):
    query = {"_id": object_id(record_id)}
    if user["role"] == "student":
        query["student"] = str(user["_id"])
    row = db.enrollments.find_one(query)
    if not row:
        raise HTTPException(404, "Enrollment not found")
    completed = body.get("completedModules", row.get("completedModules", []))
    course = db.courses.find_one({"_id": object_id(row["course"])})
    module_count = max(len(course.get("modules", [])) if course else 0, 1)
    progress = min(100, round(len(completed) / module_count * 100))
    db.enrollments.update_one({"_id": row["_id"]}, {"$set": {"completedModules": completed, "progress": progress, "completedAt": datetime.now(timezone.utc) if progress == 100 else None}})
    return clean(db.enrollments.find_one({"_id": row["_id"]}))


@app.post("/api/certificates/upload")
async def upload_certificate(title: str = Form(...), organization: str = Form(...), skill: str = Form(""), issueDate: str = Form(""), description: str = Form(""), file: UploadFile = File(...), user: dict = Depends(get_user)):
    suffix = Path(file.filename or "certificate").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".pdf"}:
        raise HTTPException(415, "Upload a JPG, PNG, or PDF file")
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(413, "Certificate file must be smaller than 8 MB")
    (UPLOAD_DIR / stored_name).write_bytes(content)
    record = {"student": str(user["_id"]), "title": title, "organization": organization, "skill": skill, "issueDate": issueDate, "description": description, "file": f"/uploads/{stored_name}", "status": "Pending Verification", "createdAt": datetime.now(timezone.utc)}
    db.certificates.insert_one(record)
    return clean(record)


@app.put("/api/certificates/{record_id}/verify")
def verify_certificate(record_id: str, body: dict, user: dict = Depends(require_roles("faculty", "admin"))):
    status = body.get("status", "Verified")
    if status not in {"Verified", "Rejected", "Pending Verification"}:
        raise HTTPException(422, "Invalid certificate status")
    result = db.certificates.update_one({"_id": object_id(record_id)}, {"$set": {"status": status, "verifiedBy": str(user["_id"]), "verifiedAt": datetime.now(timezone.utc)}})
    if not result.matched_count:
        raise HTTPException(404, "Certificate not found")
    return clean(db.certificates.find_one({"_id": object_id(record_id)}))


@app.post("/api/challenges/{record_id}/submit")
def submit_challenge(record_id: str, body: dict, user: dict = Depends(get_user)):
    challenge = db.challenges.find_one({"_id": object_id(record_id)})
    if not challenge:
        raise HTTPException(404, "Challenge not found")
    submission = {"challenge": record_id, "student": str(user["_id"]), "submissionLink": body.get("submissionLink", ""), "description": body.get("description", ""), "status": "Submitted", "submittedAt": datetime.now(timezone.utc)}
    db.submissions.update_one({"challenge": record_id, "student": str(user["_id"])}, {"$set": submission}, upsert=True)
    return clean(submission)


@app.get("/api/portfolio/{slug}")
def public_portfolio(slug: str):
    user = db.users.find_one({"portfolioSlug": slug, "active": {"$ne": False}})
    if not user:
        user = db.users.find_one({"name": {"$regex": f"^{re.escape(slug.replace('-', ' '))}$", "$options": "i"}, "role": "student"})
    if not user:
        raise HTTPException(404, "Portfolio not found")
    uid = str(user["_id"])
    return {"profile": {key: clean(user.get(key)) for key in ("name", "bio", "profileImage", "github", "linkedin", "portfolio", "skills")}, "projects": clean(list(db.projects.find({"student": uid}))), "certificates": clean(list(db.certificates.find({"student": uid, "status": "Verified"}))), "courses": clean(list(db.enrollments.find({"student": uid, "progress": 100})))}


@app.get("/api/users")
def list_users(search: str = "", branch: str = "", semester: str = "", user: dict = Depends(require_roles("faculty", "admin"))):
    query: dict = {"role": "student"}
    if search:
        query["$or"] = [{"name": {"$regex": re.escape(search), "$options": "i"}}, {"email": {"$regex": re.escape(search), "$options": "i"}}, {"usn": {"$regex": re.escape(search), "$options": "i"}}]
    if branch:
        query["branch"] = branch
    if semester:
        query["semester"] = semester
    return clean(list(db.users.find(query).limit(200)))


@app.get("/api/{collection}")
def list_records(collection: str, search: str = "", user: dict = Depends(get_user)):
    if collection not in COLLECTIONS and collection != "users":
        raise HTTPException(404, "Resource not found")
    query = owner_filter(collection, user)
    if search and collection in {"courses", "skills", "challenges", "resources"}:
        query["$or"] = [{key: {"$regex": re.escape(search), "$options": "i"}} for key in ("title", "name", "description", "category")]
    if collection == "submissions" and user["role"] == "student":
        query = {"student": str(user["_id"])}
    return clean(list(db[collection].find(query).sort("createdAt", -1).limit(500)))


@app.get("/api/{collection}/{record_id}")
def get_record(collection: str, record_id: str, user: dict = Depends(get_user)):
    if collection not in COLLECTIONS:
        raise HTTPException(404, "Resource not found")
    query = {"_id": object_id(record_id), **owner_filter(collection, user)}
    record = db[collection].find_one(query)
    if not record:
        raise HTTPException(404, "Record not found")
    return clean(record)


@app.post("/api/{collection}")
def create_record(collection: str, body: dict, user: dict = Depends(get_user)):
    if collection not in COLLECTIONS:
        raise HTTPException(404, "Resource not found")
    if user["role"] == "student" and collection not in {"enrollments", "assessments", "submissions", "certificates", "projects", "bookmarks", "notifications"}:
        raise HTTPException(403, "Only faculty or admins can manage this resource")
    record = dict(body)
    record.pop("id", None)
    record.pop("_id", None)
    if collection in {"enrollments", "assessments", "submissions", "certificates", "projects", "bookmarks", "notifications"} and user["role"] == "student":
        record["student"] = str(user["_id"])
    record.setdefault("createdAt", datetime.now(timezone.utc))
    result = db[collection].insert_one(record)
    return clean(db[collection].find_one({"_id": result.inserted_id}))


@app.put("/api/{collection}/{record_id}")
def update_record(collection: str, record_id: str, body: dict, user: dict = Depends(get_user)):
    if collection not in COLLECTIONS and collection != "users":
        raise HTTPException(404, "Resource not found")
    if collection == "users" and user["role"] == "student":
        if record_id != str(user["_id"]):
            raise HTTPException(403, "You can only update your own profile")
        return update_profile(body, user)
    if user["role"] == "student" and collection not in {"projects", "bookmarks"}:
        raise HTTPException(403, "Only faculty or admins can manage this resource")
    query = {"_id": object_id(record_id)}
    if user["role"] == "student":
        query["student"] = str(user["_id"])
    safe = {key: value for key, value in body.items() if key not in {"_id", "id", "student", "password", "role"}}
    result = db[collection].update_one(query, {"$set": safe})
    if not result.matched_count:
        raise HTTPException(404, "Record not found")
    return clean(db[collection].find_one({"_id": object_id(record_id)}))


@app.delete("/api/{collection}/{record_id}")
def delete_record(collection: str, record_id: str, user: dict = Depends(get_user)):
    if collection not in COLLECTIONS:
        raise HTTPException(404, "Resource not found")
    if user["role"] == "student" and collection not in {"projects", "bookmarks"}:
        raise HTTPException(403, "Only faculty or admins can delete this resource")
    query = {"_id": object_id(record_id)}
    if user["role"] == "student":
        query["student"] = str(user["_id"])
    if not db[collection].delete_one(query).deleted_count:
        raise HTTPException(404, "Record not found")
    return {"message": "Deleted successfully"}


@app.on_event("startup")
def setup_indexes():
    db.users.create_index("email", unique=True)
    db.users.create_index("usn", unique=True, sparse=True)
    db.enrollments.create_index([("student", 1), ("course", 1)], unique=True)
