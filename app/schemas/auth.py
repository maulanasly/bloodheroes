from __future__ import annotations

from pydantic import EmailStr, Field

from app.schemas.common import APIModel


class LoginRequest(APIModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(APIModel):
    refresh_token: str = Field(min_length=1)


class TokenPair(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
