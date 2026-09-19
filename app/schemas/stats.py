from __future__ import annotations

from app.schemas.common import APIModel


class BloodTypeCount(APIModel):
    blood_type: str
    donors: int


class LevelOut(APIModel):
    level_id: int
    name: str
    min_score: int


class StatsOverview(APIModel):
    open_requests: int
    pending_offers: int
    accomplished_offers: int
    donors_by_blood_type: list[BloodTypeCount]
