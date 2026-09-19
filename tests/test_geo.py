from app.core.geo import cell_for, haversine_m, k_for_radius, search_cells


def test_cell_is_deterministic_and_int():
    a = cell_for(37.7749, -122.4194, 8)
    b = cell_for(37.7749, -122.4194, 8)
    assert a == b
    assert isinstance(a, int)


def test_search_cells_covers_nearby_points():
    lat, lng = 37.7749, -122.4194
    nearby = (37.7755, -122.4180)
    cells = set(search_cells(lat, lng, 1000, 8, 50))
    assert cell_for(*nearby, 8) in cells


def test_k_grows_with_radius_and_is_capped():
    assert k_for_radius(1000, 8, 50) < k_for_radius(10_000, 8, 50)
    assert k_for_radius(1_000_000, 8, 50) == 50


def test_haversine_known_distance():
    d = haversine_m(37.7749, -122.4194, 37.7755, -122.4180)
    assert 0 < d < 1000
