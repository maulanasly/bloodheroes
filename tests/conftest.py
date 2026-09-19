import os

os.environ.setdefault(
    "BH_DATABASE_URL", "postgresql://bloodheroes:bloodheroes@localhost:55432/bloodheroes"
)
os.environ.setdefault("BH_ENVIRONMENT", "testing")
os.environ.setdefault("BH_JWT_SECRET", "test-secret")

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.db import postgres  # noqa: E402
from app.main import app  # noqa: E402

APP_TOKEN = "test-app-token"

TRUNCATE = """
TRUNCATE donation_offers, donation_requests, refresh_tokens, app_tokens, users
RESTART IDENTITY CASCADE
"""


@pytest_asyncio.fixture(autouse=True)
async def _database():
    await postgres.init_pool()
    pool = postgres.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(TRUNCATE)
        await conn.execute("INSERT INTO app_tokens (token, name) VALUES ($1, 'test')", APP_TOKEN)
    yield
    await postgres.close_pool()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
