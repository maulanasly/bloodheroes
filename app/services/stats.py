from __future__ import annotations

from typing import Any

import asyncpg


async def overview(conn: asyncpg.Connection) -> dict[str, Any]:
    open_requests = await conn.fetchval("SELECT count(*) FROM donation_requests WHERE status = 0")
    pending_offers = await conn.fetchval("SELECT count(*) FROM donation_offers WHERE status = 0")
    accomplished_offers = await conn.fetchval(
        "SELECT count(*) FROM donation_offers WHERE status = 3"
    )
    rows = await conn.fetch(
        """
        SELECT blood_type, count(*) AS donors
        FROM users
        WHERE status = 1 AND blood_type IS NOT NULL
        GROUP BY blood_type
        ORDER BY blood_type
        """
    )
    return {
        "open_requests": int(open_requests or 0),
        "pending_offers": int(pending_offers or 0),
        "accomplished_offers": int(accomplished_offers or 0),
        "donors_by_blood_type": [
            {"blood_type": r["blood_type"], "donors": int(r["donors"])} for r in rows
        ],
    }


async def list_levels(conn: asyncpg.Connection) -> list[dict[str, Any]]:
    rows = await conn.fetch("SELECT level_id, name, min_score FROM user_levels ORDER BY min_score")
    return [dict(r) for r in rows]
