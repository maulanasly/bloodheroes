from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_id, require_app_token
from app.db.postgres import get_conn
from app.schemas.stats import LevelOut, StatsOverview
from app.services import stats as stats_service

router = APIRouter(prefix="/stats", tags=["stats"])

Auth = Depends(require_app_token)


@router.get("/overview", response_model=StatsOverview, dependencies=[Auth])
async def overview(
    _current: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await stats_service.overview(conn)


@router.get("/levels", response_model=list[LevelOut], dependencies=[Auth])
async def levels(
    _current: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> list:
    return await stats_service.list_levels(conn)
