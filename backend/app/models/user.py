"""MongoDB document shapes for users and sessions."""
from datetime import datetime, timezone
from typing import Optional


def new_user_doc(
    full_name: str,
    email: str,
    password_hash: str,
    avatar: Optional[str] = None,
    role: str = "user",
    is_verified: bool = False,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "fullName": full_name,
        "email": email,
        "passwordHash": password_hash,
        "avatar": avatar,
        "role": role,              # user | admin
        "isVerified": is_verified,
        "plan": "free",
        "datasets_count": 0,
        "createdAt": now,
        "updatedAt": now,
    }


def new_session_doc(
    user_id: str,
    refresh_token: str,
    device: Optional[str] = None,
    expires_days: int = 7,
) -> dict:
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    return {
        "userId": user_id,
        "refreshToken": refresh_token,
        "device": device or "unknown",
        "createdAt": now.isoformat(),
        "expiresAt": (now + timedelta(days=expires_days)).isoformat(),
    }


# Field projection for public user data (exclude sensitive fields)
PUBLIC_USER_PROJECTION = {
    "passwordHash": 0,
}
