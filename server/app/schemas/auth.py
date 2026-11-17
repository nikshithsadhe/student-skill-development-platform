"""Pydantic v2 schemas for Authentication."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

BranchType = Literal[
    "Computer Engineering",
    "Information Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Other",
]


class RegisterRequest(BaseModel):
    """Student self-registration payload."""
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    student_id: str = Field(..., min_length=3, max_length=30, description="USN or College Student ID")
    branch: BranchType
    semester: int = Field(..., ge=1, le=8)
    password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("student_id")
    @classmethod
    def normalize_student_id(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v


class AdminRegisterRequest(BaseModel):
    """Administrator self-registration payload."""
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v


class LoginRequest(BaseModel):
    """User credentials for authentication (accepts username or email)."""
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str | None = None
    username: str | None = None
    password: str = Field(..., min_length=1, max_length=72)

    @field_validator("email", "username")
    @classmethod
    def normalize_identifier(cls, v: str | None) -> str | None:
        return v.lower().strip() if v else None


class ForgotPasswordRequest(BaseModel):
    """Password reset request payload."""
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class ResetPasswordRequest(BaseModel):
    """Password reset submission payload."""
    model_config = ConfigDict(str_strip_whitespace=True)

    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v


class UserResponse(BaseModel):
    """Clean representation of user returned to client."""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    student_id: str | None = None
    profile: dict | None = None
    created_at: str | None = None


class AuthSuccessResponse(BaseModel):
    """Standard payload returned after successful login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
