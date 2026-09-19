from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import APP_TOKEN
from tests.utils import app_headers, auth_headers, login, register

SF = (37.7749, -122.4194)
SF_NEAR = (37.7755, -122.4180)
NYC = (40.7128, -74.0060)


async def test_register_login_and_me(client: AsyncClient):
    created = await register(client, "alice@example.com", latitude=SF[0], longitude=SF[1])
    assert created["email"] == "alice@example.com"
    assert created["blood_type"] == "O+"
    assert created["level_id"] == 1
    assert "password_hash" not in created

    headers = await auth_headers(client, "alice@example.com")
    me = await client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["user_id"] == created["user_id"]


async def test_duplicate_email_conflicts(client: AsyncClient):
    await register(client, "dup@example.com")
    response = await client.post(
        "/v1/users",
        headers=app_headers(),
        json={
            "email": "dup@example.com",
            "password": "password123",
            "firstname": "Dup",
        },
    )
    assert response.status_code == 409


async def test_requires_app_token(client: AsyncClient):
    response = await client.post("/v1/auth/login", json={"email": "a@b.com", "password": "x"})
    assert response.status_code == 400


async def test_requires_bearer_for_me(client: AsyncClient):
    await register(client, "bob@example.com")
    response = await client.get("/v1/users/me", headers=app_headers())
    assert response.status_code == 401


async def test_invalid_credentials(client: AsyncClient):
    await register(client, "carol@example.com")
    response = await client.post(
        "/v1/auth/login",
        headers=app_headers(),
        json={"email": "carol@example.com", "password": "wrong-pass"},
    )
    assert response.status_code == 401


async def test_update_me(client: AsyncClient):
    await register(client, "dave@example.com", latitude=SF[0], longitude=SF[1])
    headers = await auth_headers(client, "dave@example.com")
    response = await client.put(
        "/v1/users/me", headers=headers, json={"firstname": "David", "blood_type": "A-"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["firstname"] == "David"
    assert body["blood_type"] == "A-"
    assert body["latitude"] == SF[0]


async def test_radius_search_excludes_far_users(client: AsyncClient):
    await register(client, "near@example.com", blood_type="O+", latitude=SF[0], longitude=SF[1])
    await register(
        client, "close@example.com", blood_type="O+", latitude=SF_NEAR[0], longitude=SF_NEAR[1]
    )
    await register(client, "far@example.com", blood_type="O+", latitude=NYC[0], longitude=NYC[1])

    headers = await auth_headers(client, "near@example.com")
    response = await client.get(
        "/v1/users",
        headers=headers,
        params={
            "latitude": SF[0],
            "longitude": SF[1],
            "distance": 1000,
            "blood_type": "O+",
        },
    )
    assert response.status_code == 200, response.text
    emails = {u["email"] for u in response.json()["users"]}
    assert "near@example.com" in emails
    assert "close@example.com" in emails
    assert "far@example.com" not in emails


async def test_refresh_token_rotates(client: AsyncClient):
    await register(client, "erin@example.com")
    tokens = await login(client, "erin@example.com")
    response = await client.post(
        "/v1/auth/refresh",
        headers=app_headers(),
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert response.status_code == 200
    new_tokens = response.json()
    assert new_tokens["refresh_token"] != tokens["refresh_token"]

    reused = await client.post(
        "/v1/auth/refresh",
        headers=app_headers(),
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert reused.status_code == 401


async def test_logout_revokes_refresh(client: AsyncClient):
    await register(client, "frank@example.com")
    tokens = await login(client, "frank@example.com")
    headers = {**app_headers(), "Authorization": f"Bearer {tokens['access_token']}"}
    assert (await client.post("/v1/auth/logout", headers=headers)).status_code == 204
    response = await client.post(
        "/v1/auth/refresh",
        headers=app_headers(),
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert response.status_code == 401
    _ = APP_TOKEN
