from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import APIModel

Gender = Literal["M", "F", "U"]

BLOOD_TYPES = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}


class _LocationMixin(APIModel):
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class UserCreate(_LocationMixin):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    firstname: str = Field(min_length=1, max_length=100)
    lastname: str | None = Field(default=None, max_length=100)
    contact: str | None = Field(default=None, max_length=32)
    fcm_token: str | None = None
    photo_url: str | None = None
    gender: Gender = "U"
    blood_type: str | None = None

    @field_validator("blood_type")
    @classmethod
    def _valid_blood_type(cls, v: str | None) -> str | None:
        if v is not None and v not in BLOOD_TYPES:
            raise ValueError("invalid blood type")
        return v


class UserUpdate(_LocationMixin):
    email: EmailStr | None = None
    firstname: str | None = Field(default=None, min_length=1, max_length=100)
    lastname: str | None = Field(default=None, max_length=100)
    contact: str | None = Field(default=None, max_length=32)
    fcm_token: str | None = None
    photo_url: str | None = None
    gender: Gender | None = None
    blood_type: str | None = None

    @field_validator("blood_type")
    @classmethod
    def _valid_blood_type(cls, v: str | None) -> str | None:
        if v is not None and v not in BLOOD_TYPES:
            raise ValueError("invalid blood type")
        return v


class UserOut(APIModel):
    user_id: int
    email: EmailStr
    firstname: str
    lastname: str | None = None
    contact: str | None = None
    photo_url: str | None = None
    gender: Gender
    blood_type: str | None = None
    level_id: int
    level: str | None = None
    status: int
    register_date: datetime
    latitude: float | None = None
    longitude: float | None = None


class UserList(APIModel):
    users: list[UserOut]
    count: int
