from __future__ import annotations

from datetime import UTC, datetime

import asyncpg

from app.core.config import settings
from app.core.exceptions import InvalidCredentials, UnAuthorized
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_and_update_password,
)
from app.repositories import auth as auth_repo
from app.repositories import users as users_repo
from app.schemas.auth import TokenPair


async def login(conn: asyncpg.Connection, email: str, password: str) -> TokenPair:
    user = await users_repo.get_by_email(conn, email)
    if user is None:
        raise InvalidCredentials()

    valid, new_hash = verify_and_update_password(password, user["password_hash"])
    if not valid:
        raise InvalidCredentials()
    if new_hash is not None:
        await conn.execute(
            "UPDATE users SET password_hash = $1, updated_at = now() WHERE user_id = $2",
            new_hash,
            user["user_id"],
        )

    user_id = int(user["user_id"])
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    payload = decode_token(refresh, "refresh")
    expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)

    await auth_repo.create_refresh_token(
        conn, jti=payload["jti"], user_id=user_id, expires_at=expires_at
    )

    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_ttl_minutes * 60,
    )


async def refresh_tokens(conn: asyncpg.Connection, refresh_token: str) -> TokenPair:
    payload = decode_token(refresh_token, "refresh")
    record = await auth_repo.get_active_refresh_token(conn, payload["jti"])
    if record is None:
        raise UnAuthorized()

    user_id = int(payload["sub"])
    await auth_repo.revoke_refresh_token(conn, payload["jti"])

    access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    new_payload = decode_token(new_refresh, "refresh")
    expires_at = datetime.fromtimestamp(new_payload["exp"], tz=UTC)
    await auth_repo.create_refresh_token(
        conn, jti=new_payload["jti"], user_id=user_id, expires_at=expires_at
    )

    return TokenPair(
        access_token=access,
        refresh_token=new_refresh,
        expires_in=settings.access_token_ttl_minutes * 60,
    )


async def logout(conn: asyncpg.Connection, user_id: int) -> None:
    await auth_repo.revoke_all_for_user(conn, user_id)
