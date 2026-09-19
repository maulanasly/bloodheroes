"""Backfill legacy MongoDB data into the PostgreSQL schema.

Usage:
    BH_DATABASE_URL=postgresql://... \
    MONGO_URL=mongodb://localhost:27017 MONGO_DB=bloodheroes \
    python scripts/migrate_from_mongo.py

Notes / limitations:
- Legacy passwords (bcrypt) are migrated verbatim; they are re-hashed to
  Argon2id automatically on the user's next login.
- The legacy donation model inserted one row per targeted donor. Each legacy
  donation row is mapped to one *request* plus one *offer* from the target
  donor, preserving the original intent as closely as possible.
- Inserts are idempotent (ON CONFLICT DO NOTHING); safe to re-run.
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import UTC, datetime
from typing import Any

import asyncpg
from pymongo import MongoClient  # type: ignore[import-untyped]

from app.core.config import settings
from app.core.geo import cell_for

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "bloodheroes")

OFFER_STATUS_MAP = {0: 0, 1: 1, 2: 2, 3: 3}


def _to_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    return datetime.fromtimestamp(int(value), tz=UTC)


def _password(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, bytes):
        return value.decode("utf-8", "ignore")
    # older bug stored a 1-tuple
    if isinstance(value, (list, tuple)) and value:
        return _password(value[0])
    return str(value)


def _coords(doc: dict[str, Any]) -> tuple[float | None, float | None]:
    location = doc.get("location") or {}
    coords = location.get("coordinates") if isinstance(location, dict) else None
    if not coords or len(coords) != 2:
        return None, None
    longitude, latitude = coords
    return (float(latitude), float(longitude))


async def _load_users(conn: asyncpg.Connection, db) -> dict[int, str]:
    blood_map: dict[int, str] = {}
    for row in db.blood_types.find({}):
        blood_map[int(row["blood_id"])] = row["blood_name"]

    for row in db.user_level.find({}):
        await conn.execute(
            """
            INSERT INTO user_levels (level_id, name, min_score)
            VALUES ($1, $2, $3)
            ON CONFLICT (level_id) DO UPDATE
            SET name = EXCLUDED.name, min_score = EXCLUDED.min_score
            """,
            int(row["level_id"]),
            str(row.get("level", row["level_id"])),
            int(row.get("score", 0)),
        )

    migrated = 0
    for doc in db.users.find({}):
        latitude, longitude = _coords(doc)
        h3_cell = (
            cell_for(latitude, longitude, settings.h3_resolution)
            if latitude is not None and longitude is not None
            else None
        )
        blood_name = (
            blood_map.get(int(doc["blood_id"])) if doc.get("blood_id") is not None else None
        )
        await conn.execute(
            """
            INSERT INTO users (
                user_id, email, password_hash, firstname, lastname, contact, fcm_token,
                photo_url, gender, blood_type, level_id, status, register_date,
                latitude, longitude, h3_cell, location
            ) OVERRIDING SYSTEM VALUE
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                CASE WHEN $14::float8 IS NULL OR $15::float8 IS NULL THEN NULL
                     ELSE ST_SetSRID(ST_MakePoint($15, $14), 4326)::geography END
            )
            ON CONFLICT (user_id) DO NOTHING
            """,
            int(doc["user_id"]),
            doc["email"].lower(),
            _password(doc.get("bcrypt_password")) or "",
            doc.get("firstname", ""),
            doc.get("lastname"),
            doc.get("contact"),
            doc.get("fcm_token"),
            doc.get("photo_url"),
            doc.get("gender", "U"),
            blood_name,
            int(doc.get("level_id", 1)),
            int(doc.get("status", 1)),
            _to_timestamp(doc.get("register_date")) or datetime.now(UTC),
            latitude,
            longitude,
            h3_cell,
        )
        migrated += 1
    return blood_map


async def _load_donations(conn: asyncpg.Connection, db, blood_map: dict[int, str]) -> int:
    migrated = 0
    for doc in db.donations.find({}):
        blood_id = doc.get("blood_id")
        blood_name = blood_map.get(int(blood_id)) if blood_id is not None else None
        if blood_name is None:
            continue
        latitude, longitude = _coords(doc)
        h3_cell = (
            cell_for(latitude, longitude, settings.h3_resolution)
            if latitude is not None and longitude is not None
            else None
        )
        request_id = int(doc["request_id"])

        await conn.execute(
            """
            INSERT INTO donation_requests (
                request_id, user_id, blood_type, notes, requisite_number, status,
                request_date, latitude, longitude, h3_cell, location
            ) OVERRIDING SYSTEM VALUE
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                CASE WHEN $8::float8 IS NULL OR $9::float8 IS NULL THEN NULL
                     ELSE ST_SetSRID(ST_MakePoint($9, $8), 4326)::geography END
            )
            ON CONFLICT (request_id) DO NOTHING
            """,
            request_id,
            int(doc["user_id"]),
            blood_name,
            doc.get("notes"),
            int(doc.get("requisite_number", 1)),
            0,
            _to_timestamp(doc.get("request_date")) or datetime.now(UTC),
            latitude,
            longitude,
            h3_cell,
        )

        old_status = int(doc.get("status", 0))
        new_status = OFFER_STATUS_MAP.get(old_status, 0)
        request_owner = int(doc["user_id"])
        target = int(doc["target_id"])
        if target != request_owner:
            await conn.execute(
                """
                INSERT INTO donation_offers (request_id, donor_id, status)
                VALUES ($1, $2, $3)
                ON CONFLICT (request_id, donor_id) DO NOTHING
                """,
                request_id,
                target,
                new_status,
            )
        migrated += 1
    return migrated


async def _reset_sequences(conn: asyncpg.Connection) -> None:
    for table, column in (
        ("users", "user_id"),
        ("donation_requests", "request_id"),
        ("donation_offers", "offer_id"),
        ("app_tokens", "token_id"),
    ):
        await conn.execute(
            f"""
            SELECT setval(
                pg_get_serial_sequence('{table}', '{column}'),
                COALESCE((SELECT max({column}) FROM {table}), 1)
            )
            """
        )


async def main() -> int:
    mongo = MongoClient(MONGO_URL)
    db = mongo[MONGO_DB]
    conn = await asyncpg.connect(settings.database_url)
    try:
        blood_map = await _load_users(conn, db)
        donations = await _load_donations(conn, db, blood_map)
        await _reset_sequences(conn)
        print(f"migrated blood types: {len(blood_map)}, donation rows: {donations}")
    finally:
        await conn.close()
        mongo.close()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
