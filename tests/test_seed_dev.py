from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from httpx import AsyncClient

from app.db import postgres
from tests.utils import login

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT = REPO_ROOT / "scripts" / "seed_dev_operator.py"

EMAIL = "ops@example.com"
PASSWORD = "password123"


def run_seed(extra_env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    env = dict(os.environ)
    env.pop("SEED_ALLOW_PRODUCTION", None)
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [sys.executable, str(SCRIPT)],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        env=env,
        timeout=120,
    )


async def user_count() -> int:
    pool = postgres.get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT count(*) FROM users WHERE lower(email) = lower($1)", EMAIL
        )


async def test_seed_creates_operator_and_logs_in(client: AsyncClient):
    result = run_seed()
    assert result.returncode == 0, result.stderr
    assert f"operator {EMAIL}: created" in result.stdout
    assert await user_count() == 1
    tokens = await login(client, EMAIL)
    assert tokens["token_type"] == "bearer"


async def test_seed_is_idempotent(client: AsyncClient):
    first = run_seed()
    assert first.returncode == 0, first.stderr
    second = run_seed()
    assert second.returncode == 0, second.stderr
    assert f"operator {EMAIL}: exists" in second.stdout
    assert await user_count() == 1
    await login(client, EMAIL)


async def test_seed_refuses_production_without_override(client: AsyncClient):
    result = run_seed({"BH_ENVIRONMENT": "production"})
    assert result.returncode == 2
    assert await user_count() == 0


async def test_seed_override_allows_production(client: AsyncClient):
    result = run_seed({"BH_ENVIRONMENT": "production", "SEED_ALLOW_PRODUCTION": "1"})
    assert result.returncode == 0, result.stderr
    assert await user_count() == 1
    await login(client, EMAIL)
