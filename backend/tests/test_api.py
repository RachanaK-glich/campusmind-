import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import init_db


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_login_and_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test Login
        login_res = await ac.post("/api/auth/login", json={
            "email": "student@campusmind.edu",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        auth_data = login_res.json()
        token = auth_data["access_token"]
        assert token is not None

        # Test RAG query grounded on fee structure
        chat_res = await ac.post(
            "/api/chat/query",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "query": "What is the annual fee for B.Tech Computer Science and what scholarships exist?",
                "stream": False
            }
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert "answer" in chat_data
        assert len(chat_data["sources"]) > 0
        assert chat_data["is_unknown"] is False


@pytest.mark.asyncio
async def test_unknown_question_refusal():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Query on completely ungrounded topic (e.g. quantum alien teleporters)
        chat_res = await ac.post(
            "/api/chat/query",
            json={
                "query": "What is the secret recipe for Martian blueberry pancakes?",
                "stream": False
            }
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert chat_data["is_unknown"] is True
        assert "don't have this information in the official college records" in chat_data["answer"]


@pytest.mark.asyncio
async def test_admin_analytics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login as Admin
        login_res = await ac.post("/api/auth/login", json={
            "email": "admin@campusmind.edu",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Get Analytics
        analytics_res = await ac.get(
            "/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert analytics_res.status_code == 200
        analytics = analytics_res.json()
        assert analytics["total_documents"] >= 5
        assert analytics["total_chunks"] >= 20
