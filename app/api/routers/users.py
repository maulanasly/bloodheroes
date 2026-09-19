from __future__ import annotations

from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_current_user_id, require_app_token
from app.core.config import settings
from app.core.geo import search_cells
from app.db.postgres import get_conn
from app.schemas.users import UserCreate, UserList, UserOut, UserUpdate
from app.services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_app_token)],
)
async def register_user(payload: UserCreate, conn: asyncpg.Connection = Depends(get_conn)) -> dict:
    return await users_service.create_user(conn, payload)


@router.get("", response_model=UserList, dependencies=[Depends(require_app_token)])
async def list_users(
    latitude: Annotated[float | None, Query(ge=-90, le=90)] = None,
    longitude: Annotated[float | None, Query(ge=-180, le=180)] = None,
    distance: Annotated[int | None, Query(gt=0)] = None,
    blood_type: str | None = None,
    gender: Annotated[str | None, Query(pattern="^[MFU]$")] = None,
    status_filter: Annotated[int | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1)] = settings.default_page_size,
    _user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    per_page = min(per_page, settings.max_page_size)
    cells: list[int] | None = None
    if latitude is not None and longitude is not None:
        distance_m = min(distance or settings.default_search_radius_m, settings.max_search_radius_m)
        cells = search_cells(
            latitude, longitude, distance_m, settings.h3_resolution, settings.max_grid_disk_k
        )
    items, count = await users_service.list_users(
        conn,
        cells=cells,
        blood_type=blood_type,
        gender=gender,
        status=status_filter,
        latitude=latitude,
        longitude=longitude,
        distance_m=distance if cells else None,
        page=page,
        per_page=per_page,
    )
    return {"users": items, "count": count}


@router.get("/me", response_model=UserOut, dependencies=[Depends(require_app_token)])
async def get_me(
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await users_service.get_user(conn, user_id)


@router.put("/me", response_model=UserOut, dependencies=[Depends(require_app_token)])
async def update_me(
    payload: UserUpdate,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await users_service.update_user(conn, user_id, payload)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_app_token)],
)
async def delete_me(
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> Response:
    await users_service.delete_user(conn, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(require_app_token)])
async def get_user(
    user_id: int,
    _current: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await users_service.get_user(conn, user_id)
