from __future__ import annotations

import h3
from httpx import AsyncClient

from tests.utils import app_headers, auth_headers, register

SF = (37.7749, -122.4194)


async def test_geo_cell_matches_h3(client: AsyncClient):
    await register(client, "geo@example.com")
    headers = await auth_headers(client, "geo@example.com")
    response = await client.get(
        "/v1/geo/cell",
        headers=headers,
        params={"latitude": SF[0], "longitude": SF[1]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["cell_id"] == h3.latlng_to_cell(SF[0], SF[1], 8)
    assert body["resolution"] == 8
    assert len(body["boundary"]) == 6
    assert body["center"]["latitude"] == h3.cell_to_latlng(body["cell_id"])[0]


async def test_geo_cell_explicit_resolution(client: AsyncClient):
    await register(client, "geores@example.com")
    headers = await auth_headers(client, "geores@example.com")
    response = await client.get(
        "/v1/geo/cell",
        headers=headers,
        params={"latitude": SF[0], "longitude": SF[1], "resolution": 9},
    )
    assert response.status_code == 200, response.text
    assert response.json()["resolution"] == 9


async def test_geo_disk_caps_and_truncates(client: AsyncClient):
    await register(client, "geodisk@example.com")
    headers = await auth_headers(client, "geodisk@example.com")
    response = await client.get(
        "/v1/geo/disk",
        headers=headers,
        params={"latitude": SF[0], "longitude": SF[1], "distance": 100000},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["distance_m"] == 50000
    assert body["k"] == 50
    assert body["total_cells"] > body["cell_count"]
    assert body["truncated"] is True
    assert len(body["cells"]) == body["cell_count"] == 1000


async def test_geo_disk_small_radius_complete(client: AsyncClient):
    await register(client, "geodisk2@example.com")
    headers = await auth_headers(client, "geodisk2@example.com")
    response = await client.get(
        "/v1/geo/disk",
        headers=headers,
        params={"latitude": SF[0], "longitude": SF[1], "distance": 1000},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["truncated"] is False
    assert body["cell_count"] == body["total_cells"]
    assert body["origin"]["cell_id"] in {c["cell_id"] for c in body["cells"]}


async def test_geo_requires_app_token(client: AsyncClient):
    await register(client, "geonotoken@example.com")
    tokens_response = await client.post(
        "/v1/auth/login",
        headers=app_headers(),
        json={"email": "geonotoken@example.com", "password": "password123"},
    )
    token = tokens_response.json()["access_token"]
    response = await client.get(
        "/v1/geo/cell",
        headers={"Authorization": f"Bearer {token}"},
        params={"latitude": SF[0], "longitude": SF[1]},
    )
    assert response.status_code == 400


async def test_geo_rejects_bad_coordinates(client: AsyncClient):
    await register(client, "geobad@example.com")
    headers = await auth_headers(client, "geobad@example.com")
    response = await client.get(
        "/v1/geo/cell",
        headers=headers,
        params={"latitude": 999, "longitude": SF[1]},
    )
    assert response.status_code == 422
