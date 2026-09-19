from __future__ import annotations

from typing import Any

import h3

from app.core.config import settings
from app.core.geo import cell_for_hex, disk_for, k_for_radius


def _cell_dict(cell_hex: str, resolution: int) -> dict[str, Any]:
    center_lat, center_lng = h3.cell_to_latlng(cell_hex)
    boundary = [{"latitude": lat, "longitude": lng} for lat, lng in h3.cell_to_boundary(cell_hex)]
    return {
        "cell_id": cell_hex,
        "resolution": resolution,
        "center": {"latitude": center_lat, "longitude": center_lng},
        "boundary": boundary,
    }


async def get_cell(latitude: float, longitude: float, resolution: int | None) -> dict[str, Any]:
    res = settings.h3_resolution if resolution is None else resolution
    return _cell_dict(cell_for_hex(latitude, longitude, res), res)


async def get_disk(
    latitude: float,
    longitude: float,
    distance_m: int | None,
    resolution: int | None,
    max_cells: int,
) -> dict[str, Any]:
    res = settings.h3_resolution if resolution is None else resolution
    distance = min(distance_m or settings.default_search_radius_m, settings.max_search_radius_m)
    k = k_for_radius(distance, res, settings.max_grid_disk_k)
    origin_hex = cell_for_hex(latitude, longitude, res)
    cell_ints = disk_for(origin_hex, k)
    total = len(cell_ints)
    truncated = total > max_cells
    selected = cell_ints[:max_cells] if truncated else cell_ints
    cells = [_cell_dict(format(c, "x"), res) for c in selected]
    return {
        "origin": _cell_dict(origin_hex, res),
        "resolution": res,
        "distance_m": distance,
        "k": k,
        "cell_count": len(cells),
        "total_cells": total,
        "truncated": truncated,
        "cells": cells,
    }
