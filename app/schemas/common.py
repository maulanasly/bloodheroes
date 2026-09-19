from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class ErrorResponse(BaseModel):
    code: int
    reason: str
    extra_info: dict = {}
