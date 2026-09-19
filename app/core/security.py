from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings
from app.core.exceptions import SessionExpired, UnAuthorized

password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))

TokenType = Literal["access", "refresh"]


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def verify_and_update_password(password: str, hashed: str) -> tuple[bool, str | None]:
    """Verify a password, returning a replacement hash when the algorithm is outdated."""
    return password_hash.verify_and_update(password, hashed)


def _encode(subject: int, token_type: TokenType, ttl: timedelta) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: int) -> str:
    return _encode(user_id, "access", timedelta(minutes=settings.access_token_ttl_minutes))


def create_refresh_token(user_id: int) -> str:
    return _encode(user_id, "refresh", timedelta(days=settings.refresh_token_ttl_days))


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise SessionExpired() from exc
    except jwt.PyJWTError as exc:
        raise UnAuthorized() from exc
    if payload.get("type") != expected_type:
        raise UnAuthorized()
    return payload
