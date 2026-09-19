from __future__ import annotations

import asyncpg
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import InvalidTokenType, MissingAppToken, UnAuthorized
from app.core.security import decode_token
from app.db.postgres import get_conn
from app.repositories import auth as auth_repo

bearer_scheme = HTTPBearer(auto_error=False)


async def require_app_token(
    x_app_token: str | None = Header(default=None, alias="X-APP-TOKEN"),
    conn: asyncpg.Connection = Depends(get_conn),
) -> str:
    if not x_app_token:
        raise MissingAppToken()
    if not await auth_repo.app_token_is_valid(conn, x_app_token):
        raise InvalidTokenType()
    return x_app_token


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> int:
    if credentials is None:
        raise UnAuthorized()
    payload = decode_token(credentials.credentials, "access")
    return int(payload["sub"])
