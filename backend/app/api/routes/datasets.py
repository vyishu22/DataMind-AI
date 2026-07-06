"""Dataset routes: upload CSV, list, get, delete, merge."""
import os
import uuid
from datetime import datetime, timezone

import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {"text/csv", "application/vnd.ms-excel", "application/octet-stream"}


async def _save_file(file: UploadFile) -> str:
    """Save uploaded file and return path."""
    ext = os.path.splitext(file.filename)[1] or ".csv"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath


def _df_preview(df: pd.DataFrame) -> dict:
    """Return lightweight metadata about a DataFrame."""
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "preview": df.head(5).fillna("").to_dict(orient="records"),
        "missing_total": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
    }


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):
    filepath = await _save_file(file)
    df = pd.read_csv(filepath)
    meta = _df_preview(df)

    db = get_db()
    doc = {
        "user_id": str(current_user["_id"]),
        "name": name or file.filename,
        "filename": os.path.basename(filepath),
        "filepath": filepath,
        "original_name": file.filename,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **meta,
    }
    result = await db.datasets.insert_one(doc)
    # update user counter
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"datasets_count": 1}},
    )
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/")
async def list_datasets(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.datasets.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    datasets = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        datasets.append(doc)
    return datasets


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(dataset_id),
        "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(dataset_id),
        "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")
    # Remove file
    if os.path.exists(doc.get("filepath", "")):
        os.remove(doc["filepath"])
    await db.datasets.delete_one({"_id": ObjectId(dataset_id)})
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"datasets_count": -1}},
    )
    return {"message": "Dataset deleted"}


@router.post("/merge")
async def merge_datasets(
    dataset_ids: List[str],
    merge_on: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    """Merge multiple datasets by index or a common column."""
    db = get_db()
    dfs = []
    names = []
    for did in dataset_ids:
        doc = await db.datasets.find_one({
            "_id": ObjectId(did),
            "user_id": str(current_user["_id"]),
        })
        if not doc:
            raise HTTPException(404, f"Dataset {did} not found")
        dfs.append(pd.read_csv(doc["filepath"]))
        names.append(doc["name"])

    if len(dfs) < 2:
        raise HTTPException(400, "At least 2 datasets required to merge")

    if merge_on:
        merged = dfs[0]
        for df in dfs[1:]:
            merged = merged.merge(df, on=merge_on, how="outer")
    else:
        merged = pd.concat(dfs, ignore_index=True)

    # Save merged
    filename = f"merged_{uuid.uuid4().hex}.csv"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    merged.to_csv(filepath, index=False)

    meta = _df_preview(merged)
    doc = {
        "user_id": str(current_user["_id"]),
        "name": f"Merged: {' + '.join(names)}",
        "filename": filename,
        "filepath": filepath,
        "original_name": filename,
        "is_merged": True,
        "source_ids": dataset_ids,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **meta,
    }
    result = await db.datasets.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc
