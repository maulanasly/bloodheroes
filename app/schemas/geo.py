from __future__ import annotations

from app.schemas.common import APIModel


class LatLng(APIModel):
    latitude: float
    longitude: float


class GeoCell(APIModel):
    cell_id: str
    resolution: int
    center: LatLng
    boundary: list[LatLng]


class GeoDisk(APIModel):
    origin: GeoCell
    resolution: int
    distance_m: int
    k: int
    cell_count: int
    total_cells: int
    truncated: bool
    cells: list[GeoCell]
