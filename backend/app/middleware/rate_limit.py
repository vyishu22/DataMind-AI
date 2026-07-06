"""Simple in-memory rate limiter middleware (production: use Redis)."""
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

# { ip: [(timestamp, count), ...] }
_buckets: dict[str, list[float]] = defaultdict(list)

RATE_LIMIT_AUTH = 10   # requests per window
RATE_LIMIT_API  = 200
WINDOW_SECONDS  = 60


def _check(key: str, limit: int) -> None:
    now = time.monotonic()
    window_start = now - WINDOW_SECONDS
    timestamps = _buckets[key]
    # Evict old entries
    _buckets[key] = [t for t in timestamps if t > window_start]
    if len(_buckets[key]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Limit: {limit} per {WINDOW_SECONDS}s",
            headers={"Retry-After": str(WINDOW_SECONDS)},
        )
    _buckets[key].append(now)


async def auth_rate_limit(request: Request) -> None:
    """Strict rate limit for auth endpoints."""
    ip = request.client.host if request.client else "unknown"
    _check(f"auth:{ip}", RATE_LIMIT_AUTH)


async def api_rate_limit(request: Request) -> None:
    """General rate limit for API endpoints."""
    ip = request.client.host if request.client else "unknown"
    _check(f"api:{ip}", RATE_LIMIT_API)
