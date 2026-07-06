"""JWT verification + get_current_user dependency."""
from jose import JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.utils.jwt_handler import decode_token
from app.core.database import get_db

bearer_scheme = HTTPBearer()

# Re-export password helpers for backward compat
from app.utils.password import hash_password, verify_password  # noqa: F401
from app.utils.jwt_handler import create_access_token, create_refresh_token  # noqa: F401


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials, "access")
        user_id: str = payload.get("sub")
        if not user_id:
            raise exc
    except JWTError:
        raise exc

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise exc
    return user
