from __future__ import annotations

from httpx import AsyncClient

from tests.utils import auth_headers, register

SF = (37.7749, -122.4194)
SF_NEAR = (37.7755, -122.4180)
NYC = (40.7128, -74.0060)


async def _create_request(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {
        "blood_type": "O+",
        "notes": "need blood",
        "requisite_number": 2,
        "latitude": SF[0],
        "longitude": SF[1],
    }
    payload.update(overrides)
    response = await client.post("/v1/donations/requests", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


async def test_request_offer_accept_accomplish_flow(client: AsyncClient):
    await register(client, "owner@example.com", blood_type="O+")
    await register(client, "donor@example.com", blood_type="O+")
    owner = await auth_headers(client, "owner@example.com")
    donor = await auth_headers(client, "donor@example.com")

    request = await _create_request(client, owner)
    assert request["status"] == 0

    offer_resp = await client.post(
        f"/v1/donations/requests/{request['request_id']}/offers", headers=donor
    )
    assert offer_resp.status_code == 201, offer_resp.text
    offer = offer_resp.json()
    assert offer["status"] == 0

    accepted = await client.patch(
        f"/v1/donations/offers/{offer['offer_id']}", headers=owner, json={"status": 1}
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == 1

    accomplished = await client.patch(
        f"/v1/donations/offers/{offer['offer_id']}", headers=owner, json={"status": 3}
    )
    assert accomplished.status_code == 200
    assert accomplished.json()["status"] == 3


async def test_donor_cannot_accept_own_offer(client: AsyncClient):
    await register(client, "owner2@example.com", blood_type="O+")
    await register(client, "donor2@example.com", blood_type="O+")
    owner = await auth_headers(client, "owner2@example.com")
    donor = await auth_headers(client, "donor2@example.com")

    request = await _create_request(client, owner)
    offer = (
        await client.post(f"/v1/donations/requests/{request['request_id']}/offers", headers=donor)
    ).json()

    forbidden = await client.patch(
        f"/v1/donations/offers/{offer['offer_id']}", headers=donor, json={"status": 1}
    )
    assert forbidden.status_code == 403


async def test_cannot_offer_to_own_request(client: AsyncClient):
    await register(client, "owner3@example.com", blood_type="O+")
    owner = await auth_headers(client, "owner3@example.com")
    request = await _create_request(client, owner)
    response = await client.post(
        f"/v1/donations/requests/{request['request_id']}/offers", headers=owner
    )
    assert response.status_code == 400


async def test_request_radius_filter(client: AsyncClient):
    await register(client, "req-owner@example.com", blood_type="O+")
    owner = await auth_headers(client, "req-owner@example.com")

    await _create_request(client, owner, notes="near", latitude=SF[0], longitude=SF[1])
    await _create_request(client, owner, notes="far", latitude=NYC[0], longitude=NYC[1])

    response = await client.get(
        "/v1/donations/requests",
        headers=owner,
        params={"latitude": SF_NEAR[0], "longitude": SF_NEAR[1], "distance": 1000},
    )
    assert response.status_code == 200
    notes = {d["notes"] for d in response.json()["donations"]}
    assert "near" in notes
    assert "far" not in notes
