"""Analysis routes: EDA, health score, cleaning suggestions, chart data."""
import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.analysis import run_eda, compute_health_score, get_cleaning_suggestions

router = APIRouter()


async def _load_df(dataset_id: str, user_id: str) -> tuple[pd.DataFrame, dict]:
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(dataset_id),
        "user_id": user_id,
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")
    df = pd.read_csv(doc["filepath"])
    return df, doc


@router.get("/{dataset_id}/eda")
async def eda(dataset_id: str, current_user=Depends(get_current_user)):
    df, _ = await _load_df(dataset_id, str(current_user["_id"]))
    return run_eda(df)


@router.get("/{dataset_id}/health")
async def health_score(dataset_id: str, current_user=Depends(get_current_user)):
    df, _ = await _load_df(dataset_id, str(current_user["_id"]))
    eda = run_eda(df)
    return compute_health_score(eda)


@router.get("/{dataset_id}/cleaning")
async def cleaning(dataset_id: str, current_user=Depends(get_current_user)):
    df, _ = await _load_df(dataset_id, str(current_user["_id"]))
    eda = run_eda(df)
    return {"suggestions": get_cleaning_suggestions(df, eda)}


@router.get("/{dataset_id}/chart-data")
async def chart_data(
    dataset_id: str,
    x: str,
    y: str,
    chart_type: str = "bar",
    agg: str = "sum",
    current_user=Depends(get_current_user),
):
    """Return aggregated data for a given chart type."""
    df, _ = await _load_df(dataset_id, str(current_user["_id"]))

    if x not in df.columns:
        raise HTTPException(400, f"Column '{x}' not found")
    if y not in df.columns:
        raise HTTPException(400, f"Column '{y}' not found")

    agg_fn = {"sum": "sum", "mean": "mean", "count": "count", "max": "max", "min": "min"}.get(agg, "sum")
    grouped = df.groupby(x)[y].agg(agg_fn).reset_index()
    grouped.columns = ["x", "y"]
    grouped = grouped.sort_values("y", ascending=False).head(50)

    return {
        "chart_type": chart_type,
        "x_label": x,
        "y_label": f"{agg}({y})",
        "data": grouped.fillna(0).to_dict(orient="records"),
    }


@router.get("/{dataset_id}/correlation-matrix")
async def correlation_matrix(dataset_id: str, current_user=Depends(get_current_user)):
    df, _ = await _load_df(dataset_id, str(current_user["_id"]))
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return {"columns": [], "matrix": []}
    corr = numeric.corr().round(3)
    return {
        "columns": corr.columns.tolist(),
        "matrix": corr.values.tolist(),
    }


@router.post("/{dataset_id}/clean")
async def apply_cleaning(
    dataset_id: str,
    actions: list[dict],
    current_user=Depends(get_current_user),
):
    """Apply cleaning actions to dataset and save a cleaned version."""
    df, doc = await _load_df(dataset_id, str(current_user["_id"]))

    for action in actions:
        col = action.get("column")
        act = action.get("action")

        if act == "drop_column" and col in df.columns:
            df = df.drop(columns=[col])
        elif act == "fill_median" and col in df.columns:
            df[col] = df[col].fillna(df[col].median())
        elif act == "fill_mode" and col in df.columns:
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
        elif act == "drop_duplicates":
            df = df.drop_duplicates()
        elif act == "cap_outliers" and col in df.columns:
            q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
            iqr = q3 - q1
            df[col] = df[col].clip(q1 - 1.5 * iqr, q3 + 1.5 * iqr)

    # Overwrite file with cleaned data
    df.to_csv(doc["filepath"], index=False)

    # Update metadata
    db = get_db()
    await db.datasets.update_one(
        {"_id": ObjectId(dataset_id)},
        {"$set": {"rows": len(df), "columns": len(df.columns), "missing_total": int(df.isnull().sum().sum())}},
    )

    return {"message": "Dataset cleaned successfully", "rows": len(df), "columns": len(df.columns)}
