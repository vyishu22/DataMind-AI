"""Basic backend tests — run with pytest."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import pandas as pd
import numpy as np

# ── Analysis service unit tests ──────────────────────────────────────────────
from app.services.analysis import run_eda, compute_health_score, get_cleaning_suggestions


@pytest.fixture
def sample_df():
    np.random.seed(42)
    return pd.DataFrame({
        "id": range(100),
        "sales": np.random.normal(1000, 200, 100),
        "region": np.random.choice(["North", "South", "East", "West"], 100),
        "date": pd.date_range("2023-01-01", periods=100).astype(str),
        "score": np.where(np.arange(100) % 10 == 0, np.nan, np.random.uniform(0, 100, 100)),
    })


def test_eda_shape(sample_df):
    eda = run_eda(sample_df)
    assert eda["shape"]["rows"] == 100
    assert eda["shape"]["columns"] == 5


def test_eda_missing(sample_df):
    eda = run_eda(sample_df)
    assert "score" in eda["missing"]
    assert eda["missing"]["score"]["count"] == 10


def test_eda_duplicates(sample_df):
    eda = run_eda(sample_df)
    assert eda["duplicates"] == 0


def test_eda_statistics(sample_df):
    eda = run_eda(sample_df)
    assert "sales" in eda["statistics"]
    assert "mean" in eda["statistics"]["sales"]


def test_eda_correlation(sample_df):
    eda = run_eda(sample_df)
    # At least numeric cols should correlate with themselves
    assert "sales" in eda.get("correlation", {})


def test_health_score(sample_df):
    eda = run_eda(sample_df)
    health = compute_health_score(eda)
    assert 0 <= health["score"] <= 100
    assert health["grade"] in ["A", "B", "C", "D"]
    assert "breakdown" in health


def test_health_score_perfect():
    """A perfectly clean dataset should score high."""
    df = pd.DataFrame({"a": range(1000), "b": np.random.normal(0, 1, 1000)})
    eda = run_eda(df)
    health = compute_health_score(eda)
    assert health["score"] >= 70


def test_cleaning_suggestions(sample_df):
    eda = run_eda(sample_df)
    suggestions = get_cleaning_suggestions(sample_df, eda)
    # Should suggest filling missing 'score' column
    actions = [s["action"] for s in suggestions]
    assert any("fill" in a or "drop" in a for a in actions)


def test_outlier_detection():
    df = pd.DataFrame({"value": [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000]})
    eda = run_eda(df)
    assert eda["outliers"]["value"]["count"] > 0


# ── Security tests ───────────────────────────────────────────────────────────
from app.core.security import hash_password, verify_password, create_access_token
from jose import jwt
from app.core.config import settings


def test_password_hashing():
    pw = "supersecret123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed)
    assert not verify_password("wrong", hashed)


def test_create_access_token():
    token = create_access_token({"sub": "user123"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "user123"
    assert payload["type"] == "access"
