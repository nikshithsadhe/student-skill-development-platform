"""Unit and Integration Tests for SSP FastAPI Backend."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    """Create async test client with active lifespan context."""
    transport = ASGITransport(app=app)
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=transport, base_url="http://testserver/api") as ac:
            yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verify system health endpoint and DB connection."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "status" in data["data"]
    assert data["data"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient):
    """Test demo student login returns valid JWT token and user payload."""
    response = await client.post(
        "/auth/login",
        json={"email": "student@college.edu", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "student"


@pytest.mark.asyncio
async def test_auth_login_invalid_credentials(client: AsyncClient):
    """Test invalid password returns 401 unauthorized."""
    response = await client.post(
        "/auth/login",
        json={"email": "student@college.edu", "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_auth_password_length_validation(client: AsyncClient):
    """Test password shorter than 8 chars on registration is rejected with 422."""
    response = await client.post(
        "/auth/register",
        json={
            "full_name": "Test Student",
            "email": "testshort@college.edu",
            "student_id": "TEST100",
            "branch": "Computer Engineering",
            "semester": 1,
            "password": "123",
            "confirm_password": "123",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_faculty_login_is_rejected(client: AsyncClient):
    """Faculty accounts should not be recognized or allowed to log in."""
    response = await client.post(
        "/auth/login",
        json={"email": "faculty@ssp.edu", "password": "FacultyPass123!"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_list_soft_skill_categories(client: AsyncClient):
    """Verify the 12 soft-skills categories are seeded and returned."""
    response = await client.get("/modules/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 12


@pytest.mark.asyncio
async def test_list_modules_unauthenticated(client: AsyncClient):
    """Verify modules can be listed publicly with clean metadata."""
    response = await client.get("/modules")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) > 0


@pytest.mark.asyncio
async def test_assessments_security_stripping(client: AsyncClient):
    """Ensure answers & explanations are NEVER leaked to unauthenticated/student requests."""
    # List assessments
    list_res = await client.get("/assessments")
    assert list_res.status_code == 200
    assessments = list_res.json()["data"]
    assert len(assessments) > 0

    asm_id = assessments[0]["id"]

    # Get single assessment detail
    detail_res = await client.get(f"/assessments/{asm_id}")
    assert detail_res.status_code == 200
    asm = detail_res.json()["data"]
    assert "questions" in asm

    # Check questions do not leak correct_index or explanation
    for q in asm["questions"]:
        assert "correct_index" not in q
        assert "explanation" not in q


@pytest.mark.asyncio
async def test_interview_questions_retrieval(client: AsyncClient):
    """Verify mock interview practice question bank loads."""
    response = await client.get("/interviews/questions")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) > 0
