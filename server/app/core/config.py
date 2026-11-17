"""Application configuration using Pydantic Settings v2."""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime application settings loaded from environment or .env file."""
    APP_ENV: str = "development"
    APP_NAME: str = "Student Skill Development Platform"
    API_V1_PREFIX: str = "/api"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "ssp_db"

    # Security
    JWT_SECRET: str = "dev-secret-key-change-in-production-at-least-32-characters"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # CORS & Frontend
    CORS_ORIGINS: str = "http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:5173"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 5

    # Optional Email (SMTP)
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = "no-reply@ssp.edu"

    # Rate limiting
    AUTH_RATE_LIMIT: str = "10/minute"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list of strings."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        """Helper to check if running in development mode."""
        return self.APP_ENV.lower() == "development"


@lru_cache()
def get_settings() -> Settings:
    """Return cached singleton instance of Settings."""
    return Settings()
