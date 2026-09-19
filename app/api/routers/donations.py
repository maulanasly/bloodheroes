from __future__ import annotations

from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user_id, require_app_token
from app.core.config import settings
from app.core.geo import search_cells
from app.db.postgres import get_conn
from app.schemas.donations import (
    DonationRequestCreate,
    DonationRequestList,
    DonationRequestOut,
    OfferOut,
    OfferStatusUpdate,
)
from app.services import donations as donations_service

router = APIRouter(prefix="/donations", tags=["donations"])

Auth = Depends(require_app_token)


def _cells_for(
    latitude: float | None, longitude: float | None, distance: int | None
) -> list[int] | None:
    if latitude is None or longitude is None:
        return None
    distance_m = min(distance or settings.default_search_radius_m, settings.max_search_radius_m)
    return search_cells(
        latitude, longitude, distance_m, settings.h3_resolution, settings.max_grid_disk_k
    )


@router.post(
    "/requests",
    response_model=DonationRequestOut,
    status_code=201,
    dependencies=[Auth],
)
async def create_request(
    payload: DonationRequestCreate,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await donations_service.create_request(conn, user_id, payload)


@router.get("/requests", response_model=DonationRequestList, dependencies=[Auth])
async def list_requests(
    user_id: int | None = None,
    giver: bool = False,
    blood_type: str | None = None,
    status_filter: Annotated[int | None, Query(alias="status")] = None,
    latitude: Annotated[float | None, Query(ge=-90, le=90)] = None,
    longitude: Annotated[float | None, Query(ge=-180, le=180)] = None,
    distance: Annotated[int | None, Query(gt=0)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1)] = settings.default_page_size,
    _current: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    per_page = min(per_page, settings.max_page_size)
    cells = _cells_for(latitude, longitude, distance)
    items, count = await donations_service.list_requests(
        conn,
        user_id=user_id,
        giver=giver,
        blood_type=blood_type,
        status=status_filter,
        cells=cells,
        page=page,
        per_page=per_page,
    )
    return {"donations": items, "count": count}


@router.get("/history", response_model=DonationRequestList, dependencies=[Auth])
async def history(
    blood_type: str | None = None,
    status_filter: Annotated[int | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1)] = settings.default_page_size,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    per_page = min(per_page, settings.max_page_size)
    items, count = await donations_service.history(
        conn,
        user_id=user_id,
        blood_type=blood_type,
        status=status_filter,
        page=page,
        per_page=per_page,
    )
    return {"donations": items, "count": count}


@router.get("/requests/{request_id}", response_model=DonationRequestOut, dependencies=[Auth])
async def get_request(
    request_id: int,
    _current: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await donations_service.get_request(conn, request_id)


@router.post(
    "/requests/{request_id}/offers",
    response_model=OfferOut,
    status_code=201,
    dependencies=[Auth],
)
async def create_offer(
    request_id: int,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await donations_service.create_offer(conn, request_id, user_id)


@router.get(
    "/requests/{request_id}/offers",
    response_model=list[dict],
    dependencies=[Auth],
)
async def list_offers(
    request_id: int,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> list[dict]:
    return await donations_service.list_offers(conn, request_id, user_id)


@router.patch("/offers/{offer_id}", response_model=OfferOut, dependencies=[Auth])
async def update_offer(
    offer_id: int,
    payload: OfferStatusUpdate,
    user_id: int = Depends(get_current_user_id),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    return await donations_service.update_offer(conn, offer_id, user_id, payload.status)
