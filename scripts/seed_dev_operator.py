"""Seed a development operator account for local demos and manual testing.

Usage:
    make seed-dev
    # or:
    BH_DATABASE_URL=postgresql://bloodheroes:bloodheroes@localhost:5432/bloodheroes \
    SEED_OPERATOR_EMAIL=ops@example.com SEED_OPERATOR_PASSWORD=password123 \
    python scripts/seed_dev_operator.py

Notes / limitations:
- Opt-in only: this never runs via migrations or compose startup.
- Refuses to run when BH_ENVIRONMENT=production unless SEED_ALLOW_PRODUCTION=1.
- Idempotent: safe to re-run; existing email is left untouched (no password reset).
- The password is hashed with the app's Argon2id hasher and is never printed.
- Dev-only defaults below are public knowledge; rotate credentials for any
  shared or production-adjacent environment.
"""

from __future__ import annotations

import asyncio
import os
import sys

import asyncpg

from app.core.config import settings
from app.core.security import hash_password
from app.repositories import users as users_repo

DEFAULT_EMAIL = "ops@example.com"
DEFAULT_PASSWORD = "password123"


async def seed_operator(email: str, password: str) -> str:
    """Insert the operator if missing. Returns 'created' or 'exists'."""
    conn = await asyncpg.connect(settings.database_url)
    try:
        if await users_repo.email_exists(conn, email):
            return "exists"
        await users_repo.create_user(
            conn,
            email=email,
            password_hash=hash_password(password),
            firstname="Ops",
            lastname="Operator",
            contact=None,
            fcm_token=None,
            photo_url=None,
            gender="U",
            blood_type="O+",
            latitude=None,
            longitude=None,
            h3_cell=None,
        )
        return "created"
    finally:
        await conn.close()


def main() -> int:
    if settings.environment == "production" and os.getenv("SEED_ALLOW_PRODUCTION") != "1":
        print(
            "Refusing to seed a dev operator in production. "
            "Set SEED_ALLOW_PRODUCTION=1 to override.",
            file=sys.stderr,
        )
        return 2
    email = os.getenv("SEED_OPERATOR_EMAIL", DEFAULT_EMAIL)
    password = os.getenv("SEED_OPERATOR_PASSWORD", DEFAULT_PASSWORD)
    if not password:
        print("SEED_OPERATOR_PASSWORD must not be empty.", file=sys.stderr)
        return 2
    result = asyncio.run(seed_operator(email, password))
    print(f"operator {email}: {result}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
