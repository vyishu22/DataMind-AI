"""OpenRouter client (OpenAI-compatible) using httpx.

Provides async `chat` helper that returns {'content': str, 'raw': dict}.
Automatically falls back through a list of working free models when the
primary model returns 404 or 429, so the app never hard-fails due to a
single model being rate-limited or removed.
"""
from typing import List, Dict, Any, Optional
import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://openrouter.ai/api/v1"

# Ordered list of fallback models — all verified working free models.
# Primary model from .env is tried first; these are used if it fails.
FALLBACK_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-nano-9b-v2:free",
]


class OpenRouterError(Exception):
    pass


class RateLimitError(OpenRouterError):
    pass


class InvalidModelError(OpenRouterError):
    pass


async def _call_model(
    client: httpx.AsyncClient,
    api_key: str,
    model: str,
    messages: List[Dict[str, str]],
    temperature: float,
) -> Dict[str, Any]:
    """Make one request to a specific model. Raises on non-retryable errors."""
    url = f"{BASE_URL}/chat/completions"
    payload = {"model": model, "messages": messages, "temperature": temperature}
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    resp = await client.post(url, json=payload, headers=headers)

    if resp.status_code == 401:
        raise OpenRouterError("Unauthorized: check OPENROUTER_API_KEY")
    if resp.status_code in (404, 429):
        # Retryable — caller will try the next model
        raise RateLimitError(f"Model {model} returned {resp.status_code}: {resp.text[:120]}")
    if resp.status_code >= 400:
        raise OpenRouterError(f"HTTP {resp.status_code} from OpenRouter: {resp.text[:200]}")

    data = resp.json()

    content: Optional[str] = None
    if isinstance(data, dict) and "choices" in data and len(data["choices"]) > 0:
        first = data["choices"][0]
        if isinstance(first.get("message"), dict):
            content = first["message"].get("content")
        else:
            content = first.get("text") or first.get("message")

    if content is None:
        content = data.get("completion") or data.get("text") or str(data)

    return {"content": content, "raw": data}


async def chat(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.3,
    timeout: int = 60,
) -> Dict[str, Any]:
    """Call OpenRouter and return {'content': str, 'raw': dict}.

    Tries the requested model first, then falls back through FALLBACK_MODELS
    automatically on 404 (model removed) or 429 (rate limited).
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        raise OpenRouterError("Missing OPENROUTER_API_KEY environment variable")

    # Build ordered list: primary model first, then fallbacks (deduped)
    primary = model or settings.OPENROUTER_MODEL or FALLBACK_MODELS[0]
    candidates = [primary] + [m for m in FALLBACK_MODELS if m != primary]

    last_error: Exception = OpenRouterError("No models available")

    async with httpx.AsyncClient(timeout=timeout) as client:
        for candidate in candidates:
            try:
                result = await _call_model(client, api_key, candidate, messages, temperature)
                if candidate != primary:
                    logger.warning("Used fallback model %s (primary %s failed)", candidate, primary)
                return result
            except RateLimitError as e:
                logger.warning("Model %s unavailable (%s), trying next...", candidate, e)
                last_error = e
                continue
            except OpenRouterError:
                raise  # Non-retryable (401, etc.) — propagate immediately
            except httpx.RequestError as e:
                raise OpenRouterError(f"Network error calling OpenRouter: {str(e)}")

    raise OpenRouterError(
        f"All models failed. Last error: {last_error}. "
        "Check your OPENROUTER_API_KEY or try again later."
    )
