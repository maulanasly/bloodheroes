from __future__ import annotations

from httpx import AsyncClient

from tests.utils import auth_headers, register


async def test_stats_overview_shape(client: AsyncClient):
    await register(client, "statowner@example.com", blood_type="O+")
    await register(client, "statdonor@example.com", blood_type="A+")
    headers = await auth_headers(client, "statowner@example.com")

    response = await client.get("/v1/stats/overview", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["open_requests"] == 0
    assert body["pending_offers"] == 0
    assert body["accomplished_offers"] == 0
    by_type = {row["blood_type"]: row["donors"] for row in body["donors_by_blood_type"]}
    assert by_type == {"A+": 1, "O+": 1}

    request = (
        await client.post(
            "/v1/donations/requests",
            headers=headers,
            json={"blood_type": "O+", "requisite_number": 1},
        )
    ).json()
    donor_headers = await auth_headers(client, "statdonor@example.com")
    await client.post(
        f"/v1/donations/requests/{request['request_id']}/offers", headers=donor_headers
    )

    overview = (await client.get("/v1/stats/overview", headers=headers)).json()
    assert overview["open_requests"] == 1
    assert overview["pending_offers"] == 1


async def test_levels_list(client: AsyncClient):
    await register(client, "statlevels@example.com")
    headers = await auth_headers(client, "statlevels@example.com")
    response = await client.get("/v1/stats/levels", headers=headers)
    assert response.status_code == 200, response.text
    levels = response.json()
    assert [level["name"] for level in levels] == [
        "Bronze",
        "Silver",
        "Gold",
        "Platinum",
        "Diamond",
    ]
    assert levels[0]["min_score"] == 0


async def test_stats_requires_auth(client: AsyncClient):
    response = await client.get("/v1/stats/overview")
    assert response.status_code in (400, 401)
