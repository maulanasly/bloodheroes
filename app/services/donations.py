from __future__ import annotations

from typing import Any

import asyncpg

from app.core.config import settings
from app.core.exceptions import (
    AccessDenied,
    DonationNotFound,
    InvalidInput,
    OfferNotFound,
    RequisiteAlreadySatisfied,
)
from app.core.geo import cell_for
from app.repositories import donations as donations_repo
from app.repositories import users as users_repo
from app.schemas.donations import DonationRequestCreate

OFFER_OFFERED = 0
OFFER_ACCEPTED = 1
OFFER_DECLINED = 2
OFFER_ACCOMPLISHED = 3

REQUEST_OPEN = 0
REQUEST_FULFILLED = 1
REQUEST_CANCELLED = 2


def _serialize_request(row: asyncpg.Record) -> dict[str, Any]:
    data = dict(row)
    requester = {
        "user_id": data.pop("user_id"),
        "firstname": data.pop("requester_firstname"),
        "lastname": data.pop("requester_lastname"),
        "contact": data.pop("requester_contact"),
        "email": data.pop("requester_email"),
    }
    data["requester"] = requester
    data["user_id"] = requester["user_id"]
    data["accepted_count"] = int(data.get("accepted_count") or 0)
    return data


async def _resolve_location(
    conn: asyncpg.Connection,
    user_id: int,
    latitude: float | None,
    longitude: float | None,
) -> tuple[float | None, float | None, int | None]:
    if latitude is None or longitude is None:
        user = await users_repo.get_by_id(conn, user_id)
        if user is not None:
            latitude = latitude if latitude is not None else user["latitude"]
            longitude = longitude if longitude is not None else user["longitude"]
    if latitude is None or longitude is None:
        return None, None, None
    return latitude, longitude, cell_for(latitude, longitude, settings.h3_resolution)


async def create_request(
    conn: asyncpg.Connection, user_id: int, payload: DonationRequestCreate
) -> dict[str, Any]:
    latitude, longitude, h3_cell = await _resolve_location(
        conn, user_id, payload.latitude, payload.longitude
    )
    row = await donations_repo.create_request(
        conn,
        user_id=user_id,
        blood_type=payload.blood_type,
        notes=payload.notes,
        requisite_number=payload.requisite_number,
        latitude=latitude,
        longitude=longitude,
        h3_cell=h3_cell,
    )
    created = await donations_repo.get_request(conn, row["request_id"])
    assert created is not None
    return _serialize_request(created)


async def get_request(conn: asyncpg.Connection, request_id: int) -> dict[str, Any]:
    row = await donations_repo.get_request(conn, request_id)
    if row is None:
        raise DonationNotFound(request_id=request_id)
    return _serialize_request(row)


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
) -> tuple[list[dict[str, Any]], int]:
    rows, count = await donations_repo.list_requests(
        conn,
        user_id=user_id,
        giver=giver,
        blood_type=blood_type,
        status=status,
        cells=cells,
        page=page,
        per_page=per_page,
    )
    return [_serialize_request(r) for r in rows], count


async def create_offer(conn: asyncpg.Connection, request_id: int, donor_id: int) -> dict[str, Any]:
    request = await donations_repo.get_request(conn, request_id)
    if request is None:
        raise DonationNotFound(request_id=request_id)
    if request["status"] != REQUEST_OPEN:
        raise InvalidInput("donation request is not open")
    if int(request["user_id"]) == donor_id:
        raise InvalidInput("cannot offer to your own request")
    if int(request["accepted_count"] or 0) >= int(request["requisite_number"]):
        raise RequisiteAlreadySatisfied(requisite_number=request["requisite_number"])

    offer = await donations_repo.create_offer(conn, request_id=request_id, donor_id=donor_id)
    if offer is None:
        raise InvalidInput("you have already offered to this request")
    return dict(offer)


async def update_offer(
    conn: asyncpg.Connection, offer_id: int, actor_id: int, new_status: int
) -> dict[str, Any]:
    offer = await donations_repo.get_offer(conn, offer_id)
    if offer is None:
        raise OfferNotFound(offer_id=offer_id)
    request = await donations_repo.get_request(conn, offer["request_id"])
    assert request is not None

    is_owner = int(request["user_id"]) == actor_id
    is_donor = int(offer["donor_id"]) == actor_id

    if new_status in (OFFER_ACCEPTED, OFFER_ACCOMPLISHED) and not is_owner:
        raise AccessDenied()
    if new_status == OFFER_DECLINED and not (is_owner or is_donor):
        raise AccessDenied()
    if new_status == OFFER_ACCOMPLISHED and offer["status"] != OFFER_ACCEPTED:
        raise InvalidInput("only accepted offers can be accomplished")

    updated = await donations_repo.update_offer_status(conn, offer_id, new_status)
    assert updated is not None

    if new_status == OFFER_ACCEPTED:
        accepted = int(request["accepted_count"] or 0) + 1
        if accepted >= int(request["requisite_number"]):
            await conn.execute(
                "UPDATE donation_requests SET status = $1 WHERE request_id = $2",
                REQUEST_FULFILLED,
                request["request_id"],
            )
    elif new_status == OFFER_ACCOMPLISHED:
        await _apply_level(conn, int(offer["donor_id"]))

    return dict(updated)


async def _apply_level(conn: asyncpg.Connection, donor_id: int) -> None:
    score = await donations_repo.count_accomplished_for_donor(conn, donor_id)
    level_id = await users_repo.get_level_for_score(conn, score)
    await users_repo.set_level(conn, donor_id, level_id)


async def list_offers(
    conn: asyncpg.Connection, request_id: int, actor_id: int
) -> list[dict[str, Any]]:
    request = await donations_repo.get_request(conn, request_id)
    if request is None:
        raise DonationNotFound(request_id=request_id)
    rows = await donations_repo.list_offers_for_request(conn, request_id)
    if int(request["user_id"]) != actor_id:
        rows = [r for r in rows if int(r["donor_id"]) == actor_id]
        if not rows:
            raise AccessDenied()
    return [dict(r) for r in rows]


async def history(
    conn: asyncpg.Connection,
    *,
    user_id: int,
    blood_type: str | None,
    status: int | None,
    page: int,
    per_page: int,
) -> tuple[list[dict[str, Any]], int]:
    rows, count = await donations_repo.list_requests(
        conn,
        user_id=user_id,
        giver=True,
        blood_type=blood_type,
        status=status,
        cells=None,
        page=page,
        per_page=per_page,
    )
    return [_serialize_request(r) for r in rows], count
