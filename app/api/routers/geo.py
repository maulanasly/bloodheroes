from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user_id, require_app_token
from app.schemas.geo import GeoCell, GeoDisk
from app.services import geo as geo_service

router = APIRouter(prefix="/geo", tags=["geo"])

Auth = Depends(require_app_token)


@router.get("/cell", response_model=GeoCell, dependencies=[Auth])
async def get_cell(
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    resolution: Annotated[int | None, Query(ge=0, le=15)] = None,
    _current: int = Depends(get_current_user_id),
) -> dict:
    return await geo_service.get_cell(latitude, longitude, resolution)


@router.get("/disk", response_model=GeoDisk, dependencies=[Auth])
async def get_disk(
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    distance: Annotated[int | None, Query(gt=0)] = None,
    resolution: Annotated[int | None, Query(ge=0, le=15)] = None,
    max_cells: Annotated[int, Query(ge=1, le=5000)] = 1000,
    _current: int = Depends(get_current_user_id),
) -> dict:
    return await geo_service.get_disk(latitude, longitude, distance, resolution, max_cells)
