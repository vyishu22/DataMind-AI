"""JWT handler — access, refresh, email-verification, password-reset tokens."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Literal

from jose import JWTError, jwt

from app.core.config import settings

TokenType = Literal["access", "refresh", "email_verify", "pwd_reset"]


def _make_token(payload: dict, expires: timedelta, token_type: TokenType) -> str:
    data = payload.copy()
    data.update({"exp": datetime.now(timezone.utc) + expires, "type": token_type})
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: str) -> str:
    return _make_token(
        {"sub": user_id},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )


def create_refresh_token(user_id: str, session_id: Optional[str] = None) -> str:
    payload: dict = {"sub": user_id}
    if session_id:
        payload["sid"] = session_id
    return _make_token(payload, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh")


def create_email_verify_token(user_id: str) -> str:
    return _make_token({"sub": user_id}, timedelta(hours=24), "email_verify")


def create_pwd_reset_token(user_id: str) -> str:
    return _make_token({"sub": user_id}, timedelta(hours=1), "pwd_reset")


def decode_token(token: str, expected_type: TokenType) -> dict:
    """Decode and validate a token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != expected_type:
        raise JWTError(f"Expected token type '{expected_type}', got '{payload.get('type')}'")
    return payload
