from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import APIModel
from app.schemas.users import BLOOD_TYPES


class DonationRequestCreate(APIModel):
    blood_type: str
    notes: str | None = None
    requisite_number: int = Field(default=1, gt=0, le=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("blood_type")
    @classmethod
    def _valid_blood_type(cls, v: str) -> str:
        if v not in BLOOD_TYPES:
            raise ValueError("invalid blood type")
        return v


class DonorSummary(APIModel):
    user_id: int
    firstname: str
    lastname: str | None = None
    contact: str | None = None
    email: str


class DonationRequestOut(APIModel):
    request_id: int
    user_id: int
    blood_type: str
    notes: str | None = None
    requisite_number: int
    status: int
    request_date: datetime
    accepted_count: int = 0
    latitude: float | None = None
    longitude: float | None = None
    requester: DonorSummary | None = None


class OfferOut(APIModel):
    offer_id: int
    request_id: int
    donor_id: int
    status: int
    offered_at: datetime
    updated_at: datetime


class OfferStatusUpdate(APIModel):
    status: int = Field(ge=0, le=3)


class DonationRequestList(APIModel):
    donations: list[DonationRequestOut]
    count: int
