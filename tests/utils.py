from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import APP_TOKEN

PASSWORD = "password123"


def app_headers() -> dict[str, str]:
    return {"X-APP-TOKEN": APP_TOKEN}


async def register(
    client: AsyncClient,
    email: str,
    *,
    firstname: str = "Test",
    blood_type: str = "O+",
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    payload = {
        "email": email,
        "password": PASSWORD,
        "firstname": firstname,
        "lastname": "User",
        "contact": "+100000000",
        "gender": "M",
        "blood_type": blood_type,
    }
    if latitude is not None and longitude is not None:
        payload["latitude"] = latitude
        payload["longitude"] = longitude
    response = await client.post("/v1/users", headers=app_headers(), json=payload)
    assert response.status_code == 201, response.text
    return response.json()


async def login(client: AsyncClient, email: str) -> dict:
    response = await client.post(
        "/v1/auth/login",
        headers=app_headers(),
        json={"email": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def auth_headers(client: AsyncClient, email: str) -> dict[str, str]:
    tokens = await login(client, email)
    return {**app_headers(), "Authorization": f"Bearer {tokens['access_token']}"}
