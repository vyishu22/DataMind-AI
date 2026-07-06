"""Auth service — all business logic for register/login/tokens/email flows."""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status, Request

from app.core.database import get_db
from app.models.user import new_user_doc, new_session_doc, PUBLIC_USER_PROJECTION
from app.utils.password import hash_password, verify_password, validate_password_strength
from app.utils.jwt_handler import (
    create_access_token, create_refresh_token,
    create_email_verify_token, create_pwd_reset_token,
    decode_token,
)
from app.utils.email import send_verify_email, send_reset_email
from jose import JWTError


def _serialize_user(user: dict) -> dict:
    return {
        "id":            str(user["_id"]),
        "fullName":      user.get("fullName", user.get("name", "")),
        "email":         user["email"],
        "avatar":        user.get("avatar"),
        "role":          user.get("role", "user"),
        "isVerified":    user.get("isVerified", False),
        "plan":          user.get("plan", "free"),
        "datasets_count": user.get("datasets_count", 0),
        "createdAt":     user.get("createdAt", user.get("created_at", "")),
    }


def _get_device(request: Optional[Request]) -> str:
    if not request:
        return "unknown"
    ua = request.headers.get("user-agent", "")
    return ua[:120] if ua else "unknown"


async def register_user(full_name: str, email: str, password: str, request: Optional[Request] = None) -> dict:
    db = get_db()

    # Duplicate check
    if await db.users.find_one({"email": email.lower()}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    # Strength check
    valid, err = validate_password_strength(password)
    if not valid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, err)

    doc = new_user_doc(
        full_name=full_name,
        email=email.lower(),
        password_hash=hash_password(password),
        is_verified=False,
    )
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    uid = str(result.inserted_id)

    # Tokens
    access  = create_access_token(uid)
    refresh = create_refresh_token(uid)

    # Persist session
    session = new_session_doc(uid, refresh, _get_device(request))
    await db.sessions.insert_one(session)

    # Send verification email (non-blocking)
    try:
        verify_token = create_email_verify_token(uid)
        await send_verify_email(email, full_name, verify_token)
    except Exception:
        pass  # Don't fail registration if email fails

    return {
        "access_token":  access,
        "refresh_token": refresh,
        "token_type":    "bearer",
        "user":          _serialize_user(doc),
    }


async def login_user(email: str, password: str, remember_me: bool = False, request: Optional[Request] = None) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email.lower()})
    if not user or not verify_password(password, user.get("passwordHash") or user.get("hashed_password", "")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    uid = str(user["_id"])
    expires_days = 30 if remember_me else 7
    access  = create_access_token(uid)
    refresh = create_refresh_token(uid)

    # Upsert session (one per device)
    device = _get_device(request)
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    await db.sessions.update_one(
        {"userId": uid, "device": device},
        {"$set": {
            "refreshToken": refresh,
            "createdAt":    now.isoformat(),
            "expiresAt":    (now + timedelta(days=expires_days)).isoformat(),
        }},
        upsert=True,
    )

    return {
        "access_token":  access,
        "refresh_token": refresh,
        "token_type":    "bearer",
        "user":          _serialize_user(user),
    }


async def refresh_tokens(refresh_token: str) -> dict:
    db = get_db()
    try:
        payload = decode_token(refresh_token, "refresh")
        uid = payload["sub"]
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    # Validate token exists in sessions (rotation check)
    session = await db.sessions.find_one({"userId": uid, "refreshToken": refresh_token})
    if not session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session revoked or not found")

    # Rotate refresh token
    new_refresh = create_refresh_token(uid)
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"refreshToken": new_refresh}},
    )

    return {
        "access_token":  create_access_token(uid),
        "refresh_token": new_refresh,
        "token_type":    "bearer",
    }


async def logout_user(user_id: str, refresh_token: Optional[str] = None) -> None:
    db = get_db()
    if refresh_token:
        await db.sessions.delete_one({"userId": user_id, "refreshToken": refresh_token})
    else:
        # Logout all sessions
        await db.sessions.delete_many({"userId": user_id})


async def forgot_password(email: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email.lower()})
    # Always return same message to avoid email enumeration
    if user:
        token = create_pwd_reset_token(str(user["_id"]))
        try:
            await send_reset_email(email, user.get("fullName", "User"), token)
        except Exception:
            pass
    return {"message": "If that email is registered, a reset link has been sent."}


async def reset_password(token: str, new_password: str) -> dict:
    db = get_db()
    try:
        payload = decode_token(token, "pwd_reset")
        uid = payload["sub"]
    except JWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")

    valid, err = validate_password_strength(new_password)
    if not valid:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, err)

    now = datetime.now(timezone.utc).isoformat()
    result = await db.users.update_one(
        {"_id": ObjectId(uid)},
        {"$set": {"passwordHash": hash_password(new_password), "updatedAt": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Revoke all sessions after password reset
    await db.sessions.delete_many({"userId": uid})

    return {"message": "Password reset successfully. Please log in with your new password."}


async def verify_email(token: str) -> dict:
    db = get_db()
    try:
        payload = decode_token(token, "email_verify")
        uid = payload["sub"]
    except JWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification token")

    now = datetime.now(timezone.utc).isoformat()
    result = await db.users.update_one(
        {"_id": ObjectId(uid)},
        {"$set": {"isVerified": True, "updatedAt": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return {"message": "Email verified successfully."}


async def resend_verification(user_id: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.get("isVerified"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already verified")

    token = create_email_verify_token(user_id)
    await send_verify_email(user["email"], user.get("fullName", "User"), token)
    return {"message": "Verification email resent."}


async def get_current_user_service(user_id: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)}, PUBLIC_USER_PROJECTION)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _serialize_user(user)
