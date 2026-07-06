"""Report routes: generate PDF, list, download."""
import asyncio
from datetime import datetime, timezone

import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.analysis import run_eda, compute_health_score, get_cleaning_suggestions
from app.services.ai_service import generate_insights, generate_executive_summary
from app.services.pdf_service import generate_report

router = APIRouter()


class ReportRequest(BaseModel):
    dataset_id: str
    include_executive_summary: bool = True
    include_cleaning: bool = True
    include_insights: bool = True
    forecast_data: Optional[dict] = None


@router.post("/generate")
async def generate(body: ReportRequest, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])

    doc = await db.datasets.find_one({"_id": ObjectId(body.dataset_id), "user_id": uid})
    if not doc:
        raise HTTPException(404, "Dataset not found")

    df = pd.read_csv(doc["filepath"])
    eda = run_eda(df)
    health = compute_health_score(eda)
    cleaning = get_cleaning_suggestions(df, eda) if body.include_cleaning else []

    insights = {}
    executive_summary = None
    try:
        if body.include_insights:
            insights = await asyncio.wait_for(
                generate_insights(df, eda), timeout=45.0
            )
    except Exception:
        insights = {}   # proceed without AI insights

    try:
        if body.include_executive_summary:
            executive_summary = await asyncio.wait_for(
                generate_executive_summary(df, eda, insights), timeout=45.0
            )
    except Exception:
        executive_summary = None   # proceed without summary

    try:
        loop = asyncio.get_event_loop()
        filepath = await loop.run_in_executor(None, lambda: generate_report(
            dataset_name=doc["name"],
            eda=eda,
            health=health,
            insights=insights,
            executive_summary=executive_summary,
            cleaning_suggestions=cleaning,
            forecast_data=body.forecast_data,
        ))
    except Exception as e:
        raise HTTPException(500, f"Failed to generate report: {str(e)}")

    import os
    filename = os.path.basename(filepath)
    now = datetime.now(timezone.utc).isoformat()
    report_doc = {
        "user_id": uid,
        "dataset_id": body.dataset_id,
        "dataset_name": doc["name"],
        "filename": filename,
        "filepath": filepath,
        "created_at": now,
        "health_score": health.get("score"),
    }
    result = await db.reports.insert_one(report_doc)
    report_doc["id"] = str(result.inserted_id)
    report_doc.pop("_id", None)
    return report_doc


@router.get("/")
async def list_reports(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.reports.find({"user_id": str(current_user["_id"])}).sort("created_at", -1).limit(20)
    reports = []
    async for r in cursor:
        r["id"] = str(r.pop("_id"))
        reports.append(r)
    return reports


@router.get("/download/{report_id}")
async def download_report(report_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    report = await db.reports.find_one({
        "_id": ObjectId(report_id),
        "user_id": str(current_user["_id"]),
    })
    if not report:
        raise HTTPException(404, "Report not found")
    import os
    if not os.path.exists(report["filepath"]):
        raise HTTPException(404, "Report file not found")
    return FileResponse(
        report["filepath"],
        media_type="application/pdf",
        filename=report["filename"],
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    report = await db.reports.find_one({
        "_id": ObjectId(report_id),
        "user_id": str(current_user["_id"]),
    })
    if not report:
        raise HTTPException(404, "Report not found")
    import os
    if os.path.exists(report.get("filepath", "")):
        os.remove(report["filepath"])
    await db.reports.delete_one({"_id": ObjectId(report_id)})
    return {"message": "Report deleted"}
