import math

import h3

EARTH_RADIUS_M = 6_371_008.8


def cell_for(lat: float, lng: float, resolution: int) -> int:
    """H3 cell index containing the coordinate at the given resolution."""
    return int(h3.latlng_to_cell(lat, lng, resolution), 16)


def cell_for_hex(lat: float, lng: float, resolution: int) -> str:
    return h3.latlng_to_cell(lat, lng, resolution)


def disk_for(cell_hex: str, k: int) -> list[int]:
    return [int(c, 16) for c in h3.grid_disk(cell_hex, k)]


def k_for_radius(distance_m: float, resolution: int, max_k: int) -> int:
    edge_m = h3.average_hexagon_edge_length(resolution, unit="m")
    k = math.ceil(distance_m / edge_m) + 1
    return max(1, min(k, max_k))


def search_cells(
    lat: float, lng: float, distance_m: float, resolution: int, max_k: int
) -> list[int]:
    """Return H3 cell indices forming a disk covering the search radius."""
    origin = cell_for_hex(lat, lng, resolution)
    return disk_for(origin, k_for_radius(distance_m, resolution, max_k))


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))
