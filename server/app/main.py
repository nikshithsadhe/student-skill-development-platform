"""FastAPI Application Entry Point for the Student Skill Development Platform."""
from contextlib import asynccontextmanager
import logging
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.database import DatabaseManager, get_db
from app.core.errors import (
    AppException,
    app_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.rate_limit import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ssp")
settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add standard HTTP security headers to all responses."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: database initialization and teardown."""
    logger.info("Initializing Student Skill Development Platform services...")
    # Ensure upload directory exists
    upload_path = Path(__file__).resolve().parent.parent / settings.UPLOAD_DIR
    upload_path.mkdir(parents=True, exist_ok=True)

    # Connect DB and apply indexes
    await DatabaseManager.connect()
    yield
    # Shutdown DB connections
    await DatabaseManager.disconnect()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set SlowAPI state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=(
        r"https?://(?:localhost|127\.0\.0\.1)(?::\d+)?"
        if settings.is_development
        else None
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import (
    achievements,
    activities,
    admin,
    assessments,
    auth,
    faculty,
    interviews,
    modules,
    notifications,
    progress,
    recommendations,
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(modules.router, prefix=settings.API_V1_PREFIX)
app.include_router(assessments.router, prefix=settings.API_V1_PREFIX)
app.include_router(activities.router, prefix=settings.API_V1_PREFIX)
app.include_router(interviews.router, prefix=settings.API_V1_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_V1_PREFIX)
app.include_router(achievements.router, prefix=settings.API_V1_PREFIX)
app.include_router(progress.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(faculty.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
async def health_check():
    """Verify system health and database connectivity."""
    db_status = "disconnected"
    is_mock = DatabaseManager.is_mock
    try:
        if DatabaseManager.client:
            if not is_mock:
                await DatabaseManager.client.admin.command("ping")
            db_status = "connected"
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "success": True,
        "data": {
            "status": "healthy" if db_status == "connected" else "degraded",
            "app_name": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "database": {
                "status": db_status,
                "is_mock": is_mock,
                "db_name": settings.MONGODB_DB_NAME,
            },
        },
    }
