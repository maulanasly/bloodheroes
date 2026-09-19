import bcrypt
import pytest

from app.core.exceptions import SessionExpired, UnAuthorized
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_and_update_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("s3cret-pass")
    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed)
    assert not verify_password("wrong", hashed)


def test_legacy_bcrypt_hash_is_upgraded():
    legacy = bcrypt.hashpw(b"legacy-pass", bcrypt.gensalt()).decode()
    valid, new_hash = verify_and_update_password("legacy-pass", legacy)
    assert valid
    assert new_hash is not None
    assert new_hash.startswith("$argon2")
    assert verify_password("legacy-pass", new_hash)


def test_access_token_roundtrip():
    token = create_access_token(42)
    payload = decode_token(token, "access")
    assert payload["sub"] == "42"
    assert payload["type"] == "access"


def test_token_type_enforced():
    token = create_refresh_token(1)
    with pytest.raises(UnAuthorized):
        decode_token(token, "access")


def test_invalid_token_rejected():
    with pytest.raises(UnAuthorized):
        decode_token("not-a-jwt", "access")


def test_expired_token_rejected(monkeypatch):
    from app.core import security

    monkeypatch.setattr(security.settings, "access_token_ttl_minutes", -1)
    token = create_access_token(7)
    with pytest.raises(SessionExpired):
        decode_token(token, "access")
