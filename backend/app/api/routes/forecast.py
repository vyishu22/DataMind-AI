"""Forecasting routes: ARIMA, Prophet (via statsmodels ETS), linear."""
from typing import Optional
import pandas as pd
import numpy as np
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter()


class ForecastRequest(BaseModel):
    dataset_id: str
    date_col: str
    value_col: str
    periods: int = 30
    method: str = "arima"  # arima | prophet | linear


def _arima_forecast(series: pd.Series, periods: int) -> list:
    from statsmodels.tsa.arima.model import ARIMA
    try:
        model = ARIMA(series, order=(2, 1, 2))
        fit = model.fit()
        forecast = fit.forecast(steps=periods)
        return forecast.tolist()
    except Exception:
        return _linear_forecast(series, periods)


def _prophet_forecast(df: pd.DataFrame, date_col: str, value_col: str, periods: int) -> dict:
    """
    Prophet-style forecast using statsmodels ExponentialSmoothing (Holt-Winters).
    Produces the same yhat / yhat_lower / yhat_upper output shape.
    Prophet's Stan backend requires a C++ toolchain on Windows that is not
    bundled with this project, so we use a pure-Python equivalent instead.
    """
    from statsmodels.tsa.holtwinters import ExponentialSmoothing

    ts = df[[date_col, value_col]].copy()
    ts[date_col] = pd.to_datetime(ts[date_col])
    ts = ts.dropna().sort_values(date_col).set_index(date_col)
    ts = ts[value_col].dropna()

    if len(ts) < 4:
        raise HTTPException(400, "Need at least 4 data points for forecasting.")

    # Detect frequency for seasonal period
    freq = pd.infer_freq(ts.index)
    seasonal_periods_map = {
        "D": 7, "W": 52, "M": 12, "MS": 12, "Q": 4, "QS": 4, "A": 1, "AS": 1,
    }
    sp = seasonal_periods_map.get(freq[:2] if freq else "", 7) if freq else 7

    # Use additive seasonality when enough data, otherwise trend-only
    try:
        if len(ts) >= sp * 2 and sp > 1:
            model = ExponentialSmoothing(ts, trend="add", seasonal="add", seasonal_periods=sp)
        else:
            model = ExponentialSmoothing(ts, trend="add", seasonal=None)
        fit = model.fit(optimized=True)
    except Exception:
        # Last resort: simple Holt linear trend
        from statsmodels.tsa.holtwinters import Holt
        fit = Holt(ts).fit()

    forecast_vals = fit.forecast(periods)

    # Build confidence interval: ±1.96 * residual std
    resid_std = float(np.std(fit.resid)) if hasattr(fit, "resid") else float(ts.std()) * 0.1
    lower = (forecast_vals - 1.96 * resid_std).round(2)
    upper = (forecast_vals + 1.96 * resid_std).round(2)

    # Future date index
    last_date = ts.index[-1]
    out_freq = freq or "D"
    future_idx = pd.date_range(last_date, periods=periods + 1, freq=out_freq)[1:]

    hist_dates = ts.index.strftime("%Y-%m-%d").tolist()
    hist_values = ts.round(2).tolist()
    all_dates = hist_dates + future_idx.strftime("%Y-%m-%d").tolist()
    all_values = hist_values + forecast_vals.round(2).tolist()
    all_lower = hist_values + lower.tolist()
    all_upper = hist_values + upper.tolist()

    return {
        "dates": all_dates,
        "values": all_values,
        "lower": all_lower,
        "upper": all_upper,
        "historical_dates": hist_dates,
        "historical_values": hist_values,
    }


def _linear_forecast(series: pd.Series, periods: int) -> list:
    """Simple linear regression forecast."""
    x = np.arange(len(series))
    y = series.values
    mask = ~np.isnan(y)
    if mask.sum() < 2:
        return [float(series.mean())] * periods
    coeffs = np.polyfit(x[mask], y[mask], 1)
    x_future = np.arange(len(series), len(series) + periods)
    return (np.polyval(coeffs, x_future)).tolist()


@router.post("/predict")
async def forecast(body: ForecastRequest, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(body.dataset_id),
        "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")

    df = pd.read_csv(doc["filepath"])

    if body.date_col not in df.columns:
        raise HTTPException(400, f"Date column '{body.date_col}' not found. Available columns: {', '.join(df.columns.tolist())}")
    if body.value_col not in df.columns:
        raise HTTPException(400, f"Value column '{body.value_col}' not found. Available columns: {', '.join(df.columns.tolist())}")

    df[body.date_col] = pd.to_datetime(df[body.date_col], errors="coerce")
    df = df.dropna(subset=[body.date_col]).sort_values(body.date_col).reset_index(drop=True)
    df[body.value_col] = pd.to_numeric(df[body.value_col], errors="coerce")

    if df[body.value_col].dropna().empty:
        raise HTTPException(400, f"Value column '{body.value_col}' contains no numeric data. Choose a numeric column.")

    # Build a clean two-column frame to avoid KeyError when date_col becomes the index
    clean = df[[body.date_col, body.value_col]].dropna().set_index(body.date_col)
    series = clean[body.value_col]

    if body.method == "prophet":
        result = _prophet_forecast(df, body.date_col, body.value_col, body.periods)
    elif body.method == "arima":
        forecast_vals = _arima_forecast(series, body.periods)
        last_date = series.index[-1]
        freq = pd.infer_freq(series.index) or "D"
        future_dates = pd.date_range(last_date, periods=body.periods + 1, freq=freq)[1:]
        result = {
            "dates": future_dates.strftime("%Y-%m-%d").tolist(),
            "values": [round(v, 2) for v in forecast_vals],
            "lower": [round(v * 0.9, 2) for v in forecast_vals],
            "upper": [round(v * 1.1, 2) for v in forecast_vals],
            "historical_dates": series.index.strftime("%Y-%m-%d").tolist(),
            "historical_values": series.round(2).tolist(),
        }
    else:
        forecast_vals = _linear_forecast(series, body.periods)
        last_date = series.index[-1]
        future_dates = pd.date_range(last_date, periods=body.periods + 1, freq="D")[1:]
        result = {
            "dates": future_dates.strftime("%Y-%m-%d").tolist(),
            "values": [round(v, 2) for v in forecast_vals],
            "lower": [round(v * 0.85, 2) for v in forecast_vals],
            "upper": [round(v * 1.15, 2) for v in forecast_vals],
            "historical_dates": series.index.strftime("%Y-%m-%d").tolist(),
            "historical_values": series.round(2).tolist(),
        }

    return {
        "method": body.method,
        "periods": body.periods,
        "date_col": body.date_col,
        "value_col": body.value_col,
        **result,
    }


@router.get("/columns/{dataset_id}")
async def forecast_columns(dataset_id: str, current_user=Depends(get_current_user)):
    """Return suitable date and numeric columns for forecasting."""
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(dataset_id),
        "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")

    df = pd.read_csv(doc["filepath"], nrows=100)
    date_cols = []
    numeric_cols = df.select_dtypes(include="number").columns.tolist()

    for col in df.columns:
        try:
            # Try common date formats first, then fall back to automatic parsing
            parsed = pd.to_datetime(df[col], errors="coerce", infer_datetime_format=True)
            if parsed.notna().sum() > 10:
                date_cols.append(col)
        except Exception:
            pass

    # If there are no detected date columns but the CSV has an obvious time field,
    # include string columns that resemble dates.
    if not date_cols:
        for col in df.columns:
            if df[col].dtype == object:
                parsed = pd.to_datetime(df[col], errors="coerce", infer_datetime_format=True)
                if parsed.notna().sum() / len(df) > 0.5:
                    date_cols.append(col)

    return {"date_columns": date_cols, "value_columns": numeric_cols}
