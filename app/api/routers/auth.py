from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user_id, require_app_token
from app.db.postgres import get_conn
from app.schemas.auth import LoginRequest, RefreshRequest, TokenPair
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair, dependencies=[Depends(require_app_token)])
async def login(payload: LoginRequest, conn: asyncpg.Connection = Depends(get_conn)) -> TokenPair:
    return await auth_service.login(conn, payload.email, payload.password)


@router.post("/refresh", response_model=TokenPair, dependencies=[Depends(require_app_token)])
async def refresh(
    payload: RefreshRequest, conn: asyncpg.Connection = Depends(get_conn)
) -> TokenPair:
    return await auth_service.refresh_tokens(conn, payload.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_app_token)],
)
async def logout(
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> Response:
    await auth_service.logout(conn, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
