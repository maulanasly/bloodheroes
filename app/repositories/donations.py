from __future__ import annotations

from typing import Any

import asyncpg

REQUEST_SELECT = """
SELECT r.request_id, r.user_id, r.blood_type, r.notes, r.requisite_number, r.status,
       r.request_date, r.latitude, r.longitude,
       u.firstname AS requester_firstname, u.lastname AS requester_lastname,
       u.contact AS requester_contact, u.email AS requester_email,
       (SELECT count(*) FROM donation_offers o
        WHERE o.request_id = r.request_id AND o.status = 1) AS accepted_count
FROM donation_requests r
JOIN users u ON u.user_id = r.user_id
"""


async def create_request(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    blood_type: str,
    notes: str | None,
    requisite_number: int,
    latitude: float | None,
    longitude: float | None,
    h3_cell: int | None,
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO donation_requests (
            user_id, blood_type, notes, requisite_number, latitude, longitude, h3_cell, location
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            CASE WHEN $5::float8 IS NULL OR $6::float8 IS NULL THEN NULL
                 ELSE ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography END
        )
        RETURNING request_id
        """,
        user_id,
        blood_type,
        notes,
        requisite_number,
        latitude,
        longitude,
        h3_cell,
    )


async def get_request(conn: asyncpg.Connection, request_id: int) -> asyncpg.Record | None:
    return await conn.fetchrow(f"{REQUEST_SELECT} WHERE r.request_id = $1", request_id)


async def list_requests(
    conn: asyncpg.Connection,
    *,
    user_id: int | None,
    giver: bool,
    blood_type: str | None,
    status: int | None,
    cells: list[int] | None,
    page: int,
    per_page: int,
) -> tuple[list[asyncpg.Record], int]:
    conditions: list[str] = []
    args: list[Any] = []

    if giver and user_id is not None:
        args.append(user_id)
        conditions.append(
            "EXISTS (SELECT 1 FROM donation_offers o "
            f"WHERE o.request_id = r.request_id AND o.donor_id = ${len(args)})"
        )
    elif user_id is not None:
        args.append(user_id)
        conditions.append(f"r.user_id = ${len(args)}")
    if blood_type:
        args.append(blood_type)
        conditions.append(f"r.blood_type = ${len(args)}")
    if status is not None:
        args.append(status)
        conditions.append(f"r.status = ${len(args)}")
    if cells:
        args.append(cells)
        conditions.append(f"r.h3_cell = ANY(${len(args)})")

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    count = await conn.fetchval(f"SELECT count(*) FROM donation_requests r {where}", *args)

    args.append(per_page)
    limit_idx = len(args)
    args.append((page - 1) * per_page)
    offset_idx = len(args)
    rows = await conn.fetch(
        f"{REQUEST_SELECT} {where} ORDER BY r.request_date DESC "
        f"LIMIT ${limit_idx} OFFSET ${offset_idx}",
        *args,
    )
    return rows, int(count)


async def create_offer(
    conn: asyncpg.Connection, *, request_id: int, donor_id: int
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        INSERT INTO donation_offers (request_id, donor_id)
        VALUES ($1, $2)
        ON CONFLICT (request_id, donor_id) DO NOTHING
        RETURNING offer_id, request_id, donor_id, status, offered_at, updated_at
        """,
        request_id,
        donor_id,
    )


async def get_offer(conn: asyncpg.Connection, offer_id: int) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT offer_id, request_id, donor_id, status, offered_at, updated_at
        FROM donation_offers WHERE offer_id = $1
        """,
        offer_id,
    )


async def update_offer_status(
    conn: asyncpg.Connection, offer_id: int, status: int
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        UPDATE donation_offers
        SET status = $1, updated_at = now()
        WHERE offer_id = $2
        RETURNING offer_id, request_id, donor_id, status, offered_at, updated_at
        """,
        status,
        offer_id,
    )


async def list_offers_for_request(
    conn: asyncpg.Connection, request_id: int
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT o.offer_id, o.request_id, o.donor_id, o.status, o.offered_at, o.updated_at,
               u.firstname, u.lastname, u.contact, u.email
        FROM donation_offers o
        JOIN users u ON u.user_id = o.donor_id
        WHERE o.request_id = $1
        ORDER BY o.offered_at
        """,
        request_id,
    )


async def count_accomplished_for_donor(conn: asyncpg.Connection, donor_id: int) -> int:
    return int(
        await conn.fetchval(
            "SELECT count(*) FROM donation_offers WHERE donor_id = $1 AND status = 3",
            donor_id,
        )
    )
