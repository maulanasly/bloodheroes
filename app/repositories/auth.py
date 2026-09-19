from __future__ import annotations

from datetime import datetime

import asyncpg


async def app_token_is_valid(conn: asyncpg.Connection, token: str) -> bool:
    row = await conn.fetchval("SELECT 1 FROM app_tokens WHERE token = $1 AND active IS TRUE", token)
    return row is not None


async def create_refresh_token(
    conn: asyncpg.Connection, *, jti: str, user_id: int, expires_at: datetime
) -> None:
    await conn.execute(
        """
        INSERT INTO refresh_tokens (jti, user_id, expires_at)
        VALUES ($1, $2, $3)
        """,
        jti,
        user_id,
        expires_at,
    )


async def get_active_refresh_token(conn: asyncpg.Connection, jti: str) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT jti, user_id, expires_at, revoked_at
        FROM refresh_tokens
        WHERE jti = $1 AND revoked_at IS NULL AND expires_at > now()
        """,
        jti,
    )


async def revoke_refresh_token(conn: asyncpg.Connection, jti: str) -> None:
    await conn.execute(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE jti = $1 AND revoked_at IS NULL",
        jti,
    )


async def revoke_all_for_user(conn: asyncpg.Connection, user_id: int) -> None:
    await conn.execute(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
        user_id,
    )
