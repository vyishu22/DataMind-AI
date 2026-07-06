"""Password hashing & validation utilities.

This module implements a simple PBKDF2-SHA256 password hasher to avoid
environment-specific bcrypt backend issues (72-byte limit and C-extension
compatibility). The stored format is:

  pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>

This keeps verification deterministic and portable without depending on
passlib backends.
"""
import os
import re
import hmac
import hashlib
from typing import Tuple


_ITERATIONS = 310_000
_SALT_BYTES = 16


def _to_hex(b: bytes) -> str:
    return b.hex()


def _from_hex(s: str) -> bytes:
    return bytes.fromhex(s)


def hash_password(plain: str) -> str:
    """Hash `plain` password and return encoded string.

    Uses PBKDF2-HMAC-SHA256 with a random salt.
    """
    salt = os.urandom(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, _ITERATIONS)
    return f"pbkdf2_sha256${_ITERATIONS}${_to_hex(salt)}${_to_hex(dk)}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify `plain` against stored `hashed` value."""
    try:
        parts = hashed.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = _from_hex(parts[2])
        expected = _from_hex(parts[3])
        dk = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, iterations)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Return (is_valid, error_message). Empty message = valid."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    return True, ""


def password_strength_score(password: str) -> int:
    """Return 0-4 strength score."""
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r"[A-Z]", password) and re.search(r"[a-z]", password):
        score += 1
    if re.search(r"\d", password) and re.search(r"[^A-Za-z0-9]", password):
        score += 1
    return score
