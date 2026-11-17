"""Pydantic schemas for Skill Assessments."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class QuestionAnswerItem(BaseModel):
    """Student answer for a single question."""
    question_index: int = Field(..., ge=0)
    selected_option: int = Field(..., ge=0)


class AssessmentSubmissionRequest(BaseModel):
    """Payload for submitting an assessment attempt."""
    model_config = ConfigDict(str_strip_whitespace=True)

    answers: list[QuestionAnswerItem] = Field(..., min_length=1)
    idempotency_key: str | None = None


class AssessmentCreateRequest(BaseModel):
    """Payload for authoring an assessment (Faculty/Admin)."""
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10)
    category_slug: str = "all"
    estimated_minutes: int = Field(20, ge=5, le=120)
    passing_score: int = Field(60, ge=0, le=100)
    questions: list[dict] = Field(..., min_length=1)
