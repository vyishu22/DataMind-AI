"""Auth service unit tests."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.utils.password import hash_password, verify_password, validate_password_strength, password_strength_score
from app.utils.jwt_handler import (
    create_access_token, create_refresh_token,
    create_email_verify_token, create_pwd_reset_token,
    decode_token,
)
from jose import JWTError


# ── Password tests ───────────────────────────────────────────────────────────
def test_hash_and_verify():
    pw = "Secure123!"
    h  = hash_password(pw)
    assert h != pw
    assert verify_password(pw, h)
    assert not verify_password("wrong", h)

def test_strength_too_short():
    ok, msg = validate_password_strength("abc")
    assert not ok
    assert "8" in msg

def test_strength_no_upper():
    ok, msg = validate_password_strength("lowercase123!")
    assert not ok
    assert "uppercase" in msg.lower()

def test_strength_valid():
    ok, msg = validate_password_strength("Secure123!")
    assert ok
    assert msg == ""

def test_strength_score():
    assert password_strength_score("a") == 0
    assert password_strength_score("Secure123!xyz") == 4


# ── JWT tests ─────────────────────────────────────────────────────────────────
def test_access_token_roundtrip():
    token   = create_access_token("user123")
    payload = decode_token(token, "access")
    assert payload["sub"] == "user123"
    assert payload["type"] == "access"

def test_refresh_token_roundtrip():
    token   = create_refresh_token("user456", session_id="sess1")
    payload = decode_token(token, "refresh")
    assert payload["sub"]  == "user456"
    assert payload["sid"]  == "sess1"
    assert payload["type"] == "refresh"

def test_email_verify_token():
    token   = create_email_verify_token("user789")
    payload = decode_token(token, "email_verify")
    assert payload["sub"] == "user789"

def test_pwd_reset_token():
    token   = create_pwd_reset_token("user000")
    payload = decode_token(token, "pwd_reset")
    assert payload["sub"] == "user000"

def test_wrong_token_type_raises():
    token = create_access_token("user123")
    with pytest.raises(JWTError):
        decode_token(token, "refresh")   # access token != refresh

def test_tampered_token_raises():
    token = create_access_token("user123") + "tampered"
    with pytest.raises(JWTError):
        decode_token(token, "access")
