from __future__ import annotations

from typing import Any

import asyncpg

USER_SELECT = """
SELECT u.user_id, u.email, u.firstname, u.lastname, u.contact, u.photo_url,
       u.gender, u.blood_type, u.level_id, l.name AS level, u.status,
       u.register_date, u.latitude, u.longitude
FROM users u
JOIN user_levels l USING (level_id)
"""


async def get_by_id(conn: asyncpg.Connection, user_id: int) -> asyncpg.Record | None:
    return await conn.fetchrow(f"{USER_SELECT} WHERE u.user_id = $1", user_id)


async def get_by_email(conn: asyncpg.Connection, email: str) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT u.user_id, u.email, u.password_hash, u.firstname, u.lastname, u.contact,
               u.photo_url, u.gender, u.blood_type, u.level_id, u.status,
               u.register_date, u.latitude, u.longitude
        FROM users u WHERE lower(u.email) = lower($1)
        """,
        email,
    )


async def email_exists(
    conn: asyncpg.Connection, email: str, exclude_user_id: int | None = None
) -> bool:
    row = await conn.fetchval(
        "SELECT 1 FROM users WHERE lower(email) = lower($1) AND user_id <> $2",
        email,
        exclude_user_id or 0,
    )
    return row is not None


async def create_user(
    conn: asyncpg.Connection,
    *,
    email: str,
    password_hash: str,
    firstname: str,
    lastname: str | None,
    contact: str | None,
    fcm_token: str | None,
    photo_url: str | None,
    gender: str,
    blood_type: str | None,
    latitude: float | None,
    longitude: float | None,
    h3_cell: int | None,
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO users (
            email, password_hash, firstname, lastname, contact, fcm_token, photo_url,
            gender, blood_type, latitude, longitude, h3_cell, location
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            CASE WHEN $10::float8 IS NULL OR $11::float8 IS NULL THEN NULL
                 ELSE ST_SetSRID(ST_MakePoint($11, $10), 4326)::geography END
        )
        RETURNING user_id, email, firstname, lastname, contact, photo_url, gender,
                  blood_type, level_id, status, register_date, latitude, longitude, h3_cell
        """,
        email,
        password_hash,
        firstname,
        lastname,
        contact,
        fcm_token,
        photo_url,
        gender,
        blood_type,
        latitude,
        longitude,
        h3_cell,
    )


async def update_user(
    conn: asyncpg.Connection, user_id: int, fields: dict[str, Any]
) -> asyncpg.Record | None:
    allowed = {
        "email",
        "firstname",
        "lastname",
        "contact",
        "fcm_token",
        "photo_url",
        "gender",
        "blood_type",
        "status",
        "latitude",
        "longitude",
        "h3_cell",
        "password_hash",
    }
    data = {k: v for k, v in fields.items() if k in allowed}
    if not data:
        return await get_by_id(conn, user_id)

    geo = "latitude" in data or "longitude" in data
    assignments: list[str] = []
    args: list[Any] = []
    for i, (key, value) in enumerate(data.items(), start=1):
        assignments.append(f"{key} = ${i}")
        args.append(value)
    if geo:
        assignments.append(
            "location = CASE WHEN latitude IS NULL OR longitude IS NULL THEN NULL "
            "ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography END"
        )
    assignments.append("updated_at = now()")

    query = f"UPDATE users SET {', '.join(assignments)} WHERE user_id = ${len(args) + 1}"
    args.append(user_id)
    await conn.execute(query, *args)
    return await get_by_id(conn, user_id)


async def delete_user(conn: asyncpg.Connection, user_id: int) -> bool:
    result = await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)
    return result.endswith("1")


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
) -> tuple[list[asyncpg.Record], int]:
    conditions: list[str] = []
    args: list[Any] = []

    if cells:
        args.append(cells)
        conditions.append(f"u.h3_cell = ANY(${len(args)})")
    if blood_type:
        args.append(blood_type)
        conditions.append(f"u.blood_type = ${len(args)}")
    if gender:
        args.append(gender)
        conditions.append(f"u.gender = ${len(args)}")
    if status is not None:
        args.append(status)
        conditions.append(f"u.status = ${len(args)}")
    if latitude is not None and longitude is not None and distance_m is not None:
        args.append(longitude)
        lng_idx = len(args)
        args.append(latitude)
        lat_idx = len(args)
        args.append(distance_m)
        dist_idx = len(args)
        conditions.append(
            "ST_DWithin(u.location, "
            f"ST_SetSRID(ST_MakePoint(${lng_idx}, ${lat_idx}), 4326)::geography, ${dist_idx})"
        )

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    count = await conn.fetchval(f"SELECT count(*) FROM users u {where}", *args)

    args.append(per_page)
    limit_idx = len(args)
    args.append((page - 1) * per_page)
    offset_idx = len(args)
    rows = await conn.fetch(
        f"{USER_SELECT} {where} ORDER BY u.user_id LIMIT ${limit_idx} OFFSET ${offset_idx}",
        *args,
    )
    return rows, int(count)


async def set_level(conn: asyncpg.Connection, user_id: int, level_id: int) -> None:
    await conn.execute(
        "UPDATE users SET level_id = $1, updated_at = now() WHERE user_id = $2",
        level_id,
        user_id,
    )


async def get_level_for_score(conn: asyncpg.Connection, score: int) -> int:
    return int(
        await conn.fetchval(
            """
            SELECT level_id FROM user_levels
            WHERE min_score <= $1 ORDER BY min_score DESC LIMIT 1
            """,
            score,
        )
        or 1
    )
