"""Pydantic v2 schemas for Skill Categories, Learning Modules, and Lessons."""
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

DifficultyType = Literal["Beginner", "Intermediate", "Advanced"]
ModuleStatus = Literal["draft", "published", "archived"]


class KnowledgeCheck(BaseModel):
    """Knowledge check question inside a lesson."""
    question: str
    options: list[str] = Field(..., min_length=2)
    correct_index: int = Field(..., ge=0)
    explanation: str = ""


class LessonSchema(BaseModel):
    """Individual lesson within a module."""
    id: str
    title: str
    content: str
    estimated_minutes: int = 15
    examples: list[str] = []
    practical_exercises: list[str] = []
    knowledge_checks: list[KnowledgeCheck] = []


class ModuleCreateRequest(BaseModel):
    """Payload for creating a soft-skill module (Faculty/Admin)."""
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(..., min_length=3, max_length=150)
    category_id: str
    description: str = Field(..., min_length=10)
    difficulty: DifficultyType = "Beginner"
    estimated_minutes: int = Field(30, ge=5, le=600)
    learning_objectives: list[str] = Field(..., min_length=1)
    lessons: list[LessonSchema] = Field(..., min_length=1)
    status: ModuleStatus = "published"
    points_reward: int = Field(50, ge=10, le=500)


class ModuleUpdateRequest(BaseModel):
    """Payload for updating a soft-skill module."""
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = None
    category_id: str | None = None
    description: str | None = None
    difficulty: DifficultyType | None = None
    estimated_minutes: int | None = None
    learning_objectives: list[str] | None = None
    lessons: list[LessonSchema] | None = None
    status: ModuleStatus | None = None
    points_reward: int | None = None


class CategoryResponse(BaseModel):
    """Skill category representation."""
    id: str
    name: str
    slug: str
    description: str
    icon: str | None = None
    module_count: int = 0
