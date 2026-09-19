from __future__ import annotations

from typing import Any

import asyncpg

from app.core.config import settings
from app.core.exceptions import EmailConflict, UserNotFound
from app.core.geo import cell_for
from app.core.security import hash_password
from app.repositories import users as users_repo
from app.schemas.users import UserCreate, UserUpdate


def _serialize(row: asyncpg.Record) -> dict[str, Any]:
    return dict(row)


def _location_fields(latitude: float | None, longitude: float | None) -> dict[str, Any]:
    if latitude is None or longitude is None:
        return {"latitude": None, "longitude": None, "h3_cell": None}
    return {
        "latitude": latitude,
        "longitude": longitude,
        "h3_cell": cell_for(latitude, longitude, settings.h3_resolution),
    }


async def create_user(conn: asyncpg.Connection, payload: UserCreate) -> dict[str, Any]:
    if await users_repo.email_exists(conn, payload.email):
        raise EmailConflict()
    geo = _location_fields(payload.latitude, payload.longitude)
    row = await users_repo.create_user(
        conn,
        email=payload.email,
        password_hash=hash_password(payload.password),
        firstname=payload.firstname,
        lastname=payload.lastname,
        contact=payload.contact,
        fcm_token=payload.fcm_token,
        photo_url=payload.photo_url,
        gender=payload.gender,
        blood_type=payload.blood_type,
        latitude=geo["latitude"],
        longitude=geo["longitude"],
        h3_cell=geo["h3_cell"],
    )
    created = await users_repo.get_by_id(conn, row["user_id"])
    assert created is not None
    return _serialize(created)


async def get_user(conn: asyncpg.Connection, user_id: int) -> dict[str, Any]:
    row = await users_repo.get_by_id(conn, user_id)
    if row is None:
        raise UserNotFound(user_id=user_id)
    return _serialize(row)


async def update_user(
    conn: asyncpg.Connection, user_id: int, payload: UserUpdate
) -> dict[str, Any]:
    existing = await users_repo.get_by_id(conn, user_id)
    if existing is None:
        raise UserNotFound(user_id=user_id)

    data = payload.model_dump(exclude_unset=True)
    if "email" in data and await users_repo.email_exists(conn, data["email"], user_id):
        raise EmailConflict()

    if "latitude" in data or "longitude" in data:
        latitude = data.get("latitude", existing["latitude"])
        longitude = data.get("longitude", existing["longitude"])
        data.update(_location_fields(latitude, longitude))

    updated = await users_repo.update_user(conn, user_id, data)
    assert updated is not None
    return _serialize(updated)


async def delete_user(conn: asyncpg.Connection, user_id: int) -> None:
    if not await users_repo.delete_user(conn, user_id):
        raise UserNotFound(user_id=user_id)


async def list_users(
    conn: asyncpg.Connection,
    *,
    cells: list[int] | None,
    blood_type: str | None,
    gender: str | None,
    status: int | None,
    latitude: float | None,
    longitude: float | None,
    distance_m: int | None,
    page: int,
    per_page: int,
) -> tuple[list[dict[str, Any]], int]:
    rows, count = await users_repo.list_users(
        conn,
        cells=cells,
        blood_type=blood_type,
        gender=gender,
        status=status,
        latitude=latitude,
        longitude=longitude,
        distance_m=distance_m,
        page=page,
        per_page=per_page,
    )
    return [_serialize(r) for r in rows], count
